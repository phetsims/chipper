// Copyright 2022-2023, University of Colorado Boulder

/**
 * Sets up a system of Properties to handle translation fallback and phet-io support for a single translated string.
 *
 * @author Jonathan Olson <jonathan.olson>
 */

import DynamicProperty from '../../axon/js/DynamicProperty.js';
import TinyProperty from '../../axon/js/TinyProperty.js';
import TinyOverrideProperty from '../../axon/js/TinyOverrideProperty.js';
import localeProperty, { Locale } from '../../joist/js/i18n/localeProperty.js';
import localeOrderProperty from '../../joist/js/i18n/localeOrderProperty.js';
import Tandem from '../../tandem/js/Tandem.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import chipper from './chipper.js';
import TProperty from '../../axon/js/TProperty.js';
import { localizedStrings } from './getStringModule.js';
import arrayRemove from '../../phet-core/js/arrayRemove.js';
import TandemConstants, { PhetioID } from '../../tandem/js/TandemConstants.js';

// constants
const FALLBACK_LOCALE = 'en';

// for readability/docs
type TranslationString = string;
export type LocalizedStringStateDelta = Partial<Record<Locale, TranslationString>>;

// Where "string" is a phetioID
export type StringsStateStateObject = { data: Record<PhetioID, LocalizedStringStateDelta> };

class LocalizedString {

  // Public-facing IProperty<string>, used by string modules
  public readonly property: DynamicProperty<string, string, Locale>;

  // Holds our non-Override Property at the root of everything
  private readonly englishProperty: TinyProperty<TranslationString>;

  // Uses lazy creation of locales
  private readonly localePropertyMap = new Map<Locale, TinyOverrideProperty<TranslationString>>();

  private readonly localeOrderListener: ( locales: Locale[] ) => void;

  // Store initial values, so we can handle state deltas
  private readonly initialValues: LocalizedStringStateDelta = {};

  public constructor( englishValue: TranslationString, tandem: Tandem, metadata?: Record<string, unknown> ) {

    // Allow phetioReadOnly to be overridden
    const phetioReadOnly = ( metadata && typeof metadata.phetioReadOnly === 'boolean' ) ? metadata.phetioReadOnly :
                           TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioReadOnly;

    // All i18n model strings are phetioFeatured by default
    const phetioFeatured = ( metadata && typeof metadata.phetioFeatured === 'boolean' ) ? metadata.phetioFeatured : true;

    // Allow phetioDocumentation to be overridden
    const phetioDocumentation = ( metadata && typeof metadata.phetioDocumentation === 'string' ) ? metadata.phetioDocumentation :
                                TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioDocumentation;

    this.englishProperty = new TinyProperty( englishValue );
    this.initialValues[ FALLBACK_LOCALE ] = englishValue;

    this.localeOrderListener = this.onLocaleOrderChange.bind( this );
    localeOrderProperty.lazyLink( this.localeOrderListener );

    this.property = new DynamicProperty( localeProperty, {
      derive: ( locale: Locale ) => this.getLocaleSpecificProperty( locale ),
      bidirectional: true,
      phetioValueType: StringIO,
      phetioState: false,
      tandem: tandem,
      phetioFeatured: phetioFeatured,
      phetioReadOnly: phetioReadOnly,
      phetioDocumentation: phetioDocumentation
    } );

    // Add to a global list to support PhET-iO serialization and internal testing
    localizedStrings.push( this );
  }

  /**
   * Sets the initial value of a translated string (so that there will be no fallback for that locale/string combo)
   */
  public setInitialValue( locale: Locale, value: TranslationString ): void {
    this.initialValues[ locale ] = value;
    this.getLocaleSpecificProperty( locale ).value = value;
  }

