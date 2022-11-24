// Copyright 2019-2020, University of Colorado Boulder

/**
 * Prototyping for https://github.com/phetsims/chipper/issues/820
 *
 * @param {Object} grunt
 * @param {Object} gruntConfig
 */

'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const fs = require( 'fs' );
const path = require( 'path' );
const process = require( 'process' );
const grunt = require( 'grunt' );
const generateDevelopmentHTML = require( './generateDevelopmentHTML' );
const generateTestHTML = require( './generateTestHTML' );
const sortImports = require( './sortImports' );

const activeSims = [ 'acid-base-solutions', 'area-builder', 'area-model-algebra', 'area-model-decimals', 'area-model-introduction', 'area-model-multiplication', 'arithmetic', 'atomic-interactions', 'balancing-act', 'balancing-chemical-equations', 'balloons-and-static-electricity', 'beers-law-lab', 'bending-light', 'blackbody-spectrum', 'blast', 'build-a-fraction', 'build-a-molecule', 'build-a-nucleus', 'build-an-atom', 'bumper', 'buoyancy', 'calculus-grapher', 'capacitor-lab-basics', 'center-and-variability', 'chains', 'charges-and-fields', 'circuit-construction-kit-ac', 'circuit-construction-kit-ac-virtual-lab', 'circuit-construction-kit-black-box-study', 'circuit-construction-kit-dc', 'circuit-construction-kit-dc-virtual-lab', 'collision-lab', 'color-vision', 'concentration', 'coulombs-law', 'curve-fitting', 'density', 'diffusion', 'eating-exercise-and-energy', 'energy-forms-and-changes', 'energy-skate-park', 'energy-skate-park-basics', 'equality-explorer', 'equality-explorer-basics', 'equality-explorer-two-variables', 'estimation', 'example-sim', 'expression-exchange', 'faradays-law', 'fluid-pressure-and-flow', 'forces-and-motion-basics', 'fourier-making-waves', 'fraction-comparison', 'fraction-matcher', 'fractions-equality', 'fractions-intro', 'fractions-mixed-numbers', 'friction', 'function-builder', 'function-builder-basics', 'gas-properties', 'gases-intro', 'gene-expression-essentials', 'geometric-optics', 'geometric-optics-basics', 'graphing-lines', 'graphing-quadratics', 'graphing-slope-intercept', 'gravity-and-orbits', 'gravity-force-lab', 'gravity-force-lab-basics', 'greenhouse-effect', 'hookes-law', 'interaction-dashboard', 'isotopes-and-atomic-mass', 'john-travoltage', 'least-squares-regression', 'make-a-ten', 'masses-and-springs', 'masses-and-springs-basics', 'mean-share-and-balance', 'models-of-the-hydrogen-atom', 'molarity', 'molecule-polarity', 'molecule-shapes', 'molecule-shapes-basics', 'molecules-and-light', 'my-solar-system', 'natural-selection', 'neuron', 'normal-modes', 'number-compare', 'number-line-distance', 'number-line-integers', 'number-line-operations', 'number-play', 'ohms-law', 'optics-lab', 'pendulum-lab', 'ph-scale', 'ph-scale-basics', 'phet-io-test-sim', 'plinko-probability', 'projectile-motion', 'proportion-playground', 'quadrilateral', 'ratio-and-proportion', 'reactants-products-and-leftovers', 'resistance-in-a-wire', 'rutherford-scattering', 'simula-rasa', 'sound', 'states-of-matter', 'states-of-matter-basics', 'trig-tour', 'under-pressure', 'unit-rates', 'vector-addition', 'vector-addition-equations', 'wave-interference', 'wave-on-a-string', 'waves-intro', 'wilder', 'xray-diffraction' ];
const activeRepos = [ 'acid-base-solutions', 'aqua', 'area-builder', 'area-model-algebra', 'area-model-common', 'area-model-decimals', 'area-model-introduction', 'area-model-multiplication', 'arithmetic', 'assert', 'atomic-interactions', 'axon', 'babel', 'balancing-act', 'balancing-chemical-equations', 'balloons-and-static-electricity', 'bamboo', 'beers-law-lab', 'bending-light', 'binder', 'blackbody-spectrum', 'blast', 'brand', 'build-a-fraction', 'build-a-molecule', 'build-a-nucleus', 'build-an-atom', 'bumper', 'buoyancy', 'calculus-grapher', 'capacitor-lab-basics', 'center-and-variability', 'chains', 'charges-and-fields', 'chipper', 'circuit-construction-kit-ac', 'circuit-construction-kit-ac-virtual-lab', 'circuit-construction-kit-black-box-study', 'circuit-construction-kit-common', 'circuit-construction-kit-dc', 'circuit-construction-kit-dc-virtual-lab', 'collision-lab', 'color-vision', 'concentration', 'coulombs-law', 'counting-common', 'curve-fitting', 'decaf', 'density', 'density-buoyancy-common', 'diffusion', 'dot', 'eating-exercise-and-energy', 'energy-forms-and-changes', 'energy-skate-park', 'energy-skate-park-basics', 'equality-explorer', 'equality-explorer-basics', 'equality-explorer-two-variables', 'estimation', 'example-sim', 'expression-exchange', 'faradays-law', 'fenster', 'fluid-pressure-and-flow', 'forces-and-motion-basics', 'fourier-making-waves', 'fraction-comparison', 'fraction-matcher', 'fractions-common', 'fractions-equality', 'fractions-intro', 'fractions-mixed-numbers', 'friction', 'function-builder', 'function-builder-basics', 'gas-properties', 'gases-intro', 'gene-expression-essentials', 'geometric-optics', 'geometric-optics-basics', 'graphing-lines', 'graphing-quadratics', 'graphing-slope-intercept', 'gravity-and-orbits', 'gravity-force-lab', 'gravity-force-lab-basics', 'greenhouse-effect', 'griddle', 'hookes-law', 'interaction-dashboard', 'inverse-square-law-common', 'isotopes-and-atomic-mass', 'john-travoltage', 'joist', 'kite', 'least-squares-regression', 'make-a-ten', 'masses-and-springs', 'masses-and-springs-basics', 'mean-share-and-balance', 'mobius', 'models-of-the-hydrogen-atom', 'molarity', 'molecule-polarity', 'molecule-shapes', 'molecule-shapes-basics', 'molecules-and-light', 'my-solar-system', 'natural-selection', 'neuron', 'nitroglycerin', 'normal-modes', 'number-compare', 'number-line-common', 'number-line-distance', 'number-line-integers', 'number-line-operations', 'number-play', 'ohms-law', 'optics-lab', 'pendulum-lab', 'perennial', 'perennial-alias', 'ph-scale', 'ph-scale-basics', 'phet-core', 'phet-info', 'phet-io', 'phet-io-client-guides', 'phet-io-sim-specific', 'phet-io-test-sim', 'phet-io-website', 'phet-io-wrapper-classroom-activity', 'phet-io-wrapper-haptics', 'phet-io-wrapper-hookes-law-energy', 'phet-io-wrapper-lab-book', 'phet-io-wrappers', 'phet-lib', 'phetcommon', 'phetmarks', 'phettest', 'plinko-probability', 'projectile-motion', 'proportion-playground', 'qa', 'quadrilateral', 'quake', 'query-string-machine', 'ratio-and-proportion', 'reactants-products-and-leftovers', 'resistance-in-a-wire', 'rosetta', 'rutherford-scattering', 'scenery', 'scenery-phet', 'sherpa', 'shred', 'simula-rasa', 'skiffle', 'sound', 'states-of-matter', 'states-of-matter-basics', 'studio', 'sun', 'tambo', 'tandem', 'tangible', 'tappi', 'tasks', 'trig-tour', 'twixt', 'under-pressure', 'unit-rates', 'utterance-queue', 'vector-addition', 'vector-addition-equations', 'vegas', 'vibe', 'wave-interference', 'wave-on-a-string', 'waves-intro', 'weddell', 'wilder', 'xray-diffraction', 'yotta' ];
const reposByNamespace = {}; // map {string} namespace => {string} repo

