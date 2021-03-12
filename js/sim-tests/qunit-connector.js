// Copyright 2020, University of Colorado Boulder

'use strict';

/**
 * When running unit tests in an iframe, connects to the parent frame to give results.
 * @author Sam Reid (PhET Interactive Simulations)
 */
( function() {

  // By default, QUnit runs tests when load event is triggered on the window. If you’re loading tests asynchronously,
  // you can set this property to false, then call QUnit.start() once everything is loaded.
  // See https://api.qunitjs.com/config/QUnit.config
  QUnit.config.autostart = false;

  QUnit.log( details => {
    ( window.parent !== window ) && window.parent.postMessage( JSON.stringify( {
      type: 'qunit-test',
      main: details.module, // TODO: what is this for? (https://github.com/phetsims/aqua/issues/81)
      result: details.result,
      module: details.module,
      name: details.name,
      message: details.message,

      // TODO: consider expected/actual, or don't worry because we'll run finer tests once it fails. (https://github.com/phetsims/aqua/issues/81)
      source: details.source
    } ), '*' );
  } );

  QUnit.on( 'runEnd', data => {
    ( window.parent !== window ) && window.parent.postMessage( JSON.stringify( {
      type: 'qunit-done',
      failed: data.testCounts.failed,
      passed: data.testCounts.passed,
      total: data.testCounts.total
    } ), '*' );
  } );
} )();