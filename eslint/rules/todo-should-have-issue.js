// Copyright 2002-2015, University of Colorado Boulder

/* eslint-disable todo-should-have-issue */

/**
 * @fileoverview Rule to check that certain TODOs have GitHub issues associated with them
 * @author Sam Reid (PhET Interactive Simulations)
 * @copyright 2015 University of Colorado Boulder
 */

const process = require( 'process' );
const path = require( 'path' );
const fs = require( 'fs' );

const issueShorthandRegex = /#(\d+)/;
const urlRegex = /https:\/\/github.com\/phetsims\/[-\w]+\/issues\/\d+/;
const filename = 'issuesFromTODOs.txt';
const todoIssuesFilepath = path.resolve( __dirname, `../../dist/${filename}` );

// Match a comment line containing a TO-DO
const containsTODO = string => string.includes( 'TODO' );

// Match a comment tagging a github issue
const hasIssueLink = string => {

  // '#' followed by any number of digits
  const missingIssueNumber = !issueShorthandRegex.test( string );
  const missingLink = !urlRegex.test( string );
  return !( missingLink && missingIssueNumber );
};

/**
 * Match if a comment is a line comment, and an immediately proceeding line comment contains the github issue, like:
 *
 * // TO DO (purposefully misspelled) - Do something helpful
 * // See https://github.com/phetsims/chipper/issues/X
 *
 * @param {Comment[]} comments
 * @param {number} index
 * @returns {boolean}
 */
const nextCommentsHaveIssue = ( comments, index ) => {
  const todoComment = comments[ index ];

  let hasIssueInNextComments = false;
  if ( todoComment.type === 'Line' ) {

    let previousLine = todoComment.loc.start.line;

    for ( let i = index + 1; i < comments.length; i++ ) {
      const currentComment = comments[ i ];

      // No next comment
      if ( !currentComment ||

           // next comment is a block
           currentComment.type !== 'Line' ||

           // If nextComment is not on the next line
           currentComment.loc.start.line - 1 !== previousLine ) {
        break;
      }

      if ( hasIssueLink( currentComment.value ) ) {
        hasIssueInNextComments = true;
        break;
      }
      previousLine = currentComment.loc.start.line;
    }
  }
  return hasIssueInNextComments;
};

module.exports = {
  meta: {
    type: 'problem',
    fixable: 'code'
  },
  create: context => {
    return {
      meta: {
        type: 'problem',
        fixable: 'code'
      },
      Program: function() {
        const filename = context.getFilename();

        // Explicitly ignore files from the simula-rasa repo. simula-rasa is the template for new simulations that are
        // created using 'grunt create-sim'. simula-rasa's code contains TODOs that should be addressed by the creator
        // of the new simulation. So we do not want those TODOs to have an associated GitHub issue. And we do not want
        // to opt-out of this rule in simula-rasa/package.json, because it will be propagated to the new sim.
        if ( context.getFilename().includes( 'simula-rasa' ) ) {
          return;
        }

        const comments = context.getSourceCode().getAllComments();

        if ( comments ) {
          for ( let i = 0; i < comments.length; i++ ) {
            const comment = comments[ i ];

            if ( containsTODO( comment.value ) ) {
              if ( !hasIssueLink( comment.value ) && !nextCommentsHaveIssue( comments, i ) ) {
                context.report( {
                  node: comment,
                  loc: comment.loc.start,
                  message: `TODO should have an issue: ${comment.value}`
                } );
              }
              else if ( process.env.saveTODOIssues ) {
                let url = null;
                const urlMatch = comment.value.match( urlRegex );
                if ( urlMatch ) {
                  url = urlMatch[ 0 ];
                }

                const issueShorthandRegex = /#(\d+)/;
                const issueShorthandMatch = comment.value.match( issueShorthandRegex );
                const repoNameMatch = filename.match( /[\\/]([\w-]+)[\\/]js[\\/]/ );
                if ( issueShorthandMatch && repoNameMatch ) {
                  url = `https://github.com/phetsims/${repoNameMatch[ 1 ]}/issues/${issueShorthandMatch[ 1 ]}`;
                }

                if ( url ) {
                  fs.writeFileSync( todoIssuesFilepath, fs.readFileSync( todoIssuesFilepath ).toString() + `${url}\n` );
                }
              }
            }
          }
        }
      }
    };
  }
};

module.exports.schema = [
  // JSON Schema for rule options goes here
];