// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

const buildStandalone = require( '../buildStandalone' );
const buildRunnable = require( '../buildRunnable' );
const minify = require( '../minify' );
const tsc = require( '../tsc' );
const reportTscResults = require( '../reportTscResults' );
const path = require( 'path' );
const fs = require( 'fs' );
const getPhetLibs = require( '../getPhetLibs' );
const phetTimingLog = require( '../../../../perennial-alias/js/common/phetTimingLog' );

const grunt = require( 'grunt' );
const getRepo = require( './util/getRepo' );
const assert = require( 'assert' );
const Transpiler = require( '../../common/Transpiler' );
const getBrands = require( './util/getBrands' );
const parseGruntOptions = require( './util/parseGruntOptions' );

const repo = getRepo();

// Initialize Grunt options with parsed arguments
// Call this before getBrands
grunt.option.init( parseGruntOptions() );

const transpiler = new Transpiler( { silent: true } );

// Handle the lack of build.json
let buildLocal;
try {
  buildLocal = grunt.file.readJSON( `${process.env.HOME}/.phet/build-local.json` );
}
catch( e ) {
  buildLocal = {};
}

( async () => {
  await phetTimingLog.startAsync( 'grunt-build', async () => {

    // Parse minification keys
    const minifyKeys = Object.keys( minify.MINIFY_DEFAULTS );
    const minifyOptions = {};
    minifyKeys.forEach( minifyKey => {
      const option = grunt.option( `minify.${minifyKey}` );
      if ( option === true || option === false ) {
        minifyOptions[ minifyKey ] = option;
      }
    } );

    const repoPackageObject = grunt.file.readJSON( `../${repo}/package.json` );

    // Run the type checker first.
    const brands = getBrands( grunt, repo, buildLocal );

    !grunt.option( 'noTSC' ) && await phetTimingLog.startAsync( 'tsc', async () => {

      // We must have phet-io code checked out to type check, since simLauncher imports phetioEngine
      // do NOT run this for phet-lib, since it is type-checking things under src/, which is not desirable.
      if ( ( brands.includes( 'phet-io' ) || brands.includes( 'phet' ) ) && repo !== 'phet-lib' ) {
        const results = await tsc( `../${repo}` );
        reportTscResults( results, grunt );
      }
      else {
        grunt.log.writeln( 'skipping type checking' );
      }
    } );

    !grunt.option( 'noTranspile' ) && await phetTimingLog.startAsync( 'transpile', () => {
      // If that succeeds, then convert the code to JS
      transpiler.transpileRepos( getPhetLibs( repo ) );
    } );

    // standalone
    if ( repoPackageObject.phet.buildStandalone ) {
      grunt.log.writeln( 'Building standalone repository' );

      const parentDir = `../${repo}/build/`;
      if ( !fs.existsSync( parentDir ) ) {
        fs.mkdirSync( parentDir );
      }

      fs.writeFileSync( `${parentDir}/${repo}.min.js`, await buildStandalone( repo, minifyOptions ) );

      // Build a debug version
      minifyOptions.minify = false;
      minifyOptions.babelTranspile = false;
      minifyOptions.uglify = false;
      minifyOptions.isDebug = true;
      fs.writeFileSync( `${parentDir}/${repo}.debug.js`, await buildStandalone( repo, minifyOptions, true ) );

      if ( repoPackageObject.phet.standaloneTranspiles ) {
        for ( const file of repoPackageObject.phet.standaloneTranspiles ) {
          fs.writeFileSync( `../${repo}/build/${path.basename( file )}`, minify( grunt.file.read( file ) ) );
        }
      }
    }
    else {

      const localPackageObject = grunt.file.readJSON( `../${repo}/package.json` );
      assert( localPackageObject.phet.runnable, `${repo} does not appear to be runnable` );
      grunt.log.writeln( `Building runnable repository (${repo}, brands: ${brands.join( ', ' )})` );

      // Other options
      const allHTML = true; // Always build this artifact
      const encodeStringMap = grunt.option( 'encodeStringMap' ) !== false;
      const compressScripts = !!grunt.option( 'compressScripts' );
      const profileFileSize = !!grunt.option( 'profileFileSize' );
      const localesOption = grunt.option( 'locales' ) || 'en'; // Default back to English for now

      for ( const brand of brands ) {
        grunt.log.writeln( `Building brand: ${brand}` );

        await phetTimingLog.startAsync( 'build-brand-' + brand, async () => {
          await buildRunnable( repo, minifyOptions, allHTML, brand, localesOption, buildLocal, encodeStringMap, compressScripts, profileFileSize );
        } );
      }
    }
  } );
} )();