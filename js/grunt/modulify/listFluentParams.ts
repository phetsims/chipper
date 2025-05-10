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

// @ts-expect-error TODO: https://github.com/phetsims/chipper/issues/1588
import { Entry, FluentParser, Pattern, Resource } from '@fluent/syntax';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';

/**
 * Information about a parameter in a Fluent message
 */
export type ParamInfo = {
  name: string;
  variants?: string[];  // For select expressions, the possible variant keys
};

/**
 * Returns parameters and their variant options (if applicable) for a Fluent message
 */
export function listFluentParams( fluentFileFTL: string, key: string ): ParamInfo[] {
  // ─── Parse FTL & build entry index (for recursive walks) ────────────────
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

  // Map to store parameter info (name -> ParamInfo)
  const paramsMap = new Map<string, ParamInfo>();

  // ─── Recursive parameter extraction ─────────────────────────────────────
  const collect = ( entry: Entry, seen = new Set<Entry>() ): void => {
    if ( seen.has( entry ) ) { return; }
    seen.add( entry );

    const walkPattern = ( pat?: Pattern ): void => {
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
            const variants = expr.variants.map( ( variant: IntentionalAny ) =>
              variant.key.name === 'other' ? '*' : variant.key.name
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

/**
 * For backward compatibility - returns only parameter names
 * @deprecated Use listFluentParams directly for full parameter information
 */
export function listFluentParamNames( fluentFileFTL: string, key: string ): string[] {
  return listFluentParams( fluentFileFTL, key ).map( param => param.name );
}