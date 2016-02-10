// Copyright 2014-2015, University of Colorado Boulder

/**
 * Copy a directory and all of its contents recursively
 * @author Sam Reid (PhET Interactive Simulations)
 */

/**
 * @param grunt the grunt instance
 * @param {string} src - the source directory
 * @param {string} dst - the destination directory
 */
module.exports = function( grunt, src, dst ) {
  'use strict';

  // Copy built sim files (assuming they exist from a prior grunt command)
  grunt.file.recurse( src, function callback( abspath, rootdir, subdir, filename ) {

    // TODO: this line is duplicated around chipper
    var contentsPath = subdir ? ( dst + '/' + subdir + '/' + filename ) : ( dst + '/' + filename );
    grunt.file.copy( abspath, contentsPath );
  } );
};