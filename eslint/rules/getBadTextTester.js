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