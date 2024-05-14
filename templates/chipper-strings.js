// Copyright 2018, University of Colorado Boulder

(function() {
  'use strict';

  assert && assert( !!phet.chipper.queryParameters, 'Query parameters are required for custom strings or string tests' );
  assert && assert( !!phet.chipper.strings, 'The initialization script should have filled out phet.chipper.strings' );
  assert && assert( !!phet.chipper.locale, 'locale is required to look up the correct strings' );
  assert && assert( !!phet.chipper.mapString, 'mapString is needed for string test usage' );

  const stringOverrides = JSON.parse( phet.chipper.queryParameters.strings || '{}' );

  const stringTest = ( typeof window !== 'undefined' && phet.chipper.queryParameters.stringTest ) ?
                     phet.chipper.queryParameters.stringTest :
                     null;

  phet.chipper.strings.get = key => {

    // override strings via the 'strings' query parameter
    if ( stringOverrides[ key ] ) {
      return stringOverrides[ key ];
    }

    // Get a list of locales in the order they should be searched
    const fallbackLocales = [ phet.chipper.locale ];
    const specificLocaleData = phet.chipper.localeData[ phet.chipper.locale ];
    if ( specificLocaleData && specificLocaleData.fallbackLocales ) {
      specificLocaleData.fallbackLocales.forEach( fallbackLocale => fallbackLocales.push( fallbackLocale ) );
    }
    fallbackLocales.push( 'en' );

    let stringMap = null;

    for ( const locale of fallbackLocales ) {
      stringMap = phet.chipper.strings[ locale ];
      if ( stringMap ) {
        break;
      }
    }

    return phet.chipper.mapString( stringMap[ key ], stringTest );
  };
})();