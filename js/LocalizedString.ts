// Copyright 2022, University of Colorado Boulder

/**
 * Sets up a system of Properties to handle translation fallback and phet-io support for a single translated string.
 *
 * @author Jonathan Olson <jonathan.olson>
 */

import DynamicProperty from '../../axon/js/DynamicProperty.js';
import TinyProperty from '../../axon/js/TinyProperty.js';
import TinyOverrideProperty from '../../axon/js/TinyOverrideProperty.js';
import localeProperty from '../../joist/js/i18n/localeProperty.js';
import localeOrderProperty from '../../joist/js/i18n/localeOrderProperty.js';
import Tandem from '../../tandem/js/Tandem.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import chipper from './chipper.js';
import TProperty from '../../axon/js/TProperty.js';
import { localizedStrings } from './getStringModule.js';
import arrayRemove from '../../phet-core/js/arrayRemove.js';
import TandemConstants from '../../tandem/js/TandemConstants.js';

// Leave a reference, so we don't drop it from phet-io, see https://github.com/phetsims/joist/issues/963
import '../../joist/js/i18n/fallbackLocalesProperty.js';

// constants
const FALLBACK_LOCALE = 'en';

// for readability/docs
type LocaleString = string; // COULD type based on `keyof typeof localeInfoModule`
type TranslationString = string;
export type LocalizedStringStateDelta = Record<LocaleString, TranslationString>;

const localeData = phet.chipper.localeData;
assert && assert( localeData );

class LocalizedString {

  // Public-facing IProperty<string>, used by string modules
  public readonly property: DynamicProperty<string, string, string>;

  // Uses lazy creation of locales
  private readonly localePropertyMap = new Map<string, TinyProperty<TranslationString>>();

  // Store initial values, so we can handle state deltas
  private readonly initialValues: Record<LocaleString, TranslationString> = {};

  public constructor(
    englishValue: TranslationString,

    // Store initial values, so we can handle state deltas
    private readonly localeToTranslationMap: LocalizedStringStateDelta,
    tandem: Tandem,
    metadata?: Record<string, unknown>
  ) {

    // Allow phetioReadOnly to be overridden
    const phetioReadOnly = ( metadata && typeof metadata.phetioReadOnly === 'boolean' ) ? metadata.phetioReadOnly :
                           TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioReadOnly;

    // All i18n model strings are phetioFeatured by default
    const phetioFeatured = ( metadata && typeof metadata.phetioFeatured === 'boolean' ) ? metadata.phetioFeatured : true;

    this.property = new DynamicProperty( localeProperty, {
      derive: ( locale: string ) => this.getLocaleSpecificProperty( locale ),
      bidirectional: true,
      phetioValueType: StringIO,
      phetioState: false,
      tandem: tandem,
      phetioFeatured: phetioFeatured,
      phetioReadOnly: phetioReadOnly
    } );

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
    Object.keys( state ).forEach( locale => this.getLocaleSpecificProperty( locale ) );

    this.usedLocales.forEach( locale => {
      const localeSpecificProperty = this.getLocaleSpecificProperty( locale );
      const initialValue: string = this.initialValues[ locale ]!;
      assert && assert( initialValue !== undefined );

      const stateValue: string | null = state[ locale ] !== undefined ? state[ locale ]! : null;

      localeSpecificProperty.value = stateValue ?? initialValue;
    } );
  }

  private get usedLocales(): LocaleString[] {
    return [ ...this.localePropertyMap.keys() ];
  }

  /**
   * Returns the locale-specific Property for any locale (lazily creating it if necessary)
   */
  public getLocaleSpecificProperty( locale: string ): TProperty<string> {
    // Lazy creation
    if ( !this.localePropertyMap.has( locale ) ) {
      // Locales in order of fallback
      const orderedLocales: string[] = [
        locale,
        ...( localeData[ locale ].fallbackLocales || [] ),
        FALLBACK_LOCALE
      ];

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
  public restoreInitialValue( locale: LocaleString ): void {
    this.property.value = this.initialValues[ locale ];
  }
}

chipper.register( 'LocalizedString', LocalizedString );

export default LocalizedString;
