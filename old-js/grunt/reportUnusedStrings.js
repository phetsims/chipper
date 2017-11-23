// Copyright 2015, University of Colorado Boulder

/**
 * Report which translatable strings from a sim were not used in the simulation with a require statement.
 *
 * Each time a string is loaded by the plugin, it is added to a global list.  After all strings are loaded,
 * the global will contain the list of all strings that are actually used by the sim.  Comparing this list to
 * the strings in the translatable strings JSON file will identify which strings are unused.
 *
 * See https://github.com/phetsims/tasks/issues/460
 *
 * @author Jesse Greenberg
 */
/* eslint-env node */
'use strict';

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {

  // get the strings for this sim
  var simulationRoot = process.cwd();
  var jsStrings = grunt.file.readJSON( simulationRoot + '/' + buildConfig.name + '-strings_en.json' );

  // iterate over the strings
  for( var key in jsStrings ) {
    if( jsStrings.hasOwnProperty( key ) ) {

      var string = jsStrings[ key ].value;
      var requireStringKey = buildConfig.requirejsNamespace + '/' + key;

      // global.phet.chipper.strings is initialized by the string plugin
      var chipperStrings = global.phet.chipper.strings || {};

      // If this string was not added to the global chipperStrings, it was not required in the sim
      if ( !chipperStrings.hasOwnProperty( requireStringKey ) ) {
        grunt.log.warn( 'Unused string: key=' + requireStringKey + ', value=' + string );
      }
    }
  }
};