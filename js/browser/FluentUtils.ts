// Copyright 2025, University of Colorado Boulder

/**
 * Utility functions for working with Fluent strings.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import { isTReadOnlyProperty, TReadOnlyProperty } from '../../../axon/js/TReadOnlyProperty.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import { FluentBundle, FluentBundlePattern } from '../browser-and-node/FluentLibrary.js';
import LocalizedMessageProperty from './LocalizedMessageProperty.js';

const FluentUtils = {

  /**
   * Changes a set of arguments for the message into a set of values that can easily be used to
   * format the message. Does things like get Property values and converts enumeration values to strings.
   */
  handleFluentArgs: ( args: IntentionalAny ): IntentionalAny => {
    return _.mapValues( args, value => {
      return isTReadOnlyProperty( value ) ? value.value : value;
    } );
  },

  /**
   * Directly format a fluent message. Usually, you should use a PatternMessageProperty instead so that
   * the string will update when the locale changes. This is useful when you do not want the overhead of
   * creating a new Property. For example, real-time alerts.
   */
  formatMessage: ( localizedMessageProperty: LocalizedMessageProperty, args: IntentionalAny ): string => {
    const newArgs = FluentUtils.handleFluentArgs( args );

    const errors: Error[] = [];

    const bundle = localizedMessageProperty.bundleProperty.value;
    assert && assert( bundle, 'Fluent bundle is not available.' );

    const messageValue = localizedMessageProperty.value;
    assert && assert( messageValue, 'Fluent message is undefined.' );

    const value = bundle.formatPattern( messageValue, newArgs, errors );
    assert && assert( errors.length === 0, `Fluent errors found when formatting message: ${errors}` );

    return value;
  },

  formatMessageWithBundle: ( message: FluentBundlePattern, bundle: FluentBundle, args: IntentionalAny ): string => {
    const newArgs = FluentUtils.handleFluentArgs( args );

    const errors: Error[] = [];

    const value = bundle.formatPattern( message, newArgs, errors );
    assert && assert( errors.length === 0, `Fluent errors found when formatting message: ${errors}` );

    return value;
  },

  /**
   * For our "simple" fluent messages with no arguments, they are essentially just
   * string properties, so we can treat them as such.
   */
  asStringProperty: ( localizedMessageProperty: LocalizedMessageProperty ): TReadOnlyProperty<string> => {
    assert && assert( typeof localizedMessageProperty.value === 'string' );

    return localizedMessageProperty as TReadOnlyProperty<string>;
  }
};

export default FluentUtils;