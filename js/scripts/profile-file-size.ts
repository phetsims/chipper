// Copyright 2013-2026, University of Colorado Boulder


/**
 * Profiles the file size of the built JS file for a given repo.
 *
 * Analyzes the file size of a built file (that has been built with --profileFileSize), and prints out the results.
 * To profile a sim, go to the sim directory and run:
 *
 * grunt --locales=* --brands=phet --profileFileSize
 * sage run ../chipper/js/scripts/profile-file-size.ts
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

import fs from 'fs';
import _ from 'lodash';
import zlib from 'zlib';
import getRepo from '../../../perennial-alias/js/grunt/tasks/util/getRepo.js';


class TagMatch {
  public constructor( public readonly startIndex: number,
                      public readonly endIndex: number,
                      public readonly isStart: boolean,
                      public readonly type: string,
                      public readonly name: string | null = null ) {
  }
}

class TaggedSection {
  public readonly children: ( TaggedSection | string )[] = [];

  public constructor( public readonly type: string, public readonly name: string | null = null ) {
  }

  public getSize(): number {
    return getUtf8Length( this.getApproxString() );
  }

  public getGzippedSize(): number {
    return getGzippedLength( this.getApproxString() );
  }

  public getApproxString(): string {
    return this.children.map( child => {
      if ( typeof child === 'string' ) {
        return child;
      }
      else {
        return child.getApproxString();
      }
    } ).join( '' );
  }

  public getApproxFilteredString( filter: ( section: TaggedSection ) => boolean ): string {
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

  public getApproxRepoString( repo: string ): string {
    return this.getApproxFilteredString( section => !!( section.type === 'MODULE' && section.name && section.name.includes( `chipper/dist/js/${repo}/` ) ) );
  }

  public getApproxImagesString(): string {
    return this.getApproxFilteredString( section => !!( section.type === 'MODULE' && section.name && /chipper\/dist\/js\/[^/]+\/(images|mipmaps)\//.test( section.name ) ) );
  }

  public getApproxSoundsString(): string {
    return this.getApproxFilteredString( section => !!( section.type === 'MODULE' && section.name && /chipper\/dist\/js\/[^/]+\/sounds\//.test( section.name ) ) );
  }

  public getRepos(): string[] {
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

  public toReportString( sort: boolean, size: number, gzippedSize: number, indent = '' ): string {
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

const findNextMatch = ( string: string, startIndex: number ) => {
  const match = ( /console\.log\("(START|END)_([A-Z_]+)"(,"([^"]+)")?\)/g ).exec( string.slice( startIndex ) );
  if ( match ) {
    const matchIndex = match.index + startIndex;
    return new TagMatch( matchIndex, matchIndex + match[ 0 ].length, match[ 1 ] === 'START', match[ 2 ], match[ 4 ] );
  }
  else {
    return null;
  }
};

const getUtf8Length = ( string: string ) => Buffer.from( string, 'utf-8' ).length;
const getGzippedLength = ( string: string ) => zlib.gzipSync( Buffer.from( string, 'utf-8' ) ).length;
const getSizeString = ( string: string, size: number, gzippedSize: number ) => {
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

const parseToSections = ( string: string ) => {
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
      const popped = stack.pop()!;
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

( async () => {
  const repo = getRepo();
  const file = fs.readFileSync( `../${repo}/build/phet/${repo}_all_phet.html`, 'utf-8' );

  const rootSection = parseToSections( file );

  const size = rootSection.getSize();
  const gzippedSize = rootSection.getGzippedSize();

  const printString = ( name: string, string: string ) => {
    console.log( `${name}: ${getSizeString( string, size, gzippedSize )}` );
  };

  const printFilter = ( name: string, filter: ( section: TaggedSection ) => boolean ) => {
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

} )();