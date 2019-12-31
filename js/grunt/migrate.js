// Copyright 2019, University of Colorado Boulder

/* eslint-disable */

/**
 * Prototyping for https://github.com/phetsims/chipper/issues/820
 *
 * @param {Object} grunt
 * @param {Object} gruntConfig
 */

'use strict';

const execute = require( './execute' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const generateDevelopmentHTML = require( './generateDevelopmentHTML' );

const replace = ( str, search, replacement ) => {
  return str.split( search ).join( replacement );
};

const migrateFile = async ( repo, relativeFile ) => {
  if ( relativeFile.endsWith( '/PhetioIDUtils.js' ) ) {
    return;
  }
  if ( relativeFile.endsWith( '/copyWithSortedKeys.js' ) ) {
    return;
  }
  const path = '../' + repo + '/' + relativeFile;

  let contents = fs.readFileSync( path, 'utf-8' );
  contents = replace( contents, '= require( \'string!', '= require( \'string:' );
  contents = replace( contents, '= require( \'ifphetio!', '= function(){return function(){ return function(){}; };}; // ' );

  contents = replace( contents, 'require( \'text!REPOSITORY/package.json\' )', 'JSON.stringify( phet.chipper.packageObject )' );

  if ( contents.includes( 'define( require => {' ) ) {
    contents = replace( contents, `define( require => {`, `` );
    contents = contents.slice( 0, contents.lastIndexOf( '}' ) );
  }

  const returnInherit = contents.lastIndexOf( 'return inherit( ' );
  if ( returnInherit >= 0 ) {
    contents = replace( contents, `return inherit( `, `export default inherit( ` );
  }

  const lastReturn = contents.lastIndexOf( 'return ' );
  if ( lastReturn >= 0 && returnInherit === -1 ) {
    contents = contents.substring( 0, lastReturn ) + 'export default ' + contents.substring( lastReturn + 'return '.length );
  }

  // contents = replace(contents,`return inherit( Node, ScreenView, {`,`export default inherit( Node, ScreenView, {`);
  // contents = replace(contents,`export default Math.min( width / this.layoutBounds.width, height / this.layoutBounds.height );`,`return Math.min( width / this.layoutBounds.width, height / this.layoutBounds.height );`);

  // const Namespace = require( 'PHET_CORE/Namespace' );
  contents = replace( contents, `const Namespace = require( 'PHET_CORE/Namespace' );`, `import Namespace from 'PHET_CORE/Namespace'` );

  let lines = contents.split( /\r?\n/ );

  let fixMipmap = line => {
    if ( line.trim().startsWith( 'import ' ) && line.indexOf( `from 'mipmap!` ) >= 0 ) {
      const term = line.trim().split( ' ' )[ 1 ];
      const repo = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );
      const tail = line.substring( line.indexOf( '/' ) + 1 );
      line = `  import ${term} from 'mipmap!${repo}/../images/${tail}`;
    }
    return line;
  };

  let fixImage = line => {
    if ( line.trim().startsWith( 'import ' ) && line.indexOf( `from 'image!` ) >= 0 ) {
      const term = line.trim().split( ' ' )[ 1 ];
      const repo = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );
      const tail = line.substring( line.indexOf( '/' ) + 1 );
      line = `  import ${term} from '${repo}/../images/${tail}`;
    }
    return line;
  };

  let fixSounds = line => {
    if ( line.trim().startsWith( 'import ' ) && line.indexOf( `from 'sound!` ) >= 0 ) {
      const term = line.trim().split( ' ' )[ 1 ];
      const repo = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );
      const tail = line.substring( line.indexOf( '/' ) + 1 );
      line = `import ${term} from '${repo}/../sounds/${tail}`;
    }
    return line;
  };

  lines = lines.map( line => {
    // return 'hello ' + line;
    if ( line.trim().startsWith( 'const ' ) && line.indexOf( ' = require( ' ) >= 0 ) {
      // const Bounds2 = require( 'DOT/Bounds2' );
      // becomes
      // import Bounds2 from 'DOT/Bounds2';
      line = replace( line, 'const ', 'import ' );
      line = replace( line, ' = require( ', ' from ' );
      line = replace( line, '\' );', '\';' );
    }
    line = fixMipmap( line );
    line = fixImage( line );
    line = fixSounds( line );

    return line;
  } );
  contents = lines.join( '\n' );

  contents = replace( contents, `return inherit;`, `export default inherit;` );
  contents = replace( contents, `' ).default;`, `';` );

  // contents = replace( contents, `import lightBulbImage from 'mipmap!CIRCUIT_CONSTRUCTION_KIT_COMMON/lightbulb-middle.png';`, `import lightBulbImage from 'CIRCUIT_CONSTRUCTION_KIT_COMMON/../images/lightbulb-middle.png';` )
  // contents = replace( contents, `import lightBulbImageHigh from 'mipmap!CIRCUIT_CONSTRUCTION_KIT_COMMON/lightbulb-middle-high.png';`, `import lightBulbImageHigh from 'CIRCUIT_CONSTRUCTION_KIT_COMMON/../lightbulb-middle-high.png';/../images/lightbulb-middle.png';` )

  fs.writeFileSync( path, contents, 'utf-8' );
};

