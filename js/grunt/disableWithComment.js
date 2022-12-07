// Copyright 2022, University of Colorado Boulder

/**
 * A script that should only be run when factoring out disable-eslint comments so that we can turn on
 * Unicorn's no-abusive-disable-line rule.
 * The regex used to delete eslint-disable-line ^(.*) // ?eslint-disable-line$
 *
 * @author Marla Schulz (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

const fs = require( 'fs' );

/**
 * @param {ESLint.LintResult[]} results - the results from eslint.lintFiles( patterns )
 *                                      - { filePath: string, errorCount: number, warningCount: number }
 *                                      - see https://eslint.org/docs/latest/developer-guide/nodejs-api#-lintresult-type
 */
module.exports = results => {

  const errors = results.filter( result => result.errorCount > 0 );
  errors.forEach( error => {
    error.messages.forEach( message => {
      if ( !message.fix ) {
        const fileContents = fs.readFileSync( error.filePath, 'utf-8' );
        const fileLines = fileContents.split( /\r?\n/ );

        if ( fileLines[ message.line - 1 ].includes( 'eslint-disable-line' ) ) {
          fileLines[ message.line - 1 ] += `, ${message.ruleId}`;
        }
        else {
          fileLines[ message.line - 1 ] += ` // eslint-disable-line ${message.ruleId}`;
        }

        const newFileContents = fileLines.join( '\n' );
        fs.writeFileSync( error.filePath, newFileContents );
      }
    } );
  } );
};