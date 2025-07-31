// Copyright 2025, University of Colorado Boulder

/**
 * Constructs the modules needed to use Fluent.js messages in a PhET simulation. Fluent has the following concepts:
 *
 * - Bundle: A collection of messages for a single locale.
 * - Message: An data structure in a FluentBundle. The message can be formatted with arguments into a final string.
 *            If there are no arguments, the message is a string.
 *
 * This is used in generated files from modulify.
 *
 * @author Jonathan Olson <jonathan.olson>
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import localeProperty from '../../../joist/js/i18n/localeProperty.js';
import FluentLibrary, { FluentBundle, FluentResource } from '../browser-and-node/FluentLibrary.js';
import LocalizedMessageProperty from './LocalizedMessageProperty.js';
import LocalizedString from './LocalizedString.js';

// This can be any locale supported by PhET. PhET uses custom and non-standard locales. There
// is no type for it at this time. See babel README for more information.
type Locale = string;

const getFluentModule = ( localeToFluentFileMap: Record<Locale, string> ): Record<string, LocalizedMessageProperty> => {
  const locales = Object.keys( localeToFluentFileMap );
  const localeToBundleMap = new Map<Locale, FluentBundle>();

  locales.forEach( locale => {
    const bundle = new FluentBundle( locale );
    const localeFile = localeToFluentFileMap[ locale ];

    // If assertions are enabled, error out if the file is not valid Fluent syntax (or has keys with dashes)
    assert && FluentLibrary.verifyFluentFile( localeFile );

    const resource = new FluentResource( localeFile );

    // This does not catch syntax errors unfortunately, Fluent skips over messages with syntax errors.
    // See https://github.com/projectfluent/fluent.js/blob/2f675def5b19ad34ff2d4d89c7d1269e5b352e9e/fluent/src/resource.js#L81C1-L83C20
    const errors = bundle.addResource( resource );
    assert && assert( errors.length === 0, `Errors when adding resource for locale: ${locale}` );

    localeToBundleMap.set( locale, bundle );
  } );

  const englishMessageKeys = FluentLibrary.getFluentMessageKeys( localeToFluentFileMap.en );

  const messagePropertiesMap: Record<string, LocalizedMessageProperty> = {};

  englishMessageKeys.forEach( key => {

    // Create the bundle Property for a locale and key. Uses locale fallbacks until
    // a bundle with the message key is found.
    const bundleProperty = new DerivedProperty( [ localeProperty ], locale => {
      const localeFallbacks = LocalizedString.getLocaleFallbacks( locale );

      for ( const fallbackLocale of localeFallbacks ) {
        const bundle = localeToBundleMap.get( fallbackLocale )!;

        if ( bundle && bundle.hasMessage( key ) ) {
          return bundle;
        }
      }

      throw new Error( `Could not find bundle for key: ${key}.` );
    }, { disableListenerLimit: true } );

    const localizedMessageProperty = new LocalizedMessageProperty( bundleProperty, bundle => {
      if ( bundle.hasMessage( key ) ) {
        const value = bundle.getMessage( key )!.value;
        assert && assert( value !== null );

        return value!;
      }
      else {
        throw new Error( `Could not find message for: ${key}.` );
      }
    } );

    const propertyKey = `${key}MessageProperty`;
    messagePropertiesMap[ propertyKey ] = localizedMessageProperty;
  } );

  return messagePropertiesMap;
};

export default getFluentModule;