// Copyright 2019, University of Colorado Boulder

/* eslint-disable */

/**
 * Prototyping for https://github.com/phetsims/chipper/issues/820
 *
 * @param {Object} grunt
 * @param {Object} gruntConfig
 */

'use strict';

const fs = require( 'fs' );
const grunt = require( 'grunt' );
const loadFileAsDataURI = require( '../common/loadFileAsDataURI' );
const createMipmap = require( './createMipmap' );
const modulifyStrings = require( './modulifyStrings' );

// disable lint in compiled files
const HEADER = '/* eslint-disable */';

const simRepos = [
  'acid-base-solutions',
  'area-builder',
  'area-model-algebra',
  'area-model-decimals',
  'area-model-introduction',
  'area-model-multiplication',
  'arithmetic',
  'atomic-interactions',
  'balancing-act',
  'balancing-chemical-equations',
  'balloons-and-static-electricity',
  'beers-law-lab',
  'bending-light',
  'blackbody-spectrum',
  'blast',
  'build-a-fraction',
  'build-a-molecule',
  'build-an-atom',
  'bumper',
  'buoyancy',
  'calculus-grapher',
  'capacitor-lab-basics',
  'chains',
  'charges-and-fields',
  'circuit-construction-kit-ac',
  'circuit-construction-kit-black-box-study',
  'circuit-construction-kit-dc',
  'circuit-construction-kit-dc-virtual-lab',
  'color-vision',
  'collision-lab',
  'concentration',
  'coulombs-law',
  'curve-fitting',
  'density',
  'diffusion',
  'energy-forms-and-changes',
  'energy-skate-park',
  'energy-skate-park-basics',
  'equality-explorer',
  'equality-explorer-basics',
  'equality-explorer-two-variables',
  'estimation',
  'example-sim',
  'expression-exchange',
  'faradays-law',
  'fluid-pressure-and-flow',
  'forces-and-motion-basics',
  'fraction-comparison',
  'fraction-matcher',
  'fractions-equality',
  'fractions-intro',
  'fractions-mixed-numbers',
  'friction',
  'function-builder',
  'function-builder-basics',
  'gas-properties',
  'gases-intro',
  'gene-expression-essentials',
  'graphing-lines',
  'graphing-quadratics',
  'graphing-slope-intercept',
  'gravity-and-orbits',
  'gravity-force-lab',
  'gravity-force-lab-basics',
  'hookes-law',
  'interaction-dashboard',
  'isotopes-and-atomic-mass',
  'john-travoltage',
  'least-squares-regression',
  'make-a-ten',
  'masses-and-springs',
  'masses-and-springs-basics',
  'models-of-the-hydrogen-atom',
  'molarity',
  'molecules-and-light',
  'molecule-polarity',
  'molecule-shapes',
  'molecule-shapes-basics',
  'natural-selection',
  'neuron',
  'number-line-integers',
  'number-play',
  'ohms-law',
  'optics-lab',
  'pendulum-lab',
  'ph-scale',
  'ph-scale-basics',
  'phet-io-test-sim',
  'plinko-probability',
  'projectile-motion',
  'proportion-playground',
  'reactants-products-and-leftovers',
  'resistance-in-a-wire',
  'rutherford-scattering',
  'simula-rasa',
  'states-of-matter',
  'states-of-matter-basics',
  'trig-tour',
  'under-pressure',
  'unit-rates',
  'vector-addition',
  'vector-addition-equations',
  'wave-interference',
  'wave-on-a-string',
  'waves-intro',
  'wilder'
];

const commonRepos = [
  'area-model-common',
  'axon',
  'brand',
  'circuit-construction-kit-common',
  'density-buoyancy-common',
  'dot',
  'fractions-common',
  'griddle',
  'inverse-square-law-common',
  'joist',
  'kite',
  'mobius',
  'nitroglycerin',
  'phetcommon',
  'phet-core',
  'phet-io',
  'scenery-phet', // has to run first for string replacements
  'scenery',
  'shred',
  'sun',
  'tambo',
  'tandem',
  'twixt',
  'utterance-queue',
  'vegas',
  'vibe'
];
const repos = [
  ...simRepos,
  ...commonRepos
];

