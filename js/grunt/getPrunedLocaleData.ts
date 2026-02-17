// Copyright 2024, University of Colorado Boulder

/**
 * Computes the subset of localeData that should be shipped with a built simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import fs from 'fs';
import _ from 'lodash';
import ChipperConstants from '../common/ChipperConstants.js';
import { Locale, LocaleData } from './getStringMap.js';

/**
 * Returns a subset of the localeData that should be included in the built simulation.
 *
 * @param localesWithTranslations - Array of locales that have translations
 */
export default ( localesWithTranslations: string[] ): object => {

  // Load localeData
  const fullLocaleData: LocaleData = JSON.parse( fs.readFileSync( '../babel/localeData.json', 'utf8' ) );

  // Include a (larger) subset of locales' localeData. It will need more locales than just the locales directly specified
  // in phet.chipper.strings (the stringMap). We also need locales that will fall back to ANY of those locales in phet.chipper.strings,
  // e.g. if we have an "es" translation, we will include the locale data for "es_PY" because it falls back to "es".
  const includedDataLocales: Locale[] = _.uniq( [
    // Always include the fallback (en)
    ChipperConstants.FALLBACK_LOCALE,

    // Include directly-used locales
    ...localesWithTranslations,

    // Include locales that will fall back to locales with a translation
    ...Object.keys( fullLocaleData ).filter( locale => {
      return fullLocaleData[ locale ].fallbackLocales && fullLocaleData[ locale ].fallbackLocales.some( ( fallbackLocale: string ) => {
        return localesWithTranslations.includes( fallbackLocale );
      } );
    } )
  ] );

  // If a locale is NOT included, and has no fallbacks that are included, BUT IS the fallback for another locale, we
  // should include it. For example, if we have NO "ak" translation, but we have a "tw" translation (which falls back to
  // "ak"), we will want to include "ak" (even though it won't ever contain non-English string translation), because we
  // may want to reference it (and want to not have "broken" locale links localeData).

  // This array would get longer as we iterate through it.
  for ( let i = 0; i < includedDataLocales.length; i++ ) {
    const locale = includedDataLocales[ i ];

    // If our locale is included, we should make sure all of its fallbackLocales are included
    const fallbackLocales = fullLocaleData[ locale ].fallbackLocales;
    if ( fallbackLocales ) {
      for ( const fallbackLocale of fallbackLocales ) {
        if ( !includedDataLocales.includes( fallbackLocale ) ) {
          includedDataLocales.push( fallbackLocale );
        }
      }
    }
  }

  // The set of locales included in generated (subset of) localeData for this specific built simulation file
  // is satisfied by the following closure:
  //
  // 1. If a locale has a translation, include that locale.
  // 2. If one of a locale's localeData[ locale ].fallbackLocales is translated, include that locale.
  // 3. If a locale is in an included localeData[ someOtherLocale ].fallbackLocales, include that locale.
  // 4. Always include the default locale "en".
  const localeData: LocaleData = {};
  for ( const locale of _.sortBy( includedDataLocales ) ) {
    localeData[ locale ] = fullLocaleData[ locale ];
  }

  return localeData;
};