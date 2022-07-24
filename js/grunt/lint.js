// Copyright 2022, University of Colorado Boulder

/**
 * Runs the lint rules on the specified files.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */


// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const { ESLint } = require( 'eslint' ); // eslint-disable-line require-statement-match
const fs = require( 'fs' );
const chipAway = require( './chipAway' );
const showCommandLineProgress = require( '../common/showCommandLineProgress' );
const CacheLayer = require( '../common/CacheLayer' );

// constants
const EXCLUDE_REPOS = [
  'babel',
  'decaf',
  'phet-android-app',
  'phet-info',
  'phet-io-client-guides',
  'phet-io-website',
  'phet-io-wrapper-arithmetic',
  'phet-io-wrapper-hookes-law-energy',
  'phet-ios-app',
  'qa',
  'smithers',
  'tasks'
];

// "Pattern" is really a path, we assume here that gruntfiles help keep the right directory stucture and can just pop
// out of the repo running the command
const repoToPattern = repo => `../${repo}`;

/**
 * Create an ESLint client and lint a single repo
 * @param {string} repo
 * @param {Object} [options]
 * @returns {Promise<Object>} - results from linting files, see ESLint.lintFiles
 */
const lintOneRepo = async ( repo, options ) => {

  options = _.extend( {
    cache: true,
    fix: false
  }, options );

  const eslintConfig = {

    // optional auto-fix
    fix: options.fix,

    // Caching only checks changed files or when the list of rules is changed.  Changing the implementation of a
    // custom rule does not invalidate the cache.  Caches are declared in .eslintcache files in the directory where
    // the process was run from.
    cache: options.cache,

    // Where to store the target-specific cache file
    cacheLocation: `../chipper/eslint/cache/${repo}.eslintcache`,

    ignorePath: '../chipper/eslint/.eslintignore',

    resolvePluginsRelativeTo: '../chipper/',

    // Our custom rules live here
    rulePaths: [ '../chipper/eslint/rules' ],

    extensions: [ '.js', '.jsx', '.ts', '.tsx' ]
  };

  const cacheKey = `lintRepo#${repo}`;

  if ( options.cache && CacheLayer.isCacheSafe( cacheKey ) ) {
    // console.log( 'lint cache hit: ' + cacheKey );
    return [];
  }
  else {
    // console.log( 'lint cache fail: ' + cacheKey );
  }

  const config = {};
  const configExtends = [];
  if ( options.format ) {
    configExtends.push( '../chipper/eslint/format_eslintrc.js' );
  }

  config.extends = configExtends;
  eslintConfig.baseConfig = config;

  const eslint = new ESLint( eslintConfig );

  const results = await eslint.lintFiles( repoToPattern( repo ) );

  const totalWarnings = _.sum( results.map( result => result.warningCount ) );
  const totalErrors = _.sum( results.map( result => result.errorCount ) );
  if ( options.cache && totalWarnings === 0 && totalErrors === 0 ) {
    CacheLayer.onSuccess( cacheKey );
  }

  return results;
};

/**
 * Lints the specified repositories.
 * @public
 *
 * @param {string[]} repos - list of repos to lint
 * @param {Object} [options]
 * @returns {Promise<Object>} - results from linting files, see ESLint.lintFiles
 */
const lint = async ( repos, options ) => {

  // Run all linting from chipper so the ESLint cache will be shared, see https://github.com/phetsims/chipper/issues/1286
  const cwd = process.cwd();
  process.chdir( '../chipper' );

  options = _.merge( {
    cache: true,
    format: false, // append an extra set of rules for formatting code.
    fix: false, // whether fixes should be written to disk
    chipAway: false, // returns responsible dev info for easier chipping.
    showProgressBar: true
  }, options );

  // filter out all unlintable repos. An unlintable repo is one that has no `js` in it, so it will fail when trying to
  // lint it.  Also, if the user doesn't have some repos checked out, those should be skipped
  repos = repos.filter( repo => !EXCLUDE_REPOS.includes( repo ) &&
                                fs.existsSync( repoToPattern( repo ) ) );

  const allResults = [];
  for ( let i = 0; i < repos.length; i++ ) {
    options.showProgressBar && repos.length > 1 && showCommandLineProgress( i / repos.length, false );

    const results = await lintOneRepo( repos[ i ], {
      cache: options.cache,
      format: options.format,
      chipAway: false, // silence individual repo reporting
      silent: true // silence individual repo reporting
    } );

    // MK found that results are unique to a file, so this seemed safe and was working well.
    allResults.push( ...results );
  }

  options.showProgressBar && repos.length > 1 && showCommandLineProgress( 1, true );

  // 3. Modify the files with the fixed code.
  if ( options.fix ) {
    await ESLint.outputFixes( allResults );
  }

  // Parse the results.
  const totalWarnings = _.sum( allResults.map( result => result.warningCount ) );
  const totalErrors = _.sum( allResults.map( result => result.errorCount ) );

  // Output results on errors.
  if ( totalWarnings + totalErrors > 0 ) {

    // No need to have the same ESLint just to format
    const formatter = await new ESLint().loadFormatter( 'stylish' );
    const resultText = formatter.format( allResults );
    console.log( resultText );

    // The chip-away option provides a quick and easy method to assign devs to their respective repositories.
    // Check ./chipAway.js for more information.
    if ( options.chipAway ) {
      const message = chipAway( allResults );
      console.log( 'Results from chipAway: \n' + message );
    }
  }

  process.chdir( cwd );

  const ok = totalWarnings + totalErrors === 0;

  return {
    results: allResults,
    ok: ok
  };
};

// Mark the version so that the pre-commit hook will only try to use the promise-based API, this means
// it won't run lint precommit hook on SHAs before the promise-based API
lint.chipperAPIVersion = 'promisesPerRepo1';

module.exports = lint;