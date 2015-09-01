// Copyright 2002-2015, University of Colorado Boulder

/**
 * Gets the grunt configuration object, to be passed to grunt.initConfig.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

// 3rd-party packages
/* jshint -W079 */
var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

/**
 * @param {Object} grunt - the grunt instance
 * @param {string} repositoryName - name of the repository we're building
 * @param {string[]} phetLibs - see getBuildConfig.js
 */
module.exports = function( grunt, repositoryName, phetLibs ) {
  'use strict';

  /**
   * Gets the JSHint configuration object.
   *
   * @param {string} repositoryName - name of the repository we're building
   * @param {string[]} phetLibs - see getBuildConfig.js
   * @returns {Object}
   */
  function getJSHintConfig( repositoryName, phetLibs ) {

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
    allFilesToLint = _.uniq( allFilesToLint );

    return {

      // PhET-specific, passed to the 'lint' grunt task
      // Source files that are specific to this repository
      repoFiles: repoFilesToLint,

      // PhET-specific, passed to the 'lint-all' grunt task
      // All source files for this repository (repository-specific and dependencies).
      allFiles: allFilesToLint,

      // Reference external options in jshintOptions.js
      options: require( './jshintOptions' )
    };
  }

  // grunt config
  var gruntConfig = {

    jshint: getJSHintConfig( repositoryName, phetLibs ),

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

          // Minification strategy. Set this to 'none' if you want to debug a non-minified but compiled version.
          optimize: 'uglify2',

          // uglify2 configuration options
          uglify2: {

            // output options documented at https://github.com/mishoo/UglifyJS2#beautifier-options
            output: {
              inline_script: true // escape </script
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

          //TODO chipper#275 should 'mipmap' be included here too?
          // modules to stub out in the optimized file
          stubModules: [ 'string', 'audio', 'image' ]
        }
      }
    }
  };

  grunt.log.debug( 'gruntConfig=' + JSON.stringify( gruntConfig, null, 2 ) );
  return gruntConfig;
};
