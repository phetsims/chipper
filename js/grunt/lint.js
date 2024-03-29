// Copyright 2022-2024, University of Colorado Boulder

/**
 * Runs the eslint process specified repos. There is a fair amount of complexity below, see lint() function for
 * supported options.
 *
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

// modules
const _ = require( 'lodash' );
const { ESLint } = require( 'eslint' ); // eslint-disable-line require-statement-match
const fs = require( 'fs' );
const chipAway = require( './chipAway' );
const disableWithComment = require( './disableWithComment' );
const showCommandLineProgress = require( '../common/showCommandLineProgress' );
const CacheLayer = require( '../common/CacheLayer' );
const crypto = require( 'crypto' );
const path = require( 'path' );
const assert = require( 'assert' );
const { Worker } = require( 'worker_threads' ); // eslint-disable-line require-statement-match

// constants
const EXCLUDE_REPOS = [ 'binder', 'fenster', 'decaf', 'scenery-lab-demo' ];

// "Pattern" is really a path, we assume here that gruntfiles help keep the right directory structure and can just pop
// out of the repo running the command
const repoToPattern = repo => `../${repo}`;

async function consoleLogResults( results ) {

  // No need to have the same ESLint just to format
  const formatter = await new ESLint().loadFormatter( 'stylish' );
  const resultText = formatter.format( results );
  console.log( `\n${resultText}\n` );
}

/**
 * Create an ESLint client and lint a single repo,
 *
 * NOTE: console.log doesn't output synchronously when running in a worker thread, so we can't rely on it here.
 *
 * @param {string} repo
 * @param {Object} [options]
 * @returns {Promise<Object>} - results from linting files, see ESLint.lintFiles
 */
const lintOneRepo = async ( repo, options ) => {

  options = _.assignIn( {
    cache: true,
    fix: false
  }, options );

  // For PhET's custom cache, see CacheLayer
  const cacheLayerKey = `lintRepo#${repo}`;
  if ( options.cache && CacheLayer.isCacheSafe( cacheLayerKey ) ) {
    return [];
  }

  // Hash on tsconfig file so when tsconfig changes it invalidates the cache.  NOTE this is a known memory leak.  May
  // need to clear the cache directory in a few years?
  const tsconfigFile = fs.readFileSync( '../chipper/tsconfig/all/tsconfig.json', 'utf-8' );

  // Also cache on package.json so that when eslint plugins change, it will invalidate the caches. Note this will
  // have false positives because it is possible to change package.json without changing
  // the eslint plugins
  const packageJSON = fs.readFileSync( '../chipper/package.json', 'utf-8' );

  const hash = crypto.createHash( 'md5' ).update( tsconfigFile + packageJSON ).digest( 'hex' );

  const eslint = new ESLint( {

    // optional auto-fix
    fix: options.fix,

    // Caching only checks changed files or when the list of rules is changed.  Changing the implementation of a
    // custom rule does not invalidate the cache.  Caches are declared in .eslintcache files in the directory where
    // the process was run from. If false, this will delete the `cacheLocation` file.
    cache: options.cache,

    // Where to store the target-specific cache file.  Use only first 4 digits of hash to improve readability
    // at the risk of having more key collisions
    cacheLocation: `../chipper/eslint/cache/${repo}-${hash.substring( 0, 8 )}.eslintcache`,

    ignorePath: '../chipper/eslint/.eslintignore',

    resolvePluginsRelativeTo: '../chipper/',

    // Our custom rules live here
    rulePaths: [ '../chipper/eslint/rules' ],

    extensions: [ '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.html' ],

    // If no lintable files are found, it is not an error
    errorOnUnmatchedPattern: false
  } );

  const results = await eslint.lintFiles( repoToPattern( repo ) );

  const totalWarnings = _.sum( results.map( result => result.warningCount ) );
  const totalErrors = _.sum( results.map( result => result.errorCount ) );
  if ( options.cache && totalWarnings === 0 && totalErrors === 0 ) {
    CacheLayer.onSuccess( cacheLayerKey );
  }

  return results;
};

/**
 * Lint a batch of repos and only return the restults. This does no result handling.
 */
const lintReposFromWorker = async ( repos, options ) => {
  const allResults = [];
  for ( let i = 0; i < repos.length; i++ ) {
    const results = await lintOneRepo( repos[ i ], options );
    allResults.push( ...results );
  }
  return allResults;
};

/**
 * Lints the specified repositories.
 * @public
 *
 * @param {string[]} originalRepos - list of repos to lint
 * @param {Object} [options]
 * @returns {Promise<{results:Object,ok:boolean}>} - results from linting files, see ESLint.lintFiles (all results, not just errors).
 */
