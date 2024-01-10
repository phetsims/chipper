// Copyright 2024, University of Colorado Boulder

/**
 * Analyzes the file size of a built file (that has been built with --profileFileSize), and prints out the results.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */


const fs = require( 'fs' );
const zlib = require( 'zlib' );
const _ = require( 'lodash' );

/**
 * @param {string} repo
 */
module.exports = async function( repo ) {
  const file = fs.readFileSync( `../${repo}/build/phet/${repo}_en_phet.html`, 'utf-8' );

  console.log( parseToSections( file ).toReportString( true ) );
};

class TagMatch {
  constructor( startIndex, endIndex, isStart, type, name ) {
    this.startIndex = startIndex;
    this.endIndex = endIndex;
    this.isStart = isStart;
    this.type = type;
    this.name = name || null;
  }
}

class TaggedSection {
  constructor( type, name ) {
    this.type = type;
    this.name = name || null;
    this.children = []; // ( TaggedSection | string )[]
  }

  // @public
  getSize() {
    return Buffer.from( this.getApproxString(), 'utf-8' ).length;
  }

  // @public
  getGzippedSize() {
    const buffer = Buffer.from( this.getApproxString(), 'utf-8' );
    return zlib.gzipSync( buffer ).length;
  }

  // @public
  getApproxString() {
    return this.children.map( child => {
      if ( typeof child === 'string' ) {
        return child;
      }
      else {
        return child.getApproxString();
      }
    } ).join( '' );
  }

  // @public
  toReportString( sort, indent = '' ) {
    // TOD: sort by gzipped size?
    const children = sort ? _.sortBy( this.children, child => -( typeof child === 'string' ? Buffer.from( child ).length : child.getSize() ) ) : this.children;
    return `${this.getSize()} ${this.getGzippedSize()} ${indent}${this.type}${this.name ? ' ' + this.name : ''}\n${children.map( child => {
      if ( typeof child === 'string' ) {
        return '';
      }
      else {
        return child.toReportString( sort, `${indent}  ` );
      }
    } ).join( '' )}`;
  }
}

const findNextMatch = ( string, startIndex ) => {
  const match = ( /console\.log\("(START|END)_([A-Z_]+)"(,"([^"]+)")?\)/g ).exec( string.slice( startIndex ) );
  if ( match ) {
    const matchIndex = match.index + startIndex;
    return new TagMatch( matchIndex, matchIndex + match[ 0 ].length, match[ 1 ] === 'START', match[ 2 ], match[ 4 ] );
  }
  else {
    return null;
  }
};

const parseToSections = string => {
  const rootSection = new TaggedSection( 'ROOT', null );
  const stack = [ rootSection ];

  let index = 0;
  let match;
  // eslint-disable-next-line no-cond-assign
  while ( match = findNextMatch( string, index ) ) {

    // console.log( match.type, match.name, match.isStart ? 'START' : 'END', match.startIndex, match.endIndex );

    // Append any string before the match
    if ( match.startIndex > index ) {
      stack[ stack.length - 1 ].children.push( string.slice( index, match.startIndex ) );
    }

    if ( match.isStart ) {
      const newSection = new TaggedSection( match.type, match.name );
      stack[ stack.length - 1 ].children.push( newSection );
      stack.push( newSection );
    }
    else {
      const popped = stack.pop();
      if ( popped.type !== match.type || popped.name !== match.name ) {
        throw new Error( `Mismatched tags: ${popped.type} ${popped.name} !== ${match.type} ${match.name}` );
      }
    }

    index = match.endIndex;
  }

  if ( index < string.length ) {
    stack[ stack.length - 1 ].children.push( string.slice( index ) );
  }

  return rootSection;
};
