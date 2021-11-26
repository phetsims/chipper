// Copyright 2021, University of Colorado Boulder

const core = require( '@babel/core' );
const fs = require( 'fs' );
const path = require( 'path' );

const root = '../';

module.exports = ( filename, text ) => {
  const x = core.transformSync( text, {
    filename: filename,
    presets: [ '@babel/preset-typescript' ],
    sourceMaps: 'inline'
  } );
  const relativePath = path.relative( root, filename );
  const targetPath = path.join( root, 'chipper', 'dist', ...relativePath.split( path.sep ) ).split( '.ts' ).join( '.js' );
  fs.mkdirSync( path.dirname( targetPath ), { recursive: true } );
  fs.writeFileSync( targetPath, x.code );
};