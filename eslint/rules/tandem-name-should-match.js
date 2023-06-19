// Copyright 2023, University of Colorado Boulder

/**
 * This module exports a rule for ESLint. The rule checks that when calling the createTandem method,
 * the argument passed to createTandem should match the name of the variable or property it's being assigned to.
 *
 * The rule analyzes VariableDeclaration and AssignmentExpression nodes in the AST,
 * checking the value passed to the createTandem method and comparing it with the name of the variable or property.
 * If the names do not match, it reports an error.
 */
module.exports = {
  create( context ) {
    return {
      VariableDeclaration( node ) {
        const { declarations } = node;

        declarations.forEach( declaration => {
          const variableName = declaration.id.name;
          const createTandemCallArgument = getCreateTandemCallArgument( declaration.init );

          if ( createTandemCallArgument && createTandemCallArgument !== variableName ) {
            context.report( {
              node: node,
              message: `The variable name "${variableName}" does not match the argument passed to createTandem "${createTandemCallArgument}"`
            } );
          }
        } );
      },

      AssignmentExpression( node ) {
        if ( node.left.type === 'MemberExpression' ) {
          const propertyName = node.left.property.name;
          const isThisExpression = node.left.object.type === 'ThisExpression';

          if ( propertyName ) {

            // If the property is a part of 'this', we remove 'this.' from the property name
            const cleanedPropertyName = isThisExpression ? propertyName : propertyName.replace( 'this.', '' );
            const createTandemCallArgument = getCreateTandemCallArgument( node.right );

            if ( createTandemCallArgument && createTandemCallArgument !== cleanedPropertyName ) {
              context.report( {
                node: node,
                message: `The property name "${cleanedPropertyName}" does not match the argument passed to createTandem "${createTandemCallArgument}"`
              } );
            }
          }
        }
      }
    };

    /**
     * This function analyzes the given node and retrieves the argument passed to the createTandem method.
     * It expects the node to be either a NewExpression or a CallExpression.
     * If it finds a 'tandem' property, it checks the callee to see if it's a call to createTandem,
     * then retrieves and returns the first argument of the call.
     */
    function getCreateTandemCallArgument( node ) {
      if ( node && ( node.type === 'NewExpression' || node.type === 'CallExpression' ) ) {
        const { arguments: args } = node;
        const lastArgument = args[ args.length - 1 ];

        if ( lastArgument && lastArgument.type === 'ObjectExpression' ) {
          const tandemProperty = lastArgument.properties.find(
            prop => prop.key.name === 'tandem'
          );

          if ( tandemProperty ) {
            const createTandemCall = tandemProperty.value;

            if (
              createTandemCall &&
              createTandemCall.callee && // We are now accessing the callee of the call
              createTandemCall.callee.property &&
              createTandemCall.callee.property.name === 'createTandem' &&
              createTandemCall.arguments && // Check if arguments array exists
              createTandemCall.arguments.length > 0 // Check if the array is not empty
            ) {
              const argument = createTandemCall.arguments[ 0 ];

              switch( argument.type ) {
                case 'Literal':
                  return argument.value;
                case 'Identifier':
                  return argument.name;
                default:
                  return null;
              }
            }
          }
        }
      }

      return null;
    }
  }
};