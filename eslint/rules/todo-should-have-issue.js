// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Rule to check that certain TODOs have GitHub issues associated with them
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

/* eslint-env node */
'use strict';

module.exports = function( context ) {

  // Whitelist of directories to check that TODOs have GitHub issues
  const directoriesToRequireIssues = [ /joist[/\\]js/ ];

  return {

    Program: function checkTodoShouldHaveIssue( node ) {

      // Check whether the given directory matches the whitelist
      let directoryShouldBeChecked = false;
      for ( let i = 0; i < directoriesToRequireIssues.length; i++ ) {
        const d = directoriesToRequireIssues[ i ];
        if ( context.getFilename().match( d ) ) {
          directoryShouldBeChecked = true;
          break;
        }
      }

      if ( directoryShouldBeChecked ) {
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
                  message: 'TODO should have an issue: ' + comment.value
                } );
              }
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