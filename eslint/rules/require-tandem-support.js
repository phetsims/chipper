// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Tandems support is required by files in Sun and Scenery-phet
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  'use strict';

  // Whitelist of directories to check that Tandem has support.
  var directoriesToRequireTandemSupport = [ /sun[\/\\]js/, /scenery-phet[\/\\]js/ ];
  // var directoriesToRequireTandemSupport = [ /sun[\/\\]js/ ];

  var requireTandemSupportBlackList = [ /[\/\\]demo[\/\\]/, /-main\.js$/, /-config\.js$/, /sun\.js/, /sunQueryParameters\.js/,
    /[\/\\]ColorConstants\.js/, /[\/\\][sS]ceneryPhet.*\.js/, /[\/\\]PhetColorScheme\.js/ , /[\/\\]VisibleColor\.js/  ];
  return {

    Program: function requreTandemSupport( node ) {
      // Check whether the given directory matches the whitelist
      var directoryShouldBeChecked = false;
      for ( var i = 0; i < directoriesToRequireTandemSupport.length; i++ ) {
        var f = context.getFilename();
        var d = directoriesToRequireTandemSupport[ i ];
        if ( f.match( d ) ) {
          for ( var j = 0; j < requireTandemSupportBlackList.length; j++ ) {
            var blackListFile = requireTandemSupportBlackList[ j ];
            if ( f.match( blackListFile ) ) {
              // Matches a blacklisted file, so don't check it
              var matchedBlackList = true;
              break;
            }
          }
          // Didn't match any of the blacklisted files
          directoryShouldBeChecked = !matchedBlackList;
          break;
        }
      }

      if ( directoryShouldBeChecked ) {
        var source = context.getSource();

        // TODO: update this after https://github.com/phetsims/phet-io/issues/985 more complete
        // Assume that Tandem.validateOptions() indicates a fully-instrumented file
        if ( source.indexOf( 'Tandem.validateOptions' ) === -1 && source.indexOf( 'Tandem.indicateUninstrumentedCode' ) === -1 ) {
          context.report( {
            node: node,
            loc: node.loc.start,
            message: 'File must be PhET-iO instrumented or call Tandem.indicateUninstrumentedCode()'
          } );
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];