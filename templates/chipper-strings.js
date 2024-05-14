// Copyright 2018, University of Colorado Boulder

(function() {
  'use strict';

  var stringOverrides = JSON.parse( phet.chipper.queryParameters.strings || '{}' );

  var stringTest = ( typeof window !== 'undefined' && window.phet.chipper.queryParameters.stringTest ) ?
                   window.phet.chipper.queryParameters.stringTest :
                   null;

  window.phet.chipper.strings.get = function( key ) {

    // override strings via the 'strings' query parameter
    if ( stringOverrides[ key ] ) {
      return stringOverrides[ key ];
    }

    // Get a list of locales in the order they should be searched
    var fallbackLocales = [ phet.chipper.locale ];
    var specificLocaleData = phet.chipper.localeData[ phet.chipper.locale ];
    if ( specificLocaleData && specificLocaleData.fallbackLocales ) {
      specificLocaleData.fallbackLocales.forEach( function( fallbackLocale ) { fallbackLocales.push( fallbackLocale ) } );
    }
    fallbackLocales.push( 'en' );

    var stringMap = null;

    for ( var locale of fallbackLocales ) {
      stringMap = phet.chipper.strings[ locale ];
      if ( stringMap ) {
        break;
      }
    }

    return phet.chipper.mapString( stringMap[ key ], stringTest );
  };
})();