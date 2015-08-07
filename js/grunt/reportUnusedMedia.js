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
 * @param {string} simNameUppercase - the upper-case string prefix such as BALANCING_ACT
 */
module.exports = function( grunt, simNameUppercase ) {

  // globals that should be defined by this point
  assert( global.phet.chipper.licenseEntries, 'missing global.phet.chipper.licenseEntries' );

  var directory = process.cwd();

  var endsWith = function( string, substring ) {
    return string.indexOf( substring ) === string.length - substring.length;
  };

  // Iterate over image directories and sub-directories
  if ( grunt.file.exists( directory + '/images' ) ) {
    grunt.file.recurse( directory + '/images', function( abspath, rootdir, subdir, filename ) {

      // check if the file on the HDD was loaded during requirejs
      var key = simNameUppercase + '/' + filename;

      if ( filename !== 'license.json' &&
           filename !== 'README.txt' &&
           global.phet.chipper.licenseEntries.images &&
           (!global.phet.chipper.licenseEntries.images.hasOwnProperty( key )) ) {
        grunt.log.warn( 'Unused image: ' + key );
      }
    } );
  }

  // Iterate over audio directories and sub-directories
  if ( grunt.file.exists( directory + '/audio' ) ) {
    grunt.file.recurse( directory + '/audio', function( abspath, rootdir, subdir, filename ) {

      // check if the file on the HDD was loaded during requirejs
      var key = simNameUppercase + '/' + filename;

      // if it is an audio file, strip off the suffix .mp3 or .ogg because audio is loaded without a suffix
      // The only exception is VIBE/empty.mp3 which doesn't require an ogg version (WHY?)
      if ( key !== 'VIBE/empty.mp3' ) {
        if ( endsWith( key, '.mp3' ) || endsWith( key, '.ogg' ) ) {
          key = key.substring( 0, key.length - 4 );
        }
      }
      if ( filename !== 'license.json' &&
           filename !== 'README.txt' &&
           global.phet.chipper.licenseEntries.audio &&
           (!global.phet.chipper.licenseEntries.audio.hasOwnProperty( key )) ) {
        grunt.log.warn( 'Unused image: ' + key );
      }
    } );
  }
};