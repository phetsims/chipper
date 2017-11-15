// Copyright 2015, University of Colorado Boulder

/**
 * Runs a sleep command with es6 as a basic es6 script.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

module.exports = function( grunt ) {
  let gruntDone = grunt.task.current.async();

  function sleep( ms ) {
    return new Promise( resolve => setTimeout( resolve, ms ) );
  }

  async function demo() {
    console.log( 'Taking a break...' );
    await sleep( 2000 );
    console.log( 'Two second later' );
    gruntDone();
  }

  demo();
};