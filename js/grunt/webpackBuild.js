// Copyright 2019, University of Colorado Boulder

/**
 * Runs webpack
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const chipperGlobals = require( './chipperGlobals' );
const fs = require( 'fs' );
const path = require( 'path' );
const webpack = require( 'webpack' );
const StringPlugin = require( '../webpack/StringPlugin' );

const activeRepos = fs.readFileSync( path.resolve( __dirname, '../../../perennial/data/active-repos' ), 'utf-8' ).trim().split( /\r?\n/ ).map( s => s.trim () );
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
 * Runs webpack
 * @public
 *
 * @param {string} repo
 * @returns {Promise.<string>} - The combined JS output from the process
 */
module.exports = function( repo ) {
  return new Promise( ( resolve, reject ) => {
    // Initialize global state in preparation for the require.js step.
    chipperGlobals.beforeBuild( 'phet' );

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
          mipmap: path.resolve( __dirname, '../webpack/mipmap-loader.js' ),
          'url-loader': path.resolve( __dirname, '../../node_modules/url-loader/dist/index.js' )
        }
      },

      resolve: {
        alias: aliases,
        plugins: [ new StringPlugin( reposByNamespace ) ]
      },
      module: {
        rules: [
          {
            test: /^string:/,
            use: [
              {
                loader: path.resolve( __dirname, '../webpack/string-loader.js' ),
                options: {/* ... */ }
              }
            ]
          },
          {
            test: /\.(png|jpg|gif)$/i,
            use: [
              {
                loader: path.resolve( __dirname, '../webpack/image-loader.js' ),
                options: {/* ... */ }
              },
              {
                loader: 'url-loader',
                options: {
                  limit: 999999999
                }
              }
            ]
          },
          {
            test: /\.(mp3|wav)$/i,
            use: [
              {
                loader: path.resolve( __dirname, '../webpack/sound-loader.js' ),
                options: {/* ... */ }
              },
              {
                loader: 'url-loader',
                options: {
                  limit: 999999999
                }
              }
            ]
          }
        ]
      }
    } );

    compiler.run( ( err, stats ) => {
      if ( err || stats.hasErrors() ) {
        reject( err );
      }
      else {
        resolve( fs.readFileSync( path.resolve( __dirname, `../../build/${repo}.js` ), 'utf-8' ) );
      }
    } );
  } );
};
