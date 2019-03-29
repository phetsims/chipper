// Copyright 2015, University of Colorado Boulder

/**
 * Runs the lint rules on the specified files.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

// modules
const eslint = require( 'eslint' );
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const md5 = require( 'md5' );
const path = require( 'path' );
const child_process = require( 'child_process' );

// constants
// don't lint these repos
const NO_LINT_REPOS = [
  'babel',
  'eliot',
  'phet-android-app',
  'phet-info',
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
 * @param {boolean} say - whether errors should be read out loud
 * @returns {Object} - ESLint report object.
 */
module.exports = function( repos, cache, say = false ) {

  // filter out all unlintable repo. An unlintable repo is one that has no `js` in it, so it will fail when trying to
  // lint it.  Also, if the user doesn't have some repos checked out, those should be skipped
  const filteredRepos = repos.filter( repo => {
    return NO_LINT_REPOS.indexOf( repo ) < 0 && fs.existsSync( '../' + repo );
  } );

  const cli = new eslint.CLIEngine( {

    cwd: path.dirname( process.cwd() ),

    // Caching only checks changed files or when the list of rules is changed.  Changing the implementation of a
    // custom rule does not invalidate the cache.  Caches are declared in .eslintcache files in the directory where
    // grunt was run from.
    cache: cache,

    // Our custom rules live here
    rulePaths: [ 'chipper/eslint/rules' ],

    // Where to store the target-specific cache file
    cacheFile: `chipper/eslint/cache/${md5( filteredRepos.join( ',' ) )}.eslintcache`,

    // Files to skip for linting
    ignorePattern: [
      '**/.git',
      '**/build',
      '**/node_modules',
      '**/snapshots',
      'sherpa/**',
      '**/js/parser/svgPath.js',
      '**/templates/chipper-initialization.js',
      '**/templates/chipper-strings.js',
      '**/templates/sim-config.js',
      'phet-io-website/root/assets/js/ua-parser-0.7.12.min.js',
      'phet-io-website/root/assets/js/jquery-1.12.3.min.js',
      'phet-io-website/root/assets/highlight.js-9.1.0/highlight.pack.js',
      'phet-io-website/root/assets/highlight.js-9.1.0/highlight.js',
      'phet-io-website/root/assets/bootstrap-3.3.6-dist/js/npm.js',
      'phet-io-website/root/assets/bootstrap-3.3.6-dist/js/bootstrap.min.js',
      'phet-io-website/root/assets/bootstrap-3.3.6-dist/js/bootstrap.js',
      'phet-io-website/root/assets/js/phet-io-ga.js',
      'installer-builder/temp/**'
    ]
  } );

  grunt.verbose.writeln( 'linting: ' + filteredRepos.join( ', ' ) );

  // run the eslint step
  const report = cli.executeOnFiles( filteredRepos );

  // pretty print results to console if any
  ( report.warningCount || report.errorCount ) && grunt.log.write( cli.getFormatter()( report.results ) );

  say && report.warningCount && child_process.execSync( 'say Lint warnings detected!' );
  say && report.errorCount && child_process.execSync( 'say Lint errors detected!' );

  report.warningCount && grunt.fail.warn( report.warningCount + ' Lint Warnings' );
  report.errorCount && grunt.fail.fatal( report.errorCount + ' Lint Errors' );

  return report;
};
