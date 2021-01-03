// Copyright 2017-2020, University of Colorado Boulder

/**
 * Runs the lint rules on the specified files.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const { ESLint } = require( 'eslint' ); // eslint-disable-line
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const md5 = require( 'md5' );

// constants
const EXCLUDE_PATTERNS = [ // patterns that have no code and lint should not be attempted

  '../babel',
  '../decaf',
  '../eliot',
  '../phet-android-app',
  '../phet-info',
  '../phet-io-client-guides',
  '../phet-io-wrapper-arithmetic',
  '../phet-io-wrapper-hookes-law-energy',
  '../phet-ios-app',
  '../sherpa',
  '../smithers',
  '../tasks'
];

/**
 * Lints the specified repositories.
 * @public
 *
 * @returns {Promise} - results from linting files, see ESLint.lintFiles
 */
const lint = async ( patterns, options ) => {

  options = _.assignIn( {
    cache: true,
    fix: false, // whether fixes should be written to disk
    warn: true // whether errors should reported with grunt.warn
  }, options );

  // filter out all unlintable pattern. An unlintable repo is one that has no `js` in it, so it will fail when trying to
  // lint it.  Also, if the user doesn't have some repos checked out, those should be skipped
  patterns = patterns.filter( pattern => !EXCLUDE_PATTERNS.includes( pattern ) &&
                                         fs.existsSync( pattern ) );

  // 1. Create an instance with the `fix` option.
  const eslint = new ESLint( {

    // optional auto-fix
    fix: options.fix,

    // Caching only checks changed files or when the list of rules is changed.  Changing the implementation of a
    // custom rule does not invalidate the cache.  Caches are declared in .eslintcache files in the directory where
    // grunt was run from.
    cache: options.cache,

    // Where to store the target-specific cache file
    cacheLocation: `../chipper/eslint/cache/${md5( patterns.join( ',' ) )}.eslintcache`,

    ignorePath: '../chipper/eslint/.eslintignore',

    resolvePluginsRelativeTo: '../chipper/',

    // Our custom rules live here
    rulePaths: [ '../chipper/eslint/rules' ]
  } );

  grunt.verbose.writeln( `linting: ${patterns.join( ', ' )}` );

  // 2. Lint files. This doesn't modify target files.
  const results = await eslint.lintFiles( patterns );

  // 3. Modify the files with the fixed code.
  if ( options.fix ) {
    await ESLint.outputFixes( results );
  }

  // 4. Format the results.
  const formatter = await eslint.loadFormatter( 'stylish' );
  const resultText = formatter.format( results );

  const sum = ( a, b ) => a + b;
  const count = numbers => numbers.length === 0 ? 0 : numbers.reduce( sum );

  const totalWarnings = count( results.map( result => result.warningCount ) );
  const totalErrors = count( results.map( result => result.errorCount ) );
  const total = totalWarnings + totalErrors;

  // 5. Output it.
  if ( total > 0 ) {
    console.log( resultText );
    options.warn && grunt.fail.warn( `${totalErrors} errors and ${totalWarnings} warnings` );
  }

  return results;
};

// Mark the version so that the pre-commit hook will only try to use the promise-based API, this means
// it won't run lint precommit hook on SHAs before the promise-based API
lint.chipperAPIVersion = 'promises1';

module.exports = lint;