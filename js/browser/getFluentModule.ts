// Copyright 2024, University of Colorado Boulder

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
import LocalizedMessageProperty from './LocalizedMessageProperty.js';
import LocalizedString from './LocalizedString.js';

// TODO: use Locale for this.
type Locale = string;

const getFluentModule = ( localeToFluentFileMap: Record<Locale, string> ): Record<string, LocalizedMessageProperty> => {
  const locales = Object.keys( localeToFluentFileMap );
  const localeToBundleMap = new Map<Locale, Fluent.FluentBundle>();

  locales.forEach( locale => {

    // TODO: Map PhET locales to Fluent locales
    // - Check out babel/localeData.json "locale3" entries
    // - Check out hebrew for phet specific locales
    // - Figure out what locales Fluent is using. We can use that to determine best fallbacks.
    const bundle = new Fluent.FluentBundle( locale );

    const localeFile = localeToFluentFileMap[ locale ];

    const resource = Fluent.FluentResource.fromString( localeFile );

    // This does not catch syntax errors unfortunately, Fluent skips over messages with syntax errors.
    // See https://github.com/projectfluent/fluent.js/blob/2f675def5b19ad34ff2d4d89c7d1269e5b352e9e/fluent/src/resource.js#L81C1-L83C20
    const errors = bundle.addResource( resource );
    assert && assert( errors.length === 0, `Errors when adding resource for locale: ${locale}` );

    localeToBundleMap.set( locale, bundle );
  } );

  const messageKeys = Array.from( localeToBundleMap.get( 'en' )!.messages ).map( arr => {

    // @ts-expect-error TODO
    return arr[ 0 ];
  } );

  const messagePropertiesMap: Record<string, LocalizedMessageProperty> = {};

  messageKeys.forEach( key => {

    // Create the bundle Property for a locale and key. Uses locale fallbacks until
    // a bundle with the message key is found.
    const bundleProperty = new DerivedProperty( [ localeProperty ], locale => {
      const localeFallbacks = LocalizedString.getLocaleFallbacks( locale );

      for ( const fallbackLocale of localeFallbacks ) {
        const bundle = localeToBundleMap.get( fallbackLocale )!;

        if ( bundle.hasMessage( key ) ) {
          return bundle;
        }
      }
      assert && assert( false, `Could not find bundle for key: ${key}.` );

      return null;
    } );

    const localizedMessageProperty = new LocalizedMessageProperty( bundleProperty, bundle => {
      if ( bundle && bundle.hasMessage( key ) ) {
        return bundle.getMessage( key );
      }
      assert && assert( false, `Could not find message for: ${key}.` );
      return null;
    } );

    const propertyKey = `${key}MessageProperty`;
    messagePropertiesMap[ propertyKey ] = localizedMessageProperty;
  } );

  return messagePropertiesMap;
};

export default getFluentModule;