// Copyright 2022-2025, University of Colorado Boulder

/**
 * Helper function to show a progress bar on the command line.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 *
 * See https://jagascript.com/how-to-build-a-textual-progress-bar-for-cli-and-terminal-apps/
 * @param progress - decimal between 0 and 1
 * @param newline - if each new progress should give a new line, should be false during progress, and true when finally completed
 * @param providedOptions
 */

import optionize from '../../../phet-core/js/optionize.js';

type ShowCommandLineProgressOptions = {
  progressBarLength?: number;
};

export default function showCommandLineProgress( progress: number, newline: boolean, providedOptions?: ShowCommandLineProgressOptions ): void {
  const options = optionize<ShowCommandLineProgressOptions>()( {
    progressBarLength: 40 // in characters
  }, providedOptions );

  const dots = '.'.repeat( Math.round( progress * options.progressBarLength ) );
  const empty = ' '.repeat( Math.round( ( 1 - progress ) * options.progressBarLength ) );
  const newlineString = newline ? '\n' : '';
  process.stdout.write( `\r[${dots}${empty}] ${( progress * 100 ).toFixed( 2 )}%${newlineString}` );
}