// Copyright 2025, University of Colorado Boulder

/**
 * A server designed to be spawned with fork() for fast modulification tasks.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { getModulifiedFileString } from './modulify.js';

export type ModulifyRequest = {
  type: 'modulifyRequest';
  id: number;
  file: string;
};

export type ErrorResponse = {
  type: 'error';
  id: number;
  message: string;
};

export type ModulifyResponse = {
  type: 'modulifyResponse';
  id: number;
} & ( {
  modulified: false;
} | {
  modulified: true;
  fileContents: string;
} );

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
      fileContents: content
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