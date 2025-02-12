// Copyright 2013-2025, University of Colorado Boulder

/**
 * Builds the repository. Depending on the repository type (runnable/wrapper/standalone), the result may vary.
 * Runnable build options:
 *  --report-media - Will iterate over all of the license.json files and reports any media files, set to false to opt out.
 *  --brands={{BRANDS} - Can be * (build all supported brands), or a comma-separated list of brand names. Will fall back to using
 *                       build-local.json's brands (or adapted-from-phet if that does not exist)
 *  --XHTML - Includes an xhtml/ directory in the build output that contains a runnable XHTML form of the sim (with
 *            a separated-out JS file).
 *  --locales={{LOCALES}} - Can be * (build all available locales, "en" and everything in babel), or a comma-separated list of locales
 *  --transpile=false - To opt out of transpiling repos before build. This should only be used if you are confident that chipper/dist is already correct (to save time).
 *  --type-check=false - To opt out of type checking before build. This should only be used if you are confident that TypeScript is already errorless (to save time).
 *  --encodeStringMap=false - Disables the encoding of the string map in the built file. This is useful for debugging.
 *
 * Minify-specific options:
 *  --minify.babelTranspile=false - Disables babel transpilation phase.
 *  --minify.uglify=false - Disables uglification, so the built file will include (essentially) concatenated source files.
 *  --minify.mangle=false - During uglification, it will not "mangle" variable names (where they get renamed to short constants to reduce file size.)
 *  --minify.beautify=true - After uglification, the source code will be syntax formatted nicely
 *  --minify.stripAssertions=false - During uglification, it will strip assertions.
 *  --minify.stripLogging=false - During uglification, it will not strip logging statements.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import assert from 'assert';
import fs, { readFileSync } from 'fs';
import path from 'path';
import phetTimingLog from '../../../../perennial-alias/js/common/phetTimingLog.js';
import getBrands from '../../../../perennial-alias/js/grunt/tasks/util/getBrands.js';
import getOption, { isOptionKeyProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import typeCheck from '../../../../perennial-alias/js/grunt/typeCheck.js';
import grunt from '../../../../perennial-alias/js/npm-dependencies/grunt.js';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';
import transpile from '../../common/transpile.js';
import buildRunnable from '../buildRunnable.js';
import buildStandalone from '../buildStandalone.js';
import getPhetLibs from '../getPhetLibs.js';
import gruntTimingLog from '../gruntTimingLog.js';
import minify from '../minify.js';

const repo = getRepo();

const NO_TYPE_CHECK = [ 'phet-lib' ];
/**
 * Immediately run the build and export the promise in case the client wants to await the task.
 */
export const buildPromise = ( async () => {
  await phetTimingLog.startAsync( 'grunt-build', async () => {

    // Parse minification keys
    const minifyKeys = Object.keys( minify.MINIFY_DEFAULTS );
    const minifyOptions: IntentionalAny = {};
    minifyKeys.forEach( minifyKey => {
      const option = getOption( `minify.${minifyKey}` );
      if ( option === true || option === false ) {
        minifyOptions[ minifyKey ] = option;
      }
    } );

    const repoPackageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );

    // Run the type checker first.
    const brands = getBrands( repo );

    const shouldTypeCheck = isOptionKeyProvided( 'type-check' ) ? getOption( 'type-check' ) : true;
    shouldTypeCheck && await phetTimingLog.startAsync( 'type-check', async () => {

      // We must have phet-io code checked out to type check, since simLauncher imports phetioEngine
      // do NOT run this for phet-lib, since it is type-checking things under src/, which is not desirable.
      if ( !NO_TYPE_CHECK.includes( repo ) &&
           ( ( brands.includes( 'phet-io' ) || brands.includes( 'phet' ) ||
               repoPackageObject.phet.buildStandalone // no brand for standalone
           ) ) ) {
        const success = await typeCheck( { repo: repo } );
        if ( !success ) {
          throw new Error( 'Type checking failed' );
        }
      }
      else {
        console.log( 'skipping type checking' );
      }
    }, {
      timingCallback: time => gruntTimingLog( 'Type Check complete', time )
    } );

    const doTranspile = isOptionKeyProvided( 'transpile' ) ? getOption( 'transpile' ) : true;
    doTranspile && await phetTimingLog.startAsync( 'transpile', async () => {

      prepForTranspile( brands );

      // If that succeeds, then convert the code to JS
      await transpile( {
        repos: getPhetLibs( repo ),
        silent: true
      } );
    }, {
      timingCallback: time => gruntTimingLog( 'Transpile complete', time )
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
      // eslint-disable-next-line require-atomic-updates
      minifyOptions.minify = false;
      // eslint-disable-next-line require-atomic-updates
      minifyOptions.babelTranspile = false;
      // eslint-disable-next-line require-atomic-updates
      minifyOptions.uglify = false;
      // eslint-disable-next-line require-atomic-updates
      minifyOptions.isDebug = true;
      fs.writeFileSync( `${parentDir}/${repo}.debug.js`, await buildStandalone( repo, minifyOptions ) );

      if ( repoPackageObject.phet.standaloneTranspiles ) {
        for ( const file of repoPackageObject.phet.standaloneTranspiles ) {
          fs.writeFileSync( `../${repo}/build/${path.basename( file )}`, minify( grunt.file.read( file ) ) );
        }
      }
    }
    else {

      const localPackageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
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
          await buildRunnable( repo, minifyOptions, allHTML, brand, localesOption, encodeStringMap, compressScripts, profileFileSize, shouldTypeCheck );
        }, {
          timingCallback: time => gruntTimingLog( `Brand ${brand} complete`, time )
        } );
      }
    }
  } );

  // Pre-transpile step, needed to delete files that won't be cleared out during transpile, see https://github.com/phetsims/chipper/issues/1554
  function prepForTranspile( brands: string[] ): void {
    if ( brands.includes( 'phet-io' ) ) {
      try {
        fs.rmSync( '../chipper/dist/js/phet-io-sim-specific', { recursive: true } );
      }
      catch( e ) {

        // Graceful handling if the directory doesn't exist.
        if ( !( e instanceof Error && e.message.includes( 'no such file or directory' ) ) ) {
          throw e;
        }
      }
    }
  }
} )();