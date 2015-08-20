// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task does things before the requirejs:build step.
 * It is for internal use only, not intended to be called directly.
 * It shares information with other grunt tasks via these globals:
 *
 * global.phet.mipmapsToBuild - populated by mipmap.js plugin
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

  // Since require.js plugins can't be asynchronous with isBuild=true (r.js mode), we need to catch all of the
  // mipmaps that we'll need to build and then handle them later asynchronously.
  global.phet.mipmapsToBuild = [];
};