for ( const repo of activeRepos ) {
  const packageFile = path.resolve( __dirname, `../../../${repo}/package.json` );
  if ( fs.existsSync( packageFile ) ) {
    const packageObject = JSON.parse( fs.readFileSync( packageFile, 'utf-8' ) );
    if ( packageObject.phet && packageObject.phet.requirejsNamespace ) {
      reposByNamespace[ packageObject.phet.requirejsNamespace ] = repo;
    }
  }
}

const replace = ( str, search, replacement ) => {
  return str.split( search ).join( replacement );
};

const shortenImportPath = ( target, pathToFile ) => {

  const fromAbsolute = path.resolve( pathToFile );
  const dirname = path.dirname( fromAbsolute );
  const j = path.join( dirname, target );
  const toAbsolute = path.resolve( j );
  let rel = path.relative( fromAbsolute, toAbsolute );

  if ( rel.indexOf( '../' ) === 0 ) {
    rel = rel.substring( 3 );
  }
  if ( rel[ 0 ] !== '.' ) {
    rel = `./${rel}`;
  }

  return rel;
};

const migratePackageJSON = async repo => {
  const pathToFile = `../${repo}/package.json`;
  let contents = fs.readFileSync( pathToFile, 'utf-8' );
  contents = replace( contents, '"sourceType": "script"', '"sourceType": "module"' );
  fs.writeFileSync( pathToFile, contents, 'utf-8' );
};

