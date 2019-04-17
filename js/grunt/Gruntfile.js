// Copyright 2013-2015, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

const assert = require( 'assert' );
const buildRunnable = require( './buildRunnable' );
const buildStandalone = require( './buildStandalone' );
const buildWrapper = require( './phet-io/buildWrapper' );
const child_process = require( 'child_process' );
const ChipperConstants = require( '../common/ChipperConstants' );
const chipperGlobals = require( './chipperGlobals' );
const commitsSince = require( './commitsSince' );
const findDuplicates = require( './findDuplicates' );
const fs = require( 'fs' );
const generateA11yViewHTML = require( './generateA11yViewHTML' );
const generateConfig = require( './generateConfig' );
const generateCoverage = require( './generateCoverage' );
const generateDevelopmentColorsHTML = require( './generateDevelopmentColorsHTML' );
const generateDevelopmentHTML = require( './generateDevelopmentHTML' );
const generateREADME = require( './generateREADME' );
const getPhetLibs = require( './getPhetLibs' );
const lint = require( './lint' );
const minify = require( './minify' );
const reportMedia = require( './reportMedia' );
const reportThirdParty = require( './reportThirdParty' );
const updateCopyrightDates = require( './updateCopyrightDates' );
const generatePhetioElementsFiles = require( './phet-io/generatePhetioElementsFiles' );

