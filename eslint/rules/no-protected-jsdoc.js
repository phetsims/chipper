// Copyright 2022, University of Colorado Boulder

/* eslint-disable no-protected-jsdoc */

/**
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 * "@protected" must be in its own rule so that mixin files can disable it for the whole file, see https://github.com/phetsims/chipper/issues/1237
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

module.exports = function( context ) {

  const getBadTextTester = require( './getBadTextTester' );

  return {
    Program: getBadTextTester( 'no-protected-jsdoc', [ '@protected' ], context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];