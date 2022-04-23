// Copyright 2022, University of Colorado Boulder
/* eslint-disable bad-typescript-text */

/**
 * Lint detector for invalid text, expected only to be checked against typescript files.
 * Lint is disabled for this file so the bad texts aren't themselves flagged.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

module.exports = function( context ) {

  const getBadTextTester = require( './getBadTextTester' );

  // see getBadTextTester for schema.
  const forbiddenTextObjects = [

    // Don't lie to yourself.
    'JavaScript is much, much better than TypeScript.',

    // Typescript handles this for us, please refrain from providing visibility annotations via jsdoc (unless you have
    // to, disabling this rule).
    '@public',

    'const simOptions = {'
    // '@private',
    // //
    // {
    //   id: '@returns with type and/or without extra doc',
    //   regex: /(@returns \{)|(@returns$)/
    // },
    //
    // {
    //   id: 'asserting values are instanceof or typeof in typescript (booo)',
    //   regex: /(assert\(.*instanceof)|(assert\(.*typeof)/
    // }
  ];

  return {
    Program: getBadTextTester( forbiddenTextObjects, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];