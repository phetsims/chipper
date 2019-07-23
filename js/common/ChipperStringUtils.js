// Copyright 2015-2019, University of Colorado Boulder

/**
 * String utilities used throughout chipper.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

/* eslint-env browser, node */
'use strict';

( function() {

  // constants
  // This string key supports nested string objects, see https://github.com/phetsims/rosetta/issues/193
  // NOTE: don't change this without consulting the duplication in the `string-require-statement-match.js` eslint rule.
  const A11Y_STRING_KEY_NAME = 'a11y';

  // Any string keys beginning with this marker support nested string values
  const A11Y_KEY_MARKER = `${A11Y_STRING_KEY_NAME}.`;

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

    // TODO chipper#316 determine why this behaves differently than str.replace for some cases (eg, 'MAIN_INLINE_JAVASCRIPT')
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
     * @param {Object.<string, intermediary:Object|{value:string}>} stringsMap - if "intermediary", then recurse to
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
            // TODO: some a11y strings have leading/trailing whitespace purposefully, perhaps we should formalize that somehow, https://github.com/phetsims/chipper/issues/779
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
     * Given a key, get the appropriate string from the "map" object. The map is most likely a loaded JSON string file.
     * This method also supports being called from CHIPPER/getStringMap, which adds the REPO prefix to all string keys
     * in the map. This method supports recursing through keys that support string nesting. This method was
     * created to support nested string keys in https://github.com/phetsims/rosetta/issues/193
     * @param {Object.<string, intermediate:Object|{value: string}>} map - where 'intermediate' should hold nested strings
     * @param {string} key - like `friction.title` or `FRICTION/friction.title` or using nesting like `a11y.nested.string.here`
     * @returns {string} - the string value of the key
     * @throws  {Error} - if the key doesn't hold a string value in the map
     */
    getStringFromMap( map, key ) {
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
      else if ( key.indexOf( A11Y_KEY_MARKER ) === 0 ) {
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
        // TODO: `a11y.my.string.is.all.the.way.down.here.value` is a string value
        // TODO: perhaps also do this for getStringMap case below, but maybe this is only needed here for requirejs mode
        // TODO: https://github.com/phetsims/rosetta/issues/193
        return string.value;
      }

      // This supports being called from CHIPPER/getStringMap with keys like `FRICTION/a11y.some.string.here`
      else if ( repoPrefix && key.indexOf( `${repoPrefix}/${A11Y_KEY_MARKER}` ) === 0 ) {

        // The first key in the map is like "FRICTION/a11y": { . . . }
        const nestedStringsKey = `${repoPrefix}/${A11Y_STRING_KEY_NAME}`;
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

    /**
     * Call a function on each string object in a string map. Recursively dive into each object that doesn't have a
     * `value` to find nested string objects too.
     * @param {Object.<string, Object|{value:string}>} map - string map, like a loaded JSON strings file
     * @param {function(key:string, {value:string})} func
     * @public
     */
    forEachString( map, func ) {
      forEachStringImplementation( '', map, func );
    },

    /**
     * @type {string}
     * @pubic
     */
    A11Y_STRING_KEY_NAME: A11Y_STRING_KEY_NAME
  };

  /**
   * This implementation function helps keep a better api for `forEachString`.
   * @param {string} keySoFar - as we recurse down, build up a string of the key separated with dots.
   * @param {Object} map - string key map
   * @param {function(key:string, {value:string})} func
   */
  const forEachStringImplementation = ( keySoFar, map, func ) => {
    for ( const key in map ) {
      if ( map.hasOwnProperty( key ) ) {
        const nextKey = keySoFar ? `${keySoFar}.${key}` : key; // don't start with period
        if ( map[ key ].value ) {
          func( nextKey, map[ key ] );
        }
        else {

          // recurse to the next level since this wasn't the `value` key
          forEachStringImplementation( nextKey, map[ key ], func );
        }
      }
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

} )();
