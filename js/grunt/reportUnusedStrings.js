// Copyright 2015-2019, University of Colorado Boulder

/**
 * Report which translatable strings from a sim were not used in the simulation with a require statement.
 *
 * Each time a string is loaded by the plugin, it is added to a global list.  After all strings are loaded,
 * the global will contain the list of all strings that are actually used by the sim.  Comparing this list to
 * the strings in the translatable strings JSON file will identify which strings are unused.
 *
 * See https://github.com/phetsims/tasks/issues/460
 *
 * @author Jesse Greenberg
 */

'use strict';

const grunt = require( 'grunt' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );

/**
 * @param {string} repo
 * @param {string} requirejsNamespace
 */
module.exports = function( repo, requirejsNamespace ) {

  // get the strings for this sim
  const jsStrings = grunt.file.readJSON( `../${repo}/${repo}-strings_en.json` );

  // iterate over the strings
  for ( const key in jsStrings ) {

    if ( jsStrings.hasOwnProperty( key ) ) {

      const string = jsStrings[ key ].value;
      const requireStringKey = requirejsNamespace + '/' + key;

      // global.phet.chipper.strings is initialized by the string plugin
      const chipperStrings = global.phet.chipper.strings || {};

      /**
       * Warn if the string is not used.
       * @param {string} fullKey - with the `REPO/` included
       * @param {string} key - just the key, no `REPO/`
       * @param {string} value - the value of the string
       */
      const warnIfStringUnused = ( fullKey, key, value ) => {

        // If this string was not added to the global chipperStrings, it was not required in the sim
        if ( !chipperStrings.hasOwnProperty( fullKey ) ) {
          grunt.log.warn( `Unused string: key=${key}, value=${value}` );
        }
      };

      // for top level strings
      warnIfStringUnused( requireStringKey, key, string );

      // support nesting into a11y strings
      if ( key === ChipperStringUtils.A11Y_STRING_KEY_NAME ) {

        const a11yStrings = jsStrings[ key ];

        ChipperStringUtils.forEachString( a11yStrings, ( a11ySubKey, stringObject ) => {
          const keyWithRepo = `${requireStringKey}.${a11ySubKey}`;
          const fullKeyNoRepo = `${ChipperStringUtils.A11Y_STRING_KEY_NAME}.${a11ySubKey}`;
          warnIfStringUnused( keyWithRepo, fullKeyNoRepo, stringObject.value );
        } );
      }
    }
  }
};