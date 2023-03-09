// Copyright 2020-2023, University of Colorado Boulder

/**
 * Given a requirejsNamespace, we filter out strings from phet.chipper.strings that start with it, and construct an
 * object with locale fallbacks already pre-computed, so that the correct strings can be accessed via object literal
 * access, e.g. getStringModule( 'JOIST' ).ResetAllButton.name will give the desired string value for whatever locale
 * the sim is being run with.
 *
 * A string "key" is in the form of "NAMESPACE/key.from.strings.json"
 *
 * NOTE: This file likely belongs in joist/js/i18n/, but should stay here to make maintenance-release maintainability easier.
 *
 * @author Jonathan Olson <jonathan.olson>
 */

import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import CouldNotYetDeserializeError from '../../tandem/js/CouldNotYetDeserializeError.js';
import IOType from '../../tandem/js/types/IOType.js';
import ObjectLiteralIO from '../../tandem/js/types/ObjectLiteralIO.js';
import LocalizedString, { LocalizedStringStateDelta, StringsStateStateObject } from './LocalizedString.js';
import TReadOnlyProperty from '../../axon/js/TReadOnlyProperty.js';
import { Locale } from '../../joist/js/i18n/localeProperty.js';
import localeInfoModule from '../../chipper/js/data/localeInfoModule.js';
import { PhetioID } from '../../tandem/js/TandemConstants.js';

// constants
const FALLBACK_LOCALE = 'en';

// Holds all of our localizedStrings, so that we can save our phet-io string change state
export const localizedStrings: LocalizedString[] = [];

// For developer internal use, particularly for memory leak detection
// e.g. _.max( phet.chipper.localizedStrings.map( ls => ls.property.tinyProperty.listeners.size ) ) to see if there is
// likely a leak
window.phet.chipper.localizedStrings = localizedStrings;

// For developer internal use, similar to the stringTest query parameter
window.phet.chipper.setAllStrings = ( str: string ) => {
  localizedStrings.forEach( localizedString => {
    localizedString.property.value = str;
  } );
};

const StringStateIOType = new IOType<PhetioObject, StringsStateStateObject>( 'StringStateIO', {
  valueType: PhetioObject,
  toStateObject: (): StringsStateStateObject => {
    const data: Record<PhetioID, LocalizedStringStateDelta> = {};

    localizedStrings.forEach( localizedString => {
      const state = localizedString.getStateDelta();

      // Only create an entry if there is anything (we can save bytes by not including the tandem here)
      if ( Object.keys( state ).length > 0 ) {
        data[ localizedString.property.tandem.phetioID ] = state;
      }
    } );
    return {
      data: data // Data nested for a valid schema
    };
  },
  stateSchema: {
    data: ObjectLiteralIO
  },
  applyState: ( ignored, state ) => {

    // Every string in state has to be in localizedStrings to continue
    Object.keys( state.data ).forEach( phetioID => {
      const match = localizedStrings.find( localizedString => localizedString.property.tandem.phetioID === phetioID );

      // When PhetioDynamicElementContainer elements such as PhetioGroup members add localizedStrings, we wait until
      // all of the members have been created (populating localizedStrings) before trying to set any of the strings.
      if ( !match ) {
        throw new CouldNotYetDeserializeError();
      }
    } );

    // We need to iterate through every string in this runtime, since it might need to revert back to "initial" state.
    localizedStrings.forEach( localizedString => {
      localizedString.setStateDelta( state.data[ localizedString.property.tandem.phetioID ] || {} );
    } );
  }
} );

PhetioObject.create( {
  phetioType: StringStateIOType,
  tandem: Tandem.GENERAL_MODEL.createTandem( 'stringsState' ),
  phetioDocumentation: 'Strings that have changed from their initial values. Each string value is specific to the locale it changed in.',
  phetioState: true
} );

type TStringModule = {
  [ key: string ]: TStringModule | string | TReadOnlyProperty<string>;
};

/**
 * @param requirejsNamespace - E.g. 'JOIST', to pull string keys out from that namespace
 * @returns Nested object to be accessed like JoistStrings.ResetAllButton.name
 */
