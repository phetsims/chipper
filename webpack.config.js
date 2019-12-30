// Copyright 2019, University of Colorado Boulder

const fs = require( 'fs' );
const path = require( 'path' );

// NOTE: Load dependencies more specifically from a sim list in the future, so we don't have such a direct dependency.
// Repos could be deleted in the future and then prior checkouts with this wouldn't work.
const activeRepos = fs.readFileSync( path.resolve( __dirname, '../perennial/data/active-repos' ), 'utf-8' ).trim().split( /\r?\n/ ).map( s => s.trim () );
const namespaces = {};
const aliases = {};

for ( const repo of activeRepos ) {
  const packageFile = path.resolve( __dirname, `../${repo}/package.json` );
  if ( fs.existsSync( packageFile ) ) {
    const packageObject = JSON.parse( fs.readFileSync( packageFile, 'utf-8' ) );
    if ( packageObject.phet && packageObject.phet.requirejsNamespace ) {
      namespaces[ repo ] = packageObject.phet.requirejsNamespace;
      aliases[ packageObject.phet.requirejsNamespace ] = path.resolve( __dirname, `../${repo}${repo === 'brand' ? '/phet' : ''}/js` );
    }
  }
}

// NOTE: Consider CommonChunkPlugin from https://www.toptal.com/javascript/a-guide-to-managing-webpack-dependencies
// Should help combine things so we don't duplicate things across bundles

module.exports = {
  optimization: {
    // disable uglification for development iteration
    minimize: false,
  },

  entry: {
    'example-sim': '../example-sim/js/example-sim-main.js'
  },
  output: {
    path: path.resolve( __dirname, 'build' ),
    filename: '[name].js',
    publicPath: '/js/'
  },

  watchOptions: {
    poll: true
  },
  devServer: {
    contentBase: path.join( __dirname, '../' ),
    compress: true,
    port: 9000,
    publicPath: '/js/',
    hot: true
  },
  devtool: 'inline-source-map',

  // watch:true,

  resolve: {
    alias: aliases
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/i,
        use: [
          {
            loader: path.resolve( '../chipper/js/webpack/image-loader.js' ),
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
            loader: path.resolve( '../chipper/js/webpack/sound-loader.js' ),
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
};