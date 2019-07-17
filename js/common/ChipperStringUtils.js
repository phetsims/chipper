// Copyright 2015, University of Colorado Boulder

/**
 * String utilities used throughout chipper.
 *
 * @Chris Malley (PixelZoom, Inc.)
 */

/* eslint-env browser, node */
'use strict';

( function() {

  // constants
  // This key marker notes that the key exists in a part of the string file in which strings can be nested
  // TODO: Perhaps just call this A11Y_STRING_MARKER, it is pretty a11y specific anyways.
  // TODO: Doesn't this exclude us from having a top level key like `"a11ySomethingString":{"value":"a11y something string"}`
  // TODO: https://github.com/phetsims/rosetta/issues/193
  const SUPPORTS_NESTING_MARKER = 'a11y';

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
    },

    /**
     * Recurse through a string file and format each string value appropriately
     * @param {Object.<string, intermediary:Object|{value:string}>} stringObject - if "intermediary", then recurse to
     *                                                                             find more nested keys
     * @param {boolean} isRTL - is right to left language
     */
    formatStringValues: function( stringObject, isRTL ) {
      for ( const stringKey in stringObject ) {
        if ( stringObject.hasOwnProperty( stringKey ) ) {

          // This will either have a "value" key, or be an object with keys that will eventually have 'value' in it
          const element = stringObject[ stringKey ];
          if ( element.hasOwnProperty( 'value' ) ) {

            // remove leading/trailing whitespace, see chipper#619. Do this before addDirectionalFormatting
            element.value = element.value.trim();
            element.value = ChipperStringUtils.addDirectionalFormatting( element.value, isRTL );
          }
          else {

            // Recurse a level deeper
            ChipperStringUtils.formatStringValues( element, isRTL );
          }
        }
      }
    },

    /**
     * Given a key, get the appropriate string from the "map" object. This method was primarily created to support
     * nested string keys in https://github.com/phetsims/rosetta/issues/193
     * @param {Object.<string, intermediate:Object|{value: string}>} map - where 'intermediate' could hold nested strings
     * @param {string} key - like `friction.title` or `FRICTION/friction.title` or using nesting like `a11y.nested.string.here`
     * @returns {string}
     * TODO: well this isn't a very good name is it, https://github.com/phetsims/rosetta/issues/193
     */
    getStringFromStringFileContents( map, key ) {
      let repoPrefix = '';
      if ( key.indexOf( '/' ) >= 0 ) {
        if ( key.match( /\//g ).length > 1 ) {
          throw new Error( `more forward slashes than expected in key: ${key}` );
        }
        repoPrefix = key.split( '/' )[ 0 ];
      }

      // Normal case where the key holds an object with the string in the "value" key, i.e. "friction.title": { "value": "Friction" },
      if ( map[ key ] !== undefined ) {
        if ( map[ key ].value === undefined ) {
          throw new Error( `no value entry for string key: ${key}` );
        }
        return map[ key ].value;
      }

      // `key` begins with nested section marker in requirejs case, where there isn't a prefix repo, like `a11y.string`
      // instead of `FRICTION/a11y.string`
      else if ( key.indexOf( SUPPORTS_NESTING_MARKER ) === 0 ) {
        if ( repoPrefix !== '' ) {
          throw new Error( `unexpected repo prefex ${repoPrefix}` );
        }

        // access the nested object with a key like `a11y.my.string.is.all.the.way.down.here`
        const string = _.at( map, key )[ 0 ];
        if ( string === undefined || string.value === undefined ) {
          throw new Error( `no entry for nested string key: ${key}` );
        }

        // TODO: recurse through each and assert that there is no "value" key in each nested object? (maybe)
        // TODO: for example `a11y.my.string.is.all.the.way.value` should not have a key because
        // TODO: `a11y.my.string.is.all.the.way.down.here` is a string value
        // TODO: perhaps also do this for getStringMap case below, but maybe this is only needed here for requirejs mode
        // TODO: https://github.com/phetsims/rosetta/issues/193
        return string.value;
      }

      // This supports being called from getStringMap with keys like `FRICTION/a11y.some.string.here`
      else if ( repoPrefix && key.indexOf( `${repoPrefix}/${SUPPORTS_NESTING_MARKER}` ) === 0 ) {

        // The first key in the map is like "FRICTION/a11y": { . . . }
        const nestedStringsKey = `${repoPrefix}/${SUPPORTS_NESTING_MARKER}`;
        const nestedStrings = map[ nestedStringsKey ];

        // access the nested object, remove the `FRICTION/a11y` piece because we already accessed that nested object above
        const string = _.at( nestedStrings, key.replace( `${nestedStringsKey}.`, '' ) )[ 0 ];
        if ( string === undefined || string.value === undefined ) {
          throw new Error( `no entry for nested string key: ${key}` );
        }

        return string.value;
      }
      else {

        // It would be really strange for there to be no fallback for a certain string, that means it exists in the translation but not the original English
        throw new Error( `no entry for string key: ${key}` );
      }
    },

    // @public {string} - if a key starts with this, then it supports nested objects
    SUPPORTS_NESTING_MARKER: SUPPORTS_NESTING_MARKER
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

} )();
