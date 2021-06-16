[object Promise]

import Tandem from '../../../tandem/js/Tandem.js';

/**
 * Start Qunit while supporting PhET-iO brand
 */
const qunitStart = () => {

  const start = () => {

    // Uncomment for a debugger whenever a test fails
    if ( _.hasIn( window, 'phet.chipper.queryParameters' ) && phet.chipper.queryParameters.debugger ) {
      QUnit.log( context => { if ( !context.result ) { debugger; }} ); // eslint-disable-line no-debugger
    }

    if ( Tandem.PHET_IO_ENABLED ) {
      import( /* webpackMode: "eager" */ '../../../phet-io/js/phetioEngine.js' ).then( () => {

        // no API validation in unit tests
        phet.tandem.phetioAPIValidation.enabled = false;
        phet.phetio.phetioEngine.flushPhetioObjectBuffer();
        QUnit.start();
      } );
    }
    else {
      QUnit.start();
    }
  };

  // When running in the puppeteer harness, we need the opportunity to wire up listeners before QUnit begins.
  if ( QueryStringMachine.containsKey( 'qunitHooks' ) ) {
    window.qunitLaunchAfterHooks = start;
  }
  else {
    start();
  }
};

export default qunitStart;