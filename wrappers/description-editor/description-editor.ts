// Copyright 2026, University of Colorado Boulder

/**
 * Description Editor dev server: the persistence service behind the Description Editor wrapper
 * (chipper/wrappers/description-editor). It loads a sim's {repo}-strings_en.yaml, serves each a11y Fluent message's
 * default-variant rendering as provenance-tagged segments, and back-propagates in-place edits of those rendered
 * sentences into the YAML, which remains the single source of truth.
 *
 * Run from the monorepo root:
 *   bash perennial-alias/bin/sage run chipper/wrappers/description-editor/description-editor.ts --repo=quantum-wave-interference
 *
 * Options:
 *   --repo=...   (required) sim repo whose {repo}-strings_en.yaml is loaded and edited
 *   --port=...   (default 4621)
 *   --selfCheck  build once, print self-check results, and exit with a nonzero code on failure (for CI)
 *
 * The server holds no state that is not derived from the YAML on disk; external edits (e.g. from WebStorm) are picked
 * up by polling and pushed to connected editors over server-sent events. After every YAML change it regenerates
 * {repo}-strings_en.json (which unbuilt sims load directly, so edits survive a standalone relaunch) and exposes the
 * flat string values over GET /api/strings so the wrapper can live-inject changed values into a running sim without
 * reloading it. API responses send CORS headers because the wrapper is served from the chipper dev server on a
 * different port.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import fs from 'fs';
import http from 'http';
import path from 'path';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import ChipperStringUtils from '../../js/common/ChipperStringUtils.js';
import convertHoistedSelects from '../../js/grunt/modulify/convertHoistedSelects.js';
import { nestJSONStringValues, safeLoadYaml } from '../../js/grunt/modulify/convertStringsYamlToJson.js';
import { buildDescriptionDocument, DescriptionDocument, DescriptionMessage, messageText } from './buildDescriptionDocument.js';
import { applyStaticEdit } from './editYaml.js';

const TOOL_DIR = __dirname;
const ROOT_DIR = path.resolve( TOOL_DIR, '../../..' );

// ---------------------------------------------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------------------------------------------

const args = process.argv.slice( 2 );
const getArg = ( name: string ): string | null => {
  const prefix = `--${name}=`;
  const found = args.find( arg => arg.startsWith( prefix ) );
  return found ? found.substring( prefix.length ) : null;
};

const repo = getArg( 'repo' );
const port = Number( getArg( 'port' ) || 4621 );
const selfCheckOnly = args.includes( '--selfCheck' );

if ( !repo ) {
  console.error( 'Usage: sage run chipper/wrappers/description-editor/description-editor.ts --repo=<sim> [--port=4621] [--selfCheck]' );
  process.exit( 1 );
}

const yamlPath = path.join( ROOT_DIR, repo, `${repo}-strings_en.yaml` );
if ( !fs.existsSync( yamlPath ) ) {
  console.error( `Strings YAML not found: ${yamlPath}` );
  process.exit( 1 );
}

// ---------------------------------------------------------------------------------------------------------------
// Document state and rebuild loop
// ---------------------------------------------------------------------------------------------------------------

type ServerState = {
  document: DescriptionDocument | null;
  buildError: string | null;
  messagesByDotKey: Map<string, DescriptionMessage>;
  previousMessageTexts: Map<string, string>;
  changedKeys: string[];

  // Flat dotKey → runtime string value map (every string leaf, not just a11y), matching the leaf "value" entries of
  // {repo}-strings_en.json — i.e. the values the sim's LocalizedStringProperties hold in unbuilt mode.
  flatStrings: Record<string, string>;

  // Dot keys whose flat string value changed in the most recent rebuild, for targeted live injection into a running sim
  changedStringKeys: string[];
};

const state: ServerState = {
  document: null,
  buildError: null,
  messagesByDotKey: new Map(),
  previousMessageTexts: new Map(),
  changedKeys: [],
  flatStrings: {},
  changedStringKeys: []
};

const sseClients = new Set<http.ServerResponse>();

const broadcast = ( eventName: string, data: object ): void => {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify( data )}\n\n`;
  for ( const client of sseClients ) {
    client.write( payload );
  }
};

/**
 * Recursively flattens the unhoisted YAML structure into a dotKey → string value map, mirroring the leaf filtering
 * and reference canonicalization of nestJSONStringValues so the values match {repo}-strings_en.json exactly.
 */
