// Copyright 2016-2019, University of Colorado Boulder

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

const replace = ( str, search, replacement ) => {
  return str.split( search ).join( replacement );
};

const migrateFile = async ( repo, relativeFile ) => {
  console.log( repo, relativeFile );
  const path = '../' + repo + '/' + relativeFile;
  let contents = fs.readFileSync( path, 'utf-8' );
  contents = replace( contents, '= require( \'string!', '= (\'' );
  contents = replace( contents, '= require( \'ifphetio!', '= function(){return function(){ return function(){}; };}; // ' );
  contents = replace( contents, 'require( \'mipmap!BRAND/logo.png\' )', 'require( \'BRAND/../images/logo.png\' ).default' );
  contents = replace( contents, 'require( \'mipmap!BRAND/logo-on-white.png\' )', 'require( \'BRAND/../images/logo-on-white.png\' ).default' );
  contents = replace( contents, 'require( \'image!EXAMPLE_SIM/barMagnet.png\' )', 'require( \'EXAMPLE_SIM/../images/barMagnet.png\' ).default' );
  contents = replace( contents, 'require( \'mipmap!JOIST/keyboard-icon-on-white.png\' )', 'require( \'JOIST/../images/keyboard-icon-on-white.png\' ).default' );
  contents = replace( contents, 'require( \'mipmap!JOIST/keyboard-icon.png\' )', 'require( \'JOIST/../images/keyboard-icon.png\' ).default' );
  contents = replace( contents, 'require( \'sound!TAMBO/empty_apartment_bedroom_06_resampled.mp3\' )', 'require( \'TAMBO/../sounds/empty_apartment_bedroom_06_resampled.mp3\' ).default' );
  contents = replace( contents, 'require( \'sound!TAMBO/short-silence.wav\' )', 'require( \'TAMBO/../sounds/short-silence.wav\' ).default' );
  contents = replace( contents, 'require( \'sound!TAMBO/reset-all.mp3\' )', 'require( \'TAMBO/../sounds/reset-all.mp3\' ).default' );
  contents = replace( contents, 'require( \'sound!TAMBO/general-button-v4.mp3\' )', 'require( \'TAMBO/../sounds/general-button-v4.mp3\' ).default' );
  contents = replace( contents, 'assert && assert( Array.isArray( brightIconMipmap ), \'icon must be a mipmap\' );', '//assert && assert( Array.isArray( brightIconMipmap ), \'icon must be a mipmap\' );' );
  contents = replace( contents, 'assert && assert( Array.isArray( brightLogoMipmap ), \'logo must be a mipmap\' );', '// assert && assert( Array.isArray( brightLogoMipmap ), \'logo must be a mipmap\' );' );
  contents = replace( contents, 'brightIconMipmap[ 0 ].height', '12' );
  contents = replace( contents, 'brightLogoMipmap[ 0 ].height', '12' );

  contents = replace( contents, `  // text
  const packageString = require( 'text!REPOSITORY/package.json' );

  // constants
  const packageJSON = JSON.parse( packageString ); // Tandem can't depend on joist, so cannot use packageJSON module`, `const packageJSON = require('REPOSITORY/package.json');` );

  contents = replace( contents, `  // modules
  const joist = require( 'JOIST/joist' );

  // strings
  const packageString = require( 'text!REPOSITORY/package.json' );

  const packageJSON = JSON.parse( packageString );

  joist.register( 'packageJSON', packageJSON );`, `const packageJSON = require( 'REPOSITORY/package.json' );` )

  fs.writeFileSync( path, contents, 'utf-8' );
};

module.exports = function( repo, cache ) {

  // const repos = fs.readFileSync( '../perennial/data/migrate-repos', 'utf-8' ).trim().split( /\r?\n/ ).map( sim => sim.trim() );
  const repos = `axon
brand
dot
example-sim
joist
kite
phetcommon
phet-core
phet-io
example-sim
scenery
scenery-phet
sun
tambo
tandem
utterance-queue`.trim().split( /\r?\n/ ).map( sim => sim.trim() );
  repos.forEach( ( repo, index ) => {

    console.log( index + '/' + repos.length );

    let relativeFiles = [];
    grunt.file.recurse( `../${repo}`, ( abspath, rootdir, subdir, filename ) => {
      relativeFiles.push( `${subdir}/${filename}` );
    } );
    relativeFiles = relativeFiles.filter( file => file.startsWith( 'js/' ) );

    relativeFiles.forEach( ( rel, i ) => {
      console.log( '    ' + i + '/' + relativeFiles.length );
      migrateFile( repo, rel );
    } );
  } );
};