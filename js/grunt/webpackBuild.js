// Copyright 2019, University of Colorado Boulder

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

const usedModules = [];

class ListUsedModulesPlugin {
  apply( compiler ) {
    compiler.hooks.emit.tap( 'ListUsedModulesPlugin', compilation => {
      compilation.chunks.forEach( chunk => {
        usedModules.push( ...Array.from( chunk.entryModule.buildInfo.fileDependencies ) );
      } );
    } );
  }
}

const getRelativeModules = () => {
  for ( let i = 0; i < usedModules[ 0 ].length; i++ ) {
    for ( const usedModule of usedModules ) {
      if ( usedModule[ i ] !== usedModules[ 0 ][ i ] ) {
        return usedModules.map( module => module.slice( i ) );
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

    // Zero out used modules
    usedModules.length = 0;

    // Create plugins to ignore brands that we are not building at this time.
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
      optimization: {
        minimize: false
      },

      entry: {
        repo: `../${repo}/js/${repo}-main.js`
      },
      output: {
        path: path.resolve( __dirname, '../../build' ),
        filename: `${repo}.js`
      },

      resolveLoader: {
        alias: {
          'url-loader': path.resolve( __dirname, '../../node_modules/url-loader/dist/index.js' )
        }
      },

      plugins: [
        new ListUsedModulesPlugin(),

        // Exclude brand specific code. This includes all of the `phet-io` repo for non phet-io builds.
        ...( brand === 'phet' ? [ ignorePhetioBrand, ignorePhetioRepo, ignoreAdaptedFromPhetBrand ] :
             brand === 'phet-io' ? [ ignorePhetBrand, ignoreAdaptedFromPhetBrand ] :
             brand === 'adapted-from-phet' ? [ ignorePhetBrand, ignorePhetioBrand, ignorePhetioRepo ] : [] )
      ],
      module: {

        // rules for modules (configure loaders, parser options, etc.)
        rules: []
      }
    } );

    compiler.run( ( err, stats ) => {
      if ( err || stats.hasErrors() ) {
        console.log( stats );
        reject( err );
      }
      else {
        resolve( {
          js: fs.readFileSync( path.resolve( __dirname, `../../build/${repo}.js` ), 'utf-8' ),
          usedModules: getRelativeModules()
        } );
      }
    } );
  } );
};
