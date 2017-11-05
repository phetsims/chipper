// Copyright 2016, University of Colorado Boulder
/**
 * @fileoverview Rule to check that an assignment in a constructor provides @public or @private visibility annotation
 *               Developed with https://astexplorer.net/
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2016 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  'use strict';

  return {

    AssignmentExpression: function propertyVisibilityAnnotation( node ) {

      if ( node.left && node.left && node.left.object && node.left.object.type === 'ThisExpression' ) {
        var leadingComments = node.parent.leadingComments;
        var i;
        var a;
        var isAnnotated = false;
        if ( leadingComments ) {
          for ( i = 0; i < leadingComments.length; i++ ) {
            a = leadingComments[ i ];
            if ( a.value.indexOf( '@public' ) >= 0 || a.value.indexOf( '@private' ) >= 0 ) {
              isAnnotated = true;
            }
          }
        }

        var trailingComments = node.parent.trailingComments;
        if ( trailingComments ) {
          for ( i = 0; i < trailingComments.length; i++ ) {
            a = trailingComments[ i ];
            if ( a.value.indexOf( '@public' ) >= 0 || a.value.indexOf( '@private' ) >= 0 ) {
              isAnnotated = true;
            }
          }
        }
      }

      if ( node.parent && node.parent.parent && node.parent.parent.parent ) {
        var parentFunction = node.parent.parent.parent;
        if ( parentFunction.id && parentFunction.id.name ) {
          if ( parentFunction.type === 'FunctionDeclaration' && parentFunction.id.name[ 0 ].toUpperCase() === parentFunction.id.name[ 0 ] ) {
            if ( !isAnnotated ) {
              context.report( {
                node: node,
                loc: node.loc.start,
                message: 'missing visibility annotation'
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