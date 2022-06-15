// Copyright 2016-2022, University of Colorado Boulder

/**
 * Copies all supporting PhET-iO files, including wrappers, indices, lib files, etc.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Matt Pennington (PhET Interactive Simulations)
 */


// modules
const assert = require( 'assert' );
const archiver = require( 'archiver' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const copyDirectory = require( '../grunt/copyDirectory' );
const execute = require( '../../../perennial-alias/js/common/execute' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const generatePhetioMacroAPI = require( '../phet-io/generatePhetioMacroAPI' );
const formatPhetioAPI = require( '../phet-io/formatPhetioAPI' );
const buildStandalone = require( '../grunt/buildStandalone' );
const minify = require( '../grunt/minify' );
const marked = require( 'marked' );
const tsc = require( './tsc' );
const reportTscResults = require( './reportTscResults' );
const Transpiler = require( '../common/Transpiler' );
const getPhetLibs = require( './getPhetLibs' );
const path = require( 'path' );
const webpack = require( 'webpack' );

// constants
const DEDICATED_REPO_WRAPPER_PREFIX = 'phet-io-wrapper-';
const WRAPPER_COMMON_FOLDER = 'phet-io-wrappers/common';
const WRAPPERS_FOLDER = 'wrappers/'; // The wrapper index assumes this constant, please see phet-io-wrappers/index/index.js before changing
const CONTRIB_DIR = 'contrib';

// For Client Guides
const PHET_IO_SIM_SPECIFIC = '../phet-io-sim-specific';
const GUIDES_COMMON_DIR = 'client-guide-common/client-guide';

const EXAMPLES_FILENAME = 'examples';
const PHET_IO_GUIDE_FILENAME = 'phet-io-guide';
const PHET_IO_MIGRATION_GUIDE_FILENAME = 'migration-guide';

const LIB_OUTPUT_FILE = 'phet-io.js';

const CONTRIB_LIB_FILES = [
  '../sherpa/lib/react-18.1.0.production.min.js',
  '../sherpa/lib/react-dom-18.1.0.production.min.js'
];

// phet-io internal files to be consolidated into 1 file and publicly served as a minified phet-io library.
// Make sure to add new files to the jsdoc generation list below also
const PHET_IO_LIB_FILES = [
  '../query-string-machine/js/QueryStringMachine.js', // must be first, other types use this
  '../assert/js/assert.js',
  '../chipper/js/phet-io/phetioCompareAPIs.js',
  '../tandem/js/PhetioIDUtils.js'
];

const OFFLINE_CONTRIB_FILES = [
  '../sherpa/lib/lodash-4.17.4.min.js',
  '../sherpa/lib/pako-2.0.3/pako-2.0.3.min.js',
  '../sherpa/lib/pako-2.0.3/pako_inflate-2.0.3.min.js'
];

// All libraries and third party files that are used by phet-io wrappers, and need to be copied over for a build
const CONTRIB_FILES = [
  '../sherpa/lib/ua-parser-0.7.21.min.js',
  '../sherpa/lib/bootstrap-2.2.2.js',
  '../sherpa/lib/font-awesome-4.5.0',
  '../sherpa/lib/jquery-2.1.0.min.js',
  '../sherpa/lib/jquery-ui-1.8.24.min.js',
  '../sherpa/lib/d3-4.2.2.js',
  '../sherpa/lib/jsondiffpatch-v0.3.11.umd.js',
  '../sherpa/lib/jsondiffpatch-v0.3.11-annotated.css',
  '../sherpa/lib/jsondiffpatch-v0.3.11-html.css',
  '../sherpa/lib/prism-1.23.0.js',
  '../sherpa/lib/prism-okaidia-1.23.0.css',
  '../sherpa/lib/clarinet-0.12.4.js'
].concat( OFFLINE_CONTRIB_FILES );

// List of files to run jsdoc generation with. This list is manual to keep files from sneaking into the public documentation.
const JSDOC_FILES = [
  `../${WRAPPER_COMMON_FOLDER}/js/Client.js`,
  '../tandem/js/PhetioIDUtils.js',
  '../phet-io/js/phet-io-initialize-globals.js',
  '../chipper/js/initialize-globals.js'
];
const JSDOC_README_FILE = '../phet-io/doc/wrapper/phet-io-documentation_README.md';

const STUDIO_BUILT_FILENAME = 'studio.min.js';

/**
 * @param {string} repo
 * @param {string} version
 * @param {string} simulationDisplayName
 * @param {Object} packageObject
 * @param {Object} buildLocal
 * @param {boolean} [generateMacroAPIFile]
 */
module.exports = async ( repo, version, simulationDisplayName, packageObject, buildLocal, generateMacroAPIFile = false ) => {

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
    const originalContents = `${contents}`;

    const isWrapperIndex = abspath.indexOf( 'index/index.html' ) >= 0;

    // For info about LIB_OUTPUT_FILE, see handleLib()
    const pathToLib = `lib/${LIB_OUTPUT_FILE}`;

    if ( abspath.indexOf( '.html' ) >= 0 ) {

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

      const includesElement = ( line, array ) => !!array.find( element => line.includes( element ) );

      // Remove files listed in CONTRIB_LIB_FILES
      contents = contents.split( /\r?\n/ ).filter( line => !includesElement( line, CONTRIB_LIB_FILES ) ).join( '\n' );

      // Remove individual common phet-io code imports because they are all in phet-io.js
      // NOTE: don't use Array.prototype.forEach here. After bashing my head against a wall I think it is because of
      // race conditions editing `contents`.
      for ( let i = 0; i < PHET_IO_LIB_FILES.length; i++ ) {
        const filePath = PHET_IO_LIB_FILES[ i ];
        const SOURCE_DIR = 'js/';
        const lastIndex = filePath.lastIndexOf( SOURCE_DIR );
        assert( lastIndex >= 0, 'paths should contain ' + SOURCE_DIR );
        const fileName = filePath.slice( lastIndex + SOURCE_DIR.length ); // don't include the 'js/'

        // a newline at the end of this regex breaks it. Likely because the "$" matches the newline. I tried `\n` and `\\n`
        const regExp = new RegExp( `^.*/js/${fileName}".*$`, 'gm' );
        contents = contents.replace( regExp, '' );
      }

      // Delete the imports the phet-io-wrappers-main, as it will be bundled with the phet-io.js lib file.
      // MUST GO BEFORE BELOW REPLACE: 'phet-io-wrappers/' -> '/'
      contents = contents.replace(
        /<script type="module" src="(..\/)+chipper\/dist\/js\/phet-io-wrappers\/js\/phet-io-wrappers-main.js"><\/script>/g, // '.*' is to support `data-client-name` in wrappers like "multi"
        '' );

      // Support wrappers that use code from phet-io-wrappers
      contents = ChipperStringUtils.replaceAll( contents, '/phet-io-wrappers/', '/' );

      // Don't use ChipperStringUtils because we want to capture the relative path and transfer it to the new script.
      // This is to support providing the relative path through the build instead of just hard coding it.
      contents = contents.replace(
        /<!--(<script src="[./]*\{\{PATH_TO_LIB_FILE}}".*><\/script>)-->/g, // '.*' is to support `data-client-name` in wrappers like "multi"
        '$1' // just uncomment, dont fill it in yet
      );

      contents = ChipperStringUtils.replaceAll( contents,
        '<!--{{GOOGLE_ANALYTICS.js}}-->',
        '<script src="/assets/js/phet-io-ga.js"></script>'
      );
      contents = ChipperStringUtils.replaceAll( contents,
        '<!--{{FAVICON.ico}}-->',
        '<link rel="shortcut icon" href="/assets/favicon.ico"/>'
      );

      // There should not be any imports of Client directly except using the "multi-wrapper" functionality of
      // providing a ?clientName, for unbuilt only, so we remove it here.
      contents = contents.replace(
        /^.*\/common\/js\/Client.js.*$/mg,
        ''
      );
    }
    if ( abspath.indexOf( '.js' ) >= 0 || abspath.indexOf( '.html' ) >= 0 ) {
      contents = ChipperStringUtils.replaceAll( contents, '{{PATH_TO_LIB_FILE}}', pathToLib ); // This must be after the script replacement that uses this variable above.
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_NAME}}', repo );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_DISPLAY_NAME}}', simulationDisplayName );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_DISPLAY_NAME_ESCAPED}}', simulationDisplayName.replace( /'/g, '\\\'' ) );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_VERSION}}', version );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_LATEST_VERSION}}', latestVersion );
      contents = ChipperStringUtils.replaceAll( contents, '{{SIMULATION_IS_BUILT}}', 'true' );
      contents = ChipperStringUtils.replaceAll( contents, '{{PHET_IO_LIB_RELATIVE_PATH}}', pathToLib );
      contents = ChipperStringUtils.replaceAll( contents, '{{Built API Docs not available in unbuilt mode}}', 'API Docs' );

      // phet-io-wrappers/common will be in the top level of wrappers/ in the build directory
      contents = ChipperStringUtils.replaceAll( contents, `${WRAPPER_COMMON_FOLDER}/`, 'common/' );
    }

    if ( isWrapperIndex ) {
      const getGuideRowText = ( fileName, linkText, description ) => {
        return fs.existsSync( `${PHET_IO_SIM_SPECIFIC}/repos/${repo}/client-guide/${fileName}.md` ) ? `<tr>
        <td><a href="doc/guides/${fileName}.html">${linkText}</a>
        </td>
        <td>${description}</td>
      </tr>` : '';
      };

      contents = ChipperStringUtils.replaceAll( contents, '{{PHET_IO_GUIDE_ROW}}',
        getGuideRowText( PHET_IO_GUIDE_FILENAME, 'PhET-iO Guide',
          'Documentation for instructional designers about best practices for simulation customization with PhET-iO Studio.' ) );
      contents = ChipperStringUtils.replaceAll( contents, '{{EXAMPLES_ROW}}',
        getGuideRowText( EXAMPLES_FILENAME, 'Examples',
          'Provides instructions and the specific phetioIDs for customizing the simulation.' ) );
      contents = ChipperStringUtils.replaceAll( contents, '{{MIGRATION_GUIDE_ROW}}',
        getGuideRowText( PHET_IO_MIGRATION_GUIDE_FILENAME, 'Migration Guide',
          'Provides a list of changes that have occurred to the API since the previous version.' ) );
    }

    // Special handling for studio paths since it is not nested under phet-io-wrappers
    if ( abspath.indexOf( 'studio/index.html' ) >= 0 ) {
      contents = ChipperStringUtils.replaceAll( contents, '<script src="../contrib/', '<script src="../../contrib/' );
      contents = ChipperStringUtils.replaceAll( contents, '<script type="module" src="../chipper/dist/js/studio/js/studio-main.js"></script>',
        `<script src="./${STUDIO_BUILT_FILENAME}"></script>` );

      contents = ChipperStringUtils.replaceAll( contents, '{{PHET_IO_GUIDE_LINK}}', `../../doc/guides/${PHET_IO_GUIDE_FILENAME}.html` );
      contents = ChipperStringUtils.replaceAll( contents, '{{EXAMPLES_LINK}}', `../../doc/guides/${EXAMPLES_FILENAME}.html` );
    }

    // Collapse >1 blank lines in html files.  This helps as a postprocessing step after removing lines with <script> tags
    if ( abspath.endsWith( '.html' ) ) {
      const lines = contents.split( /\r?\n/ );
      const pruned = [];
      for ( let i = 0; i < lines.length; i++ ) {
        if ( i >= 1 &&
             lines[ i - 1 ].trim().length === 0 &&
             lines[ i ].trim().length === 0 ) {

          // skip redundant blank line
        }
        else {
          pruned.push( lines[ i ] );
        }
      }
      contents = pruned.join( '\n' );
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
  const wrappersUnallowed = [ '.git', 'README.md', '.gitignore', 'node_modules', 'package.json', 'build' ];

  const libFileNames = PHET_IO_LIB_FILES.map( filePath => {
    const parts = filePath.split( '/' );
    return parts[ parts.length - 1 ];
  } );

  // Don't copy over the files that are in the lib file, this way we can catch wrapper bugs that are not pointing to the lib.
  const fullUnallowedList = wrappersUnallowed.concat( libFileNames );

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
      exclude: fullUnallowedList,
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

    // Copy the wrapper into the build dir /wrappers/, exclude the excluded list
    copyWrapper( `../${wrapper}`, `${wrappersLocation}${wrapperName}`, wrapper, wrapperName );
  } );

  // Copy the wrapper index into the top level of the build dir, exclude the excluded list
  copyWrapper( '../phet-io-wrappers/index', `${buildDir}`, null, null );

  // Create the lib file that is minified and publicly available under the /lib folder of the build
  await handleLib( repo, buildDir, filterWrapper );

  // Create the zipped file that holds all needed items to run PhET-iO offline. NOTE: this must happen after copying wrapper
  await handleOfflineArtifact( buildDir, repo, version );

  // Create the contrib folder and add to it third party libraries used by wrappers.
  handleContrib( buildDir );

  // Create the rendered jsdoc in the `doc` folder
  await handleJSDOC( buildDir );

  // create the client guides
  handleClientGuides( repo, simulationDisplayName, buildDir );

  await handleStudio( wrappersLocation );

  if ( generateMacroAPIFile ) {
    const fullAPI = ( await generatePhetioMacroAPI( [ repo ], {
      fromBuiltVersion: true
    } ) )[ repo ];
    assert( fullAPI, 'Full API expected but not created from puppeteer step, likely caused by https://github.com/phetsims/chipper/issues/1022.' );
    grunt.file.write( `${buildDir}${repo}-phet-io-api.json`, formatPhetioAPI( fullAPI ) );
  }

  // The nested index wrapper will be broken on build, so get rid of it for clarity
  fs.rmSync( `${wrappersLocation}index/`, { recursive: true } );
};

