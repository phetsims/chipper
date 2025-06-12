// Copyright 2025, University of Colorado Boulder

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
import { FluentBundle, FluentBundlePattern } from '../browser-and-node/FluentLibrary.js';
import chipper from './chipper.js';

export default class LocalizedMessageProperty extends DerivedProperty1<FluentBundlePattern, FluentBundle> {
  public constructor(
    public readonly bundleProperty: TReadOnlyProperty<FluentBundle>,
    derivation: ( bundle: FluentBundle ) => FluentBundlePattern
  ) {
    super( [ bundleProperty ], derivation );
  }
}

chipper.register( 'LocalizedMessageProperty', LocalizedMessageProperty );