module.exports = async function( repo, cache ) {

  // const repos = fs.readFileSync( '../perennial/data/migrate-repos', 'utf-8' ).trim().split( /\r?\n/ ).map( sim => sim.trim() );

  const simRepos = [
    'acid-base-solutions',
    'area-model-algebra',
    'area-model-decimals',
    'area-model-introduction',
    'area-model-multiplication',
    'circuit-construction-kit-ac',
    'example-sim',
    'molarity',
    'molecule-shapes',
    'molecule-shapes-basics'
    // 'acid-base-solutions',
    // 'area-builder',
    // 'area-model-algebra',
    // 'area-model-decimals',
    // 'area-model-introduction',
    // 'area-model-multiplication',
    // 'arithmetic',
    // 'atomic-interactions',
    // 'balancing-act',
    // 'balancing-chemical-equations',
    // 'balloons-and-static-electricity',
    // 'beers-law-lab',
    // 'bending-light',
    // 'blackbody-spectrum',
    // 'blast',
    // 'build-a-fraction',
    // 'build-a-molecule',
    // 'build-an-atom',
    // 'bumper',
    // 'buoyancy',
    // 'calculus-grapher',
    // 'capacitor-lab-basics',
    // 'chains',
    // 'charges-and-fields',
    // 'circuit-construction-kit-ac',
    // 'circuit-construction-kit-black-box-study',
    // 'circuit-construction-kit-dc',
    // 'circuit-construction-kit-dc-virtual-lab',
    // 'color-vision',
    // 'collision-lab',
    // 'concentration',
    // 'coulombs-law',
    // 'curve-fitting',
    // 'density',
    // 'diffusion',
    // 'energy-forms-and-changes',
    // 'energy-skate-park',
    // 'energy-skate-park-basics',
    // 'equality-explorer',
    // 'equality-explorer-basics',
    // 'equality-explorer-two-variables',
    // 'estimation',
    // 'example-sim',
    // 'expression-exchange',
    // 'faradays-law',
    // 'fluid-pressure-and-flow',
    // 'forces-and-motion-basics',
    // 'fraction-comparison',
    // 'fraction-matcher',
    // 'fractions-equality',
    // 'fractions-intro',
    // 'fractions-mixed-numbers',
    // 'friction',
    // 'function-builder',
    // 'function-builder-basics',
    // 'gas-properties',
    // 'gases-intro',
    // 'gene-expression-essentials',
    // 'graphing-lines',
    // 'graphing-quadratics',
    // 'graphing-slope-intercept',
    // 'gravity-and-orbits',
    // 'gravity-force-lab',
    // 'gravity-force-lab-basics',
    // 'hookes-law',
    // 'interaction-dashboard',
    // 'isotopes-and-atomic-mass',
    // 'john-travoltage',
    // 'least-squares-regression',
    // 'make-a-ten',
    // 'masses-and-springs',
    // 'masses-and-springs-basics',
    // 'models-of-the-hydrogen-atom',
    // 'molarity',
    // 'molecules-and-light',
    // 'molecule-polarity',
    // 'molecule-shapes',
    // 'molecule-shapes-basics',
    // 'natural-selection',
    // 'neuron',
    // 'number-line-integers',
    // 'number-play',
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
    // 'rutherford-scattering',
    // 'simula-rasa',
    // 'states-of-matter',
    // 'states-of-matter-basics',
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

  const repos = [
    'acid-base-solutions',
    'area-model-algebra',
    'area-model-common',
    'area-model-decimals',
    'area-model-introduction',
    'area-model-multiplication',
    'axon',
    'circuit-construction-kit-ac',
    'circuit-construction-kit-common',
    'brand',
    'dot',
    'griddle',
    'joist',
    'kite',
    'molarity',
    'molecule-shapes',
    'molecule-shapes-basics',
    'nitroglycerin',
    'phetcommon',
    'phet-core',
    'phet-io',
    'example-sim',
    'scenery',
    'scenery-phet',
    'sun',
    'tambo',
    'tandem',
    'twixt',
    'utterance-queue',
    'vegas'
    // ...simRepos,
    // 'area-model-common',
    // 'axon',
    // 'brand',
    // 'circuit-construction-kit-common',
    // 'density-buoyancy-common',
    // 'dot',
    // 'fractions-common',
    // 'griddle',
    // 'inverse-square-law-common',
    // 'joist',
    // 'kite',
    // 'mobius',
    // 'nitroglycerin',
    // 'phetcommon',
    // 'phet-core',
    // 'phet-io',
    // 'scenery',
    // 'scenery-phet',
    // 'shred',
    // 'sun',
    // 'tambo',
    // 'tandem',
    // 'twixt',
    // 'utterance-queue',
    // 'vegas',
    // 'vibe'
  ];

  for ( const repo of repos ) {
    console.log( repo );
    let relativeFiles = [];
    grunt.file.recurse( `../${repo}`, ( abspath, rootdir, subdir, filename ) => {
      relativeFiles.push( `${subdir}/${filename}` );
    } );
    relativeFiles = relativeFiles.filter( file => file.startsWith( 'js/' ) ||

                                                  // that's for brand
                                                  file.startsWith( 'phet/js' ) );

    relativeFiles.forEach( ( rel, i ) => {
      migrateFile( repo, rel );
    } );

    if ( simRepos.includes( repo ) ) {
      generateDevelopmentHTML( repo );
    }
  }
};