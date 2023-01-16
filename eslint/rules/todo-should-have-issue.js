// Copyright 2002-2015, University of Colorado Boulder

/* eslint-disable todo-should-have-issue */

/**
 * @fileoverview Rule to check that certain TODOs have GitHub issues associated with them
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

module.exports = function( context ) {
  return {

    Program: function() {

      // These TODOs are to be copied over for the creator of a sim, so we will never want to link issues here. We
      // don't want to opt out in the repo package.json because we don't want that propagating to newly created sims also.
      if ( context.getFilename().match( new RegExp( `${'simula-rasa'}[/\\\\]js` ) ) ) {
        return;
      }

      const comments = context.getSourceCode().getAllComments();

      if ( comments ) {
        for ( let i = 0; i < comments.length; i++ ) {
          const comment = comments[ i ];

          if ( comment.value.indexOf( 'TODO' ) >= 0 ) {

            // '#' followed by any number of digits
            const missingIssueNumber = comment.value.search( /#\d+/ ) === -1;
            const missingLink = comment.value.indexOf( 'https://github.com/phetsims/' ) === -1;

            if ( missingLink && missingIssueNumber ) {
              context.report( {
                node: comment,
                loc: comment.loc.start,
                message: `TODO should have an issue: ${comment.value}`
              } );
            }
          }
        }
      }
    }
  };
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];