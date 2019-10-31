// Copyright 2019, University of Colorado Boulder
/* eslint-disable */

/**
 * Bad text testing function for testing bad text in the project. Supports bad text as string ForbiddenTextObject.
 * ForbiddenTextObject's schema was designed to support getting accurate line numbers from bad text in comments and
 * in code. To support code, use `codeTokens` to specify how the bad text will be tokenized into Esprima nodes.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

const assert = require( 'assert' );

/**
 * @param {Array.<string|ForbiddenTextObject>} badTexts - if a string, will be converted into a ForbiddenTextObject
 * @param {Object} context - eslinting context given from the engine
 * @returns {function(node:Object)} - function that reports any bad text lint errors to the context
 */
module.exports = ( badTexts, context ) => {
  'use strict';

  return node => {
    const sourceCode = context.getSourceCode();
    const codeTokens = sourceCode.getTokens( node );
    const commentTokens = sourceCode.getAllComments();
    const text = sourceCode.text;

    // test an array of code tokens
    const testCodeTokens = forbiddenTextObject => {
      const codeTokensArray = forbiddenTextObject.codeTokens;

      // iterate through each code token in the node
      for ( let i = 0; i < codeTokens.length; i++ ) {
        const token = codeTokens[ i ]; // {Token}
        const failures = []; // a list of the tokens that match the forbidden code tokens,

        // loop through, looking ahead at each subsequent code token, breaking if they don't match the  forbidden tokens
        for ( let j = 0; j < codeTokensArray.length; j++ ) {
          const forbiddenCodePart = codeTokensArray[ j ];
          const combinedIndex = i + j;

          const tokenValue = codeTokens[ combinedIndex ].value;

          // multiple code tokens must match perfectly to conglomerate
          if ( ( combinedIndex < codeTokens.length && tokenValue === forbiddenCodePart ) ||

               // if there is only one, then check as a substring too
               ( codeTokensArray.length === 1 && tokenValue.indexOf( forbiddenCodePart ) >= 0 ) ) {

            // if at the end of the sequence, then we have successfully found bad code text, add it to a list of failures.
            if ( j === codeTokensArray.length - 1 ) {
              failures.push( forbiddenTextObject );
            }
          }
          else {
            break; // quit early because it was a non-match
          }
        }

        failures.forEach( failedTextObject => {
          context.report( {
            loc: token.loc.start,
            message: `bad code text: "${failedTextObject.name}"`,
          } );
        } );
      }
    };
    /**
     *
     * @param {ForbiddenTextObject} forbiddenText
     */
    const testBadText = forbiddenText => {

      // no need to iterate through tokens if it isn't anywhere in the source code
      if ( text.indexOf( forbiddenText.name ) >= 0 ) {

        // search through the tokenized code for the forbidden code tokens, like [ 'Math', '.', 'round' ],
        testCodeTokens( forbiddenText );

        // look through comments
        !forbiddenText.codeOnly && commentTokens.forEach( token => {
          if ( token.value.indexOf( forbiddenText.name ) >= 0 ) {
            context.report( {
              loc: token.loc.start,
              message: `bad comment text: "${forbiddenText.name}"`,
            } );
          }
        } );

        // TODO: support REGEX
        // if ( forbiddenText.regex instanceof RegExp && forbiddenText.regex.test( token.value ) ) {
        //   failedText = forbiddenText.name;
        // }
      }
    };

    badTexts.forEach( badText => {
      if ( typeof badText === 'string' ) {
        badText = { name: badText, codeTokens: [ badText ] }
      }
      assert( typeof badText.name === 'string', 'name required' );
      assert( Array.isArray( badText.codeTokens ), 'code tokens expected' );
      testBadText( badText );
    } );
  };

  /**
   * @typedef {Object} ForbiddenTextObject
   * @property {string} name - the "string-form" name of the bad text. should occur in the source code. Also what is
   *                            displayed on error. Used when checking for bad text in comments.
   * @property {Array.<string>} codeTokens - a list of the tokenized, ordered code sections that make up the bad text
   *                                          within the javascript code (not used for checking comments)
   * @property {boolean} codeOnly - if true, this object will not be checked for in comments, only in code.
   */
};