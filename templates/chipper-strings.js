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
    var stringMap = window.phet.chipper.strings[ window.phet.chipper.locale ];

    // Don't fail out on unsupported locales, see https://github.com/phetsims/chipper/issues/694
    if ( !stringMap ) {

      // See if there's a translation for just the language code
      stringMap = window.phet.chipper.strings[ window.phet.chipper.locale.slice( 0, 2 ) ];

      if ( !stringMap ) {
        stringMap = window.phet.chipper.strings.en;
      }
    }
    return window.phet.chipper.mapString( stringMap[ key ], stringTest );
  };
})();