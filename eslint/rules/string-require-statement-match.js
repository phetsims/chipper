// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Rule to check that a require statement assigns to the correct variable name for the string! plugin.
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  'use strict';

  // Adapted from Stack Overflow, see http://stackoverflow.com/questions/25085306/javascript-space-separated-string-to-camelcase
  function toCamelCase( string ) {
    var out = '';

    // Add whitespace after each digit so that strings like myString1pattern will get camelcased with uppercase P
    var withWhitespaceAfterDigits = string.replace( /\d/g, function( a ) {return a + ' ';} ).trim();

    // Split on whitespace, remove whitespace and uppercase the first word in each term
    withWhitespaceAfterDigits.split( ' ' ).forEach( function( element, index ) {
      out += (index === 0 ? element : element[ 0 ].toUpperCase() + element.slice( 1 ));
    } );

    // lowercase the first character
    if ( out.length > 1 ) {
      out = out.charAt( 0 ).toLowerCase() + out.slice( 1 );
    }
    else if ( out.length === 1 ) {
      out = out.toLowerCase();
    }

    return out;
  }

  return {

    // Similar to the require-statement-match.js, please visit that file for AST example
    VariableDeclaration: function requireStatementMatch( node ) {

      if ( node.declarations &&
           node.declarations.length > 0 &&
           node.declarations[ 0 ].init &&
           node.declarations[ 0 ].init.arguments &&
           node.declarations[ 0 ].init.arguments.length > 0 ) {
        if ( node.declarations[ 0 ].init &&
             node.declarations[ 0 ].init.callee.name === 'require' ) {
          var varName = node.declarations[ 0 ].id.name;
          var rhs = node.declarations[ 0 ].init.arguments[ 0 ].value;

          if ( rhs && rhs.indexOf( 'string!' ) === 0 ) {

            var lastSlash = rhs.lastIndexOf( '/' );
            var key = rhs.substring( lastSlash + 1 );

            // Convert various separators to whitespace
            var withWhitespace = key.replace( /\./g, ' ' ).replace( /\-/g, ' ' ).replace( /\_/g, ' ' );

            // Convert whitespace delimited string to camel case and append string suffix
            var desiredVarName = toCamelCase( withWhitespace ) + 'String';

            if ( varName !== desiredVarName ) {
              context.report( {
                node: node,
                loc: node.loc.start,
                message: 'Mismatched var in require(string!), ' +
                         'key=' + key + ', ' +
                         'var=' + varName + ', ' +
                         'desiredVar=' + desiredVarName
              } );
            }
          }
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];