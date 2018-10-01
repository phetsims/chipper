// Copyright 2015, University of Colorado Boulder

/**
 * String utilities used throughout chipper.
 *
 * @Chris Malley (PixelZoom, Inc.)
 */

/* eslint-env browser, node */
'use strict';

(function() {

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
     * Replaces the first occurrence of {string} find with {string} replaceWith in {string} str
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
     * Returns a string with all of the keys of the mapping replaced with the values.
     * @public
     *
     * @param {string} str
     * @param {Object} mapping
     * @returns {string}
     */
    replacePlaceholders: function( str, mapping ) {
      Object.keys( mapping ).forEach( function( key ) {
        var replacement = mapping[ key ];
        key = '{{' + key + '}}';
        var index;
        while ( ( index = str.indexOf( key ) ) >= 0 ) {
          str = str.slice( 0, index ) + replacement + str.slice( index + key.length );
        }
      } );
      Object.keys( mapping ).forEach( function( key ) {
        if ( str.indexOf( '{{' + key + '}}' ) >= 0 ) {
          throw new Error( 'Template string detected in placeholders: ' + key + '\n\n' + str.slice( 0, str.indexOf( '{{' + key + '}}' ) + 10 ) );
        }
      } );
      return str;
    },

    /**
     * Return the first line that contains the substring 'find'
     * @param {string} string - the parent string within which to search
     * @param {string} find - the legal regex string to be found
     * @returns {array} - the whole line containing the matched substring
     */
    firstLineThatContains: function( string, find ) {
      var findRE = '.*' + find.replace( /[-\/\\^$*+?.()|[\]{}]/g, '\\$&' ) + '.*';
      var theReturn = string.match( new RegExp( findRE, 'g' ) );
      return theReturn ? theReturn[ 0 ] : null;
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
