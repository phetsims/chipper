// Copyright 2024, University of Colorado Boulder

/**
 * Runs the eslint process on the specified repos using the `npx` command line interface. This is the idiomatic and
 * recommended approach for this. We also add support for various options. This linting strategy was adopted over
 * using the ESLint NodeJS client in https://github.com/phetsims/chipper/issues/1429
 *
 * It is assumed that linting occurs from one level deep in any given repo. This has ramifications for how we write
 * eslint config files across the codebase.
 *
 * TODO: This file was decimated from https://github.com/phetsims/chipper/issues/1451, we should decide what to support
 * TODO: should every active-repo have eslint.config.mjs? Or should we have an opt out list somewhere? https://github.com/phetsims/chipper/issues/1451
 * TODO: Review this file: https://github.com/phetsims/chipper/issues/1451
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// modules
const { spawn } = require( 'child_process' ); // eslint-disable-line phet/require-statement-match
const _ = require( 'lodash' );
const fs = require( 'fs' );
const showCommandLineProgress = require( '../common/showCommandLineProgress' );
const path = require( 'path' );

const ESLINT_COMMAND = path.join( '../chipper/node_modules/.bin/eslint' );

/**
 * @param repo
 * @param options
 * @returns {Promise<number>}
 */
function runEslint( repo, options ) {

  const cacheFile = `../chipper/eslint/cache/${repo}.eslintcache`;
  // If options.cache is not set, clear the cache file (if it exists)
  if ( !options.cache ) {

    try {
      fs.unlinkSync( cacheFile );
      console.log( `\nCache file '${cacheFile}' deleted successfully` );
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

  // Always write to the cache, even if it was cleared above.
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

      exitCodes.push( await runEslint( repo, options ) );
      // console.log( `finished linting ${repo}` );

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
 * Lints the specified repositories.
 * @public
 *
 * @param {string[]} originalRepos - list of repos to lint
 * @param {Object} [options]
 * @returns {Promise<{ok:boolean}>} - results from linting files, see ESLint.lintFiles.
 */
const lint = async ( originalRepos, options ) => {
  originalRepos = _.uniq( originalRepos ); // don't double lint repos

  options = _.assignIn( {

    // Cache results for a speed boost.
    cache: true,

    // Fix things that can be auto-fixed (written to disk)
    fix: false,

    // prints responsible dev info for any lint errors for easier GitHub issue creation.
    chipAway: false, // TODO: not easy to support since flat config rewrite, see https://github.com/phetsims/chipper/issues/1451

    // Show a progress bar while running, based on the current repo index in the provided list parameter
    showProgressBar: true
  }, options );

  // Don't show a progress bar for just a single repo
  options.showProgressBar = options.showProgressBar && originalRepos.length > 1;

  // Top level try catch just in case.
  try {
    return await lintWithWorkers( originalRepos, options );
  }
  catch( error ) {
    console.error( 'Error running ESLint:', error.message );
    throw error;
  }
};

// Mark the version so that we don't try to lint old shas if on an older version of chipper.
// TODO: Should we change this? I'm unsure what all the posibilities are, https://github.com/phetsims/chipper/issues/1451
lint.chipperAPIVersion = 'npx';

module.exports = lint;