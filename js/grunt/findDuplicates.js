// Copyright 2015, University of Colorado Boulder

/**
 * Find code duplicates in the paths that are linted.  Usage:
 *
 * // To find duplicates in the repo itself
 * grunt find-duplicates
 *
 * // To find duplicates in the repo and its dependencies
 * grunt find-duplicates --all
 *
 * @param {Object} grunt
 * @param {Object} gruntConfig
 */

'use strict';

// TODO: Looks like a decent amount of cleanup in this file. Not up to standards yet
const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const fs = require( 'fs' );
const getPhetLibs = require( './getPhetLibs' );
const jscpd = require( 'jscpd' );

module.exports = function( grunt, repo, cache ) {

  /**
   * TODO: Eliminate this function and unify paths with lint.js, see https://github.com/phetsims/chipper/issues/566
   * @param {Object} grunt - the grunt instance
   * @param {string} repositoryName - name of the repository we're building
   * @param {string[]} phetLibs - see getBuildConfig.js
   */
  const getGruntConfig = function( repositoryName, phetLibs ) {

    /**
     * Gets the paths to be linted.
     *
     * @param {string} repositoryName - name of the repository we're building
     * @param {string[]} phetLibs - see getBuildConfig.js
     * @returns {Object}
     */
    function getPaths( repositoryName, phetLibs ) {

      // Repository files to be linted. brand has a non-standard directory structure.
      let repoFilesToSearch;
      if ( repositoryName === 'brand' ) {
        repoFilesToSearch = [ '*/js/**/*.js' ];
      }
      else if ( repositoryName.indexOf( 'phet-io-wrapper' ) >= 0 ) {
        repoFilesToSearch = [ '/**/*.js' ];
      }
      else if ( repositoryName === 'phet-io' ) {

        // For phet-io make sure to include the wrappers folder
        repoFilesToSearch = [ '../phet-io-website/root/metacog/playback/*.js', 'js/**/*.js' ];
      }
      else {
        repoFilesToSearch = [ 'js/**/*.js' ];
      }

      // All files to be linted
      let allFilesToLint = _.map( phetLibs, function( repo ) {

        // phet-io-wrapper* repos don't have js folders, see below for their structure
        if ( repo.indexOf( 'phet-io-wrapper' ) < 0 ) {
          return '../' + repo + '/js/**/*.js';
        }
        else {
          return '';
        }
      } );

      // When building for phet-io, we must lint the phet-io wrappers directory, see https://github.com/phetsims/phet-io/issues/600
      if ( phetLibs.indexOf( 'phet-io' ) >= 0 ) {
        allFilesToLint.push( '../phet-io-wrapper*/**/*.js' );
      }

      // brand repo has a non-standard directory structure, so add it explicitly if it's a dependency.
      if ( repositoryName !== 'brand' ) {
        allFilesToLint.push( '../brand/*/js/**/*.js' );
      }

      // Exclude svgPath.js, it was automatically generated and doesn't match pass lint.
      allFilesToLint.push( '!../kite/js/parser/svgPath.js' );
      allFilesToLint.push( '../chipper/eslint/rules/*.js' );
      allFilesToLint.push( '../phetmarks/js/*.js' );
      allFilesToLint = _.uniq( allFilesToLint );

      // constants
      // WARNING: Don't use this from chipper!
      const ACTIVE_REPOS_FILENAME = 'perennial/data/active-repos';  // The relative path to the list of active repos

      // Start in the github checkout dir (above one of the sibling directories)
      const directory = process.cwd();
      const rootdir = directory + '/../';

      // Iterate over all active-repos
      const repos = grunt.file.read( rootdir + '/' + ACTIVE_REPOS_FILENAME ).trim();
      const reposByLine = repos.split( /\r?\n/ );

      const everythingToLint = [];
      const visit = function( repo, path ) {
        if ( repo === 'sherpa' ) {
          // skip
        }
        else if ( repo === 'scenery' && path.endsWith( 'snapshots' ) ) {
          // skip
        }
        else if ( path.endsWith( 'kite/js/parser/svgPath.js' ) ) {
          // skip
        }
        else if ( path.endsWith( 'phet-io-website/root/assets/js' ) ) {
          // skip
        }
        else if ( path.endsWith( 'phet-io-website/root/assets' ) ) {
          // skip
        }
        else if ( path.indexOf( 'installer-builder/temp' ) >= 0 ) {
          // skip
        }
        else if ( grunt.file.isDir( path ) ) {

          if ( path.endsWith( '/node_modules' ) || path.endsWith( '/.git' ) || path.endsWith( '/build' ) ) {
            // skip
          }
          else {
            const children = fs.readdirSync( path );
            for ( let i = 0; i < children.length; i++ ) {
              visit( repo, path + '/' + children[ i ] );
            }
          }
        }
        else {
          if ( path.endsWith( '.js' ) ) {
            everythingToLint.push( path );
          }
        }
      };

      for ( let i = 0; i < reposByLine.length; i++ ) {
        visit( reposByLine[ i ], '../' + reposByLine[ i ] );
      }

      return {

        // PhET-specific, passed to the 'lint' grunt task
        // Source files that are specific to this repository
        repoFiles: repoFilesToSearch,

        // PhET-specific, passed to the 'lint-all' grunt task
        // All source files for this repository (repository-specific and dependencies).
        allFiles: allFilesToLint,

        everything: everythingToLint
      };
    }

    const lintPaths = getPaths( repositoryName, phetLibs );

    // grunt config
    const gruntConfig = {

      // Configuration for ESLint
      eslint: {
        options: {

          // Rules are specified in the .eslintrc file
          configFile: '../chipper/eslint/.eslintrc',

          // Caching only checks changed files or when the list of rules is changed.  Changing the implementation of a
          // custom rule does not invalidate the cache.  Caches are declared in .eslintcache files in the directory where
          // grunt was run from.
          cache: cache,

          // Our custom rules live here
          rulePaths: [ '../chipper/eslint/rules' ],

          cacheFile: '../chipper/eslint/cache/' + repositoryName + '.eslintcache'
        },

        // When running eslint with an option like "eslint:allFiles" or "eslint:repoFiles", these fields are used.
        allFiles: lintPaths.allFiles,
        repoFiles: lintPaths.repoFiles,
        everything: lintPaths.everything
      }
    };

    grunt.log.debug( 'gruntConfig=' + JSON.stringify( gruntConfig, null, 2 ) );
    return gruntConfig;
  };

  // Initialize grunt
  const gruntConfig = getGruntConfig( repo, getPhetLibs( repo ) );

  // Choose the paths to check for duplicates
  const paths = grunt.option( 'dependencies' ) ? gruntConfig.eslint.allFiles :
                grunt.option( 'everything' ) ? gruntConfig.eslint.everything :
                gruntConfig.eslint.repoFiles;

  // For compatibility with jscpd, if there is only one entry, it should be a string (for glob)
  const files = paths.length === 1 ? paths[ 0 ] : paths;
  jscpd.prototype.run( {

    // Paths are relative
    path: '.',

    // The files to check
    files: files,

    // Files are specified above, excludes are already addressed there
    exclude: [],

    // stores results as json instead of xml
    reporter: 'json',

    // Print the results to the screen
    verbose: true
  } );
};