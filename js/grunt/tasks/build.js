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
const getOption = require( './util/getOption' );
const buildLocal = require( './util/buildLocal' );

const repo = getRepo();

const transpiler = new Transpiler( { silent: true } );

( async () => {
  await phetTimingLog.startAsync( 'grunt-build', async () => {

    // Parse minification keys
    const minifyKeys = Object.keys( minify.MINIFY_DEFAULTS );
    const minifyOptions = {};
    minifyKeys.forEach( minifyKey => {
      const option = getOption( `minify.${minifyKey}` );
      if ( option === true || option === false ) {
        minifyOptions[ minifyKey ] = option;
      }
    } );

    const repoPackageObject = grunt.file.readJSON( `../${repo}/package.json` );

    // Run the type checker first.
    const brands = getBrands( grunt, repo, buildLocal );

    !getOption( 'noTSC' ) && await phetTimingLog.startAsync( 'tsc', async () => {

      // We must have phet-io code checked out to type check, since simLauncher imports phetioEngine
      // do NOT run this for phet-lib, since it is type-checking things under src/, which is not desirable.
      if ( ( brands.includes( 'phet-io' ) || brands.includes( 'phet' ) ) && repo !== 'phet-lib' ) {
        const results = await tsc( `../${repo}` );
        reportTscResults( results, grunt );
      }
      else {
        console.log( 'skipping type checking' );
      }
    } );

    !getOption( 'noTranspile' ) && await phetTimingLog.startAsync( 'transpile', () => {
      // If that succeeds, then convert the code to JS
      transpiler.transpileRepos( getPhetLibs( repo ) );
    } );

    // standalone
    if ( repoPackageObject.phet.buildStandalone ) {
      console.log( 'Building standalone repository' );

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
      console.log( `Building runnable repository (${repo}, brands: ${brands.join( ', ' )})` );

      // Other options
      const allHTML = true; // Always build this artifact
      const encodeStringMap = getOption( 'encodeStringMap' ) !== false;
      const compressScripts = !!getOption( 'compressScripts' );
      const profileFileSize = !!getOption( 'profileFileSize' );
      const localesOption = getOption( 'locales' ) || 'en'; // Default back to English for now

      for ( const brand of brands ) {
        console.log( `Building brand: ${brand}` );

        await phetTimingLog.startAsync( 'build-brand-' + brand, async () => {
          await buildRunnable( repo, minifyOptions, allHTML, brand, localesOption, buildLocal, encodeStringMap, compressScripts, profileFileSize );
        } );
      }
    }
  } );
} )();