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

  var endsWith = function( string, substring ) {
    return string.indexOf( substring ) === string.length - substring.length;
  };

  // Iterate over all images and audio directories recursively
  grunt.file.recurse( directory, function( abspath, rootdir, subdir, filename ) {

    if ( subdir && (subdir.indexOf( 'images' ) === 0 || subdir.indexOf( 'audio' ) === 0) ) {

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
           filename !== 'README.txt' && !global.imageAndAudioLicenseInfo.hasOwnProperty( key ) ) {
        grunt.log.error( 'Unused resource: ' + key );
      }
    }
  } );
};