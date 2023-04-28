// Copyright 2022, University of Colorado Boulder
/**
 * @fileoverview If your default export for a file is a class, then it must have a register call to the repo namespace
 * for PhET code.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @copyright 2022 University of Colorado Boulder
 */

const _ = require( 'lodash' );

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------


// Repos without a namespace that don't require these register calls.
const optOutRepos = [ 'aqua', 'phet-io-wrappers', 'quake', 'studio' ];

module.exports = function( context ) {

  const filename = context.getFilename();

  // Javascript string escape the regex escape backslash too (4 backslashes!!)
  if ( _.some( optOutRepos, repo => new RegExp( `[\\\\/]${repo}[\\\\/]` ).test( filename ) ) ) {
    return {}; // No-op rule
  }

  const classNames = [];
  return {

    ClassDeclaration: node => {
      classNames.push( node.id.name );
    },

    ExportDefaultDeclaration: node => {

      // Has a class default export
      if ( node.declaration.type === 'ClassDeclaration' ||
           ( node.declaration && node.declaration.name && classNames.includes( node.declaration.name ) ) ) {

        // No register call
        if ( !context.getSourceCode().text.includes( '.register( \'' ) ) {
          context.report( {
            node: node,
            loc: node.loc,
            message: 'File default exports a class but has no namespace registration'
          } );
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];