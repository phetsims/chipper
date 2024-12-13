// Copyright 2020-2024, University of Colorado Boulder

/**
 * Start Qunit while all runtime modalities (debugging/headless puppeteer).
 * To be used in cases where you should not depend on PhET-iO repos (via phetioEngine).
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// PRIVATE!! - Don't import this, it is just to be used by qunitStart()
export const qunitStartImplementation = ready => {

  const start = () => {

    // Uncomment for a debugger whenever a test fails
    if ( _.hasIn( window, 'phet.chipper.queryParameters' ) && phet.chipper.queryParameters.debugger ) {
      QUnit.log( context => { if ( !context.result ) { debugger; }} ); // eslint-disable-line no-debugger
    }

    ready();
  };

  // When running in the puppeteer harness, we need the opportunity to wire up listeners before QUnit begins.
  if ( QueryStringMachine.containsKey( 'qunitHooks' ) ) {
    window.qunitLaunchAfterHooks = start;
  }
  else {
    start();
  }
};

const qunitStartWithoutPhetio = () => qunitStartImplementation( () => QUnit.start() );

export default qunitStartWithoutPhetio;