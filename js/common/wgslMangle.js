// Copyright 2023-2024, University of Colorado Boulder

/* eslint-env node */

/**
 * Shortens changeable symbols in a WGSL string
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

/**
 * @param {string} str
 * @param symbolInfo {{
 *   preamble: string,
 *   symbols: string[],
 *   newSymbols: string[],
 *   symbolCounts: Record<string,number>,
 *   floatZeroSymbol: string,
 *   floatOneSymbol: string,
 *   intZeroSymbol: string,
 *   intOneSymbol: string
 * }}
 * @returns {string}
 */
const wgslMangle = ( str, symbolInfo ) => {
  const symbols = symbolInfo.symbols;
  const newSymbols = symbolInfo.newSymbols;
  const symbolCounts = symbolInfo.symbolCounts;
  const floatZeroSymbol = symbolInfo.floatZeroSymbol;
  const floatOneSymbol = symbolInfo.floatOneSymbol;
  const intZeroSymbol = symbolInfo.intZeroSymbol;
  const intOneSymbol = symbolInfo.intOneSymbol;

  // Replace symbols[ i ] with newSymbols[ i ], but with:
  // 1. No going back, since some newSymbols might be in symbols.
  // 2. Ignore imports
  // 3. Strip out unused constants

  // Regexp that should match any symbol that is to be replaced (with 1char on each side)
  let firstIndex = 0;

  // eslint-disable-next-line no-constant-condition
  while ( true ) {
    const match = new RegExp( `[^\\w](${symbols.join( '|' )})[^\\w]` ).exec( str.slice( firstIndex ) );
    if ( !match ) {
      break;
    }

    const name = match[ 1 ];
    const index = symbols.indexOf( name );
    if ( index < 0 ) {
      throw new Error( 'bad regexp' );
    }
    const index0 = firstIndex + match.index + 1;
    const index1 = index0 + name.length;
    const before = str.substring( 0, index0 );
    const after = str.substring( index1 );

    // We still have to do import stuff
    if ( !before.endsWith( '#import ' ) ) {
      // Try to strip out unused variables
      const afterMatch = /[=]\d+u;/.exec( after );

      if ( symbolCounts[ name ] === 1 && before.endsWith( 'const ' ) && afterMatch ) {
        const newBefore = before.slice( 0, before.length - 'const '.length );
        str = newBefore + after.slice( afterMatch[ 0 ].length );
        firstIndex = newBefore.length - 1;
      }
      else {
        const newBefore = before + newSymbols[ index ];
        str = newBefore + after;
        firstIndex = newBefore.length - 1;
      }
    }
    else {
      firstIndex = index1 - 1;
    }
  }

  // Replace some numeric literals with replacement symbols that are shorter(!)
  str = str.replace( /([^0-9a-fA-FxX])0\.([^0-9a-fA-FxXeEfh:pP])/g, ( m, before, after ) => {
    return before + floatZeroSymbol + after;
  } );
  str = str.replace( /([^0-9a-fA-FxX])1\.([^0-9a-fA-FxXeEfh:pP])/g, ( m, before, after ) => {
    return before + floatOneSymbol + after;
  } );
  str = str.replace( /([^0-9a-fA-FxX])0u([^0-9a-fA-FxXeEfh:pP])/g, ( m, before, after ) => {
    return before + intZeroSymbol + after;
  } );
  str = str.replace( /([^0-9a-fA-FxX])1u([^0-9a-fA-FxXeEfh:pP])/g, ( m, before, after ) => {
    return before + intOneSymbol + after;
  } );

  // Remove whitespace around the replacement symbols, since it won't be interpreted as a literal
  [ floatZeroSymbol, floatOneSymbol, intZeroSymbol, intOneSymbol ].forEach( symbol => {
    str = str.replace( new RegExp( `- ${symbol}` ), `-${symbol}` );
  } );

  return str;
};

module.exports = wgslMangle;