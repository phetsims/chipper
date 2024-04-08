// Copyright 2024, University of Colorado Boulder

/**
 * Runs the eslint process on the specified repos using the `npx` command line iterface. This is the idiomatic and
 * recommended approach for this.
 *
 * TODO: review with CK,  https://github.com/phetsims/chipper/issues/1429
 * TODO: Review ignore file for optimization, https://github.com/phetsims/chipper/issues/1429
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// modules
const { spawn } = require( 'child_process' ); // eslint-disable-line require-statement-match
const _ = require( 'lodash' );
const path = require( 'path' );
const assert = require( 'assert' );
const showCommandLineProgress = require( '../common/showCommandLineProgress' );

const DEBUG_MARKER = 'eslint:cli-engine';
const nxpCommand = /^win/.test( process.platform ) ? 'npx.cmd' : 'npx';

function runEslint( repos, options ) {

  options = _.assignIn( {

    // Cache results for a speed boost
    cache: true,

    // Fix things that can be auto-fixed (written to disk)
    fix: false,

    // Show a progress bar while running, based on the current repo out of the list
    showProgressBar: true
  }, options );

  const showProgressBar = options.showProgressBar && repos.length > 1;

  const patterns = repos.map( repo => `../${repo}/` );
  return new Promise( ( resolve, reject ) => {
    const args = [ 'eslint' ];

    // Conditionally add cache options based on the cache flag in options
    if ( options.cache ) {
      args.push( '--cache', '--cache-location', '../chipper/eslint/cache/.eslintcache' );
    }

    // Add the '--fix' option if fix is true
    if ( options.fix ) {
      args.push( '--fix' );
    }

    // Continue building the args array
    args.push( ...[
      '--rulesdir', '../chipper/eslint/rules/',
      '--resolve-plugins-relative-to', '../chipper',
      '--no-error-on-unmatched-pattern',
      '--ignore-path', '../chipper/eslint/.eslintignore',
      '--ext', '.js,.jsx,.ts,.tsx,.mjs,.cjs,.html',
      // TODO: this is to get rid of warnings, but should be fixed soon, right? https://github.com/phetsims/chipper/issues/1429
      // TODO: Wait! Can we just manually filter these messages out of the main log? https://github.com/phetsims/chipper/issues/1429
      // TODO: MK ran without this on windows and nothing logged. . . . https://github.com/phetsims/chipper/issues/1429
      // TODO: Otherwise remove in https://github.com/phetsims/chipper/issues/1433
      '--quiet',
      ...patterns
    ] );

    // TODO: DELETE ME, https://github.com/phetsims/chipper/issues/1429
    // console.log( `running in cwd ../chipper: npx ${args.join( ' ' )}` );

    showProgressBar && showCommandLineProgress( 0, false );

    // TODO: do we want to support the entire env passed in? https://github.com/phetsims/chipper/issues/1429
    // Prepare environment for spawn process
    const env = Object.create( process.env );
    if ( showProgressBar ) {
      env.DEBUG = DEBUG_MARKER;
    }

    // Increase available memory for NodeJS heap, to future-proof for, https://github.com/phetsims/chipper/issues/1415
    env.NODE_OPTIONS = env.NODE_OPTIONS || '';
    env.NODE_OPTIONS += ' --max-old-space-size=8192'; // TODO: Note that this duplicates this option for MK, but it still works well, https://github.com/phetsims/chipper/issues/1429

    // TODO: error handling, can we do better than a try catch where called?, https://github.com/phetsims/chipper/issues/1429
    const eslint = spawn( nxpCommand, args, {
      cwd: '../chipper',
      env: env // Use the prepared environment
    } );

    let allOutput = '';

    // Log with support for debug messaging (for progress bar)
    const handleLogging = ( data, isError ) => {
      const message = data.toString();

      if ( showProgressBar && message.includes( DEBUG_MARKER ) ) {
        const repo = tryRepoFromDebugMessage( message );
        if ( repo ) {
          assert( repos.indexOf( repo ) >= 0, `repo not in repos, ${repo}, ${message}` );
          showProgressBar && showCommandLineProgress( repos.indexOf( repo ) / repos.length, false );
        }
      }
      else {
        allOutput += message;
        isError ? console.error( message ) : console.log( message );
      }
    };

    eslint.stdout.on( 'data', data => {
      handleLogging( data, false );
    } );

    eslint.stderr.on( 'data', data => {
      handleLogging( data, true );
    } );

    eslint.on( 'close', () => {
      resolve( allOutput );
    } );
  } ).then( result => {
    showProgressBar && showCommandLineProgress( 1, true );
    return result;
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
    const result = await runEslint( originalRepos, options );
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

const repoRootPath = path.join( __dirname, '../../../' ); // Will end in a slash
const escaped = repoRootPath.replace( /\\/g, '\\\\' ); // Handle any backslashes in the path

// Regex that captures the repo via the path
const regExp = new RegExp( `${escaped}([\\w-]+)[\\\\\\/]` );

// A DEBUG message looks like this:  2024-04-08T17:37:52.723Z eslint:cli-engine Lint C:\Users\user\path\git\fractions-common\js\intro\view\circular\CircularPieceNode.js
function tryRepoFromDebugMessage( message ) {
  assert( message.includes( DEBUG_MARKER ) );
  const match = message.match( regExp );
  return match ? match[ 1 ] : null;
}

module.exports = npxLint;