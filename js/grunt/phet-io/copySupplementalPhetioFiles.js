// Copyright 2016-2020, University of Colorado Boulder

/**
 * Copies all supporting PhET-iO files, including wrappers, indices, lib files, etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Matt Pennington (PhET Interactive Simulations)
 */

'use strict';

// modules
const archiver = require( 'archiver' );
const ChipperStringUtils = require( '../../common/ChipperStringUtils' );
const copyDirectory = require( '../copyDirectory' );
const execute = require( '../execute' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const generatePhetioAPIFiles = require( './generatePhetioAPIFiles' );
const minify = require( '../minify' );

// constants
const DEDICATED_REPO_WRAPPER_PREFIX = 'phet-io-wrapper-';
const WRAPPER_COMMON_FOLDER = 'phet-io-wrappers/common';
const WRAPPERS_FOLDER = 'wrappers/'; // The wrapper index assumes this constant, please see phet-io-wrappers/index/index.js before changing

// phet-io internal files to be consolidated into 1 file and publicly served as a minified phet-io library.
// Make sure to add new files to the jsdoc generation list below also
const LIB_FILES = [
  '../query-string-machine/js/QueryStringMachine.js', // must be first, other types use this
  `../${WRAPPER_COMMON_FOLDER}/js/assert.js`,
  `../${WRAPPER_COMMON_FOLDER}/js/WrapperTypes.js`,
  '../tandem/js/PhetioIDUtils.js',
  `../${WRAPPER_COMMON_FOLDER}/js/Client.js`,
  `../${WRAPPER_COMMON_FOLDER}/js/readFile.js`,
  `../${WRAPPER_COMMON_FOLDER}/js/loadWrapperTemplate.js`
];

const LIB_OUTPUT_FILE = 'phet-io.js';
const LIB_COPYRIGHT_HEADER = '// Copyright 2002-2018, University of Colorado Boulder\n' +
                             '// This PhET-iO file requires a license\n' +
                             '// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.\n' +
                             '// For licensing, please contact phethelp@colorado.edu';

// All libraries and third party files that are used by phet-io wrappers, and need to be copied over for a build
const CONTRIB_FILES = [
  '../sherpa/lib/lodash-4.17.4.min.js',
  '../sherpa/lib/ua-parser-0.7.21.min.js',
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
  '../sherpa/lib/split-1.5.11.min.js',
  '../sherpa/lib/highlight.js-9.1.0/styles/tomorrow-night-bright.css',
  '../sherpa/lib/highlight.js-9.1.0/highlight.js',
  '../phet-core/js/copyWithSortedKeys.js'
];

// List of files to run jsdoc generation with. This list is manual to keep files from sneaking into the public documentation.
const JSDOC_FILES = [
  `../${WRAPPER_COMMON_FOLDER}/js/Client.js`,
  '../tandem/js/PhetioIDUtils.js',
  '../phet-io/js/phet-io-initialize-globals.js',
  '../chipper/js/initialize-globals.js'
];
const JSDOC_README_FILE = '../phet-io/doc/wrapper/phet-io-documentation_README.md';

/**
 * @param {string} repo
 * @param {string} version
 * @param {string} simulationDisplayName
 * @param {Object} packageObject
 * @param {Object} buildLocal
 * @param {Object} [options]
 */
module.exports = async ( repo, version, simulationDisplayName, packageObject, buildLocal, generatePhetioAPIFile = false ) => {

  const buildDir = `../${repo}/build/phet-io/`;
  const wrappersLocation = `${buildDir}${WRAPPERS_FOLDER}`;

  // This regex was copied from perennial's `SimVersion.parse()` consult that code before changing things here.
  const matches = version.match( /^(\d+)\.(\d+)\.(\d+)(-(([^.-]+)\.(\d+)))?(-([^.-]+))?$/ );
  if ( !matches ) {
    throw new Error( `could not parse version: ${version}` );
  }
  const major = parseInt( matches[ 1 ], 10 );
  const minor = parseInt( matches[ 2 ], 10 );
  const latestVersion = `${major}.${minor}`;

  // The filter that we run every phet-io wrapper file through to transform dev content into built content. This mainly
  // involves lots of hard coded copy replace of template strings and marker values.
  const filterWrapper = ( abspath, contents ) => {
    const originalContents = contents + '';

    const isWrapperIndex = abspath.indexOf( 'index/index.html' ) >= 0;
    const isStudioJS = abspath.indexOf( 'studio/studio.js' ) >= 0;

    // For info about LIB_OUTPUT_FILE, see handleLib()
    const pathToLib = `lib/${LIB_OUTPUT_FILE}`;

    if ( abspath.indexOf( '.html' ) >= 0 || isStudioJS ) {

      // change the paths of sherpa files to point to the contrib/ folder
      CONTRIB_FILES.forEach( filePath => {

        // No need to do this is this file doesn't have this contrib import in it.
        if ( contents.indexOf( filePath ) >= 0 ) {

          const filePathParts = filePath.split( '/' );

          // If the file is in a dedicated wrapper repo, then it is one level higher in the dir tree, and needs 1 less set of dots.
          // see https://github.com/phetsims/phet-io-wrappers/issues/17 for more info. This is hopefully a temporary workaround
          const needsExtraDots = abspath.indexOf( DEDICATED_REPO_WRAPPER_PREFIX ) >= 0;
          const fileName = filePathParts[ filePathParts.length - 1 ];
          const contribFileName = `contrib/${fileName}`;
          let pathToContrib = needsExtraDots ? `../../${contribFileName}` : `../${contribFileName}`;

          // The wrapper index is a different case because it is placed at the top level of the build dir.
          if ( isWrapperIndex ) {

            pathToContrib = contribFileName;
            filePath = `../${filePath}`; // filePath has one less set of relative than are actually in the index.html file.
          }
          contents = ChipperStringUtils.replaceAll( contents, filePath, pathToContrib );
        }
      } );

      // Remove individual common phet-io code imports because they are all in phet-io.js
      // NOTE: don't use Array.prototype.forEach here. After bashing my head against a wall I think it is because of
      // race conditions editing `contents`.
      for ( let i = 0; i < LIB_FILES.length; i++ ) {
        const filePath = LIB_FILES[ i ];
        const fileName = filePath.slice( filePath.lastIndexOf( '/' ) + 1 ); // plus one to not include the slash

        // a newline at the end of this regex breaks it. Likely because the "$" matches the newline. I tried `\n` and `\\n`
        const regExp = new RegExp( `^.*/js/${fileName}".*$`, 'gm' );
        contents = contents.replace( regExp, '' );
      }

      // Support wrappers that use code from phet-io-wrappers
      contents = ChipperStringUtils.replaceAll( contents, '/phet-io-wrappers/', '/' );

      // Don't use ChipperStringUtils because we want to capture the relative path and transfer it to the new script.
      // This is to support providing the relative path through the build instead of just hard coding it.
      contents = contents.replace(
        /<!--(<script src="[./]*\{\{PATH_TO_LIB_FILE}}".*><\/script>)-->/g, // '.*' is to support `data-client-name` in wrappers like "multi"
        '$1' // just uncomment, dont fill it in yet
      );
      contents = ChipperStringUtils.replaceAll( contents, '{{PATH_TO_LIB_FILE}}', pathToLib );

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

    // Special handling for studio paths since it is not nested under phet-io-wrappers
    if ( abspath.indexOf( 'studio/index.html' ) >= 0 ) {
      contents = ChipperStringUtils.replaceAll( contents, '<script src="../contrib/', '<script src="../../contrib/' );
    }

    if ( contents !== originalContents ) {
      return contents;
    }
    else {
      return null; // signify no change (helps for images)
    }
  };

  // a list of the phet-io wrappers that are built with the phet-io sim
  let wrappers = fs.readFileSync( '../chipper/data/wrappers', 'utf-8' ).trim().split( '\n' ).map( wrappers => wrappers.trim() );

  // Files and directories from wrapper folders that we don't want to copy
  const wrappersBlacklist = [ '.git', 'README.md', '.gitignore', 'node_modules', 'package.json', 'build' ];

  const libFileNames = LIB_FILES.map( filePath => {
    const parts = filePath.split( '/' );
    return parts[ parts.length - 1 ];
  } );

  // Don't copy over the files that are in the lib file, this way we can catch wrapper bugs that are not pointing to the lib.
  const fullBlacklist = wrappersBlacklist.concat( libFileNames );

  // wrapping function for copying the wrappers to the build dir
  const copyWrapper = ( src, dest, wrapper, wrapperName ) => {

    const wrapperFilterWithNameFilter = ( abspath, contents ) => {
      const result = filterWrapper( abspath, contents );

      // Support loading relative-path resources, like
      //{ url: '../phet-io-wrapper-hookes-law-energy/sounds/precipitate-chimes-v1-shorter.mp3' }
      // -->
      //{ url: 'wrappers/hookes-law-energy/sounds/precipitate-chimes-v1-shorter.mp3' }
      if ( wrapper && wrapperName && result ) {
        return ChipperStringUtils.replaceAll( result, `../${wrapper}/`, `wrappers/${wrapperName}/` );
      }
      return result;
    };
    copyDirectory( src, dest, wrapperFilterWithNameFilter, {
      blacklist: fullBlacklist,
      minifyJS: true,
      minifyOptions: {
        stripAssertions: false
      }
    } );
  };

  // Make sure to copy the phet-io-wrappers common wrapper code too.
  wrappers.push( WRAPPER_COMMON_FOLDER );

  // Add sim-specific wrappers
  wrappers = packageObject.phet &&
             packageObject.phet[ 'phet-io' ] &&
             packageObject.phet[ 'phet-io' ].wrappers ?
             wrappers.concat( packageObject.phet[ 'phet-io' ].wrappers ) : wrappers;

  wrappers.forEach( wrapper => {

    const wrapperParts = wrapper.split( '/' );

    // either take the last path part, or take the first (repo name) and remove the wrapper prefix
    const wrapperName = wrapperParts.length > 1 ? wrapperParts[ wrapperParts.length - 1 ] : wrapperParts[ 0 ].replace( DEDICATED_REPO_WRAPPER_PREFIX, '' );

    // Copy the wrapper into the build dir /wrappers/, exclude the blacklist
    copyWrapper( `../${wrapper}`, `${wrappersLocation}${wrapperName}`, wrapper, wrapperName );
  } );

  // Copy the wrapper index into the top level of the build dir, exclude the blacklist
  copyWrapper( '../phet-io-wrappers/index', `${buildDir}`, null, null );

  // Create the lib file that is minified and publicly available under the /lib folder of the build
  handleLib( buildDir, filterWrapper );

  // Create the zipped file that holds all needed items to run PhET-iO offline
  await handleOfflineArtifact( buildDir, repo, version );

  // Create the contrib folder and add to it third party libraries used by wrappers.
  handleContrib( buildDir );

  // Create the rendered jsdoc in the `doc` folder
  await handleJSDOC( buildDir );

  if ( generatePhetioAPIFile ) {
    const fullAPI = await generatePhetioAPIFiles( repo, buildLocal.localTestingURL );
    grunt.file.write( `${buildDir}${repo}-phet-io-api.json`, fullAPI );
  }
};

/**
 * Given the list of lib files, apply a filter function to them. Then minify them and consolidate into a single string.
 * Finally write them to the build dir with a license prepended. See https://github.com/phetsims/phet-io/issues/353

 * @param {string} buildDir
 * @param {Function} filter - the filter function used when copying over wrapper files to fix relative paths and such.
 *                            Has arguments like "function(abspath, contents)"
 */
const handleLib = ( buildDir, filter ) => {
  grunt.log.debug( 'Creating phet-io lib file from: ', LIB_FILES );

  grunt.file.mkdir( `${buildDir}lib` );

  let consolidated = '';
  LIB_FILES.forEach( libFile => {
    const contents = grunt.file.read( libFile );

    const filteredContents = filter && filter( libFile, contents );

    // The filter should return null if nothing changes
    consolidated += filteredContents ? filteredContents : contents;
  } );

  const minified = minify( consolidated, {
    stripAssertions: false
  } );

  grunt.file.write( `${buildDir}lib/${LIB_OUTPUT_FILE}`, `${LIB_COPYRIGHT_HEADER}\n\n${minified}` );
};

/**
 * Copy all of the third party libraries from sherpa to the build directory under the 'contrib' folder.
 * @param {string} buildDir
 */
const handleContrib = buildDir => {
  grunt.log.debug( 'Creating phet-io contrib folder' );

  CONTRIB_FILES.forEach( filePath => {
    const filePathParts = filePath.split( '/' );
    const filename = filePathParts[ filePathParts.length - 1 ];

    grunt.file.copy( filePath, `${buildDir}contrib/${filename}` );

  } );
};

/**
 * Combine the files necessary to run and host PhET-iO locally into a zip that can be easily downloaded by the client.
 * This does not include any documentation, or wrapper suite wrapper examples.
 * @param {string} buildDir
 * @param {string} repo
 * @param {string} version
 * @returns {Promise<void>}
 */
const handleOfflineArtifact = async ( buildDir, repo, version ) => {

  const output = fs.createWriteStream( `${buildDir}${repo}-phet-io-${version}.zip` );
  const archive = archiver( 'zip' );

  archive.on( 'error', err => grunt.fail.fatal( 'error creating archive: ' + err ) );

  archive.pipe( output );
  archive.directory( `${buildDir}lib`, 'lib' ); // copy over the lib directory and its contents

  // get the all html and the debug version too, use `cwd` so that they are at the top level of the zip.
  archive.glob( `${repo}*all*.html`, { cwd: `${buildDir}` } );
  archive.finalize();

  return new Promise( resolve => output.on( 'close', resolve ) );
};

/**
 * Generate jsdoc and put it in "build/phet-io/doc"
 * @param {string} buildDir
 * @returns {Promise<void>}
 */
const handleJSDOC = async buildDir => {

  // Make sure each file exists
  for ( let i = 0; i < JSDOC_FILES.length; i++ ) {
    if ( !fs.existsSync( JSDOC_FILES[ i ] ) ) {
      throw new Error( `file doesnt exist: ${JSDOC_FILES[ i ]}` );
    }
  }

  const args = [
    '../chipper/node_modules/jsdoc/jsdoc.js',
    ...JSDOC_FILES,
    '-c', '../phet-io/doc/wrapper/jsdoc-config.json',
    '-d', `${buildDir}doc/`,
    '--readme', JSDOC_README_FILE
  ];

  // First we tried to run the jsdoc binary as the cmd, but that wasn't working, and was quite finicky. Then @samreid
  // found https://stackoverflow.com/questions/33664843/how-to-use-jsdoc-with-gulp which recommends the following method
  // (node executable with jsdoc js file)
  await execute( 'node', args, {
    cwd: process.cwd(),
    shell: true
  } );
};