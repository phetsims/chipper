// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Rule to check that a dispose function is present for objects that register observers and listeners.
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function( context ) {
  'use strict';

  // the following holds the possible ways to register various PhET listeners and observers
  // TODO: derivedProperty
  var OBSERVER_REGISTRATIONS = {
    LINK: 'link',
    LAZY_LINK: 'lazyLink',
    ON: 'on',
    MULTILINK: 'multilink',
    ADD_LISTENER: 'addListener',
    ADD_EVENT_LISTENER: 'addEventListener',
    ADD_INSTANCE: 'addInstance'
  };

  return {

    ExpressionStatement: function checkForDispose( node ) {

      // look through the AST of a typical observer registration, see https://github.com/phetsims/chipper/issues/418
      if ( node.expression &&
           node.expression.callee &&
           node.expression.callee.property &&
           node.expression.callee.property.name ) {
        var calleeName = node.expression.callee.property.name;
        for ( var key in OBSERVER_REGISTRATIONS ) {
          if( OBSERVER_REGISTRATIONS.hasOwnProperty( key ) ) {
            if( calleeName === OBSERVER_REGISTRATIONS[ key ] ) {
              // we have found an observer registration, start at the root and look through its tokens for dispose
              var disposeFound = false;
              var rootNode = context.getSourceCode().ast;
              if( rootNode &&
                  rootNode.tokens ) {
                rootNode.tokens.forEach( function( token ) {
                  if( token ) {
                    if( token.type === 'Identifier' &&
                        token.value === 'dispose' ) {
                      // we have found a dispose function
                      disposeFound = true;
                    }
                  }
                } );
              }
              if( !disposeFound ) {
                context.report( {
                  node: node,
                  loc: node.loc.start,
                  message: 'observer registration missing dispose function'
                } );
              }
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