// Copyright 2019, University of Colorado Boulder
/* eslint-disable */ // TODO: lint this file https://github.com/phetsims/chipper/issues/837

const fs = require( 'fs' );
const path = require( 'path' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const getDependencies = require( './js/grunt/getDependencies' );
const getPreloads = require( './js/grunt/getPreloads' );
const getStringRepos = require( './js/grunt/getStringRepos' );

const sims = [
  'area-model-algebra',
  'area-model-decimals'
];

// NOTE: https://webpack.js.org/plugins/split-chunks-plugin/
// Should help combine things so we don't duplicate things across bundles

module.exports = ( async () => {

  // NOTE: Load dependencies more specifically from a sim list in the future, so we don't have such a direct dependency.
  // Repos could be deleted in the future and then prior checkouts with this wouldn't work.
  const activeRepos = fs.readFileSync( path.resolve( __dirname, '../perennial/data/active-repos' ), 'utf-8' ).trim().split( /\r?\n/ ).map( s => s.trim() );
  const reposByNamespace = {};
  const aliases = {};

  for ( const repo of activeRepos ) {
    const packageFile = path.resolve( __dirname, `../${repo}/package.json` );
    if ( fs.existsSync( packageFile ) ) {
      const packageObject = JSON.parse( fs.readFileSync( packageFile, 'utf-8' ) );
      if ( packageObject.phet && packageObject.phet.requirejsNamespace ) {
        reposByNamespace[ packageObject.phet.requirejsNamespace ] = repo;
        aliases[ packageObject.phet.requirejsNamespace ] = path.resolve( __dirname, `../${repo}${repo === 'brand' ? '/phet' : ''}/js` );
      }
    }
  }

  const entries = {};
  const stringReposMap = {};

  for ( const sim of sims ) {
    entries[ sim ] = `../${sim}/js/${sim}-main.js`;
    stringReposMap[ sim ] = await getStringRepos( sim );
  }

  return {
    optimization: {
      // disable uglification for development iteration
      minimize: false,

      splitChunks: {
        chunks: 'all'
      }
    },

    entry: entries,

    output: {
      path: path.resolve( __dirname, 'build' ),
      filename: '[name].js',
      publicPath: '/dist/'
    },

    // NOTE: Should be possible to include other brands here as well
    plugins: sims.map( sim => {
      return new HtmlWebpackPlugin( {
        title: sim,
        filename: `${sim}_phet.html`,
        template: 'templates/sim-webpack.ejs',
        templateParameters: {
          packageObject: fs.readFileSync( `../${sim}/package.json`, 'utf-8' ),
          stringRepos: JSON.stringify( stringReposMap[ sim ] ),
          preloads: [
            '../chipper/js/load-runtime-strings.js',
            ...getPreloads( sim, 'phet', true ).filter( file => {
              return !file.includes( 'google-analytics' );
            } )
          ].map( file => `<script src="${file}"></script>` ).join( '\n' ),
          title: sim
        },
        inject: 'body',
        minify: false,
        hash: true,
        chunks: [ sim ]
      } );
    } ),

    watchOptions: {
      poll: true
    },
    devServer: {
      contentBase: path.join( __dirname, '../' ),
      compress: true,
      port: 9000,
      publicPath: '/dist/',
      hot: true
    },
    devtool: 'inline-source-map'
  }
} )();
