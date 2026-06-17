// Copyright 2026, University of Colorado Boulder

/**
 * Loads a sim's strings YAML and produces the Description Editor message model: every a11y leaf string with its
 * Fluent ID, FTL-ready value, and YAML line range for provenance. Mirrors the YAML→FTL conversion performed by
 * `grunt modulify --targets=strings` (see chipper/js/grunt/modulify/generateFluentTypes.ts) so the editor renders
 * exactly what the sim will render.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import FluentLibrary from '../../js/browser-and-node/FluentLibrary.js';
import ChipperStringUtils from '../../js/common/ChipperStringUtils.js';
import convertHoistedSelects from '../../js/grunt/modulify/convertHoistedSelects.js';
import { safeLoadYaml } from '../../js/grunt/modulify/convertStringsYamlToJson.js';

export type YamlMessage = {

  // YAML key path, e.g. [ 'a11y', 'singleParticlesState', 'sourcePacket' ]
  keyPath: string[];

  // Dot-joined key path, e.g. 'a11y.singleParticlesState.sourcePacket'
  dotKey: string;

  // Fluent message ID, e.g. 'a11y_singleParticlesState_sourcePacket'
  fluentId: string;

  // Leaf value after dotted message references are canonicalized to underscores (FTL-ready, before multiline indent)
  value: string;

  // 0-based inclusive line range of the key and its scalar block in the YAML text. May be a best-effort prefix
  // location for leaves synthesized by hoisted selects.
  yamlLineStart: number;
  yamlLineEnd: number;
};

export type YamlMessageModel = {
  messages: YamlMessage[];
  ftlContent: string;

  // Non-fatal problems encountered while loading (e.g. Fluent verification failures)
  warnings: string[];
};

/**
 * Builds a map from dot-joined YAML key paths to their 0-based line ranges by scanning the raw YAML text with an
 * indentation-aware pass. PhET strings YAML is machine-formatted (spaces only, one key per line), which makes this
 * reliable without a position-tracking parser.
 *
 * @param yamlText - raw YAML file contents
 * @returns map from dot-joined key path to inclusive line range
 */
