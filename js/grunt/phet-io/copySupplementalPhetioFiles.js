// Copyright 2016, University of Colorado Boulder

/**
 * Copies all supporting PhET-iO files, including wrappers, indices, lib files, etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Matt Pennington (PhET Interactive Simulations)
 */

'use strict';

// modules
const ChipperStringUtils = require( '../../common/ChipperStringUtils' );
const copyDirectory = require( '../copyDirectory' );
const execute = require( '../execute' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const minify = require( '../minify' );

// constants
const DEDICATED_REPO_WRAPPER_PREFIX = 'phet-io-wrapper-';
const WRAPPER_COMMON_FOLDER = 'phet-io-wrappers/common';
const PRODUCTION_SITE = 'phet-io.colorado.edu';
const WRAPPERS_FOLDER = 'wrappers/'; // The wrapper index assumes this constant, please see phet-io-wrappers/index/index.js before changing

// phet-io internal files to be consolidated into 1 file and publicly served as a minified phet-io library.
// Make sure to add new files to the jsdoc generation list below also
const LIB_FILES = [
  '../query-string-machine/js/QueryStringMachine.js', // must be first, other types use this
  '../' + WRAPPER_COMMON_FOLDER + '/js/assert.js',
  '../' + WRAPPER_COMMON_FOLDER + '/js/WrapperTypes.js',
  '../tandem/js/PhetioIDUtils.js',
  '../' + WRAPPER_COMMON_FOLDER + '/js/Client.js',
  '../' + WRAPPER_COMMON_FOLDER + '/js/readFile.js',
  '../' + WRAPPER_COMMON_FOLDER + '/js/loadTemplate.js'
];

const LIB_OUTPUT_FILE = 'phet-io.js';
const LIB_COPYRIGHT_HEADER = '// Copyright 2002-2018, University of Colorado Boulder\n' +
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
  '../sherpa/lib/d3-4.2.2.js',
  '../sherpa/lib/highlight.js-9.1.0/styles/tomorrow-night-bright.css',
  '../sherpa/lib/highlight.js-9.1.0/highlight.js',
  '../sherpa/lib/jsondiffpatch-v0.3.11.umd.js',
  '../sherpa/lib/jsondiffpatch-v0.3.11-annotated.css',
  '../sherpa/lib/jsondiffpatch-v0.3.11-html.css',
  '../sherpa/lib/split-1.5.9.min.js',
  '../sherpa/lib/highlight.js-9.1.0/styles/tomorrow-night-bright.css',
  '../sherpa/lib/highlight.js-9.1.0/highlight.js',
  '../phet-core/js/copyWithSortedKeys.js'
];

// List of files to run jsdoc generation with. This list is manual to keep files from sneaking into the public documentation.
const JSDOC_FILES = [
  '../' + WRAPPER_COMMON_FOLDER + '/js/Client.js',
  '../tandem/js/PhetioIDUtils.js',
  '../phet-io/js/phet-io-initialize-globals.js',
  '../chipper/js/initialize-globals.js'
];
const JSDOC_README_FILE = '../phet-io/doc/wrapper/phet-io-documentation_README.md';

