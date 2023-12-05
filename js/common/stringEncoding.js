// Copyright 2022-2023, University of Colorado Boulder

/* eslint-env node */

const _ = require( 'lodash' );

/**
 * Convert a string to PascalCase
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = function pascalCase( string ) {
  return `${_.startCase( _.camelCase( string ) ).split( ' ' ).join( '' )}`;
};

const PUSH_TOKEN = '\u0001';
const PUSH_TOKEN_SLASH = '\u0002';
const PUSH_TOKEN_DOT = '\u0003';
const POP = '\u0004';
const POP_PUSH_TOKEN = '\u0005';
const POP_PUSH_TOKEN_SLASH = '\u0006';
const POP_PUSH_TOKEN_DOT = '\u0007';
const SWITCH_LOCALE = '\u0008';
const START_STRING = '\u0009';
const END_STRING = '\u000A';
const ADD_STRING = '\u000B';
const ADD_STRING_LTR_POP = '\u000C';
const ADD_STRING_RTL_POP = '\u000D';
const ADD_STRING_COPY_LAST = '\u000E';
const ADD_LOCALE = '\u000F';
const ESCAPE_CHARACTER = '\u0010';

const ESCAPE_CHARACTERS = [
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

const CHAR_LTR = '\u202A';
const CHAR_RTL = '\u202B';
const CHAR_POP = '\u202C';

const encodeStringMap = stringMap => {
  const locales = Object.keys( stringMap ).filter( locale => !!stringMap[ locale ] ).sort();
  const stringKeysSet = new Set();
  locales.forEach( locale => {
    console.log( 'locale', JSON.stringify( locale ) );
    console.log( 'stringMap[ locale ]', JSON.stringify( stringMap[ locale ] ) );
    Object.keys( stringMap[ locale ] ).forEach( stringKey => {
      console.log( 'string key', stringKey );
      stringKeysSet.add( stringKey );
    } );
  } );
  const stringKeys = [ ...stringKeysSet ].sort();


  const stack = [];
  let currentLocale = null;
  let currentStringValue = null;
  let output = '';

  const getMatchIndex = ( a, b ) => {
    let i = 0;
    while ( i < Math.min( a.length, b.length ) && a[ i ] === b[ i ] ) {
      i++;
    }
    return i;
  };

  const encode = string => {
    let result = '';

    string.split( /(?:)/u ).forEach( char => {
      if ( ESCAPE_CHARACTERS.includes( char ) ) {
        result += ESCAPE_CHARACTER + char;
      }
      else {
        result += char;
      }
    } );

    return result;
  };

  const addLocale = locale => {
    console.log( 'addLocale', locale );

    output += ADD_LOCALE + encode( locale );
  };

  const push = token => {
    console.log( 'push', token );

    stack.push( token );
    const hasPop = output.length > 0 && output[ output.length - 1 ] === POP;

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

  const pop = () => {
    console.log( 'pop' );

    stack.pop();
    output += POP;
  };

  const startString = () => {
    console.log( 'startString' );

    output += START_STRING;
  };

  const endString = () => {
    console.log( 'endString' );

    output += END_STRING;
  };

  const switchLocale = locale => {
    console.log( 'switchLocale', locale );

    currentLocale = locale;

    output += SWITCH_LOCALE + encode( locale );
  };

  const addStringCopyLast = () => {
    console.log( 'addStringCopyLast' );

    output += ADD_STRING_COPY_LAST;
  };

  const addString = string => {
    console.log( 'addString', string );

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

      let remainder = stringKey.slice( stack.join( '' ).length );

      if ( remainder.includes( '/' ) ) {
        const bits = remainder.split( '/' );
        const token = bits[ 0 ] + '/';
        push( token );
        remainder = remainder.slice( token.length );
      }

      while ( remainder.includes( '.' ) ) {
        const bits = remainder.split( '.' );
        const token = bits[ 0 ] + '.';
        push( token );
        remainder = remainder.slice( token.length );
      }

      if ( i + 1 < stringKeys.length ) {
        const nextStringKey = stringKeys[ i + 1 ];
        const matchIndex = getMatchIndex( remainder, nextStringKey.slice( stack.join( '' ).length ) );
        if ( matchIndex > 1 ) {
          const token = remainder.slice( 0, matchIndex );
          push( token );
          remainder = remainder.slice( token.length );
        }
      }

      if ( remainder.length ) {
        push( remainder );
      }
    }

    // Encode the string
    {
      const defaultValue = stringMap.en[ stringKey ];
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

      indices.forEach( i => {
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

  // console.log( locales );
  // console.log( stringKeys );
  //
  // const hex = [ ...new TextEncoder( 'utf-8' ).encode( output ) ].map( charCode => {
  //   let str = charCode.toString( 16 );
  //   if ( str.length < 2 ) {
  //     str = '0' + str;
  //   }
  //   return str;
  // } ).join( '' );
  //
  // console.log( hex );

  return output;
};

const decodeStringMap = encodedString => {
  const stringMap = {};
  const locales = [];
  const stack = [];
  let currentLocale = null;
  let currentStringValue = null;
  let enStringValue = null;
  const localeSet = new Set();
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
  const bits = encodedString.split( /(?:)/u );

  const readString = () => {
    let result = '';

    while ( index < bits.length ) {
      const char = bits[ index ];
      const codePoint = char.codePointAt( 0 );
      if ( codePoint > 0x10 ) {
        result += char;
        index++;
      }
      else if ( codePoint === 0x10 ) {
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
const smallDecodeStringMapString = "y=>{let m={};let x=[];let s=[];let X=null;let S=null;let e=null;let t=new Set();let k=null;let f=String.fromCharCode;let A=f(1);let B=f(2);let C=f(3);let D=f(4);let E=f(5);let F=f(6);let G=f(7);let H=f(8);let I=f(9);let J=f(0xA);let K=f(0xB);let L=f(0xC);let M=f(0xD);let N=f(0xE);let O=f(0xF);let a=q=>{S=q;m[X][k]=q;if(X=='en'){e=q;}t.add(X);};let j=0;let b=y.split(/(?:)/u);let r=()=>{let q='';while(j<b.length){let d=b[j];let p=d.codePointAt(0);if(p>0x10){q+=d;j++;}else if(p==0x10){q+=b[j+1];j+=2;}else{break;}}return q;};while(j<b.length){let c=b[j++];if(c==A){s.push(r());}else if(c==B){s.push(r()+'/');}else if(c==C){s.push(r()+'.');}else if(c==D){s.pop();}else if(c==E){s.pop();s.push(r());}else if(c==F){s.pop();s.push(r()+'/');}else if(c==G){s.pop();s.push(r()+'.');}else if(c==H){X=r();}else if(c==I){t.clear();e=null;k=s.join('');}else if(c==J){for(let i=0;i<x.length;i++){let l=x[i];if(!t.has(l)){m[l][k]=e;}}}else if(c==K){a(r());}else if(c==L){a(`\u202a${r()}\u202c`);}else if(c==M){a(`\u202b${r()}\u202c`);}else if(c==N){a(S);}else if(c==O){let l=r();m[l]={};x.push(l);}}return m;}";
/* eslint-enable */

