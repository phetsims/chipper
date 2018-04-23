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
const ChipperStringUtils = require( '../../common/ChipperStringUtils' );
const copyDirectory = require( './copyDirectory' );
const grunt = require( 'grunt' );
const minify = require( '../minify' );
const execute = require( '../execute' );

// constants
const DEDICATED_REPO_WRAPPER_PREFIX = 'phet-io-wrapper-';
const WRAPPER_COMMON_FOLDER = 'phet-io-wrappers/common';
const PRODUCTION_SITE = 'phet-io.colorado.edu';

// phet-io internal files to be consolidated into 1 file and publicly served as a minified phet-io library.
// Make sure to add new files to the jsdoc generation list below also
const LIB_FILES = [
  '../query-string-machine/js/QueryStringMachine.js',
  '../' + WRAPPER_COMMON_FOLDER + '/js/SimIFrameClient.js',
  '../' + WRAPPER_COMMON_FOLDER + '/js/WrapperTypes.js',
  '../' + WRAPPER_COMMON_FOLDER + '/js/assert.js',
  '../' + WRAPPER_COMMON_FOLDER + '/js/WrapperUtils.js',
  '../tandem/js/PhetioIDUtils.js'
];

const LIB_OUTPUT_FILE = 'phet-io.js';
const LIB_COPYRIGHT_HEADER = '// Copyright 2002-2017, University of Colorado Boulder\n' +
                             '// This PhET-iO file requires a license\n' +
                             '// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                             '// For licensing, please contact phethelp@colorado.edu';

// All libraries and third party files that are used by phet-io wrappers, and need to be copied over for a build
const CONTRIB_FILES = [
  '../sherpa/lib/lodash-4.17.4.min.js',
  '../sherpa/lib/ua-parser-0.7.12.min.js',
  '../sherpa/lib/bootstrap-2.2.2.js',
  '../sherpa/lib/font-awesome-4.5.0',
  '../sherpa/lib/jquery-2.1.0.min.js',
  '../sherpa/lib/jquery-ui-1.8.24.min.js',
  '../sherpa/lib/d3-4.2.2.js'
];

// list of files to run jsdoc generation with. Assume that anything in the public lib file needs documentation
const JSDOC_FILES = LIB_FILES.concat( [
  ' ../phet-io/js/phet-io-initialize-globals.js'
] );

module.exports = async function( repo, version ) {

  const buildDir = `../${repo}/build/phet-io`;

  // The filter that we run every phet-io wrapper file through to transform dev content into built content. This mainly
  // involves lots of hard coded copy replace of template strings and marker values.
  let filterWrapper = function( abspath, contents ) {
    let originalContents = contents + '';

    if ( abspath.indexOf( '.html' ) >= 0 ) {

      // change the paths of sherpa files to point to the contrib/ folder
      CONTRIB_FILES.forEach( function( filePath ) {

        // No need to do this is this file doesn't have this contrib import in it.
        if ( contents.indexOf( filePath ) >= 0 ) {

          let filePathParts = filePath.split( '/' );

          // If the file is in a dedicated wrapper repo, then it is one level higher in the dir tree, and needs 1 less set of dots.
          // see https://github.com/phetsims/phet-io-wrappers/issues/17 for more info. This is hopefully a temporary workaround
          let eliminateExtraDotsForDedicatedWrappers = abspath.indexOf( DEDICATED_REPO_WRAPPER_PREFIX ) >= 0;
          let fileName = filePathParts[ filePathParts.length - 1 ];
          let contribFileName = 'contrib/' + fileName;
          let pathToContrib = eliminateExtraDotsForDedicatedWrappers ? '../../' + contribFileName : '../' + contribFileName;
          contents = ChipperStringUtils.replaceAll( contents, filePath, pathToContrib );
        }
      } );

      /*
       * Remove individual common phet-io code imports because they are all in phetio.js
       */

      // TODO: use LIB_FILES and/or factor this outs
      // This returns the whole line that contains this substring, so it can be removed
      let firstQueryStringLine = ChipperStringUtils.firstLineThatContains( contents, 'QueryStringMachine.js">' );

      // Don't remove the import if it is coming from the phet-io website, only if it is a relative path in requirejs mode.
      if ( firstQueryStringLine && firstQueryStringLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstQueryStringLine, '' ); // included in phetio.js
      }
      let firstWrapperUtilsLine = ChipperStringUtils.firstLineThatContains( contents, 'WrapperUtils.js">' );
      if ( firstWrapperUtilsLine && firstWrapperUtilsLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstWrapperUtilsLine, '' ); // included in phetio.js
      }
      let firstAssertLine = ChipperStringUtils.firstLineThatContains( contents, 'assert.js">' );
      if ( firstAssertLine && firstAssertLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstAssertLine, '' ); // included in phetio.js
      }
      let firstIFrameClientLine = ChipperStringUtils.firstLineThatContains( contents, 'SimIFrameClient.js">' );
      if ( firstIFrameClientLine && firstIFrameClientLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstIFrameClientLine, '' ); // included in phetio.js
      }
      let firstWrapperTypeLine = ChipperStringUtils.firstLineThatContains( contents, 'WrapperTypes.js">' );
      if ( firstWrapperTypeLine && firstWrapperTypeLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstWrapperTypeLine, '' ); // included in phetio.js
      }
      let firstPhetioIDUtilsLine = ChipperStringUtils.firstLineThatContains( contents, 'PhetioIDUtils.js' );
      if ( firstPhetioIDUtilsLine && firstPhetioIDUtilsLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstPhetioIDUtilsLine, '' ); // included in phetio.js
      }

      // Support wrappers that use code from phet-io-wrappers
      contents = ChipperStringUtils.replaceAll( contents, '/phet-io-wrappers/', '/' );

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
  let wrappers = [
    'phet-io-wrappers/active',
    'phet-io-wrappers/audio',
    'phet-io-wrappers/event-log',
    'phet-io-wrappers/index',
    'phet-io-wrappers/studio',
    'phet-io-wrappers/embedded-recorder',
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
  let wrappersBlacklist = [ '.git', 'README.md', '.gitignore', 'node_modules', 'package.json', 'build' ];

  let libFileNames = LIB_FILES.map( function( filePath ) {
    let parts = filePath.split( '/' );
    return parts[ parts.length - 1 ];
  } );

  // Don't copy over the files that are in the lib file, this way we can catch wrapper bugs that are not pointing to the lib.
  let fullBlacklist = wrappersBlacklist.concat( libFileNames );

  // Make sure to copy the phet-io-wrappers common wrapper code too.
  wrappers.push( WRAPPER_COMMON_FOLDER );
  wrappers.forEach( function( wrapper ) {

    let wrapperParts = wrapper.split( '/' );

    // either take the last path part, or take the first (repo name) and remove the wrapper prefix
    let wrapperName = wrapperParts.length > 1 ? wrapperParts[ wrapperParts.length - 1 ] : wrapperParts[ 0 ].replace( DEDICATED_REPO_WRAPPER_PREFIX, '' );

    // Copy the wrapper into the build dir /wrappers/, exclude the blacklist
    copyDirectory( `../${wrapper}`, `${buildDir}/wrappers/${wrapperName}`, filterWrapper, {
      blacklist: fullBlacklist,
    } );
  } );

  // Create the lib file that is minified and publicly available under the /lib folder of the build
  handleLib( repo, filterWrapper );

  // Create the contrib folder and add to it third party libraries used by wrappers.
  handleContrib( repo );

  // Create the rendered jsdoc in the `doc` folder
  await handleJSDOC( repo );
};

