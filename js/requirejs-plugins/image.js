// Copyright 2013-2015, University of Colorado Boulder

/**
 * Image plugin that loads an image dynamically from the file system at development time, but from base64 content after a build.
 * For development time, this is pretty similar to the image plugin at https://github.com/millermedeiros/requirejs-plugins
 *
 * The plugin code itself is excluded from the build by declaring it as a stubModule.
 *
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules - paths are relative to the requirejs config.js file
  var getLicenseEntry = require( '../../chipper/js/common/getLicenseEntry' );
  var getProjectURL = require( '../../chipper/js/requirejs-plugins/getProjectURL' );
  var loadFileAsDataURI = require( '../../chipper/js/common/loadFileAsDataURI' );
  var registerLicenseEntry = require( '../../chipper/js/requirejs-plugins/registerLicenseEntry' );

  //Keep track of the images that are used during dependency resolution so they can be converted to base64 at compile time
  var buildMap = {};

  return {
    load: function( name, parentRequire, onload, config ) {

      // everything after the repository namespace, eg 'FUNCTION_BUILDER/functions/feet.png' -> '/functions/feet.png'
      var imagePath = name.substring( name.indexOf( '/' ) );
      var path = getProjectURL( name, parentRequire ) + 'images' + imagePath;

      if ( config.isBuild ) {
        buildMap[ name ] = path;
        registerLicenseEntry( name, getLicenseEntry( path ), global.phet.chipper.brand, 'images', onload );
      }
      else {
        var image = document.createElement( 'img' );
        image.onerror = function( error ) {
          onload.error( error );
        };
        image.onload = function() {
          onload( image );

          // try-catch for older browsers like Safari 6.1
          try {
            delete image.onload;
          }
          catch( e ) {
            // do nothing
          }
        };
        image.src = path + '?' + config.urlArgs;
      }
    },

    //write method based on RequireJS official text plugin by James Burke
    //https://github.com/jrburke/requirejs/blob/master/text.js
    write: function( pluginName, moduleName, write ) {
      if ( moduleName in buildMap ) {
        var content = buildMap[ moduleName ];

        var base64 = loadFileAsDataURI( content );

        //Write code that will load the image and register with a global `phetImages` to make sure everything loaded, see SimLauncher.js
        write( 'define("' + pluginName + '!' + moduleName + '", function(){ ' +
               'var img = new Image();\n' +
               'window.phetImages = window.phetImages || []\n' +
               'window.phetImages.push(img);\n' +
               'img.src=\'' + base64 + '\';\n' +
               'return img;});\n' );
      }
    }

  };
} );
