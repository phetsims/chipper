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
const generateThumbnails = require( './generateThumbnails' );
const generateTwitterCard = require( './generateTwitterCard' );
const getPhetLibs = require( './getPhetLibs' );
const lint = require( './lint' );
const reportMedia = require( './reportMedia' );
const reportThirdParty = require( './reportThirdParty' );

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

  chipperGlobals.initialize( grunt );

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
          fs.writeFileSync( `../${repo}/build/${repo}.min.js`, await buildStandalone( grunt, repo, uglify, mangle ) );
        }
        // runnable
        else {
          // Determine what brands we want to build
          assert( !grunt.option( 'brand' ), 'Use --brands={{BRANDS}} instead of brand' );

          var brands;
          if ( grunt.option( 'brands' ) ) {
            if ( grunt.option( 'brands' ) === '*' ) {
              brands = ChipperConstants.BRANDS;
            }
            else {
              brands = grunt.option( 'brands' ).split( ',' );
            }
          }
          else if ( buildLocal.brands ) {
            brands = buildLocal.brands;
          }
          else {
            brands = ChipperConstants.BRANDS;
          }

          // Ensure all listed brands are valid
          brands.forEach( brand => assert( ChipperConstants.BRANDS.includes( brand, `Unknown brand: ${brand}` ) ) );

          // Filter out brands that aren't supported by the given runnable
          const localPackageObject = grunt.file.readJSON( `../${repo}/package.json` );
          assert( localPackageObject.phet.runnable, `${repo} does not appear to be runnable` );
          brands = brands.filter( brand => localPackageObject.phet.supportedBrands.includes( brand ) );

          // Other options
          const allHTML = !!grunt.option( 'allHTML' );
          const debugHTML = !!grunt.option( 'debugHTML' );

          for ( let brand of brands ) {
            grunt.log.writeln( `Building brand: ${brand}` );
            await buildRunnable( grunt, repo, uglify, mangle, instrument, allHTML, debugHTML, brand );
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
    [ 'build', 'generate-thumbnails', 'generate-twitter-card' ]
  );
  grunt.registerTask( 'lint', 'lint js files that are specific to this repository', function() {
    lint( grunt, [ repo ] );
  } );

  grunt.registerTask( 'lint-all', 'lint all js files that are required to build this repository (for all supported brands)', async function() {
    const done = grunt.task.current.async();

    lint( grunt, getPhetLibs( grunt, repo ) );

    done();
  } );

  grunt.registerTask( 'generate-thumbnails', 'Generate 128x84 and 600x394 thumbnails to be used on the website.',
    async function() {
      const done = grunt.task.current.async();

      await Promise.all( [
        generateThumbnails( grunt, repo, 128, 84 ),
        generateThumbnails( grunt, repo, 600, 394 )
      ] );

      done();
    } );

  grunt.registerTask( 'generate-twitter-card', 'Generate image for twitter summary card to be used on the website.',
    async function() {
      const done = grunt.task.current.async();

      await generateTwitterCard( grunt, repo );

      done();
    } );

  grunt.registerTask( 'generate-development-html',
    'Generates top-level SIM_en.html file based on the preloads in package.json.',
    function() {
      generateDevelopmentHTML( grunt, repo );
    } );

  grunt.registerTask( 'generate-development-colors-html',
    'Generates top-level SIM-colors.html file used for testing color profiles and color values.',
    function() {
      generateDevelopmentColorsHTML( grunt, repo );
    } );

  grunt.registerTask( 'generate-a11y-view-html',
    'Generates top-level SIM-a11y-view.html file used for visualizing accessible content.',
    function() {
      generateA11yViewHTML( grunt, repo );
    } );

  grunt.registerTask( 'generate-config',
    'Generates the js/SIM-config.js file based on the dependencies in package.json.',
    function() {
      generateConfig( grunt, repo );
    } );

  grunt.registerTask( 'generate-coverage',
    'Generates a code coverage report using Istanbul. See generateCoverage.js for details.',
    function() {
      generateCoverage( grunt, repo );
    } );

  grunt.registerTask( 'published-README',
    'Generates README.md file for a published simulation.',
    function() {
      generateREADME( grunt, repo, true /* published */ );
    } );

  grunt.registerTask( 'unpublished-README',
    'Generates README.md file for an unpublished simulation.',
    function() {
      generateREADME( grunt, repo, false /* published */ );
    } );

  grunt.registerTask( 'commits-since',
    'Shows commits since a specified date. Use --date=\<date\> to specify the date.',
    async function() {
      const dateString = grunt.option( 'date' );
      assert( dateString, 'missing required option: --date={{DATE}}' );

      const done = grunt.task.current.async();

      await commitsSince( grunt, repo, dateString );

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
      reportMedia( grunt );
    } );

  // see reportThirdParty.js
  grunt.registerTask( 'report-third-party',
    'Creates a report of third-party resources (code, images, audio, etc) used in the published PhET simulations by ' +
    'reading the license information in published HTML files on the PhET website. This task must be run from master.  ' +
    'After running this task, you must push sherpa/third-party-licenses.md.',
    function() {
      reportThirdParty( grunt );
    } );

  grunt.registerTask( 'find-duplicates', 'Find duplicated code in this repo.\n' +
                                         '--dependencies to expand search to include dependencies\n' +
                                         '--everything to expand search to all PhET code', function() {
    findDuplicates( grunt, repo );
  } );

};
