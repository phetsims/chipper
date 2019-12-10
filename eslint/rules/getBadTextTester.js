// Copyright 2019, University of Colorado Boulder

/**
 * Bad text testing function for testing bad text in the project. Supports bad text as string ForbiddenTextObject.
 * ForbiddenTextObject's schema was designed to support getting accurate line numbers from bad text in comments and
 * in code. To support code, use `codeTokens` to specify how the bad text will be tokenized into Esprima nodes.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

/* eslint-env node */
'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const assert = require( 'assert' );

/**
 * @param {Array.<string|ForbiddenTextObject>} badTexts - if a string, will be converted into a ForbiddenTextObject
 * @param {Object} context - eslinting context given from the engine
 * @returns {function(node:Object)} - function that reports any bad text lint errors to the context
 */
module.exports = ( badTexts, context ) => {

  return node => {
    const sourceCode = context.getSourceCode();
    const codeTokens = sourceCode.getTokens( node );
    const codeLines = sourceCode.lines;
    const text = sourceCode.text;

    /**
     * @param {number} lineNumber
     * @param {number} columnIndex
     * @param {string} text
     */
    const reportBadText = ( lineNumber, columnIndex, text ) => {

      // esprima Token loc object, see https://esprima.readthedocs.io/en/latest/lexical-analysis.html
      const loc = {
        start: { line: lineNumber, column: columnIndex },
        end: { line: lineNumber, column: columnIndex + text.length }
      };

      context.report( {
        node: node,
        loc: loc,
        message: `Line contains bad text: '${text}'`
      } );
    };

    /**
     *
     * @param {ForbiddenTextObject} forbiddenText
     */
    const testBadText = forbiddenText => {

      // no need to iterate through lines if the bad text isn't anywhere in the source code
      if ( text.indexOf( forbiddenText.id ) >= 0 ) {

        // If codeTokens are provided, only test this bad text in code, and not anywhere else.
        if ( forbiddenText.codeTokens ) {
          testCodeTokens( context, codeTokens, forbiddenText );
        }
        else {


          // test each line for the presence of the bad text
          for ( let i = 0; i < codeLines.length; i++ ) {
            const lineString = codeLines[ i ];

            // lines are 1 based, codeLines array is 0 based
            const badLineNumber = i + 1;

            // only test regex if provided
            if ( forbiddenText.regex ) {
              if ( forbiddenText.regex.test( lineString ) ) {
                reportBadText( badLineNumber, 0, forbiddenText.id );
              }
            }
            else {
              const columnIndex = lineString.indexOf( forbiddenText.id );
              if ( columnIndex >= 0 ) {
                reportBadText( badLineNumber, columnIndex, forbiddenText.id );
              }
            }
          }
        }
      }
    };

    badTexts.forEach( badText => {
      if ( typeof badText === 'string' ) {
        badText = { id: badText };
      }
      badText.regex && assert( badText.regex instanceof RegExp, 'regex, if provided, should be a RegExp' );
      badText.codeTokens && assert( Array.isArray( badText.codeTokens ) &&
      _.every( badText.codeTokens, token => typeof token === 'string' ),
        'codeTokens, if provided, should be an array of strings' );
      ( !!badText.regex || !!badText.codeTokens ) && assert( badText.regex !== badText.codeTokens,
        'bad text can have codeTokens or regex, but not both' );
      assert( typeof badText.id === 'string', 'id required' );
      testBadText( badText );
    } );
  };

  /**
   * @typedef {Object} ForbiddenTextObject
   * @property {string} id - the "string-form" id of the bad text. should occur in the source code. Also what is
   *                            displayed on error. Used when checking for bad text in comments.
   * @property {Array.<string>} [codeTokens] - a list of the tokenized, ordered code sections that make up the bad text
   *                                           within the javascript code (not used for checking comments). If there
   *                                           is only one codeToken, then it will also be checked as a substring of each
   *                                           code tokens. Required unless specifying "global". If this is provided,
   *                                           then the bad text will only be checked in code, and not via each line.
   * @property {RegExp} [regex] - if provided, instead of checking the id as a string, test each line with this regex.
   */
};

/**
 * @param {Object} context
 * @param {Object} codeTokens - from sourceCode object
 * @param {ForbiddenTextObject} forbiddenTextObject
 * @returns {boolean} - false if no errors found via code tokens
 */
const testCodeTokens = ( context, codeTokens, forbiddenTextObject ) => {
  const codeTokensArray = forbiddenTextObject.codeTokens;

  let foundFailure = false;

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
          foundFailure = true;
        }
      }
      else {
        break; // quit early because it was a non-match
      }
    }

    failures.forEach( failedTextObject => {
      context.report( {
        loc: token.loc.start,
        message: `bad code text: "${failedTextObject.id}"`
      } );
    } );
  }
  return foundFailure;
};