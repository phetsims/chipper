// Copyright 2019, University of Colorado Boulder

/**
 * Lint detector for invalid code based on its tokenized parts.
 * This rule is currently hard coded for _.extend, but could be easily adapted for any code tokens. Currently this will only
 * flag items that are in requirejs files (signified with a "define(" and then a "require" arg (see regex below).
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

/* eslint-env node */
'use strict';

module.exports = context => {

  const badTextParts = [ '_', '.', 'extend' ];
  return {
    meta: {
      fixable: 'code'
    },
    Program: node => {
      const sourceCode = context.getSourceCode();
      const codeTokens = sourceCode.getTokens( node );

      for ( let i = 0; i < codeTokens.length; i++ ) {
        const token = codeTokens[ i ]; // {Token}
        const failedTokens = [];
        for ( let j = 0; j < badTextParts.length; j++ ) {
          const badTextToken = badTextParts[ j ];
          const combinedIndex = i + j;
          if ( combinedIndex < codeTokens.length && codeTokens[ combinedIndex ].value === badTextToken ) {
            failedTokens.push( codeTokens[ combinedIndex ] );
          }
          else {
            break;
          }
        }

        // if they are the same
        if ( failedTokens.map( token => token.value ).join( '' ) === badTextParts.join( '' ) && // if it matches
             /^define\(.*require/m.test( sourceCode.text ) ) { // proxy for requirejs
          context.report( {
            loc: token.loc.start,
            message: 'requirejs file contains _.extend, use merge instead',
            fix: fixer => {

              // This hard coded fixer is meant for replacing _.extend with merge, see https://github.com/phetsims/phet-core/issues/71
              return fixer.replaceTextRange( [ failedTokens[ 0 ].start, failedTokens[ failedTokens.length - 1 ].end ], 'merge' );
            }
          } );
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];