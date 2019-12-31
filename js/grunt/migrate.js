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
  console.log( repo, relativeFile );
  const path = '../' + repo + '/' + relativeFile;
  let contents = fs.readFileSync( path, 'utf-8' );
  contents = replace( contents, '= require( \'string!', '= require( \'string:' );
  contents = replace( contents, '= require( \'ifphetio!', '= function(){return function(){ return function(){}; };}; // ' );
  contents = replace( contents, 'require( \'sound!TAMBO/empty_apartment_bedroom_06_resampled.mp3\' )', 'require( \'TAMBO/../sounds/empty_apartment_bedroom_06_resampled.mp3\' ).default' );
  contents = replace( contents, 'require( \'sound!TAMBO/short-silence.wav\' )', 'require( \'TAMBO/../sounds/short-silence.wav\' ).default' );
  contents = replace( contents, 'require( \'sound!TAMBO/reset-all.mp3\' )', 'require( \'TAMBO/../sounds/reset-all.mp3\' ).default' );
  contents = replace( contents, 'require( \'sound!TAMBO/general-button-v4.mp3\' )', 'require( \'TAMBO/../sounds/general-button-v4.mp3\' ).default' );

  contents = replace( contents, 'require( \'text!REPOSITORY/package.json\' )', 'JSON.stringify( phet.chipper.packageObject )' );

  contents = replace( contents, `define( require => {`, `//define( require => {` );

  if ( !contents.endsWith( '} )();' ) ) {
    const lastIndex = contents.lastIndexOf( '} );' );
    contents = contents.substring( 0, lastIndex ) + '//' + contents.substring( lastIndex );
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
      console.log( term, repo, tail );
      line = `  import ${term} from 'mipmap!${repo}/../images/${tail}`;
    }
    return line;
  };

  let fixImage = line => {
    if ( line.trim().startsWith( 'import ' ) && line.indexOf( `from 'image!` ) >= 0 ) {
      const term = line.trim().split( ' ' )[ 1 ];
      const repo = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );
      const tail = line.substring( line.indexOf( '/' ) + 1 );
      console.log( term, repo, tail );
      line = `  import ${term} from '${repo}/../images/${tail}`;
    }
    return line;
  };

  let fixSounds = line => {
    if ( line.trim().startsWith( 'import ' ) && line.indexOf( `from 'sound!` ) >= 0 ) {
      const term = line.trim().split( ' ' )[ 1 ];
      const repo = line.substring( line.indexOf( '!' ) + 1, line.indexOf( '/' ) );
      const tail = line.substring( line.indexOf( '/' ) + 1 );
      console.log( term, repo, tail );
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
  ];

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
  ];

  for ( const repo of repos ) {
    let relativeFiles = [];
    grunt.file.recurse( `../${repo}`, ( abspath, rootdir, subdir, filename ) => {
      relativeFiles.push( `${subdir}/${filename}` );
    } );
    relativeFiles = relativeFiles.filter( file => file.startsWith( 'js/' ) ||

                                                  // that's for brand
                                                  file.startsWith( 'phet/js' ) );

    relativeFiles.forEach( ( rel, i ) => {
      console.log( '    ' + i + '/' + relativeFiles.length );
      migrateFile( repo, rel );
    } );

    if ( simRepos.includes( repo ) ) {
      generateDevelopmentHTML( repo );
      // await execute( /^win/.test( process.platform ) ? 'grunt.cmd' : 'grunt', [ 'generate-development-html' ], `../${repo}` );
    }
  }
};