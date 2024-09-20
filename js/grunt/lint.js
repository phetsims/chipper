// Copyright 2024, University of Colorado Boulder

/**
 * Runs the eslint process on the specified repos using the `npx` command line interface. This is the idiomatic and
 * recommended approach for this. We also add support for various options. This linting strategy was adopted over
 * using the ESLint NodeJS client in https://github.com/phetsims/chipper/issues/1429
 *
 * It is assumed that linting occurs from one level deep in any given repo. This has ramifications for how we write
 * eslint config files across the codebase.
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
const fs = require( 'fs' );

const DEBUG_MARKER = 'eslint:cli-engine';
const npxCommand = /^win/.test( process.platform ) ? 'npx.cmd' : 'npx';

// Print formatted errors and warning to the console.
async function consoleLogResults( results ) {

  // No need to have the same ESLint just to format
  const formatter = await new ESLint().loadFormatter( 'stylish' );
  const resultText = formatter.format( results );
  console.log( `\n${resultText}\n` );
}

/**
 * @param repos
 * @param options
 * @returns {Promise<ESLint.LintResult[]>}
 */
function runEslint( repos, options ) {

  options = _.assignIn( {

    // Cache results for a speed boost.
    cache: true,

    // Fix things that can be auto-fixed (written to disk)
    fix: false,

    // prints responsible dev info for any lint errors for easier GitHub issue creation.
    chipAway: false,

    // Show a progress bar while running, based on the current repo index in the provided list parameter
    showProgressBar: true
  }, options );

  const patterns = repos.map( repo => `../${repo}/` );

  const args = [ 'eslint' ];

  // If options.cache is not set, clear the cache file (if it exists)
  if ( !options.cache ) {

    try {
      fs.unlinkSync( '../chipper/eslint/cache/.eslintcache' );
      console.log( 'Cache file \'../chipper/eslint/cache/.eslintcache\' deleted successfully' );
    }
    catch( err ) {
      if ( err.code === 'ENOENT' ) {

        console.log( 'Cache file does not exist, no need to delete' );
      }
      else {

        // Re-throw the error if it's something else
        throw err;
      }
    }
  }

  const showProgressBar = options.showProgressBar && repos.length > 1;
  showProgressBar && showCommandLineProgress( 0, false );

  // Always write to the cache, even if it was cleared above.
  // TODO: https://github.com/phetsims/chipper/issues/1356 do we need a different cache for different repos or repo combos? We get a speed boost when using repos.join as a filename key
  args.push( '--cache', '--cache-location', '../chipper/eslint/cache/.eslintcache' );

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

  return new Promise( ( resolve, reject ) => {

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
    const eslint = spawn( npxCommand, args, {
      cwd: '../chipper',

      // A shell is required for npx because the runnable is a shell script. see https://github.com/phetsims/perennial/issues/359
      shell: /^win/.test( process.platform ),
      env: env // Use the prepared environment
    } );

    // It is possible the json is bigger than one chunk of data, so append to it.
    let jsonString = '';
    eslint.stdout.on( 'data', data => {
      jsonString += data.toString();
    } );

    eslint.stderr.on( 'data', data => {
      const message = data.toString();

      // Log with support for debug messaging (for progress bar)
      // Handle case where the source code of this file is printed (when there are lint rules in this file)
      // It was found that debug messages only come to the stderr channel, not stdout.
      if ( message.includes( DEBUG_MARKER ) && !message.includes( DEBUG_MARKER + '\'' ) ) {
        assert( showProgressBar, `should only have the debug marker for progress bar support for message:, ${message}` );
        const repo = tryRepoFromDebugMessage( message );
        if ( repo ) {
          assert( repos.indexOf( repo ) >= 0, `repo not in repos, ${repo}, ${message}` );
          showProgressBar && showCommandLineProgress( repos.indexOf( repo ) / repos.length, false );
        }
      }
      else {
        console.error( message );
      }
    } );
    eslint.on( 'close', () => {
      try {
        const parsed = JSON.parse( jsonString );
        resolve( parsed );
      }
      catch( e ) {
        reject( e );
      }
    } );

  } ).then( async parsed => {

    showProgressBar && showCommandLineProgress( 1, true );

    // Ignore non-errors/warnings
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