module.exports = async function( repo, version, simulationDisplayName ) {

  const buildDir = `../${repo}/build/phet-io/`;
  const wrappersLocation = `${buildDir}${WRAPPERS_FOLDER}`;


  // This regex was copied from perennial's `SimVersion.parse()` consult that code before changing things here.
  const matches = version.match( /^(\d+)\.(\d+)\.(\d+)(-(([^\.-]+)\.(\d+)))?(-([^.-]+))?$/ );
  if ( !matches ) {
    throw new Error( 'could not parse version: ' + version );
  }
  const major = parseInt( matches[ 1 ], 10 );
  const minor = parseInt( matches[ 2 ], 10 );
  const latestVersion = `${major}.${minor}`;

  // The filter that we run every phet-io wrapper file through to transform dev content into built content. This mainly
  // involves lots of hard coded copy replace of template strings and marker values.
  const filterWrapper = function( abspath, contents ) {
    const originalContents = contents + '';

    const isWrapperIndex = abspath.indexOf( 'index/index.html' ) >= 0;
    const isStudioJS = abspath.indexOf( 'studio/studio.js' ) >= 0;

    // For info about LIB_OUTPUT_FILE, see handleLib()
    let pathToLib = `lib/${LIB_OUTPUT_FILE}`;

    if ( abspath.indexOf( '.html' ) >= 0 || isStudioJS ) {

      // change the paths of sherpa files to point to the contrib/ folder
      CONTRIB_FILES.forEach( function( filePath ) {

        // No need to do this is this file doesn't have this contrib import in it.
        if ( contents.indexOf( filePath ) >= 0 ) {

          const filePathParts = filePath.split( '/' );

          // If the file is in a dedicated wrapper repo, then it is one level higher in the dir tree, and needs 1 less set of dots.
          // see https://github.com/phetsims/phet-io-wrappers/issues/17 for more info. This is hopefully a temporary workaround
          const needsExtraDots = abspath.indexOf( DEDICATED_REPO_WRAPPER_PREFIX ) >= 0;
          const fileName = filePathParts[ filePathParts.length - 1 ];
          const contribFileName = 'contrib/' + fileName;
          let pathToContrib = needsExtraDots ? '../../' + contribFileName : '../' + contribFileName;

          // The wrapper index is a different case because it is placed at the top level of the build dir.
          if ( isWrapperIndex ) {

            pathToContrib = contribFileName;
            filePath = '../' + filePath; // filePath has one less set of relative than are actually in the index.html file.
          }
          contents = ChipperStringUtils.replaceAll( contents, filePath, pathToContrib );
        }
      } );

      /*
       * Remove individual common phet-io code imports because they are all in phetio.js
       */

      // TODO: use LIB_FILES and/or factor this outs
      // This returns the whole line that contains this substring, so it can be removed
      const firstQueryStringLine = ChipperStringUtils.firstLineThatContains( contents, 'QueryStringMachine.js">' );

      // Don't remove the import if it is coming from the phet-io website, only if it is a relative path in requirejs mode.
      if ( firstQueryStringLine && firstQueryStringLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstQueryStringLine, '' ); // included in phetio.js
      }
      const firstAssertLine = ChipperStringUtils.firstLineThatContains( contents, 'assert.js">' );
      if ( firstAssertLine && firstAssertLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstAssertLine, '' ); // included in phetio.js
      }
      const firstIFrameClientLine = ChipperStringUtils.firstLineThatContains( contents, 'Client.js">' );
      if ( firstIFrameClientLine && firstIFrameClientLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstIFrameClientLine, '' ); // included in phetio.js
      }

      // Bundle in readFile and loadTemplate so they can be used uniformly by index (in root location) and wrappers (nested locations)
      const firstReadFileLine = ChipperStringUtils.firstLineThatContains( contents, 'readFile.js">' );
      if ( firstReadFileLine && firstReadFileLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstReadFileLine, '' ); // included in phetio.js
      }
      const firstLoadTemplateLine = ChipperStringUtils.firstLineThatContains( contents, 'loadTemplate.js">' );
      if ( firstLoadTemplateLine && firstLoadTemplateLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstLoadTemplateLine, '' ); // included in phetio.js
      }
      const firstWrapperTypeLine = ChipperStringUtils.firstLineThatContains( contents, 'WrapperTypes.js">' );
      if ( firstWrapperTypeLine && firstWrapperTypeLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstWrapperTypeLine, '' ); // included in phetio.js
      }
      const firstPhetioIDUtilsLine = ChipperStringUtils.firstLineThatContains( contents, 'PhetioIDUtils.js' );
      if ( firstPhetioIDUtilsLine && firstPhetioIDUtilsLine.indexOf( PRODUCTION_SITE ) === -1 ) {
        contents = ChipperStringUtils.replaceAll( contents, firstPhetioIDUtilsLine, '' ); // included in phetio.js
      }

      // Support wrappers that use code from phet-io-wrappers
      contents = ChipperStringUtils.replaceAll( contents, '/phet-io-wrappers/', '/' );

      // wrapper index is moved to the top level of build dir, and needs no relative dots.
      pathToLib = isWrapperIndex ? pathToLib : `../../${pathToLib}`;
      contents = ChipperStringUtils.replaceAll( contents,
        '<!--{{phet-io.js}}-->',
        `<script src="${pathToLib}"></script>`
      );

      // This must be after the above phet-io.js import and Client.js stripping. This case is to support wrappers
      // that use the data-client-name attribute to dictate their own Type name.
      contents = ChipperStringUtils.replaceAll( contents,
        '../common/js/Client.js',
        `${pathToLib}`
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
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_DISPLAY_NAME}}', simulationDisplayName );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_DISPLAY_NAME_ESCAPED}}', simulationDisplayName.replace( /'/g, '\\\'' ) );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_VERSION}}', version );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_LATEST_VERSION}}', latestVersion );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_IS_BUILT}}', 'true' );
      contents = ChipperStringUtils.replaceAll( contents, '{{LIB_OUTPUT_FILE}}', LIB_OUTPUT_FILE );
      contents = ChipperStringUtils.replaceAll( contents, '{{PHET_IO_LIB_RELATIVE_PATH}}', pathToLib );
      contents = ChipperStringUtils.replaceAll( contents, '{{Built API Docs not available in RequireJS mode}}', 'API Docs' );

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

