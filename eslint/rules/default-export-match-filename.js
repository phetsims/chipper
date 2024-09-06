// Copyright 2023, University of Colorado Boulder

/**
 * Lint rule to detect when an exported class name does not match its file name.
 *
 * @author Marla Schulz (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

module.exports = {
  create: context => {
    return {
      ExportDefaultDeclaration: node => {

        if ( node.declaration && node.declaration.id && node.declaration.id.name ) {
          // Get the class name from the export default declaration
          const exportName = node.declaration.id.name;

          // Get the filename without extension
          const filename = context.getFilename().replace( /^.*[\\/]/, '' ).replace( /\.[^/.]+$/, '' );

          // Check if the exported class or function name and filename match
          if ( exportName !== filename ) {
            context.report( {
              node: node,
              message: `The default exported member "${exportName}" does not match the filename "${filename}". They should be identical.`
            } );
          }
        }
      }
    };
  }
};