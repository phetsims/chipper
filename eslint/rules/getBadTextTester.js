// Copyright 2019, University of Colorado Boulder
/* eslint-disable */

/**
 * Bad text testing function for testing bad text in the project. Supports bad text as string or regex
 *
 * @param {Array.<string|Object>} badTexts - if object, should look like {name: {string}, regex: {Regexp}}
 * @param {Object} context - eslinting context given from the engine
 */
module.exports = ( badTexts, context ) => {
  'use strict';

  /**
   * Returns true if the valueText is "good" (not an entry of badTexts).
   *
   * @param {string} valueText - the string to test
   * @param {string|{name:string, regex:RegExp}} badText entry of badTexts
   * @returns {boolean}
   */
  const reportBadText = ( valueText, badText, tokenLocation ) => {
    let failedText = null;
    if ( badText.regex instanceof RegExp && badText.regex.test( valueText ) ) {
      failedText = badText.name;
    }
    if ( valueText.indexOf( badText ) >= 0 ) {
      failedText = badText;
    }

    failedText && context.report( {
      loc: tokenLocation.start,
      message: 'File contains bad text: \'' + failedText + '\''
    } );
  };

  return node => {
    const sourceCode = context.getSourceCode();
    const codeTokens = sourceCode.getTokens( node );
    const commentTokens = sourceCode.getAllComments();
    const allTokens = codeTokens.concat( commentTokens );

    badTexts.forEach( badText => {
      allTokens.forEach( token => {
        const tokenValue = token.value;

        let failedText = null;
        if ( badText.regex instanceof RegExp && badText.regex.test( token.value ) ) {
          failedText = badText.name;
        }
        if ( token.value.indexOf( badText ) >= 0 ) {
          failedText = badText;
        }

        failedText && context.report( {
          loc: token.loc.start,
          message: 'File contains bad text: \'' + failedText + '\''
        } );
      } );
    } );
  };
};