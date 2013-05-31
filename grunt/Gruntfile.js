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
                  sceneryAssertExtra: false,
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
          // reference external JSHint options in jshint-options.js
          options: require( './jshint-options' )
        }
      } );

  // Default task ('grunt')
  grunt.registerTask( 'default', [ 'lint-sim', 'lint-common', 'build' ] );

  // Other tasks ('grunt taskName')
  grunt.registerTask( 'lint-sim', [ 'jshint:simFiles' ] );
  grunt.registerTask( 'lint-common', [ 'jshint:commonFiles' ] );
  grunt.registerTask( 'build', [ 'requirejs:build' ] );

  // Load tasks from grunt plugins that have been installed locally using npm.
  // Put these in package.json and run 'npm install' before running grunt.
  grunt.loadNpmTasks( 'grunt-requirejs' );
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
};
