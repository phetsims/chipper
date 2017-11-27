// Copyright 2016, University of Colorado Boulder

/**
 * Copies all supporting PhET-iO files, including wrappers, indices, lib files, etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Matt Pennington (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

// modules
var ChipperConstants = require( '../../common/ChipperConstants' );
var ChipperStringUtils = require( '../../common/ChipperStringUtils' );
var copyDirectory = require( './copyDirectory' );

// constants
var DEDICATED_REPO_WRAPPER_PREFIX = 'phet-io-wrapper-';
var WRAPPER_COMMON_FOLDER = 'phet-io-wrappers/common';

// phet-io internal files to be consolidated into 1 file and publicly served as a minified phet-io library
var LIB_FILES = [
  '../query-string-machine/js/QueryStringMachine.js',
  '../' + WRAPPER_COMMON_FOLDER + '/js/SimIFrameClient.js',
  '../' + WRAPPER_COMMON_FOLDER + '/js/WrapperTypes.js',
  '../' + WRAPPER_COMMON_FOLDER + '/js/assert.js',
  '../' + WRAPPER_COMMON_FOLDER + '/js/WrapperUtils.js' ];

var LIB_DIR = ChipperConstants.BUILD_DIR + '/lib';
var LIB_OUTPUT_FILE = 'phet-io.js';
var LIB_COPYRIGHT_HEADER = '// Copyright 2002-2017, University of Colorado Boulder\n' +
                           '// This PhET-iO file requires a license\n' +
                           '// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                           '// For licensing, please contact phethelp@colorado.edu';

// All libraries and third party files that are used by phet-io wrappers, and need to be copied over for a build
var CONTRIB_FILES = [
  '../sherpa/lib/lodash-4.17.4.min.js',
  '../sherpa/lib/font-awesome-4.5.0',
  '../sherpa/lib/jquery-2.1.0.min.js',
  '../sherpa/lib/jquery-ui-1.8.24.min.js',
  '../sherpa/lib/d3-4.2.2.js'
];
var CONTRIB_DIR = ChipperConstants.BUILD_DIR + '/contrib';

module.exports = async function( grunt, repo, version ) {

  // The filter that we run every phet-io wrapper file through to transform dev content into built content. This mainly
  // involves lots of hard coded copy replace of template strings and marker values.
  var filterWrapper = function( abspath, contents ) {
    var originalContents = contents + '';

    if ( abspath.indexOf( '.html' ) >= 0 ) {

      // change the paths of sherpa files to point to the contrib/ folder
      CONTRIB_FILES.forEach( function( filePath ) {

        // No need to do this is this file doesn't have this contrib import in it.
        if ( contents.indexOf( filePath ) >= 0 ) {

          var filePathParts = filePath.split( '/' );

          // If the file is in a dedicated wrapper repo, then it is one level higher in the dir tree, and needs 1 less set of dots.
          // see https://github.com/phetsims/phet-io-wrappers/issues/17 for more info. This is hopefully a temporary workaround
          var eliminateExtraDotsForDedicatedWrappers = abspath.indexOf( DEDICATED_REPO_WRAPPER_PREFIX ) >= 0;
          var fileName = filePathParts[ filePathParts.length - 1 ];
          var contribFileName = 'contrib/' + fileName;
          var pathToContrib = eliminateExtraDotsForDedicatedWrappers ? '../../' + contribFileName : '../' + contribFileName;
          contents = ChipperStringUtils.replaceAll( contents, filePath, pathToContrib );
        }
      } );

      /*
       * Remove individual common phet-io code imports because they are all in phetio.js
       */

      // This returns the whole line that contains this substring, so it can be removed
      var firstQueryStringLine = ChipperStringUtils.firstLineThatContains( contents, 'QueryStringMachine.js">' );

      // Don't remove the import if it is coming from the phet-io website, only if it is a relative path in requirejs mode.
      if ( firstQueryStringLine && firstQueryStringLine.indexOf( 'phet-io.colorado.edu' ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstQueryStringLine, '' ); // included in phetio.js
      }
      var firstWrapperUtilsLine = ChipperStringUtils.firstLineThatContains( contents, 'WrapperUtils.js">' );
      if ( firstWrapperUtilsLine && firstWrapperUtilsLine.indexOf( 'phet-io.colorado.edu' ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstWrapperUtilsLine, '' ); // included in phetio.js
      }
      var firstAssertLine = ChipperStringUtils.firstLineThatContains( contents, 'assert.js">' );
      if ( firstAssertLine && firstAssertLine.indexOf( 'phet-io.colorado.edu' ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstAssertLine, '' ); // included in phetio.js
      }
      var firstIFrameClientLine = ChipperStringUtils.firstLineThatContains( contents, 'SimIFrameClient.js">' );
      if ( firstIFrameClientLine && firstIFrameClientLine.indexOf( 'phet-io.colorado.edu' ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstIFrameClientLine, '' ); // included in phetio.js
      }
      var firstWrapperTypeLine = ChipperStringUtils.firstLineThatContains( contents, 'WrapperTypes.js">' );
      if ( firstWrapperTypeLine && firstWrapperTypeLine.indexOf( 'phet-io.colorado.edu' ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstWrapperTypeLine, '' ); // included in phetio.js
      }

      // For info about phetio.js, see the end of this file
      contents = ChipperStringUtils.replaceAll( contents,
        '<!--{{phet-io.js}}-->',
        '<script type="text/javascript" src="../../lib/' + LIB_OUTPUT_FILE + '"></script>'
      );
      contents = ChipperStringUtils.replaceAll( contents,
        '<!--{{GOOGLE_ANALYTICS.js}}-->',
        '<script type="text/javascript" src="/assets/js/phet-io-ga.js"></script>'
      );
      contents = ChipperStringUtils.replaceAll( contents,
        '<!--{{FAVICON.ico}}-->',
        '<link rel="shortcut icon" href="/assets/favicon.ico"/>'
      );
    }
    if ( abspath.indexOf( '.js' ) >= 0 || abspath.indexOf( '.html' ) >= 0 ) {
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_NAME}}', repo );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_VERSION}}', version );
      contents = ChipperStringUtils.replaceAll( contents, 'isBuilt: false', 'isBuilt: true' );

      // phet-io-wrappers/common will be in the top level of wrappers/ in the build directory
      contents = ChipperStringUtils.replaceAll( contents, WRAPPER_COMMON_FOLDER + '/', 'common/' );
    }
    if ( contents !== originalContents ) {
      return contents;
    }
    else {
      return null; // signify no change (helps for images)
    }
  };

  // Load the master list of all wrappers
  var wrappers = grunt.file.read( '../chipper/data/wrappers' ).toString().split( /\r?\n/ );

  // Files and directories from wrapper folders that we don't want to copy
  var wrappersBlacklist = [ '.git', 'README.md', '.gitignore', 'node_modules', 'package.json', 'build' ];

  var libFileNames = LIB_FILES.map( function( filePath ) {
    var parts = filePath.split( '/' );
    return parts[ parts.length - 1 ];
  } );

  // Don't copy over the files that are in the lib file, this way we can catch wrapper bugs that are not pointing to the lib.
  var fullBlacklist = wrappersBlacklist.concat( libFileNames );

  // Make sure to copy the phet-io-wrappers common wrapper code too.
  wrappers.push( WRAPPER_COMMON_FOLDER );
  wrappers.forEach( function( wrapper ) {

    var wrapperParts = wrapper.split( '/' );

    // either take the last path part, or take the first (repo name) and remove the wrapper prefix
    var wrapperName = wrapperParts.length > 1 ? wrapperParts[ wrapperParts.length - 1 ] : wrapperParts[ 0 ].replace( DEDICATED_REPO_WRAPPER_PREFIX, '' );

    // Copy the wrapper into the build dir /wrappers/, exclude the blacklist, and minify the js code
    copyDirectory( grunt, '../' + wrapper, ChipperConstants.BUILD_DIR + '/wrappers/' + wrapperName, filterWrapper, {
      blacklist: fullBlacklist,
      minifyJS: true
    } );
  } );

  // Copy over the dev guide and the needed dependencies
  handleDevGuide( grunt );

  // Create the lib file that is minified and publicly available under the /lib folder of the build
  handleLib( grunt, filterWrapper );

  // Create the contrib folder and add to it third party libraries used by wrappers.
  handleContrib( grunt );

  // Generate API Documentation
  if ( grunt.option( 'phetioDocs' ) ) {
    // generatePhETIOAPIDocs( grunt, buildConfig );
  }
};

