// Copyright 2022-2026, University of Colorado Boulder

/**
 * Sets up a system of Properties to handle translation fallback and phet-io support for a single translated string.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import TinyProperty from '../../../axon/js/TinyProperty.js';
import TProperty from '../../../axon/js/TProperty.js';
import localeProperty, { Locale } from '../../../joist/js/i18n/localeProperty.js';
import arrayRemove from '../../../phet-core/js/arrayRemove.js';
import { PhetioID } from '../../../tandem/js/phet-io-types.js';
import Tandem from '../../../tandem/js/Tandem.js';
import chipper from './chipper.js';
import LocalizedStringProperty from './LocalizedStringProperty.js';
import localizedStrings from './localizedStrings.js';

// constants
const FALLBACK_LOCALE = 'en';

// for readability/docs
type TranslationString = string;
export type LocalizedStringStateDelta = Partial<Record<Locale, TranslationString>>;

// Where "string" is a phetioID
export type StringsStateStateObject = { data: Record<PhetioID, LocalizedStringStateDelta> };

/*
 * Typing for LocaleString.getNestedStringProperties.
 *
 * Notably below, we will have potentially different string keys filled in for
 * different locales.
 *
 * E.g. an example of an object matching the StringMap type is:
 *
 * const example = {
 *   en: {
 *     a: 'a',
 *     nest: {
 *       x: 'x',
 *       y: 'y'
 *     }
 *   },
 *   hi: {
 *     'a': 'ए',
 *     'b': 'ब',
 *     nest: {
 *       x: 'एक्स',
 *     }
 *   }
 * }
 *
 * We want to first find all of the "string keys", e.g.:
 *
 * - a
 * - b
 * - nest.x
 * - nest.y
 *
 * The resulting structure, e.g. ToStringPropertyMap<typeof example> would be:
 *
 * {
 *   aStringProperty: LocalizedStringProperty,
 *   bStringProperty: LocalizedStringProperty,
 *   nest: {
 *     xStringProperty: LocalizedStringProperty,
 *     yStringProperty: LocalizedStringProperty
 *   }
 * }
 *
 * Where the suffix 'StringProperty' is added onto ONLY the leaves.
 *
 * Some languages may not have a full translation, so we take the union of all
 * defined string keys.
 *
 * We are not assuming English will be translated (we patch it in for our
 * fallback structure, but SceneryStack devs might want to skip English, or
 * its translation may be delayed).
 */

// A nested structure with strings as leaves.
export type StringMapEntry = string | { [ key: string ]: StringMapEntry };

// Has a nested structure (with strings as leaves) for locales.
export type StringMap = Partial<Record<Locale, StringMapEntry>>;

// Given a StringMap and a key, returns a new type with the
// same "locale" structure, but where each locale-specific "string map" is replaced
// with the value at the given key. This essentially "drills down" into multiple
// structures at once.
// For example, if we have
//   { en: { a: { x: 'x' }, b: 'b' }, hi: { a: { x: 'ए' }, es: { b: 'b', z: 'z' } },
// Then WithKey<..., 'a'> would be
//   { en: { x: 'x' }, hi: { x: 'ए' }, es: never }
type WithKey<T extends StringMap, Key extends string | number | symbol> = {
  [ Locale in keyof T ]: T[ Locale ] extends Record<Key, StringMapEntry>
                         ? T[ Locale ][ Key ]
                         : never;
};

// Converts a StringMap to a map from locale => top-level keys.
// For example, if we have
//   { en: { a: { x: 'x' }, b: 'b' }, hi: { a: { x: 'ए' }, es: { b: 'b', z: 'z' } },
// Then ToKeys<...> would be
//   { en: 'a' | 'b', hi: 'a', es: 'b' | 'z' }
type ToKeys<T extends StringMap> = {
  [ Locale in keyof T ]: keyof T[ Locale ];
};

// Converts a StringMap to a union of all possible (even partially-declared) keys.
// For example, if we have
//   { en: { a: { x: 'x' }, b: 'b' }, hi: { a: { x: 'ए' }, es: { b: 'b', z: 'z' } },
// Then GetKeys<...> would be
//   'a' | 'b' | 'z'
type GetKeys<T extends StringMap> = ToKeys<T>[ keyof ToKeys<T> ];

// TypeScript can't ensure that things will be strings. This is a helper type
// cast to append 'StringProperty', AND effectively convert it to a string type
type StringPropertyName<T> = T extends string ? `${T}StringProperty` : 'foundNotAString';

