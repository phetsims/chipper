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
import type { FluentNode } from '../../../perennial-alias/node_modules/@types/fluent/index.d.ts';
import chipper from './chipper.js';

// TODO: Use actual typing or locales.
type Locale = string;

export default class LocalizedMessageProperty extends DerivedProperty1<FluentNode[] | null, Locale> {
  public readonly bundleProperty: TReadOnlyProperty<Fluent.FluentBundle>;

  public constructor( bundleProperty: TReadOnlyProperty<Fluent.FluentBundle>, derivation: ( bundle: Fluent.FluentBundle ) => FluentNode[] ) {
    super( [ bundleProperty ], derivation );
    this.bundleProperty = bundleProperty;
  }
}

chipper.register( 'LocalizedMessageProperty', LocalizedMessageProperty );