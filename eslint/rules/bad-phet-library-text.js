// Copyright 2023, University of Colorado Boulder


/**
 * Lint detector for invalid text.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * This file is meant for prohibiting hard dependencies on sim-specific implementations on our common and phet-library
 * code. This is in an effort to allow PhET's more fundamental code repositories to be used in outside, non-phet cases.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

module.exports = function( context ) {

  const getBadTextTester = require( './getBadTextTester' );

  // see getBadTextTester for schema.
  const forbiddenTextObjects = [

    // accessing the sim as a global, like `phet.joist.sim` is a classic example of a hard dependency that can be a
    // ticking time bomb for common code that isn't normally run outside phetsims (but could and may want to in the
    // future). See https://github.com/phetsims/chipper/issues/1004
    { id: 'phet.joist', codeTokens: [ 'phet', '.', 'joist' ] }
  ];

  return {
    Program: getBadTextTester( 'bad-phet-library-text', forbiddenTextObjects, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];