// Copyright 2002-2013, University of Colorado Boulder

var req = require;

/**
 * Alternative to the image plugin, that during development (require.js) will generate mipmaps, but during a chipper
 * build will pregenerate the mipmaps.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
define( function( require ) {
  'use strict';

  //Paths are relative to the requirejs config.js file
  var getProjectURL = require( '../../chipper/js/requirejs-plugins/getProjectURL' );
  var mipmapDownscale = require( '../../chipper/js/requirejs-plugins/mipmapDownscale' );

  //Keep track of the images that are used during dependency resolution so they can be converted to base64 at compile time
  var buildMap = {};

  return {
    load: function( name, parentRequire, onload, config ) {
      var imageName = name.substring( name.lastIndexOf( '/' ) );
      if ( imageName.indexOf( ',' ) >= 0 ) {
        imageName = imageName.substring( 0, imageName.indexOf( ',' ) );
      }
      var path = getProjectURL( name, parentRequire ) + 'images' + imageName;

      // defaults
      var options = {
        level: 4, // maximum level
        quality: 98
      };
      if ( name.indexOf( ',' ) ) {
        name.substring( name.indexOf( ',' ) + 1 ).split( ',' ).forEach( function( clause ) {
          var keyValue = clause.split( '=' );
          var key = keyValue[0];
          var value = keyValue[1];
          options[key] = parseInt( value );
        } );
      }

      if ( config.isBuild ) {
        global.phet.mipmapsToBuild.push( {
          name: name,
          path: path,
          level: options.level,
          quality: options.quality
        } );
        onload( null ); // r.js fails if plugins aren't synchronous with isBuild == true
      }
      else {
        var image = document.createElement( 'img' );
        image.onerror = function( error ) {
          console.log( 'failed to load image: ' + path );
          onload.error( error );
        };
        image.onload = function() {
          // try-catch for older browsers like Safari 6.1
          try {
            delete image.onload;
          }
          catch ( e ) {}

          var mipmaps = [];

          // var a = Date.now();

          var baseCanvas = document.createElement( 'canvas' );
          baseCanvas.width = image.naturalWidth;
          baseCanvas.height = image.naturalHeight;
          var baseContext = baseCanvas.getContext( '2d' );
          baseContext.drawImage( image, 0, 0 );
          var baseURL = baseCanvas.toDataURL();
          var baseImage = new Image();
          baseImage.src = baseURL;
          mipmaps.push( {
            canvas: baseCanvas,
            url: baseURL,
            width: image.naturalWidth,
            height: image.naturalHeight,
            data: baseContext.getImageData( 0, 0, image.naturalWidth, image.naturalHeight ).data,
            img: baseImage
          } );

          function finestMipmap() {
            return mipmaps[ mipmaps.length - 1 ];
          }
          while ( ( mipmaps.length - 1 < options.level || options.level < 0 ) &&
                  ( finestMipmap().width > 1 || finestMipmap().height > 1 ) ) {
            var canvas = document.createElement( 'canvas' );
            var context = canvas.getContext( '2d' );
            var imageData;
            var mipmap = mipmapDownscale( finestMipmap(), function( width, height ) {
              imageData = context.createImageData( width, height );
              return imageData.data;
            } );
            canvas.width = mipmap.width;
            canvas.height = mipmap.height;
            context.putImageData( imageData, 0, 0 );

            mipmap.canvas = canvas;
            mipmap.url = canvas.toDataURL();

            // preloading image
            mipmap.img = new Image();
            mipmap.img.src = mipmap.url;

            mipmaps.push( mipmap );
          }

          // console.log( Date.now() - a );

          onload( mipmaps );
        };
        image.src = path + '?' + config.urlArgs;
      }
    },

    //write method based on RequireJS official text plugin by James Burke
    //https://github.com/jrburke/requirejs/blob/master/text.js
    write: function( pluginName, moduleName, write ) {
      // We load the mipmap info (width/height/url for each level) from window.phet.chipper.mipmaps, and then
      // load an HTML Image for each level before the sim launches. This will ensure that the images will immediately
      // appear.
      write( 'define("' + pluginName + '!' + moduleName + '", function(){\n' +
             '  var mipmaps = window.phet.chipper.mipmaps["' + moduleName + '"];\n' +
             '  window.phetImages = window.phetImages || []\n' + // ensure reference
             '  mipmaps.forEach( function( mipmap ) {\n' +
             '    mipmap.img = new Image();\n' +
             '    window.phetImages.push( mipmap.img );\n' + // make sure it's loaded before the sim launches
             '    mipmap.img.src = mipmap.url;\n' + // trigger the loading of the image for its level
             '  } );\n' +
             '  return mipmaps;\n' +
             '} );\n' );
    }

  };
} );
