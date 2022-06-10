// Copyright 2017-2022, University of Colorado Boulder

/**
 * Runs the lint rules on the specified files.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */


// modules
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const { ESLint } = require( 'eslint' ); // eslint-disable-line
const fs = require( 'fs' );
const path = require( 'path' );
const grunt = require( 'grunt' );
const crypto = require( 'crypto' );

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
  '../qa',
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
    warn: true, // whether errors should reported with grunt.warn
    typeInfo: false, // (for typescript) whether to include eslint rules that require project info, much slower
    chipAway: false // returns responsible dev info for easier chipping.
  }, options );

  // filter out all unlintable pattern. An unlintable repo is one that has no `js` in it, so it will fail when trying to
  // lint it.  Also, if the user doesn't have some repos checked out, those should be skipped
  patterns = patterns.filter( pattern => !EXCLUDE_PATTERNS.includes( pattern ) &&
                                         fs.existsSync( pattern ) );

  const hash = crypto.createHash( 'md5' )
    .update( patterns.join( ',' ) )
    .digest( 'hex' );

  const eslintConfig = {

    // optional auto-fix
    fix: options.fix,

    // Caching only checks changed files or when the list of rules is changed.  Changing the implementation of a
    // custom rule does not invalidate the cache.  Caches are declared in .eslintcache files in the directory where
    // grunt was run from.
    cache: options.cache,

    // Where to store the target-specific cache file
    cacheLocation: `../chipper/eslint/cache/${hash}.eslintcache`,

    ignorePath: '../chipper/eslint/.eslintignore',

    resolvePluginsRelativeTo: '../chipper/',

    // Our custom rules live here
    rulePaths: [ '../chipper/eslint/rules' ],

    extensions: [ '.js', '.ts', '.tsx' ]
  };

  const config = {};
  const configExtends = [];
  if ( options.format ) {
    configExtends.push( '../chipper/eslint/format_eslintrc.js' );
  }
  if ( options.typeInfo ) {
    if ( patterns.length !== 1 ) {
      grunt.fail.warn( 'typeInfo can only work for one repository at a time' );
    }

    // include the rules that use type information
    configExtends.push( '../chipper/eslint/type_info_eslintrc.js' );

    // signify where the project configuration lives for this repo - if we apply this to all files
    // ESLint complains that .js files are not in project configurations
    config.overrides = [ {
      files: [
        '**/*.ts'
      ],
      parserOptions: {
        project: [ `${patterns[ 0 ]}/tsconfig.json` ]
      }
    } ];
  }

  config.extends = configExtends;
  eslintConfig.baseConfig = config;

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

    // The Chip Away option provides a quick and easy method to assign devs to their respective repositories
    // for ease in adopting and applying new typescript linting rules.
    // Chip Away will return a markdown formatted checklist with the repository name, responsible dev,
    // and number of errors.
    // Response  format:
    // - [ ] {{REPO}}: @{{GITHUB_USERNAME}} {{NUMBER}} errors in {{NUMBER}} files.
    if ( options.chipAway ) {
      const repos = results.map( result => path.relative( '../', result.filePath ).split( path.sep )[ 0 ] );
      const uniqueRepos = _.uniq( repos ).filter( repo => repo !== 'perennial-alias' );

      // NOTE: This should never be run in a maintenance mode since this loads a file from phet-info which
      // does not have its SHA tracked as a dependency.
      // TODO: For the reviewer, is this OK? https://github.com/phetsims/chipper/issues/1253
      const responsibleDevs = JSON.parse( fs.readFileSync( '../phet-info/sim-info/responsible_dev.json' ) );

      // We only want a list of repos that report lint errors
      const reposWithErrors = uniqueRepos.filter( repo => {
        return errorReport( results, repo ).errorCount > 0;
      } );

      // Format chip away assignments. '{{REPO}} @github # errors in # files'
      const assignments = reposWithErrors.map( repo => {
        const fileCount = errorReport( results, repo ).fileCount;
        const errorCount = errorReport( results, repo ).errorCount;

        return ` - [ ] ${repo}: ${responsibleDevs[ repo ].responsibleDevs.join( ', ' )} ${errorCount} errors in ${fileCount} files.`;
      } );
      console.log( assignments.join( '\n' ) );
    }

    options.warn && grunt.fail.warn( `${totalErrors} errors and ${totalWarnings} warnings` );
  }

  return results;
};

function errorReport( results, repo ) {
  const filteredResults = results.filter( result => path.relative( '../', result.filePath ).split( path.sep )[ 0 ] === repo );
  const fileCount = filteredResults.filter( result => result.errorCount + result.warningCount > 0 ).length;
  const errorCount = _.sum( filteredResults.map( file => file.errorCount + file.warningCount ) );

  return { errorCount: errorCount, fileCount: fileCount };
}

// Mark the version so that the pre-commit hook will only try to use the promise-based API, this means
// it won't run lint precommit hook on SHAs before the promise-based API
lint.chipperAPIVersion = 'promises1';

module.exports = lint;