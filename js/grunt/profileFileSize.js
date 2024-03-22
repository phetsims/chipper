// Copyright 2024, University of Colorado Boulder

/**
 * Analyzes the file size of a built file (that has been built with --profileFileSize), and prints out the results.
 *
 * To profile a sim, go to the sim directory and run:
 *
 * grunt --allHTML --locales=* --brands=phet --profileFileSize
 * grunt profile-file-size
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
  const file = fs.readFileSync( `../${repo}/build/phet/${repo}_all_phet.html`, 'utf-8' );

  const rootSection = parseToSections( file );

  const size = rootSection.getSize();
  const gzippedSize = rootSection.getGzippedSize();

  const printString = ( name, string ) => {
    console.log( `${name}: ${getSizeString( string, size, gzippedSize )}` );
  };

  const printFilter = ( name, filter ) => {
    printString( name, rootSection.getApproxFilteredString( filter ) );
  };

  console.log( 'summary:\n' );
  printString( 'TOTAL', rootSection.getApproxString() );
  console.log( '' );
  printString( 'images', rootSection.getApproxImagesString() );
  printString( 'sounds', rootSection.getApproxSoundsString() );
  printFilter( 'webpack (includes assets)', section => section.type === 'WEBPACK' );
  printFilter( 'preload', section => section.type === 'PRELOAD' );
  printFilter( 'strings', section => section.type === 'STRINGS' );
  printFilter( 'license', section => section.type === 'LICENSE' );

  for ( const repo of rootSection.getRepos().sort() ) {
    printString( `js ${repo}`, rootSection.getApproxRepoString( repo ) );
  }

  console.log( '\ndetails:\n' );

  console.log( rootSection.toReportString( true, size, gzippedSize ) );
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
    return getUtf8Length( this.getApproxString() );
  }

  // @public
  getGzippedSize() {
    return getGzippedLength( this.getApproxString() );
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
  getApproxFilteredString( filter ) {
    if ( filter( this ) ) {
      return this.getApproxString();
    }
    else {
      return this.children.map( child => {
        if ( typeof child === 'string' ) {
          return '';
        }
        else {
          return child.getApproxFilteredString( filter );
        }
      } ).join( '' );
    }
  }

  // @public
  getApproxRepoString( repo ) {
    return this.getApproxFilteredString( section => section.type === 'MODULE' && section.name && section.name.includes( `chipper/dist/js/${repo}/` ) );
  }

  // @public
  getApproxImagesString() {
    return this.getApproxFilteredString( section => section.type === 'MODULE' && section.name && /chipper\/dist\/js\/[^/]+\/(images|mipmaps)\//.test( section.name ) );
  }

  // @public
  getApproxSoundsString() {
    return this.getApproxFilteredString( section => section.type === 'MODULE' && section.name && /chipper\/dist\/js\/[^/]+\/sounds\//.test( section.name ) );
  }

  // @public
  getRepos() {
    let repo = null;

    if ( this.type === 'MODULE' && this.name && this.name.includes( 'chipper/dist/js/' ) ) {
      const index = this.name.indexOf( 'chipper/dist/js/' ) + 'chipper/dist/js/'.length;
      repo = this.name.slice( index ).split( '/' )[ 0 ];
    }

    return _.uniq( [
      ...( repo ? [ repo ] : [] ),
      ...this.children.flatMap( child => {
        if ( typeof child === 'string' ) {
          return [];
        }
        else {
          return child.getRepos();
        }
      } )
    ] );
  }

  // @public
  toReportString( sort, size, gzippedSize, indent = '' ) {
    // TOD: sort by gzipped size?
    const children = sort ? _.sortBy( this.children, child => -( typeof child === 'string' ? getUtf8Length( child ) : child.getSize() ) ) : this.children;
    return `${getSizeString( this.getApproxString(), size, gzippedSize )} ${indent}${this.type}${this.name ? ' ' + this.name : ''}\n${children.map( child => {
      if ( typeof child === 'string' ) {
        return '';
      }
      else {
        return child.toReportString( sort, size, gzippedSize, `${indent}  ` );
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

const getUtf8Length = string => Buffer.from( string, 'utf-8' ).length;
const getGzippedLength = string => zlib.gzipSync( Buffer.from( string, 'utf-8' ) ).length;
const getSizeString = ( string, size, gzippedSize ) => {
  const ourSize = getUtf8Length( string );
  const ourGzippedSize = getGzippedLength( string );

  let sizeString = '' + ourSize;
  let gzippedSizeString = '' + ourGzippedSize;


  const sizePercentage = Math.round( ourSize / size * 1000 ) / 10;
  if ( sizePercentage !== 0 ) {
    sizeString += ` (${sizePercentage}%)`;
  }

  const gzippedSizePercentage = Math.round( ourGzippedSize / gzippedSize * 1000 ) / 10;
  if ( gzippedSizePercentage !== 0 ) {
    gzippedSizeString += ` (${gzippedSizePercentage}%)`;
  }


  const megabytes = Math.round( ourSize / 1024 / 1024 * 100 ) / 100;
  if ( megabytes !== 0 ) {
    sizeString += ` ${megabytes} MB`;
  }

  const gzippedMegabytes = Math.round( ourGzippedSize / 1024 / 1024 * 100 ) / 100;
  if ( gzippedMegabytes !== 0 ) {
    gzippedSizeString += ` ${gzippedMegabytes} MB`;
  }

  return `utf-8: ${sizeString} gzip: ${gzippedSizeString}`;
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