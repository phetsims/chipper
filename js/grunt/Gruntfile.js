// Copyright 2013-2020, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

const SimVersion = require( '../SimVersion' );
const ChipperConstants = require( '../common/ChipperConstants' );
const buildRunnable = require( './buildRunnable' );
const buildStandalone = require( './buildStandalone' );
const commitsSince = require( './commitsSince' );
const generateA11yViewHTML = require( './generateA11yViewHTML' );
const generateDevelopmentColorsHTML = require( './generateDevelopmentColorsHTML' );
const generateDevelopmentHTML = require( './generateDevelopmentHTML' );
const generateREADME = require( './generateREADME' );
const generateTestHTML = require( './generateTestHTML' );
const generateThumbnails = require( './generateThumbnails' );
const generateTwitterCard = require( './generateTwitterCard' );
const getPhetLibs = require( './getPhetLibs' );
const lint = require( './lint' );
const fixEOL = require( './fixEOL' );
const migrate = require( './migrate' );
const minify = require( './minify' );
const modulify = require( './modulify' );
const generatePhetioMacroAPI = require( '../phet-io/generatePhetioMacroAPI' );
const formatPhetioAPI = require( '../phet-io/formatPhetioAPI' );
const reportMedia = require( './reportMedia' );
const reportThirdParty = require( './reportThirdParty' );
const sortImports = require( './sortImports' );
const updateCopyrightDates = require( './updateCopyrightDates' );
const webpackDevServer = require( './webpackDevServer' );
const assert = require( 'assert' );
const child_process = require( 'child_process' );
const fs = require( 'fs' );
const jimp = require( 'jimp' );
const path = require( 'path' );
require( './checkNodeVersion' );

// See https://medium.com/@dtinth/making-unhandled-promise-rejections-crash-the-node-js-process-ffc27cfcc9dd for how
// to get unhandled promise rejections to fail out the node process.
// Relevant for https://github.com/phetsims/wave-interference/issues/491
process.on( 'unhandledRejection', up => { throw up; } );

