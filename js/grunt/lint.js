// Copyright 2024, University of Colorado Boulder

/**
 * Runs the eslint process on the specified repos. For cached repos, this uses the node API. For
 * uncached repos, it spawn a new process. This keeps within the memory limit and keeps up speed.
 *
 * It is assumed that linting occurs from one level deep in any given repo. This has ramifications for how we write
 * eslint config files across the codebase.
 *
 * TODO: This file was updated from https://github.com/phetsims/chipper/issues/1451, we should decide what to support
 * TODO: should every active-repo have eslint.config.mjs? Or should we have an opt out list somewhere? https://github.com/phetsims/chipper/issues/1451
 * TODO: Review this file: https://github.com/phetsims/chipper/issues/1451
 * TODO: Review the strategy of using new ESLint for cached, and child process for uncached, see https://github.com/phetsims/chipper/issues/1451
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// modules
const { spawn } = require( 'child_process' ); // eslint-disable-line phet/require-statement-match
const _ = require( 'lodash' );
const fs = require( 'fs' );
const path = require( 'path' );
const showCommandLineProgress = require( '../common/showCommandLineProgress' );

const ESLINT_COMMAND = path.join( '../chipper/node_modules/.bin/eslint' );

// Require ESLint from the correct path
// eslint-disable-next-line phet/require-statement-match
const { ESLint } = require( 'eslint' );

const getCacheLocation = repo => path.resolve( `../chipper/eslint/cache/${repo}.eslintcache` );

function lintWithChildProcess( repo, options ) {

  // Always write to the cache, even if it was cleared previously.
  const cacheFile = getCacheLocation( repo );
  const args = [ '--cache', '--cache-location', cacheFile ];

  args.push( '--no-error-on-unmatched-pattern' );

  // Add the '--fix' option if fix is true
  options.fix && args.push( '--fix' );

  args.push( ...[
    // '--rulesdir', '../chipper/eslint/rules/',
    // '--resolve-plugins-relative-to', '../chipper',
    // '--ignore-path', '../chipper/eslint/.eslintignore',
    // '--ext', '.js,.jsx,.ts,.tsx,.mjs,.cjs,.html',
    // '--debug'
  ] );

  // Only lint from that single repo, from that repo as cwd; last is best for this one
  args.push( './' );

  return new Promise( resolve => {

    // Prepare environment for spawn process, defaulting to the existing env
    const env = Object.create( process.env );

    // Increase available memory for NodeJS heap, to future-proof for, https://github.com/phetsims/chipper/issues/1415
    env.NODE_OPTIONS = env.NODE_OPTIONS || '';

    if ( !env.NODE_OPTIONS.includes( '--max-old-space-size' ) ) {
      env.NODE_OPTIONS += ' --max-old-space-size=8192';
    }

    // It is nice to use our own spawn here instead of execute() so we can stream progress updates as it runs.
    const eslint = spawn( ESLINT_COMMAND, args, {
      cwd: `../${repo}`,

      // A shell is required for npx because the runnable is a shell script. see https://github.com/phetsims/perennial/issues/359
      shell: /^win/.test( process.platform ),
      env: env // Use the prepared environment
    } );
    let hasPrinted = false;
    // Make sure that the repo is clearly printed for the log
    const preLoggingStep = () => {
      if ( !hasPrinted ) {
        console.log( `\n${repo}:` );
        hasPrinted = true;
      }
    };

    // It is possible the json is bigger than one chunk of data, so append to it.
    eslint.stdout.on( 'data', data => {
      preLoggingStep();
      console.log( data.toString() );
    } );
    eslint.stderr.on( 'data', data => {
      preLoggingStep();
      console.error( data.toString() );
    } );
    eslint.on( 'close', () => resolve( eslint.exitCode ) );
  } );
}

/**
 * Lints repositories using a worker pool approach.
 */
