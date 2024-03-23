// Copyright 2023-2024, University of Colorado Boulder

/**
 * The main Property for a translated string (subtyped so we can get the stringKey, or other things in the future).
 *
 * @author Jonathan Olson <jonathan.olson>
 */

import DynamicProperty from '../../axon/js/DynamicProperty.js';
import localeProperty, { Locale } from '../../joist/js/i18n/localeProperty.js';
import Tandem from '../../tandem/js/Tandem.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import chipper from './chipper.js';
import TandemConstants from '../../tandem/js/TandemConstants.js';
import LocalizedString from './LocalizedString.js';

class LocalizedStringProperty extends DynamicProperty<string, string, Locale> {

  public constructor( public readonly localizedString: LocalizedString, tandem: Tandem, metadata?: Record<string, unknown> ) {

    // Allow phetioReadOnly to be overridden
    const phetioReadOnly = ( metadata && typeof metadata.phetioReadOnly === 'boolean' ) ? metadata.phetioReadOnly :
                           TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioReadOnly;

    // All i18n model strings are phetioFeatured by default
    const phetioFeatured = ( metadata && typeof metadata.phetioFeatured === 'boolean' ) ? metadata.phetioFeatured : true;

    // Allow phetioDocumentation to be overridden
    const phetioDocumentation = ( metadata && typeof metadata.phetioDocumentation === 'string' ) ? metadata.phetioDocumentation :
                                TandemConstants.PHET_IO_OBJECT_METADATA_DEFAULTS.phetioDocumentation;

    super( localeProperty, {
      derive: ( locale: Locale ) => localizedString.getLocaleSpecificProperty( locale ),
      bidirectional: true,
      phetioValueType: StringIO,
      phetioState: false,
      tandem: tandem,
      phetioFeatured: phetioFeatured,
      phetioReadOnly: phetioReadOnly,
      phetioDocumentation: phetioDocumentation
    } );
  }

  public get stringKey(): string {
    return this.localizedString.stringKey;
  }
}

chipper.register( 'LocalizedStringProperty', LocalizedStringProperty );

export default LocalizedStringProperty;