const migrateTestHTMLFile = async ( repo, relativeFile ) => {
  const pathToFile = `../${repo}/${relativeFile}`;
  let contents = fs.readFileSync( pathToFile, 'utf-8' );

  const repoToNameMap = {
    'phet-core': 'phetCore',
    axon: 'axon',
    dot: 'dot',
    kite: 'kite',
    scenery: 'scenery',
    'utterance-queue': 'utteranceQueue'
  };

  if ( contents.includes( 'sherpa/lib/require-' ) ) {
    let lines = contents.split( /\r?\n/ );

    lines = lines.filter( line => !( line.includes( '<script ' ) && line.includes( 'sherpa/lib/require-' ) ) );

    const firstRequireLineIndex = _.findIndex( lines, line => line.includes( 'require( [ \'' ) && line.includes( '\' ], function() {' ) );
    const secondLine = lines[ firstRequireLineIndex + 1 ];

    const reposUsed = [ repo ];
    secondLine.includes( 'PHET_CORE/main' ) && reposUsed.push( 'phet-core' );
    secondLine.includes( 'AXON/main' ) && reposUsed.push( 'axon' );
    secondLine.includes( 'DOT/main' ) && reposUsed.push( 'dot' );
    secondLine.includes( 'KITE/main' ) && reposUsed.push( 'kite' );
    secondLine.includes( 'SCENERY/main' ) && reposUsed.push( 'scenery' );
    secondLine.includes( 'UTTERANCE_QUEUE/main' ) && reposUsed.push( 'utterance-queue' );

    const lastLineIndex = _.findLastIndex( lines, line => line === '  } );' );
    const scriptIndex = _.findLastIndex( lines.slice( 0, firstRequireLineIndex ), line => line.startsWith( '<script' ) );

    // Fix the indentation
    for ( let i = firstRequireLineIndex + 2; i < lastLineIndex - 1; i++ ) {
      if ( lines[ i ].startsWith( '    ' ) ) {
        lines[ i ] = lines[ i ].slice( 4 );
      }
    }

    // Fix the script tag to type="module"
    lines[ scriptIndex ] = '<script type="module">';

    // Remove both of the '  } );' lines
    lines.splice( lastLineIndex - 1, 2 );

    // Remove the two require lines
    lines.splice( firstRequireLineIndex, 2 );

    // Add in imports
    const importLines = [];
    reposUsed.forEach( repo => {
      importLines.push( `  import ${repoToNameMap[ repo ]} from '${shortenImportPath( `../../${repo}/js/main.js`, pathToFile )}';` );
    } );
    lines.splice( firstRequireLineIndex, 0, ...importLines );

    contents = lines.join( '\n' );

    fs.writeFileSync( pathToFile, contents, 'utf-8' );
  }
};

