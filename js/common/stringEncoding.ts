// Copyright 2023-2026, University of Colorado Boulder

// eslint-disable-next-line phet/bad-typescript-text
// @ts-nocheck

/**
 * Handles encoding and decoding of strings to/from a compact format, to lower the file size and download size of
 * simulations.
 *
 * The encoding is stateful, and takes the approximate form of:
 *
 * for each locale:
 *   ( ADD_LOCALE locale )+
 * for each string key:
 *   ( PUSH_TOKEN token )*
 *   START_STRING
 *   for each locale (en, or has a non-en translation):
 *     (SWITCH_LOCALE locale)?
 *     (ADD_STRING string | ADD_STRING_COPY_LAST)
 *   END_STRING
 *   ( POP_TOKEN token )*
 *
 * We add some combinations of "pop + push", and forms that automatically add on the slash/dot/LTR/RTL substrings.
 *
 * String keys are constructed from stack.join( '' ), we'll push/pop substrings of the string key as we go.
 *
 * If a translation is the same as the English translation, it will be omitted (and the END_STRING without having set
 * a translation will indicate it should be filled with this value). If multiple translations share a non-English value,
 * we can note the value is the same as the last-given string.
 *
 * We also record the last-used locale, so that if we only have one translation, we can omit the SWITCH_LOCALE.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */
import _ from 'lodash';
import { StringFileMap } from './ChipperStringUtils.js';
import toLessEscapedString from './toLessEscapedString.js';

// NOTE: Remapped control character regions to avoid invalid characters in
// HTML and XHTML, see https://github.com/phetsims/scenery/issues/1687.
// Should be in the regions of 0x21-0x2A and 0x5B-0x60.
const PUSH_TOKEN = '\u0021'; // push string on the stack
const PUSH_TOKEN_SLASH = '\u0022'; // push `${string}/` on the stack
const PUSH_TOKEN_DOT = '\u0023'; // push `${string}.` on the stack
const POP = '\u0024'; // pop from the stack
const POP_PUSH_TOKEN = '\u0025'; // pop from the stack, then push string on the stack
const POP_PUSH_TOKEN_SLASH = '\u0026'; // pop from the stack, then push `${string}/` on the stack
const POP_PUSH_TOKEN_DOT = '\u0027'; // pop from the stack, then push `${string}.` on the stack
const SWITCH_LOCALE = '\u0028'; // switch to the given locale
const START_STRING = '\u0029'; // start a string
const END_STRING = '\u002A'; // end a string (and fill in missing translations)
const ADD_STRING = '\u005B'; // add a translation string to the current locale and stringKey
const ADD_STRING_LTR_POP = '\u005C'; // add `${LTR}${string}${POP}` to the current locale and stringKey
const ADD_STRING_RTL_POP = '\u005D'; // add `${RTL}${string}${POP}` to the current locale and stringKey
const ADD_STRING_COPY_LAST = '\u005E'; // add the last-used translation to the current locale and stringKey
const ADD_LOCALE = '\u005F'; // add a locale (at the start)
const ESCAPE_CHARACTER = '\u0060'; // we'll need to escape any of these characters if they appear in a string

const ESCAPE_CHARACTER_CODE_POINT = 0x60;

const CONTROL_CHARACTERS = [
  PUSH_TOKEN,
  PUSH_TOKEN_SLASH,
  PUSH_TOKEN_DOT,
  POP,
  POP_PUSH_TOKEN,
  POP_PUSH_TOKEN_SLASH,
  POP_PUSH_TOKEN_DOT,
  SWITCH_LOCALE,
  START_STRING,
  END_STRING,
  ADD_STRING,
  ADD_STRING_LTR_POP,
  ADD_STRING_RTL_POP,
  ADD_STRING_COPY_LAST,
  ADD_LOCALE,
  ESCAPE_CHARACTER
];

const CONTROL_CODE_POINTS = CONTROL_CHARACTERS.map( char => char.codePointAt( 0 )! );

// Our LTR/RTL embedding characters
const CHAR_LTR = '\u202A';
const CHAR_RTL = '\u202B';
const CHAR_POP = '\u202C';

