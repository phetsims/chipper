// Copyright 2019, University of Colorado Boulder
/* eslint-disable */ // TODO: lint this file https://github.com/phetsims/chipper/issues/837

const fs = require( 'fs' );
const path = require( 'path' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const getPreloads = require( './js/grunt/getPreloads' );

const sims = [
  'acid-base-solutions',
  // 'area-model-algebra',
  // 'area-model-decimals',
  // 'area-model-introduction',
  // 'area-model-multiplication',
  // 'circuit-construction-kit-ac',
  // 'example-sim',
  // 'molarity',
  // 'molecule-shapes',
  // 'molecule-shapes-basics'

  // 'area-builder',
  // 'arithmetic',
  // 'atomic-interactions',
  // 'balancing-act',
  // 'balloons-and-static-electricity',
  // 'build-a-molecule',
  // 'build-an-atom',
  // 'charges-and-fields',
  // 'circuit-construction-kit-dc-virtual-lab',
  // 'coulombs-law',
  // 'energy-forms-and-changes',
  // 'estimation',
  // 'expression-exchange',
  // 'faradays-law',
  // 'forces-and-motion-basics',
  // 'friction',
  // 'gravity-force-lab',
  // 'gravity-force-lab-basics',
  // 'isotopes-and-atomic-mass',
  // 'least-squares-regression',
  // 'molecules-and-light',
  // 'number-line-integers',
  // 'number-play',
  // 'rutherford-scattering',
  // 'states-of-matter',
  // 'states-of-matter-basics',

  // 'acid-base-solutions',
  // // 'area-builder',
  // 'area-model-algebra',
  // 'area-model-decimals',
  // 'area-model-introduction',
  // 'area-model-multiplication',
  // // 'arithmetic',
  // // 'atomic-interactions',
  // // 'balancing-act',
  // 'balancing-chemical-equations',
  // // 'balloons-and-static-electricity',
  // 'beers-law-lab',
  // 'bending-light',
  // 'blackbody-spectrum',
  // 'blast',
  // 'build-a-fraction',
  // // 'build-a-molecule',
  // // 'build-an-atom',
  // 'bumper',
  // 'buoyancy',
  // 'calculus-grapher',
  // 'capacitor-lab-basics',
  // 'chains',
  // // 'charges-and-fields',
  // 'circuit-construction-kit-ac',
  // 'circuit-construction-kit-black-box-study',
  // 'circuit-construction-kit-dc',
  // // 'circuit-construction-kit-dc-virtual-lab',
  // 'color-vision',
  // 'collision-lab',
  // 'concentration',
  // // 'coulombs-law',
  // 'curve-fitting',
  // 'density',
  // 'diffusion',
  // // 'energy-forms-and-changes',
  // 'energy-skate-park',
  // 'energy-skate-park-basics',
  // 'equality-explorer',
  // 'equality-explorer-basics',
  // 'equality-explorer-two-variables',
  // // 'estimation',
  // 'example-sim',
  // // 'expression-exchange',
  // // 'faradays-law',
  // 'fluid-pressure-and-flow',
  // // 'forces-and-motion-basics',
  // 'fraction-comparison',
  // 'fraction-matcher',
  // 'fractions-equality',
  // 'fractions-intro',
  // 'fractions-mixed-numbers',
  // // 'friction',
  // 'function-builder',
  // 'function-builder-basics',
  // 'gas-properties',
  // 'gases-intro',
  // 'gene-expression-essentials',
  // 'graphing-lines',
  // 'graphing-quadratics',
  // 'graphing-slope-intercept',
  // 'gravity-and-orbits',
  // // 'gravity-force-lab',
  // // 'gravity-force-lab-basics',
  // 'hookes-law',
  // 'interaction-dashboard',
  // // 'isotopes-and-atomic-mass',
  // 'john-travoltage',
  // // 'least-squares-regression',
  // 'make-a-ten',
  // 'masses-and-springs',
  // 'masses-and-springs-basics',
  // 'models-of-the-hydrogen-atom',
  // 'molarity',
  // // 'molecules-and-light',
  // 'molecule-polarity',
  // 'molecule-shapes',
  // 'molecule-shapes-basics',
  // 'natural-selection',
  // 'neuron',
  // // 'number-line-integers',
  // // 'number-play',
  // 'ohms-law',
  // 'optics-lab',
  // 'pendulum-lab',
  // 'ph-scale',
  // 'ph-scale-basics',
  // 'phet-io-test-sim',
  // 'plinko-probability',
  // 'projectile-motion',
  // 'proportion-playground',
  // 'reactants-products-and-leftovers',
  // 'resistance-in-a-wire',
  // // 'rutherford-scattering',
  // 'simula-rasa',
  // // 'states-of-matter',
  // // 'states-of-matter-basics',
  // 'trig-tour',
  // 'under-pressure',
  // 'unit-rates',
  // 'vector-addition',
  // 'vector-addition-equations',
  // 'wave-interference',
  // 'wave-on-a-string',
  // 'waves-intro',
  // 'wilder'
];

// NOTE: Load dependencies more specifically from a sim list in the future, so we don't have such a direct dependency.
// Repos could be deleted in the future and then prior checkouts with this wouldn't work.
const activeRepos = fs.readFileSync( path.resolve( __dirname, '../perennial/data/active-repos' ), 'utf-8' ).trim().split( /\r?\n/ ).map( s => s.trim() );
const reposByNamespace = {};
const aliases = {};
const entries = {};

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
  module: {
    rules: [
      // rules for modules (configure loaders, parser options, etc.)
      {
        test: /phetioEngine/,
        use: path.resolve( __dirname, 'test-webpack-multi-brands/phetioStub-loader.js' )
      }
    ]
  }
};