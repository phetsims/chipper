// Copyright 2023-2024, University of Colorado Boulder

/* eslint-env node */

/**
 * Scans WGSL files to determine symbol frequency, and replacement symbols for minification/mangling.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const _ = require( 'lodash' );
const wgslStripComments = require( './wgslStripComments' );

const KEYWORDS = [
  'alias',
  'break',
  'case',
  'const',
  'const_assert',
  'continue',
  'continuing',
  'default',
  'diagnostic',
  'discard',
  'else',
  'enable',
  'false',
  'fn',
  'for',
  'if',
  'let',
  'loop',
  'override',
  'requires',
  'return',
  'struct',
  'switch',
  'true',
  'var',
  'while'
];

const RESERVED = [
  'NULL',
  'Self',
  'abstract',
  'active',
  'alignas',
  'alignof',
  'as',
  'asm',
  'asm_fragment',
  'async',
  'attribute',
  'auto',
  'await',
  'become',
  'binding_array',
  'cast',
  'catch',
  'class',
  'co_await',
  'co_return',
  'co_yield',
  'coherent',
  'column_major',
  'common',
  'compile',
  'compile_fragment',
  'concept',
  'const_cast',
  'consteval',
  'constexpr',
  'constinit',
  'crate',
  'debugger',
  'decltype',
  'delete',
  'demote',
  'demote_to_helper',
  'do',
  'dynamic_cast',
  'enum',
  'explicit',
  'export',
  'extends',
  'extern',
  'external',
  'fallthrough',
  'filter',
  'final',
  'finally',
  'friend',
  'from',
  'fxgroup',
  'get',
  'goto',
  'groupshared',
  'highp',
  'impl',
  'implements',
  'import',
  'inline',
  'instanceof',
  'interface',
  'layout',
  'lowp',
  'macro',
  'macro_rules',
  'match',
  'mediump',
  'meta',
  'mod',
  'module',
  'move',
  'mut',
  'mutable',
  'namespace',
  'new',
  'nil',
  'noexcept',
  'noinline',
  'nointerpolation',
  'noperspective',
  'null',
  'nullptr',
  'of',
  'operator',
  'package',
  'packoffset',
  'partition',
  'pass',
  'patch',
  'pixelfragment',
  'precise',
  'precision',
  'premerge',
  'priv',
  'protected',
  'pub',
  'public',
  'readonly',
  'ref',
  'regardless',
  'register',
  'reinterpret_cast',
  'require',
  'resource',
  'restrict',
  'self',
  'set',
  'shared',
  'sizeof',
  'smooth',
  'snorm',
  'static',
  'static_assert',
  'static_cast',
  'std',
  'subroutine',
  'super',
  'target',
  'template',
  'this',
  'thread_local',
  'throw',
  'trait',
  'try',
  'type',
  'typedef',
  'typeid',
  'typename',
  'typeof',
  'union',
  'unless',
  'unorm',
  'unsafe',
  'unsized',
  'use',
  'using',
  'varying',
  'virtual',
  'volatile',
  'wgsl',
  'where',
  'with',
  'writeonly',
  'yield'
];

const ATTRIBUTES = [
  'align',
  'binding',
  'builtin',
  'compute',
  'const',
  'fragment',
  'group',
  'id',
  'interpolate',
  'invariant',
  'location',
  'size',
  'vertex',
  'workgroup_size'
];

const SWIZZLES = _.flatten( [ 'rgba', 'xyzw' ].map( rgba => {
  const result = [];
  const recur = ( prefix, remaining ) => {
    prefix && result.push( prefix );
    if ( remaining > 0 ) {
      for ( let i = 0; i < rgba.length; i++ ) {
        recur( prefix + rgba[ i ], remaining - 1 );
      }
    }
  };
  recur( '', 4 );
  return result;
} ) );

const OTHER = [
  'array',
  'bool',
  'f16',
  'f32',
  'i32',
  'mat2x2',
  'mat2x3',
  'mat2x4',
  'mat3x2',
  'mat3x3',
  'mat3x4',
  'mat4x2',
  'mat4x3',
  'mat4x4',
  'u32',
  'vec2',
  'vec3',
  'vec4',
  'bitcast',
  'all',
  'any',
  'select',
  'arrayLength',
  'abs',
  'acos',
  'acosh',
  'asin',
  'asinh',
  'atan',
  'atanh',
  'atan2',
  'ceil',
  'clamp',
  'cos',
  'cosh',
  'countLeadingZeros',
  'countOneBits',
  'countTrailingZeros',
  'cross',
  'degrees',
  'determinant',
  'distance',
  'dot',
  'exp',
  'exp2',
  'extractBits',
  'extractBits',
  'faceForward',
  'firstLeadingBit',
  'firstLeadingBit',
  'firstTrailingBit',
  'floor',
  'fma',
  'fract',
  'frexp',
  'insertBits',
  'inverseSqrt',
  'ldexp',
  'length',
  'log',
  'log2',
  'max',
  'min',
  'mix',
  'modf',
  'normalize',
  'pow',
  'quantizeToF16',
  'radians',
  'reflect',
  'refract',
  'reverseBits',
  'round',
  'saturate',
  'sign',
  'sin',
  'sinh',
  'smoothstep',
  'sqrt',
  'step',
  'tan',
  'tanh',
  'transpose',
  'trunc',
  'dpdx',
  'dpdxCoarse',
  'dpdxFine',
  'dpdy',
  'dpdyCoarse',
  'dpdyFine',
  'fwidth',
  'fwidthCoarse',
  'fwidthFine',
  'textureDimensions',
  'textureGather',
  'textureGatherCompare',
  'textureLoad',
  'textureNumLayers',
  'textureNumLevels',
  'textureNumSamples',
  'textureSample',
  'textureSampleBias',
  'textureSampleCompare',
  'textureSampleCompareLevel',
  'textureSampleGrad',
  'textureSampleLevel',
  'textureSampleBaseClampToEdge',
  'textureStore',
  'atomicLoad',
  'atomicStore',
  'atomicAdd',
  'atomicSub',
  'atomicMax',
  'atomicMin',
  'atomicAnd',
  'atomicOr',
  'atomicXor',
  'atomicExchange',
  'atomicCompareExchangeWeak',
  'pack4x8snorm',
  'pack4x8unorm',
  'pack2x16snorm',
  'pack2x16unorm',
  'pack2x16float',
  'unpack4x8snorm',
  'unpack4x8unorm',
  'unpack2x16snorm',
  'unpack2x16unorm',
  'unpack2x16float',
  'storageBarrier',
  'workgroupBarrier',
  'workgroupUniformLoad',
  'vec2i',
  'vec3i',
  'vec4i',
  'vec2u',
  'vec3u',
  'vec4u',
  'vec2f',
  'vec3f',
  'vec4f',
  'vec2h',
  'vec3h',
  'vec4h',
  'mat2x2f',
  'mat2x3f',
  'mat2x4f',
  'mat3x2f',
  'mat3x3f',
  'mat3x4f',
  'mat4x2f',
  'mat4x3f',
  'mat4x4f',
  'mat2x2h',
  'mat2x3h',
  'mat2x4h',
  'mat3x2h',
  'mat3x3h',
  'mat3x4h',
  'mat4x2h',
  'mat4x3h',
  'mat4x4h',
  'atomic',
  'read',
  'write',
  'read_write',
  'function',
  'private',
  'workgroup',
  'uniform',
  'storage',
  'perspective',
  'linear',
  'flat',
  'center',
  'centroid',
  'sample',
  'vertex_index',
  'instance_index',
  'position',
  'front_facing',
  'frag_depth',
  'local_invocation_id',
  'local_invocation_index',
  'global_invocation_id',
  'workgroup_id',
  'num_workgroups',
  'sample_index',
  'sample_mask',
  'rgba8unorm',
  'rgba8snorm',
  'rgba8uint',
  'rgba8sint',
  'rgba16uint',
  'rgba16sint',
  'rgba16float',
  'r32uint',
  'r32sint',
  'r32float',
  'rg32uint',
  'rg32sint',
  'rg32float',
  'rgba32uint',
  'rgba32sint',
  'rgba32float',
  'bgra8unorm',
  'texture_1d',
  'texture_2d',
  'texture_2d_array',
  'texture_3d',
  'texture_cube',
  'texture_cube_array',
  'texture_multisampled_2d',
  'texture_depth_multisampled_2d',
  'texture_external',
  'texture_storage_1d',
  'texture_storage_2d',
  'texture_storage_2d_array',
  'texture_storage_3d',
  'texture_depth_2d',
  'texture_depth_2d_array',
  'texture_depth_cube',
  'texture_depth_cube_array',
  'sampler',
  'sampler_comparison',
  'alias',
  'ptr',
  'vertex_index',
  'instance_index',
  'position',
  'fragment',
  'front_facing',
  'frag_depth',
  'sample_index',
  'sample_mask',
  'fragment',
  'local_invocation_id',
  'local_invocation_index',
  'global_invocation_id',
  'workgroup_id',
  'num_workgroups',
  'align',
  'binding',
  'builtin',
  'compute',
  'const',
  'diagnostic',
  'fragment',
  'group',
  'id',
  'interpolate',
  'invariant',
  'location',
  'must_use',
  'size',
  'vertex',
  'workgroup_size',
  'true',
  'false',
  'diagnostic',
  'error',
  'info',
  'off',
  'warning'
];

const AVOID_SYMBOLS = _.uniq( [
  ...KEYWORDS,
  ...RESERVED,
  ...ATTRIBUTES,
  ...SWIZZLES,
  ...OTHER
] ).sort();

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

const GLOBALLY_ALIASABLE_TYPES = [
  'u32',
  'i32',
  'f32',
  'bool',
  'f16',
  'vec2i',
  'vec3i',
  'vec4i',
  'vec2u',
  'vec3u',
  'vec4u',
  'vec2f',
  'vec3f',
  'vec4f',
  'vec2h',
  'vec3h',
  'vec4h',
  'mat2x2f',
  'mat2x3f',
  'mat2x4f',
  'mat3x2f',
  'mat3x3f',
  'mat3x4f',
  'mat4x2f',
  'mat4x3f',
  'mat4x4f',
  'mat2x2h',
  'mat2x3h',
  'mat2x4h',
  'mat3x2h',
  'mat3x3h',
  'mat3x4h',
  'mat4x2h',
  'mat4x3h',
  'mat4x4h',
  'atomic<u32>',
  'atomic<i32>',
  'array<u32>',
  'array<i32>',
  'array<f32>'
  // NOTE: potentially other arrays?
  // NOTE: potentially we can insert aliases AFTER struct defs that are for arrays of them?
];

const firstCharAlphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
const otherCharAlphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789';

/**
 *
 * @param {string[]} wgslFileContents
 * @returns {{
 *   preamble: string,
 *   symbols: string[],
 *   newSymbols: string[],
 *   symbolCounts: Record<string,number>,
 *   floatZeroSymbol: string,
 *   floatOneSymbol: string,
 *   intZeroSymbol: string,
 *   intOneSymbol: string
 * }}
 */
