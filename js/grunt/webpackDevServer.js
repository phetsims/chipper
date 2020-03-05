// Copyright 2020, University of Colorado Boulder

/**
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const child_process = require( 'child_process' );
const fs = require( 'fs' );
const getPreloads = require( './getPreloads' );
const getStringRepos = require( './getStringRepos' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' ); // eslint-disable-line require-statement-match
const path = require( 'path' );
const webpack = require( 'webpack' );
const WebpackDevServer = require( 'webpack-dev-server' ); // eslint-disable-line require-statement-match

/**
 * @param {string[]} repos
 * @param {number} port
 * @param {string|undefined} devtool - one of the values for sourcemap generation specified at
 *                                   - https://webpack.js.org/configuration/devtool/ or undefined for (none)
 * @param {boolean} openChrome - if true, opens the launched URLs in Chrome using "open -a".  Tested on Mac
 * @returns {Promise<void>}
 */
module.exports = async ( repos, port, devtool, openChrome = false ) => {
  // NOTE: Load dependencies more specifically from a sim list in the future, so we don't have such a direct dependency.
  // Repos could be deleted in the future and then prior checkouts with this wouldn't work.
  const activeRepos = fs.readFileSync( '../perennial/data/active-repos', 'utf-8' ).trim().split( /\r?\n/ ).map( s => s.trim() );
  const reposByNamespace = {};
  const aliases = {};

  for ( const repo of activeRepos ) {
    const packageFile = `../${repo}/package.json`;
    if ( fs.existsSync( packageFile ) ) {
      const packageObject = JSON.parse( fs.readFileSync( packageFile, 'utf-8' ) );
      if ( packageObject.phet && packageObject.phet.requirejsNamespace ) {
        reposByNamespace[ packageObject.phet.requirejsNamespace ] = repo;
        aliases[ packageObject.phet.requirejsNamespace ] = path.resolve( __dirname, `../../../${repo}${repo === 'brand' ? '/phet' : ''}/js` );
      }
    }
  }

  const entries = {};
  const stringReposMap = {};

  for ( const repo of repos ) {
    entries[ repo ] = `../${repo}/js/${repo}-main.js`;
    stringReposMap[ repo ] = await getStringRepos( repo );
  }

  const compiler = webpack( {
    mode: 'development',

    optimization: {
      // disable uglification for development iteration
      minimize: false,

      splitChunks: {
        chunks: 'all'
      }
    },

    entry: entries,

    output: {
      path: path.resolve( __dirname, '../../build' ),
      filename: '[name].js',
      publicPath: '/dist/'
    },

    // NOTE: Should be possible to include other brands here as well
    plugins: repos.map( repo => {
      return new HtmlWebpackPlugin( {
        title: repo,
        filename: `${repo}_phet.html`,
        template: '../chipper/templates/sim-webpack.ejs',
        templateParameters: ( compilation, assets, assetTags, options ) => {
          return {
            compilation: compilation,
            webpackConfig: compilation.options,
            htmlWebpackPlugin: {
              tags: assetTags,
              files: assets,
              options: options
            },
            packageObject: fs.readFileSync( `../${repo}/package.json`, 'utf-8' ),
            stringRepos: JSON.stringify( stringReposMap[ repo ] ),
            preloads: [
              '../chipper/js/load-runtime-strings.js',
              ...getPreloads( repo, 'phet', true ).filter( file => {
                return !file.includes( 'google-analytics' );
              } )
            ].map( file => `<script src="${file}"></script>` ).join( '\n' ),
            title: repo
          };
        },
        inject: false,
        minify: false,
        hash: true,
        chunks: [ repo ]
      } );
    } ),

    watchOptions: {
      poll: true
    },

    devtool: devtool
  } );

  const server = new WebpackDevServer( compiler, {
    contentBase: path.join( __dirname, '../../../' ),
    compress: true,
    port: port,
    publicPath: '/dist/',
    hot: false
  } );

  server.listen( port, '0.0.0.0', () => {
    repos.forEach( repo => {
      const URL = `http://localhost:${port}/dist/${repo}_phet.html?brand=phet&ea`;
      console.log( URL );

      if ( openChrome ) {
        child_process.exec( `open -a "Google Chrome" ${URL}`, () => {} );
      }
    } );
  } );
};
