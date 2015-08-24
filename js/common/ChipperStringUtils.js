// Copyright 2002-2015, University of Colorado Boulder

/**
 * String utilities used throughout chipper.
 *
 * @Chris Malley (PixelZoom, Inc.)
 */
(function() {
  'use strict';

  var ChipperStringUtils = {

    /**
     * Converts a string to camel case, eg: 'simula-rasa' -> 'simulaRasa'
     * See http://stackoverflow.com/questions/10425287/convert-string-to-camelcase-with-regular-expression
     *
     * @param {string} str - the input string
     * @returns {string} a new string
     */
    toCamelCase: function( str ) {
      return str.toLowerCase().replace( /-(.)/g, function( match, group1 ) {
        return group1.toUpperCase();
      } );
    },

    /**
     * Appends spaces to a string
     *
     * @param {string} str - the input string
     * @param {number} n - number of spaces to append
     * @returns {string} a new string
     */
    padString: function( str, n ) {
      while ( str.length < n ) {
        str += ' ';
      }
      return str;
    },

    /**
     * Replaces all occurrences of {string} find with {string} replace in {string} str
     *
     * @param {string} str - the input string
     * @param {string} find - the string to find
     * @param {string} replaceWith - the string to replace find with
     * @returns {string} a new string
     */
    replaceAll: function( str, find, replaceWith ) {
      return str.replace( new RegExp( find.replace( /[-\/\\^$*+?.()|[\]{}]/g, '\\$&' ), 'g' ), replaceWith );
    },

    //TODO chipper#316 determine why this behaves differently than str.replace for some cases (eg, 'MAIN_INLINE_JAVASCRIPT')
    /**
     * Replaces the first occurrence of {string} find with {string} replace in {string} str
     *
     * @param {string} str - the input string
     * @param {string} find - the string to find
     * @param {string} replaceWith - the string to replace find with
     * @returns {string} a new string
     */
    replaceFirst: function( str, find, replaceWith ) {
      var idx = str.indexOf( find );
      if ( str.indexOf( find ) !== -1 ) {
        return str.slice( 0, idx ) + replaceWith + str.slice( idx + find.length );
      }
      else {
        return str;
      }
    },

    /**
     * Trims leading and trailing spaces a string.
     *
     * @param {string} str - the input string
     * @returns {string} a new string
     */
    trimWhitespace: function( str ) {
      return str.replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' );
    }
  };

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return ChipperStringUtils;
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = ChipperStringUtils;
  }

})();
