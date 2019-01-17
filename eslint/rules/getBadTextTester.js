// Copyright 2019, University of Colorado Boulder
/* eslint-disable */

/**
 * Bad text testing function for testing bad text in the project. Supports bad text as string or regex
 * @param {Array.<string|Object>} badTexts - if object, should look like {name: {string}, regex: {Regexp}}
 * @param {Object} context - eslinting context given from the engine
 */
module.exports = ( badTexts, context ) => {
  'use strict';

  return node => {
    const sourceCode = context.getSourceCode();
    const text = sourceCode.text;
    badTexts.forEach( badText => {
      let failedText = null;
      if ( badText.regex instanceof RegExp && badText.regex.test( text ) ) {
        failedText = badText.name;
      }
      if ( text.indexOf( badText ) >= 0 ) {
        failedText = badText;
      }
      failedText && context.report( {
        node: node,
        message: 'File contains bad text: \'' + failedText + '\''
      } );
    } );
  };
};