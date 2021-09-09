(function() {
  'use strict';

  var stringOverrides = JSON.parse( phet.chipper.queryParameters.strings || '{}' );

  var stringTest = ( typeof window !== 'undefined' && window.phet.chipper.queryParameters.stringTest ) ?
                   window.phet.chipper.queryParameters.stringTest :
                   null;

  window.phet.chipper.strings.get = function( key ) {
    // override strings via the 'strings' query parameter
    var localeStrings = window.phet.chipper.strings[ window.phet.chipper.locale ];
    if ( !localeStrings && window.phet.chipper.locale.indexOf( '_' ) === 2 ) { // e.g. 'zh' for 'zh_CN'
      localeStrings = window.phet.chipper.strings[ window.phet.chipper.locale.slice( 0, 2 ) ];
    }
    if ( !localeStrings  ) {
      localeStrings = window.phet.chipper.strings.en;
    }
    return stringOverrides[ key ] || window.phet.chipper.mapString( localeStrings[ key ], stringTest );
  };
})();