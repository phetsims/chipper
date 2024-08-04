// Copyright 2023, University of Colorado Boulder

/**
 * tandem-name-should-match
 *
 * This module exports a rule for ESLint. The rule checks that when calling the createTandem method,
 * the argument passed to createTandem should match the name of the variable or property it's being assigned to.
 *
 * The rule analyzes VariableDeclaration and AssignmentExpression nodes in the AST,
 * checking the value passed to the createTandem method and comparing it with the name of the variable or property.
 * If the names do not match, it reports an error.
 *
 * Certain behaviors of this rule that may seem confusing in certain cases are labelled inline with `QUIRK:`
 *
 * Cases that are not supported by this rule:
 *
 * 1. New directives onto options or providedOptions properties:
 * options.titleNode = new RichText( . . . )
 *
 * 2. Templated variables:
 * tandem.createTandem( 'myArray${index}` )
 *
 * // NOT SUPPORTED
 * createTandem as an argument instead of in options: const x = new Something( tandem.createTandem( 'notX' ) )
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const _ = require( 'lodash' );

module.exports = {
  create( context ) {
    return {
      VariableDeclaration( node ) {
        const { declarations } = node;

        declarations.forEach( declaration => {
          let variableName = declaration.id.name;

          if ( variableName ) {

            // QUIRK: If creating an options object outside the new operator, don't require it to be `myTypeOptions`,
            // but instead `myType`
            if ( variableName.endsWith( 'Options' ) ) {
              variableName = variableName.replace( 'Options', '' );
            }

            const tandemName = getCreateTandemCallArgument( declaration.init );

            if ( tandemName && !matchesNamingConvention( tandemName, variableName ) ) {
              context.report( {
                node: node,
                message: `The variable name "${variableName}" does not match the argument passed to createTandem "${tandemName}"`
              } );
            }
          }
        } );
      },

      AssignmentExpression( node ) {
        if ( node.left.type === 'MemberExpression' ) {
          const propertyName = node.left.property.name;
          const isOptionsObject = node.left.object.name && ( node.left.object.name === 'options' || node.left.object.name.endsWith( 'Options' ) );

          if ( propertyName && !isOptionsObject ) {

            // If the property is a part of 'this', we remove 'this.' from the property name
            const tandemName = getCreateTandemCallArgument( node.right );

            if ( tandemName && !matchesNamingConvention( tandemName, propertyName ) ) {
              context.report( {
                node: node,
                message: `The property name "${propertyName}" does not match the argument passed to createTandem "${tandemName}"`
              } );
            }
          }
        }
      }
    };
  }
};

/**
 * QUIRK: We map certain spellings into camel case for comparison.
 * For example, allow cases like MY_TANDEM or _myTandem matching myTandem.
 */
const matchesNamingConvention = ( tandemName, variableName ) => {
  const variableNameCamel = _.camelCase( variableName );

  return ( tandemName === variableNameCamel ) ||
         ( tandemName === variableName ) ||
         ( '_' + tandemName === variableName );
};

/**
 *
 * @param memberExpressionNode - an AST node
 * @returns {string}
 */
function getFullCallerName( memberExpressionNode ) {
  if ( memberExpressionNode.type === 'Identifier' ) {
    return memberExpressionNode.name;
  }
  else if ( memberExpressionNode.type === 'MemberExpression' ) {
    return getFullCallerName( memberExpressionNode.object ) + '.' + memberExpressionNode.property.name;
  }
  return '';
}

/**
 * This function analyzes the given node and retrieves the argument passed to the createTandem method.
 * It expects the node to be either a NewExpression or a CallExpression.
 * If it finds a 'tandem' property, it checks the callee to see if it's a call to createTandem,
 * then retrieves and returns the first argument of the call.
 * @returns {string|null}
 */
function getCreateTandemCallArgument( node ) {
  if ( node && ( node.type === 'NewExpression' || node.type === 'CallExpression' ) ) {
    const { arguments: args } = node;
    const lastArgument = args[ args.length - 1 ];

    // An object literal as a parameter to the `new Type()` or `myFunction()` call
    if ( lastArgument && lastArgument.type === 'ObjectExpression' ) {

      // Find if "tandem" is the name of a key in the object
      const tandemProperty = lastArgument.properties.find(
        prop => prop.key?.name === 'tandem'
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

          const callee = getFullCallerName( createTandemCall.callee.object );

          // QUIRK: If the tandem is something like: myAccordionBoxTandem.createTandem('theChild') then the const variable may have
          // a name like myAccordionBoxChild, so we need to remove the 'Tandem' part from the name before checking.
          if ( callee === 'tandem' || callee === 'options.tandem' || callee === 'providedOptions.tandem' ) {

            const argument = createTandemCall.arguments[ 0 ];

            // createTandem( 'myString' ) <-- "Literal"
            // createTandem( myVar ) <-- "Identifier"
            // createTandem( `my${template}Var` ) <-- "TemplateElement"
            switch( argument.type ) {
              case 'Literal':
                return argument.value;
              case 'Identifier':

                // Variable names cannot be tested against. For instance, const myProperty = new Property({tandem:myTandemVariable}) should never match.
                return null;
              default:
                return null;
            }
          }
        }
      }
    }
  }

  return null;
}