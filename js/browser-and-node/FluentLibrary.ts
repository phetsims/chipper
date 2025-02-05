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
import { FluentParser } from '../../../sherpa/lib/fluent/fluent-syntax-0.19.0/src/parser.js';
import { Visitor } from '../../../sherpa/lib/fluent/fluent-syntax-0.19.0/src/visitor.js';

/**
 * A visitor that collects Nodes from the AST so we can inspect them for problems.
 */
class FluentVisitor extends Visitor {
  public readonly usedTerms = new Set<string>();
  public readonly foundJunk = new Set<string>();

  // IntentionalAny because the node type could not be found in Fluent source.
  public override visitTermReference( node: IntentionalAny ): void {

    // Add the term name to the set of used terms
    this.usedTerms.add( node.id.name );

    // Continue traversing the AST
    this.genericVisit( node );
  }

  // Nodes with syntax errors are called "junk" in Fluent and can be visited with this method.
  public override visitJunk( node: IntentionalAny ): void {

    this.foundJunk.add( node );

    this.genericVisit( node );
  }
}

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

    // Use the FluentVisitor to find all used terms.
    const collector = new FluentVisitor();
    collector.visit( resource );

    // Identify used terms that are not defined
    const undefinedTerms = Array.from( collector.usedTerms ).filter(
      term => !termKeys.includes( term )
    );

    if ( undefinedTerms.length > 0 ) {
      const undefinedTermsFormatted = undefinedTerms.join( ', ' );
      throw new Error( `These terms are not defined: [ ${undefinedTermsFormatted} ]` );
    }

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
export type { Pattern as FluentPattern };