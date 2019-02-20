// Copyright 2015, University of Colorado Boulder

/**
 * This (asynchronous) grunt task builds and minifies an individual wrapper.
 * Note this file was created to support building the phet-io-wrapper-sonification repo, and should be worked on before
 * using on other wrappers.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

'use strict';

const copyDirectory = require( '../copyDirectory' );
const fs = require( 'fs' );
const getDependencies = require( '../getDependencies' );
const getPhetLibs = require( '../getPhetLibs' );
const grunt = require( 'grunt' );

// Don't copy these files/folders into the built wrapper
const WRAPPER_BLACKLIST = [ '.git', 'README.md', '.gitignore', 'node_modules', 'build' ];

/**
 * @param {string} wrapperRepo
 * @returns {Promise}
 */
module.exports = async function( wrapperRepo ) {

  const packageObject = grunt.file.readJSON( `../${wrapperRepo}/package.json` );

  getPhetLibs( wrapperRepo ).forEach( function( repo ) {

    //  We only need the common folder from the general wrappers repo
    if ( repo === 'phet-io-wrappers' ) {
      repo = 'phet-io-wrappers/common';
    }

    // we only need the plugins from chipper
    else if ( repo === 'chipper' ) {
      repo = 'chipper/js/requirejs-plugins';
    }

    // Special case for the sherpa repo. Look for packageJSON.wrapper.sherpaDependencies for individual files to copy on build.
    else if ( repo === 'sherpa' ) {

      // If there are no sherpaDependencies mentioned in the package.json, then still just copy the whole repo.
      if ( !packageObject.wrapper.sherpaDependencies ) {
        grunt.log.debug( 'To decrease the size of the sherpa dependency, use wrapper.sheraDependencies in package.json ' +
                         'to specify sherpa libraries from sherpa/lib.' );
      }

      else {
        fs.mkdirSync( `../${wrapperRepo}/build/sherpa` );
        fs.mkdirSync( `../${wrapperRepo}/build/sherpa/lib` );

        packageObject.wrapper.sherpaDependencies.forEach( function( file ) {
          grunt.file.copy( `../sherpa/lib/${file}`, `../${wrapperRepo}/build/sherpa/lib/${file}` );
        } );

        return; // short circuit before the whole copy below.
      }
    }

    // otherwise copy the whole directory over, except the black list from above
    copyDirectory( `../${repo}`, `../${wrapperRepo}/build/${repo}/`, null, {
      blacklist: WRAPPER_BLACKLIST, // List of files to not copy
      minifyJS: true,
      minifyOptions: {
        mangle: false
      },
      licenseToPrepend: '// Copyright 2002-2017, University of Colorado Boulder\n' +
                        '// This PhET-iO file requires a license\n' +
                        '// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                        '// For licensing, please contact phethelp@colorado.edu\n\n'
    } );
  } );

  const dependencies = await getDependencies( wrapperRepo );
  grunt.file.write( `../${wrapperRepo}/build/dependencies.json`, JSON.stringify( dependencies, null, 2 ) );
};
