// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task does things after the requirejs:build step.
 * It is for internal use only, not intended to be called directly.
 */

// built-in node APIs
var assert = require( 'assert' );

// modules
var createDependenciesJSON = require( '../../../chipper/js/grunt/createDependenciesJSON' );
var createHTMLFiles = require( '../../../chipper/js/grunt/createHTMLFiles' );
var createMipmap = require( '../../../chipper/js/grunt/createMipmap' );
var reportUnusedMedia = require( '../../../chipper/js/grunt/reportUnusedMedia' );

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see initBuildConfig.js
 */
module.exports = function( grunt, buildConfig ) {
  'use strict';

  // globals that should be defined by this point
  assert( global.phet && global.phet.chipper, 'missing global.phet.chipper' );

  var done = grunt.task.current.async();

  function createMipmaps( grunt, buildConfig, dependenciesJSON ) {

    // need to load mipmaps here, since we can't do it synchronously during the require.js build step
    var mipmapsLoaded = 0; // counter that indicates we are done when incremented to the number of mipmaps
    var mipmapResult = {}; // result to be attached to window.phet.chipper.mipmaps in the sim
    if ( global.phet.chipper.mipmapsToBuild.length === 0 ) {
      createHTMLFiles( grunt, buildConfig, dependenciesJSON, '<!-- no mipmaps -->', done ); // no mipmaps loaded
    }
    else {
      global.phet.chipper.mipmapsToBuild.forEach( function( mipmapToBuild ) {

        var name = mipmapToBuild.name;
        var path = mipmapToBuild.path;
        var level = mipmapToBuild.level;
        var quality = mipmapToBuild.quality;

        createMipmap( path, level, quality, grunt, function( mipmaps ) {
          mipmapToBuild.mipmaps = mipmaps;
          mipmapResult[ name ] = mipmaps.map( function( mipmap ) {
            return {
              width: mipmap.width,
              height: mipmap.height,
              url: mipmap.url
            };
          } );
          mipmapsLoaded++;

          if ( mipmapsLoaded === global.phet.chipper.mipmapsToBuild.length ) {

            // we've now finished loading all of the mipmaps, and can proceed with the build
            var mipmapsJavaScript = '<script type="text/javascript">window.phet.chipper.mipmaps = ' + JSON.stringify( mipmapResult ) + ';</script>';
            createHTMLFiles( grunt, buildConfig, dependenciesJSON, mipmapsJavaScript, done );
          }
        } );
      } );
    }
  }

  // After all plugins completed (which happens in requirejs:build), report which media files in the repository are unused.
  reportUnusedMedia( grunt, buildConfig.requirejsNamespace );

  createDependenciesJSON( grunt, buildConfig, createMipmaps );
};
