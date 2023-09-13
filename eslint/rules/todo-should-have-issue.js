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

// For some reason
// const todoMatcherFixerRegex = /TODO(.*\r*)*\n/;

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

            if ( comment.value.indexOf( 'TODO' ) >= 0 ) {

              // '#' followed by any number of digits
              const missingIssueNumber = comment.value.search( issueShorthandRegex ) === -1;
              const missingLink = comment.value.search( urlRegex ) === -1;

              if ( missingLink && missingIssueNumber ) {
                context.report( {
                  node: comment,
                  loc: comment.loc.start,
                  message: `TODO should have an issue: ${comment.value}`,
                  fix: fixer => {

                    const range = comment.range;
                    let insertionSpot = range[ 1 ];
                    if ( comment.type === 'Block' ) {
                      const match = comment.value.match( /TODO(.*\r)*\n/ );

                      // no match would be something like function( /* is this thing on */ ), so at the end is fine
                      if ( match ) {
                        const lengthToEndOfTODOLine = match.index + match[ 0 ].length;

                        // Set the end range to just after the line with a to-do
                        insertionSpot = range[ 0 ] + lengthToEndOfTODOLine;
                      }
                      else {
                        // no match would be something like function( /* is this thing on */ ), so at the end minus closing comment
                        insertionSpot -= 3;
                      }
                    }

                    // a central issue to hold all TODOs
                    return fixer.replaceTextRange( [ insertionSpot, insertionSpot + 1 ], ' https://github.com/phetsims/tasks/issues/1129' );
                  }
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