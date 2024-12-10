// Copyright 2024, University of Colorado Boulder

/**
 * Prototype: A Property whose value is a message from a Fluent bundle. A Fluent bundle is a collection of messages
 * for a single locale. When the locale changes, the bundle will change, and then the LocalizedMessageProperty will
 * compute a new value based on the language and arguments.
 *
 * See https://github.com/phetsims/joist/issues/992.
 *
 * This is for a proof of concept. By creating Properties, we get a good sense of what usages would be like in simulation
 * code. But it is a partial implementation. The full solution needs to consider PhET-iO control, and be more integrated
 * into PhET's string modules.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import { DerivedProperty1 } from '../../axon/js/DerivedProperty.js';
import localizedFluentBundleProperty, { englishBundle } from './localizedFluentBundleProperty.js';

export default class LocalizedMessageProperty extends DerivedProperty1<string, null> {

  /**
   * @param id - the id of the message in the fluent bundle
   */
  public constructor( id: string ) {

    // Just to get Property interface working, but this needs to be bi-directional
    // and use LocalizedString/LocalizedStringProperty stack.
    super( [ localizedFluentBundleProperty ], () => {

      // If the bundle does not have the message, fall back to english.
      return localizedFluentBundleProperty.value.getMessage( id ) || englishBundle.getMessage( id );
    } );
  }
}