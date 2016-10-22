// Copyright 2016, University of Colorado Boulder

/**
 * Combine and minify all of the code/images/audio using r.js, almond and uglify2.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
var requirejs = require( 'requirejs' );
var assert = require( 'assert' );

/**
 * @param {Object} grunt - the grunt instance
 * @param {Object} buildConfig - the buildConfig
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  // Validate phet-io brand naming, see https://github.com/phetsims/chipper/issues/504
  if ( buildConfig.brand === 'phet-io' ) {
    assert( buildConfig.version.indexOf( 'phetio' ) >= 0, 'phet-io branded things must have phetio in the string so they will be ' +
                                                          'properly dealt with on build-server' );
  }

  if ( buildConfig.brand === 'phet' ) {
    assert( buildConfig.version.indexOf( 'phetio' ) === -1, 'phet versions cannot be named like phet-io versions' );
  }

  // The name of the repository from which grunt was launched.
  var repositoryName = buildConfig.name;

  // Wait until build complete
  var done = grunt.task.current.async();

  // Copied from getGruntConfig
  var config = {

    // Includes a require.js stub called almond, so that we don't have to include the full require.js runtime
    // inside of builds. This helps reduce file size, and the rest of require.js isn't needed. See
    // https://github.com/phetsims/chipper/issues/277
    // See https://github.com/requirejs/almond for more about specifying name=almond
    name: 'almond',

    // Avoid optimization names that are outside the baseUrl, see http://requirejs.org/docs/optimization.html#pitfalls
    paths: {
      almond: '../../sherpa/lib/almond-0.2.9'
    },

    // Start the main launch
    insertRequire: [ repositoryName + '-main' ],

    // JS config file
    mainConfigFile: 'js/' + repositoryName + '-config.js',

    // optimized output file
    out: 'build/' + repositoryName + '.min.js',

    // use the default wrapping strategy to wrap the module code, so that define/require are not globals
    wrap: true,

    // turn off preservation of comments that have a license in them
    preserveLicenseComments: false,

    // Minification strategy.
    optimize: grunt.option( 'uglify' ) === false ? 'none' : 'uglify2',

    // uglify2 configuration options
    uglify2: {

      mangle: grunt.option( 'mangle' ) !== false,

      // output options documented at https://github.com/mishoo/UglifyJS2#beautifier-options
      output: {
        inline_script: true, // escape </script

        beautify: grunt.option( 'mangle' ) === false
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
          sceneryAccessibilityLog: false,

          // for tracking object allocations, see phet-core/js/phetAllocation.js (PhET-specific)
          phetAllocation: false
        }
      }
    },

    // modules to stub out in the optimized file
    stubModules: [ 'string', 'audio', 'image', 'mipmap' ]
  };

  requirejs.optimize( config, done, function( err ) {

    //optimization err callback
    grunt.log.writeln( 'requirejs failed' );
    grunt.log.writeln( err );
    done();
  } );
};