/**
 * Given the list of lib files, apply a filter function to them. Then minify them and consolidate into a single string.
 * Finally write them to the build dir with a license prepended. See https://github.com/phetsims/phet-io/issues/353

 * @param grunt
 * @param {Function} filter - the filter function used when copying over the dev guide, to fix relative paths and such
 *                            has arguments like "function(abspath, contents)"
 */
var handleLib = function( grunt, filter ) {

  // TODO: chipper#101 eek, this is scary! we are importing from the node_modules dir. ideally we should just have uglify-js installed once in sherpa?
  var uglify = require( '../../../node_modules/uglify-js/tools/node' );// eslint-disable-line require-statement-match

  grunt.file.mkdir( LIB_DIR );

  var consolidated = '';
  LIB_FILES.forEach( function( libFile ) {
    var contents = grunt.file.read( libFile );

    var filteredContents = filter && filter( libFile, contents );

    // The filter should return null if nothing changes
    consolidated += filteredContents ? filteredContents : contents;
  } );

  var minified = uglify.minify( consolidated, {
    fromString: true,
    mangle: true,
    output: {
      inline_script: true, // escape </script
      beautify: false
    },
    compress: {
      global_defs: {}
    }
  } ).code;

  grunt.file.write( LIB_DIR + '/' + LIB_OUTPUT_FILE, LIB_COPYRIGHT_HEADER + '\n\n' + minified );
};

