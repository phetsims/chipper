// Copyright 2023, University of Colorado Boulder

/**
 * This module exports a rule for ESLint. The rule checks that when calling the createTandem method,
 * the argument passed to createTandem should match the name of the variable or property it's being assigned to.
 *
 * The rule analyzes VariableDeclaration and AssignmentExpression nodes in the AST,
 * checking the value passed to the createTandem method and comparing it with the name of the variable or property.
 * If the names do not match, it reports an error.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const upperSnakeToCamel = str => {
  return str.toLowerCase().replace( /(_\w)/g, m => m[ 1 ].toUpperCase() );
};

/**
 * Allow cases like MY_TANDEM matching myTandem.
 */
const matchesNamingConvention = ( tandemName, variableName ) => {
  const variableNameCamel = upperSnakeToCamel( variableName );

  return ( tandemName === variableNameCamel ) ||
         ( tandemName === variableName ) ||
         ( tandemName === 'tandemName' ) ||
         ( variableName === '_' + tandemName );
};

module.exports = {
  create( context ) {
    return {
      VariableDeclaration( node ) {
        const { declarations } = node;

        declarations.forEach( declaration => {
          const variableName = declaration.id.name;
          const tandemName = getCreateTandemCallArgument( declaration.init );

          if ( tandemName && !matchesNamingConvention( tandemName, variableName ) ) {
            context.report( {
              node: node,
              message: `The variable name "${variableName}" does not match the argument passed to createTandem "${tandemName}"`
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
            const variableName = isThisExpression ? propertyName : propertyName.replace( 'this.', '' );
            const tandemName = getCreateTandemCallArgument( node.right );

            if ( tandemName && !matchesNamingConvention( tandemName, variableName ) ) {
              context.report( {
                node: node,
                message: `The property name "${variableName}" does not match the argument passed to createTandem "${tandemName}"`
              } );
            }
          }
        }
      }
    };

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

              const callee = getFullCallerName( createTandemCall.callee.object );

              // If the tandem is something like: myAccordionBoxTandem.createTandem('theChild') then the const variable may have
              // a name like myAccordionBoxChild, so we need to remove the 'Tandem' part from the name before checking.
              if ( callee === 'tandem' || callee === 'options.tandem' || callee === 'providedOptions.tandem' ) {

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
      }

      return null;
    }
  }
};