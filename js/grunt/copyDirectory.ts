// Copyright 2016-2025, University of Colorado Boulder

/**
 * Copy a directory and all of its contents recursively
 *
 * @author Sam Reid (PhET Interactive Simulations)
 *
 * @param src - the source directory
 * @param dst - the destination directory
 * @param [filter] - rules for filtering files.  If returns falsy, then the file will be copied directly (helps with images)
 * @param [options]
 */

import assert from 'assert';
import _ from 'lodash';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import minify from './minify.js';

export default function copyDirectory( src: string, dst: string, filter?: ( filename: string, contents: string ) => string | null, options?: IntentionalAny ): void {

  options = _.assignIn( {
    failOnExistingFiles: false,
    exclude: [], // list to exclude
    minifyJS: false,
    minifyOptions: {},
    licenseToPrepend: ''
  }, options );

  // Copy built sim files (assuming they exist from a prior grunt command)
  grunt.file.recurse( src, ( abspath, rootdir, subdir, filename ) => {


    let isExcludedDir = false;
    subdir && subdir.split( '/' ).forEach( pathPart => {

      // Exclude all directories that are in the excluded list
      if ( options.exclude.indexOf( pathPart ) >= 0 ) {
        isExcludedDir = true;
      }
    } );

    // Exit out if the file is excluded or if it is in a excluded dir.
    if ( isExcludedDir || options.exclude.indexOf( filename ) >= 0 ) {
      return;
    }

    const contents = grunt.file.read( abspath );

    const dstPath = subdir ? ( `${dst}/${subdir}/${filename}` ) : ( `${dst}/${filename}` );

    if ( options.failOnExistingFiles && grunt.file.exists( dstPath ) ) {
      assert && assert( false, 'file existed already' );
    }
    let filteredContents = filter && filter( abspath, contents );

    // Minify the file if it is javascript code
    if ( options.minifyJS && filename.endsWith( '.js' ) && !abspath.includes( 'chipper/templates/' ) ) {
      const toBeMinified = filteredContents ? filteredContents : contents;
      filteredContents = minify( toBeMinified, options.minifyOptions );

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
}