// Copyright 2015-2024, University of Colorado Boulder

/**
 * String utilities used throughout chipper.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
import assert from 'assert';
import _ from 'lodash';

// What divides the repo prefix from the rest of the string key, like `FRICTION/friction.title`
const NAMESPACE_PREFIX_DIVIDER = '/';
const A11Y_MARKER = 'a11y.';

const ChipperStringUtils = {

  /**
   * Pad LTR/RTL language values with unicode embedding marks (see https://github.com/phetsims/joist/issues/152)
   * Uses directional formatting characters: http://unicode.org/reports/tr9/#Directional_Formatting_Characters
   *
   * @returns the input string padded with the embedding marks, or an empty string if the input was empty
   */
  addDirectionalFormatting: function( str: string, isRTL: boolean ): string {
    if ( str.length > 0 ) {
      return `${( isRTL ? '\u202b' : '\u202a' ) + str}\u202c`;
    }
    else {
      return str;
    }
  },

  /**
   * Appends spaces to a string
   *
   * @param str - the input string
   * @param n - number of spaces to append
   * @returns a new string
   */
  padString: function( str: string, n: number ): string {
    while ( str.length < n ) {
      str += ' ';
    }
    return str;
  },

  /**
   * Replaces all occurrences of {string} find with {string} replace in {string} str
   *
   * @param str - the input string
   * @param find - the string to find
   * @param replaceWith - the string to replace find with
   * @returns a new string
   */
  replaceAll: function( str: string, find: string, replaceWith: string ): string {
    return str.replace( new RegExp( find.replace( /[-/\\^$*+?.()|[\]{}]/g, '\\$&' ), 'g' ), replaceWith );
  },

  // TODO chipper#316 determine why this behaves differently than str.replace for some cases (eg, 'MAIN_INLINE_JAVASCRIPT')
  /**
   * Replaces the first occurrence of {string} find with {string} replaceWith in {string} str
   *
   * @param str - the input string
   * @param find - the string to find
   * @param replaceWith - the string to replace find with
   * @returns a new string
   */
  replaceFirst: function( str: string, find: string, replaceWith: string ): string {
    const idx = str.indexOf( find );
    if ( str.includes( find ) ) {
      return str.slice( 0, idx ) + replaceWith + str.slice( idx + find.length );
    }
    else {
      return str;
    }
  },

  /**
   * Returns a string with all of the keys of the mapping replaced with the values.
   */
  replacePlaceholders: function( str: string, mapping: Record<string, string | boolean | number> ): string {
    Object.keys( mapping ).forEach( key => {
      const replacement = mapping[ key ];
      key = `{{${key}}}`;
      let index;
      while ( ( index = str.indexOf( key ) ) >= 0 ) {
        str = str.slice( 0, index ) + replacement + str.slice( index + key.length );
      }
    } );
    Object.keys( mapping ).forEach( key => {
      if ( str.includes( `{{${key}}}` ) ) {
        throw new Error( `Template string detected in placeholders: ${key}\n\n${str.slice( 0, str.indexOf( `{{${key}}}` ) + 10 )}` );
      }
    } );
    return str;
  },

  /**
   * Recurse through a string file and format each string value appropriately
   * @param stringMap
   * @param isRTL - is right to left language
   * @param [assertNoWhitespace] - when true, assert that trimming each string value doesn't change the string.
   */
  formatStringValues: function( stringMap: MaybeHasAStringValue, isRTL: boolean, assertNoWhitespace?: boolean ): void {
    ChipperStringUtils.forEachString( stringMap, ( key, stringObject ) => {

      assert && assertNoWhitespace && assert( stringObject.value === stringObject.value.trim(),
        `String should not have trailing or leading whitespace, key: ${key}, value: "${stringObject.value}"` );

      // remove leading/trailing whitespace, see chipper#619. Do this before addDirectionalFormatting
      stringObject.value = ChipperStringUtils.addDirectionalFormatting( stringObject.value.trim(), isRTL );
    } );
  },

  /**
   * Given a key, get the appropriate string from the "map" object, or null if the key does not appear in the map.
   * This method is called in unbuilt mode from the string plugin and during the build via CHIPPER/getStringFileMap.
   * This method supports recursing through keys that support string nesting. This method was created to support
   * nested string keys in https://github.com/phetsims/rosetta/issues/193
   * @param map - where an "intermediate" Object should hold nested strings
   * @param key - like `FRICTION/friction.title` or using nesting like `a11y.nested.string.here`
   * @returns - the string entry of the key, or null if the key does not appear in the map
   * @throws  {Error} - if the key doesn't hold a string value in the map
   */
  getStringEntryFromMap( map: StringFileMap, key: string ): StringObject | null {

    if ( key.includes( NAMESPACE_PREFIX_DIVIDER ) ) {
      throw new Error( 'getStringEntryFromMap key should not have REPO/' );
    }

    // Lodash gives precedence to  "key1.key2" over "key1:{key2}", so we do too.
    const result = _.at( map, key )[ 0 ];
    if ( result ) {
      if ( result.value === undefined ) {
        throw new Error( `no value for string: ${key}` );
      }
      if ( typeof result.value !== 'string' ) {
        throw new Error( `value should be a string for key ${key}` );
      }

      // Until rosetta supports nested strings in https://github.com/phetsims/rosetta/issues/215, keep this assertion.
      // This should be after because the above errors are more specific. This is better as a fallback.
      assert && !ChipperStringUtils.isA11yStringKey( key ) && assert( map[ key ],
        `nested strings are not allowed outside of a11y string object for key: ${key}` );

      return result as StringObject;
    }

    // They key does not appear in the map
    return null;
  },

  /**
   * @param key - without "string!REPO" at the beginning, just the actual "string key"
   */
  isA11yStringKey( key: string ): boolean {
    return key.startsWith( ChipperStringUtils.A11Y_MARKER );
  },

  /**
   * The start of any a11y specific string key.
   */
  A11Y_MARKER: A11Y_MARKER,

  /**
   * Call a function on each object with a "value" attribute in an object tree.
   * @param map - string map, like a loaded JSON strings file
   * @param func
   * @param keySoFar - while recursing, build up a string of the key separated with dots.
   */
  forEachString( map: MaybeHasAStringValue, func: ( key: string, stringObject: StringObject ) => void, keySoFar = '' ): void {
    for ( const key in map ) {
      if ( map.hasOwnProperty( key ) ) {
        const nextKey = keySoFar ? `${keySoFar}.${key}` : key; // don't start with period, assumes '' is falsey
        const stringObject = map[ key ];

        // no need to support non-object, null, or arrays in the string map, for example stringObject.history in
        // locale specific files.
        if ( typeof stringObject !== 'object' || stringObject === null || Array.isArray( stringObject ) ) {
          continue;
        }
        if ( stringObject.value ) {
          func( nextKey, stringObject as StringObject );
        }

        // recurse to the next level since if it wasn't the `value` key
        key !== 'value' && ChipperStringUtils.forEachString( stringObject as MaybeHasAStringValue, func, nextKey );
      }
    }
  }
};

// TODO: Bad name central, please help https://github.com/phetsims/chipper/issues/1537
type ValueString = { value?: string };

// An object that has a "value" field that holds the string. It can still include more nested `StringObject`s.
type MaybeHasAStringValue = { // eslint-disable-line @typescript-eslint/consistent-indexed-object-style

  // Each string is a component name of a PhetioID
  [ name: string ]: StringFileMapNode;
} & ValueString;

// Each StringFileMapNode should have at least one StringObject nested inside it.
type StringFileMapNode = MaybeHasAStringValue | Required<ValueString>;
type StringObject = StringFileMapNode & Required<ValueString>;

export type StringFileMap = Record<string, StringFileMapNode>;


export default ChipperStringUtils;