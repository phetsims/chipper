// Copyright 2022, University of Colorado Boulder
/**
 * @fileoverview Rule that checks for missing return types on method definitions for TypeScript files.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2022 University of Colorado Boulder
 */

// these are still MethodDefinition nodes, but don't require an annotation
const exemptMethods = [ 'get', 'set', 'constructor' ];

module.exports = context => {
  return {
    MethodDefinition: node => {
      if ( !exemptMethods.includes( node.kind ) && node.value && !node.value.returnType ) {
        context.report( {
          message: 'Missing return type.',
          node: node
        } );
      }
    }
  };
};