// Copyright 2018-2019, University of Colorado Boulder

/**
 * Reports a (delayed) page load (or error) to the parent frame for Aqua continuous testing.
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

( function() {

  let hasErrored = false;

  window.addEventListener( 'error', function( data ) {
    if ( !hasErrored ) {
      hasErrored = true;

      let message = '';
      let stack = '';
      if ( data && data.message ) {
        message = data.message;
      }
      if ( data && data.error && data.error.stack ) {
        stack = data.error.stack;
      }
      ( window.parent !== window ) && window.parent.postMessage( JSON.stringify( {
        type: 'pageload-error',
        url: window.location.href,
        message: message,
        stack: stack
      } ), '*' );
      console.log( 'error' );
    }
  } );

  window.addEventListener( 'load', function( event ) {
    // Wait 4 seconds before reporting load, to see if it errors first
    setTimeout( function() {
      if ( !hasErrored ) {
        ( window.parent !== window ) && window.parent.postMessage( JSON.stringify( {
          type: 'pageload-load',
          url: window.location.href
        } ), '*' );

        console.log( 'load' );
      }
    }, 4000 );
  }, false );
} )();
