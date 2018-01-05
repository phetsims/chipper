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
var ChipperStringUtils = require( '../../common/ChipperStringUtils' );
var copyDirectory = require( './copyDirectory' );
const grunt = require( 'grunt' );
var minify = require( '../minify' );

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

var LIB_OUTPUT_FILE = 'phet-io.js';
var LIB_COPYRIGHT_HEADER = '// Copyright 2002-2017, University of Colorado Boulder\n' +
                           '// This PhET-iO file requires a license\n' +
                           '// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                           '// For licensing, please contact phethelp@colorado.edu';

// All libraries and third party files that are used by phet-io wrappers, and need to be copied over for a build
var CONTRIB_FILES = [
  '../sherpa/lib/lodash-4.17.4.min.js',
  '../sherpa/lib/ua-parser-0.7.12.min.js',
  '../sherpa/lib/bootstrap-2.2.2.js',
  '../sherpa/lib/font-awesome-4.5.0',
  '../sherpa/lib/jquery-2.1.0.min.js',
  '../sherpa/lib/jquery-ui-1.8.24.min.js',
  '../sherpa/lib/d3-4.2.2.js'
];

module.exports = async function( repo, version ) {

  const buildDir = `../${repo}/build/phet-io`;

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
        '<script src="../../lib/' + LIB_OUTPUT_FILE + '"></script>'
      );
      contents = ChipperStringUtils.replaceAll( contents,
        '<!--{{GOOGLE_ANALYTICS.js}}-->',
        '<script src="/assets/js/phet-io-ga.js"></script>'
      );
      contents = ChipperStringUtils.replaceAll( contents,
        '<!--{{FAVICON.ico}}-->',
        '<link rel="shortcut icon" href="/assets/favicon.ico"/>'
      );
    }
    if ( abspath.indexOf( '.js' ) >= 0 || abspath.indexOf( '.html' ) >= 0 ) {
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_NAME}}', repo );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_VERSION}}', version );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_IS_BUILT}}', 'true' );

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
  // TODO: Should this be in a file? Would we be duplicating perennial? We want a reproducible build
  var wrappers = [
    'phet-io-wrappers/active',
    'phet-io-wrappers/audio',
    'phet-io-wrappers/event-log',
    'phet-io-wrappers/index',
    'phet-io-wrappers/instance-proxies',
    'phet-io-wrappers/login',
    'phet-io-wrappers/mirror-inputs',
    'phet-io-wrappers/record',
    'phet-io-wrappers/playback',
    'phet-io-wrappers/screenshot',
    'phet-io-wrappers/state',
    'phet-io-wrappers/wrapper-template',
    'phet-io-wrapper-classroom-activity',
    'phet-io-wrapper-lab-book'
  ];

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
    copyDirectory( `../${wrapper}`, `${buildDir}/wrappers/${wrapperName}`, filterWrapper, {
      blacklist: fullBlacklist,
      minifyJS: true
    } );
  } );

  // Copy over the dev guide and the needed dependencies
  handleDevGuide( repo );

  // Create the lib file that is minified and publicly available under the /lib folder of the build
  handleLib( repo, filterWrapper );

  // Create the contrib folder and add to it third party libraries used by wrappers.
  handleContrib( repo );
};

/**
 * Given the list of lib files, apply a filter function to them. Then minify them and consolidate into a single string.
 * Finally write them to the build dir with a license prepended. See https://github.com/phetsims/phet-io/issues/353

 * @param grunt
 * @param {string} repo
 * @param {Function} filter - the filter function used when copying over the dev guide, to fix relative paths and such
 *                            has arguments like "function(abspath, contents)"
 */
var handleLib = function( repo, filter ) {
  const buildDir = `../${repo}/build/phet-io`;

  grunt.file.mkdir( `${buildDir}/lib` );

  var consolidated = '';
  LIB_FILES.forEach( function( libFile ) {
    var contents = grunt.file.read( libFile );

    var filteredContents = filter && filter( libFile, contents );

    // The filter should return null if nothing changes
    consolidated += filteredContents ? filteredContents : contents;
  } );

  var minified = minify( consolidated );

  grunt.file.write( `${buildDir}/lib/${LIB_OUTPUT_FILE}`, LIB_COPYRIGHT_HEADER + '\n\n' + minified );
};

/**
 * Copy the appropriate resources and files to the build folder needed for the development guide.
 * @param grunt
 * @param {string} repo
 * @param {Function} [filter] - the filter function used when copying over the dev guide, to fix relative paths and such
 *                              has arguments like "function(abspath, contents)"
 */
var handleDevGuide = function( repo, filter ) {
  const buildDir = `../${repo}/build/phet-io`;

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

  grunt.file.write( `${buildDir}/docs/devguide.html`, devguideHTML );
  copyDirectory( '../phet-io-website/root/assets/css', `${buildDir}/docs/css`, filter );
  grunt.file.copy( '../phet-io-website/root/assets/js/phet-io.js', `${buildDir}/docs/js/phet-io.js` );
  grunt.file.copy( '../phet-io-website/root/assets/js/phet-io-ga.js', `${buildDir}/docs/js/phet-io-ga.js` );
  grunt.file.copy( '../phet-io-website/root/assets/favicon.ico', `${buildDir}/docs/favicon.ico` );
};

/**
 * Copy all of the third party libraries from sherpa to the build directory under the 'contrib' folder.
 * @param grunt
 * @param {string} repo
 */
var handleContrib = function( repo ) {
  const buildDir = `../${repo}/build/phet-io`;
  
  CONTRIB_FILES.forEach( function( filePath ) {
    var filePathParts = filePath.split( '/' );

    var filename = filePathParts[ filePathParts.length - 1 ];

    grunt.file.copy( filePath, `${buildDir}/contrib/${filename}` );

  } );
};