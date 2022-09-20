// Copyright 2021-2022, University of Colorado Boulder
const fs = require( 'fs' );

const keyLines = fs.readFileSync( '../scenery/js/imports.ts', 'utf-8' ).split( '\n' );

// import Node from '../../../../scenery/js/nodes/Node.js';
const mapLine = text => {
  // console.log( text );
  const imported = text.substring( text.indexOf( '{' ) + 1, text.indexOf( '}' ) ).trim();

  if ( imported.includes( ',' ) ) {
    // console.log( imported );
    console.log( 'multiline: ' + imported );
  }
  else {
    const found = keyLines.filter( key => key.includes( '/' + imported + '.js' ) &&
                                          ( key.includes( 'default as ' + imported + ',' ) || key.includes( 'default as ' + imported + ' ' ) )
    );
    // console.log( found.length );
    if ( found.length === 1 ) {
      // console.log( found );
    }
    else {
      console.log( 'wrong count: ' + imported + ': ' + found.length );
    }
  }
  return text;
};

const visit = path => {
  const list = fs.readdirSync( path );
  list.forEach( filename => {
    const child = path + '/' + filename;
    const stats = fs.statSync( child );
    if ( stats && stats.isDirectory() ) {
      visit( child );
    }
    else {
      if (
        !child.includes( 'node_modules' ) &&
        child.includes( 'js' ) &&
        !child.includes( 'build' ) &&
        !child.includes( 'dist' ) &&
        ( child.endsWith( '.js' ) || child.endsWith( '.ts' ) &&
          !child.includes( 'sherpa/' )
        ) ) {


        const text = fs.readFileSync( child, 'utf-8' );
        if ( text.includes( 'scenery/js/imports.js' ) ) {
          // console.log( child );
          const lines = text.split( '\n' );
          const mapped = lines.map( line => { // eslint-disable-line no-unused-vars
            line = line.trim();
            if ( line.includes( 'scenery/js/imports.js' ) && line.endsWith( ';' ) ) {
              return mapLine( line );
            }
            else {
              return line;
            }
          } );
        }
      }
    }
  } );
};

visit( '/Users/samreid/apache-document-root/main' );