async function lintWithWorkers( repos, options ) {
  const reposQueue = [ ...repos ];
  const exitCodes = [];

  options.showProgressBar && showCommandLineProgress( 0, false );
  let doneCount = 0;

  /**
   * Worker function that continuously processes repositories from the queue.
   */
  const worker = async () => {

    // TODO: Why isn't no-constant-condition triggering? https://github.com/phetsims/chipper/issues/1451
    while ( true ) {

      // Synchronize access to the queue
      // Since JavaScript is single-threaded, this is safe
      if ( reposQueue.length === 0 ) {
        break; // No more repositories to process
      }

      const repo = reposQueue.shift(); // Get the next repository

      const cacheLocation = getCacheLocation( repo );
      if ( fs.existsSync( cacheLocation ) ) {
        exitCodes.push( await lintWithNodeAPI( repo, options ) );
      }
      else {
        exitCodes.push( await lintWithChildProcess( repo, options ) );
      }

      doneCount++;
      options.showProgressBar && showCommandLineProgress( doneCount / repos.length, false );
    }
  };

  // TODO: https://github.com/phetsims/chipper/issues/1468 fine tune the number of workers, maybe with require('os').cpus().length?
  const numWorkers = 8;
  const workers = _.times( numWorkers, () => worker() );

  // Wait for all workers to complete
  await Promise.all( workers );
  options.showProgressBar && showCommandLineProgress( 1, true );

  const ok = _.every( exitCodes, code => code === 0 );
  return { ok: ok };
}

/**
 * Runs ESLint on a single repository using the ESLint Node API.
 *
 * @param {string} repo - The repository to lint.
 * @param {object} options - The options for linting.
 * @returns {Promise<number>} - Resolves to 0 if linting passed, or 1 if there were errors.
 */
async function lintWithNodeAPI( repo, options ) {

  // Prepare options for ESLint instance
  const eslintOptions = {
    cwd: path.resolve( `../${repo}` ),
    cache: true,
    cacheLocation: path.resolve( getCacheLocation( repo ) ),
    fix: options.fix,
    errorOnUnmatchedPattern: false
  };

  // Create ESLint instance
  const eslint = new ESLint( eslintOptions );

  // Lint files in the repo
  const patterns = [ './' ]; // Lint all files starting from the repo root

  let results;
  try {
    // console.log( 'linting files in repo', repo );
    results = await eslint.lintFiles( patterns );
  }
  catch( error ) {
    // console.error( `Error linting files in repo ${repo}:`, error );
    return 1; // Non-zero exit code to indicate failure
  }

  // If fix is enabled, write the fixed files
  if ( options.fix ) {
    await ESLint.outputFixes( results );
  }

  // Output results
  let hasPrinted = false;
  const preLoggingStep = () => {
    if ( !hasPrinted ) {
      console.log( `\n${repo}:` );
      hasPrinted = true;
    }
  };

  if ( results.length > 0 ) {
    const formatter = await eslint.loadFormatter( 'stylish' );
    const resultText = formatter.format( results );

    if ( resultText.trim().length > 0 ) {
      preLoggingStep();
      console.log( resultText );
    }
  }

  // Determine exit code
  const errorCount = results.reduce( ( sum, result ) => sum + result.errorCount, 0 );
  return errorCount === 0 ? 0 : 1; // Return 0 if no errors, 1 if there are errors
}

const clearCaches = originalRepos => {
  originalRepos.forEach( repo => {
    const cacheFile = getCacheLocation( repo );

    try {
      fs.unlinkSync( cacheFile );
      console.log( `Cache file '${cacheFile}' deleted` );
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
  } );
};

/**
 * Lints the specified repositories.
 * @public
 *
 * @param {string[]} originalRepos - List of repos to lint.
 * @param {Object} [options] - Options for linting.
 * @returns {Promise<{ok:boolean}>} - Results from linting files.
 */
const lint = async ( originalRepos, options ) => {
  originalRepos = _.uniq( originalRepos ); // Don't double lint repos

  options = _.assignIn( {

    // Cache results for a speed boost.
    cache: true,

    // Fix things that can be auto-fixed (written to disk)
    fix: false,

    // Prints responsible dev info for any lint errors for easier GitHub issue creation.
    chipAway: false, // TODO: not easy to support since flat config rewrite, see https://github.com/phetsims/chipper/issues/1451

    // Show a progress bar while running, based on the current repo index in the provided list parameter
    showProgressBar: true
  }, options );

  // If options.cache is not set, clear the caches
  if ( !options.cache ) {

    clearCaches( originalRepos );
  }

  // Don't show a progress bar for just a single repo
  options.showProgressBar = options.showProgressBar && originalRepos.length > 1;

  // Top level try-catch just in case.
  try {
    return await lintWithWorkers( originalRepos, options );
  }
  catch( error ) {
    console.error( 'Error running ESLint:', error.message );
    throw error;
  }
};

// Mark the version so that we don't try to lint old shas if on an older version of chipper.
// TODO: Should we change this? I'm unsure what all the possibilities are, https://github.com/phetsims/chipper/issues/1451
lint.chipperAPIVersion = 'npx';

module.exports = lint;