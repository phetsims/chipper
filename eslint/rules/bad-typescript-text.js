// Copyright 2022, University of Colorado Boulder
 

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
    '@protected',
    '@private',

    'options = merge',

    // To convert javascript files to typescript, you do not need to include a nocheck directive, just commit locally
    // before converting to preserve history, see https://github.com/phetsims/sun/issues/732#issuecomment-995330513
    '@ts-nocheck',

    // combineOptions should always specify the type parameter like combineOptions<...>.
    'combineOptions(',

    // The type parameters should be inferred rather than specified
    '.multilink<',
    '.lazyMultilink<',
    'new DerivedProperty<',

    'const simOptions = {',

    // Typescript files should not use jsdoc for parameters
    '@param {',

    // Don't export SelfOptions, https://github.com/phetsims/chipper/issues/1263
    'export type SelfOptions',

    {
      id: '@returns with type and/or without extra doc',
      regex: /(@returns \{)|(@returns *$)/
    }
  ];

  return {
    Program: getBadTextTester( 'bad-typescript-text', forbiddenTextObjects, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];