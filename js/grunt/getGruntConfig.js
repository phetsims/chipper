// Copyright 2015, University of Colorado Boulder

/**
 * Gets the grunt configuration object, to be passed to grunt.initConfig.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

// 3rd-party packages
var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // eslint-disable-line require-statement-match

/**
 * @param {Object} grunt - the grunt instance
 * @param {string} repositoryName - name of the repository we're building
 * @param {string[]} phetLibs - see getBuildConfig.js
 */
module.exports = function( grunt, repositoryName, phetLibs ) {
  'use strict';

  /**
   * Gets the paths to be linted.
   *
   * @param {string} repositoryName - name of the repository we're building
   * @param {string[]} phetLibs - see getBuildConfig.js
   * @returns {Object}
   */
  function getLintPaths( repositoryName, phetLibs ) {

    // Repository files to be linted. brand has a non-standard directory structure.
    var repoFilesToLint = ( repositoryName === 'brand' ) ? [ '*/js/**/*.js' ] : [ 'js/**/*.js' ];

    // All files to be linted
    var allFilesToLint = _.map( phetLibs, function( repo ) {
      return '../' + repo + '/js/**/*.js';
    } );

    // When building for phet-io, we must lint the phet-io apps directory, see https://github.com/phetsims/phet-io/issues/600
    if ( phetLibs.indexOf( 'phet-io' ) >= 0 ) {
      allFilesToLint.push( '../phet-io/wrappers/**/*.js' );
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

    return {

      // PhET-specific, passed to the 'lint' grunt task
      // Source files that are specific to this repository
      repoFiles: repoFilesToLint,

      // PhET-specific, passed to the 'lint-all' grunt task
      // All source files for this repository (repository-specific and dependencies).
      allFiles: allFilesToLint
    };
  }

  var lintPaths = getLintPaths( repositoryName, phetLibs );

  // --disable-eslint-cache disables the cache, useful for developing rules
  var cache = !grunt.option( 'disable-eslint-cache' );

  // grunt config
  var gruntConfig = {

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
      repoFiles: lintPaths.repoFiles
    }
  };

  grunt.log.debug( 'gruntConfig=' + JSON.stringify( gruntConfig, null, 2 ) );
  return gruntConfig;
};
