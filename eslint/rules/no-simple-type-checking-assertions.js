// Copyright 2022, University of Colorado Boulder
 

/**
 * Do not allow basic assertions in typescript files where typescript typesc make that redundant. This rule applies in
 * cases like:
 *
 * assert && assert( typeof x === 'number', 'should be a number' );
 * assert && assert( x instanceof Node, 'why is this thing not a Node );
 *
 * In typescript, x should just have the correct type to begin with, instead of relying on runtime assertions.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

module.exports = function( context ) {

  const getBadTextTester = require( './getBadTextTester' );

  // see getBadTextTester for schema.
  const forbiddenTextObject = [
    {
      id: 'asserting values are instanceof or typeof in typescript is redundant',
      regex: /assert && assert\((( \w+ instanceof \w+)|( typeof \w+ === '\w+'))/
    }
  ];

  return {
    Program: getBadTextTester( 'bad-typescript-text', forbiddenTextObject, context )
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];