module.exports = function( grunt ) {
  const packageObject = grunt.file.readJSON( 'package.json' );

  // Handle the lack of build.json
  let buildLocal;
  try {
    buildLocal = grunt.file.readJSON( process.env.HOME + '/.phet/build-local.json' );
  }
  catch( e ) {
    buildLocal = {};
  }

  const repo = grunt.option( 'repo' ) || packageObject.name;

  chipperGlobals.initialize();

  /**
   * Wraps a promise's completion with grunt's asynchronous handling, with added helpful failure messages (including stack traces, regardless of whether --stack was provided).
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
        grunt.fail.fatal( `Perennial task failed:\n${e.stack}\nFull Error details:\n${JSON.stringify( e, null, 2 )}` );
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
   * Wraps an async function for a grunt task. Will run the async function when the task should be executed. Will properly handle grunt's async handling, and provides improved
   * error reporting.
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
                      build-local.json\'s brands (or adapted-from-phet if that does not exist)
 --allHTML - If provided, will include the _all.html file (if it would not otherwise be built, e.g. phet brand)
 --XHTML - Includes an xhtml/ directory in the build output that contains a runnable XHTML form of the sim (with
           a separated-out JS file).
 --locales={{LOCALES}} - Can be * (build all available locales, "en" and everything in babel), or a comma-separated list of locales`,
    wrapTask( async () => {

      // Parse minification keys
      const minifyKeys = Object.keys( minify.MINIFY_DEFAULTS );
      const minifyOptions = {};
      minifyKeys.forEach( minifyKey => {
        const option = grunt.option( 'minify.' + minifyKey );
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

        fs.writeFileSync( `../${repo}/build/${repo}.min.js`, await buildStandalone( repo, minifyOptions ) );
      }
      else if ( repoPackageObject.isWrapper ) {
        grunt.log.writeln( 'Building wrapper repository' );

        await buildWrapper( repo );
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

          await buildRunnable( repo, minifyOptions, instrument, allHTML, brand, localesOption );
        }
      }
    } )
  );

  grunt.registerTask( 'build-for-server', 'meant for use by build-server only',
    [ 'build' ]
  );
  grunt.registerTask( 'lint', 'lint js files that are specific to this repository', wrapTask( async () => {

    // --disable-eslint-cache disables the cache, useful for developing rules
    const cache = !grunt.option( 'disable-eslint-cache' );

    lint( [ repo ], cache );
  } ) );

  grunt.registerTask( 'lint-all', 'lint all js files that are required to build this repository (for all supported brands)', wrapTask( async () => {

    // --disable-eslint-cache disables the cache, useful for developing rules
    const cache = !grunt.option( 'disable-eslint-cache' );

    lint( getPhetLibs( repo ), cache );
  } ) );

  grunt.registerTask( 'generate-development-html',
    'Generates top-level SIM_en.html file based on the preloads in package.json.',
    wrapTask( async () => {
      generateDevelopmentHTML( repo );
    } ) );

  grunt.registerTask( 'generate-test-html',
    'Generates top-level SIM-tests.html file based on the preloads in package.json.  See https://github.com/phetsims/aqua/blob/master/doc/adding-tests.md ' +
    'for more information on automated testing. Usually you should ' +
    'set the "generatedUnitTests":true flag in the sim package.json and run `grunt update` instead of manually generating this.',
    wrapTask( async () => {
      generateDevelopmentHTML( repo, {

        // Include QUnit CSS
        stylesheets: '  <link rel="stylesheet" href="../sherpa/lib/qunit-2.4.1.css">', // Note the preceding whitespace which makes the formatting match IDEA formatting

        // Leave the background the default color white
        bodystyle: '',

        // Output to a test file
        outputFile: `../${repo}/${repo}-tests.html`,

        // Add the QUnit divs (and Scenery display div if relevant)
        bodystart: '<div id="qunit"></div>\n<div id="qunit-fixture"></div>' + ( repo === 'scenery' ? '<div id="display"></div>' : '' ),

        // Add QUnit JS
        addedPreloads: [ '../sherpa/lib/qunit-2.4.1.js', '../aqua/js/qunit-connector.js' ],

        // Do not show the splash screen
        stripPreloads: [ '../joist/js/splash.js' ],

        // Specify to use test config
        qualifier: 'test-'
      } );
    } ) );

  grunt.registerTask( 'generate-development-colors-html',
    'Generates top-level SIM-colors.html file used for testing color profiles and color values. Usually you should ' +
    'set the "colorProfile":true flag in the sim package.json and run `grunt update` instead of manually generating this.',
    wrapTask( async () => {
      generateDevelopmentColorsHTML( repo );
    } ) );

  grunt.registerTask( 'generate-a11y-view-html',
    'Generates top-level SIM-a11y-view.html file used for visualizing accessible content. Usually you should ' +
    'set the "accessible":true flag in the sim package.json and run `grunt update` instead of manually generating this.',
    wrapTask( async () => {
      generateA11yViewHTML( repo );
    } ) );

  grunt.registerTask( 'generate-config',
    'Generates the js/SIM-config.js file based on the dependencies in package.json.',
    wrapTask( async () => {
      await generateConfig( repo, `js/${repo}-config.js`, 'main' );
    } ) );

  grunt.registerTask( 'generate-test-config',
    'Generates the js/SIM-test-config.js file based on the dependencies in package.json. Usually you should ' +
    'set the "generatedUnitTests":true flag in the sim package.json and run `grunt update` instead of manually generating this.',
    wrapTask( async () => {
      await generateConfig( repo, `js/${repo}-test-config.js`, 'tests' );
    } ) );

  grunt.registerTask( 'generate-coverage',
    'Generates a code coverage report using Istanbul. See generateCoverage.js for details.',
    wrapTask( async () => {
      generateCoverage( repo );
    } ) );

  grunt.registerTask( 'update',
    'Updates the normal automatically-generated files for this repository. Includes:\n' +
    '  runnables: generate-development-html, generate-config\n' +
    '  accessible runnables: generate-a11y-view-html\n' +
    '  color-profile runnables: generate-development-colors-html\n' +
    '  unit tests: generate-test-html, generate-test-config',
    wrapTask( async () => {
      if ( packageObject.phet.runnable ) {
        grunt.task.run( 'generate-development-html' );
        grunt.task.run( 'generate-config' );

        if ( packageObject.phet.accessible ) {
          grunt.task.run( 'generate-a11y-view-html' );
        }
        if ( packageObject.phet.colorProfile ) {
          grunt.task.run( 'generate-development-colors-html' );
        }
        if ( packageObject.phet.supportedBrands.indexOf( 'phet-io' ) >= 0 ) {
          grunt.task.run( 'generate-phet-io-elements-files' );
        }
      }

      if ( packageObject.phet.generatedUnitTests ) {
        grunt.task.run( 'generate-test-html' );
        grunt.task.run( 'generate-test-config' );
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

  grunt.registerTask( 'commits-since',
    'Shows commits since a specified date. Use --date=\<date\> to specify the date.',
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

  grunt.registerTask( 'find-duplicates', 'Find duplicated code in this repo.\n' +
                                         '--dependencies to expand search to include dependencies\n' +
                                         '--everything to expand search to all PhET code', wrapTask( async () => {

    // --disable-eslint-cache disables the cache, useful for developing rules
    const cache = !grunt.option( 'disable-eslint-cache' );

    findDuplicates( grunt, repo, cache );
  } ) );

  // Grunt task that determines created and last modified dates from git, and
  // updates copyright statements accordingly, see #403
  grunt.registerTask(
    'update-copyright-dates',
    'Update the copyright dates in JS source files based on Github dates',
    wrapTask( async () => await updateCopyrightDates( repo ) )
  );

  grunt.registerTask(
    'generate-phet-io-elements-files',
    'Write the api file for a phet-io sim.',
    wrapTask( async () => {
      assert( typeof buildLocal.localTestingURL === 'string', 'must specify localTestingURL in build-local.json' );
      assert( buildLocal.localTestingURL.endsWith( '/' ), 'localTestingURL should end in a "/"' );

      return await generatePhetioElementsFiles( repo, buildLocal.localTestingURL );
    } )
  );

  /**
   * Creates grunt tasks that effectively get forwarded to perennial. It will execute a grunt process running from perennial's directory with the same options
   * (but with --repo={{REPO}} added, so that perennial is aware of what repository is the target).
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
    'sort-require-statements',
    'insert-require-statement',
    'lint-everything',
    'generate-data'
  ].forEach( forwardToPerennialGrunt );
};