// This is a type-level lookup up the type of a key in a StringMap, but effectively
// union-typing this ACROSS all present locales.
// For example, if we have
//   { en: { a: { x: 'x' }, b: 'b' }, hi: { a: { x: 'ए' }, es: { b: 'b', z: 'z' } },
// Then KeyValue<..., 'b'> would be 'string', and KeyValue<..., 'a'> would be an
// object type (or in some other cases, unions of objects).
type KeyValue<T extends StringMap, Key extends string | number | symbol> =
  WithKey<T, Key>[ keyof WithKey<T, Key> ];

// As described above, the main implementation of typing.
//
// This computes the map recursively, using WithKey to "drill down" into the
// next level. We use recursion to handle nested structures.
//
// The code:
//   [ KeyValue<T, Key> ] extends [ string ]
// ensures that we do NOT do distributive mapped type checks, and ensures that
// the (currently) top-level key is always either a string or missing (e.g. never).
type ToStringPropertyMap<T extends StringMap> = {
  // We use the 'as' to rename the keys (leaf keys get the 'StringProperty' suffix)
  [ Key in GetKeys<T> as ( [ KeyValue<T, Key> ] extends [ string ] ? StringPropertyName<Key> : Key ) ]:
    [ KeyValue<T, Key> ] extends [ string ]
      ? LocalizedStringProperty
      : ToStringPropertyMap<WithKey<T, Key>>;
};

const localeData = phet.chipper.localeData;
assert && assert( localeData, 'localeData expected but global has not been set' );

class LocalizedString {

  // Public-facing IProperty<string>, used by string modules
  public readonly property: LocalizedStringProperty;

  // Uses lazy creation of locales
  private readonly localePropertyMap = new Map<Locale, TinyProperty<TranslationString>>();

  // Store initial values, so we can handle state deltas
  private readonly initialValues: LocalizedStringStateDelta = {};

  public constructor(
    public readonly stringKey: string,
    // Store initial values, so we can handle state deltas
    private readonly localeToTranslationMap: LocalizedStringStateDelta,
    tandem: Tandem,
    metadata?: Record<string, unknown>
  ) {
    this.property = new LocalizedStringProperty( this, tandem, metadata );

    // Add to a global list to support PhET-iO serialization and internal testing
    localizedStrings.push( this );
  }

  /**
   * Returns an object that shows the changes of strings from their initial values. This includes whether strings are
   * marked as "overridden"
   */
  public getStateDelta(): LocalizedStringStateDelta {
    const result: LocalizedStringStateDelta = {};

    this.usedLocales.forEach( locale => {
      const initialValue: string = this.initialValues[ locale ]!;
      const currentValue = this.getLocaleSpecificProperty( locale ).value;

      if ( currentValue !== initialValue ) {
        result[ locale ] = currentValue;
      }
    } );

    return result;
  }

  /**
   * Take a state from getStateDelta, and apply it.
   */
  public setStateDelta( state: LocalizedStringStateDelta ): void {

    // Create potential new locales (since locale-specific Properties are lazily created as needed
    Object.keys( state ).forEach( locale => this.getLocaleSpecificProperty( locale as Locale ) );

    this.usedLocales.forEach( locale => {
      const localeSpecificProperty = this.getLocaleSpecificProperty( locale );
      const initialValue: string = this.initialValues[ locale ]!;
      assert && assert( initialValue !== undefined );

      const stateValue: string | null = state[ locale ] !== undefined ? state[ locale ] : null;

      localeSpecificProperty.value = stateValue ?? initialValue;
    } );
  }

  private get usedLocales(): Locale[] {
    return [ ...this.localePropertyMap.keys() ];
  }

  /**
   * Returns the locale-specific Property for any locale (lazily creating it if necessary)
   */
  public getLocaleSpecificProperty( locale: Locale ): TProperty<string> {
    // Lazy creation
    if ( !this.localePropertyMap.has( locale ) ) {
      // Locales in order of fallback
      const orderedLocales = LocalizedString.getLocaleFallbacks( locale );

      // Find the first-defined value
      let initialValue: string | null = null;
      for ( const locale of orderedLocales ) {
        if ( this.localeToTranslationMap[ locale ] !== undefined ) {
          initialValue = this.localeToTranslationMap[ locale ]!;
          break;
        }
      }
      // Should be guaranteed because of `en` as a fallback
      assert && assert( initialValue !== undefined, 'no initial value found for', locale );

      this.initialValues[ locale ] = initialValue!;
      this.localePropertyMap.set( locale, new TinyProperty( initialValue! ) );
    }

    return this.localePropertyMap.get( locale )!;
  }

