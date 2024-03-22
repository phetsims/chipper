// Copyright 2024, University of Colorado Boulder

/**
 * Runs the eslint process on the specified repos using npx lint
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// modules
const { spawn } = require( 'child_process' ); // eslint-disable-line require-statement-match

function runEslint( repos ) {

  const patterns = repos.map( repo => `../${repo}/` );
  return new Promise( ( resolve, reject ) => {
    const args = [
      'eslint',
      '--cache',
      '--cache-location', '../chipper/eslint/cache/.eslintcache',
      '--rulesdir', '../chipper/eslint/rules/',
      '--resolve-plugins-relative-to', '../chipper',
      '--no-error-on-unmatched-pattern',
      '--ignore-path', '../chipper/eslint/.eslintignore',
      '--ext', '.js,.jsx,.ts,.tsx,.mjs,.cjs,.html',
      '--quiet',
      ...patterns
    ];

    console.log( `running in cwd ../chipper: npx ${args.join( ' ' )}` );

    const eslint = spawn( 'npx', args, {
      cwd: '../chipper'
    } );

    let allOutput = '';

    eslint.stdout.on( 'data', data => {
      allOutput += data.toString();
      console.log( data.toString() );
    } );

    eslint.stderr.on( 'data', data => {
      allOutput += data.toString();
      console.error( data.toString() );
    } );

    eslint.on( 'close', code => {
      resolve( allOutput );
    } );
  } );
}

/**
 * Lints the specified repositories.
 * @public
 *
 * @param {string[]} originalRepos - list of repos to lint
 * @param {Object} [options]
 * @returns {Promise<{results:Object,ok:boolean}>} - results from linting files, see ESLint.lintFiles (all results, not just errors).
 */
const npxLint = async ( originalRepos, options ) => {
  try {
    const result = await runEslint( originalRepos );
    console.log( 'ESLint output:', result );
    if ( result.trim().length === 0 ) {
      return { results: [], ok: true };
    }
    else {
      return { results: [ result ], ok: false };
    }
  }
  catch( error ) {
    console.error( 'Error running ESLint:', error.message );
    throw error;
  }
};

module.exports = npxLint;