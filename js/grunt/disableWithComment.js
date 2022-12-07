// Copyright 2022, University of Colorado Boulder

/**
 * A script that should only be run when factoring out disable-eslint comments so that we can turn on
 * Unicorn's no-abusive-disable-line rule.
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

  const errorInfoArray = errors.map( error => {
    const errorInfo = {};
    errorInfo.filePath = error.filePath;

    error.messages.forEach( message => {
      errorInfo.line = message.line;
      errorInfo.ruleId = message.ruleId;
    } );

    return errorInfo;
  } );

  errorInfoArray.forEach( error => {
    const fileContents = fs.readFileSync( error.filePath, 'utf-8' );
    const fileLines = fileContents.split( /\r?\n/ );
    fileLines[ error.line - 1 ] += ` // eslint-disable-line ${error.ruleId}`;
    const newFileContents = fileLines.join( '\n' );
    fs.writeFileSync( error.filePath, newFileContents );
  } );
};