// Copyright 2022, University of Colorado Boulder
/**
 * @fileoverview Lint rule to ensure that variable names of type AXON Property end in "Property"
 *
 * We used https://typescript-eslint.io/play/#showAST=es to determine which AST nodes to look for.
 *
 * This is the best documentation I could find for working with the type checker (like using getTypeAtLocation):
 * https://raw.githubusercontent.com/microsoft/TypeScript/main/src/compiler/checker.ts
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @copyright 2022 University of Colorado Boulder
 */

const { ESLintUtils } = require( '@typescript-eslint/utils/' ); // eslint-disable-line require-statement-match

const visit = ( context, propertyNode ) => {

  // Get the name of the type from the type checker
  const parserServices = ESLintUtils.getParserServices( context );
  const checker = parserServices.program.getTypeChecker();
  const tsNode = parserServices.esTreeNodeToTSNodeMap.get( propertyNode );
  const variableType = checker.getTypeAtLocation( tsNode );

  // For optional fields, ' | undefined' will be appended to the type name. Those still need
  // a 'Property' suffix, but remove this part of the type string for the checks that follow.
  const typeString = checker.typeToString( variableType ).replace( ' | undefined', '' );

  // Matches things like "BooleanProperty" and "Property<boolean|null>"
  // If in the future this is not correct or complete, please note that complexity of the following
  // cases (and good luck!):
  //   * BooleanProperty[]
  //   * Property<boolean|null>[]
  //   * Map<string,BooleanProperty>
  //   * ( value: number) => BooleanProperty
  const isPropertyType = /^\w*Property(<.*>){0,1}$/.test( typeString );

  // Check that the type includes a property.
  if ( isPropertyType ) {

    // Not all types will have a node name, so nest this inside the Property type check.
    const isPropertyNamed = propertyNode.name.endsWith( 'Property' ) ||
                            propertyNode.name.endsWith( 'PROPERTY' ) ||
                            propertyNode.name === 'property' ||
                            propertyNode.name === '_property';

    if ( !isPropertyNamed ) {
      context.report( {
        message: 'Property variable missing Property suffix.',
        node: propertyNode
      } );
    }
  }
};

module.exports = {
  create: context => {
    return {

      // Local variables that are instances of a Property
      'VariableDeclarator > Identifier': node => {
        if ( node ) {
          visit( context, node );
        }
      },

      /**
       * AST Node for a class property (NOT an axon Property).
       */
      PropertyDefinition: node => {

        // node.key is the AST node for the variable (child of the PropertyDefinition)
        if ( node.key ) {
          visit( context, node.key );
        }
      },

      /**
       * Members of a TypeScript type alias.
       */
      TSTypeAliasDeclaration: node => {
        if ( node.typeAnnotation && node.typeAnnotation.members ) {
          node.typeAnnotation.members.forEach( member => {
            if ( member.key ) {
              visit( context, member.key );
            }
          } );
        }
      }
    };
  }
};
