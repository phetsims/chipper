/**
 * Grunt configuration file for simulations.
 * Requires a package.json file containing project settings.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
module.exports = function( grunt ) {

  // Project configuration.
  grunt.initConfig(
      {
        // Read in the project settings from the package.json file into the pkg property.
        // This allows us to refer to project settings from within this config file.
        pkg: grunt.file.readJSON('package.json'),

        // configure the RequireJS plugin
        requirejs: {

          // builds the minified script
          build: {
            options: {
              almond: true,
              mainConfigFile: "js/<%= pkg.name %>-config.js",
              out: "build/<%= pkg.name %>.min.js",
              name: "<%= pkg.name %>-config",
              optimize: 'uglify2',
              wrap: true
            },
            uglify2: {
              compress: {
                global_defs: {
                  // scenery assertions
                  sceneryAssert: false,
                  sceneryExtraAssert: false,
                  // scenery logging
                  sceneryLayerLog: false,
                  sceneryEventLog: false
                },
                dead_code: true
              }
            }
          }
        },

        // configure the JSHint plugin
        jshint: {
          // source files that are specific to this simulation
          simFiles: [ 'js/**/*.js' ],
          // source files for common-code dependencies
          commonFiles: [
            '../assert/js/**/*.js',
            '../dot/js/**/*.js',
            '../fort/js/**/*.js',
            '../joist/js/**/*.js',
            '../kite/js/**/*.js',
            '../phet-core/js/**/*.js',
            '../phetcommon/js/**/*.js',
            '../scenery/js/**/*.js',
            '../scenery-phet/js/**/*.js',
            '../sun/js/**/*.js'
          ],
          options: {
            // options documented at http://www.jshint.com/docs/#options

            // enforcing options
            curly: true, // require braces around blocks for loops and conditionals
            eqeqeq: true, // prohibit == and !=, use === and !===
            immed: true, // prohibits the use of immediate function invocations without wrapping them in parentheses
            latedef: true, // prohibits the use of a variable before it was defined
            newcap: true, // requires you to capitalize names of constructor functions
            noarg: true, // prohibits the use of arguments.caller and arguments.callee
            nonew: true, // prohibits calling new without assigning result to a variable
            undef: true, // prohibits the use of explicitly undeclared variables

            // relaxing options
            expr: true, // suppresses warnings about the use of expressions where normally you would expect to see assignments or function calls, so we can use assert && assert( ... )
            es5: true, // we use ES5 getters and setters for now
            loopfunc: true, // suppresses warnings about defining functions inside of loops, but we know how not to shoot ourselves in the foot, and this is useful for _.each

            // tell JSHint about global variables that are defined elsewhere. If value is false (default), JSHint will consider that variable as read-only.
            globals: {

              // writable globals ---------------------------------

              sceneryAssert: true,  // for removal of scenery assertions
              sceneryExtraAssert: true, // for removal of scenery assertions
              sceneryLayerLog: true, // scenery logging levels
              sceneryEventLog: true, // scenery logging levels
              sceneryAccessibilityLog: true, // scenery accessibility levels
              Float32Array: true, // we actually polyfill this, so allow it to be set

              // read-only globals ---------------------------------

              define: false, // require.js
              require: false, // require.js
              Uint16Array: false,
              Uint32Array: false,
              document: false,
              window: false,
              console: false,
              HTMLImageElement: false,
              HTMLCanvasElement: false,
              Backbone: false, // backbone is currently run outside of requirejs
              module: false, // as used in Gruntfile.js
              $: false, // jQuery
              _: false, // underscore, lodash
              clearTimeout: false,
              Image: false, // DOM.js
              Blob: false,  // DOM.js
              canvg: false,
              io: false //socket.io
            }
          }
        }
      } );

  // Default task ('grunt')
  grunt.registerTask( 'default', [ 'lint', 'lint-common', 'build' ] );

  // Other tasks ('grunt taskName')
  grunt.registerTask( 'lint', [ 'jshint:simFiles' ] );
  grunt.registerTask( 'lint-common', [ 'jshint:commonFiles' ] );
  grunt.registerTask( 'build', [ 'requirejs:build' ] );

  // Load tasks from grunt plugins that have been installed locally using npm.
  // Put these in package.json and run 'npm install' before running grunt.
  grunt.loadNpmTasks( 'grunt-requirejs' );
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
};