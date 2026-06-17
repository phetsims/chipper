// Copyright 2026, University of Colorado Boulder

/**
 * Back-propagates Description Editor edits into the strings YAML file, which remains the single source of truth.
 *
 * - applyStaticEdit: replaces a static template phrase within one message's YAML scalar block. Only static-segment
 *   edits are supported (enforced by the client UI); the old text must match exactly once within the block, using
 *   whitespace-flexible matching because YAML block scalars wrap lines that Fluent later rejoins.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { YamlMessage } from './loadYamlMessages.js';

export type EditResult = { yamlText: string; line: number } | { error: string };

/**
 * Escapes regex metacharacters, then relaxes whitespace runs to \s+ so matches survive YAML line wrapping.
 */
function whitespaceFlexiblePattern( text: string ): RegExp {
  const escaped = text.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
  const flexible = escaped.replace( /\s+/g, '\\s+' );
  return new RegExp( flexible, 'g' );
}

/**
 * Replaces one occurrence of a static template phrase within the given message's YAML scalar block.
 *
 * When the phrase appears in multiple variant branches, the segment's valueOffset (its position within the message's
 * template value, from the Fluent parser's source spans) disambiguates: occurrence order is preserved between the
 * template value and the YAML block (YAML line folding only transforms whitespace), so the nth match in the value
 * corresponds to the nth match in the block.
 *
 * @param yamlText - current YAML file contents
 * @param message - the message being edited (provides the scalar block's line range and template value)
 * @param oldText - the static segment text as rendered (whitespace-flexible matched against the YAML)
 * @param newText - replacement text; must be a single line
 * @param valueOffset - offset of the edited segment within the message's template value, for disambiguation
 * @returns the updated YAML text and the line of the edit, or an error explaining why the edit is ambiguous/unsafe
 */
export function applyStaticEdit( yamlText: string, message: YamlMessage, oldText: string, newText: string, valueOffset?: number ): EditResult {
  if ( oldText.trim().length === 0 ) {
    return { error: 'Cannot edit an empty or whitespace-only segment.' };
  }
  if ( newText.includes( '\n' ) ) {
    return { error: 'Replacement text must be a single line.' };
  }
  if ( /[{}]/.test( newText ) ) {
    return { error: 'Replacement text must not contain braces — edit the YAML pane for structural changes.' };
  }

  const lines = yamlText.split( '\n' );
  const blockLines = lines.slice( message.yamlLineStart, message.yamlLineEnd + 1 );
  const blockText = blockLines.join( '\n' );

  const pattern = whitespaceFlexiblePattern( oldText.trim() );
  const matches = [ ...blockText.matchAll( pattern ) ];

  if ( matches.length === 0 ) {
    return { error: `Could not locate the phrase in ${message.dotKey} — it may span a fragment boundary. Edit the YAML pane instead.` };
  }

  let match = matches[ 0 ];
  if ( matches.length > 1 ) {
    if ( valueOffset === undefined ) {
      return { error: `The phrase appears ${matches.length} times in ${message.dotKey} — edit the YAML pane to disambiguate.` };
    }

    // Find which occurrence within the template value the edited segment is, then take the same occurrence in the
    // YAML block. Occurrence counts can differ for hoisted-select messages whose template is synthesized.
    const valueMatches = [ ...message.value.matchAll( whitespaceFlexiblePattern( oldText.trim() ) ) ];
    if ( valueMatches.length !== matches.length ) {
      return { error: `Provenance mismatch in ${message.dotKey} (template has ${valueMatches.length} occurrences, YAML has ${matches.length}) — edit the YAML pane instead.` };
    }

    const leadingWhitespace = oldText.length - oldText.trimStart().length;
    const ordinal = valueMatches.findIndex( valueMatch => valueMatch.index === valueOffset + leadingWhitespace );
    if ( ordinal < 0 ) {
      return { error: `Could not locate the edited occurrence in ${message.dotKey} — edit the YAML pane instead.` };
    }
    match = matches[ ordinal ];
  }
  const updatedBlock = blockText.slice( 0, match.index ) + newText.trim() + blockText.slice( match.index + match[ 0 ].length );

  const updatedLines = [
    ...lines.slice( 0, message.yamlLineStart ),
    ...updatedBlock.split( '\n' ),
    ...lines.slice( message.yamlLineEnd + 1 )
  ];

  const editLine = message.yamlLineStart + blockText.slice( 0, match.index ).split( '\n' ).length - 1;
  return { yamlText: updatedLines.join( '\n' ), line: editLine };
}
