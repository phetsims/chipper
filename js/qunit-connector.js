// Copyright 2017, University of Colorado Boulder

/**
 * When running unit tests in an iframe, connects to the parent frame to give results.
 * @author Sam Reid (PhET Interactive Simulations)
 */
( function() {
  'use strict';

  // By default, QUnit runs tests when load event is triggered on the window. If you’re loading tests asynchronously,
  // you can set this property to false, then call QUnit.start() once everything is loaded.
  // See https://api.qunitjs.com/config/QUnit.config
  QUnit.config.autostart = false;

  QUnit.log( function( details ) {
    ( window.parent !== window.top ) && window.parent.postMessage( JSON.stringify( {
      type: 'qunit-test',
      main: details.module, // TODO: what is this for?
      result: details.result,
      module: details.module,
      name: details.name,
      message: details.message,
      source: details.source // TODO: consider expected/actual, or don't worry because we'll run finer tests once it fails.
    } ), '*' );
  } );

  QUnit.on( 'runEnd', function( data ) {
    ( window.parent !== window.top ) && window.parent.postMessage( JSON.stringify( {
      type: 'qunit-done',
      failed: data.testCounts.failed,
      passed: data.testCounts.passed,
      total: data.testCounts.total
    } ), '*' );
  } );
} )();