export function buildYamlLineMap( yamlText: string ): Map<string, { start: number; end: number }> {
  const lines = yamlText.split( '\n' );
  const map = new Map<string, { start: number; end: number }>();

  // Stack of open keys: their indent levels and names
  const stack: { indent: number; key: string; start: number }[] = [];

  const closeDeeperThan = ( indent: number, endLine: number ): void => {
    while ( stack.length > 0 && stack[ stack.length - 1 ].indent >= indent ) {
      const popped = stack.pop()!;
      const path = [ ...stack.map( entry => entry.key ), popped.key ].join( '.' );
      map.set( path, { start: popped.start, end: endLine } );
    }
  };

  for ( let i = 0; i < lines.length; i++ ) {
    const line = lines[ i ];
    const trimmed = line.trim();
    if ( trimmed.length === 0 || trimmed.startsWith( '#' ) ) {
      continue;
    }

    // Match "key:" lines. Keys may contain dots/dashes (e.g. quantum-wave-interference.title) but not spaces or
    // braces, which excludes Fluent select lines inside block scalars (those are more-indented anyway, but block
    // scalar content can contain colons, so the key pattern must be conservative).
    const match = /^( *)([A-Za-z0-9_.$\-']+):(?:\s|$)/.exec( line );
    if ( !match ) {
      continue;
    }

    const indent = match[ 1 ].length;

    // Lines inside a block scalar are more indented than the scalar's key but can resemble key lines; they are
    // excluded because a block scalar key (deepest open key) has no children — detect by checking whether the
    // previous deepest key's line ended with a block scalar indicator. Simpler robust rule for PhET YAML: a key
    // line's indent must be <= deepest open indent + 2 (children are exactly one 2-space level deeper). Block
    // scalar bodies are indented far deeper than key+2 in PhET strings files.
    const deepest = stack.length > 0 ? stack[ stack.length - 1 ].indent : -2;
    if ( indent > deepest + 2 ) {
      continue;
    }

    closeDeeperThan( indent, i - 1 );
    stack.push( { indent: indent, key: match[ 2 ].replace( /'/g, '' ), start: i } );
  }
  closeDeeperThan( 0, lines.length - 1 );

  // Trim trailing blank/comment lines from each range so ranges end at content
  for ( const [ , range ] of map ) {
    while ( range.end > range.start ) {
      const text = lines[ range.end ].trim();
      if ( text.length === 0 || text.startsWith( '#' ) ) {
        range.end--;
      }
      else {
        break;
      }
    }
  }

  return map;
}

/**
 * Recursively collects a11y leaf strings from the parsed (and hoist-converted) YAML object, skipping metadata keys.
 */
function collectA11yLeaves( obj: Record<string, IntentionalAny>, pathArr: string[], leaves: { pathArr: string[]; value: string }[] ): void {
  for ( const [ key, value ] of Object.entries( obj ) ) {
    if ( key.endsWith( '__simMetadata' ) || key.endsWith( '__deprecated' ) || key.endsWith( '__comment' ) ) {
      continue;
    }

    if ( value !== null && typeof value === 'object' && !Array.isArray( value ) ) {
      collectA11yLeaves( value, [ ...pathArr, key ], leaves );
    }
    else if ( typeof value === 'string' ) {
      leaves.push( { pathArr: [ ...pathArr, key ], value: value } );
    }
  }
}

/**
 * Loads the Description Editor message model from raw YAML text. Only a11y strings are included (matching modulify,
 * only those are routed through Fluent), and legacy `{{pattern}}` strings are excluded.
 *
 * @param yamlText - raw contents of {repo}-strings_en.yaml
 * @returns the message model with FTL content and provenance line ranges
 */
export function loadYamlMessages( yamlText: string ): YamlMessageModel {
  const warnings: string[] = [];
  const parsed = convertHoistedSelects( safeLoadYaml( yamlText ) ) as Record<string, IntentionalAny>;

  const a11y = parsed.a11y;
  const rawLeaves: { pathArr: string[]; value: string }[] = [];
  if ( a11y && typeof a11y === 'object' ) {
    collectA11yLeaves( a11y, [ 'a11y' ], rawLeaves );
  }

  const lineMap = buildYamlLineMap( yamlText );

  const messages: YamlMessage[] = [];
  for ( const leaf of rawLeaves ) {
    if ( ChipperStringUtils.isLegacyStringPattern( leaf.value ) ) {
      continue;
    }

    const dotKey = leaf.pathArr.join( '.' );

    // Locate the YAML lines: exact path when possible, else the longest locatable prefix (hoisted-select leaves
    // have synthesized paths that do not appear verbatim in the raw YAML).
    let range = lineMap.get( dotKey ) || null;
    for ( let prefixLength = leaf.pathArr.length - 1; !range && prefixLength > 0; prefixLength-- ) {
      range = lineMap.get( leaf.pathArr.slice( 0, prefixLength ).join( '.' ) ) || null;
    }

    messages.push( {
      keyPath: leaf.pathArr,
      dotKey: dotKey,
      fluentId: ChipperStringUtils.createFluentKey( dotKey ),
      value: ChipperStringUtils.replaceFluentReferences( leaf.value ),
      yamlLineStart: range ? range.start : 0,
      yamlLineEnd: range ? range.end : 0
    } );
  }

  const ftlContent = messages
    .map( message => `${message.fluentId} = ${FluentLibrary.formatMultilineForFtl( message.value )}` )
    .join( '\n' );

  try {
    FluentLibrary.verifyFluentFile( ftlContent );
  }
  catch( error ) {
    warnings.push( `Fluent verification: ${error instanceof Error ? error.message : String( error )}` );
  }

  return {
    messages: messages,
    ftlContent: ftlContent,
    warnings: warnings
  };
}
