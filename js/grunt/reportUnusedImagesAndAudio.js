// Copyright 2002-2015, University of Colorado Boulder

/**
 * Report which images & audio from a sim were not used in the simulation with a require statement.  These files are probably
 * unused.
 * See https://github.com/phetsims/chipper/issues/172
 *
 * @author Sam Reid
 */

/**
 * @param grunt the grunt instance
 * @param {string} simNameUppercase - the upper-case string prefix such as BALANCING_ACT
 */
module.exports = function( grunt, simNameUppercase ) {
  'use strict';

  /* jslint node: true */
  // allows "process" to pass lint instead of getting an undefined lint error
  var directory = process.cwd();

  // Iterate over all images and audio directories recursively
  grunt.file.recurse( directory, function( abspath, rootdir, subdir, filename ) {

    if ( subdir && (subdir.indexOf( 'images' ) === 0 || subdir.indexOf( 'audio' ) === 0) ) {

      // check if the file on the HDD was loaded during requirejs
      var key = simNameUppercase + '/' + filename;
      if ( filename !== 'license.json' &&
           filename !== 'README.txt' && !global.imageAndAudioLicenseInfo.hasOwnProperty( key )
      ) {
        grunt.log.error( 'Unused resource: ' + key );
      }
    }
  } );
};