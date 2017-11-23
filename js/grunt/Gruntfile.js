// Copyright 2013-2015, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

// built-in node APIs
const assert = require( 'assert' );
const buildStandalone = require( '../buildStandalone' );
const fs = require( 'fs' );
const getPhetLibs = require( '../getPhetLibs' );
const lint = require( '../lint' );

module.exports = function( grunt ) {
  var brand = 'phet'; // TODO: don't hardcode! we'll need to rewrite some things that reference this

  var packageObject = grunt.file.readJSON( 'package.json' );

  // argh, hacky! TODO REMOVE
  // Initialize and document all globals
  assert( !global.phet, 'global.phet already exists' );
  global.phet = {

    chipper: {

      // the grunt instance, for situations where we can't pass it as a function argument
      grunt: grunt,

      // for code that runs in both requirejs and build modes, and therefore doesn't have access to grunt.file
      fs: fs,

      // polyfill to work around the cache buster arg in the *-config.js file that all sims have.
      getCacheBusterArgs: function() { return ''; },

      // media plugins populate this with license.json entries, see getLicenseEntry.js for format of entries
      licenseEntries: {},

      // use by media plugins, which don't have access to buildConfig
      brand: brand,

      // populated by mipmap.js
      mipmapsToBuild: [],

      // populated by string.js
      strings: {}
    }
  };

  grunt.registerTask( 'default', 'Builds the repository', [ 'lint-all', 'clean', 'build' ] );

  grunt.registerTask( 'clean',
    'Erases the build/ directory and all its contents, and recreates the build/ directory',
    function() {
      if ( grunt.file.exists( 'build' ) ) {
        grunt.file.delete( 'build' );
      }
      grunt.file.mkdir( 'build' );
    } );

  grunt.registerTask( 'build',
    'TODO',
    async function() {
      const done = grunt.task.current.async();

      const uglify = grunt.option( 'uglify' ) !== false;
      const mangle = grunt.option( 'mangle' ) !== false;
      const name = grunt.file.readJSON( 'package.json' ).name;

      if ( name === 'scenery' || name === 'kite' || name === 'dot' ) {
        fs.writeFileSync( 'build/' + name + '.min.js', await buildStandalone( grunt, uglify, mangle ) );
      }

      done();
    }
  );

  grunt.registerTask( 'lint', 'lint js files that are specific to this repository', function() {
    lint( grunt, [ packageObject.name ] );
  } );

  grunt.registerTask( 'lint-all', 'lint all js files that are required to build this repository', async function() {
    const done = grunt.task.current.async();

    lint( grunt, await getPhetLibs( grunt, packageObject.name, brand ) );

    done();
  } );

  grunt.registerTask( 'lint-everything', 'lint all js files that are required to build this repository', function() {
    lint( grunt, grunt.file.read( '../chipper/data/active-repos' ).trim().split( /\r?\n/ ) );
  } );
};
