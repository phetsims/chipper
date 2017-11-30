// Copyright 2017, University of Colorado Boulder

/**
 * When running unit tests in an iframe, connects to the parent frame to give results.
 * @author Sam Reid (PhET Interactive Simulations)
 */
(function() {
  'use strict';

  QUnit.log( function( details ) {
    window.parent && window.parent.postMessage( JSON.stringify( {
      type: 'qunit-test',
      main: 'scenery',
      result: details.result,
      module: details.module,
      name: details.name,
      message: details.message,
      source: details.source // TODO: consider expected/actual, or don't worry because we'll run finer tests once it fails.
    } ), '*' );
  } );

  // TODO: convert to use on('runEnd'), see https://github.com/phetsims/aqua/issues/25
  QUnit.done( function( details ) {
    window.parent && window.parent.postMessage( JSON.stringify( {
      type: 'qunit-done',
      failed: details.failed,
      passed: details.passed,
      total: details.total
    } ), '*' );
  } );
})();