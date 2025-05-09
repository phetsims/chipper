// Copyright 2025, University of Colorado Boulder

/**
 * Returns every variable / selector that can influence the pattern identified
 * by `key` within the given Fluent file contents.
 *
 * - fluentFileFTL : raw FTL file contents
 * - key           : message id ("id") or term id ("-id")
 * ← string[]      : alphabetical list of parameter / placeholder names
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// @ts-expect-error TODO: https://github.com/phetsims/chipper/issues/1588
import { Entry, FluentParser, Pattern, Resource } from '@fluent/syntax';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';

export function listFluentParams( fluentFileFTL: string, key: string ): string[] {

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

  // ─── Recursive parameter extraction ─────────────────────────────────────
  const collect = ( entry: Entry, seen = new Set<Entry>(), out = new Set<string>() ): Set<string> => {

    if ( seen.has( entry ) ) { return out; }
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
          out.add( expr.id.name );
          break;
        }

        case 'SelectExpression': {
          if ( expr.selector.type === 'VariableReference' ) {
            out.add( expr.selector.id.name );
          }
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
            collect( refEntry, seen, out );
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
    return out;
  };

  // ─── Run & return sorted list ───────────────────────────────────────────
  return Array.from( collect( rootEntry ).values() ).sort();
}