// Converts a map[ locale ][ stringKey ] => string (with a compact encoding)
const encodeStringMap = ( stringMap: StringFileMap ): string => {
  const locales = Object.keys( stringMap ).filter( locale => !!stringMap[ locale ] ).sort();

  // Get all string keys
  const stringKeysSet = new Set();
  locales.forEach( locale => {
    Object.keys( stringMap[ locale ] ).forEach( stringKey => {
      stringKeysSet.add( stringKey );
    } );
  } );
  // For our stack encoding, we'll want them sorted so we can push/pop deltas between each one
  const stringKeys = [ ...stringKeysSet ].sort();


  const stack = [];
  let currentLocale = null;
  let currentStringValue = null;
  let output = '';

  // Returns the index of the first character that differs between a and b
  const getMatchIndex = ( a, b ) => {
    let i = 0;
    while ( i < Math.min( a.length, b.length ) && a[ i ] === b[ i ] ) {
      i++;
    }
    return i;
  };

  // Encodes a string, escaping any control characters
  const encode = string => {
    let result = '';

    string.normalize().split( /(?:)/u ).forEach( char => {
      if ( CONTROL_CHARACTERS.includes( char ) ) {
        result += ESCAPE_CHARACTER + char;
      }
      else {
        result += char;
      }
    } );

    return result;
  };

  // Adds a locale to the output
  const addLocale = locale => {
    output += ADD_LOCALE + encode( locale );
  };

  // Pushes a token onto the stack (combining with the previous token if possible)
  const push = token => {
    stack.push( token );
    const hasPop = output.length > 0 && output.endsWith( POP );

    if ( hasPop ) {
      output = output.slice( 0, -1 );
    }

    let code;
    if ( token.endsWith( '/' ) ) {
      token = token.slice( 0, -1 );
      code = hasPop ? POP_PUSH_TOKEN_SLASH : PUSH_TOKEN_SLASH;
    }
    else if ( token.endsWith( '.' ) ) {
      token = token.slice( 0, -1 );
      code = hasPop ? POP_PUSH_TOKEN_DOT : PUSH_TOKEN_DOT;
    }
    else {
      code = hasPop ? POP_PUSH_TOKEN : PUSH_TOKEN;
    }

    output += code + encode( token );
  };

  // Pops a token from the stack
  const pop = () => {
    stack.pop();
    output += POP;
  };

  const startString = () => {
    output += START_STRING;
  };

  const endString = () => {
    output += END_STRING;
  };

  const switchLocale = locale => {
    currentLocale = locale;

    output += SWITCH_LOCALE + encode( locale );
  };

  const addStringCopyLast = () => {
    output += ADD_STRING_COPY_LAST;
  };

  // Adds a string to the output, encoding LTR/RTL wrapped forms in a more compact way
  const addString = string => {
    currentStringValue = string;

    let code;
    if ( string.startsWith( CHAR_LTR ) && string.endsWith( CHAR_POP ) ) {
      code = ADD_STRING_LTR_POP;
      string = string.slice( 1, -1 );
    }
    else if ( string.startsWith( CHAR_RTL ) && string.endsWith( CHAR_POP ) ) {
      code = ADD_STRING_RTL_POP;
      string = string.slice( 1, -1 );
    }
    else {
      code = ADD_STRING;
    }

    output += code + encode( string );
  };

  ////////////////////////////////////////////////////////////
  // Start of encoding
  ////////////////////////////////////////////////////////////

  locales.forEach( locale => {
    addLocale( locale );
  } );

  for ( let i = 0; i < stringKeys.length; i++ ) {
    const stringKey = stringKeys[ i ];

    // Encode the string key
    {
      while ( !stringKey.startsWith( stack.join( '' ) ) ) {
        pop();
      }

      // We will whittle down the remainder of the string key as we go. We start here from the delta from the last key
      let remainder = stringKey.slice( stack.join( '' ).length );

      // Separate out the requirejsNamespace, if it exists
      if ( remainder.includes( '/' ) ) {
        const bits = remainder.split( '/' );
        const token = bits[ 0 ] + '/';
        push( token );
        remainder = remainder.slice( token.length );
      }

      // Separate out dot-separated tokens to push independently.
      while ( remainder.includes( '.' ) ) {
        const bits = remainder.split( '.' );
        const token = bits[ 0 ] + '.';
        push( token );
        remainder = remainder.slice( token.length );
      }

      // See if we share a non-trivial prefix with the next string key, and if so, push it
      if ( i + 1 < stringKeys.length ) {
        const nextStringKey = stringKeys[ i + 1 ];
        const matchIndex = getMatchIndex( remainder, nextStringKey.slice( stack.join( '' ).length ) );
        if ( matchIndex > 1 ) {
          const token = remainder.slice( 0, matchIndex );
          push( token );
          remainder = remainder.slice( token.length );
        }
      }

      // The rest!
      if ( remainder.length ) {
        push( remainder );
      }
    }

    // Encode the string
    {
      const defaultValue = stringMap.en[ stringKey ];

      // Find ONLY the locales that we'll include
      const stringLocales = locales.filter( locale => {
        if ( locale === 'en' ) {
          return true;
        }

        const string = stringMap[ locale ][ stringKey ];

        return string !== undefined && string !== defaultValue;
      } );
      const stringValues = stringLocales.map( locale => stringMap[ locale ][ stringKey ] );

      // We'll order things by the string values, so we can "copy" when they are the same
      const indices = _.sortBy( _.range( 0, stringLocales.length ), i => stringValues[ i ] );

      startString();

      // eslint-disable-next-line @typescript-eslint/no-loop-func
      indices.forEach( ( i: number ) => {
        const locale = stringLocales[ i ];
        const string = stringValues[ i ];

        if ( locale !== currentLocale ) {
          switchLocale( locale );
        }

        if ( string === currentStringValue ) {
          addStringCopyLast();
        }
        else {
          addString( string );
        }
      } );

      endString();
    }
  }

  // Double-check our output results in the correct structure
  const testStringMap = decodeStringMap( output );
  for ( const locale in stringMap ) {
    for ( const stringKey in stringMap[ locale ] ) {
      if ( stringMap[ locale ][ stringKey ].normalize() !== testStringMap[ locale ][ stringKey ] ) {
        throw new Error( `String map encoding failed, mismatch at ${locale} ${stringKey}` );
      }
    }
  }

  return output;
};

