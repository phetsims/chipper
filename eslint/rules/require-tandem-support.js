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

  // Whitelist of directories to check that TODOs have GitHub issues
  var directoriesToRequireIssues = [ 'sun/js', 'scenery-phet/js' ];

  return {

    Program: function checkCopyright( node ) {

      // Check whether the given directory matches the whitelist
      var directoryShouldBeChecked = false;
      for ( var i = 0; i < directoriesToRequireIssues.length; i++ ) {
        var d = directoriesToRequireIssues[ i ];
        if ( context.getFilename().indexOf( d ) >= 0 ) {
          directoryShouldBeChecked = true;
          break;
        }
      }

      if ( directoryShouldBeChecked ) {
        var source = context.getSource();

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