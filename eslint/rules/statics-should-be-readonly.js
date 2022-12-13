// Copyright 2022, University of Colorado Boulder
/**
 *
 * @author Agustín Vallejo (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @copyright 2022 University of Colorado Boulder
 */

module.exports = function( context ) {

  return {

    PropertyDefinition: node => {

      // No register call
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

module.exports.schema = [
  // JSON Schema for rule options goes here
];