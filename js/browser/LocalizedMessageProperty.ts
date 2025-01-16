// Copyright 2024, University of Colorado Boulder

/**
 * A Property for the Fluent module that will recompute the value when the FluentBundle
 * changes. The fluent bundle is dependent on the locale, so this Property will also
 * recompute when the locale changes.
 *
 * A reference to the bundle is available so that it can be used to format the message with arguments.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import { DerivedProperty1 } from '../../../axon/js/DerivedProperty.js';
import TReadOnlyProperty from '../../../axon/js/TReadOnlyProperty.js';
import { Pattern } from '../../../sherpa/lib/fluent-bundle/src/ast.js';
import { FluentBundle } from '../../../sherpa/lib/fluent-bundle/src/bundle.js';
import chipper from './chipper.js';

export default class LocalizedMessageProperty extends DerivedProperty1<Pattern | null, FluentBundle | null> {
  public readonly bundleProperty: TReadOnlyProperty<FluentBundle | null>;

  public constructor( bundleProperty: TReadOnlyProperty<FluentBundle | null>, derivation: ( bundle: FluentBundle | null ) => Pattern | null ) {
    super( [ bundleProperty ], derivation );
    this.bundleProperty = bundleProperty;
  }
}

chipper.register( 'LocalizedMessageProperty', LocalizedMessageProperty );