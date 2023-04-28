// Copyright 2022-2023, University of Colorado Boulder

/**
 * Helper function to show a progress bar on the command line.
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

/* eslint-env node */
const _ = require( 'lodash' );

/**
 * See https://jagascript.com/how-to-build-a-textual-progress-bar-for-cli-and-terminal-apps/
 * @param {number} progress - decimal between 0 and 1
 * @param {boolean} newline - if each new progress should give a new line, should be false during progress, and true when finally completed
 * @param {Object} [options]
 */
module.exports = function showCommandLineProgress( progress, newline, options ) {
  options = _.extend( {
    progressBarLength: 40 // in characters
  }, options );

  const dots = '.'.repeat( Math.round( progress * options.progressBarLength ) );
  const empty = ' '.repeat( Math.round( ( 1 - progress ) * options.progressBarLength ) );
  const newlineString = newline ? '\n' : '';
  process.stdout.write( `\r[${dots}${empty}] ${( progress * 100 ).toFixed( 2 )}%${newlineString}` );
};