// Copyright 2022, University of Colorado Boulder

const fs = require( 'fs' );
const path = require( 'path' );

const args = process.argv.slice( 2 );

/**
 * Work around import problems in WebStorm/IntelliJ by temporarily renaming package.json to another name.
 * @param {string} file - path to start searching for package.json in
 */
function visit( file ) {

  const parentDir = path.dirname( file );
  const package = parentDir + path.sep + 'package.json';
  const quackage = parentDir + path.sep + 'quackage.json';

  if ( fs.existsSync( package ) && fs.existsSync( quackage ) ) {
    throw new Error( 'too many ackages' );
  }
  else if ( fs.existsSync( package ) ) {
    console.log( `renaming ${package} => ${quackage}` );
    fs.renameSync( package, quackage );
  }
  else if ( fs.existsSync( quackage ) ) {
    console.log( `renaming ${quackage} => ${package}` );
    fs.renameSync( quackage, package );
  }
  else {
    visit( parentDir );
  }
}

visit( args[ 0 ] );