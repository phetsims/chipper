// Copyright 2020-2021, University of Colorado Boulder

/**
 * Given a requirejsNamespace, we filter out strings from phet.chipper.strings that start with it, and construct an
 * object with locale fallbacks already pre-computed, so that the correct strings can be accessed via object literal
 * access, e.g. getStringModule( 'JOIST' ).ResetAllButton.name will give the desired string value for whatever locale
 * the sim is being run with.
 *
 * A string "key" is in the form of "NAMESPACE/key.from.strings.json"
 *
 * @author Jonathan Olson <jonathan.olson>
 */

import DynamicProperty from '../../axon/js/DynamicProperty.js';
import TinyProperty from '../../axon/js/TinyProperty.js';
import localeProperty from '../../joist/js/localeProperty.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import ObjectLiteralIO from '../../tandem/js/types/ObjectLiteralIO.js';
import StringIO from '../../tandem/js/types/StringIO.js';

// constants
const FALLBACK_LOCALE = 'en';

// initialRepoStringMap[ requirejsNamespace ][ locale ][ stringKey ] = string
// Needed for state saving (this is what we compute deltas against)
const initialRepoStringMap = {};

// localePropertiesRepoMap[ requirejsNamespace ][ locale ][ stringKey ] = TinyProperty<string>
// Needed for state saving (this contains all of our source string Properties)
const localePropertiesRepoMap = {};

// Create a non-delta state of our current strings, in a form like initialRepoStringMap
const createCurrentStringState = () => {
  const result = {};
  Object.keys( localePropertiesRepoMap ).forEach( requirejsNamespace => {
    const repoResult = {};
    result[ requirejsNamespace ] = repoResult;
    Object.keys( localePropertiesRepoMap[ requirejsNamespace ] ).forEach( locale => {
      const localeResult = {};
      repoResult[ locale ] = localeResult;
      Object.keys( localePropertiesRepoMap[ requirejsNamespace ][ locale ] ).forEach( stringKey => {
        localeResult[ stringKey ] = localePropertiesRepoMap[ requirejsNamespace ][ locale ][ stringKey ].value;
      } );
    } );
  } );
  return result;
};

// Create a state delta
const createStringStateDiff = () => {
  return jsondiffpatch.diff( initialRepoStringMap, createCurrentStringState() ) || {};
};

const StringStateIOType = new IOType( 'StringStateIO', {
  isValidValue: () => true,
  toStateObject: () => {
    return {
      // Data nested for a valid schema
      data: createStringStateDiff()
    };
  },
  stateSchema: {
    data: ObjectLiteralIO
  },
  applyState: ( ( ignored, diff ) => {
    const repoStringMap = _.cloneDeep( initialRepoStringMap );
    if ( diff.data && Object.keys( diff.data ).length > 0 ) {
      jsondiffpatch.patch( repoStringMap, diff.data );
    }

    Object.keys( repoStringMap ).forEach( requirejsNamespace => {
      Object.keys( repoStringMap[ requirejsNamespace ] ).forEach( locale => {
        Object.keys( repoStringMap[ requirejsNamespace ][ locale ] ).forEach( stringKey => {
          const tinyProperty = localePropertiesRepoMap[ requirejsNamespace ][ locale ][ stringKey ];
          const stringValue = repoStringMap[ requirejsNamespace ][ locale ][ stringKey ];
          if ( tinyProperty.value !== stringValue ) {
            tinyProperty.value = stringValue;
          }
        } );
      } );
    } );

    return null;
  } )
} );

new PhetioObject( { // eslint-disable-line
  phetioType: StringStateIOType,
  tandem: Tandem.GENERAL_MODEL.createTandem( 'stringsState' ),
  phetioState: true
} );

/**
 * @param {string} requirejsNamespace - E.g. 'JOIST', to pull string keys out from that namespace
 * @returns {Object} - Nested object to be accessed like joistStrings.ResetAllButton.name
 */