/**
 * Given the list of lib files, apply a filter function to them. Then minify them and consolidate into a single string.
 * Finally write them to the build dir with a license prepended. See https://github.com/phetsims/phet-io/issues/353

 * @param {string} repo
 * @param {string} buildDir
 * @param {Function} filter - the filter function used when copying over wrapper files to fix relative paths and such.
 *                            Has arguments like "function(abspath, contents)"
 */
const handleLib = async ( repo, buildDir, filter ) => {
  grunt.log.debug( 'Creating phet-io lib file from: ', PHET_IO_LIB_FILES );
  grunt.file.mkdir( `${buildDir}lib` );

  const phetioLibCode = PHET_IO_LIB_FILES.map( libFile => {
    const contents = grunt.file.read( libFile );
    const filteredContents = filter( libFile, contents );

    // The filter returns null if nothing changes
    return filteredContents || contents;
  } ).join( '' );

  const migrationRulesCode = await getCompiledMigrationRules( repo, buildDir );
  const minifiedPhetioCode = minify( `${phetioLibCode}\n${migrationRulesCode}`, { stripAssertions: false } );

  const wrappersMain = await buildStandalone( 'phet-io-wrappers', {} );

  const filteredMain = filter( LIB_OUTPUT_FILE, wrappersMain );

  const mainCopyright = `// Copyright 2002-2022, University of Colorado Boulder
// This PhET-iO file requires a license
// USE WITHOUT A LICENSE AGREEMENT IS STRICTLY PROHIBITED.
// For licensing, please contact phethelp@colorado.edu`;

  grunt.file.write( `${buildDir}lib/${LIB_OUTPUT_FILE}`,
    `${mainCopyright}
// 
// Also contains code under the specified licenses:

${CONTRIB_LIB_FILES.map( contribFile => grunt.file.read( contribFile ) ).join( '\n\n' )}

${mainCopyright}

${minifiedPhetioCode}\n${filteredMain}` );
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
 * @returns {Promise.<void>}
 */
const handleOfflineArtifact = async ( buildDir, repo, version ) => {

  const output = fs.createWriteStream( `${buildDir}${repo}-phet-io-${version}.zip` );
  const archive = archiver( 'zip' );

  archive.on( 'error', err => grunt.fail.fatal( `error creating archive: ${err}` ) );

  archive.pipe( output );

  // copy over the lib directory and its contents, and an index to test. Note that these use the files from the buildDir
  // because they have been post-processed and contain filled in template vars.
  archive.directory( `${buildDir}lib`, 'lib' );

  OFFLINE_CONTRIB_FILES.forEach( contribFile => {
    const contribFileParts = contribFile.split( '/' );
    const contribFileName = contribFileParts[ contribFileParts.length - 1 ];

    archive.file( contribFile, { name: `${CONTRIB_DIR}/${contribFileName}` } );
  } );

  archive.file( `${buildDir}${WRAPPERS_FOLDER}/common/html/offline-example.html`, { name: 'index.html' } );

  // get the all html and the debug version too, use `cwd` so that they are at the top level of the zip.
  archive.glob( `${repo}*all*.html`, { cwd: `${buildDir}` } );
  archive.finalize();

  return new Promise( resolve => output.on( 'close', resolve ) );
};

/**
 * Generate jsdoc and put it in "build/phet-io/doc"
 * @param {string} buildDir
 * @returns {Promise.<void>}
 */
const handleJSDOC = async buildDir => {

  // Make sure each file exists
  for ( let i = 0; i < JSDOC_FILES.length; i++ ) {
    if ( !fs.existsSync( JSDOC_FILES[ i ] ) ) {
      throw new Error( `file doesnt exist: ${JSDOC_FILES[ i ]}` );
    }
  }

  const getArgs = explain => [
    '../chipper/node_modules/jsdoc/jsdoc.js',
    ...( explain ? [ '-X' ] : [] ),
    ...JSDOC_FILES,
    '-c', '../phet-io/doc/wrapper/jsdoc-config.json',
    '-d', `${buildDir}doc/api`,
    '-t', '../chipper/node_modules/docdash',
    '--readme', JSDOC_README_FILE
  ];

  // First we tried to run the jsdoc binary as the cmd, but that wasn't working, and was quite finicky. Then @samreid
  // found https://stackoverflow.com/questions/33664843/how-to-use-jsdoc-with-gulp which recommends the following method
  // (node executable with jsdoc js file)
  await execute( 'node', getArgs( false ), process.cwd(), {
    shell: true
  } );

  // Running with explanation -X appears to not output the files, so we have to run it twice.
  const explanation = ( await execute( 'node', getArgs( true ), process.cwd(), {
    shell: true
  } ) ).trim();

  // Copy the logo file
  const imageDir = `${buildDir}doc/images`;
  if ( !fs.existsSync( imageDir ) ) {
    fs.mkdirSync( imageDir );
  }
  fs.copyFileSync( '../brand/phet-io/images/logoOnWhite.png', `${imageDir}/logo.png` );

  const json = explanation.substring( explanation.indexOf( '[' ), explanation.lastIndexOf( ']' ) + 1 );

  // basic sanity checks
  assert( json.length > 5000, 'JSON seems odd' );
  try {
    JSON.parse( json );
  }
  catch( e ) {
    assert( false, 'JSON parsing failed' );
  }

  fs.writeFileSync( `${buildDir}doc/jsdoc-explanation.json`, json );
};

/**
 * Generates the phet-io client guides and puts them in `build/phet-io/doc/guides/`
 * @param {string} repoName
 * @param {string} simulationDisplayName
 * @param {string} buildDir
 */
const handleClientGuides = ( repoName, simulationDisplayName, buildDir ) => {
  const builtClientGuidesOutputDir = `${buildDir}doc/guides/`;
  const clientGuidesSourceRoot = `${PHET_IO_SIM_SPECIFIC}/repos/${repoName}/client-guide/`;

  // gracefully support no client guides
  if ( !fs.existsSync( clientGuidesSourceRoot ) ) {
    console.log( `No client guides found at ${clientGuidesSourceRoot}, no guides being built.` );
    return;
  }

  // copy over common images and styles
  copyDirectory( `${PHET_IO_SIM_SPECIFIC}/${GUIDES_COMMON_DIR}`, `${builtClientGuidesOutputDir}/common` );

  // copy over the sim-specific phet-io guide images
  const simSpecificGuideImagesDir = `${PHET_IO_SIM_SPECIFIC}/repos/${repoName}/client-guide/images/`;
  if ( fs.existsSync( simSpecificGuideImagesDir ) ) {
    copyDirectory( simSpecificGuideImagesDir, `${builtClientGuidesOutputDir}images/` );
  }

  // handle generating and writing the html file for each client guide
  generateAndWriteClientGuide( repoName, `${simulationDisplayName} PhET-iO Guide`, `${clientGuidesSourceRoot}${PHET_IO_GUIDE_FILENAME}.md`, `${builtClientGuidesOutputDir}${PHET_IO_GUIDE_FILENAME}.html` );
  generateAndWriteClientGuide( repoName, `${simulationDisplayName} Examples`, `${clientGuidesSourceRoot}${EXAMPLES_FILENAME}.md`, `${builtClientGuidesOutputDir}${EXAMPLES_FILENAME}.html` );
  generateAndWriteClientGuide( repoName, `${simulationDisplayName} Migration Guide`, `${clientGuidesSourceRoot}${PHET_IO_MIGRATION_GUIDE_FILENAME}.md`, `${builtClientGuidesOutputDir}${PHET_IO_MIGRATION_GUIDE_FILENAME}.html` );
};

/**
 * Takes a markdown client guides, fills in the links, and then generates and writes it as html
 * @param {string} repoName
 * @param {string} title
 * @param {string} mdFilePath - to get the source md file
 * @param {string} destinationPath - to write to
 */
const generateAndWriteClientGuide = ( repoName, title, mdFilePath, destinationPath ) => {

  // make sure the source markdown file exists
  if ( !fs.existsSync( mdFilePath ) ) {
    grunt.log.warn( `no client guide found at ${mdFilePath}, no guide being built.` );
    return;
  }

  // fill in links
  let clientGuideSource = grunt.file.read( mdFilePath );
  clientGuideSource = ChipperStringUtils.replaceAll( clientGuideSource, '{{WRAPPER_INDEX_PATH}}', '../../' );
  clientGuideSource = ChipperStringUtils.replaceAll( clientGuideSource, '{{SIM_PATH}}', `../../${repoName}_all_phet-io.html?postMessageOnError&phetioStandalone` );
  clientGuideSource = ChipperStringUtils.replaceAll( clientGuideSource, '{{STUDIO_PATH}}', '../../wrappers/studio/' );
  clientGuideSource = ChipperStringUtils.replaceAll( clientGuideSource, '{{PHET_IO_GUIDE_PATH}}', `./${PHET_IO_GUIDE_FILENAME}.html` );

  // support relative and absolute paths for unbuilt common image previews by replacing them with the correct relative path
  clientGuideSource = ChipperStringUtils.replaceAll( clientGuideSource, `../${GUIDES_COMMON_DIR}`, 'common' );
  clientGuideSource = ChipperStringUtils.replaceAll( clientGuideSource, `/${GUIDES_COMMON_DIR}`, 'common' );
  const renderedClientGuide = marked( clientGuideSource );

  // link a stylesheet
  const clientGuideHTML = `<head>
                   <link rel='stylesheet' href='common/css/github-markdown.css' type='text/css'>
                   <title>${title}</title>
                 </head>
                 <body>
                 <div class="markdown-body">
                   ${renderedClientGuide}
                 </div>
                 </body>`;

  // write the output to the build directory
  grunt.file.write( destinationPath, clientGuideHTML );
};

/**
 * Support building studio. This compiles the studio modules into a runnable, and copies that over to the expected spot
 * on build.
 * @param {string} wrappersLocation
 * @returns {Promise.<void>}
 */
const handleStudio = async wrappersLocation => {

  grunt.log.debug( 'building studio' );

  const results = await tsc( '../studio' );
  reportTscResults( results, grunt );

  new Transpiler( { silent: true } ).transpileRepos( getPhetLibs( 'studio' ) );
  fs.writeFileSync( `${wrappersLocation}studio/${STUDIO_BUILT_FILENAME}`, await buildStandalone( 'studio', {} ) );
};

/**
 * Use webpack to bundle the migration rules into a compiled code string, for use in phet-io lib file.
 * @param {string} repo
 * @param {string} buildDir
 * @returns {Promise.<string>}
 */
const getCompiledMigrationRules = async ( repo, buildDir ) => {
  return new Promise( ( resolve, reject ) => {

    const migrationRulesFilename = `${repo}-migration-rules.js`;
    const entryPointFilename = `../chipper/dist/js/phet-io-sim-specific/repos/${repo}/js/${migrationRulesFilename}`;
    if ( !fs.existsSync( entryPointFilename ) ) {
      console.log( `No migration rules found at ${entryPointFilename}, no rules to be bundled with ${LIB_OUTPUT_FILE}.` );
      resolve( '' ); // blank string because there are no rules to add.
    }
    else {

      // output dir must be an absolute path
      const outputDir = path.resolve( __dirname, `../../${repo}/${buildDir}` );

      const compiler = webpack( {

        // We uglify as a step after this, with many custom rules. So we do NOT optimize or uglify in this step.
        optimization: {
          minimize: false
        },

        // Simulations or runnables will have a single entry point
        entry: {
          repo: entryPointFilename
        },

        // We output our builds to the following dir
        output: {
          path: outputDir,
          filename: migrationRulesFilename
        }
      } );

      compiler.run( ( err, stats ) => {
        if ( err || stats.hasErrors() ) {
          console.error( 'Migration rules webpack build errors:', stats.compilation.errors );
          reject( err || stats.compilation.errors[ 0 ] );
        }
        else {
          const jsFile = `${outputDir}/${migrationRulesFilename}`;
          const js = fs.readFileSync( jsFile, 'utf-8' );

          fs.unlinkSync( jsFile );

          resolve( js );
        }
      } );
    }
  } );
};