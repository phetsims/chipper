// Copyright 2013-2015, University of Colorado Boulder

/**
 * Global variables for chipper (helpful to have in one place, and need to reset some after builds).
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const assert = require( 'assert' );
const ChipperConstants = require( '../common/ChipperConstants' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );

module.exports = {
  /**
   * Initializes the globals with a copy of grunt.
   * @public
   */
  initialize() {
    assert( !global.phet, 'Attempted to double-initialize globals' );

    global.phet = {
      chipper: {
        // the grunt instance, for situations where we can't pass it as a function argument
        grunt: grunt,

        // for code that runs in both requirejs and build modes, and therefore doesn't have access to grunt.file
        fs: fs,

        // polyfill to work around the cache buster arg in the *-config.js file that all sims have.
        getCacheBusterArgs() { return ''; },

        // media plugins populate this with license.json entries, see getLicenseEntry.js for format of entries
        licenseEntries: {},

        // {string|null} - Used by media plugins, which don't have access to buildConfig
        brand: null,

        // populated by mipmap.js
        mipmapsToBuild: [],

        // populated by string.js
        strings: {}
      }
    };
  },

  /**
   * Should be run before a require.js build, as it initializes the global state for the plugins.
   * @public
   *
   * @param {string} brand
   */
  beforeBuild( brand ) {
    assert( _.includes( ChipperConstants.BRANDS, brand ), 'Unknown brand in beforeBuild: ' + brand );

    global.phet.chipper.mipmapsToBuild = [];
    global.phet.chipper.strings = {};
    global.phet.chipper.brand = brand;
    global.phet.chipper.licenseEntries = {};
  }
};
