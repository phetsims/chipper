// Copyright 2025, University of Colorado Boulder

/**
 * Returns all Fluent message/term ids that are directly or indirectly referenced by the
 * Fluent pattern identified by `key` within the given FTL resource.
 *
 * The algorithm walks the AST produced by `FluentParser`, recording every
 * `MessageReference` and `TermReference` encountered.  When a reference is found,
 * the algorithm continues the traversal inside the referenced entry so that
 * nested/re-exported references are also included.  Variable references,
 * select-expression selectors, call-expression arguments, etc. are **ignored**
 * because they represent data flowing *into* the message from the application,
 * not Fluent resources referenced *within* the message itself.
 *
 * The returned list is deduplicated, does **not** include the root key itself
 * and is sorted for stable output.
 *
 * @param fluentFileFTL - raw contents of a single `.ftl` file
 * @param key           - id of the message (`"id"`) or term (`"-id"`) to analyse
 * @returns `string[]`  - all internally referenced ids e.g. `[ 'brand-name', '-accent-color' ]`
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';
import { ASTEntry, FluentParser, FluentSyntaxPattern } from '../../browser-and-node/FluentLibrary.js';

/**
 * Recursively collect all internal message/term references used by `key`.
 */
export function getFluentInternalReferences( fluentFileFTL: string, key: string ): string[] {

  // ── Build an index of entries for fast look-ups ──────────────────────────────
  const parser = new FluentParser();
  const resourceAst = parser.parse( fluentFileFTL );

  const entryIndex = new Map<string, ASTEntry>();
  for ( const entry of resourceAst.body ) {
    if ( 'id' in entry ) {
      // @ts-expect-error – AST node types are slightly wider than Entry
      const id = entry.id.name;
      entryIndex.set( entry.type === 'Term' ? `-${id}` : id, entry );
    }
  }

  const rootEntry = entryIndex.get( key );
  if ( !rootEntry ) { return []; }

  // ── Depth-first traversal collecting internal references ─────────────────────
  const collected = new Set<string>();

  const collect = ( entry: ASTEntry, seen = new Set<ASTEntry>() ): void => {
    if ( seen.has( entry ) ) { return; }
    seen.add( entry );

    const walkPattern = ( pattern?: FluentSyntaxPattern ): void => {
      if ( !pattern ) { return; }
      for ( const element of pattern.elements ) {
        if ( element.type === 'Placeable' ) {
          visitExpression( element.expression );
        }
      }
    };

    const visitExpression = ( expr: IntentionalAny ): void => {
      switch( expr.type ) {
        case 'MessageReference':
        case 'TermReference': {
          const refName = expr.id.type === 'Identifier' ? expr.id.name : String( expr.id.value );
          const refKey = expr.type === 'TermReference' ? `-${refName}` : refName;

          if ( refKey !== key ) {
            collected.add( refKey );
          }

          const refEntry = entryIndex.get( refKey );
          if ( refEntry ) {
            collect( refEntry, seen );
          }
          break;
        }

        // Only recurse through constructs that can contain further references
        case 'SelectExpression': {
          visitExpression( expr.selector );
          for ( const variant of expr.variants ) {
            walkPattern( variant.value );
          }
          break;
        }

        case 'CallExpression': {
          for ( const positional of expr.positional ) { visitExpression( positional ); }
          for ( const named of expr.named ) { visitExpression( named.value ); }
          break;
        }

        case 'AttributeExpression':
        case 'VariantExpression':
          visitExpression( expr.id );
          break;
        default:
          break;
      }
    };

    // @ts-expect-error – Entry may include value/attributes depending on kind
    if ( entry.value ) { walkPattern( entry.value ); }
    // @ts-expect-error – Attributes are optional
    if ( entry.attributes?.length ) {
      // @ts-expect-error
      for ( const attr of entry.attributes ) { walkPattern( attr.value ); }
    }
  };

  collect( rootEntry );

  return Array.from( collected ).sort();
}