// a list of the phet-io wrappers that are built with the phet-io sim
  const wrappers = fs.readFileSync( '../chipper/data/wrappers', 'utf-8' ).trim().split( '\n' ).map( wrappers => wrappers.trim() );

  // Files and directories from wrapper folders that we don't want to copy
  const wrappersBlacklist = [ '.git', 'README.md', '.gitignore', 'node_modules', 'package.json', 'build' ];

  const libFileNames = LIB_FILES.map( function( filePath ) {
    const parts = filePath.split( '/' );
    return parts[ parts.length - 1 ];
  } );

  // Don't copy over the files that are in the lib file, this way we can catch wrapper bugs that are not pointing to the lib.
  const fullBlacklist = wrappersBlacklist.concat( libFileNames );

  // wrapping function for copying the wrappers to the build dir
  const copyWrapper = function( src, dest ) {
    copyDirectory( src, dest, filterWrapper, {
      blacklist: fullBlacklist,
      minifyJS: true,
      minifyOptions: {
        stripAssertions: false
      }
    } );
  };

  // Make sure to copy the phet-io-wrappers common wrapper code too.
  wrappers.push( WRAPPER_COMMON_FOLDER );
  wrappers.forEach( function( wrapper ) {

    const wrapperParts = wrapper.split( '/' );

    // either take the last path part, or take the first (repo name) and remove the wrapper prefix
    const wrapperName = wrapperParts.length > 1 ? wrapperParts[ wrapperParts.length - 1 ] : wrapperParts[ 0 ].replace( DEDICATED_REPO_WRAPPER_PREFIX, '' );

    // Copy the wrapper into the build dir /wrappers/, exclude the blacklist
    copyWrapper( `../${wrapper}`, `${wrappersLocation}${wrapperName}` );
  } );

  // Copy the wrapper index into the top level of the build dir, exclude the blacklist
  copyWrapper( '../phet-io-wrappers/index', `${buildDir}` );

  // Create the lib file that is minified and publicly available under the /lib folder of the build
  handleLib( buildDir, filterWrapper );

  // Create the contrib folder and add to it third party libraries used by wrappers.
  handleContrib( buildDir );

  // Create the rendered jsdoc in the `doc` folder
  await handleJSDOC( buildDir );
};

/**
 * Given the list of lib files, apply a filter function to them. Then minify them and consolidate into a single string.
 * Finally write them to the build dir with a license prepended. See https://github.com/phetsims/phet-io/issues/353

 * @param {string} buildDir
 * @param {Function} filter - the filter function used when copying over wrapper files to fix relative paths and such.
 *                            Has arguments like "function(abspath, contents)"
 */
const handleLib = function( buildDir, filter ) {
  grunt.log.debug( 'Creating phet-io lib file from: ', LIB_FILES );

  grunt.file.mkdir( `${buildDir}lib` );

  let consolidated = '';
  LIB_FILES.forEach( function( libFile ) {
    const contents = grunt.file.read( libFile );

    const filteredContents = filter && filter( libFile, contents );

    // The filter should return null if nothing changes
    consolidated += filteredContents ? filteredContents : contents;
  } );

  const minified = minify( consolidated, {
    stripAssertions: false
  } );

  grunt.file.write( `${buildDir}lib/${LIB_OUTPUT_FILE}`, LIB_COPYRIGHT_HEADER + '\n\n' + minified );
};

/**
 * Copy all of the third party libraries from sherpa to the build directory under the 'contrib' folder.
 * @param {string} buildDir
 */
const handleContrib = function( buildDir ) {
  grunt.log.debug( 'Creating phet-io contrib folder' );

  CONTRIB_FILES.forEach( function( filePath ) {
    const filePathParts = filePath.split( '/' );

    const filename = filePathParts[ filePathParts.length - 1 ];

    grunt.file.copy( filePath, `${buildDir}contrib/${filename}` );

  } );
};

/**
 * Generate jsdoc and put it in "build/phet-io/doc"
 * @param {string} buildDir
 * @returns {Promise<void>}
 */
const handleJSDOC = async function( buildDir ) {

  // Make sure each file exists
  for ( let i = 0; i < JSDOC_FILES.length; i++ ) {
    if ( !fs.existsSync( JSDOC_FILES[ i ] ) ) {
      throw new Error( 'file doesnt exist: ' + JSDOC_FILES[ i ] );
    }
  }

  // First we tried to run the jsdoc binary as the cmd, but that wasn't working, and was quite finicky. Then @samreid
  // found https://stackoverflow.com/questions/33664843/how-to-use-jsdoc-with-gulp which recommends the following method
  // (node executable with jsdoc js file)
  await execute( 'node', [ '../chipper/node_modules/jsdoc/jsdoc.js' ].concat(
    JSDOC_FILES.concat( [ '-c', '../phet-io/doc/wrapper/jsdoc-config.json',
      '-d', `${buildDir}doc/`, '--readme', JSDOC_README_FILE ] ) ),
    { cwd: process.cwd(), shell: true } );
};