/**
 * Copy the appropriate resources and files to the build folder needed for the development guide.
 * @param grunt
 * @param {Function} filter - the filter function used when copying over the dev guide, to fix relative paths and such
 *                            has arguments like "function(abspath, contents)"
 */
var handleDevGuide = function( grunt, filter ) {
  var devguideHTML = grunt.file.read( '../phet-io-website/root/devguide/index.html' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '../assets/bootstrap-3.3.6-dist/css/bootstrap.min.css', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '../assets/bootstrap-3.3.6-dist/js/bootstrap.min.js', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '../assets/font-awesome-4.5.0/css/font-awesome.min.css', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.5.0/css/font-awesome.min.css' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '../assets/js/jquery-1.12.3.min.js', 'https://code.jquery.com/jquery-1.12.3.min.js' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '../assets/css/', './css/' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '../assets/js/', './js/' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '../assets/highlight.js-9.1.0/styles/tomorrow-night-bright.css', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/styles/tomorrow-night-bright.min.css' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '../assets/highlight.js-9.1.0/highlight.js', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.1.0/highlight.min.js' );
  devguideHTML = ChipperStringUtils.replaceAll( devguideHTML, '../assets/favicon.ico', './favicon.ico' );

  // Remove the navbar and footer div tags
  var firstNavbarLine = ChipperStringUtils.firstLineThatContains( devguideHTML, 'id="navbar"' );
  devguideHTML = firstNavbarLine ? ChipperStringUtils.replaceAll( devguideHTML, firstNavbarLine, '' ) : devguideHTML;

  var firstFooterLine = ChipperStringUtils.firstLineThatContains( devguideHTML, 'id="footer"' );
  devguideHTML = firstFooterLine ? ChipperStringUtils.replaceAll( devguideHTML, firstFooterLine, '' ) : devguideHTML;

  grunt.file.write( ChipperConstants.BUILD_DIR + '/docs/devguide.html', devguideHTML );
  copyDirectory( grunt, '../phet-io-website/root/assets/css', ChipperConstants.BUILD_DIR + '/docs/css', filter );
  grunt.file.copy( '../phet-io-website/root/assets/js/phet-io.js', './' + ChipperConstants.BUILD_DIR + '/docs/js/phet-io.js' );
  grunt.file.copy( '../phet-io-website/root/assets/js/phet-io-ga.js', './' + ChipperConstants.BUILD_DIR + '/docs/js/phet-io-ga.js' );
  grunt.file.copy( '../phet-io-website/root/assets/favicon.ico', './' + ChipperConstants.BUILD_DIR + '/docs/favicon.ico' );
};

/**
 * Copy all of the third party libraries from sherpa to the build directory under the 'contrib' folder.
 * @param grunt
 */
var handleContrib = function( grunt ) {
  CONTRIB_FILES.forEach( function( filePath ) {
    var filePathParts = filePath.split( '/' );

    var fileName = filePathParts[ filePathParts.length - 1 ];

    grunt.file.copy( filePath, './' + CONTRIB_DIR + '/' + fileName );

  } );
};