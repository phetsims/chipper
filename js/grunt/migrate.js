// Copyright 2019, University of Colorado Boulder

/**
 * Prototyping for https://github.com/phetsims/chipper/issues/820
 *
 * @param {Object} grunt
 * @param {Object} gruntConfig
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const grunt = require( 'grunt' );
const generateDevelopmentHTML = require( './generateDevelopmentHTML' );

const activeSims = fs.readFileSync( '../perennial/data/active-sims', 'utf-8' ).trim().split( '\n' ).map( sim => sim.trim() );

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
  const pathToFile = '../' + repo + '/' + relativeFile;

  let contents = fs.readFileSync( pathToFile, 'utf-8' );
  contents = replace( contents, '= require( \'ifphetio!', '= function(){return function(){ return function(){}; };}; // ' );

  contents = replace( contents, 'require( \'text!REPOSITORY/package.json\' )', 'JSON.stringify( phet.chipper.packageObject )' );

  if ( contents.includes( 'define( require => {' ) ) {
    contents = replace( contents, 'define( require => {', '' );
    contents = contents.slice( 0, contents.lastIndexOf( '}' ) );
  }

  if ( contents.includes( 'define( require => {' ) ) {
    contents = replace( contents, 'define( require => {', '' );
    contents = contents.slice( 0, contents.lastIndexOf( '}' ) );
  }

  if ( relativeFile.includes( 'scenery-main.js' ) || relativeFile.includes( 'kite-main.js' ) || relativeFile.includes( 'dot-main.js' ) ) {
    console.log( contents );

    // Get rid of the IIFE that was badly converted
    contents = replace( contents, '(function() {', '' );
    contents = replace( contents, '( function() {', '' );
    contents = replace( contents, '} );', '' );
  }

  const returnInherit = contents.lastIndexOf( 'return inherit( ' );
  if ( returnInherit >= 0 ) {
    contents = replace( contents, 'return inherit( ', 'export default inherit( ' );
  }

  const lastReturn = contents.lastIndexOf( 'return ' );
  if ( lastReturn >= 0 && returnInherit === -1 ) {
    contents = contents.substring( 0, lastReturn ) + 'export default ' + contents.substring( lastReturn + 'return '.length );
  }

  let lines = contents.split( /\r?\n/ );

  const fixMipmap = line => {
    if ( line.trim().startsWith( 'import ' ) && line.indexOf( 'from \'mipmap!' ) >= 0 ) {
      const term = line.trim().split( ' ' )[ 1 ];
      const repo = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );
      const tail = line.substring( line.indexOf( '/' ) + 1 );
      line = `  import ${term} from '${repo}/../images/${tail}`;
      const a = line.lastIndexOf( '\'' );
      line = line.substring( 0, a ) + '_mipmap' + line.substring( a );
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
      const repoCap = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );

      const tail = line.substring( line.indexOf( '/' ) + 1 );
      const stringKey = tail.split( '\'' )[ 0 ];
      line = `import ${variableName} from '${repoCap}/../strings/${stringKey}';`; // .js added later
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

  // Omit 'use strict' directives
  lines = lines.filter( line => line.trim() !== '\'use strict\';' );

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

    if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( ' from ' ) >= 0 && lines[ i ].indexOf( '.mp3' ) >= 0 ) {
      lines[ i ] = replace( lines[ i ], '.mp3', '_mp3' );
    }

    if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( ' from ' ) >= 0 && lines[ i ].indexOf( '.wav' ) >= 0 ) {
      lines[ i ] = replace( lines[ i ], '.wav', '_wav' );
    }

    // TODO: *.cur

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
  // contents = replace( contents, `from '/brand/js/`, `from '/brand/phet/js/` );// TODO: how to deal with different brands? https://github.com/phetsims/chipper/issues/820
  contents = replace( contents, '../../brand/js/Brand', '../../brand/phet/js/Brand' );
  contents = replace( contents, 'import brand from \'../../../brand/js/../../js/brand.js\';', 'import brand from \'../../../brand/js/brand.js\';' );
  contents = replace( contents, 'import getLinks from \'../../../brand/js/../../js/getLinks.js\';', 'import getLinks from \'../../../brand/js/getLinks.js\';' );
  contents = replace( contents, 'from \'../../brand/js/../images', 'from \'../../brand/phet/images' );
  contents = replace( contents, 'import brand from \'../../brand/js/../../js/brand.js\';', 'import brand from \'./brand.js\';' );
  contents = replace( contents, 'return scenery.register( \'SceneryStyle\'', 'export default scenery.register( \'SceneryStyle\'' );
  contents = replace( contents, 'require( \'SCENERY/display/BackboneDrawable\' );', 'import BackboneDrawable from  \'../../../scenery/js/display/BackboneDrawable.js\'; // eslint-disable-line' ); // TODO: deal with this https://github.com/phetsims/chipper/issues/820

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
    // import IntroductionScreen from '../../acid-base-solutions/js/introduction/IntroductionScreen.js';
    lines = contents.split( /\r?\n/ );

    const shortenImportPath = target => {
      const fromAbsolute = path.resolve( pathToFile );
      const dirname = path.dirname( fromAbsolute );
      const j = path.join( dirname, target );

      const toAbsolute = path.resolve( j );
      let rel = path.relative( fromAbsolute, toAbsolute );

      if ( rel.indexOf( '../' ) === 0 ) {
        rel = rel.substring( 3 );
      }
      if ( rel[ 0 ] !== '.' ) {
        rel = './' + rel;
      }

      return rel;
    };

    for ( let i = 0; i < lines.length; i++ ) {
      if ( lines[ i ].indexOf( 'import ' ) >= 0 && lines[ i ].indexOf( '.js\';' ) >= 0 ) {
        const startIndex = lines[ i ].indexOf( '\'' ) + 1;
        const endIndex = lines[ i ].lastIndexOf( '\'' );
        const replacement = shortenImportPath( lines[ i ].substring( startIndex, endIndex ) );

        lines[ i ] = lines[ i ].substring( 0, startIndex ) + replacement + lines[ i ].slice( endIndex );
      }
    }
    contents = lines.join( '\n' );

    // Unify whether files end in a newline or not
    contents = contents.trim();
  }

  fs.writeFileSync( pathToFile, contents, 'utf-8' );
};

module.exports = async function( repo, cache ) {
  console.log( `migrating ${repo}` );
  let relativeFiles = [];
  grunt.file.recurse( `../${repo}`, ( abspath, rootdir, subdir, filename ) => {
    relativeFiles.push( `${subdir}/${filename}` );
  } );
  relativeFiles = relativeFiles.filter( file => file.startsWith( 'js/' ) ||

                                                // that's for brand
                                                file.startsWith( 'phet/js' ) );

  relativeFiles.forEach( ( rel, i ) => migrateFile( repo, rel ) );

  if ( activeSims.includes( repo ) ) {
    generateDevelopmentHTML( repo );
  }
};