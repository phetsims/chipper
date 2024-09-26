// Copyright 2019-2022, University of Colorado Boulder

/**
 * Lint detector for invalid text, where repo-specific text can be identified. We were unable to find a way to combine
 * this with phet/bad-sim-text, so we just left it separate. Only supports string literals (not predicates or regex).
 *
 *  @author Sam Reid (PhET Interactive Simulations)
 */
// Sample usage:
// "rules": {
//   "phet/additional-bad-text": [
//     "error",
//     {
//       "forbiddenTextObjects": [
//         "dispose"
//       ]
//     }
//   ]
// }

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Lint detector for invalid text.'
    },
    schema: [
      {
        type: 'object',
        properties: {
          forbiddenTextObjects: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      }
    ]
  },
  create: function( context ) {
    const getBadTextTester = require( './getBadTextTester' );
    const options = context.options[ 0 ];

    return {
      Program: getBadTextTester( 'bad-sim-text', options.forbiddenTextObjects, context )
    };
  }
};