// Copyright 2023-2024, University of Colorado Boulder

/**
 * More space-efficient alternative to JSON.stringify for strings, that will escape only the necessary characters.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

const toLessEscapedString = ( string: string ): string => {
  let result = '';

  string.split( /(?:)/u ).forEach( ( char: string ) => {
    if ( char === '\r' ) {
      result += '\\r';
    }
    else if ( char === '\n' ) {
      result += '\\n';
    }
    else if ( char === '\\' ) {
      result += '\\\\';
    }
    else if ( char === '\'' ) {
      result += '\\\'';
    }
    else {
      result += char;
    }
  } );

  return `'${result}'`;
};

export default toLessEscapedString;