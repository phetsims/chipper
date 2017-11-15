// Copyright 2015, University of Colorado Boulder

/**
 * Runs a sleep command with es6 as a basic es6 script.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

module.exports = function( grunt ) {
  let gruntDone = grunt.task.current.async(); // let: es6

  function sleep( ms ) {
    return new Promise( resolve => setTimeout( resolve, ms ) ); // Promise: es6
  }

  async function demo() { // async: es8
    console.log( 'Taking a break...' );
    await sleep( 25 ** 2.3 ); // exponent: es7
    console.log( 25 ** 2.3, 'milliseconds later' );
    gruntDone();
  }

  demo();
};