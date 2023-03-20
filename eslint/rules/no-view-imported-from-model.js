// Copyright 2023, University of Colorado Boulder

/**
 * @fileoverview no-view-imported-from-model
 * Fails is you import something from /view/ inside a model file with a path like /model/
 * @copyright 2023 University of Colorado Boulder
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const isModelFileRegex = /[\\/]model[\\/]/;
const isViewFileRegex = /[\\/]view[\\/]/;

module.exports = context => {
  if ( isModelFileRegex.test( context.getFilename() ) ) {
    return {
      ImportDeclaration: node => {
        if ( isViewFileRegex.test( node.source.value ) ) {
          context.report( {
            node: node,
            loc: node.loc,
            message: 'model import statement should not import the view.'
          } );
        }
      }
    };
  }
  return {};
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];