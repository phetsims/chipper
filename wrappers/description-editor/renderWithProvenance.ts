// Copyright 2026, University of Colorado Boulder

/**
 * A small deterministic Fluent resolver that renders one message for one argument combination, emitting an ordered
 * list of provenance-tagged segments instead of a flat string. Each segment knows whether it is static template
 * text or a substituted variable, and which message it textually lives in — referenced messages (shared fragments)
 * contribute segments tagged with their own ID, enabling click-to-source and safe in-place editing.
 *
 * Only the AST node types produced by PhET strings YAML are supported: TextElement, and Placeables containing
 * VariableReference, SelectExpression (selector must be a variable), and MessageReference. A self-check against the
 * real FluentBundle guards against divergence (see selfCheckMessage).
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import { ASTEntry, FluentBundle } from '../../js/browser-and-node/FluentLibrary.js';

export type ProvenanceSegment = {
  text: string;

  // 'static' — literal template text; 'variable' — a substituted { $variable } value
  kind: 'static' | 'variable';

  // Fluent ID of the message whose template this segment lives in (differs from the root for shared fragments)
  messageId: string;

  // For variable segments, the variable name
  variableName?: string;

  // For static segments: the character offset of this text within its message's template value (the YAML leaf
  // string after reference canonicalization). This is the provenance that lets an edited segment be located
  // unambiguously in the YAML even when the same phrase appears in multiple variant branches.
  valueOffset?: number;
};

/**
 * Renders one message for one argument combination into provenance-tagged segments.
 *
 * @param entryIndex - parsed FTL entry index from parseFluentToMap
 * @param fluentId - the message ID to render
 * @param args - argument values, e.g. { sourceType: 'photons' }
 * @param ftlContent - when provided, the FTL text the entryIndex was parsed from; enables valueOffset provenance on
 *   static segments via the parser's source spans
 * @returns ordered segments whose concatenation is the rendered text
 */
export function renderCombo(
  entryIndex: Map<string, ASTEntry>,
  fluentId: string,
  args: Record<string, string>,
  ftlContent?: string
): ProvenanceSegment[] {
  const segments: ProvenanceSegment[] = [];

  // Converts an absolute FTL span offset to an offset within the message's template value. The FTL was produced by
  // formatMultilineForFtl, which inserts exactly one indent space after each newline, so the value offset is the
  // FTL distance minus one per intervening newline.
  const toValueOffset = ( valueStart: number, spanStart: number ): number => {
    const between = ftlContent!.slice( valueStart, spanStart );
    const newlineCount = ( between.match( /\n/g ) || [] ).length;
    return spanStart - valueStart - newlineCount;
  };

  const resolveEntry = ( id: string, depth: number ): void => {
    if ( depth > 10 ) {
      throw new Error( `Message reference depth exceeded at ${id} — reference cycle?` );
    }
    const entry = entryIndex.get( id ) as IntentionalAny;
    if ( !entry || !entry.value ) {
      throw new Error( `Unknown message referenced: ${id}` );
    }
    const valueStart = ( ftlContent !== undefined && entry.value.span ) ? entry.value.span.start : null;
    resolvePattern( entry.value, id, depth, valueStart );
  };

  const resolvePattern = ( pattern: IntentionalAny, messageId: string, depth: number, valueStart: number | null ): void => {
    for ( const element of pattern.elements ) {
      if ( element.type === 'TextElement' ) {
        const segment: ProvenanceSegment = { text: element.value, kind: 'static', messageId: messageId };
        if ( valueStart !== null && element.span ) {
          segment.valueOffset = toValueOffset( valueStart, element.span.start );
        }
        segments.push( segment );
      }
      else if ( element.type === 'Placeable' ) {
        resolveExpression( element.expression, messageId, depth, valueStart );
      }
      else {
        throw new Error( `Unsupported pattern element: ${element.type} in ${messageId}` );
      }
    }
  };

  const resolveExpression = ( expression: IntentionalAny, messageId: string, depth: number, valueStart: number | null ): void => {
    if ( expression.type === 'VariableReference' ) {
      const name = expression.id.name;
      const value = name in args ? args[ name ] : `〈${name}〉`;
      segments.push( { text: value, kind: 'variable', messageId: messageId, variableName: name } );
    }
    else if ( expression.type === 'SelectExpression' ) {
      if ( expression.selector.type !== 'VariableReference' ) {
        throw new Error( `Unsupported selector type ${expression.selector.type} in ${messageId}` );
      }
      const name = expression.selector.id.name;
      const value = args[ name ];

      let chosen = null;
      let defaultVariant = null;
      for ( const variant of expression.variants ) {
        const key = variant.key.type === 'NumberLiteral' ? String( variant.key.value ) : variant.key.name;
        if ( key === value ) {
          chosen = variant;
        }
        if ( variant.default ) {
          defaultVariant = variant;
        }
      }
      const selected = chosen || defaultVariant;
      if ( !selected ) {
        throw new Error( `No matching or default variant for $${name}=${value} in ${messageId}` );
      }
      resolvePattern( selected.value, messageId, depth, valueStart );
    }
    else if ( expression.type === 'MessageReference' ) {
      resolveEntry( expression.id.name, depth + 1 );
    }
    else {
      throw new Error( `Unsupported expression type: ${expression.type} in ${messageId}` );
    }
  };

  resolveEntry( fluentId, 0 );

  return segments;
}

/**
 * Concatenates segments into the rendered string.
 */
export function segmentsToText( segments: ProvenanceSegment[] ): string {
  return segments.map( segment => segment.text ).join( '' );
}

/**
 * Verifies that the mini-resolver agrees with the real FluentBundle for the given argument combinations. The bundle
 * must have been constructed with useIsolating: false so output contains no bidi isolation marks.
 *
 * @param entryIndex - parsed FTL entry index
 * @param bundle - FluentBundle loaded with the same FTL content
 * @param fluentId - message to verify
 * @param argsList - argument combinations to check
 * @returns an error description, or null when all combinations match
 */
export function selfCheckMessage(
  entryIndex: Map<string, ASTEntry>,
  bundle: FluentBundle,
  fluentId: string,
  argsList: Record<string, string>[]
): string | null {
  const bundleMessage = bundle.getMessage( fluentId );
  if ( !bundleMessage || bundleMessage.value === null ) {
    return `Message missing from bundle: ${fluentId}`;
  }

  for ( const args of argsList ) {
    let editorText;
    try {
      editorText = segmentsToText( renderCombo( entryIndex, fluentId, args ) );
    }
    catch( error ) {
      return `${fluentId}: mini-resolver error: ${error instanceof Error ? error.message : String( error )}`;
    }

    // Numeric values are passed to the bundle as numbers, matching how sims pass counts (e.g. hitCount), so the
    // bundle's numeric variant matching agrees with the mini-resolver's string comparison.
    const bundleArgs: Record<string, string | number> = {};
    for ( const [ name, value ] of Object.entries( args ) ) {
      bundleArgs[ name ] = /^-?\d+(\.\d+)?$/.test( value ) ? Number( value ) : value;
    }

    const errors: Error[] = [];
    const bundleText = bundle.formatPattern( bundleMessage.value, bundleArgs, errors );
    if ( errors.length > 0 ) {
      return `${fluentId}: FluentBundle errors: ${errors.map( error => error.message ).join( '; ' )}`;
    }

    if ( editorText !== bundleText ) {
      return `${fluentId}: mismatch for args ${JSON.stringify( args )}\n  editor: ${JSON.stringify( editorText )}\n  bundle: ${JSON.stringify( bundleText )}`;
    }
  }

  return null;
}
