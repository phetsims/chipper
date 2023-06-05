// Copyright 2023, University of Colorado Boulder

/**
 * Lint rule to detect when an exported class name does not match its file name.
 *
 * @author Marla Schulz (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

module.exports =
  context => {
    return {
      ExportDefaultDeclaration: node => {

        if ( node.declaration && node.declaration.id && node.declaration.id.name ) {
          // Get the class name from the export default declaration
          const className = node.declaration.id.name;

          // Get the filename without extension
          const filename = context.getFilename().replace( /^.*[\\/]/, '' ).replace( /\.[^/.]+$/, '' );

          // Check if the class name and filename match
          if ( className !== filename ) {
            context.report( {
              node: node,
              message: `The default exported class "${className}" does not match the filename "${filename}". They should be identical.`
            } );
          }
        }
      }
    };
  };