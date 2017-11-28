// Copyright 2014-2015, University of Colorado Boulder

/**
 * Copy a directory and all of its contents recursively
 * @author Sam Reid (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const assert = require( 'assert' );
const minify = require( '../minify' );

/**
 * @param grunt the grunt instance
 * @param {string} src - the source directory
 * @param {string} dst - the destination directory
 * @param {function} [filter] - rules for filtering files.  If returns falsy, then the file will be copied directly (helps with images)
 * @param {object} options
 */
module.exports = function( grunt, src, dst, filter, options ) {

  options = _.extend( {
    failOnExistingFiles: false,
    blacklist: [],
    minifyJS: false,
    licenseToPrepend: ''
  }, options );

  // Copy built sim files (assuming they exist from a prior grunt command)
  grunt.file.recurse( src, function callback( abspath, rootdir, subdir, filename ) {


    var isInBlacklistedDir = false;
    subdir && subdir.split( '/' ).forEach( function( pathPart ) {

      // Exclude all directories that are in the blacklist
      if ( options.blacklist.indexOf( pathPart ) >= 0 ) {
        isInBlacklistedDir = true;
      }
    } );

    // Exit out if the file is blacklisted or if it is in a blacklisted dir.
    if ( isInBlacklistedDir || options.blacklist.indexOf( filename ) >= 0 ) {
      return;
    }

    var contents = grunt.file.read( abspath );

    // TODO: this line is duplicated around chipper
    var dstPath = subdir ? ( dst + '/' + subdir + '/' + filename ) : ( dst + '/' + filename );

    if ( options.failOnExistingFiles && grunt.file.exists( dstPath ) ) {
      assert && assert( false, 'file existed already' );
    }
    var filteredContents = filter && filter( abspath, contents );

    // Minify the file if it is javascript code
    if ( options.minifyJS && filename.endsWith( '.js' ) && abspath.indexOf( 'chipper/templates/' ) < 0 ) {
      var toBeMinified = filteredContents ? filteredContents : contents;
      filteredContents = minify( grunt, toBeMinified );

      // Only add the license to the javascript code
      filteredContents = options.licenseToPrepend + filteredContents;
    }

    if ( filteredContents ) {
      grunt.file.write( dstPath, filteredContents );
    }
    else {
      grunt.file.copy( abspath, dstPath );
    }
  } );
};