// Converts a compact encoding to map[ locale ][ stringKey ]: string
const decodeStringMap = ( encodedString: string ): string => {
  const stringMap = {}; // map[ locale ][ stringKey ] => string
  const locales = [];
  const stack = []; // string[], stack.join( '' ) will be the current stringKey
  let currentLocale = null;
  let currentStringValue = null; // the last string value we've seen, for ADD_STRING_COPY_LAST
  let enStringValue = null; // the English string value, for omitted translations
  const localeSet = new Set(); // so we can track the omitted translations
  let stringKey = null;

  const addLocale = locale => {
    stringMap[ locale ] = {};
    locales.push( locale );
  };

  const push = token => {
    stack.push( token );
  };

  const pop = () => {
    stack.pop();
  };

  const switchLocale = locale => {
    currentLocale = locale;
  };

  const addString = string => {
    currentStringValue = string;
    stringMap[ currentLocale ][ stringKey ] = string;
    if ( currentLocale === 'en' ) {
      enStringValue = string;
    }
    localeSet.add( currentLocale );
  };

  const addStringCopy = () => {
    addString( currentStringValue );
  };

  const startString = () => {
    localeSet.clear();
    enStringValue = null;
    stringKey = stack.join( '' );
  };

  const endString = () => {
    for ( let i = 0; i < locales.length; i++ ) {
      const locale = locales[ i ];
      if ( !localeSet.has( locale ) ) {
        stringMap[ locale ][ stringKey ] = enStringValue;
      }
    }
  };

  let index = 0;
  const bits = encodedString.split( /(?:)/u ); // split by code point, so we don't have to worry about surrogate pairs

  // Reads a string from the bits (at our current index), until we hit a non-escaped control character
  const readString = () => {
    let result = '';

    while ( index < bits.length ) {
      const char = bits[ index ];
      const codePoint = char.codePointAt( 0 );

      // Pass through any non-control characters
      if ( !CONTROL_CODE_POINTS.includes( codePoint ) ) {
        result += char;
        index++;
      }
      else if ( codePoint === ESCAPE_CHARACTER_CODE_POINT ) {
        const nextChar = bits[ index + 1 ];
        result += nextChar;
        index += 2;
      }
      else {
        break;
      }
    }

    return result;
  };

  while ( index < bits.length ) {
    const code = bits[ index++ ];

    if ( code === PUSH_TOKEN ) {
      push( readString() );
    }
    else if ( code === PUSH_TOKEN_SLASH ) {
      push( readString() + '/' );
    }
    else if ( code === PUSH_TOKEN_DOT ) {
      push( readString() + '.' );
    }
    else if ( code === POP ) {
      pop();
    }
    else if ( code === POP_PUSH_TOKEN ) {
      pop();
      push( readString() );
    }
    else if ( code === POP_PUSH_TOKEN_SLASH ) {
      pop();
      push( readString() + '/' );
    }
    else if ( code === POP_PUSH_TOKEN_DOT ) {
      pop();
      push( readString() + '.' );
    }
    else if ( code === SWITCH_LOCALE ) {
      switchLocale( readString() );
    }
    else if ( code === START_STRING ) {
      startString();
    }
    else if ( code === END_STRING ) {
      endString();
    }
    else if ( code === ADD_STRING ) {
      addString( readString() );
    }
    else if ( code === ADD_STRING_LTR_POP ) {
      addString( CHAR_LTR + readString() + CHAR_POP );
    }
    else if ( code === ADD_STRING_RTL_POP ) {
      addString( CHAR_RTL + readString() + CHAR_POP );
    }
    else if ( code === ADD_STRING_COPY_LAST ) {
      addStringCopy();
    }
    else if ( code === ADD_LOCALE ) {
      addLocale( readString() );
    }
    else {
      throw new Error( 'Unrecognized code: ' + code );
    }
  }

  return stringMap;
};