const migrateJavascriptFile = async ( repo, relativeFile ) => {
  // const packageObject = JSON.parse( fs.readFileSync( `../${repo}/package.json`, 'utf-8' ) );

  // Don't muck with preload files
  if ( relativeFile.endsWith( '/PhetioIDUtils.js' ) ) {
    return;
  }
  if ( relativeFile.endsWith( '/copyWithSortedKeys.js' ) ) {
    return;
  }
  if ( relativeFile.endsWith( '/google-analytics.js' ) ) {
    return;
  }
  if ( relativeFile.endsWith( '/splash.js' ) ) {
    return;
  }
  const pathToFile = `../${repo}/${relativeFile}`;

  let contents = fs.readFileSync( pathToFile, 'utf-8' );
  contents = replace( contents, '= require( \'ifphetio!', '= function(){return function(){ return function(){}; };}; // ' );

  contents = replace( contents, 'require( \'text!REPOSITORY/package.json\' )', 'JSON.stringify( ( window.phet && phet.chipper ) ? phet.chipper.packageObject : { name: \'placeholder\' } )' );

  if ( contents.includes( 'define( require => {' ) ) {
    contents = replace( contents, 'define( require => {', '' );
    contents = contents.slice( 0, contents.lastIndexOf( '}' ) );
  }

  if ( contents.includes( 'define( require => {' ) ) {
    contents = replace( contents, 'define( require => {', '' );
    contents = contents.slice( 0, contents.lastIndexOf( '}' ) );
  }

  if ( relativeFile.includes( 'scenery-main.js' ) || relativeFile.includes( 'kite-main.js' ) || relativeFile.includes( 'dot-main.js' ) ) {
    // Get rid of the IIFE that was badly converted
    contents = replace( contents, '(function() {', '' );
    contents = replace( contents, '( function() {', '' );
    contents = replace( contents, '} );', '' );
  }

  const returnInherit = contents.lastIndexOf( 'return inherit( ' );
  if ( returnInherit >= 0 ) {
    contents = replace( contents, 'return inherit( ', 'export default inherit( ' ); // eslint-disable-line
  }

  const lastReturn = contents.lastIndexOf( 'return ' );
  if ( lastReturn >= 0 && returnInherit === -1 ) {
    contents = `${contents.substring( 0, lastReturn )}export default ${contents.substring( lastReturn + 'return '.length )}`;
  }

  let lines = contents.split( /\r?\n/ );

  const fixMipmap = line => {
    if ( line.trim().startsWith( 'import ' ) && line.indexOf( 'from \'mipmap!' ) >= 0 ) {
      const term = line.trim().split( ' ' )[ 1 ];
      const repo = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );
      const tail = line.substring( line.indexOf( '/' ) + 1 );
      line = `  import ${term} from '${repo}/../mipmaps/${tail}`;
      const a = line.lastIndexOf( '\'' );
      line = line.substring( 0, a ) + line.substring( a );
    }
    return line;
  };

  const fixImage = line => {
    if ( line.trim().startsWith( 'import ' ) && line.indexOf( 'from \'image!' ) >= 0 ) {
      const term = line.trim().split( ' ' )[ 1 ];
      const repo = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );
      const tail = line.substring( line.indexOf( '/' ) + 1 );
      line = `  import ${term} from '${repo}/../images/${tail}`;
    }
    return line;
  };

  const fixSounds = line => {
    if ( line.trim().startsWith( 'import ' ) && line.indexOf( 'from \'sound!' ) >= 0 ) {
      const term = line.trim().split( ' ' )[ 1 ];
      const repo = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );
      const tail = line.substring( line.indexOf( '/' ) + 1 );
      line = `import ${term} from '${repo}/../sounds/${tail}`;
    }
    return line;
  };

  const reposWithImportedStrings = [];
  const indexOfFirstStringImport = _.findIndex( lines, line => line.includes( ' = require( \'string!' ) && line.trim().startsWith( 'const ' ) );

  //   // strings
  //   const acidBaseSolutionsTitleString = require( 'string!ACID_BASE_SOLUTIONS/acid-base-solutions.title' );
  // becomes
  // // strings
  // import ACID_BASE_SOLUTIONS_strings from '../../acid-base-solutions/js/../acid-base-solutions-strings';
  // const acidBaseSolutionsTitleString = ACID_BASE_SOLUTIONS_strings.localized['acid-base-solutions.title'];
  // and we take care not to duplicate the import more than once per file
  const fixString = line => {
    if ( line.trim().startsWith( 'import ' ) && line.indexOf( 'from \'string!' ) >= 0 ) {
      const variableName = line.trim().split( ' ' )[ 1 ];
      const requirejsNamespace = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );

      const tail = line.substring( line.indexOf( '/' ) + 1 );
      const stringKey = tail.split( '\'' )[ 0 ];

      const stringKeyParts = stringKey.split( '.' ).map( stringKeyPart => {
        // .foo vs [ 'foo' ]
        const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/u;
        return validIdentifier.test( stringKeyPart ) ? `.${stringKeyPart}` : `[ '${stringKeyPart}' ]`;
      } );

      // NOTE: Borrow this for string assertions for linting
      const repo = reposByNamespace[ requirejsNamespace ];

      line = `const ${variableName} = ${_.camelCase( repo )}Strings${stringKeyParts.join( '' )};`;

      reposWithImportedStrings.push( repo );
    }
    return line;
  };

  const newLines = [];
  lines = lines.map( line => {
    if ( line.trim().startsWith( 'const ' ) && line.indexOf( ' = require( ' ) >= 0 ) {
      // const Bounds2 = require( 'DOT/Bounds2' );
      // becomes
      // import Bounds2 from 'DOT/Bounds2';
      line = replace( line, 'const ', 'import ' );
      line = replace( line, ' = require( ', ' from ' );
      line = replace( line, '\' );', '\';' );
    }
    if ( line.trim().startsWith( 'require( ' ) ) {
      line = replace( line, 'require( ', 'import ' );
      line = replace( line, '\' );', '\';' );
    }
    // Handle cyclic dependencies (https://github.com/phetsims/chipper/issues/871)
    if ( line.trim().startsWith( '// require( ' ) ) {
      line = replace( line, '// require( ', 'import ' );
      line = replace( line, '\' );', '\';' );
      // Remove the circular dependency comments after
      if ( line.includes( ' //' ) ) {
        line = line.slice( 0, line.indexOf( ' //' ) );
      }
    }
    // Handle scenery-main.js and similar files
    // window.axon = require( 'AXON/main' );
    // becomes
    // window.axon = axon;
    // with the following added near the top:
    // import axon from 'AXON/main'
    if ( line.trim().startsWith( 'window.' ) && line.includes( ' = require( ' ) ) {
      const name = line.substring( line.indexOf( 'window.' ) + 'window.'.length, line.indexOf( ' = require( ' ) );
      const importName = line.substring( line.indexOf( '\'' ) + 1, line.lastIndexOf( '\'' ) );
      line = `  window.${name} = ${name};`;
      newLines.push( `import ${name} from '${importName}';` );
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

  const stringImportLines = _.uniq( reposWithImportedStrings ).map( repo => {
    return `import ${_.camelCase( repo )}Strings from '${relativeFile.split( '/' ).map( () => '../' ).join( '' )}${repo}/js/${_.camelCase( repo )}Strings.js';`;
  } );
  lines.splice( indexOfFirstStringImport, 0, ...stringImportLines );

  // Omit 'use strict' directives
  lines = lines.filter( line => line.trim() !== '\'use strict\';' );

  // Filter out DELETE directive lines
  lines = lines.filter( line => line.indexOf( '// ES6-MIGRATE-DELETE' ) === -1 );

  contents = newLines.concat( lines ).join( '\n' );

  // Seems to be for inherit.js
  contents = replace( contents, 'return inherit;', 'export default inherit;' );
  contents = replace( contents, '\' ).default;', '\';' );

  const activeCommon = fs.readFileSync( '../perennial/data/active-common-sim-repos', 'utf-8' ).trim().split( '\n' ).map( sim => sim.trim() );
  const repos = activeSims.concat( activeCommon );

  // Specify absolute paths for compilation-free mode
  repos.forEach( repo => {
    let upper = repo.toUpperCase();
    upper = replace( upper, '-', '_' );
    contents = replace( contents, `'${upper}/`, `'/${repo}/js/` );
  } );

  // Any export default that is not the last line (when trimmed) should be turned back into return.

  lines = contents.split( /\r?\n/ );
  for ( let i = 0; i < lines.length - 2; i++ ) {
    if ( lines[ i ].indexOf( 'inherit(' ) === -1 ) {
      lines[ i ] = replace( lines[ i ], 'export default ', 'return ' );
    }

    // import magnifierImage from '/acid-base-solutions/js/../images/magnifier-icon.png';
    if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( ' from ' ) >= 0 && lines[ i ].indexOf( '.png' ) >= 0 ) {
      lines[ i ] = replace( lines[ i ], '.png', '_png' );
    }

    if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( ' from ' ) >= 0 && lines[ i ].indexOf( '.jpg' ) >= 0 ) {
      lines[ i ] = replace( lines[ i ], '.jpg', '_jpg' );
    }

    if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( ' from ' ) >= 0 && lines[ i ].indexOf( '.cur' ) >= 0 ) {
      lines[ i ] = replace( lines[ i ], '.cur', '_cur' );
    }

    if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( ' from ' ) >= 0 && lines[ i ].indexOf( '.mp3' ) >= 0 ) {
      lines[ i ] = replace( lines[ i ], '.mp3', '_mp3' );
    }

    if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( ' from ' ) >= 0 && lines[ i ].indexOf( '.wav' ) >= 0 ) {
      lines[ i ] = replace( lines[ i ], '.wav', '_wav' );
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
          s = `${s}../`;
        }
        return s;
      }
    };
    const key = ' \'/';
    if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( key ) >= 0 ) {
      const index = lines[ i ].indexOf( key ) + key.length - 1;
      lines[ i ] = lines[ i ].substring( 0, index ) + createDots( depth ) + lines[ i ].substring( index + 1 );
    }

    // End with *.js suffix, which is necessary on windows but not on mac
    if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( ' from \'' ) ) {
      lines[ i ] = replace( lines[ i ], '\';', '.js\';' );
    }

    // Catch some missed return => export default
    if ( lines[ i ].indexOf( 'return ' ) >= 0 && lines[ i ].indexOf( '.register( \'' ) >= 0 &&

         // opt out for dot
         lines[ i ].indexOf( 'function( x, y' ) === -1 ) {
      lines[ i ] = replace( lines[ i ], 'return ', 'export default ' );
    }
  }
  contents = lines.join( '\n' );

  contents = replace( contents, 'return scenery.register( \'SceneryStyle\'', 'export default scenery.register( \'SceneryStyle\'' );
  contents = replace( contents, 'require( \'SCENERY/display/BackboneDrawable\' );', 'import BackboneDrawable from  \'../../../scenery/js/display/BackboneDrawable.js\'; // eslint-disable-line' );
  contents = replace( contents, '// ES6-MIGRATE-ADD ', '' ); // Add any lines via the directive

  contents = replace( contents, 'import brand from \'../../brand/js/../../js/brand.js\';', 'import brand from \'./brand.js\';' );
  contents = replace( contents, 'import brand from \'../../../brand/js/../../js/brand.js\';', 'import brand from \'../../../brand/js/brand.js\';' );

  contents = replace( contents, 'import logoOnWhiteBackground from \'../../../brand/js/../images/logo-on-white_png.js\';', 'import logoOnWhiteBackground from \'../images/logo-on-white_png.js\';' );
  contents = replace( contents, 'import logoOnBlackBackground from \'../../../brand/js/../images/logo_png.js\';', 'import logoOnBlackBackground from \'../images/logo_png.js\';' );

  // Eliminate mimpmap options
  contents = replace( contents, 'png,level=5.js', 'png.js' );
  contents = replace( contents, 'png,level=1.js', 'png.js' );

  // Allow repeat migrations
  contents = replace( contents, '.js.js\';', '.js\';' );
  contents = replace( contents, '.js.js\';', '.js\';' );
  contents = replace( contents, '.js.js\';', '.js\';' );

  // catch more return => export default
  const stringsToConvertReturnBackToExportDefault = [
    'return AlertableDef;',
    'return RadioButtonGroupAppearance;',
    'return SOMConstants;',
    'return GameState;',
    'return scenery;',
    'return new Namespace( \'',
    'return utteranceQueueNamespace;',
    'return SigmaTable;',
    'return DataSet;',
    'return EESharedConstants;'
  ];

  stringsToConvertReturnBackToExportDefault.forEach( string => {
    const withExport = replace( string, 'return ', 'export default ' );
    contents = replace( contents, string, withExport );
  } );

  // Eliminate double blank space before modules, which was left by 'use strict', see https://github.com/phetsims/chipper/issues/847
  contents = replace( contents, ` */


// modules
import `, ` */

// modules
import ` );
  contents = replace( contents, ` */



// modules
import `, ` */

// modules
import ` );
  contents = replace( contents, ` */


import `, ` */

// modules
import ` );
  contents = replace( contents, ` */



import `, ` */

// modules
import ` );

  // Use short relative imports, see https://github.com/phetsims/chipper/issues/853
  {

    if ( process.platform === 'win32' ) {
      console.warn( 'simplified relative paths is not supported on windows, continuing. . .' );
    }
    else {
      lines = contents.split( /\r?\n/ );

      for ( let i = 0; i < lines.length; i++ ) {
        if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( '.js\';' ) >= 0 ) {
          const startIndex = lines[ i ].indexOf( '\'' ) + 1;
          const endIndex = lines[ i ].lastIndexOf( '\'' );
          const replacement = shortenImportPath( lines[ i ].substring( startIndex, endIndex ), pathToFile );

          lines[ i ] = lines[ i ].substring( 0, startIndex ) + replacement + lines[ i ].slice( endIndex );
        }
      }
      contents = lines.join( '\n' );
    }
  }

  // Unify whether files end in a newline or not
  contents = contents.trim();

  const countTokens = ( string, token ) => {
    let count = 0;
    for ( let i = 0; i < string.length; i++ ) {
      if ( string[ i ] === token ) {
        count++;
      }
    }
    return count;
  };

  // Separate single export default inherit lines
  {

    lines = contents.split( /\r?\n/ );

    for ( let i = 0; i < lines.length; i++ ) {
      if ( lines[ i ].indexOf( 'export default inherit(' ) === 0 && countTokens( lines[ i ], ',' ) === 1 && countTokens( lines[ i ], '(' ) === 1 && // eslint-disable-line
           lines[ i ].trim().endsWith( ';' ) ) {

        const typeName = lines[ i ].substring( lines[ i ].indexOf( ',' ) + 1, lines[ i ].lastIndexOf( ')' ) - 1 ).trim();
        const inheritLine = lines[ i ].substring( lines[ i ].indexOf( 'inherit(' ) );
        lines[ i ] = `${inheritLine}\n${lines[ i ].substring( 0, 'export default '.length )}${typeName};`;
      }
    }
    contents = lines.join( '\n' );
  }

  // export default blackbodySpectrum.register( 'BGRAndStarDisplay', BGRAndStarDisplay );
  // Separate single export default namespace lines
  {

    lines = contents.split( /\r?\n/ );

    for ( let i = 0; i < lines.length; i++ ) {
      if ( lines[ i ].indexOf( 'export default ' ) === 0 && countTokens( lines[ i ], ',' ) === 1 && countTokens( lines[ i ], '(' ) === 1
           && lines[ i ].indexOf( '.register( ' ) >= 0 && lines[ i ].trim().endsWith( ';' ) ) {

        const typeName = lines[ i ].substring( lines[ i ].indexOf( ',' ) + 1, lines[ i ].lastIndexOf( ')' ) - 1 ).trim();
        const namespaceLine = lines[ i ].substring( 'export default '.length );
        lines[ i ] = `${namespaceLine}\n${lines[ i ].substring( 0, 'export default '.length )}${typeName};`;
      }
    }
    contents = lines.join( '\n' );
  }

  contents = replace( contents, 'import getLinks from \'../../../js/getLinks.js\';', 'import getLinks from \'../../js/getLinks.js\';' );

  fs.writeFileSync( pathToFile, contents, 'utf-8' );

  sortImports( pathToFile );
};