module.exports = function( grunt ) {
  const packageObject = grunt.file.readJSON( 'package.json' );

  // Handle the lack of build.json
  let buildLocal;
  try {
    buildLocal = grunt.file.readJSON( `${process.env.HOME}/.phet/build-local.json` );
  }
  catch( e ) {
    buildLocal = {};
  }

  const repo = grunt.option( 'repo' ) || packageObject.name;

  /**
   * Wraps a promise's completion with grunt's asynchronous handling, with added helpful failure messages (including
   * stack traces, regardless of whether --stack was provided).
   * @public
   *
   * @param {Promise} promise
   */
  async function wrap( promise ) {
    const done = grunt.task.current.async();

    try {
      await promise;
    }
    catch( e ) {
      if ( e.stack ) {
        grunt.fail.fatal( `Perennial task failed:\n${e.stack}\nFull Error details:\n${e}` );
      }

        // The toString check handles a weird case found from an Error object from puppeteer that doesn't stringify with
      // JSON or have a stack, JSON.stringifies to "{}", but has a `toString` method
      else if ( typeof e === 'string' || ( JSON.stringify( e ).length === 2 && e.toString ) ) {
        grunt.fail.fatal( `Perennial task failed: ${e}` );
      }
      else {
        grunt.fail.fatal( `Perennial task failed with unknown error: ${JSON.stringify( e, null, 2 )}` );
      }
    }

    done();
  }

  /**
   * Wraps an async function for a grunt task. Will run the async function when the task should be executed. Will
   * properly handle grunt's async handling, and provides improved error reporting.
   * @public
   *
   * @param {async function} asyncTaskFunction
   */
  function wrapTask( asyncTaskFunction ) {
    return () => {
      wrap( asyncTaskFunction() );
    };
  }

  grunt.registerTask( 'default', 'Builds the repository', [
    ...( grunt.option( 'lint' ) === false ? [] : [ 'lint-all' ] ),
    ...( grunt.option( 'report-media' ) === false ? [] : [ 'report-media' ] ),
    'clean',
    'build'
  ] );

  grunt.registerTask( 'clean',
    'Erases the build/ directory and all its contents, and recreates the build/ directory',
    wrapTask( async () => {
      const buildDirectory = `../${repo}/build`;
      if ( grunt.file.exists( buildDirectory ) ) {
        grunt.file.delete( buildDirectory );
      }
      grunt.file.mkdir( buildDirectory );
    } ) );

  grunt.registerTask( 'build-images',
    'Build images only',
    wrapTask( async () => {
      const brand = 'phet';
      grunt.log.writeln( `Building images for brand: ${brand}` );

      const buildDir = `../${repo}/build/${brand}`;
      // Thumbnails and twitter card
      if ( grunt.file.exists( `../${repo}/assets/${repo}-screenshot.png` ) ) {
        const thumbnailSizes = [
          { width: 600, height: 394 },
          { width: 420, height: 276 },
          { width: 128, height: 84 },
          { width: 15, height: 10 }
        ];
        for ( const size of thumbnailSizes ) {
          grunt.file.write( `${buildDir}/${repo}-${size.width}.png`, await generateThumbnails( repo, size.width, size.height, 100, jimp.MIME_PNG ) );
        }


        const altScreenshots = grunt.file.expand( { filter: 'isFile', cwd: `../${repo}/assets` }, [ `./${repo}-screenshot-alt[0123456789].png` ] );
        for ( const altScreenshot of altScreenshots ) {
          const imageNumber = parseInt( altScreenshot.substr( `./${repo}-screenshot-alt`.length, 1 ), 10 );
          grunt.file.write( `${buildDir}/${repo}-${600}-alt${imageNumber}.png`, await generateThumbnails( repo, 600, 394, 100, jimp.MIME_PNG, `-alt${imageNumber}` ) );
        }

        if ( brand === 'phet' ) {
          grunt.file.write( `${buildDir}/${repo}-ios.png`, await generateThumbnails( repo, 420, 276, 90, jimp.MIME_JPEG ) );
          grunt.file.write( `${buildDir}/${repo}-twitter-card.png`, await generateTwitterCard( repo ) );
        }
      }
    } ) );

  grunt.registerTask( 'build',
    `Builds the repository. Depending on the repository type (runnable/wrapper/standalone), the result may vary.
 --minify.babelTranspile=false - Disables babel transpilation phase.
 --minify.uglify=false - Disables uglification, so the built file will include (essentially) concatenated source files.
 --minify.mangle=false - During uglification, it will not "mangle" variable names (where they get renamed to short constants to reduce file size.)
 --minify.beautify=true - After uglification, the source code will be syntax formatted nicely
 --minify.stripAssertions=false - During uglification, it will strip assertions.
 --minify.stripLogging=false - During uglification, it will not strip logging statements.
 Runnable build options:
 --report-media - Will iterate over all of the license.json files and reports any media files
 --instrument - Builds a runnable with code coverage tooling inside. See phet-info/doc/code-coverage.md for more information
 --brands={{BRANDS} - Can be * (build all supported brands), or a comma-separated list of brand names. Will fall back to using
                      build-local.json's brands (or adapted-from-phet if that does not exist)
 --allHTML - If provided, will include the _all.html file (if it would not otherwise be built, e.g. phet brand)
 --XHTML - Includes an xhtml/ directory in the build output that contains a runnable XHTML form of the sim (with
           a separated-out JS file).
 --locales={{LOCALES}} - Can be * (build all available locales, "en" and everything in babel), or a comma-separated list of locales`,
    wrapTask( async () => {

      // Parse minification keys
      const minifyKeys = Object.keys( minify.MINIFY_DEFAULTS );
      const minifyOptions = {};
      minifyKeys.forEach( minifyKey => {
        const option = grunt.option( `minify.${minifyKey}` );
        if ( option === true || option === false ) {
          minifyOptions[ minifyKey ] = option;
        }
      } );

      // grunt options that apply to multiple build tasks
      const instrument = !!grunt.option( 'instrument' );

      // Do not uglify or transpile if it is being instrumented, so it will match development code as closely as possible
      if ( instrument ) {
        minifyOptions.babelTranspile = false;
        minifyOptions.uglify = false;
      }

      const repoPackageObject = grunt.file.readJSON( `../${repo}/package.json` );

      // standalone
      if ( repoPackageObject.phet.buildStandalone ) {
        grunt.log.writeln( 'Building standalone repository' );

        const parentDir = `../${repo}/build/`;
        if ( !fs.existsSync( parentDir ) ) {
          fs.mkdirSync( parentDir );
        }

        fs.writeFileSync( `${parentDir}/${repo}.min.js`, await buildStandalone( repo, minifyOptions ) );

        if ( repoPackageObject.phet.standaloneTranspiles ) {
          for ( const file of repoPackageObject.phet.standaloneTranspiles ) {
            fs.writeFileSync( `../${repo}/build/${path.basename( file )}`, minify( grunt.file.read( file ) ) );
          }
        }
      }
      else {

        // Determine what brands we want to build
        assert( !grunt.option( 'brand' ), 'Use --brands={{BRANDS}} instead of brand' );

        const localPackageObject = grunt.file.readJSON( `../${repo}/package.json` );
        const supportedBrands = localPackageObject.phet.supportedBrands;

        assert( localPackageObject.phet.runnable, `${repo} does not appear to be runnable` );

        let brands;
        if ( grunt.option( 'brands' ) ) {
          if ( grunt.option( 'brands' ) === '*' ) {
            brands = supportedBrands;
          }
          else {
            brands = grunt.option( 'brands' ).split( ',' );
          }
        }
        else if ( buildLocal.brands ) {
          // Extra check, see https://github.com/phetsims/chipper/issues/640
          assert( Array.isArray( buildLocal.brands ), 'If brands exists in build-local.json, it should be an array' );
          brands = buildLocal.brands.filter( brand => localPackageObject.phet.supportedBrands.includes( brand ) );
        }
        else {
          brands = [ 'adapted-from-phet' ];
        }

        // Ensure all listed brands are valid
        brands.forEach( brand => assert( ChipperConstants.BRANDS.includes( brand ), `Unknown brand: ${brand}` ) );
        brands.forEach( brand => assert( supportedBrands.includes( brand ), `Unsupported brand: ${brand}` ) );

        grunt.log.writeln( `Building runnable repository (${repo}, brands: ${brands.join( ', ' )})` );

        // Other options
        const allHTML = !!grunt.option( 'allHTML' );
        const localesOption = grunt.option( 'locales' ) || 'en'; // Default back to English for now

        for ( const brand of brands ) {
          grunt.log.writeln( `Building brand: ${brand}` );

          await buildRunnable( repo, minifyOptions, instrument, allHTML, brand, localesOption, buildLocal );
        }
      }
    } )
  );

  grunt.registerTask( 'build-for-server', 'meant for use by build-server only',
    [ 'build' ]
  );

  grunt.registerTask( 'lint',
    `lint js files. Options:
--disable-eslint-cache: cache will not be read or written
--fix: autofixable changes will be written to disk
--format: Append an additional set of rules for formatting
--patterns: comma-separated list of directory/file patterns. Default: repo where the command was run.`,
    wrapTask( async () => {

      // --disable-eslint-cache disables the cache, useful for developing rules
      const cache = !grunt.option( 'disable-eslint-cache' );
      const fix = grunt.option( 'fix' );
      const format = grunt.option( 'format' );

      // If patterns are specified, lint them, otherwise lint the repo where the command was run from
      // Use '../repo' instead of '.' so that it can be filtered if necessary.
      const patterns = grunt.option( 'patterns' ) ? grunt.option( 'patterns' ).split( ',' ) : [ `../${repo}` ];

      await lint( patterns, {
        cache: cache,
        fix: fix,
        format: format
      } );
    } ) );

  grunt.registerTask( 'lint-all', 'lint all js files that are required to build this repository (for all supported brands)', wrapTask( async () => {

    // --disable-eslint-cache disables the cache, useful for developing rules
    const cache = !grunt.option( 'disable-eslint-cache' );
    const fix = grunt.option( 'fix' );
    const format = grunt.option( 'format' );
    assert && assert( !grunt.option( 'patterns' ), 'patterns not support for lint-all' );

    await lint( getPhetLibs( repo ).map( repo => `../${repo}` ), {
      cache: cache,
      fix: fix,
      format: format
    } );
  } ) );

  grunt.registerTask( 'generate-development-html',
    'Generates top-level SIM_en.html file based on the preloads in package.json.',
    wrapTask( async () => {
      await generateDevelopmentHTML( repo );
    } ) );

  grunt.registerTask( 'generate-test-html',
    'Generates top-level SIM-tests.html file based on the preloads in package.json.  See https://github.com/phetsims/aqua/blob/master/doc/adding-unit-tests.md ' +
    'for more information on automated testing. Usually you should ' +
    'set the "generatedUnitTests":true flag in the sim package.json and run `grunt update` instead of manually generating this.',
    wrapTask( async () => {
      await generateTestHTML( repo );
    } ) );

  grunt.registerTask( 'generate-development-colors-html',
    'Generates top-level SIM-colors.html file used for testing color profiles and color values. Usually you should ' +
    'set the "colorProfile":true flag in the sim package.json and run `grunt update` instead of manually generating this.',
    wrapTask( async () => {
      generateDevelopmentColorsHTML( repo );
    } ) );

  grunt.registerTask( 'generate-a11y-view-html',
    'Generates top-level SIM-a11y-view.html file used for visualizing accessible content. Usually you should ' +
    'set the "supportsInteractiveDescription":true flag in the sim package.json and run `grunt update` instead of manually generating this.',
    wrapTask( async () => {
      generateA11yViewHTML( repo );
    } ) );

  grunt.registerTask( 'update', `
Updates the normal automatically-generated files for this repository. Includes:
  * runnables: generate-development-html and modulfy
  * accessible runnables: generate-a11y-view-html
  * color-profile runnables: generate-development-colors-html
  * unit tests: generate-test-html
  * simulations: generateREADME()
  * phet-io simulations: generate overrides file if needed`,
    wrapTask( async () => {

      // support repos that don't have a phet object
      if ( !packageObject.phet ) {
        return;
      }

      if ( packageObject.phet.runnable ) {
        grunt.task.run( 'modulify' );
        grunt.task.run( 'generate-development-html' );

        if ( packageObject.phet.supportsInteractiveDescription ) {
          grunt.task.run( 'generate-a11y-view-html' );
        }
        if ( packageObject.phet.colorProfile ) {
          grunt.task.run( 'generate-development-colors-html' );
        }
      }

      if ( packageObject.phet.generatedUnitTests ) {
        grunt.task.run( 'generate-test-html' );
      }

      // update README.md only for simulations
      if ( packageObject.phet.simulation && !packageObject.phet.readmeCreatedManually ) {
        const simVersion = SimVersion.parse( packageObject.version );
        generateREADME( repo, simVersion.isSimPublished );
      }

      if ( packageObject.phet.supportedBrands && packageObject.phet.supportedBrands.includes( 'phet-io' ) ) {

        // Copied from build.json and used as a preload for phet-io brand
        const overridesFile = `../${repo}/js/${repo}-phet-io-overrides.js`;

        // If there is already an overrides file, don't overwrite it with an empty one
        if ( !fs.existsSync( overridesFile ) ) {
          fs.writeFileSync( overridesFile,
            '/* eslint-disable */\nwindow.phet.preloads.phetio.phetioElementsOverrides = {};' );
        }
      }
    } ) );

  grunt.registerTask( 'published-README',
    'Generates README.md file for a published simulation.',
    wrapTask( async () => {
      generateREADME( repo, true /* published */ );
    } ) );

  grunt.registerTask( 'unpublished-README',
    'Generates README.md file for an unpublished simulation.',
    wrapTask( async () => {
      generateREADME( repo, false /* published */ );
    } ) );

  grunt.registerTask( 'sort-imports', 'Sort the import statements for a single file (if --file={{FILE}} is provided), or does so for all JS files if not specified', wrapTask( async () => {
    const file = grunt.option( 'file' );

    if ( file ) {
      sortImports( file );
    }
    else {
      grunt.file.recurse( `../${repo}/js`, absfile => sortImports( absfile ) );
    }
  } ) );

  grunt.registerTask( 'commits-since',
    'Shows commits since a specified date. Use --date=<date> to specify the date.',
    wrapTask( async () => {
      const dateString = grunt.option( 'date' );
      assert( dateString, 'missing required option: --date={{DATE}}' );

      await commitsSince( repo, dateString );
    } ) );

  // See reportMedia.js
  grunt.registerTask( 'report-media',
    '(project-wide) Report on license.json files throughout all working copies. ' +
    'Reports any media (such as images or sound) files that have any of the following problems:\n' +
    '(1) incompatible-license (resource license not approved)\n' +
    '(2) not-annotated (license.json missing or entry missing from license.json)\n' +
    '(3) missing-file (entry in the license.json but not on the file system)',
    wrapTask( async () => {
      await reportMedia( repo );
    } ) );

  // see reportThirdParty.js
  grunt.registerTask( 'report-third-party',
    'Creates a report of third-party resources (code, images, sound, etc) used in the published PhET simulations by ' +
    'reading the license information in published HTML files on the PhET website. This task must be run from master.  ' +
    'After running this task, you must push sherpa/third-party-licenses.md.',
    wrapTask( async () => {
      await reportThirdParty();
    } ) );

  grunt.registerTask( 'migrate', 'Migrates RequireJS code to ES6 modules using a number of heuristics', wrapTask( async () => {
    await migrate( repo );
  } ) );

  grunt.registerTask( 'modulify', 'Creates *.js modules for all images/strings/audio/etc in a repo', wrapTask( async () => {
    await modulify( repo );
  } ) );

  grunt.registerTask( 'milagro', 'Runs both migrate and modulify', wrapTask( async () => {
    await migrate( repo );
    await modulify( repo );
  } ) );

  // Grunt task that determines created and last modified dates from git, and
  // updates copyright statements accordingly, see #403
  grunt.registerTask(
    'update-copyright-dates',
    'Update the copyright dates in JS source files based on Github dates',
    wrapTask( async () => await updateCopyrightDates( repo ) )
  );

  grunt.registerTask(
    'webpack-dev-server', `Runs a webpack server for a given list of simulations.
--repos=REPOS for a comma-separated list of repos (defaults to current repo)
--port=9000 to adjust the running port
--devtool=string value for sourcemap generation specified at https://webpack.js.org/configuration/devtool or undefined for (none)
--chrome: open the sims in Chrome tabs (Mac)`,
    () => {
      // We don't finish! Don't tell grunt this...
      grunt.task.current.async();

      const repos = grunt.option( 'repos' ) ? grunt.option( 'repos' ).split( ',' ) : [ repo ];
      const port = grunt.option( 'port' ) || 9000;
      let devtool = grunt.option( 'devtool' ) || 'inline-source-map';
      if ( devtool === 'none' || devtool === 'undefined' ) {
        devtool = undefined;
      }
      const openChrome = grunt.option( 'chrome' ) || false;

      // NOTE: We don't care about the promise that is returned here, because we are going to keep this task running
      // until the user manually kills it.
      webpackDevServer( repos, port, devtool, openChrome );
    }
  );

  grunt.registerTask(
    'generate-phet-io-api',
    'Output the phet-io API as JSON to phet-io/api.',
    wrapTask( async () => {
      const writeFile = ( filePath, contents ) => fs.writeFileSync( filePath, fixEOL( contents ) );

      const dir = '../phet-io/api/';
      try {
        fs.mkdirSync( dir );
      }
      catch( e ) {
        if ( !e.message.includes( 'file already exists' ) ) {
          throw e;
        }
      }
      const filePath = `../phet-io/api/${repo}.json`;

      const api = ( await generatePhetioMacroAPI( [ repo ] ) )[ repo ];
      writeFile( filePath, formatPhetioAPI( api ) );
    } )
  );

  /**
   * Creates grunt tasks that effectively get forwarded to perennial. It will execute a grunt process running from
   * perennial's directory with the same options (but with --repo={{REPO}} added, so that perennial is aware of what
   * repository is the target).
   * @public
   *
   * @param {string} task - The name of the task
   */
  function forwardToPerennialGrunt( task ) {
    grunt.registerTask( task, 'Run grunt --help in perennial to see documentation', () => {
      grunt.log.writeln( '(Forwarding task to perennial)' );

      const done = grunt.task.current.async();

      // Include the --repo flag
      const args = [ `--repo=${repo}`, ...process.argv.slice( 2 ) ];
      const argsString = args.map( arg => `"${arg}"` ).join( ' ' );
      const spawned = child_process.spawn( /^win/.test( process.platform ) ? 'grunt.cmd' : 'grunt', args, {
        cwd: '../perennial'
      } );
      grunt.log.debug( `running grunt ${argsString} in ../${repo}` );

      spawned.stderr.on( 'data', data => grunt.log.error( data.toString() ) );
      spawned.stdout.on( 'data', data => grunt.log.write( data.toString() ) );
      process.stdin.pipe( spawned.stdin );

      spawned.on( 'close', code => {
        if ( code !== 0 ) {
          throw new Error( `perennial grunt ${argsString} failed with code ${code}` );
        }
        else {
          done();
        }
      } );
    } );
  }

  [
    'checkout-shas',
    'checkout-target',
    'checkout-release',
    'checkout-master',
    'checkout-master-all',
    'create-one-off',
    'sha-check',
    'sim-list',
    'npm-update',
    'create-release',
    'cherry-pick',
    'wrapper',
    'dev',
    'one-off',
    'rc',
    'production',
    'create-sim',
    'insert-require-statement',
    'lint-everything',
    'generate-data',
    'pdom-comparison',
    'release-branch-list'
  ].forEach( forwardToPerennialGrunt );
};
