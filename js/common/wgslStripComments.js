// Copyright 2023-2024, University of Colorado Boulder

/* eslint-env node */

/**
 * Strips comments from a WGSL string
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
const wgslStripComments = str => {
  return str.replace( /\/\*[\s\S]*?\*\//g, '' ).replace( /\r\n/g, '\n' ).split( '\n' ).map( line => {
    const index = line.indexOf( '//' );
    return index >= 0 ? line.substring( 0, index ) : line;
  } ).join( '\n' );
};

module.exports = wgslStripComments;