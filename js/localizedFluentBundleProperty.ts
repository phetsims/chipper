// Copyright 2024, University of Colorado Boulder

/**
 * Prototype for a Property that provides a FluentBundle for the current locale.
 * Used by LocalizedMessageProperty to get the correct Fluent message for the current locale.
 *
 * Fluent has the following concepts:
 * - Bundle: A collection of messages for a single locale.
 * - Message: An data structure in a FluentBundle. The message can be formatted with arguments into a final string.
 *            If there are no arguments, the message is a string.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import DerivedProperty from '../../axon/js/DerivedProperty.js';
import localeProperty from '../../joist/js/i18n/localeProperty.js';

const bundleMap = new Map();

// @ts-expect-error - Why isn't Fluent available here? It was availabel in ohms-law. I expected
// it to be available because the types are included in perennial's package.json.
const FluentRef = Fluent;

// Create the Fluent bundles for each locale, and save them to the map for use.
localeProperty.availableRuntimeLocales.forEach( locale => {

  // If strings are available for the locale, create a bundle. Graceful fallbacks
  // happen in the Properties below.
  if ( phet.chipper.fluentStrings[ locale ] ) {
    const bundle = new FluentRef.FluentBundle( locale );
    const resource = FluentRef.FluentResource.fromString( phet.chipper.fluentStrings[ locale ] );
    bundle.addResource( resource );

    bundleMap.set( locale, bundle );
  }
} );

// Get the english fallback bundle.
const englishBundle = bundleMap.get( 'en' );
if ( !englishBundle ) {
  throw new Error( 'English bundle is required' );
}

// The bundle for the selected locale. Fall back to english if the bundle isn't available.
const localizedBundleProperty = new DerivedProperty( [ localeProperty ], locale => {
  return bundleMap.has( locale ) ? bundleMap.get( locale ) : englishBundle;
} );

export default localizedBundleProperty;
export { englishBundle };