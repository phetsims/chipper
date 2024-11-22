// Copyright 2024, University of Colorado Boulder

/**
 * Utility functions for working with Fluent strings.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import { isTReadOnlyProperty } from '../../axon/js/TReadOnlyProperty.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import localizedFluentBundleProperty from './localizedFluentBundleProperty.js';
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

  /**h
   * Directly format a fluent message. Most of the time, you should use a PatternMessageProperty instead.
   * This should only be used when the string does not need to be changed when the locale changes. Real-time
   * alerts are a good exaple.
   */
  formatMessage: ( localizedMessageProperty: LocalizedMessageProperty, args: IntentionalAny ): string => {
    const newArgs = FluentUtils.handleFluentArgs( args );
    return localizedFluentBundleProperty.value.format( localizedMessageProperty.value, newArgs );
  }
};

export default FluentUtils;