// Copyright 2015, University of Colorado Boulder

/**
 * String utilities used throughout chipper.
 *
 * @Chris Malley (PixelZoom, Inc.)
 */
(function() {
  'use strict';

  var ChipperStringUtils = {

    /**
     * Pad LTR/RTL language values with unicode embedding marks (see https://github.com/phetsims/joist/issues/152)
     * Uses directional formatting characters: http://unicode.org/reports/tr9/#Directional_Formatting_Characters
     *
     * @param {string} str
     * @param {boolean} isRTL
     * @returns {string} the input string padded with the embedding marks, or an empty string if the input was empty
     */
    addDirectionalFormatting: function( str, isRTL ) {
      if ( str.length > 0 ) {
        return ( isRTL ? '\u202b' : '\u202a' ) + str + '\u202c';
      }
      else {
        return str;
      }
    },

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
     * Returns true if one string ends with another.  See http://stackoverflow.com/questions/280634/endswith-in-javascript
     * @param {string} string - the parent string within which to search
     * @param {string} suffix - the suffix
     * @returns {boolean}
     */
    endsWith: function( string, suffix ) {
      return string.indexOf( suffix, string.length - suffix.length ) !== -1;
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
