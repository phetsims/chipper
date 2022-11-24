// Copyright 2019-2020, University of Colorado Boulder

/**
 * Runs webpack - DO NOT RUN MULTIPLE CONCURRENTLY
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const ChipperConstants = require( '../common/ChipperConstants' );
const fs = require( 'fs' );
const path = require( 'path' );
const webpack = require( 'webpack' );

const activeRepos = [ 'acid-base-solutions', 'aqua', 'area-builder', 'area-model-algebra', 'area-model-common', 'area-model-decimals', 'area-model-introduction', 'area-model-multiplication', 'arithmetic', 'assert', 'atomic-interactions', 'axon', 'babel', 'balancing-act', 'balancing-chemical-equations', 'balloons-and-static-electricity', 'bamboo', 'beers-law-lab', 'bending-light', 'binder', 'blackbody-spectrum', 'blast', 'brand', 'build-a-fraction', 'build-a-molecule', 'build-a-nucleus', 'build-an-atom', 'bumper', 'buoyancy', 'calculus-grapher', 'capacitor-lab-basics', 'center-and-variability', 'chains', 'charges-and-fields', 'chipper', 'circuit-construction-kit-ac', 'circuit-construction-kit-ac-virtual-lab', 'circuit-construction-kit-black-box-study', 'circuit-construction-kit-common', 'circuit-construction-kit-dc', 'circuit-construction-kit-dc-virtual-lab', 'collision-lab', 'color-vision', 'concentration', 'coulombs-law', 'counting-common', 'curve-fitting', 'decaf', 'density', 'density-buoyancy-common', 'diffusion', 'dot', 'eating-exercise-and-energy', 'energy-forms-and-changes', 'energy-skate-park', 'energy-skate-park-basics', 'equality-explorer', 'equality-explorer-basics', 'equality-explorer-two-variables', 'estimation', 'example-sim', 'expression-exchange', 'faradays-law', 'fenster', 'fluid-pressure-and-flow', 'forces-and-motion-basics', 'fourier-making-waves', 'fraction-comparison', 'fraction-matcher', 'fractions-common', 'fractions-equality', 'fractions-intro', 'fractions-mixed-numbers', 'friction', 'function-builder', 'function-builder-basics', 'gas-properties', 'gases-intro', 'gene-expression-essentials', 'geometric-optics', 'geometric-optics-basics', 'graphing-lines', 'graphing-quadratics', 'graphing-slope-intercept', 'gravity-and-orbits', 'gravity-force-lab', 'gravity-force-lab-basics', 'greenhouse-effect', 'griddle', 'hookes-law', 'interaction-dashboard', 'inverse-square-law-common', 'isotopes-and-atomic-mass', 'john-travoltage', 'joist', 'kite', 'least-squares-regression', 'make-a-ten', 'masses-and-springs', 'masses-and-springs-basics', 'mean-share-and-balance', 'mobius', 'models-of-the-hydrogen-atom', 'molarity', 'molecule-polarity', 'molecule-shapes', 'molecule-shapes-basics', 'molecules-and-light', 'my-solar-system', 'natural-selection', 'neuron', 'nitroglycerin', 'normal-modes', 'number-compare', 'number-line-common', 'number-line-distance', 'number-line-integers', 'number-line-operations', 'number-play', 'ohms-law', 'optics-lab', 'pendulum-lab', 'perennial', 'perennial-alias', 'ph-scale', 'ph-scale-basics', 'phet-core', 'phet-info', 'phet-io', 'phet-io-client-guides', 'phet-io-sim-specific', 'phet-io-test-sim', 'phet-io-website', 'phet-io-wrapper-classroom-activity', 'phet-io-wrapper-haptics', 'phet-io-wrapper-hookes-law-energy', 'phet-io-wrapper-lab-book', 'phet-io-wrappers', 'phet-lib', 'phetcommon', 'phetmarks', 'phettest', 'plinko-probability', 'projectile-motion', 'proportion-playground', 'qa', 'quadrilateral', 'quake', 'query-string-machine', 'ratio-and-proportion', 'reactants-products-and-leftovers', 'resistance-in-a-wire', 'rosetta', 'rutherford-scattering', 'scenery', 'scenery-phet', 'sherpa', 'shred', 'simula-rasa', 'skiffle', 'sound', 'states-of-matter', 'states-of-matter-basics', 'studio', 'sun', 'tambo', 'tandem', 'tangible', 'tappi', 'tasks', 'trig-tour', 'twixt', 'under-pressure', 'unit-rates', 'utterance-queue', 'vector-addition', 'vector-addition-equations', 'vegas', 'vibe', 'wave-interference', 'wave-on-a-string', 'waves-intro', 'weddell', 'wilder', 'xray-diffraction', 'yotta' ];
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
  const root = path.resolve( __dirname, '../../../' );
  return modules

    // Webpack 5 reports intermediate paths which need to be filtered out
    .filter( m => fs.lstatSync( m ).isFile() )

    // Get the relative path to the root, like "joist/js/Sim.js" or, on Windows, "joist\js\Sim.js"
    .map( m => path.relative( root, m ) )

    // Some developers check in a package.json to the root of the checkouts, as described in https://github.com/phetsims/chipper/issues/494#issuecomment-821292542
    // like: /Users/samreid/apache-document-root/package.json. This powers grunt only and should not be included in the modules
    .filter( m => m !== '../package.json' && m !== '..\\package.json' );
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
    // Create plugins to ignore brands that we are not building at this time. Here "resource" is the module getting
    // imported, and "context" is the directory that holds the module doing the importing. This is split up because
    // of how brands are loaded in simLauncher.js. They are a dynamic import who's import path resolves to the current
    // brand. The way that webpack builds this is by creating a map of all the potential resources that could be loaded
    // by that import (by looking at the file structure). Thus the following resource/context regex split is accounting
    // for the "map" created in the built webpack file, in which the "resource" starts with "./{{brand}}" even though
    // the simLauncher line includes the parent directory: "brand/". For more details see https://github.com/phetsims/chipper/issues/879
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
      // We uglify as a step after this, with many custom rules. So we do NOT optimize or uglify in this step.
      optimization: {
        minimize: false
      },

      // Simulations or runnables will have a single entry point
      entry: {
        repo: `../${repo}/js/${repo}-main.js`
      },

      // We output our builds to chipper/build/
      output: {
        path: path.resolve( __dirname, `../../${ChipperConstants.BUILD_DIR}` ),
        filename: `${repo}.js`,
        hashFunction: 'xxhash64' // for Node 17+, see https://github.com/webpack/webpack/issues/14532
      },

      // {Array.<Plugin>}
      plugins:

      // Exclude brand specific code. This includes all of the `phet-io` repo for non phet-io builds.
        ( brand === 'phet' ? [ ignorePhetioBrand, ignorePhetioRepo, ignoreAdaptedFromPhetBrand ] :
          brand === 'phet-io' ? [ ignorePhetBrand, ignoreAdaptedFromPhetBrand ] :
          brand === 'adapted-from-phet' ? [ ignorePhetBrand, ignorePhetioBrand, ignorePhetioRepo ] : [] )
    } );

    compiler.run( ( err, stats ) => {
      if ( err || stats.hasErrors() ) {
        console.error( 'Webpack build errors:', stats.compilation.errors );
        reject( err || stats.compilation.errors[ 0 ] );
      }
      else {
        const jsFile = path.resolve( __dirname, `../../${ChipperConstants.BUILD_DIR}/${repo}.js` );
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
