// Copyright 2025, University of Colorado Boulder

/* eslint-disable phet/default-export-class-should-register-namespace */

/**
 * A visitor that uses Fluent AST traversal and collects information about terms, messages, and junk.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import { Pattern } from '../../../sherpa/lib/fluent/fluent-bundle-0.18.0/src/ast.js';
import { Visitor } from '../../../sherpa/lib/fluent/fluent-syntax-0.19.0/src/visitor.js';

export default class FluentVisitor extends Visitor {
  public readonly usedTermNames = new Set<string>();
  public readonly usedTerms = new Set<Pattern>();
  public readonly foundJunk = new Set<string>();
  public readonly declaredTerms = new Set<string>();

  public readonly referencedMessages = new Set<string>();

  public override visitTerm( node: IntentionalAny ): void {
    this.declaredTerms.add( node );

    this.genericVisit( node );
  }

  /**
   * Visitor for messages that are referenced in another value. Collects
   * keys in an array for inspection.
   * For example,
   *
   *   name = Fred
   *   hello_pattern = Hello, { fred }
   *
   * Key "fred" will be added to referencedMessages.
   * @param node
   */
  public override visitMessageReference( node: IntentionalAny ): void {

    // Add the message name to the set of used messages
    this.referencedMessages.add( node.id.name );

    this.genericVisit( node );
  }

  // IntentionalAny because the node type could not be found in Fluent source.
  public override visitTermReference( node: IntentionalAny ): void {

    // Add the term name to the set of used terms
    this.usedTermNames.add( node.id.name );
    this.usedTerms.add( node );

    // Continue traversing the AST
    this.genericVisit( node );
  }

  // Nodes with syntax errors are called "junk" in Fluent and can be visited with this method.
  public override visitJunk( node: IntentionalAny ): void {

    this.foundJunk.add( node );

    this.genericVisit( node );
  }
}