// Copyright 2015, University of Colorado Boulder
/**
 * @fileoverview Rule to check that each file exports something matching the filename to a namespace
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

module.exports = function( context ) {
  'use strict';

  return {
    Program: function checkNamespace( node ) {

      // Only check namespace declarations for files other than *-config.js and *-main.js
      var filename = context.getFilename();
      var isNamespaceRequired = filename.indexOf( '-config.js' ) < 0 && filename.indexOf( '-main.js' ) < 0;
      if ( isNamespaceRequired ) {

        // Check for the existence of the registration of the type or instance that matches the filename.
        // Inner types are not checked (must be addressed manually)
        var filenamePrefix = filename.substring( filename.lastIndexOf( '/' ) + 1, filename.lastIndexOf( '.' ) );
        var fullText = context.getSourceCode().getText();
        var expectedText = '.register( \'' + filenamePrefix + '\', ' + filenamePrefix + ' );';
        var containsNamespaceText = fullText.indexOf( expectedText ) >= 0;
        if ( !containsNamespaceText ) {

          // If there is no register call, check if it is a namespace declaration file (which doesn't do any register
          // calls)
          var declaresNamespace = fullText.indexOf( 'return new Namespace' ) >= 0;
          if ( !declaresNamespace ) {
            context.report( {
              node: node,
              loc: 1,
              message: 'Missing ' + expectedText
            } );
          }
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];