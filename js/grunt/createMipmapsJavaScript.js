// Copyright 2015, University of Colorado Boulder

/**
 * Creates JavaScript for mipmaps used by the sim.
 * This will be embedded in the HTML files.
 *
 * This is one step in the 'after-requirejs-build' task.
 * See afterRequirejsBuild.js for documentation on how this step fits into that asynchronous task.
 *
 * @author Johnathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Malley (PixelZoom, Inc.)
 */
/* eslint-env node */
'use strict';

// built-in node APIs
var assert = require( 'assert' );

// modules
var createMipmap = require( '../../../chipper/js/grunt/createMipmap' );

/**
 * @param grunt - the grunt instance
 * @param {Object} buildConfig - see getBuildConfig.js
 * @param {function} callback - called when this step is completed
 */
module.exports = function( grunt, buildConfig, callback ) {

  // globals that should be defined by this point
  assert( global.phet && global.phet.chipper, 'missing global.phet.chipper' );

  // need to load mipmaps here, since we can't do it synchronously during the require.js build step
  var mipmapsLoaded = 0; // counter that indicates we are done when incremented to the number of mipmaps
  var mipmapResult = {}; // result to be attached to window.phet.chipper.mipmaps in the sim

  if ( global.phet.chipper.mipmapsToBuild.length === 0 ) {

    // No mipmaps loaded, we're done.
    callback( '<!-- no mipmaps -->' );
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

        // All mipmaps processed, we're done.
        if ( mipmapsLoaded === global.phet.chipper.mipmapsToBuild.length ) {

          // Deterministic stringification for https://github.com/phetsims/chipper/issues/419.
          // Possibly use something like https://www.npmjs.com/package/json-stable-stringify in the future?
          var mipmapNames = Object.keys( mipmapResult );
          mipmapNames.sort();
          var mipmapString = '{' + mipmapNames.map( function( name ) {
            return '"' + name + '":[' + mipmapResult[ name ].map( function( mipmap ) {
              return '{width:' + mipmap.width + ',height:' + mipmap.height + ',url:"' + mipmap.url + '"}';
            } ).join( ',' ) + ']';
          } ).join( ',' ) + '}';

          callback( 'window.phet.chipper.mipmaps = ' + mipmapString + ';' );
        }
      } );
    } );
  }
};

