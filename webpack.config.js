// Copyright 2019, University of Colorado Boulder

const fs = require( 'fs' );
const path = require( 'path' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const getPreloads = require( './js/grunt/getPreloads' );

const sims = [
  'acid-base-solutions',
  'area-model-algebra',
  'area-model-decimals',
  'area-model-introduction',
  'area-model-multiplication',
  'circuit-construction-kit-ac',
  'example-sim',
  'molecule-shapes',
  'molecule-shapes-basics'
];

// NOTE: Load dependencies more specifically from a sim list in the future, so we don't have such a direct dependency.
// Repos could be deleted in the future and then prior checkouts with this wouldn't work.
const activeRepos = fs.readFileSync( path.resolve( __dirname, '../perennial/data/active-repos' ), 'utf-8' ).trim().split( /\r?\n/ ).map( s => s.trim () );
const namespaces = {};
const reposByNamespace = {};
const aliases = {};
const entries = {};

for ( const repo of activeRepos ) {
  const packageFile = path.resolve( __dirname, `../${repo}/package.json` );
  if ( fs.existsSync( packageFile ) ) {
    const packageObject = JSON.parse( fs.readFileSync( packageFile, 'utf-8' ) );
    if ( packageObject.phet && packageObject.phet.requirejsNamespace ) {
      namespaces[ repo ] = packageObject.phet.requirejsNamespace;
      reposByNamespace[ packageObject.phet.requirejsNamespace ] = repo;
      aliases[ packageObject.phet.requirejsNamespace ] = path.resolve( __dirname, `../${repo}${repo === 'brand' ? '/phet' : ''}/js` );
    }
  }
}

for ( const sim of sims ) {
  entries[ sim ] = `../${sim}/js/${sim}-main.js`;
}

// NOTE: https://webpack.js.org/plugins/split-chunks-plugin/
// Should help combine things so we don't duplicate things across bundles

module.exports = {
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
        preloads: getPreloads( sim, 'phet', true ).filter( file => {
          return !file.includes( 'google-analytics' );
        } ).map( file => `<script src="${file}"></script>` ).join( '\n' ),
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
  devtool: 'inline-source-map',

  // watch:true,

  resolveLoader: {
    alias: {
      mipmap: path.resolve( __dirname, 'js/webpack/mipmap-loader.js' )
    }
  },

  resolve: {
    alias: aliases,
    plugins: [
      {
        apply: resolver => {
          resolver.hooks.resolve.tapAsync( 'StringPlugin', ( request, resolveContext, callback ) => {
            if ( request.request.startsWith( 'string:' ) ) {
              const buildDir = path.resolve( __dirname, 'build' );
              const stringsDir = path.resolve( buildDir, 'strings' );
              if ( !fs.existsSync( buildDir ) ) {
                fs.mkdirSync( buildDir );
              }
              if ( !fs.existsSync( stringsDir ) ) {
                fs.mkdirSync( stringsDir );
              }

              const stringKey = request.request.slice( 'string:'.length );
              const namespace = stringKey.slice( 0, stringKey.indexOf( '/' ) );
              const key = stringKey.slice( namespace.length + 1 );
              const repo = reposByNamespace[ namespace ];
              const stringModuleFile = path.resolve( stringsDir, stringKey.replace( /[ \\\/\.-]/g, '_' ) + '.js' );

              // TODO: alternate locale lookup
              fs.writeFileSync( stringModuleFile, `
import strings from '${namespace}/../${repo}-strings_en.json';
export default strings[ ${JSON.stringify( key )} ].value;
` );

              const newRequest = {
                ...request,
                request: request.request,
                path: stringModuleFile
              };
              return resolver.doResolve( resolver.ensureHook( 'file' ), newRequest, null, resolveContext, callback );
            }

            const result = resolver.doResolve( resolver.ensureHook( 'parsedResolve' ), request, null, resolveContext, callback );
            return result;
          } );
        }
      }
    ]
  },
  module: {
    rules: [
      {
        test: /^string:/,
        use: [
          {
            loader: path.resolve( '../chipper/js/webpack/string-loader.js' ),
            options: {/* ... */ }
          }
        ]
      },
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