(function() {
  var stringOverrides = JSON.parse( phet.chipper.getQueryParameter( 'strings' ) || '{}' );

  var stringTest = ( typeof window !== 'undefined' && window.phet.chipper.getQueryParameter( 'stringTest' ) ) ?
                   window.phet.chipper.getQueryParameter( 'stringTest' ) :
                   null;

  window.phet.chipper.strings.get = function( key ) {
    // override strings via the 'strings' query parameter
    return stringOverrides[ key ] || window.phet.chipper.mapString( window.phet.chipper.strings[ window.phet.chipper.locale ][ key ], stringTest );
  };
})();