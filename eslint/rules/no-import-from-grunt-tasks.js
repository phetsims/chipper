// Copyright 2024, University of Colorado Boulder

/**
 * @fileoverview no-import-from-grunt-tasks
 * Fails if import a file from grunt/tasks if you are not in that file. Note this doesn't check require() statements,
 * as that pattern is deprecated and new code shouldn't be using it anyways.
 * @copyright 2023 University of Colorado Boulder
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const hasFileSlash = /[\\/]/;
const isGruntTaskFileRegex = /[\\/]grunt[\\/]tasks[\\/]/;
const isGruntTaskUilsFileRegex = /[\\/]grunt[\\/]tasks[\\/]util[\\/]/;
const path = require( 'path' );

module.exports = {
  create: context => {

    const filename = context.filename;
    const dir = path.dirname( filename );
    if ( !isGruntTaskFileRegex.test( filename ) ) {
      return {
        ImportDeclaration: node => {
          const importValue = node.source.value;
          const fullImportFilename = path.join( dir, importValue ); // Absolute path

          // Don't check on something like 'fs' && check on the absolute path to support something like './tasks/x.js' &&
          // allow using getOption/getRepo from outside the directory
          if ( hasFileSlash.test( importValue ) && isGruntTaskFileRegex.test( fullImportFilename ) &&
               !isGruntTaskUilsFileRegex.test( fullImportFilename ) ) {
            context.report( {
              node: node,
              loc: node.loc,
              message: `importing from grunt/tasks should only be done in grunt/tasks/: ${importValue.replace( '/..', '' )}`
            } );
          }
        }
      };
    }
    return {};
  }
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];