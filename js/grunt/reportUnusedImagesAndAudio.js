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
 * @param {string} simName - the lower-case string prefix such as balancing-act
 */
module.exports = function( grunt, simName ) {
  // The following comment permits node-specific globals (such as process.cwd()) to pass jshint
  /* jslint node: true */
  'use strict';

  var directory = process.cwd();

  var endsWith = function( string, substring ) {
    return string.indexOf( substring ) === string.length - substring.length;
  };

  // Iterate over all images and audio directories recursively
  grunt.file.recurse( directory, function( abspath, rootdir, subdir, filename ) {

    if ( subdir && (subdir.indexOf( 'images' ) === 0 || subdir.indexOf( 'audio' ) === 0) ) {

      // check if the file on the HDD was loaded during requirejs
      var key = simName + '/' + filename;

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