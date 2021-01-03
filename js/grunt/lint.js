// Copyright 2017-2020, University of Colorado Boulder

/**
 * Runs the lint rules on the specified files.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

// modules
const { ESLint } = require( 'eslint' ); // eslint-disable-line
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const md5 = require( 'md5' );

// constants
const NO_LINT_REPOS = [ // don't lint these repos

  'babel',
  'decaf',
  'eliot',
  'phet-android-app',
  'phet-info',
  'phet-io-client-guides',
  'phet-io-wrapper-arithmetic',
  'phet-io-wrapper-hookes-law-energy',
  'phet-ios-app',
  'sherpa',
  'smithers',
  'tasks'
];

/**
 * Lints the specified repositories.
 * @public
 *
 * @param {Array.<string>} repos
 * @param {boolean} cache
 * @param {boolean} fix - whether fixes should be written to disk
 * @param {boolean} warn - whether errors should reported with grunt.warn
 * @returns {Promise} - results from linting files, see ESLint.lintFiles
 */
const lint = async function( repos, cache, fix = false, warn = true ) {

  // filter out all unlintable repo. An unlintable repo is one that has no `js` in it, so it will fail when trying to
  // lint it.  Also, if the user doesn't have some repos checked out, those should be skipped
  const filteredRepos = repos.filter( repo => NO_LINT_REPOS.indexOf( repo ) < 0 &&
                                              fs.existsSync( '../' + repo ) ).map( repo => '../' + repo );

  // 1. Create an instance with the `fix` option.
  const eslint = new ESLint( {

    // optional auto-fix
    fix: fix,

    // Caching only checks changed files or when the list of rules is changed.  Changing the implementation of a
    // custom rule does not invalidate the cache.  Caches are declared in .eslintcache files in the directory where
    // grunt was run from.
    cache: cache,

    // Where to store the target-specific cache file
    cacheLocation: `../chipper/eslint/cache/${md5( filteredRepos.join( ',' ) )}.eslintcache`,

    ignorePath: '../chipper/eslint/.eslintignore',

    resolvePluginsRelativeTo: '../chipper/',

    // Our custom rules live here
    rulePaths: [ '../chipper/eslint/rules' ]
  } );

  grunt.verbose.writeln( `linting: ${filteredRepos.join( ', ' )}` );

  // 2. Lint files. This doesn't modify target files.
  const results = await eslint.lintFiles( filteredRepos );

  // 3. Modify the files with the fixed code.
  if ( fix ) {
    await ESLint.outputFixes( results );
  }

  // 4. Format the results.
  const formatter = await eslint.loadFormatter( 'stylish' );
  const resultText = formatter.format( results );

  const sum = ( a, b ) => a + b;
  const totalWarnings = results.map( result => result.warningCount ).reduce( sum );
  const totalErrors = results.map( result => result.errorCount ).reduce( sum );
  const total = totalWarnings + totalErrors;

  // 5. Output it.
  if ( total > 0 ) {
    console.log( resultText );
    warn && grunt.fail.warn( `${totalErrors} errors and ${totalWarnings} warnings` );
  }

  return results;
};

// Mark the version so that the pre-commit hook will only try to use the promise-based API, this means
// it won't run lint precommit hook on SHAs before the promise-based API
lint.chipperAPIVersion = 'promises1';

module.exports = lint;