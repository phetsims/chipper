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
const EXCLUDE_PATTERNS = [ // patterns that have no code that should be linted

  '../babel',
  '../decaf',
  '../phet-android-app',
  '../phet-info',
  '../phet-io-client-guides',
  '../phet-io-website',
  '../phet-io-wrapper-arithmetic',
  '../phet-io-wrapper-hookes-law-energy',
  '../phet-ios-app',
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
    format: false, // append an extra set of rules for formatting code.
    fix: false, // whether fixes should be written to disk
    warn: true // whether errors should reported with grunt.warn
  }, options );

  // filter out all unlintable pattern. An unlintable repo is one that has no `js` in it, so it will fail when trying to
  // lint it.  Also, if the user doesn't have some repos checked out, those should be skipped
  patterns = patterns.filter( pattern => !EXCLUDE_PATTERNS.includes( pattern ) &&
                                         fs.existsSync( pattern ) );

  // 1. Create an instance with the `fix` option.
  const eslintConfig = {

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
  };

  if ( options.format ) {
    eslintConfig.baseConfig = {
      extends: [ '../chipper/eslint/format_eslintrc.js' ]
    };
  }

  const eslint = new ESLint( eslintConfig );

  grunt.verbose.writeln( `linting: ${patterns.join( ', ' )}` );

  // 2. Lint files. This doesn't modify target files.
  const results = await eslint.lintFiles( patterns );

  // 3. Modify the files with the fixed code.
  if ( options.fix ) {
    await ESLint.outputFixes( results );
  }

  // 4. Parse the results.
  const totalWarnings = _.sum( results.map( result => result.warningCount ) );
  const totalErrors = _.sum( results.map( result => result.errorCount ) );

  // 5. Output results on errors.
  if ( totalWarnings + totalErrors > 0 ) {
    const formatter = await eslint.loadFormatter( 'stylish' );
    const resultText = formatter.format( results );
    console.log( resultText );
    options.warn && grunt.fail.warn( `${totalErrors} errors and ${totalWarnings} warnings` );
  }

  return results;
};

// Mark the version so that the pre-commit hook will only try to use the promise-based API, this means
// it won't run lint precommit hook on SHAs before the promise-based API
lint.chipperAPIVersion = 'promises1';

module.exports = lint;