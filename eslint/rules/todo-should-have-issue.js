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

      // Explicitly ignore files from the simula-rasa repo. simula-rasa is the template for new simulations that are
      // created using 'grunt create-sim'. simula-rasa's code contains TODOs that should be addressed by the creator
      // of the new simulation. So we do not want those TODOs to have an associated GitHub issue. And we do not want
      // to opt-out of this rule in simula-rasa/package.json, because it will be propagated to the new sim.
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