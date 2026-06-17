// Copyright 2026, University of Colorado Boulder

/**
 * Builds the provenance document consumed by the Description Editor wrapper: for each a11y Fluent message, the editor
 * needs the message's default-variant rendering broken into provenance-tagged segments (so an edited phrase can be
 * mapped back to its YAML source) plus the message's YAML line range. Unlike the former full-description pipeline,
 * this does not enumerate or fold the full variant cross-product — one default render per message is sufficient for
 * in-place editing, and the server's applyStaticEdit re-locates the phrase against the whole YAML block (covering
 * every variant branch).
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { FluentBundle, FluentResource } from '../../js/browser-and-node/FluentLibrary.js';
import { getFluentParamsFromIndex, ParamInfo, parseFluentToMap } from '../../js/grunt/modulify/getFluentParams.js';
import { YamlMessage, loadYamlMessages } from './loadYamlMessages.js';
import { ProvenanceSegment, renderCombo, segmentsToText, selfCheckMessage } from './renderWithProvenance.js';

export type DescriptionMessage = YamlMessage & {

  // Default-variant rendering, broken into provenance-tagged segments (concatenation reproduces the rendered text)
  segments: ProvenanceSegment[];
};

export type DescriptionDocument = {
  repo: string;
  warnings: string[];
  selfCheckErrors: string[];

  // Flat list of a11y messages in YAML order
  messages: DescriptionMessage[];
};

/**
 * Builds one representative argument record for self-checking by picking either the first or last value of each
 * parameter: a select variable's first/last declared variant, or a symbolic placeholder for a free variable. Providing
 * a value for every variable (including select selectors) keeps the real FluentBundle from logging "unknown variable"
 * while still exercising a concrete branch, and the mini-resolver receives the same values so their outputs can be
 * compared.
 *
 * @param paramInfos - parameters of the message, from getFluentParamsFromIndex
 * @param pick - 'first' or 'last' variant to select for each parameter
 */
function selfCheckArgs( paramInfos: ParamInfo[], pick: 'first' | 'last' ): Record<string, string> {
  const args: Record<string, string> = {};
  for ( const info of paramInfos ) {
    if ( info.variants && info.variants.length > 0 ) {
      const variant = info.variants[ pick === 'last' ? info.variants.length - 1 : 0 ];
      args[ info.name ] = typeof variant === 'object' ? variant.value : String( variant );
    }
    else {
      args[ info.name ] = `〈${info.name}〉`;
    }
  }
  return args;
}

/**
 * Builds the provenance document model from YAML text. Per-message render/self-check failures are captured as warnings
 * or selfCheckErrors rather than thrown, so one malformed message does not break the whole document.
 *
 * @param repo - the sim repo name, e.g. 'quantum-wave-interference'
 * @param yamlText - raw contents of the strings YAML file
 * @returns the document model
 */
export function buildDescriptionDocument( repo: string, yamlText: string ): DescriptionDocument {
  const model = loadYamlMessages( yamlText );
  const entryIndex = parseFluentToMap( model.ftlContent );

  const bundle = new FluentBundle( 'en', { useIsolating: false } );
  const resourceErrors = bundle.addResource( new FluentResource( model.ftlContent ) );
  const warnings = [ ...model.warnings, ...resourceErrors.map( error => `FluentBundle: ${error.message}` ) ];

  const selfCheckErrors: string[] = [];

  const messages: DescriptionMessage[] = model.messages.map( message => {
    let segments: ProvenanceSegment[] = [];

    try {

      // Empty args render each SelectExpression's default variant; free variables render as 〈name〉 placeholders.
      // This default rendering is what the editor maps edited phrases back to.
      segments = renderCombo( entryIndex, message.fluentId, {}, model.ftlContent );

      // Verify the mini-resolver agrees with the real FluentBundle on the first and last variant of each parameter,
      // guarding against divergence without enumerating the full cross-product.
      const paramInfos = getFluentParamsFromIndex( entryIndex, message.fluentId );
      const checkError = selfCheckMessage( entryIndex, bundle, message.fluentId, [
        selfCheckArgs( paramInfos, 'first' ),
        selfCheckArgs( paramInfos, 'last' )
      ] );
      if ( checkError ) {
        selfCheckErrors.push( checkError );
      }
    }
    catch( error ) {
      warnings.push( `${message.dotKey}: ${error instanceof Error ? error.message : String( error )}` );
    }

    return {
      keyPath: message.keyPath,
      dotKey: message.dotKey,
      fluentId: message.fluentId,
      value: message.value,
      yamlLineStart: message.yamlLineStart,
      yamlLineEnd: message.yamlLineEnd,
      segments: segments
    };
  } );

  return {
    repo: repo,
    warnings: warnings,
    selfCheckErrors: selfCheckErrors,
    messages: messages
  };
}

/**
 * Concatenates a message's segments into its rendered default-variant text. Used to detect which messages changed
 * between rebuilds.
 */
export function messageText( message: DescriptionMessage ): string {
  return segmentsToText( message.segments );
}
