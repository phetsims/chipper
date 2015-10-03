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

// modules
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );

/**
 * @param grunt - the grunt instance
 * @param {string} requirejsNamespace - requirejs namespace that appears in config.js, eg, BALANCING_ACT
 */
module.exports = function( grunt, requirejsNamespace ) {
  'use strict';

  var directory = process.cwd();

  ChipperConstants.MEDIA_TYPES.forEach( function( mediaType ) {

    // Iterate over media directories and sub-directories
    var subdirectory = directory + '/' + mediaType;
    if ( grunt.file.isDir( subdirectory ) ) {
      grunt.file.recurse( subdirectory, function( abspath, rootdir, subdir, filename ) {

        // check if the file was loaded during requirejs
        var key = subdir ?
                  requirejsNamespace + '/' + subdir + '/' + filename :
                  requirejsNamespace + '/' + filename;

        var licenseEntries = global.phet.chipper.licenseEntries || {}; // global.phet.chipper.licenseEntries is initialized by media plugins
        if ( filename !== 'license.json' ) {

          // If no licenseEntries were registered, or some were registered but not one corresponding to this file
          if ( !licenseEntries.hasOwnProperty( mediaType ) || !licenseEntries[ mediaType ].hasOwnProperty( key ) ) {
            grunt.log.warn( 'Unused ' + mediaType + ' file: ' + key );
          }
        }
      } );
    }
  } );
};