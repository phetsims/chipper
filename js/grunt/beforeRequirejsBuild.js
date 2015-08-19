// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task does things before the requirejs:build step.
 * It is for internal use only, not intended to be called directly.
 * It shares the following information with other grunt tasks via global.phet:
 * (TODO document these)
 * localesToBuild
 * mipmapsToBuild
 */

// modules
var assert = require( 'assert' );
var fs = require( 'fs' );
var setPreload = require( '../../../chipper/js/grunt/setPreload' );
var buildConstants = require( '../../../chipper/js/grunt/buildConstants' );

/**
 * @param grunt the grunt instance
 * @param {Object} pkg package.json
 */
module.exports = function( grunt, pkg ) {
  'use strict';

  setPreload( grunt, pkg );

  // after preload, the preload should be defined
  assert( pkg.phet.preload, 'phet.preload missing from package.json' );

  /*
   * Look up the locale strings provided in the simulation.
   * Requires a form like energy-skate-park-basics_ar_SA, where no _ appear in the sim name.
   */
  function getLocalesForRepo( repo ) {
    var directory = '../babel/' + repo;
    var locales = [ buildConstants.FALLBACK_LOCALE ]; // our default, where we always pull strings from in the sim repo

    try {
      // ensure it's a directory
      var stats = fs.statSync( directory );
      if ( !stats.isDirectory() ) {
        assert( false, 'Strings location is not a directory: ' + directory );
        return locales;
      }

      // get names of string files
      var stringFiles = fs.readdirSync( directory ).filter( function( filename ) {
        return (/^.*-strings.*\.json/).test( filename );
      } );
      assert( stringFiles.length > 0, 'no string files found.' );

      // extract the locale from the file names
      return locales.concat( stringFiles.map( function( filename ) {
        return filename.substring( filename.indexOf( '_' ) + 1, filename.lastIndexOf( '.' ) );
      } ) );
    }
    catch( e ) {
      assert( false, 'Failure checking strings repo location: ' + directory );
      return locales;
    }
  }

  /*
   * Look up which locales should be built, accounting for flags provided by the developer on the command line.
   * With no options, builds the fallback locale (typically English).
   *
   * --locales=* : all locales from the sim's strings/ directory
   * --locales=fr : French
   * --locales=ar,fr,es : Arabic, French and Spanish (comma separated locales)
   * --localesRepo=beers-law-lab: all locales from another repository's strings/ directory, ignored if --locales is present
   *
   * @returns {string[]}
   */
  var getLocalesToBuild = function() {

    var locales = grunt.option( 'locales' ); // this option takes precedence
    var localesRepo = grunt.option( 'localesRepo' );

    if ( locales ) {
      if ( locales === '*' ) {
        return getLocalesForRepo( pkg.name );
      }
      else {
        return locales.split( ',' );
      }
    }
    else if ( localesRepo ) {
      return getLocalesForRepo( localesRepo );
    }
    else {
      return [ buildConstants.FALLBACK_LOCALE ];
    }
  };

  grunt.log.debug( 'Building simulation: ' + pkg.name + ' ' + pkg.version );

  // polyfill to work around the cache buster arg in the *-config.js file that all sims have.
  global.phet.chipper.getCacheBusterArgs = global.phet.chipper.getCacheBusterArgs || function() {return '';};

  // Pass a global to the string! plugin so we know which strings to look up
  global.phet.localesToBuild = getLocalesToBuild();
  grunt.log.debug( 'Locales to build: ' + global.phet.localesToBuild.toString() );

  // Since require.js plugins can't be asynchronous with isBuild=true (r.js mode), we need to catch all of the
  // mipmaps that we'll need to build and then handle them later asynchronously.
  global.phet.mipmapsToBuild = [];

  // These entries will be filled in as plugins are loaded.  
  // This will have elements: lib, audio, images, etc.
  global.phet.chipper.licenseEntries = {};
};
