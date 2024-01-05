// Copyright 2024, University of Colorado Boulder

const path = require( 'path' );

/**
 * Lint detector that requires each file to list at least one @author annotation.
 *
 *  @author Sam Reid (PhET Interactive Simulations)
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Lint rule that requires each source file to have at least one @author annotation.'
    },
    messages: {
      missingAuthor: 'Each file must have at least one @author annotation.'
    }
  },
  create: function( context ) {
    return {
      Program: function( node ) {

        // Get the filename of the current file
        const filename = context.getFilename();

        // Check if the file is an HTML file
        if ( path.extname( filename ) === '.html' ) {
          // Skip linting for HTML files
          return;
        }

        // get the filename for the path
        if ( filename.endsWith( 'Gruntfile.js' ) ) {
          // Skip linting for Gruntfile.js
          return;
        }

        // Get all comments in the file
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getAllComments();

        // Check if any comment contains @author
        const hasAuthor = comments.some( comment => /@author/.test( comment.value ) );

        // Report an error if no author annotation is found
        if ( !hasAuthor ) {
          context.report( {
            node: node,
            messageId: 'missingAuthor'
          } );
        }
      }
    };
  }
};
