// Copyright 2019-2021, University of Colorado Boulder

/**
 * Error out if Node version is out of date. Uses process.version
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */


// constants
const NODE_VERSION_STRING_PARTS = process.version.replace( 'v', '' ).split( '.' );
const NODE_MAJOR_VERSION = parseInt( NODE_VERSION_STRING_PARTS[ 0 ], 10 );
const NODE_MINOR_VERSION = parseInt( NODE_VERSION_STRING_PARTS[ 1 ], 10 );
if ( NODE_MAJOR_VERSION < 12 || ( NODE_MAJOR_VERSION === 12 && NODE_MINOR_VERSION < 13 ) ) {
  throw new Error( 'Node 12.13 or greater is needed to run PhET build tools' );
}
