// Copyright 2024, University of Colorado Boulder

/**
 * @fileoverview no-import-from-grunt-tasks
 * Fails if a task in grunt/tasks/ doesn't use kebab case. This is because often these have camelCase counterparts
 * that are imported modules. These kebab-case tasks are just entry points, which hold a thin layer wrapping the module
 * plus option support.
 * @copyright 2024 University of Colorado Boulder
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const isGruntTaskFileRegex = /[\\/]grunt[\\/]tasks[\\/]?/;
const validKebabCase = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const path = require( 'path' );

module.exports = {
  create: function( context ) {
    return {
      Program: function( node ) {
        const filePath = context.filename;
        const parsed = path.parse( filePath );

        // in grunt/tasks/
        if ( isGruntTaskFileRegex.test( filePath ) &&

             // top level only
             parsed.dir.endsWith( 'tasks' ) &&

             // not valid kebab-case
             !validKebabCase.test( parsed.name ) ) {

          context.report( {
            node: node,
            loc: node.loc,
            message: `files in "grunt/tasks/" must use kebab-case by convention (no snake or camel): ${parsed.base}`
          } );
        }
      }
    };
  }
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];