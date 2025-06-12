// Copyright 2025, University of Colorado Boulder

/* eslint-disable phet/default-export-class-should-register-namespace */

/**
 * An entry point for the Fluent library. In the browser-and-node directory, it lets Fluent be used by
 * both simulation code and during the grunt modulify process. Follow tsconfig-dependencies.json to see
 * how Fluent code is referenced for typescript. See the README in the sherpa/lib/fluent directory
 * for more information on how Fluent is set up for PhET simulations.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import { Pattern } from '../../../sherpa/lib/fluent/fluent-bundle-0.18.0/src/ast.js';
import { FluentBundle } from '../../../sherpa/lib/fluent/fluent-bundle-0.18.0/src/bundle.js';
import { FluentResource } from '../../../sherpa/lib/fluent/fluent-bundle-0.18.0/src/resource.js';
import { Message } from '../../../sherpa/lib/fluent/fluent-syntax-0.19.0/src/ast.js';
import { FluentParser } from '../../../sherpa/lib/fluent/fluent-syntax-0.19.0/src/parser.js';
import { Entry } from '../../../sherpa/lib/fluent/fluent-syntax-0.19.0/src/ast.js';
import { Pattern as SyntaxPattern } from '../../../sherpa/lib/fluent/fluent-syntax-0.19.0/src/ast.js';
import { Resource } from '../../../sherpa/lib/fluent/fluent-syntax-0.19.0/src/ast.js';
import FluentVisitor from './FluentVisitor.js';

class FluentLibrary {

  /**
   * Gets all message keys (excluding terms) from a Fluent file string. This exists in
   * FluentLiberary (instead of FluentUtils) because it needs to be used outside of simulation
   * code.
   */
  public static getFluentMessageKeys( fluentFileString: string ): string[] {
    const parser = new FluentParser();
    const resource = parser.parse( fluentFileString );

    const keys = resource.body
      .filter( entry => entry.type === 'Message' )
      .map( entry => entry.id.name );

    return keys;
  }

  /**
   * Verify syntax in the fluent file. Right now it checks for:
   *   - Message keys should use camelCase instead of dashes.
   *   - All terms used in the file should be defined.
   *   - All selectors must have a default case.
   *   - Terms are not allowed to use placeables because terms used in placeables cannot take forwarded variables.
   *      - This is PhET specific and was added because it an easy programming mistake to assume that terms with
   *      placeables can be used like messages. This can be relaxed if needed in the future.
   */
  public static verifyFluentFile( fluentFileString: string ): void {
    const parser = new FluentParser();
    const resource = parser.parse( fluentFileString );

    // Collect all message keys. None of them should contain dashes.
    const messages = FluentLibrary.getFluentMessageKeys( fluentFileString );
    const messagesWithDashes = messages.filter( key => key.includes( '-' ) );
    if ( messagesWithDashes.length > 0 ) {
      const messagesWithDashesFormatted = messagesWithDashes.join( ', ' );
      throw new Error( `Message keys should not contain dashes: [ ${messagesWithDashesFormatted} ]` );
    }

    // Collect all defined term keys from the AST.
    const termKeys = resource.body
      .filter( entry => entry.type === 'Term' )
      .map( entry => entry.id.name );

    const collector = new FluentVisitor();
    collector.visit( resource );

    // Identify used terms that are not defined
    const undefinedTerms = Array.from( collector.usedTermNames ).filter(
      term => !termKeys.includes( term )
    );

    if ( undefinedTerms.length > 0 ) {
      const undefinedTermsFormatted = undefinedTerms.join( ', ' );
      throw new Error( `These terms are not defined: [ ${undefinedTermsFormatted} ]` );
    }

    // In the PhET project, terms with placeables are prohibited since they can't accept forwarded variables.
    // Fluent allows this for translation flexibility (see: https://projectfluent.org/fluent/guide/terms.html),
    // but it can be misleading, causing developers to treat terms like messages. We enforce this check to prevent errors.
    Array.from( collector.declaredTerms ).forEach( ( term: IntentionalAny ) => {
      if ( term && term.value &&
           term.value.elements &&
           term.value.elements.some( ( element: IntentionalAny ) => element.type === 'Placeable' ) ) {
        throw new Error( `Terms with placeables are not allowed: -${term.id.name}. Use a Message instead.` );
      }
    } );

    // Other problems found by the collector.
    collector.foundJunk.forEach( ( junk: IntentionalAny ) => {

      const messages = junk.annotations.map( ( annotation: IntentionalAny ) => annotation.message ).join( '\n' );

      const errorReport = `Junk found in fluent file:
      
${messages}
${junk.content}
`;

      throw new Error( errorReport );
    } );
  }
}

export default FluentLibrary;
export { FluentBundle, FluentResource };
export type { Pattern as FluentBundlePattern }; // Exported as FluentBundlePattern because there is already a Pattern and FluentPattern in SceneryStack
export type { Message };
export { FluentParser };
export type { Entry as ASTEntry };
export { SyntaxPattern as FluentSyntaxPattern };
export { Resource as FluentSyntaxResource };