const encodeStringMapToJS = stringMap => `(${smallDecodeStringMapString})(${JSON.stringify( encodeStringMap( stringMap ) )})`;

module.exports = {
  encodeStringMap: encodeStringMap,
  decodeStringMap: decodeStringMap,
  encodeStringMapToJS: encodeStringMapToJS
};

// const encodedMapEscapedContents = encodeStringMap( fullStringMap );
// const decodedMap = decodeStringMap( encodedMapEscapedContents );
// const startTime = Date.now();
// const minifiedDecodedMap = smallDecodeStringMap( encodedMapEscapedContents );
// const endTime = Date.now();
//
// console.log( 'time elapsed', endTime - startTime );
// console.log( 'bytes before', JSON.stringify( fullStringMap ).length );
// console.log( 'bytes after', encodedMapEscapedContents.length );
// console.log( 'equal', _.isEqual( fullStringMap, decodedMap ) );
// console.log( 'equal minified', _.isEqual( fullStringMap, minifiedDecodedMap ) );
//
// {
//   Object.keys( fullStringMap ).forEach( locale => {
//     Object.keys( fullStringMap[ locale ] ).forEach( stringKey => {
//       const string = fullStringMap[ locale ][ stringKey ];
//       const decodedString = decodedMap[ locale ][ stringKey ];
//       if ( string !== decodedString ) {
//         console.log( 'mismatch', locale, stringKey, string, decodedString );
//       }
//     } );
//   } );
// }
//
// console.log( fullStringMap );
// console.log( decodedMap );
//
// debugger;
