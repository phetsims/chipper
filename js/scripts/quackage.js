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
  const packageFile = parentDir + path.sep + 'package.json';
  const quackageFile = parentDir + path.sep + 'quackage.json';

  if ( fs.existsSync( packageFile ) && fs.existsSync( quackageFile ) ) {
    throw new Error( 'too many ackages' );
  }
  else if ( fs.existsSync( packageFile ) ) {
    console.log( `renaming ${packageFile} => ${quackageFile}` );
    fs.renameSync( packageFile, quackageFile );
  }
  else if ( fs.existsSync( quackageFile ) ) {
    console.log( `renaming ${quackageFile} => ${packageFile}` );
    fs.renameSync( quackageFile, packageFile );
  }
  else {
    visit( parentDir );
  }
}

visit( args[ 0 ] );