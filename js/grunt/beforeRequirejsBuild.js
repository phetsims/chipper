// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task does things before the requirejs:build step.
 * It is for internal use only, not intended to be called directly.
 * It shares the following information with other grunt tasks via global.phet:
 * (TODO document these)
 * strings
 * localesToBuild
 * mipmapsToBuild
 */

var assert = require( 'assert' );
var fs = require( 'fs' );

/**
 * @param grunt the grunt instance
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
    // get names of string files
    var stringFiles = fs.readdirSync( directory ).filter( function( filename ) {
      return (/^.*-strings.*\.json/).test( filename );
    } );
    assert( stringFiles.length > 0, 'no string files found.' );
    // extract the locale from the file names
    return stringFiles.map( function( filename ) {
      return filename.substring( filename.indexOf( '_' ) + 1, filename.lastIndexOf( '.' ) );
    } );
  };

  /*
   * Look up which locales should be built, accounting for flags provided by the developer on the command line.
   * With no options, builds the fallback locale (typically English).
   *
   * --locales=* : all locales from the sim's strings/ directory
   * --locales=fr : French
   * --locales=ar,fr,es : Arabic, French and Spanish (comma separated locales)
   * --localesRepo=beers-law-lab: all locales from another repository's strings/ directory, ignored if --locale is present
   *
   * @returns {string[]}
   */
  var getLocalesToBuild = function() {

    var locales = grunt.option( 'locales' ); // this option takes precedence
    var localesRepo = grunt.option( 'localesRepo' );

    if ( locales ) {
      if ( locales === '*' ) {
        return getLocalesForDirectory( 'strings' );
      }
      else {
        return locales.split( ',' );
      }
    }
    else if ( localesRepo ) {
      return getLocalesForDirectory( '../' + localesRepo + '/strings' );
    }
    else {
      return [ fallbackLocale ];
    }
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
  grunt.log.writeln( 'building locales: ' + global.phet.localesToBuild.toString() );
  for ( var i = 0; i < global.phet.localesToBuild.length; i++ ) {
    global.phet.strings[ global.phet.localesToBuild[ i ] ] = {};
  }
  global.phet.strings[ fallbackLocale ] = {}; // may overwrite above

  // Since require.js plugins can't be asynchronous with isBuild=true (r.js mode), we need to catch all of the
  // mipmaps that we'll need to build and then handle them later asynchronously.
  global.phet.mipmapsToBuild = [];
};
