// Copyright 2021-2024, University of Colorado Boulder

/**
 * Reports the results of tsc() in a grunt context, failing if there are errors.
 * @author Sam Reid (PhET Interactive Simulations)
 */

export default (
  results: { stderr: string; stdout: string; code: number; time: number },
  grunt: { fail: { fatal: ( s: string ) => void }; log: { ok: ( s: string ) => void } }
): void => {
  if ( ( results.stderr && results.stderr.length > 0 ) || results.code !== 0 ) {
    grunt.fail.fatal( `tsc failed with code: ${results.code}
stdout:
${results.stdout}

${results.stdout.split( '\n' ).length - 1} problems found.

stderr:
${results.stderr}` );
  }
  else {
    grunt.log.ok( `tsc complete: ${results.time}ms` );
  }
};