const wgslGetSymbolInfo = wgslFileContents => {

  // Generator to iterate through possible replacement symbols
  const generateSymbol = function *() {
    let length = 0;
    const indexStack = [ firstCharAlphabet.length ];
    while ( true ) {
      let pushedNext = false;
      while ( indexStack.length > 0 ) {
        const index = indexStack.pop();
        const nextIndex = index + 1;
        if ( nextIndex < ( indexStack.length ? otherCharAlphabet : firstCharAlphabet ).length ) {
          indexStack.push( nextIndex );
          pushedNext = true;
          break;
        }
      }
      if ( !pushedNext ) {
        length++;
      }
      while ( indexStack.length < length ) {
        indexStack.push( 0 );
      }
      const symbol = indexStack.map( ( index, i ) => i === 0 ? firstCharAlphabet[ index ] : otherCharAlphabet[ index ] ).join( '' );
      if ( !AVOID_SYMBOLS.includes( symbol ) && symbol !== '_' && !symbol.startsWith( '__' ) ) {
        yield symbol;
      }
    }
  };

  let symbols = [];
  let totalStr = '';
  const scanSymbols = str => {
    // NOTE: don't require this specific formatting! Search for symbols otherwise?
    totalStr += str;
    str = wgslStripComments( str );
    [ ...str.matchAll( /struct ([\w]+) {/g ) ].forEach( match => {
      symbols.push( match[ 1 ] );
    } );
    [ ...str.matchAll( /fn ([\w]+)\(/g ) ].forEach( match => {
      symbols.push( match[ 1 ] );
    } );
    [ ...str.matchAll( /let ([\w]+) = /g ) ].forEach( match => {
      symbols.push( match[ 1 ] );
    } );
    [ ...str.matchAll( /var ([\w]+) = /g ) ].forEach( match => {
      symbols.push( match[ 1 ] );
    } );
    [ ...str.matchAll( /alias ([\w]+) = /g ) ].forEach( match => {
      symbols.push( match[ 1 ] );
    } );
    [ ...str.matchAll( /\s([\w]+):/g ) ].forEach( match => {
      symbols.push( match[ 1 ] );
    } );
  };
  wgslFileContents.forEach( scanSymbols );

  symbols = _.uniq( symbols ).filter( symbol => {
    if ( _.some( _.range( 0, 10 ), i => symbol.startsWith( `${i}` ) ) ) {
      return false;
    }

    if ( AVOID_SYMBOLS.includes( symbol ) ) {
      return false;
    }

    // OUR main entry point (NOT general)
    return symbol !== 'main';


  } );
  const symbolCounts = {};
  // Count symbols, and sort by the count. We'll use the count later to remove unused constants!
  symbols = _.sortBy( symbols, symbol => {
    const count = [ ...totalStr.matchAll( new RegExp( `[^\\w]${symbol}[^\\w]`, 'g' ) ) ].length;
    symbolCounts[ symbol ] = count;
    return count;
  } ).reverse();

  const globalAliasesCounts = {};
  const globalAliases = _.sortBy( GLOBALLY_ALIASABLE_TYPES.filter( alias => {
    let count = [ ...totalStr.matchAll( new RegExp( `[^\\w]${alias}[^\\w]`, 'g' ) ) ].length;

    // If vec2f, also check vec2<f32>
    const expandedAlias = Object.keys( REPLACEMENT_MAP ).find( before => REPLACEMENT_MAP[ before ] === alias );
    if ( expandedAlias ) {
      count += [ ...totalStr.matchAll( new RegExp( `[^\\w]${expandedAlias}[^\\w]`, 'g' ) ) ].length;
    }

    globalAliasesCounts[ alias ] = count;
    // Just anticipate 2 characters per alias (though some might get 1 char?) - we don't want to blow up our preamble
    // with useless things.
    return count * ( alias.length - 2 ) > `alias ${alias}=XX;`.length;
  } ), alias => {
    return globalAliasesCounts[ alias ];
  } ).reverse();

  const combinedSymbolEntries = _.sortBy( [
    ...symbols.map( symbol => ( {
      type: 'symbol',
      name: symbol
    } ) ),
    ...globalAliases.map( alias => ( {
      type: 'alias',
      name: alias
    } ) )
  ], symbolEntry => {
    return ( symbolEntry.type === 'symbol' ? symbolCounts : globalAliasesCounts )[ symbolEntry.name ];
  } ).reverse();

  const newSymbols = [];
  const newGlobalAliases = [];
  const symbolGenerator = generateSymbol();

  // NOTE: this is a hack, order things correctly
  const floatZeroSymbol = symbolGenerator.next().value;
  const floatOneSymbol = symbolGenerator.next().value;
  const intZeroSymbol = symbolGenerator.next().value;
  const intOneSymbol = symbolGenerator.next().value;

  for ( let i = 0; i < combinedSymbolEntries.length; i++ ) {
    const entry = combinedSymbolEntries[ i ];
    if ( entry.type === 'symbol' ) {
      newSymbols.push( symbolGenerator.next().value );
    }
    else {
      newGlobalAliases.push( symbolGenerator.next().value );
    }
  }

  const preamble = globalAliases.map( ( alias, index ) => {
    return `alias ${newGlobalAliases[ index ]}=${alias};`;
  } ).join( '' ) + `const ${floatZeroSymbol}=0.;const ${floatOneSymbol}=1.;const ${intZeroSymbol}=0u;const ${intOneSymbol}=1u;`;

  symbols.push( ...globalAliases );
  newSymbols.push( ...newGlobalAliases );

  return {
    symbols: symbols,
    newSymbols: newSymbols,
    symbolCounts: symbolCounts,
    preamble: preamble,
    floatZeroSymbol: floatZeroSymbol,
    floatOneSymbolL: floatOneSymbol,
    intZeroSymbol: intZeroSymbol,
    intOneSymbol: intOneSymbol
  };
};

module.exports = wgslGetSymbolInfo;