const getStringModule = ( requirejsNamespace: string ): object => {
  // Our string information is pulled globally, e.g. phet.chipper.strings[ locale ][ stringKey ] = stringValue;
  // Our locale information is from phet.chipper.locale

  assert && assert( typeof phet.chipper.locale === 'string', 'phet.chipper.locale should have been loaded by now' );
  assert && assert( Object.keys( localeInfoModule ).includes( phet.chipper.locale ), 'phet.chipper.locale should have been loaded by now' );
  assert && assert( phet.chipper.strings, 'phet.chipper.strings should have been loaded by now' );

  // Construct locales in increasing specificity, e.g. [ 'en', 'zh', 'zh_CN' ], so we get fallbacks in order
  // const locales = [ FALLBACK_LOCALE ];
  const stringKeyPrefix = `${requirejsNamespace}/`;

  // We may have other older (unused) keys in babel, and we are only doing the search that matters with the English
  // string keys.
  let allStringKeysInRepo = Object.keys( phet.chipper.strings[ FALLBACK_LOCALE ] ).filter( stringKey => stringKey.startsWith( stringKeyPrefix ) );

  // TODO: https://github.com/phetsims/phet-io/issues/1877 What if this list doesn't exist?  Should that be an error?
  // Or an error if running an api-stable phet-io sim?
  // TODO: https://github.com/phetsims/phet-io/issues/1877 What will happen if this is stale? How will a developer know
  // to update it? Should it run in daily-grunt-work?
  if ( phet.chipper.usedStringsEN ) {
    allStringKeysInRepo = allStringKeysInRepo.filter( stringKey => phet.chipper.usedStringsEN.hasOwnProperty( stringKey ) );
  }

  // localizedStringMap[ stringKey ]
  const localizedStringMap: Record<string, LocalizedString> = {};

  const stringModule: TStringModule = {};

  allStringKeysInRepo.forEach( stringKey => {
    // strip off the requirejsNamespace, e.g. 'JOIST/ResetAllButton.name' => 'ResetAllButton.name'
    const stringKeyWithoutPrefix = stringKey.slice( stringKeyPrefix.length );

    const keyParts = stringKeyWithoutPrefix.split( '.' );
    const lastKeyPart = keyParts[ keyParts.length - 1 ];
    const allButLastKeyPart = keyParts.slice( 0, keyParts.length - 1 );

    // During traversal into the string object, this will hold the object where the next level needs to be defined,
    // whether that's another child object, or the string value itself.
    let reference: TStringModule = stringModule;

    // We'll traverse down through the parts of a string key (separated by '.'), creating a new level in the
    // string object for each one. This is done for all BUT the last part, since we'll want to assign the result
    // of that to a raw string value (rather than an object).
    let partialKey = stringKeyPrefix;
    allButLastKeyPart.forEach( ( keyPart, i ) => {
      // When concatenating each level into the final string key, we don't want to put a '.' directly after the
      // slash, because `JOIST/.ResetAllButton.name` would be invalid.
      // See https://github.com/phetsims/chipper/issues/922
      partialKey += `${i > 0 ? '.' : ''}${keyPart}`;

      // Don't allow e.g. JOIST/a and JOIST/a.b, since localeObject.a would need to be a string AND an object at the
      // same time.
      assert && assert( typeof reference[ keyPart ] !== 'string',
        'It is not allowed to have two different string keys where one is extended by adding a period (.) at the end ' +
        `of the other. The string key ${partialKey} is extended by ${stringKey} in this case, and should be changed.` );

      // Create the next nested level, and move into it
      if ( !reference[ keyPart ] ) {
        reference[ keyPart ] = {};
      }

      reference = reference[ keyPart ] as TStringModule; // since we are on all but the last key part, it cannot be stringlike
    } );

    assert && assert( typeof reference[ lastKeyPart ] !== 'object',
      'It is not allowed to have two different string keys where one is extended by adding a period (.) at the end ' +
      `of the other. The string key ${stringKey} is extended by another key, something containing ${reference[ lastKeyPart ] && Object.keys( reference[ lastKeyPart ] )}.` );
    assert && assert( !reference[ lastKeyPart ],
      `We should not have defined this place in the object (${stringKey}), otherwise it means a duplicated string key OR extended string key` );

    // In case our assertions are not enabled, we'll need to proceed without failing out (so we allow for the
    // extended string keys in our actual code, even though assertions should prevent that).
    if ( typeof reference !== 'string' ) {
      let tandem = Tandem.GENERAL_MODEL.createTandem( 'strings' ).createTandem( _.camelCase( requirejsNamespace ) );
      for ( let i = 0; i < keyParts.length; i++ ) {

        // a11y maps to a11Y in camel case, so let's sit this one out. Worth a hard coding here since most string files
        // have this key.
        let tandemName = keyParts[ i ] === 'a11y' ? keyParts[ i ] : _.camelCase( keyParts[ i ] );

        // If it is the tail of the string key, then make the tandem be a "*StringProperty"
        if ( i === keyParts.length - 1 ) {

          let currentTandemName = tandemName;
          let j = 0;
          let tandemNameTaken = true;

          // Handle the case where two unique string keys map to the same camel case value, i.e. "Solid" and "solid".
          // Here we will be solidStringProperty and solid2StringProperty
          while ( tandemNameTaken ) {
            j++;

            currentTandemName = `${tandemName}${j === 1 ? '' : j}StringProperty`;

            tandemNameTaken = tandem.hasChild( currentTandemName );
          }
          tandemName = currentTandemName;
        }

        tandem = tandem.createTandem( tandemName );
      }

      // strings nested under the a11y section are not currently PhET-iO instrumented, see https://github.com/phetsims/chipper/issues/1352
      if ( tandem.phetioID.includes( '.a11y.' ) ) {
        tandem = Tandem.OPT_OUT;
      }

      const localizedString = new LocalizedString(
        phet.chipper.mapString( phet.chipper.strings[ FALLBACK_LOCALE ][ stringKey ] ),
        tandem,
        phet.chipper.stringMetadata[ stringKey ]
      );
      localizedStringMap[ stringKey ] = localizedString;

      // Push up the translated values
      ( Object.keys( phet.chipper.strings ) as Locale[] ).forEach( ( locale: Locale ) => {
        const string: string = phet.chipper.strings[ locale ][ stringKey ];
        // Ignore zero-length strings, see https://github.com/phetsims/chipper/issues/1343
        if ( typeof string === 'string' && string !== '' ) {
          localizedString.setInitialValue( locale, phet.chipper.mapString( string ) );
        }
      } );

      // Put our Property in the stringModule
      reference[ `${lastKeyPart}StringProperty` ] = localizedString.property;

      // Change our stringModule based on the Property value
      localizedString.property.link( string => {
        reference[ lastKeyPart ] = string;
      } );
    }
  } );

  return stringModule;
};

export default getStringModule;