  public dispose(): void {
    this.property.dispose();
    arrayRemove( localizedStrings, this );
  }

  /**
   * Reset to the initial value for the specified locale, used for testing.
   */
  public restoreInitialValue( locale: Locale ): void {
    assert && assert( typeof this.initialValues[ locale ] === 'string', 'initial value expected for', locale );
    this.property.value = this.initialValues[ locale ]!;
  }

  public static getLocaleFallbacks( locale: Locale = localeProperty.value ): Locale[] {
    return _.uniq( [
      locale,
      ...( localeData[ locale ].fallbackLocales || [] ),
      FALLBACK_LOCALE
    ] );
  }

  /**
   * Computes a nested map of LocalizedStringProperties from a nested input structure of strings.
   * The string Properties will change values based on the current locale
   * (stored in localeProperty).
   *
   * For instance, if we have an example StringMap:
   *
   * const stringMap = {
   *   en: {
   *     a: 'a',
   *     nest: {
   *       x: 'x',
   *       y: 'y'
   *     }
   *   },
   *   hi: {
   *     'a': 'ए',
   *     'b': 'ब',
   *     nest: {
   *       x: 'एक्स',
   *     }
   *   }
   * }
   *
   * Then the resulting LocalizedString.getNestedStringProperties( stringMap ) would
   * have the structure:
   *
   * {
   *   aStringProperty: LocalizedStringProperty,
   *   bStringProperty: LocalizedStringProperty,
   *   nest: {
   *     xStringProperty: LocalizedStringProperty,
   *     yStringProperty: LocalizedStringProperty
   *   }
   * }
   *
   * It is recommended to put each translation file into a separate JSON file,
   * and import them into a single file that will be passed to this function.
   *
   * @param stringData
   */
  public static getNestedStringProperties<StringData extends StringMap>( stringData: StringData ): ToStringPropertyMap<StringData> {
    const locales = Object.keys( stringData ) as Locale[];

    // We will stuff data into here.
    const result: ToStringPropertyMap<StringData> = {} as ToStringPropertyMap<StringData>;

    // Given an array of keys (e.g. [ 'a', 'b', 'c' ]), look up the value in the stringData.
    // E.g. stringData[ locale ].a?.b?.c
    const lookupWithLocale = ( keys: string[], locale: Locale ): unknown | undefined => {
      let object: unknown | undefined = stringData[ locale ];

      for ( const key of keys ) {
        if ( object ) {
          // @ts-expect-error
          object = object[ key ];
        }
      }

      return object;
    };

    // Recursively construct the map, appending more keys as we go.
    const recur = ( keys: string[] ) => {
      // All potential keys of the next level.
      // Some will be for strings, some will be for nested objects.
      const potentialKeys = _.sortBy( _.uniq( locales.map( locale => {
        const object = lookupWithLocale( keys, locale );

        return object ? Object.keys( object ) : [];
      } ).flat() ) );

      for ( const key of potentialKeys ) {
        const nextKeys = [ ...keys, key ];

        // Is the key for a string (and if so, what locales is it defined for?)
        let isString = true;
        const stringLocales: Locale[] = [];

        for ( const locale of locales ) {
          const object: Record<string, string | unknown> | undefined = lookupWithLocale( keys, locale ) as Record<string, string | unknown> | undefined;

          if ( object ) {
            const value = object[ key ];

            if ( typeof value === 'string' ) {
              stringLocales.push( locale );
            }
            else {
              isString = false;
            }
          }
        }

        if ( isString ) {
          assert && assert( stringLocales.length > 0 );

          // Build the map with string values
          const map: Partial<Record<Locale, string>> = {};
          for ( const locale of stringLocales ) {
            map[ locale ] = lookupWithLocale( nextKeys, locale ) as string;
          }

          // If there is no "fallback" entry, put it in as a fallback manually
          // (so we will always have a string)
          if ( !stringLocales.includes( FALLBACK_LOCALE ) ) {
            map[ FALLBACK_LOCALE ] = map[ stringLocales[ 0 ] ];
          }

          const stringProperty = new LocalizedStringProperty(
            new LocalizedString( nextKeys.join( '.' ), map, Tandem.OPT_OUT ),
            Tandem.OPT_OUT
          );

          _.set( result, [ ...keys, `${key}StringProperty` ], stringProperty );
        }
        else {
          recur( nextKeys );
        }
      }
    };
    recur( [] );

    return result;
  }
}

chipper.register( 'LocalizedString', LocalizedString );

export default LocalizedString;