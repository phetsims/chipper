// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task does things before the requirejs:build step.
 * It is for internal use only, not intended to be called directly.
 * It shares information with other grunt tasks via these globals:
 *
 * @param grunt - the grunt instance
 * @param {string} name - repository name
 * @param {version} version - version identifier
 */
module.exports = function( grunt, name, version ) {
  'use strict';

  grunt.log.debug( 'Building simulation: ' + name + ' ' + version );

  // polyfill to work around the cache buster arg in the *-config.js file that all sims have.
  global.phet.chipper.getCacheBusterArgs = global.phet.chipper.getCacheBusterArgs || function() { return ''; };
};
