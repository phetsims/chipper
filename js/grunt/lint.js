// Copyright 2024, University of Colorado Boulder

/**
 * Runs the eslint process on the specified repos using the `npx` command line interface. This is the idiomatic and
 * recommended approach for this.
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
const chipAway = require( './chipAway' );
const { ESLint } = require( 'eslint' ); // eslint-disable-line require-statement-match

const DEBUG_MARKER = 'eslint:cli-engine';
const nxpCommand = /^win/.test( process.platform ) ? 'npx.cmd' : 'npx';

async function consoleLogResults( results ) {

  // No need to have the same ESLint just to format
  const formatter = await new ESLint().loadFormatter( 'stylish' );
  const resultText = formatter.format( results );
  console.log( `\n${resultText}\n` );
}

/**
 *
 * @param repos
 * @param options
 * @returns {Promise<ESLint.LintResult[]>}
 */
function runEslint( repos, options ) {

  options = _.assignIn( {

    // Cache results for a speed boost
    cache: true,

    // Fix things that can be auto-fixed (written to disk)
    fix: false,

    // returns responsible dev info for easier GitHub issue creation.
    chipAway: false,

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
      '--format=json', // JSON output, for easier parsing later
      '--ext', '.js,.jsx,.ts,.tsx,.mjs,.cjs,.html',
      ...patterns
    ] );

    showProgressBar && showCommandLineProgress( 0, false );

    // Prepare environment for spawn process, defaulting to the existing env
    const env = Object.create( process.env );
    if ( showProgressBar ) {
      env.DEBUG = DEBUG_MARKER;
    }

    // Increase available memory for NodeJS heap, to future-proof for, https://github.com/phetsims/chipper/issues/1415
    env.NODE_OPTIONS = env.NODE_OPTIONS || '';

    if ( !env.NODE_OPTIONS.includes( '--max-old-space-size' ) ) {
      env.NODE_OPTIONS += ' --max-old-space-size=8192';
    }

    // It is nice to use our own spawn here instead of execute() so we can stream progress updates as it runs.
    const eslint = spawn( nxpCommand, args, {
      cwd: '../chipper',
      env: env // Use the prepared environment
    } );

    // Log with support for debug messaging (for progress bar)
    const handleLogging = ( data, isError ) => {
      const message = data.toString();

      // Handle case where the source code of this file is printed (when there are lint rules in this file)
      if ( message.includes( DEBUG_MARKER ) && !message.includes( DEBUG_MARKER + '\'' ) ) {
        assert( showProgressBar, `should only have the debug marker for progress bar support for message:, ${message}` );
        const repo = tryRepoFromDebugMessage( message );
        if ( repo ) {
          assert( repos.indexOf( repo ) >= 0, `repo not in repos, ${repo}, ${message}` );
          showProgressBar && showCommandLineProgress( repos.indexOf( repo ) / repos.length, false );
        }
      }
      else if ( isError ) {
        console.error( message );
      }
      else {
        try {
          const parsed = JSON.parse( message );
          resolve( parsed );
        }
        catch( e ) {
          if ( e.message.includes( 'Unexpected end of JSON input' ) ) {
            console.log( message ); // Not JSON output, so print it instead
          }
          else {
            reject( e );
          }
        }
      }
    };

    eslint.stdout.on( 'data', data => handleLogging( data, false ) );
    eslint.stderr.on( 'data', data => handleLogging( data, true ) );

  } ).then( async parsed => {

    showProgressBar && showCommandLineProgress( 1, true );
    const results = parsed.filter( x => x.errorCount !== 0 || x.warningCount !== 0 );

    if ( results.length > 0 ) {
      await consoleLogResults( results );
      options.chipAway && console.log( chipAway( results ), '\n' );
    }
    return results;
  } );
}

/**
 * Lints the specified repositories.
 * @public
 *
 * @param {string[]} originalRepos - list of repos to lint
 * @param {Object} [options]
 * @returns {Promise<{results:Array<Object>,ok:boolean}>} - results from linting files, see ESLint.lintFiles.
 */
const lint = async ( originalRepos, options ) => {
  try {
    const results = await runEslint( originalRepos, options );
    if ( results.length === 0 ) {
      return { results: [], ok: true };
    }
    else {
      return { results: results, ok: false };
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

function tryRepoFromDebugMessage( message ) {
  assert( message.includes( DEBUG_MARKER ) );
  const match = message.match( regExp );
  return match ? match[ 1 ] : null;
}

// Mark the version so that we don't try to lint old shas if on an older version of chipper.
lint.chipperAPIVersion = 'npx';

module.exports = lint;