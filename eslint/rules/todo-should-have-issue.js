// Copyright 2002-2015, University of Colorado Boulder
/**
 * @fileoverview Rule to check that certain TODOs have GitHub issues associated with them
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

module.exports = function( context ) {
  'use strict';

  // Whitelist of directories to check that TODOs have GitHub issues
  var directoriesToRequireIssues = [ 'joist/js' ];

  return {

    Program: function checkTodoShouldHaveIssue( node ) {

      // Check whether the given directory matches the whitelist
      var directoryShouldBeChecked = false;
      for ( var i = 0; i < directoriesToRequireIssues.length; i++ ) {
        var d = directoriesToRequireIssues[ i ];
        if ( context.getFilename().indexOf( d ) >= 0 ) {
          directoryShouldBeChecked = true;
          break;
        }
      }

      if ( directoryShouldBeChecked ) {
        var comments = context.getSourceCode().getAllComments();

        if ( comments ) {
          for ( i = 0; i < comments.length; i++ ) {
            var comment = comments[ i ];
            if ( comment.value.indexOf( 'TODO' ) >= 0 && comment.value.indexOf( 'https://github.com/phetsims/' ) === -1 ) {
              context.report( {
                node: node,
                loc: node.loc.start,
                message: 'TODO should have an issue: ' + comment.value
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