// A minified version of the above, for inclusion in the JS bundle. Approximately 1 kB.
// a = addString
// r = readString
// f = String.fromCharCode
// m = stringMap
// x = locales
// l = locale
// s = stack
// X = currentLocale
// S = currentStringValue
// e = enStringValue
// k = stringKey
// t = localeSet
// b = bits
// j = index
// c = code
// d = char
// p = codePoint
// q = string/result
// y = encodedString
/* eslint-disable */
/* @formatter:off */
const smallDecodeStringMapString = "y=>{let m={};let x=[];let s=[];let X=null;let S=null;let e=null;let t=new Set();let k=null;let f=String.fromCharCode;let A=f(0x21);let B=f(0x22);let C=f(0x23);let D=f(0x24);let E=f(0x25);let F=f(0x26);let G=f(0x27);let H=f(0x28);let I=f(0x29);let J=f(0x2A);let K=f(0x5B);let L=f(0x5C);let M=f(0x5D);let N=f(0x5E);let O=f(0x5F);let a=q=>{S=q;m[X][k]=q;if(X=='en'){e=q;}t.add(X);};let j=0;let b=y.split(/(?:)/u);let r=()=>{let q='';while(j<b.length){let d=b[j];let p=d.codePointAt(0);if(p<0x21||(p>0x2A&&p<0x5B)||p>0x60){q+=d;j++;}else if(p==0x60){q+=b[j+1];j+=2;}else{break;}}return q;};while(j<b.length){let c=b[j++];if(c==A){s.push(r());}else if(c==B){s.push(r()+'/');}else if(c==C){s.push(r()+'.');}else if(c==D){s.pop();}else if(c==E){s.pop();s.push(r());}else if(c==F){s.pop();s.push(r()+'/');}else if(c==G){s.pop();s.push(r()+'.');}else if(c==H){X=r();}else if(c==I){t.clear();e=null;k=s.join('');}else if(c==J){for(let i=0;i<x.length;i++){let l=x[i];if(!t.has(l)){m[l][k]=e;}}}else if(c==K){a(r());}else if(c==L){a(`\u202a${r()}\u202c`);}else if(c==M){a(`\u202b${r()}\u202c`);}else if(c==N){a(S);}else if(c==O){let l=r();m[l]={};x.push(l);}}return m;}";
/* @formatter:on */
/* eslint-enable */

// Given a stringMap (map[ locale ][ stringKey ] => string), returns a JS expression string that will decode to it.
const encodeStringMapToJS = ( stringMap: StringFileMap ): string => `(${smallDecodeStringMapString})(${toLessEscapedString( encodeStringMap( stringMap ) )})`;

export default {
  encodeStringMap: encodeStringMap,
  decodeStringMap: decodeStringMap,
  encodeStringMapToJS: encodeStringMapToJS
};