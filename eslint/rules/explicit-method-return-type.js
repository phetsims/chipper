// Copyright 2022, University of Colorado Boulder
/**
 * @fileoverview Rule that checks for missing return types on method definitions for TypeScript files.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2022 University of Colorado Boulder
 */

const { ESLintUtils } = require( '@typescript-eslint/utils/' ); // eslint-disable-line

// these are still MethodDefinition nodes, but don't require an annotation
const exemptMethods = [ 'get', 'set', 'constructor' ];

module.exports = {
  meta: {
    type: 'problem',
    fixable: 'code'
  },
  create: context => {
    return {
      MethodDefinition: node => {
        if ( !exemptMethods.includes( node.kind ) && node.value && !node.value.returnType ) {

          context.report( {
            message: 'Missing return type.',
            node: node,
            fix: fixer => {

              // Get the type checker.
              const parserServices = ESLintUtils.getParserServices( context );
              const checker = parserServices.program.getTypeChecker();

              // Had help from an example here to get the return type from a method declaration as a string:
              // https://stackoverflow.com/questions/47215069/how-to-use-typescript-compiler-api-to-get-normal-function-info-eg-returntype-p
              const tsNode = parserServices.esTreeNodeToTSNodeMap.get( node );
              const signature = checker.getSignatureFromDeclaration( tsNode );
              const returnType = checker.getReturnTypeOfSignature( signature );
              const returnTypeString = checker.typeToString( returnType );

              // start location of the function body, insert the return type just before this and add an extra space
              const bodyStart = node.value.body.range[ 0 ];
              return fixer.insertTextBeforeRange( [ bodyStart - 1, bodyStart ], `: ${returnTypeString} ` );
            }
          } );
        }
      }
    };
  }
};