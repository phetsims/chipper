// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Rule to check that a require statement assigns to the correct variable name for the string! plugin.
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

/* eslint-env node */
'use strict';

const _ = require( 'lodash' ); // eslint-disable-line

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {

  const ChipperStringUtils = require( '../../js/common/ChipperStringUtils' );

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
          const varName = node.declarations[ 0 ].id.name;
          const rhs = node.declarations[ 0 ].init.arguments[ 0 ].value;

          if ( rhs && rhs.indexOf( 'string!' ) === 0 ) {

            const lastSlash = rhs.lastIndexOf( '/' ); // Looking for the right side of `string!FRICTION/hello.goose`
            let key = rhs.substring( lastSlash + 1 );

            // For a11y strings, no need to prefix vars with "a11y"
            if ( ChipperStringUtils.isA11yStringKey( key ) ) {
              key = key.replace( ChipperStringUtils.A11Y_MARKER, '' );
            }

            // Convert various separators to whitespace
            const withWhitespace = key.replace( /[.\-_]/g, ' ' );

            // Convert whitespace delimited string to camel case and append string suffix
            const desiredVarName = _.camelCase( withWhitespace ) + 'String';

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