const flattenStringLeaves = ( node: IntentionalAny, pathArr: string[], result: Record<string, string> ): void => {
  if ( typeof node === 'string' ) {
    result[ pathArr.join( '.' ) ] = ChipperStringUtils.replaceFluentReferences( node );
  }
  else if ( node !== null && typeof node === 'object' && !Array.isArray( node ) ) {
    for ( const key of Object.keys( node ) ) {
      if ( key.endsWith( '__simMetadata' ) || key.endsWith( '__deprecated' ) || key.endsWith( '__comment' ) ) {
        continue;
      }
      flattenStringLeaves( node[ key ], [ ...pathArr, key ], result );
    }
  }
};

/**
 * Regenerates {repo}-strings_en.json from the YAML text, mirroring modulify's convertStringsYamlToJson output so the
 * file is byte-identical to what `grunt modulify --targets=strings` would write. In unbuilt mode the sim loads this
 * JSON directly (see chipper/js/browser/load-unbuilt-strings.js), so writing it is what makes editor edits visible to
 * a sim relaunched outside the editor. The file is only written when its content actually changed.
 *
 * @param yamlText - raw contents of {repo}-strings_en.yaml
 * @param write - whether to write the JSON file (skipped in --selfCheck mode, which must not touch the working copy)
 * @returns the flat dotKey → value map for the live-update API
 */
const regenerateStringsJson = ( yamlText: string, write: boolean ): Record<string, string> => {
  const unhoisted = convertHoistedSelects( safeLoadYaml( yamlText ) );

  if ( write ) {
    const nested = nestJSONStringValues( unhoisted );
    const jsonContents = JSON.stringify( nested, null, 2 )
      .split( '"phetioReadOnly": "true"' ).join( '"phetioReadOnly": true' );

    const jsonPath = path.join( ROOT_DIR, repo, `${repo}-strings_en.json` );
    const previousContents = fs.existsSync( jsonPath ) ? fs.readFileSync( jsonPath, 'utf8' ) : null;
    if ( previousContents !== jsonContents ) {
      fs.writeFileSync( jsonPath, jsonContents );
    }
  }

  const flatStrings: Record<string, string> = {};
  flattenStringLeaves( unhoisted, [], flatStrings );
  return flatStrings;
};

/**
 * Rebuilds the document model from the YAML on disk, computing which messages' rendered output changed since the
 * previous build so the editor can highlight them. Also regenerates {repo}-strings_en.json and computes which flat
 * string values changed, so connected editors can inject just those values into a running sim.
 */
const rebuild = (): void => {
  const yamlText = fs.readFileSync( yamlPath, 'utf8' );

  try {
    const document = buildDescriptionDocument( repo, yamlText );
    const flatStrings = regenerateStringsJson( yamlText, !selfCheckOnly );

    const messagesByDotKey = new Map<string, DescriptionMessage>();
    const messageTexts = new Map<string, string>();
    for ( const message of document.messages ) {
      messagesByDotKey.set( message.dotKey, message );
      messageTexts.set( message.dotKey, messageText( message ) );
    }

    const changedKeys: string[] = [];
    if ( state.previousMessageTexts.size > 0 ) {
      for ( const [ dotKey, text ] of messageTexts ) {
        if ( state.previousMessageTexts.get( dotKey ) !== text ) {
          changedKeys.push( dotKey );
        }
      }
      for ( const dotKey of state.previousMessageTexts.keys() ) {
        if ( !messageTexts.has( dotKey ) ) {
          changedKeys.push( dotKey );
        }
      }
    }

    // Diff the flat string values against the previous build so editors can live-inject only what changed. The first
    // build reports no changes, matching the message-text diff above.
    const changedStringKeys: string[] = [];
    if ( Object.keys( state.flatStrings ).length > 0 ) {
      for ( const [ dotKey, value ] of Object.entries( flatStrings ) ) {
        if ( state.flatStrings[ dotKey ] !== value ) {
          changedStringKeys.push( dotKey );
        }
      }
    }

    state.document = document;
    state.buildError = null;
    state.messagesByDotKey = messagesByDotKey;
    state.previousMessageTexts = messageTexts;
    state.changedKeys = changedKeys;
    state.flatStrings = flatStrings;
    state.changedStringKeys = changedStringKeys;
  }
  catch( error ) {
    state.buildError = error instanceof Error ? error.message : String( error );
    state.changedKeys = [];
    state.changedStringKeys = [];
  }
};