  /**
   * Returns an object that shows the changes of strings from their initial values. This includes whether strings are
   * marked as "overridden"
   */
  public getStateDelta(): LocalizedStringStateDelta {
    const result: LocalizedStringStateDelta = {};

    this.usedLocales.forEach( locale => {
      const rawString = this.getRawStringValue( locale );
      if ( rawString !== null && rawString !== this.initialValues[ locale ] ) {
        result[ locale ] = rawString;
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
      const initialValue: string | null = this.initialValues[ locale ] !== undefined ? this.initialValues[ locale ]! : null;
      const stateValue: string | null = state[ locale ] !== undefined ? state[ locale ]! : null;

      // If not specified in the state
      if ( stateValue === null ) {

        // If we have no initial value, we'll want to set it to fall back
        if ( initialValue === null ) {
          ( localeSpecificProperty as TinyOverrideProperty<string> ).clearOverride();
        }
        else {
          localeSpecificProperty.value = initialValue;
        }
      }
      else {
        localeSpecificProperty.value = stateValue;
      }
    } );
  }

  /**
   * Returns the specific translation for a locale (no fallbacks), or null if that string is not translated in the
   * exact locale
   */
  private getRawStringValue( locale: Locale ): string | null {
    const property = this.getLocaleSpecificProperty( locale );
    if ( property instanceof TinyOverrideProperty ) {
      return property.isOverridden ? property.value : null;
    }
    else {
      // english
      return property.value;
    }
  }

  private get usedLocales(): Locale[] {
    // NOTE: order matters, we want the fallback to be first so that in onLocaleOrderChange we don't run into infinite
    // loops.
    return [ FALLBACK_LOCALE, ...this.localePropertyMap.keys() ];
  }

  private onLocaleOrderChange( localeOrder: Locale[] ): void {

    // Do this in reverse order to AVOID infinite loops.
    // For example, if localeOrder1=ar,es localeOrder2=es,ar) then we could run into the case temporarily where the
    // TinyOverrideProperty for ar has its target as es, and the TinyOverrideProperty for es has its target as ar.
    // This would then trigger an infinite loop if you try to read the value of either of them, as it would ping
    // back-and-forth.
    const locales: Locale[] = [
      ...this.usedLocales,

      // Yes, this duplicates some, but it should be a no-op and saves code length
      ...localeOrder
    ];
    for ( let i = locales.length - 1; i >= 0; i-- ) {
      const locale = locales[ i ];
      const localeProperty = this.getLocaleSpecificProperty( locale );
      if ( localeProperty instanceof TinyOverrideProperty ) {
        localeProperty.targetProperty = this.getLocaleSpecificProperty( LocalizedString.getFallbackLocale( locale ) );
      }
    }
  }

  /**
   * Returns the locale-specific Property for any locale (lazily creating it if necessary)
   */
  public getLocaleSpecificProperty( locale: Locale ): TProperty<string> {
    if ( locale === 'en' ) {
      return this.englishProperty;
    }

    // Lazy creation
    if ( !this.localePropertyMap.has( locale ) ) {
      this.localePropertyMap.set( locale, new TinyOverrideProperty( this.getLocaleSpecificProperty( LocalizedString.getFallbackLocale( locale ) ) ) );
    }

    return this.localePropertyMap.get( locale )!;
  }

  /**
   * What should be the next-most fallback locale for a given locale. Our global localeOrder is used, and otherwise it
   * defaults to our normal fallback mechanism.
   */
  public static getFallbackLocale( locale: Locale ): Locale {
    if ( locale === 'en' ) {
      return 'en'; // can be its own fallback
    }

    const localeOrder = localeOrderProperty.value;

    const index = localeOrder.indexOf( locale );
    if ( index >= 0 ) {
      assert && assert( localeOrder[ localeOrder.length - 1 ] === 'en' );
      assert && assert( index + 1 < localeOrder.length );
      return localeOrder[ index + 1 ];
    }
    else {
      // doesn't exist in those
      if ( locale.includes( '_' ) ) {
        return locale.slice( 0, 2 ) as Locale; // zh_CN => zh
      }
      else {
        return 'en';
      }
    }
  }

  public dispose(): void {
    localeOrderProperty.unlink( this.localeOrderListener );

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
}

chipper.register( 'LocalizedString', LocalizedString );

export default LocalizedString;
