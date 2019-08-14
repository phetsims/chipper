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
    let stringMap = phet.chipper.strings[ phet.chipper.locale ];

    // Don't fail out on unsupported locales, see https://github.com/phetsims/chipper/issues/694
    if ( !stringMap ) {

      // See if there's a translation for just the language code
      stringMap = phet.chipper.strings[ phet.chipper.locale.slice( 0, 2 ) ];

      if ( !stringMap ) {
        stringMap = phet.chipper.strings.en;
      }
    }
    return phet.chipper.mapString( stringMap[ key ], stringTest );
  };
})();