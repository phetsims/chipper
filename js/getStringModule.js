// Copyright 2020, University of Colorado Boulder

/**
 * Given a requirejsNamespace, we filter out strings from phet.chipper.strings that start with it, and construct an
 * object with locale fallbacks already pre-computed, so that the correct strings can be accessed via object literal
 * access, e.g. getStringModule( 'JOIST' ).ResetAllButton.name will give the desired string value for whatever locale
 * the sim is being run with.
 *
 * @author Jonathan Olson <jonathan.olson>
 */

// constants
const FALLBACK_LOCALE = 'en';

/**
 * @param {string} requirejsNamespace - E.g. 'JOIST', to pull string keys out from that namespace
 * @returns {Object} - Nested object to be accessed like joistStrings.ResetAllButton.name
 */
const getStringModule = requirejsNamespace => {
  // Our string information is pulled globally, e.g. phet.chipper.strings[ locale ][ stringKey ] = stringValue;
  // Our locale information is from phet.chipper.locale

  assert && assert( typeof phet.chipper.locale === 'string', 'phet.chipper.locale should have been loaded by now' );
  assert && assert( phet.chipper.strings, 'phet.chipper.strings should have been loaded by now' );

  // Construct locales in increasing specificity, e.g. [ 'en', 'zh', 'zh_CN' ], so we get fallbacks in order
  const locales = [ FALLBACK_LOCALE ];
  const stringKeyPrefix = `${requirejsNamespace}/`;

  // e.g. for zh_CN, we want to push 'zh' (the partial fallback) on
  if ( phet.chipper.locale.indexOf( '_' ) >= 0 && phet.chipper.locale.slice( 0, 2 ) !== FALLBACK_LOCALE ) {
    locales.push( phet.chipper.locale.slice( 0, 2 ) );
  }
  // push the full locale if it is NOT the fallback
  if ( phet.chipper.locale !== FALLBACK_LOCALE ) {
    locales.push( phet.chipper.locale );
  }

  // consecutively create locale-specific string objects, and merge them into our result
  const result = {};
  locales.forEach( locale => {
    // We may have other older (unused) keys in babel, and we are only doing the search that matters with the English
    // string keys.
    const assertStructure = locale === FALLBACK_LOCALE;

    const partialStringMap = phet.chipper.strings[ locale ];
    if ( partialStringMap ) {
      // The object where our locale-specific string object is built
      const localeObject = {};

      const stringKeysInRepo = Object.keys( partialStringMap ).filter( stringKey => stringKey.indexOf( stringKeyPrefix ) === 0 );

      // We'll iterate over every string key that has this repo's prefix, so that we can add any relevant information
      // for it into the localeObject.
      stringKeysInRepo.forEach( stringKey => {
        // strip off the require.js namespace, e.g. 'JOIST/ResetAllButton.name' => 'ResetAllButton.name'
        const stringKeyWithoutPrefix = stringKey.slice( stringKeyPrefix.length );

        const keyParts = stringKeyWithoutPrefix.split( '.' );
        const lastKeyPart = keyParts[ keyParts.length - 1 ];
        const allButLastKeyPart = keyParts.slice( 0, keyParts.length - 1 );

        // During traversal into the string object, this will hold the object where the next level needs to be defined,
        // whether that's another child object, or the string value itself.
        let reference = localeObject;

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
          assert && assert( !assertStructure || typeof reference[ keyPart ] !== 'string',
            'It is not allowed to have two different string keys where one is extended by adding a period (.) at the end ' +
            `of the other. The string key ${partialKey} is extended by ${stringKey} in this case, and should be changed.` );

          // Create the next nested level, and move into it
          if ( !reference[ keyPart ] ) {
            reference[ keyPart ] = {};
          }
          reference = reference[ keyPart ];
        } );

        assert && assert( !assertStructure || typeof reference[ lastKeyPart ] !== 'object',
          'It is not allowed to have two different string keys where one is extended by adding a period (.) at the end ' +
          `of the other. The string key ${stringKey} is extended by another key, something containing ${reference[ lastKeyPart ] && Object.keys( reference[ lastKeyPart ] )}.` );
        assert && assert( !assertStructure || !reference[ lastKeyPart ],
          `We should not have defined this place in the object (${stringKey}), otherwise it means a duplicated string key OR extended string key` );

        // In case our assertions are not enabled, we'll need to proceed without failing out (so we allow for the
        // extended string keys in our actual code, even though assertions should prevent that).
        if ( typeof reference !== 'string' ) {
          reference[ lastKeyPart ] = phet.chipper.mapString( partialStringMap[ stringKey ] );
        }
      } );

      // Combine the strings together, overriding any more "default" string values with their more specific translated
      // values.
      _.merge( result, localeObject );
    }
  } );

  /**
   * Allow a semi-manual getter for a string, using the partial key (every part of it not including the require.js
   * namespace).
   * @public
   *
   * @param {string} partialKey - e.g 'ResetAllButton.name' for the string key 'SCENERY_PHET/ResetAllButton.name'
   * @returns {string}
   */
  result.get = partialKey => {
    const fullKey = `${requirejsNamespace}/${partialKey}`;

    // Iterate locales backwards for the lookup, so we get the most specific string first.
    for ( let i = locales.length - 1; i >= 0; i-- ) {
      const map = phet.chipper.strings[ locales[ i ] ];
      if ( map && map[ fullKey ] ) {
        return map[ fullKey ];
      }
    }

    throw new Error( `Unable to find string ${fullKey} in get( '${partialKey}' )` );
  };

  return result;
};
export default getStringModule;