// Copyright 2019, University of Colorado Boulder

/*
 * Delayed simulation/runnable startup so that we can ensure we are in an environment suitable for the sim to start up.
 * See https://github.com/phetsims/chipper/issues/764 for more information.
 *
 * The require.js part is wrapped in a phet.chipper.runRequireJS() method.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */
( function() {
  'use strict';

  assert && assert( !!phet.chipper.runRequireJS, 'The require.js code should have run and defined this method' );

  // constants
  const svgns = 'http://www.w3.org/2000/svg';

  // Whether phet.chipper.runRequireJS has been called yet.
  let started = false;

  function isReady() {

    // NOTE: We do NOT care about window.innerWidth/innerHeight. We can start up with those equal to 0, as long as our
    // SVG bounds detection works. See https://github.com/phetsims/tasks/issues/1002.
    if ( !document.body ) {
      return false;
    }

    // Initialize the container and element, very similar in form to TextBounds.initializeTextBounds()

    const container = document.createElementNS( svgns, 'svg' );
    container.setAttribute( 'width', '2' );
    container.setAttribute( 'height', '2' );
    container.setAttribute( 'style', 'visibility: hidden; pointer-events: none; position: absolute; left: -65535px; right: -65535px;' );

    const element = document.createElementNS( svgns, 'text' );
    element.appendChild( document.createTextNode( '' ) );
    element.setAttribute( 'dominant-baseline', 'alphabetic' ); // to match Canvas right now
    element.setAttribute( 'text-rendering', 'geometricPrecision' );
    element.setAttributeNS( 'http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve' );
    container.appendChild( element );

    document.body.appendChild( container );

    // Equivalent setup to TextBounds.approximateSVGBounds
    element.setAttribute( 'direction', 'ltr' );
    element.setAttribute( 'font-family', 'Arial' );
    element.setAttribute( 'font-size', '16px' );
    element.setAttribute( 'font-style', 'normal' );
    element.setAttribute( 'font-weight', 'normal' );
    element.setAttribute( 'font-stretch', 'normal' );
    element.lastChild.nodeValue = 'm';

    // Extract the measurement, and see if we have zero bounds.
    const rect = element.getBBox();
    const result = rect.width !== 0 || rect.height !== 0;

    // Wait to remove the element until we've measured everything.
    document.body.removeChild( container );

    return result;
  }

  // We can call this anytime to attempt to start things (if they haven't been started already).
  function attemptStart() {
    if ( !started && isReady() ) {
      started = true;

      phet.chipper.runRequireJS();
    }
  }

  // Attempt to start based on timeouts (in case other methods don't work). This will call attemptStart() at least once.
  ( function timeoutListener() {
    attemptStart();

    if ( !started ) {
      setTimeout( timeoutListener, 1000 );
    }
  } )();

  if ( !started ) {

    // Attempt to start on window resizes
    window.addEventListener( 'resize', function resizeListener() {
      attemptStart();

      if ( started ) {
        window.removeEventListener( 'resize', resizeListener );
      }
    } );
  }
} )();