const getStringModule = requirejsNamespace => {
  // Our string information is pulled globally, e.g. phet.chipper.strings[ locale ][ stringKey ] = stringValue;
  // Our locale information is from phet.chipper.locale

  assert && assert( typeof phet.chipper.locale === 'string', 'phet.chipper.locale should have been loaded by now' );
  assert && assert( phet.chipper.strings, 'phet.chipper.strings should have been loaded by now' );

  const locales = Object.keys( phet.chipper.strings );

  const getFallbackLocales = locale => [
    locale,
    ...( locale.includes( '_' ) && !locale.startsWith( FALLBACK_LOCALE ) ? [ locale.slice( 0, 2 ) ] : [] ),
    ...( locale !== FALLBACK_LOCALE ? [ FALLBACK_LOCALE ] : [] )
  ].filter( locale => locales.includes( locale ) );

  // Construct locales in increasing specificity, e.g. [ 'en', 'zh', 'zh_CN' ], so we get fallbacks in order
  // const locales = [ FALLBACK_LOCALE ];
  const stringKeyPrefix = `${requirejsNamespace}/`;

  // We may have other older (unused) keys in babel, and we are only doing the search that matters with the English
  // string keys.
  const allStringKeysInRepo = Object.keys( phet.chipper.strings[ FALLBACK_LOCALE ] ).filter( stringKey => stringKey.indexOf( stringKeyPrefix ) === 0 );

  // initialStringMap[ locale ][ stringKey ]
  const initialStringMap = {};
  initialRepoStringMap[ requirejsNamespace ] = initialStringMap;

  // localePropertiesMap[ locale ][ stringKey ]
  const localePropertiesMap = {};
  localePropertiesRepoMap[ requirejsNamespace ] = localePropertiesMap;
  locales.forEach( locale => {
    localePropertiesMap[ locale ] = {};
    initialStringMap[ locale ] = {};

    const fallbackLocales = getFallbackLocales( locale );

    allStringKeysInRepo.forEach( stringKey => {
      let string = null;
      fallbackLocales.forEach( fallbackLocale => {
        if ( string === null && typeof phet.chipper.strings[ fallbackLocale ][ stringKey ] === 'string' ) {
          string = phet.chipper.strings[ fallbackLocale ][ stringKey ];
        }
      } );
      localePropertiesMap[ locale ][ stringKey ] = new TinyProperty( string );
      initialStringMap[ locale ][ stringKey ] = string;
    } );
  } );

  const stringModule = {};

  allStringKeysInRepo.forEach( stringKey => {
    // strip off the requirejsNamespace, e.g. 'JOIST/ResetAllButton.name' => 'ResetAllButton.name'
    const stringKeyWithoutPrefix = stringKey.slice( stringKeyPrefix.length );

    const keyParts = stringKeyWithoutPrefix.split( '.' );
    const lastKeyPart = keyParts[ keyParts.length - 1 ];
    const allButLastKeyPart = keyParts.slice( 0, keyParts.length - 1 );

    // During traversal into the string object, this will hold the object where the next level needs to be defined,
    // whether that's another child object, or the string value itself.
    let reference = stringModule;

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
      reference = reference[ keyPart ];
    } );

    assert && assert( typeof reference[ lastKeyPart ] !== 'object',
      'It is not allowed to have two different string keys where one is extended by adding a period (.) at the end ' +
      `of the other. The string key ${stringKey} is extended by another key, something containing ${reference[ lastKeyPart ] && Object.keys( reference[ lastKeyPart ] )}.` );
    assert && assert( !reference[ lastKeyPart ],
      `We should not have defined this place in the object (${stringKey}), otherwise it means a duplicated string key OR extended string key` );

    // In case our assertions are not enabled, we'll need to proceed without failing out (so we allow for the
    // extended string keys in our actual code, even though assertions should prevent that).
    if ( typeof reference !== 'string' ) {
      // TODO: Improve tandem names, see https://github.com/phetsims/chipper/issues/1302
      const sanitizedStringKey = stringKey
        .replace( /_/g, ',' )
        .replace( /\./g, ',' )
        .replace( /-/g, ',' )
        .replace( /\//g, ',' );
      const dynamicProperty = new DynamicProperty( localeProperty, {
        derive: locale => localePropertiesMap[ locale ][ stringKey ],
        bidirectional: true,
        phetioReadOnly: false,
        phetioValueType: StringIO,
        phetioState: false,
        tandem: Tandem.GENERAL_MODEL.createTandem( 'strings' ).createTandem( `${sanitizedStringKey}Property` )
      } );

      reference[ `${lastKeyPart}Property` ] = dynamicProperty;
      dynamicProperty.link( string => {
        reference[ lastKeyPart ] = string;
      } );
    }
  } );

  /**
   * Allow a semi-manual getter for a string, using the partial key (every part of it not including the
   * requireNamespace).
   * @public
   *
   * @param {string} partialKey - e.g 'ResetAllButton.name' for the string key 'SCENERY_PHET/ResetAllButton.name'
   * @returns {string}
   */
  stringModule.get = partialKey => {
    const fullKey = `${requirejsNamespace}/${partialKey}`;

    const property = localePropertiesMap[ localeProperty.value ][ fullKey ];

    if ( property ) {
      return property.value;
    }
    else {
      throw new Error( `Unable to find string ${fullKey} in get( '${partialKey}' )` );
    }
  };

  return stringModule;
};

export default getStringModule;
