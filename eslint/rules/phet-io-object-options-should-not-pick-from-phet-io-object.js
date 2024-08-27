// Copyright 2023, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

module.exports = {
  create( context ) {
    return {
      TSTypeReference( node ) {
        const higherOrderTypes = [

          // PhET types
          'OptionalKeys', 'PickOptional', 'PickRequired', 'RequiredOption', 'RequiredOption', 'StrictOmit', 'WithOptional', 'WithRequired',

          // Built-in TS Types
          'Pick', 'Optional', 'Partial', 'Omit', 'Exclude', 'Extract'
        ];
        if ( node.typeName && higherOrderTypes.includes( node.typeName.name ) ) {
          const args = node.typeArguments.params;
          if ( args.some( arg => arg.type === 'TSTypeReference' && arg.typeName.name === 'PhetioObject' ) ) {
            context.report( {
              node: node,
              message: `Do not use PhetioObject in ${node.typeName.name}. Use PhetioObjectOptions instead.`
            } );
          }
        }
      }
    };
  }
};