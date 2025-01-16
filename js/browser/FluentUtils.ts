// Copyright 2024, University of Colorado Boulder

/**
 * Utility functions for working with Fluent strings.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import { isTReadOnlyProperty } from '../../../axon/js/TReadOnlyProperty.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import LocalizedMessageProperty from './LocalizedMessageProperty.js';

const FluentUtils = {

  /**
   * Converts a camelCase id to a message key. For example, 'choose-unit-for-current' becomes
   * 'chooseUnitForCurrentMessageProperty'.
   */
  fluentIdToMessageKey: ( id: string ): string => {
    return `${id.replace( /-([a-z])/g, ( match, letter ) => letter.toUpperCase() )}MessageProperty`;
  },

  /**
   * Changes a set of arguments for the message into a set of values that can easily be used to
   * format the message. Does things like get Property values and converts enumeration values to strings.
   */
  handleFluentArgs: ( args: IntentionalAny ): IntentionalAny => {
    const keys = Object.keys( args );

    const newArgs: Record<string, string> = {};

    keys.forEach( key => {
      let value = args[ key ];

      // If the value is a Property, get the value.
      if ( isTReadOnlyProperty( value ) ) {
        value = value.value;
      }

      // If the value is an EnumerationValue, automatically use the enum name.
      if ( value && value.name ) {
        value = value.name;
      }

      newArgs[ key ] = value;
    } );

    return newArgs;
  },

  /**
   * Directly format a fluent message. Usually, you should use a PatternMessageProperty instead so that
   * the string will update when the locale changes. This is useful when you do not want the overhead of
   * creating a new Property. For example, real-time alerts.
   */
  formatMessage: ( localizedMessageProperty: LocalizedMessageProperty, args: IntentionalAny ): string => {
    const newArgs = FluentUtils.handleFluentArgs( args );

    const errors: Error[] = [];

    // TODO - See https://github.com/phetsims/joist/issues/994
    const value = localizedMessageProperty.bundleProperty.value!.formatPattern( localizedMessageProperty.value!, newArgs, errors );
    assert && assert( errors.length === 0, `Fluent errors found when formatting message: ${errors}` );

    return value;
  }
};

export default FluentUtils;