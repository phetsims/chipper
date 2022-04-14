// Copyright 2022, University of Colorado Boulder
/* eslint-disable bad-sim-text */

/**
 * Lint detector for invalid text, excpected only to be checked against typescript files.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

module.exports = function( context ) {

  const getBadTextTester = require( './getBadTextTester' );

  // see getBadTextTester for schema.
  const forbiddenTextObjects = [

    // Typescript handles this for us, please refrain from providing visibility annotations via jsdoc (unless you have
    // to, disabling this rule).
    '@public',
    '@private',
    '@protected'
  ];

  return {
    Program: getBadTextTester( forbiddenTextObjects, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];