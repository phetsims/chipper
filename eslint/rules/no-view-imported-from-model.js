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
const isModelScreenViewFolder = /[\\/]model[\\/]view[\\/]/; // for the rare case where a `model` screen has a `view` folder.

module.exports = context => {
  const filename = context.getFilename();

  // select paths like "/model/" without the false positive of "/model/view/" which could happen if the screen was model
  if ( isModelFileRegex.test( filename ) && !isModelScreenViewFolder.test( filename ) ) {
    return {
      ImportDeclaration: node => {
        const importValue = node.source.value;

        // If the import has /view/ in it.
        if ( isViewFileRegex.test( importValue ) ) {

          // Some special cases that are too common for PhET to care about this failure for.
          if ( node.importKind !== 'type' && // importing is not as bad
               !importValue.endsWith( 'Colors.js' ) && // Colors files are auto generated and in the view
               !importValue.endsWith( 'ModelViewTransform2.js' ) ) { // Enough cases to warrant taking it out here.
            context.report( {
              node: node,
              loc: node.loc,
              message: `model import statement should not import the view: ${importValue.replace( '/..', '' )}`
            } );
          }
        }
      }
    };
  }
  return {};
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];