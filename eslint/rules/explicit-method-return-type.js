// Copyright 2022, University of Colorado Boulder
/**
 * @fileoverview Rule that checks for missing return types on method definitions and function declarations for
 * TypeScript files.
 *
 * We could not use the built-in rule explicit-function-return-type because it does not support a way to skip functions
 * defined in a variable declaration. Functions defined like this typically have a local usage scope, and the team
 * decided that we don't need them to have a return type.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @copyright 2022 University of Colorado Boulder
 */

const { ESLintUtils } = require( '@typescript-eslint/utils/' ); // eslint-disable-line require-statement-match

// these are still MethodDefinition nodes, but don't require an annotation
const exemptMethods = [ 'get', 'set', 'constructor' ];

/**
 * Use the type checker to get the return type as a string from the eslint context and AST Node.
 * @param {Context} context - https://eslint.org/docs/latest/developer-guide/working-with-rules#the-context-object
 * @param node - The AST Node
 */
const getReturnTypeString = ( context, node ) => {

  // Get the type checker.
  const parserServices = ESLintUtils.getParserServices( context );
  const checker = parserServices.program.getTypeChecker();

  // Had help from an example here to get the return type from a method declaration as a string:
  // https://stackoverflow.com/questions/47215069/how-to-use-typescript-compiler-api-to-get-normal-function-info-eg-returntype-p
  const tsNode = parserServices.esTreeNodeToTSNodeMap.get( node );
  const signature = checker.getSignatureFromDeclaration( tsNode );
  const returnType = checker.getReturnTypeOfSignature( signature );

  return checker.typeToString( returnType );
};

/**
 * Inserts the returnTypeString at the provided location.
 * @param {ASTNode|undefined} functionBody - node.body from the AST (may momentarily be undefined while editing)
 * @param returnTypeString
 * @param fixer
 * @returns {boolean|*}
 */
const insertReturnType = ( functionBody, returnTypeString, fixer ) => {
  if ( functionBody ) {
    const bodyStartLocation = functionBody.range[ 0 ];

    // At this time, the rule is on with no errors on the project, if in the future we wanted to improve the fixer. . .
    // * do Range/Node etc as a second fix to easily find spots where we are using the DOM type.
    // * any should be filled in themselves.
    // * look into some derivedProperty or other Property returns. Perhaps do those manually.
    if ( returnTypeString !== 'any' && ![ 'Image', 'Range', 'Text', 'Node', 'Event' ].includes( returnTypeString ) &&
         !returnTypeString.includes( 'Property' ) ) {

      // location - 1 adds an extra space after the return type name
      return fixer.insertTextBeforeRange( [ bodyStartLocation - 1, bodyStartLocation ], `: ${returnTypeString} ` );
    }
  }

  return false;
};

module.exports = {
  meta: {
    type: 'problem',
    fixable: 'code'
  },
  create: context => {
    return {
      FunctionDeclaration: node => {
        if ( !node.returnType ) {

          context.report( {
            message: 'Missing return type.',
            node: node,

            // Comment out for next time we need this fixer, but it requires type info, where the rule doesn't, so don't always include it.
            fix: fixer => {

              const returnTypeString = getReturnTypeString( context, node );
              return insertReturnType( node.body, returnTypeString, fixer );
            }
          } );
        }
      },
      MethodDefinition: node => {
        if ( !exemptMethods.includes( node.kind ) && node.value && !node.value.returnType ) {

          context.report( {
            message: 'Missing return type.',
            node: node,

            // Comment out for next time we need this fixer, but it requires type info, where the rule doesn't, so don't always include it.
            fix: fixer => {

              const returnTypeString = getReturnTypeString( context, node );
              return insertReturnType( node.value.body, returnTypeString, fixer );
            }
          } );
        }
      }
    };
  }
};