// Copyright 2024, University of Colorado Boulder

/**
 * Constructs the modules needed to use Fluent.js messages in a PhET simulation. Fluent has the following concepts:
 *
 * - Bundle: A collection of messages for a single locale.
 * - Message: An data structure in a FluentBundle. The message can be formatted with arguments into a final string.
 *            If there are no arguments, the message is a string.
 *
 * This is used in the generated files from modulify.
 *
 * @author Jonathan Olson <jonathan.olson>
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import TReadOnlyProperty from '../../../axon/js/TReadOnlyProperty.js';
import localeProperty from '../../../joist/js/i18n/localeProperty.js';
import type { FluentNode } from '../../../perennial-alias/node_modules/@types/fluent/index.d.ts';
import LocalizedString from './LocalizedString.js';

// TODO: use Locale for this.
type Locale = string;

const getFluentModule = ( localeToFluentFileMap: Record<Locale, string> ): Record<string, TReadOnlyProperty<FluentNode[]>> => {
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
    bundle.addResource( resource );

    localeToBundleMap.set( locale, bundle );
  } );

  const messageKeys = Array.from( localeToBundleMap.get( 'en' )!.messages ).map( arr => {

    // @ts-expect-error TODO
    return arr[ 0 ];
  } );

  const messagePropertiesMap: Record<string, TReadOnlyProperty<FluentNode[]>> = {};

  messageKeys.forEach( key => {

    // The key is the fluent id, we need to wrap it in a MessageProperty suffix.
    const propertyKey = `${key}MessageProperty`;
    messagePropertiesMap[ propertyKey ] = new DerivedProperty( [ localeProperty ], locale => {
      const localeFallbacks = LocalizedString.getLocaleFallbacks( locale );

      for ( const fallbackLocale of localeFallbacks ) {
        const bundle = localeToBundleMap.get( fallbackLocale )!;

        if ( bundle.hasMessage( key ) ) {
          return bundle.getMessage( key );
        }
      }
    } );
  } );

  return messagePropertiesMap;
}

export default getFluentModule;