module.exports = async function( repo, cache ) {
  const packageObject = JSON.parse( fs.readFileSync( `../${repo}/package.json`, 'utf-8' ) );

  console.log( `migrating ${repo}` );
  const relativeFiles = [];
  grunt.file.recurse( `../${repo}`, ( abspath, rootdir, subdir, filename ) => {
    relativeFiles.push( `${subdir}/${filename}` );
  } );
  const jsDirFiles = relativeFiles.filter( file => file.startsWith( 'js/' ) ||

                                                   // that's for brand
                                                   file.startsWith( 'phet/js' ) ||
                                                   file.startsWith( 'phet-io/js' ) ||
                                                   file.startsWith( 'adapted-from-phet/js' )
  );
  const testHTMLFiles = relativeFiles.filter( file => file.startsWith( 'tests/' ) && file.endsWith( '.html' ) );

  jsDirFiles.forEach( rel => migrateJavascriptFile( repo, rel ) );
  testHTMLFiles.forEach( file => migrateTestHTMLFile( repo, file ) );
  migratePackageJSON( repo, 'package.json' );

  // Migrate the development html if there already was one
  if ( fs.existsSync( `../${repo}/${repo}_en.html` ) ) {
    await generateDevelopmentHTML( repo );
  }
  if ( packageObject.phet.generatedUnitTests ) {
    await generateTestHTML( repo );
  }
  if ( packageObject.phet.runnable ) {
    const configFile = `../${repo}/js/${repo}-config.js`;
    fs.existsSync( configFile ) && fs.unlinkSync( configFile );
  }
  if ( packageObject.phet.generatedUnitTests ) {
    const configFile = `../${repo}/js/${repo}-test-config.js`;
    fs.existsSync( configFile ) && fs.unlinkSync( configFile );
  }
};
