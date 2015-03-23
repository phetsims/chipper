// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task does things before the requirejs:build step.
 * It is for internal use only, not intended to be called directly.
 * It sares the following information with other grunt tasks by via global.phet:
 * (TODO document these)
 * strings
 * localesToBuild
 * mipmapsToBuild
 */

var fs = require( 'fs' );

/**
 * @param grunt
 * @param {Object} pkg package.json
 * @param {string} fallbackLocale
 */
module.exports = function( grunt, pkg, fallbackLocale ) {
  'use strict';

  /*
   * Look up the locale strings provided in the simulation.
   * Requires a form like energy-skate-park-basics_ar_SA, where no _ appear in the sim name.
   */
  var getLocalesForDirectory = function( directory ) {
    var stringFiles = fs.readdirSync( directory );
    return stringFiles.map( function( stringFile ) {
      return stringFile.substring( stringFile.indexOf( '_' ) + 1, stringFile.lastIndexOf( '.' ) );
    } );
  };

  /*
   * Look up which locales should be built, accounting for flags provided by the developer on the command line
   * --all-locales true: to build all of the provided locales
   * --locales beers-law-lab: use locales from another sim's strings directory
   * --locale fr: to build just the French locale
   * [no options] to build just the fallback locale (typically English)
   */
  var getLocalesToBuild = function() {
    return grunt.option( 'all-locales' ) ? getLocalesForDirectory( 'strings' ) :
           grunt.option( 'locales' ) ? getLocalesForDirectory( '../' + grunt.option( 'locales' ) + '/strings' ) :
           grunt.option( 'locale' ) ? [ grunt.option( 'locale' ) ] :
           [ fallbackLocale ];
  };

  grunt.log.writeln( 'Building simulation: ' + pkg.name + ' ' + pkg.version );

  // info shared with other tasks will be put here
  global.phet = global.phet || {};

  // polyfill to work around the cache buster arg in the *-config.js file that all sims have.
  global.phet.chipper = global.phet.chipper || {};
  global.phet.chipper.getCacheBusterArgs = global.phet.chipper.getCacheBusterArgs || function() {return '';};

  // See if a specific language was specified like: grunt build --locale fr
  var locale = grunt.option( 'locale' ) || fallbackLocale;

  // Pass an option to requirejs through its config build options
  grunt.config.set( 'requirejs.build.options.phetLocale', locale );

  // set up a place for the strings to go:
  global.phet.strings = global.phet.strings || {};

  // Pass a global to the string! plugin so we know which strings to look up
  global.phet.localesToBuild =  getLocalesToBuild();
  for ( var i = 0; i < global.phet.localesToBuild.length; i++ ) {
    global.phet.strings[ global.phet.localesToBuild[ i ] ] = {};
  }
  global.phet.strings[ fallbackLocale ] = {}; // may overwrite above

  // Since require.js plugins can't be asynchronous with isBuild=true (r.js mode), we need to catch all of the
  // mipmaps that we'll need to build and then handle them later asynchronously.
  global.phet.mipmapsToBuild = [];
};