const replace = ( str, search, replacement ) => {
  return str.split( search ).join( replacement );
};

const modulifyFile = async ( abspath, rootdir, subdir, filename ) => {
  if ( subdir && ( subdir.startsWith( 'images' ) || subdir.startsWith( 'phet/images' ) ) ) { // for brand
    if ( filename.endsWith( '.png' ) ) { // TODO: JPEGs?
      const x = loadFileAsDataURI( abspath );

      const contents = `${HEADER}
var img = new Image();
window.phetImages = window.phetImages || [];
window.phetImages.push(img);
img.src='${x}';
export default img;
`;

      const outputFilename = replace( abspath, '.png', '_png.js' );
      fs.writeFileSync( outputFilename, contents );

      // defaults.  TODO: do we need to support non-defaults?  See https://github.com/phetsims/chipper/issues/820
      const options = {
        level: 4, // maximum level
        quality: 98
      };

      try {
        const mipmaps = await createMipmap( abspath, options.level, options.quality );
        const entry = mipmaps.map( ( { width, height, url } ) => ( { width: width, height: height, url: url } ) );

        const mipmapContents = `${HEADER}
var mipmaps = ${JSON.stringify( entry )};
window.phetImages = window.phetImages || [] // ensure reference
mipmaps.forEach( function( mipmap ) {
  mipmap.img = new Image();
  window.phetImages.push( mipmap.img ); // make sure it's loaded before the sim launches
  mipmap.img.src = mipmap.url; // trigger the loading of the image for its level
  mipmap.canvas = document.createElement( 'canvas' );
  mipmap.canvas.width = mipmap.width;
  mipmap.canvas.height = mipmap.height;
  var context = mipmap.canvas.getContext( '2d' );
  mipmap.updateCanvas = function() {
    if ( mipmap.img.complete && ( typeof mipmap.img.naturalWidth === 'undefined' || mipmap.img.naturalWidth > 0 ) ) {
      context.drawImage( mipmap.img, 0, 0 );
      delete mipmap.updateCanvas;
    }
  };
} );
export default mipmaps;
      `;


        const mipmapFilename = replace( abspath, '.png', '_png_mipmap.js' );
        fs.writeFileSync( mipmapFilename, mipmapContents ); // https://github.com/phetsims/chipper/issues/820 TODO: mipmap
      }
      catch( e ) {
        console.log( `Image could not be mipmapped: ${abspath}` );
      }
    }
  }
  if ( subdir && ( subdir.startsWith( 'sounds' ) ) ) {
    if ( filename.endsWith( '.mp3' ) ) {
      const x = loadFileAsDataURI( abspath );

      const contents = `${HEADER}
export default {name:'${filename}',base64:'${x}'};
`;

      const outputFilename = replace( abspath, '.mp3', '_mp3.js' );
      fs.writeFileSync( outputFilename, contents );
    }
    if ( filename.endsWith( '.wav' ) ) {
      const x = loadFileAsDataURI( abspath );

      const contents = `${HEADER}
export default {name:'${filename}',base64:'${x}'};
`;

      const outputFilename = replace( abspath, '.wav', '_wav.js' );
      fs.writeFileSync( outputFilename, contents );
    }
  }
};

module.exports = async function( repo, cache ) {

  // Run a subset for fast iteration.
  // let myrepos = [ 'acid-base-solutions', 'joist', 'brand', 'scenery-phet' ];
  const myrepos = repos;
  for ( const repo of myrepos ) {
    console.log( repo );
    const relativeFiles = [];
    grunt.file.recurse( `../${repo}`, async ( abspath, rootdir, subdir, filename ) => {
      relativeFiles.push( { abspath: abspath, rootdir: rootdir, subdir: subdir, filename: filename } );
    } );

    for ( let entry of relativeFiles ) {
      await modulifyFile( entry.abspath, entry.rootdir, entry.subdir, entry.filename );
    }

    modulifyStrings( repo );
  }
};