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
const fs = require( 'fs' );
const minify = require( '../minify' );
const requireBuild = require( '../requireBuild' );

// 3rd-party packages
const _ = require( '../../../sherpa/lib/lodash-4.17.4.min' ); // eslint-disable-line require-statement-match

module.exports = function( grunt ) {
	var brand = 'phet'; // TODO: don't hardcode

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

  grunt.registerTask( 'default', 'Builds the repository', [ 'build' ] );

  grunt.registerTask( 'build',
    'TODO',
    function() {
    	const done = grunt.task.current.async();
      requireBuild( grunt, 'js/acid-base-solutions-config.js' ).then( function( output ) {
      	console.log( output.length );
      	var minified = minify( grunt, output );
      	console.log( minified.length );
      } ).catch( function( err ) {
      	grunt.log.error( err );
      	done();
      } );
    }
  );
};
