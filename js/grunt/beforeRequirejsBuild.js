// Copyright 2002-2015, University of Colorado Boulder

var fs = require( 'fs' );

/**
 * For internal use only.
 * Do things before the requirejs:build step.
 * Shares the following information with other grunt tasks by via global.phet:
 * (TODO document these)
 * strings
 * localesToBuild
 * mipmapsToBuild
 *
 * @param grunt
 * @param {string} repositoryName
 * @param {string} version
 * @param {string[]} phetLibs
 * @param {string[]} preload
 * @param {string} fallbackLocale
 */
module.exports = function( grunt, repositoryName, version, phetLibs, preload, fallbackLocale ) {
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
   * Look up the locale strings provided in the simulation.
   * Requires a form like energy-skate-park-basics_ar_SA, where no _ appear in the sim name.
   */
  var getLocales = function() { return getLocalesForDirectory( 'strings' ); };

  /*
   * Look up which locales should be built, accounting for flags provided by the developer on the command line
   * --all-locales true: to build all of the provided locales
   * --locales beers-law-lab: use locales from another sim's strings directory
   * --locale fr: to build just the french locale
   * [no options] to build just the english locale
   */
  var getLocalesToBuild = function() {
    return grunt.option( 'all-locales' ) ? getLocales() :
           grunt.option( 'locale' ) ? [ grunt.option( 'locale' ) ] :
           grunt.option( 'locales' ) ? getLocalesForDirectory( '../' + grunt.option( 'locales' ) + '/strings' ) :
           [ fallbackLocale ];
  };

  grunt.log.writeln( 'Building simulation: ' + repositoryName + ' ' + version );

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
