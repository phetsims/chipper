// Copyright 2002-2015, University of Colorado Boulder

/**
 * Report which media files (such as images and audio) from a sim were not used in the simulation with a require statement.
 *
 * Each time a resource is loaded by a plugin (image, audio, mipmap,...) its license info is added to this global by
 * the plugin.  After all resources are loaded, the global will contain the list of all resources that are actually used
 * by the sim.  Comparing what's in the filesystem to this list identifies resources that are unused.
 *
 * See https://github.com/phetsims/chipper/issues/172
 *
 * @author Sam Reid
 */

// The following comment permits node-specific globals (such as process.cwd()) to pass jshint
/* jslint node: true */
'use strict';

// modules
var assert = require( 'assert' );

/**
 * @param grunt the grunt instance
 * @param {string} requirejsNamespace - requirejs namespace that appears in config.js, eg, BALANCING_ACT
 */
module.exports = function( grunt, requirejsNamespace ) {

  // globals that should be defined by this point
  assert( global.phet.chipper.licenseEntries, 'missing global.phet.chipper.licenseEntries' );

  var directory = process.cwd();

  // Iterate over image directories and sub-directories
  if ( grunt.file.exists( directory + '/images' ) ) {
    grunt.file.recurse( directory + '/images', function( abspath, rootdir, subdir, filename ) {

      // check if the file was loaded during requirejs
      var key = requirejsNamespace + '/' + filename;

      if ( filename !== 'license.json' ) {

        // If no licenseEntries were registered, or some were registered but not one corresponding to this file
        if ( !global.phet.chipper.licenseEntries.images ||
             (!global.phet.chipper.licenseEntries.images.hasOwnProperty( key )) ) {
          grunt.log.warn( 'Unused image: ' + key );
        }
      }
    } );
  }

  // Iterate over audio directories and sub-directories
  if ( grunt.file.exists( directory + '/audio' ) ) {
    grunt.file.recurse( directory + '/audio', function( abspath, rootdir, subdir, filename ) {

      // check if the file was loaded during requirejs
      var key = requirejsNamespace + '/' + filename;

      var licenseEntries = global.phet.chipper.licenseEntries;
      if ( filename !== 'license.json' ) {

        // Audio files may be loaded without a suffix (to load both *.mp3 and *.ogg), so check it as well
        var suffixless = key.substring( 0, key.lastIndexOf( '.' ) );

        // If no licenseEntries were registered, or some were registered but not one corresponding to this file
        if ( !licenseEntries.audio ||
             (!licenseEntries.audio.hasOwnProperty( key ) && !licenseEntries.audio.hasOwnProperty( suffixless )) ) {
          grunt.log.warn( 'Unused audio: ' + key );
        }
      }
    } );
  }
};