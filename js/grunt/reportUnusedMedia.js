// Copyright 2015, University of Colorado Boulder

/**
 * Report which media files (such as images and sounds) from a sim were not used in the simulation with a require
 * statement.
 *
 * Each time a resource is loaded by a plugin (image, sounds, mipmap,...) its license info is added to this global by
 * the plugin.  After all resources are loaded, the global will contain the list of all resources that are actually used
 * by the sim.  Comparing what's in the filesystem to this list identifies resources that are unused.
 *
 * See https://github.com/phetsims/chipper/issues/172
 *
 * @author Sam Reid
 */

'use strict';

// modules
const ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
const grunt = require( 'grunt' );

/**
 * @param {string} requirejsNamespace - requirejs namespace that appears in config.js, eg, BALANCING_ACT
 */
module.exports = function( requirejsNamespace ) {

  const directory = process.cwd();

  ChipperConstants.MEDIA_TYPES.forEach( function( mediaType ) {

    // Iterate over media directories and sub-directories
    const subdirectory = `${directory}/${mediaType}`;
    if ( grunt.file.isDir( subdirectory ) ) {
      grunt.file.recurse( subdirectory, function( abspath, rootdir, subdir, filename ) {

        // check if the file was loaded during requirejs
        const key = subdir ?
                  `${requirejsNamespace}/${subdir}/${filename}` :
                  `${requirejsNamespace}/${filename}`;

        const licenseEntries = global.phet.chipper.licenseEntries || {}; // global.phet.chipper.licenseEntries is initialized by media plugins
        if ( filename !== 'license.json' && filename !== 'README.md' ) {

          // If no licenseEntries were registered, or some were registered but not one corresponding to this file
          if ( !licenseEntries.hasOwnProperty( mediaType ) || !licenseEntries[ mediaType ].hasOwnProperty( key ) ) {
            grunt.log.warn( `Unused ${mediaType} file: ${key}` );
          }
        }
      } );
    }
  } );
};