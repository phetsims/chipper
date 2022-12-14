// Copyright 2022, University of Colorado Boulder
/**
 * Class properties that are static and use uppercase syntax should be readonly, like:
 *
 * class MyClass{
 *   public static readonly MY_STATIC = 4;
 * }
 *
 * @author Agustín Vallejo (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @copyright 2022 University of Colorado Boulder
 */

module.exports = function( context ) {

  return {

    PropertyDefinition: node => {
      if ( node.key.name && node.key.name === node.key.name.toUpperCase() && node.static && !node.readonly ) {
        context.report( {
          node: node,
          loc: node.loc,
          message: `Uppercase static field ${node.key.name} should be readonly`
        } );
      }
    }
  };
};
