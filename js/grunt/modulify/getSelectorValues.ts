// Copyright 2025, University of Colorado Boulder

/**
 * Extract selector values from a Fluent string pattern to create a union type.
 * For example, from a pattern like:
 * { $activityLevel ->
 *   *[calm] relatively calm
 *   [active] active
 *   [activeAndPaused] active and paused
 * }
 *
 * It would extract: 'calm' | 'active' | 'activeAndPaused'
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// @ts-expect-error
import { Entry, FluentParser, Resource } from '@fluent/syntax';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';

/**
 * For a given Fluent string and parameter name, extract the possible selector values
 * @param fluentFileFTL - Raw FTL file contents
 * @param key - Message id ("id") or term id ("-id")
 * @param paramName - The parameter name to extract selector values for
 * @returns Array of possible values for the selector
 */
export function getSelectorValues( fluentFileFTL: string, key: string, paramName: string ): string[] {
  // Parse FTL & build entry index
  const parser = new FluentParser();
  const resourceAst: Resource = parser.parse( fluentFileFTL );

  const entryIndex = new Map<string, Entry>(); // "id" | "-id" → Entry
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

  // Collect selector values for the specific parameter
  const values = new Set<string>();

  const walkPattern = ( pat?: IntentionalAny ): void => {
    if ( !pat ) {
      return;
    }
    for ( const elem of pat.elements ) {
      if ( elem.type === 'Placeable' ) {
        collectSelectorValues( elem.expression, paramName, values );
      }
    }
  };

  if ( rootEntry.value ) { walkPattern( rootEntry.value ); }
  // @ts-expect-error
  if ( rootEntry.attributes?.length ) {
    // @ts-expect-error
    for ( const attr of rootEntry.attributes ) { walkPattern( attr.value ); }
  }

  return Array.from( values ).sort();
}

/**
 * Recursive helper to collect selector values
 */
function collectSelectorValues( expr: IntentionalAny, paramName: string, values: Set<string> ): void {
  // We're only interested in SelectExpression where the selector matches our parameter
  if ( expr.type === 'SelectExpression' &&
       expr.selector.type === 'VariableReference' &&
       expr.selector.id.name === paramName ) {

    // Extract values from each variant
    for ( const variant of expr.variants ) {
      const key = variant.key.type === 'NumberLiteral'
                  ? variant.key.value
                  : variant.key.name;

      values.add( String( key ) );
    }
  }

  // Continue recursively through nested expressions
  if ( expr.selector ) {
    collectSelectorValues( expr.selector, paramName, values );
  }

  // For variants, check their values too
  if ( expr.variants ) {
    for ( const variant of expr.variants ) {
      if ( variant.value && variant.value.elements ) {
        for ( const elem of variant.value.elements ) {
          if ( elem.type === 'Placeable' ) {
            collectSelectorValues( elem.expression, paramName, values );
          }
        }
      }
    }
  }
}