/**
 * Writes new YAML to disk and rebuilds immediately (without waiting for the file poll), then notifies clients.
 */
const writeYamlAndRebuild = ( yamlText: string ): void => {
  fs.writeFileSync( yamlPath, yamlText );
  rebuild();
  broadcast( 'update', { changedKeys: state.changedKeys, changedStringKeys: state.changedStringKeys } );
};

rebuild();

if ( selfCheckOnly ) {
  const errors = state.buildError ? [ state.buildError ] :
                 [ ...state.document!.warnings, ...state.document!.selfCheckErrors ];
  const messageCount = state.document ? state.document.messages.length : 0;
  console.log( `${repo}: ${messageCount} messages` );
  errors.forEach( error => console.error( error ) );
  process.exit( errors.length > 0 ? 1 : 0 );
}

// Poll for external edits (IDE, git operations). fs.watchFile is reliable across platforms for a single file.
fs.watchFile( yamlPath, { interval: 400 }, () => {
  rebuild();
  broadcast( 'update', { changedKeys: state.changedKeys, changedStringKeys: state.changedStringKeys } );
} );

// ---------------------------------------------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------------------------------------------

const readJsonBody = ( request: http.IncomingMessage ): Promise<Record<string, unknown>> => {
  return new Promise( ( resolve, reject ) => {
    let body = '';
    request.on( 'data', chunk => { body += chunk; } );
    request.on( 'end', () => {
      try {
        resolve( JSON.parse( body ) );
      }
      catch( error ) {
        reject( error );
      }
    } );
    request.on( 'error', reject );
  } );
};

const sendJson = ( response: http.ServerResponse, status: number, data: object ): void => {
  response.writeHead( status, { 'Content-Type': 'application/json' } );
  response.end( JSON.stringify( data ) );
};

const server = http.createServer( async ( request, response ) => {
  const requestUrl = new URL( request.url || '/', `http://localhost:${port}` );
  const pathname = requestUrl.pathname;

  // The Description Editor wrapper (chipper/wrappers/description-editor) is served by the chipper dev server on a
  // different port, so all API responses must allow cross-origin access.
  response.setHeader( 'Access-Control-Allow-Origin', '*' );

  if ( request.method === 'OPTIONS' ) {
    response.writeHead( 204, {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    } );
    response.end();
    return;
  }

  try {
    if ( request.method === 'GET' && pathname === '/api/document' ) {
      sendJson( response, 200, {
        document: state.document,
        buildError: state.buildError,
        changedKeys: state.changedKeys
      } );
    }
    else if ( request.method === 'GET' && pathname === '/api/strings' ) {
      sendJson( response, 200, {
        strings: state.flatStrings,
        changedKeys: state.changedStringKeys
      } );
    }
    else if ( request.method === 'GET' && pathname === '/api/events' ) {
      response.writeHead( 200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      } );
      response.write( ': connected\n\n' );
      sseClients.add( response );
      request.on( 'close', () => sseClients.delete( response ) );
    }
    else if ( request.method === 'POST' && pathname === '/api/edit' ) {
      const body = await readJsonBody( request );
      const message = state.messagesByDotKey.get( String( body.dotKey ) );
      if ( !message ) {
        sendJson( response, 404, { error: `Unknown message: ${body.dotKey}` } );
        return;
      }

      const yamlText = fs.readFileSync( yamlPath, 'utf8' );
      const valueOffset = typeof body.valueOffset === 'number' ? body.valueOffset : undefined;
      const result = applyStaticEdit( yamlText, message, String( body.oldText ), String( body.newText ), valueOffset );
      if ( 'error' in result ) {
        sendJson( response, 422, { error: result.error } );
      }
      else {
        writeYamlAndRebuild( result.yamlText );
        sendJson( response, 200, { ok: true, line: result.line } );
      }
    }
    else {
      sendJson( response, 404, { error: `Not found: ${pathname}` } );
    }
  }
  catch( error ) {
    sendJson( response, 500, { error: error instanceof Error ? error.message : String( error ) } );
  }
} );

server.listen( port, () => {
  console.log( `Description Editor server for ${repo} on port ${port}` );
  console.log( `  open chipper/wrappers/description-editor/?sim=${repo}&descriptionEditor` );
  console.log( `  watching ${path.relative( ROOT_DIR, yamlPath )}` );
} );
