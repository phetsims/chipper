// Copyright 2002-2015, University of Colorado Boulder

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
  function getLintConfig( repositoryName, phetLibs ) {

    // Repository files to be linted. brand has a non-standard directory structure.
    var repoFilesToLint = ( repositoryName === 'brand' ) ? [ '*/js/**/*.js' ] : [ 'js/**/*.js' ];

    // All files to be linted
    var allFilesToLint = _.map( phetLibs, function( repo ) {
      return '../' + repo + '/js/**/*.js';
    } );

    // brand repo has a non-standard directory structure, so add it explicitly if it's a dependency.
    if ( repositoryName !== 'brand' ) {
      allFilesToLint.push( '../brand/*/js/**/*.js' );
    }

    // Exclude svgPath.js, it was automatically generated and doesn't match pass lint.
    allFilesToLint.push( '!../kite/js/parser/svgPath.js' );
    allFilesToLint.push( '../chipper/eslint/rules/*.js' );
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

  var lintConfig = getLintConfig( repositoryName, phetLibs );

  // --disable-es-cache disables the cache, useful for developing rules
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
        rulePaths: [ '../chipper/eslint/rules' ]
      },

      // When running eslint with an option like "eslint:allFiles" or "eslint:repoFiles", these fields are used.
      allFiles: lintConfig.allFiles,
      repoFiles: lintConfig.repoFiles
    },

    requirejs: {

      // requirejs:build task (RequireJS optimizer)
      build: {

        // RequireJS optimizer options, see https://github.com/jrburke/r.js/blob/master/build/example.build.js
        options: {

          // Includes a require.js stub called almond, so that we don't have to include the full require.js runtime
          // inside of builds. This helps reduce file size, and the rest of require.js isn't needed. See
          // https://github.com/phetsims/chipper/issues/277
          almond: true,

          // name of the single module to optimize
          name: repositoryName + '-config',

          // JS config file
          mainConfigFile: 'js/' + repositoryName + '-config.js',

          // optimized output file
          out: 'build/' + repositoryName + '.min.js',

          // use the default wrapping strategy to wrap the module code, so that define/require are not globals
          wrap: true,

          // turn off preservation of comments that have a license in them
          preserveLicenseComments: false,

          // Minification strategy.
          optimize: grunt.option( 'no-uglify' ) ? 'none' : 'uglify2',

          // uglify2 configuration options
          uglify2: {

            mangle: grunt.option( 'no-mangle' ) ? false : true,

            // output options documented at https://github.com/mishoo/UglifyJS2#beautifier-options
            output: {
              inline_script: true, // escape </script

              beautify: grunt.option( 'no-mangle' ) ? true : false
            },

            // compress options documented at https://github.com/mishoo/UglifyJS2#compressor-options
            compress: {

              dead_code: true, // remove unreachable code

              // To define globals, use global_defs inside compress options, see https://github.com/jrburke/r.js/issues/377
              global_defs: {

                // global assertions (PhET-specific)
                assert: false,
                assertSlow: false,

                // scenery logging (PhET-specific)
                sceneryLog: false,
                sceneryLayerLog: false,
                sceneryEventLog: false,
                sceneryAccessibilityLog: false,

                // for tracking object allocations, see phet-core/js/phetAllocation.js (PhET-specific)
                phetAllocation: false
              }
            }
          },

          // modules to stub out in the optimized file
          stubModules: [ 'string', 'audio', 'image', 'mipmap' ]
        }
      }
    }
  };

  grunt.log.debug( 'gruntConfig=' + JSON.stringify( gruntConfig, null, 2 ) );
  return gruntConfig;
};
