// Copyright 2019-2020, University of Colorado Boulder

/**
 * Runs webpack - DO NOT RUN MULTIPLE CONCURRENTLY
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const chipperGlobals = require( './chipperGlobals' );
const fs = require( 'fs' );
const path = require( 'path' );
const webpack = require( 'webpack' );

const activeRepos = fs.readFileSync( path.resolve( __dirname, '../../../perennial/data/active-repos' ), 'utf-8' ).trim().split( /\r?\n/ ).map( s => s.trim() );
const reposByNamespace = {};
const aliases = {};

for ( const repo of activeRepos ) {
  const packageFile = path.resolve( __dirname, `../../../${repo}/package.json` );
  if ( fs.existsSync( packageFile ) ) {
    const packageObject = JSON.parse( fs.readFileSync( packageFile, 'utf-8' ) );
    if ( packageObject.phet && packageObject.phet.requirejsNamespace ) {
      reposByNamespace[ packageObject.phet.requirejsNamespace ] = repo;
      aliases[ packageObject.phet.requirejsNamespace ] = path.resolve( __dirname, `../../../${repo}${repo === 'brand' ? '/phet' : ''}/js` );
    }
  }
}

/**
 * Convert absolute paths of modules to relative ones
 * @param {Array.<string>} modules
 * @returns {Array.<string>}
 */
const getRelativeModules = modules => {
  for ( let i = 0; i < modules[ 0 ].length; i++ ) {
    for ( const usedModule of modules ) {
      if ( usedModule[ i ] !== modules[ 0 ][ i ] ) {
        return modules.map( module => module.slice( i ) );
      }
    }
  }
  throw new Error( 'modules are all the same?' );
};

/**
 * Runs webpack - DO NOT RUN MULTIPLE CONCURRENTLY
 * @public
 *
 * @param {string} repo
 * @param {string} brand
 * @returns {Promise.<string>} - The combined JS output from the process
 */
module.exports = function( repo, brand ) {
  return new Promise( ( resolve, reject ) => {
    // Initialize global state in preparation for the require.js step.
    chipperGlobals.beforeBuild( 'phet' );

    // Create plugins to ignore brands that we are not building at this time. Here "resource" is the module getting
    // imported, and "context" is the directory that holds the module doing the importing. This is split up because
    // of how brands are loaded in SimLauncher.js. They are a dynamic import who's import path resolves to the current
    // brand. The way that webpack builds this is by creating a map of all the potential resources that could be loaded
    // by that import (by looking at the file structure). Thus the following resource/context regex split is accounting
    // for the "map" created in the built webpack file, in which the "resource" starts with "./{{brand}}" even though
    // the SimLauncher line includes the parent directory: "brand/". For more details see https://github.com/phetsims/chipper/issues/879
    const ignorePhetBrand = new webpack.IgnorePlugin( { resourceRegExp: /\/phet\//, contextRegExp: /brand/ } );
    const ignorePhetioBrand = new webpack.IgnorePlugin( { resourceRegExp: /\/phet-io\//, contextRegExp: /brand/ } );
    const ignoreAdaptedFromPhetBrand = new webpack.IgnorePlugin( {
      resourceRegExp: /\/adapted-from-phet\//,
      contextRegExp: /brand/
    } );

    // Allow builds for developers that do not have the phet-io repo checked out. IgnorePlugin will skip any require
    // that matches the following regex.
    const ignorePhetioRepo = new webpack.IgnorePlugin( {
      resourceRegExp: /\/phet-io\// // ignore anyting in a phet-io named directory
    } );

    const compiler = webpack( {
      // We uglify as a step after this, with many custom rules
      optimization: {
        minimize: false
      },

      // Simulations or runnables will have a single entry point
      entry: {
        repo: `../${repo}/js/${repo}-main.js`
      },

      // We output our builds to chipper/build/
      output: {
        path: path.resolve( __dirname, '../../build' ),
        filename: `${repo}.js`
      },

      // {Array.<Plugin>}
      plugins:

      // Exclude brand specific code. This includes all of the `phet-io` repo for non phet-io builds.
        ( brand === 'phet' ? [ ignorePhetioBrand, ignorePhetioRepo, ignoreAdaptedFromPhetBrand ] :
          brand === 'phet-io' ? [ ignorePhetBrand, ignoreAdaptedFromPhetBrand ] :
          brand === 'adapted-from-phet' ? [ ignorePhetBrand, ignorePhetioBrand, ignorePhetioRepo ] : [] ),

      module: {
        // rules for modules (configure loaders, parser options, etc.)
        rules: []
      }
    } );

    compiler.run( ( err, stats ) => {
      if ( err || stats.hasErrors() ) {
        console.error( 'Webpack build errors:', stats.compilations.errors );
        reject( err || stats.compilation.errors[ 0 ] );
      }
      else {
        const jsFile = path.resolve( __dirname, `../../build/${repo}.js` );
        const js = fs.readFileSync( jsFile, 'utf-8' );

        fs.unlinkSync( jsFile );

        resolve( {
          js: js,
          usedModules: getRelativeModules( Array.from( stats.compilation.fileDependencies ) )
        } );
      }
    } );
  } );
};