const lint = async ( originalRepos, options ) => {

  // Run all linting from chipper so the ESLint cache will be shared, see https://github.com/phetsims/chipper/issues/1286
  const cwd = process.cwd();
  process.chdir( '../chipper' );

  options = _.merge( {
    cache: true,
    fix: false, // whether fixes should be written to disk
    chipAway: false, // returns responsible dev info for easier chipping.
    disableWithComment: false, // replaces failing typescript lines with eslint disable and related comment
    showProgressBar: true
  }, options );

  // Filter out all unlintable repos. An unlintable repo is one that has no `js` in it, so it will fail when trying to
  // lint it.  Also, if the user doesn't have some repos checked out, those should be skipped
  const repos = originalRepos.filter( repo => !EXCLUDE_REPOS.includes( repo ) && fs.existsSync( repoToPattern( repo ) ) );

  const inProgressErrorLogging = repos.length > 1;

  // TODO: always use MAX_THREADS and calculate batch size to be optimal, https://github.com/phetsims/chipper/issues/1415
  const MAX_THREADS = 4; // Max number of concurrent workers
  const MAX_BATCH_SIZE = 60; // Number of repos processed by each worker (could be less if total is not divisible)
  const allResults = [];
  const completedRepos = [];

  // Splitting repos into batches
  const batches = _.chunk( repos, MAX_BATCH_SIZE );

  const shouldShowProgressBar = options.showProgressBar && batches.length > 1;
  shouldShowProgressBar && showCommandLineProgress( 0, false );

  const createBatchPromise = async batchOfRepos => {
    return new Promise( ( resolve, reject ) => {

      const worker = new Worker( path.join( __dirname, '/lintWorker.js' ) );
      worker.on( 'message', async results => {
        allResults.push( ...results );
        completedRepos.push( ...batchOfRepos );
        shouldShowProgressBar && showCommandLineProgress( completedRepos.length / repos.length, false );

        const problemCount = _.sum( allResults.map( result => result.warningCount + result.errorCount ) );

        if ( inProgressErrorLogging && problemCount > 0 ) {
          await consoleLogResults( results );
        }

        resolve( results );
      } );
      worker.on( 'error', reject );
      worker.on( 'exit', code => {
        if ( code !== 0 ) {
          reject( new Error( `Worker stopped with exit code ${code}` ) );
        }
      } );
      worker.postMessage( {
        repos: batchOfRepos,
        options: _.pick( options, [ 'cache', 'fix' ] )
      } );
    } );
  };

  // The current promises that we are waiting to complete. The length of this array should never be larger that MAX_THREADS
  const activePromises = [];
  for ( const batch of batches ) {
    if ( activePromises.length >= MAX_THREADS ) {

      // Defensive slice so that we don't mutate the provided array in the finally() call
      await Promise.race( activePromises.slice() );
    }
    const batchPromise = createBatchPromise( batch );
    activePromises.push( batchPromise );
    batchPromise.finally( () => _.remove( activePromises, batchPromise ) );
  }

  // Wait for the last final promises once all batches have kicked off a lint worker.
  // Defensive slice so that we don't mutate the provided array in the finally() call
  await Promise.all( activePromises.slice() );

  assert( activePromises.length === 0, 'all promises completed' );

  shouldShowProgressBar && showCommandLineProgress( 1, true );

  if ( options.fix ) {
    await ESLint.outputFixes( allResults );
  }

  // Parse the results.
  const totalProblems = _.sum( allResults.map( result => result.warningCount + result.errorCount ) );

  // Output results on errors.
  if ( totalProblems > 0 ) {

    // This exact string is used in AQUA/QuickServer to parse messaging for slack reporting
    const IMPORTANT_MESSAGE_DO_NOT_EDIT = 'All results (repeated from above)';
    inProgressErrorLogging && console.log( `\n\n${IMPORTANT_MESSAGE_DO_NOT_EDIT}\n` );

    await consoleLogResults( allResults );

    // The chip-away option provides a quick and easy method to assign devs to their respective repositories.
    // Check ./chipAway.js for more information.
    if ( options.chipAway ) {
      console.log( 'Results from chipAway: \n', chipAway( allResults ) );
    }

    if ( options.disableWithComment ) {
      disableWithComment( allResults );
    }
  }

  process.chdir( cwd );

  return {
    results: allResults,
    ok: totalProblems === 0
  };
};

// Mark the version so that the pre-commit hook will only try to use the promise-based API, this means
// it won't run lint precommit hook on SHAs before the promise-based API
lint.chipperAPIVersion = 'promisesPerRepo1';

// only used by the lintWorker.js, please don't use this.
lint.lintReposFromWorker = lintReposFromWorker;

module.exports = lint;