// Copyright 2022, University of Colorado Boulder
/**
 * @fileoverview Lint rule to ensure that variable namess of type AXON Property end in "Property"
 *
 * I used https://typescript-eslint.io/play/#showAST=es to determine which AST nodes to look for.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @copyright 2022 University of Colorado Boulder
 */

const { ESLintUtils } = require( '@typescript-eslint/utils/' ); // eslint-disable-line require-statement-match

module.exports = {
  meta: {
    type: 'problem'
    // fixable: 'code'
  },
  create: context => {
    return {

      /**
       * AST Node for a class property (NOT an axon Property).
       */
      PropertyDefinition: node => {
        if ( node.key ) {

          // This is the AST node for the variiable (child of the PropertyDefinition)
          const propertyNode = node.key;

          // Get the name of the type from the type checker
          const parserServices = ESLintUtils.getParserServices( context );
          const checker = parserServices.program.getTypeChecker();
          const tsNode = parserServices.esTreeNodeToTSNodeMap.get( propertyNode );
          const variableType = checker.getTypeAtLocation( tsNode );

          const typeString = checker.typeToString( variableType );

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
            const isPropertyNamed = propertyNode.name.endsWith( 'Property' ) || propertyNode.name === 'property' ||
                                    propertyNode.name === '_property';

            if ( !isPropertyNamed ) {
              context.report( {
                message: 'Property variable missing Property suffix.',
                node: propertyNode
              } );
            }
          }
        }
      }
    };
  }
};
