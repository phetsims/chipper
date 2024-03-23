// Copyright 2023-2024, University of Colorado Boulder

/* eslint-env node */

/**
 * Minifies a WGSL string
 *
 * IDEA: could look at places where abstract int/float could be swapped in for the explicit types
 * IDEA: could wrap long builtin function calls with a shorter named function (but that might reduce performance?)
 * IDEA: looking at you, bitcast!!!
 * IDEA: vec2(0.0, 0.0) => vec2(0.0) (and similar) -- doesn't happen often enough to bother
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const REPLACEMENT_MAP = {
  'vec2<i32>': 'vec2i',
  'vec3<i32>': 'vec3i',
  'vec4<i32>': 'vec4i',
  'vec2<u32>': 'vec2u',
  'vec3<u32>': 'vec3u',
  'vec4<u32>': 'vec4u',
  'vec2<f32>': 'vec2f',
  'vec3<f32>': 'vec3f',
  'vec4<f32>': 'vec4f',
  'vec2<f16>': 'vec2h',
  'vec3<f16>': 'vec3h',
  'vec4<f16>': 'vec4h',
  'mat2x2<f32>': 'mat2x2f',
  'mat2x3<f32>': 'mat2x3f',
  'mat2x4<f32>': 'mat2x4f',
  'mat3x2<f32>': 'mat3x2f',
  'mat3x3<f32>': 'mat3x3f',
  'mat3x4<f32>': 'mat3x4f',
  'mat4x2<f32>': 'mat4x2f',
  'mat4x3<f32>': 'mat4x3f',
  'mat4x4<f32>': 'mat4x4f',
  'mat2x2<f16>': 'mat2x2h',
  'mat2x3<f16>': 'mat2x3h',
  'mat2x4<f16>': 'mat2x4h',
  'mat3x2<f16>': 'mat3x2h',
  'mat3x3<f16>': 'mat3x3h',
  'mat3x4<f16>': 'mat3x4h',
  'mat4x2<f16>': 'mat4x2h',
  'mat4x3<f16>': 'mat4x3h',
  'mat4x4<f16>': 'mat4x4h'
};

const wgslMinify = str => {
  str = str.replace( /\r\n/g, '\n' );

  // // Naga does not yet recognize `const` but web does not allow global `let`.
  str = str.replace( /\nlet /g, '\nconst ' );

  // According to WGSL spec:
  // line breaks: \u000A\u000B\u000C\u000D\u0085\u2028\u2029
  // white space: \u0020\u0009\u000A\u000B\u000C\u000D\u0085\u200E\u200F\u2028\u2029

  const linebreak = '[\u000A\u000B\u000C\u000D\u0085\u2028\u2029]';
  const whitespace = '[\u0020\u0009\u0085\u200E\u200F\u2028\u2029]'; // don't include most the linebreak ones
  const linebreakOrWhitespace = '[\u000A\u000B\u000C\u000D\u0085\u2028\u2029\u0020\u0009\u0085\u200E\u200F]';

  // Collapse newlines
  str = str.replace( new RegExp( `${whitespace}*${linebreak}+${whitespace}*`, 'g' ), '\n' );
  str = str.trim();

  // Collapse other whitespace
  str = str.replace( new RegExp( `${whitespace}+`, 'g' ), ' ' );

  // Semicolon + newline => semicolon
  str = str.replace( new RegExp( `;${linebreak}`, 'g' ), ';' );

  // Comma + newline => comma
  str = str.replace( new RegExp( `,${linebreak}`, 'g' ), ',' );

  // whitespace around {}
  str = str.replace( new RegExp( `${linebreakOrWhitespace}*([\\{\\}])${linebreakOrWhitespace}*`, 'g' ), ( _, m ) => m );

  // Remove whitespace after :;,
  str = str.replace( new RegExp( `([:;,])${linebreakOrWhitespace}+`, 'g' ), ( _, m ) => m );

  // Remove trailing commas before }])
  str = str.replace( new RegExp( ',([\\}\\]\\)])', 'g' ), ( _, m ) => m );

  // It's safe to remove whitespace before '-', however Firefox's tokenizer doesn't like 'x-1u' (presumably identifier + literal number, no operator)
  // So we'll only replace whitespace after '-' if it's not followed by a digit
  str = str.replace( new RegExp( `${linebreakOrWhitespace}*-`, 'g' ), '-' );
  str = str.replace( new RegExp( `-${linebreakOrWhitespace}+([^0-9])`, 'g' ), ( _, m ) => `-${m}` );

  // Operators don't need whitespace around them in general
  str = str.replace( new RegExp( `${linebreakOrWhitespace}*([\\+\\*/<>&\\|=\\(\\)!])${linebreakOrWhitespace}*`, 'g' ), ( _, m ) => m );

  // e.g. 0.5 => .5, 10.0 => 10.
  str = str.replace( /\d+\.\d+/g, m => {
    if ( m.endsWith( '.0' ) ) {
      m = m.substring( 0, m.length - 1 );
    }
    if ( m.startsWith( '0.' ) && m.length > 2 ) {
      m = m.substring( 1 );
    }
    return m;
  } );

  // Replace hex literals with decimal literals if they are shorter
  str = str.replace( /0x([0-9abcdefABCDEF]+)u/g, ( m, digits ) => {
    const str = '' + parseInt( digits, 16 ) + 'u';
    if ( str.length < m.length ) {
      return str;
    }
    else {
      return m;
    }
  } );

  // Detect cases where abstract int can be used safely, instead of the explicit ones
  // str = str.replace( /(==|!=)([0-9.])+[uif]/g, ( m, op, digits ) => {
  //   return `${op}${digits}`;
  // } );

  // Replace some predeclared aliases (vec2<f32> => vec2f)
  Object.keys( REPLACEMENT_MAP ).forEach( key => {
    // eslint-disable-next-line no-constant-condition
    while ( true ) {
      const match = new RegExp( `[^\\w](${key})[^\\w]`, 'g' ).exec( str );

      if ( match ) {
        const index0 = match.index + 1;
        const index1 = index0 + key.length;
        const before = str.substring( 0, index0 );
        const after = str.substring( index1 );
        str = before + REPLACEMENT_MAP[ key ] + after;
      }
      else {
        break;
      }
    }
  } );

  return str;
};

module.exports = wgslMinify;