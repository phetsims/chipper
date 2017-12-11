// Copyright 2013-2015, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
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
const reportMedia = require( './reportMedia' );
const reportThirdParty = require( './reportThirdParty' );
const updateCopyrightDates = require( './updateCopyrightDates' );

module.exports = function( grunt ) {
  const packageObject = grunt.file.readJSON( 'package.json' );

  // Handle the lack of build.json
  var buildLocal;
  try {
    buildLocal = grunt.file.readJSON( process.env.HOME + '/.phet/build-local.json' );
  }
  catch ( e ) {
    buildLocal = {};
  }

  // TODO: grunt error on promise rejection

  const repo = grunt.option( 'repo' ) || packageObject.name;

  chipperGlobals.initialize();

  grunt.registerTask( 'default', 'Builds the repository', ( grunt.option( 'lint' ) === false ? [] : [ 'lint-all' ] ).concat( [ 'clean', 'build' ] ) );

  grunt.registerTask( 'clean',
    'Erases the build/ directory and all its contents, and recreates the build/ directory',
    function() {
      var buildDirectory = `../${repo}/build`;
      if ( grunt.file.exists( buildDirectory ) ) {
        grunt.file.delete( buildDirectory );
      }
      grunt.file.mkdir( buildDirectory );
    } );

  grunt.registerTask( 'build',
    'TODO',
    async function() {
      const done = grunt.task.current.async();

      const instrument = !!grunt.option( 'instrument' );
      const uglify = !instrument && ( grunt.option( 'uglify' ) !== false ); // Do not uglify if it is being instrumented
      const mangle = grunt.option( 'mangle' ) !== false;

      try {
        // standalone
        if ( repo === 'scenery' || repo === 'kite' || repo === 'dot' ) {
          fs.writeFileSync( `../${repo}/build/${repo}.min.js`, await buildStandalone( repo, uglify, mangle ) );
        }
        else if ( grunt.file.readJSON( `../${repo}/package.json` ).isWrapper ) {
          await buildWrapper( repo );
        }
        // runnable
        else {
          // Determine what brands we want to build
          assert( !grunt.option( 'brand' ), 'Use --brands={{BRANDS}} instead of brand' );

          const localPackageObject = grunt.file.readJSON( `../${repo}/package.json` );
          const supportedBrands = localPackageObject.phet.supportedBrands;

          assert( localPackageObject.phet.runnable, `${repo} does not appear to be runnable` );

          var brands;
          if ( grunt.option( 'brands' ) ) {
            if ( grunt.option( 'brands' ) === '*' ) {
              brands = supportedBrands;
            }
            else {
              brands = grunt.option( 'brands' ).split( ',' );
            }
          }
          else if ( buildLocal.brands ) {
            brands = buildLocal.brands.filter( brand => localPackageObject.phet.supportedBrands.includes( brand ) );
          }
          else {
            brands = [ 'adapted-from-phet' ];
          }

          // Ensure all listed brands are valid
          brands.forEach( brand => assert( ChipperConstants.BRANDS.includes( brand ), `Unknown brand: ${brand}` ) );
          brands.forEach( brand => assert( supportedBrands.includes( brand ), `Unsupported brand: ${brand}` ) );

          // Other options
          const allHTML = !!grunt.option( 'allHTML' );
          const debugHTML = !!grunt.option( 'debugHTML' );

          for ( let brand of brands ) {
            grunt.log.writeln( `Building brand: ${brand}` );
            await buildRunnable( repo, uglify, mangle, instrument, allHTML, debugHTML, brand );
          }
        }
      }
      catch ( e ) {
        console.log( e );
        grunt.log.error( e );
      }

      done();
    }
  );

  grunt.registerTask( 'build-for-server', 'meant for use by build-server only',
    [ 'build' ]
  );
  grunt.registerTask( 'lint', 'lint js files that are specific to this repository', function() {
    lint( [ repo ] );
  } );

  grunt.registerTask( 'lint-all', 'lint all js files that are required to build this repository (for all supported brands)', async function() {
    const done = grunt.task.current.async();

    lint( getPhetLibs( repo ) );

    done();
  } );

  grunt.registerTask( 'generate-development-html',
    'Generates top-level SIM_en.html file based on the preloads in package.json.',
    function() {
      generateDevelopmentHTML( repo );
    } );

  grunt.registerTask( 'generate-test-html',
    'Generates top-level SIM-tests.html file based on the preloads in package.json.  See https://github.com/phetsims/aqua/blob/master/docs/adding-tests.md ' +
    'for more information on automated testing',
    function() {
      generateDevelopmentHTML( repo, {

        // Include QUnit CSS
        stylesheets: '<link rel="stylesheet" href="../sherpa/lib/qunit-2.4.1.css">',

        // Leave the background the default color white
        bodystyle: '',

        // Output to a test file
        outputFile: `../${repo}/${repo}-tests.html`,

        // Add the QUnit divs
        bodystart: '<div id="qunit"></div><div id="qunit-fixture"></div>',

        // Add QUnit JS
        addedPreloads: [ '../sherpa/lib/qunit-2.4.1.js', '../aqua/js/qunit-connector.js' ],

        // Do not show the splash screen
        stripPreloads: [ '../joist/js/splash.js' ],

        // Specify to use test config
        qualifier: 'test-'
      } );
    } );

  grunt.registerTask( 'generate-development-colors-html',
    'Generates top-level SIM-colors.html file used for testing color profiles and color values.',
    function() {
      generateDevelopmentColorsHTML( repo );
    } );

  grunt.registerTask( 'generate-a11y-view-html',
    'Generates top-level SIM-a11y-view.html file used for visualizing accessible content.',
    function() {
      generateA11yViewHTML( repo );
    } );

  grunt.registerTask( 'generate-config',
    'Generates the js/SIM-config.js file based on the dependencies in package.json.',
    function() {
      generateConfig( repo, `../${repo}/js/${repo}-config.js`, 'main' );
    } );

  grunt.registerTask( 'generate-test-config',
    'Generates the js/SIM-test-config.js file based on the dependencies in package.json.',
    function() {
      generateConfig( repo, `../${repo}/js/${repo}-test-config.js`, 'tests' );
    } );

  grunt.registerTask( 'generate-coverage',
    'Generates a code coverage report using Istanbul. See generateCoverage.js for details.',
    function() {
      generateCoverage( repo );
    } );

  grunt.registerTask( 'published-README',
    'Generates README.md file for a published simulation.',
    function() {
      generateREADME( repo, true /* published */ );
    } );

  grunt.registerTask( 'unpublished-README',
    'Generates README.md file for an unpublished simulation.',
    function() {
      generateREADME( repo, false /* published */ );
    } );

  grunt.registerTask( 'commits-since',
    'Shows commits since a specified date. Use --date=\<date\> to specify the date.',
    async function() {
      const dateString = grunt.option( 'date' );
      assert( dateString, 'missing required option: --date={{DATE}}' );

      const done = grunt.task.current.async();

      await commitsSince( repo, dateString );

      done();
    } );

  // See reportMedia.js
  grunt.registerTask( 'report-media',
    '(project-wide) Report on license.json files throughout all working copies. ' +
    'Reports any media (such as images or audio) files that have any of the following problems:\n' +
    '(1) incompatible-license (resource license not approved)\n' +
    '(2) not-annotated (license.json missing or entry missing from license.json)\n' +
    '(3) missing-file (entry in the license.json but not on the file system)',
    function() {
      reportMedia();
    } );

  // see reportThirdParty.js
  grunt.registerTask( 'report-third-party',
    'Creates a report of third-party resources (code, images, audio, etc) used in the published PhET simulations by ' +
    'reading the license information in published HTML files on the PhET website. This task must be run from master.  ' +
    'After running this task, you must push sherpa/third-party-licenses.md.',
    function() {
      reportThirdParty();
    } );

  grunt.registerTask( 'find-duplicates', 'Find duplicated code in this repo.\n' +
                                         '--dependencies to expand search to include dependencies\n' +
                                         '--everything to expand search to all PhET code', function() {
    findDuplicates( repo );
  } );

  // Grunt task that determines created and last modified dates from git, and
  // updates copyright statements accordingly, see #403
  grunt.registerTask( 'update-copyright-dates', 'Update the copyright dates in JS source files based on Github dates',
    function() {
      updateCopyrightDates();
    } );

  function forwardToPerennialGrunt( task ) {
    // TODO: improve documentation
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
    'sha-check',
    'sim-list',
    'npm-update',
    'create-release',
    'cherry-pick',
    'wrapper',
    'dev',
    'rc',
    'production',
    'create-sim',
    'sort-require-statements',
    'insert-require-statement',
    'lint-everything',
    'generate-data'
  ].forEach( forwardToPerennialGrunt );
};
