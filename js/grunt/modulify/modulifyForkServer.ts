// Copyright 2025-2026, University of Colorado Boulder

/**
 * A server designed to be spawned with fork() for fast modulification tasks (i.e. for launchpad).
 *
 * If forked similar to:
 *
 * const process = fork( path.resolve( __dirname, '../chipper/js/grunt/modulify/modulifyForkServer.ts' ), [], {
 *   stdio: [ 'inherit', 'inherit', 'inherit', 'ipc' ],
 *   execArgv: process.execArgv.length ? process.execArgv : [ '-r', 'tsx' ]
 * } );
 *
 * Then process.send( ModulifyRequest ) can send modulify requests, listend to for process.on( 'message', ... )
 * which can receive the responses.
 *
 * It will in-memory modulify a single file, or essentially no-op if it doesn't need modulification.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import { getModulifiedFileString } from './modulify.js';
import gitRevParse from '../../../../perennial-alias/js/common/gitRevParse.js';

// Request type, for process.send()
export type ModulifyRequest = {
  type: 'modulifyRequest';
  id: number;
  file: string;
};

// Result type for errors
export type ErrorResponse = {
  type: 'error';
  id: number;
  message: string;
};

// Result type for successful modulification (needing modulification or not)
export type ModulifyResponse = {
  type: 'modulifyResponse';
  id: number;
} & ( {
  modulified: false;
} | {
  modulified: true;
  fileContents: string;
  chipperSHA: string;
  perennialSHA: string;
  usedRelativeFiles: string[];
} );

const chipperSHAPromise: Promise<string> = gitRevParse( 'chipper', 'HEAD' );
const perennialSHAPromise: Promise<string> = gitRevParse( 'perennial-alias', 'HEAD' );

console.log( 'Started modulifyForkServer' );

process.on( 'message', async ( request: ModulifyRequest ) => {
  const send = <T>( message: T ): void => {
    ( process.send as ( message: T ) => void )( message );
  };

  try {
    const content = await getModulifiedFileString( request.file );

    const response: ModulifyResponse = content ? {
      type: 'modulifyResponse' as const,
      id: request.id,
      modulified: true,
      fileContents: content.content,
      chipperSHA: await chipperSHAPromise,
      perennialSHA: await perennialSHAPromise,
      usedRelativeFiles: content.usedRelativeFiles
    } : {
      type: 'modulifyResponse' as const,
      id: request.id,
      modulified: false
    };

    send( response );
  }
  catch( e: unknown ) {
    const response: ErrorResponse = {
      type: 'error' as const,
      id: request.id,
      message: String( ( e as { message?: string } )?.message ?? e )
    };

    send( response );
  }
} );

// exit quickly if parent dies
process.on( 'disconnect', () => process.exit( 0 ) );