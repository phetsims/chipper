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

const migrateFile = async ( repo, relativeFile ) => {
  // const packageObject = JSON.parse( fs.readFileSync( `../${repo}/package.json`, 'utf-8' ) );
  if ( relativeFile.endsWith( '/PhetioIDUtils.js' ) ) {
    return;
  }
  if ( relativeFile.endsWith( '/copyWithSortedKeys.js' ) ) {
    return;
  }
  const path = '../' + repo + '/' + relativeFile;

  let contents = fs.readFileSync( path, 'utf-8' );
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

  let lines = contents.split( /\r?\n/ );

  let fixMipmap = line => {
    if ( line.trim().startsWith( 'import ' ) && line.indexOf( `from 'mipmap!` ) >= 0 ) {
      const term = line.trim().split( ' ' )[ 1 ];
      const repo = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );
      const tail = line.substring( line.indexOf( '/' ) + 1 );
      line = `  import ${term} from '${repo}/../images/${tail}`;
      const a = line.lastIndexOf( `'` );
      line = line.substring( 0, a ) + `_mipmap` + line.substring( a );
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

  const alreadyLoadedStrings = [];

  //   // strings
  //   const acidBaseSolutionsTitleString = require( 'string!ACID_BASE_SOLUTIONS/acid-base-solutions.title' );
  // becomes
  // // strings
  // import ACID_BASE_SOLUTIONS_strings from '../../acid-base-solutions/js/../acid-base-solutions-strings';
  // const acidBaseSolutionsTitleString = ACID_BASE_SOLUTIONS_strings.localized['acid-base-solutions.title'];
  // and we take care not to duplicate the import more than once per file
  let fixString = line => {
    if ( line.trim().startsWith( 'import ' ) && line.indexOf( `from 'string!` ) >= 0 ) {
      const variableName = line.trim().split( ' ' )[ 1 ];
      const repoCap = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );

      let repoLower = repoCap.toLowerCase();
      repoLower = replace( repoLower, '_', '-' );

      const tail = line.substring( line.indexOf( '/' ) + 1 );
      const stringKey = tail.split( `'` )[ 0 ];
      let prefix = '';
      if ( alreadyLoadedStrings.indexOf( repoCap ) === -1 ) {
        prefix = `import ${repoCap}_strings from '${repoCap}/../${repoLower}-strings';\n`;
      }
      line = `${prefix}const ${variableName} = ${repoCap}_strings.localized['${stringKey}'];`;
      alreadyLoadedStrings.push( repoCap );
    }
    return line;
  };

  lines = lines.map( line => {
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
    line = fixString( line );

    // Trim off indentation
    if ( line.startsWith( '  ' ) ) {
      line = line.slice( 2 );
    }

    return line;
  } );

  // Omit 'use strict' directives
  lines = lines.filter( line => line.trim() !== '\'use strict\';' );

  contents = lines.join( '\n' );

  // Seems to be for inherit.js
  contents = replace( contents, `return inherit;`, `export default inherit;` );
  contents = replace( contents, `' ).default;`, `';` );

  // Specify absolute paths for compilation-free mode
  repos.forEach( repo => {
    let upper = repo.toUpperCase();
    upper = replace( upper, '-', '_' );
    contents = replace( contents, `from '${upper}`, `from '/${repo}/js` );
  } );

  // Any export default that is not the last line (when trimmed) should be turned back into return.

  lines = contents.split( /\r?\n/ );
  for ( var i = 0; i < lines.length - 2; i++ ) {
    if ( lines[ i ].indexOf( 'inherit(' ) === -1 ) {
      lines[ i ] = replace( lines[ i ], 'export default ', 'return ' );
    }

    // import magnifierImage from '/acid-base-solutions/js/../images/magnifier-icon.png';
    if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( ' from ' ) >= 0 && lines[ i ].indexOf( '.png' ) >= 0 ) {
      lines[ i ] = replace( lines[ i ], '.png', '_png' );
    }

    if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( ' from ' ) >= 0 && lines[ i ].indexOf( '.mp3' ) >= 0 ) {
      lines[ i ] = replace( lines[ i ], '.mp3', '_mp3' );
    }

    if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( ' from ' ) >= 0 && lines[ i ].indexOf( '.wav' ) >= 0 ) {
      lines[ i ] = replace( lines[ i ], '.wav', '_wav' );
    }

    // Map to relative paths for compilation free mode
    const depth = relativeFile.split( '/' ).length;
    const createDots = d => {
      if ( d === 0 ) {
        return './';
      }
      else {
        let s = '';
        for ( let i = 0; i < d; i++ ) {
          s = s + '../';
        }
        return s;
      }
    };
    let key = ` from '/`;
    if ( lines[ i ].indexOf( 'import' ) >= 0 && lines[ i ].indexOf( key ) >= 0 ) {
      const index = lines[ i ].indexOf( key ) + key.length - 1;
      lines[ i ] = lines[ i ].substring( 0, index ) + createDots( depth ) + lines[ i ].substring( index + 1 );
    }

  }
  contents = lines.join( '\n' );
  // contents = replace( contents, `from '/brand/js/`, `from '/brand/phet/js/` );// TODO: how to deal with different brands? https://github.com/phetsims/chipper/issues/820
  contents = replace( contents, `../../brand/js/Brand`, `../../brand/phet/js/Brand` );
  contents = replace( contents, `import brand from '../../../brand/js/../../js/brand';`, `import brand from '../../../brand/js/brand';` );
  contents = replace( contents, `import getLinks from '../../../brand/js/../../js/getLinks';`, `import getLinks from '../../../brand/js/getLinks';` );
  contents = replace( contents, `from '../../brand/js/../images`, `from '../../brand/phet/images` );
  contents = replace( contents, `import brand from '../../brand/js/../../js/brand';`, `import brand from './brand';` );
  contents = replace( contents, `return scenery.register( 'SceneryStyle'`, `export default scenery.register( 'SceneryStyle'` );
  contents = replace( contents, `require( 'SCENERY/display/BackboneDrawable' );`, `import BackboneDrawable from  '../../../scenery/js/display/BackboneDrawable'` );

  const stringsToConvertReturnBackToExportDefault = [
    'return AlertableDef;',
    'return RadioButtonGroupAppearance;',
    'return joist.register( \'UpdateState\', Enumeration.byKeys( ['
  ];

  stringsToConvertReturnBackToExportDefault.forEach( string => {
    const withExport = replace( string, 'return ', 'export default ' );
    contents = replace( contents, string, withExport );
  } );

  fs.writeFileSync( path, contents, 'utf-8' );
};

module.exports = async function( repo, cache ) {

  // const repos = fs.readFileSync( '../perennial/data/migrate-repos', 'utf-8' ).trim().split( /\r?\n/ ).map( sim => sim.trim() );

  // Run a subset for fast iteration.
  let myrepos = [ 'acid-base-solutions', ...commonRepos ];
  // let myrepos = repos;
  for ( const repo of myrepos ) {
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