// Copyright 2025, University of Colorado Boulder

/**
 * Returns every variable / selector that can influence the pattern identified
 * by `key` within the given Fluent file contents.
 *
 * - fluentFileFTL : raw FTL file contents
 * - key           : message id ("id") or term id ("-id")
 * ← ParamInfo[]   : information about each parameter including name and variant options
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import affirm from '../../../../perennial-alias/js/browser-and-node/affirm.js';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';
import { ASTEntry, FluentParser, FluentSyntaxPattern } from '../../browser-and-node/FluentLibrary.js';

/**
 * Information about a parameter in a Fluent message
 */
export type ParamInfo = {
  name: string;

  // For select expressions, the possible variant keys
  variants?: ( string | number |

    // Encode numeric literal so we can distinguish it from the string literal.
    // const x: number = 7;
    // const x: 'number' = 'number';
    { type: string; value: string } )[];
};

const NUMERIC_KEYWORDS = [ 'zero', 'one', 'two', 'few', 'many', 'other' ];

export const NUMBER_LITERAL = 'number';

/**
 * Returns parameters and their variant options (if applicable) for a Fluent message.
 * Also detects if the message has any references to other messages.
 */
export function getFluentParams( fluentFileFTL: string, key: string ): ParamInfo[] {
  // ─── Parse FTL & build entry index (for recursive walks) ────────────────
  const parser = new FluentParser();
  const resourceAst = parser.parse( fluentFileFTL );

  const entryIndex = new Map<string, ASTEntry>(); // "id" | "-id" → Entry
  for ( const entry of resourceAst.body ) {
    if ( 'id' in entry ) {
      // @ts-expect-error – AST node types are slightly wider than Entry
      const id = entry.id.name;
      entryIndex.set( entry.type === 'Term' ? `-${id}` : id, entry );
    }
  }

  const rootEntry = entryIndex.get( key );
  if ( !rootEntry ) {
    return [];
  }

  // Map to store parameter info (name -> ParamInfo)
  const paramsMap = new Map<string, ParamInfo>();

  // Flag to track if we found any message references (even without variables)
  let hasMessageReferences = false;

  // ─── Recursive parameter extraction ─────────────────────────────────────
  const collect = ( entry: ASTEntry, seen = new Set<ASTEntry>() ): void => {
    if ( seen.has( entry ) ) { return; }
    seen.add( entry );

    const walkPattern = ( pat?: FluentSyntaxPattern ): void => {
      if ( !pat ) { return; }
      for ( const elem of pat.elements ) {
        if ( elem.type === 'Placeable' ) {
          visitExpression( elem.expression );
        }
      }
    };

    const visitExpression = ( expr: IntentionalAny ): void => {
      // eslint-disable-next-line default-case
      switch( expr.type ) {
        case 'VariableReference': {
          const paramName = expr.id.name;
          if ( !paramsMap.has( paramName ) ) {
            paramsMap.set( paramName, { name: paramName } );
          }
          break;
        }

        case 'SelectExpression': {
          if ( expr.selector.type === 'VariableReference' ) {
            const paramName = expr.selector.id.name;

            // Extract variant keys from the SelectExpression
            const variants = expr.variants.map( ( variant: IntentionalAny ) => {
                if ( variant.key.type && variant.key.type === 'NumberLiteral' ) {

                  const parsed = Number( variant.key.value );
                  affirm( Number.isFinite( parsed ), `Expected a finite number for variant key, got: ${variant.key.value}` );
                  return parsed;
                }
                else {

                  // Treat zero, one, two, few, many, and other as numeric values, as type 'number'
                  // and all other keys as strings.
                  return NUMERIC_KEYWORDS.includes( variant.key.name ) ? { type: NUMBER_LITERAL, value: variant.key.name } : variant.key.name;
                }
              }
            );

            // Store param with its variants
            if ( paramsMap.has( paramName ) ) {
              // If already exists, add/merge variants
              const existing = paramsMap.get( paramName )!;
              if ( !existing.variants ) {
                existing.variants = variants;
              }
              else {
                // Merge with existing variants
                for ( const variant of variants ) {
                  if ( !existing.variants.includes( variant ) ) {
                    existing.variants.push( variant );
                  }
                }
              }
            }
            else {
              paramsMap.set( paramName, { name: paramName, variants: variants } );
            }
          }

          // Process the selector and all variants
          for ( const variant of expr.variants ) {
            walkPattern( variant.value );
          }
          visitExpression( expr.selector );
          break;
        }

        case 'MessageReference':
        case 'TermReference': {
          // Set the flag when we find a message reference
          hasMessageReferences = true;

          const refName = expr.id.type === 'Identifier' ? expr.id.name : String( expr.id.value );
          const refKey = expr.type === 'TermReference' ? `-${refName}` : refName;
          const refEntry = entryIndex.get( refKey );
          if ( refEntry ) {
            collect( refEntry, seen );
          }
          break;
        }

        case 'CallExpression': {
          for ( const pos of expr.positional ) { visitExpression( pos ); }
          for ( const named of expr.named ) { visitExpression( named.value ); }
          break;
        }

        case 'AttributeExpression':
        case 'VariantExpression':
          visitExpression( expr.id );
          break;
      }
    };

    // @ts-expect-error – Entry may include value/attributes depending on kind
    if ( entry.value ) { walkPattern( entry.value ); }
    // @ts-expect-error
    if ( entry.attributes?.length ) {
      // @ts-expect-error
      for ( const attr of entry.attributes ) { walkPattern( attr.value ); }
    }
  };

  // Run the collection process
  collect( rootEntry );

  // Convert the map to an array of ParamInfo objects, sorted by name
  return Array.from( paramsMap.values() ).sort( ( a, b ) => a.name.localeCompare( b.name ) );
}