/**
 * Given the list of lib files, apply a filter function to them. Then minify them and consolidate into a single string.
 * Finally write them to the build dir with a license prepended. See https://github.com/phetsims/phet-io/issues/353

 * @param {string} repo
 * @param {Function} filter - the filter function used when copying over wrapper files to fix relative paths and such.
 *                            Has arguments like "function(abspath, contents)"
 */
let handleLib = function( repo, filter ) {
  grunt.log.debug( 'Creating phet-io lib file from: ', LIB_FILES );
  const buildDir = `../${repo}/build/phet-io`;

  grunt.file.mkdir( `${buildDir}/lib` );

  let consolidated = '';
  LIB_FILES.forEach( function( libFile ) {
    let contents = grunt.file.read( libFile );

    let filteredContents = filter && filter( libFile, contents );

    // The filter should return null if nothing changes
    consolidated += filteredContents ? filteredContents : contents;
  } );

  let minified = minify( consolidated );

  grunt.file.write( `${buildDir}/lib/${LIB_OUTPUT_FILE}`, LIB_COPYRIGHT_HEADER + '\n\n' + minified );
};

/**
 * Copy all of the third party libraries from sherpa to the build directory under the 'contrib' folder.
 * @param {string} repo
 */
let handleContrib = function( repo ) {
  grunt.log.debug( 'Creating phet-io contrib folder' );
  const buildDir = `../${repo}/build/phet-io`;

  CONTRIB_FILES.forEach( function( filePath ) {
    let filePathParts = filePath.split( '/' );

    let filename = filePathParts[ filePathParts.length - 1 ];

    grunt.file.copy( filePath, `${buildDir}/contrib/${filename}` );

  } );
};

/**
 * Generate jsdoc and put it in "build/phet-io/doc"
 * @param {string} repo
 * @returns {Promise<void>}
 */
let handleJSDOC = async function( repo ) {
  grunt.log.debug( 'generating jsdoc for phet-io from: ', JSDOC_FILES );
  const buildDir = `../${repo}/build/phet-io`;

  // First we tried to run the jsdoc binary as the cmd, but that wasn't working, and was quite finicky. Then @samreid
  // found https://stackoverflow.com/questions/33664843/how-to-use-jsdoc-with-gulp which recommends the following method
  // (node executable with jsdoc js file)
  await execute( 'node', [ '../chipper/node_modules/jsdoc/jsdoc.js' ].concat(
    JSDOC_FILES.concat( [ '-c', '../phet-io/doc/wrapper/jsdoc-config.json',
      '-d', `${buildDir}/doc/` ] ) ), { cwd: process.cwd(), shell: true } );
};