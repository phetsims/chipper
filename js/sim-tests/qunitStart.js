// Copyright 2020, University of Colorado Boulder

import Tandem from '../../../tandem/js/Tandem.js';

/**
 * Start Qunit while supporting PhET-iO brand
 */
const qunitStart = () => {

  const start = () => {

    // Uncomment for a debugger whenever a test fails
    // QUnit.log( context => { if ( !context.result ) { debugger; }} );

    if ( Tandem.PHET_IO_ENABLED ) {
      import( /* webpackMode: "eager" */ '../../../phet-io/js/phetioEngine.js').then( () => {

        // no api validation in unit tests
        phet.tandem.phetioAPIValidation.enabled = false;
        Tandem.launch();
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