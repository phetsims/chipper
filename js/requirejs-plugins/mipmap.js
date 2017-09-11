// Copyright 2015, University of Colorado Boulder

/**
 * Alternative to the image plugin, that during development (require.js) will generate mipmaps, but during a chipper
 * build will pregenerate the mipmaps. The output is compatible with Scenery's Image, but is not an HTMLImageElement
 * (so full compatibility with the image plugin is not possible).
 *
 * The mipmapping plugin currently only supports PNG and JPEG for input and output (can't use SVG files directly, since
 * those would require native dependencies to rasterize in Node.js).
 *
 * Usage grammar:
 * "require( 'mipmap!" image-path ["," optionKey "=" optionValue]* "' );"
 *
 * Examples:
 * require( 'mipmap!FORCES_AND_MOTION_BASICS/crate.png' );
 * require( 'mipmap!FORCES_AND_MOTION_BASICS/crate.png,level=5,quality=90' );
 *
 * There are currently two main options to be provided:
 * level - What the maximum mipmap level computed should be. Level 0 is the original image, level 1 is a half-size
 *         image, level 2 is a quarter-size image, etc. Default value is up to level 4. If -1 is passed as the level
 *         then all mipmap levels up to a 1x1 image will be computed. Mipmaps will only be computed up to a 1x1 image
 *         if a higher maximum level was set.
 * quality - Currently the JPEG encoding quality (1-100) for when JPEG images are an output option (which happens when
 *           the entire image is fully opaque). Default is 98. This parameter is only used for the build, as the
 *           require.js runtime version will always use PNG (the browser default for toDataURL()).
 *
 * The output of the mipmap require() will be an Array of mipmap objects of the form:
 * {
 *   width: {number} - Width of the image for this mipmap level
 *   height: {number} - Height of the image for this mipmap level
 *   url: {string} - Data URL with encoded PNG/JPEG data for the image for this mipmap level
 *   img: {HTMLImageElement} - Preloaded Image DOM element with the url.
 * }
 * The result array indices are equal to the mipmap level (mipmaps[0] is level 0, mipmaps[5] is level 5, etc.)
 *
 * Internal codepaths:
 * - Require.js runtime: load() is called, we asynchronously load the base image from the path provided, and then
 *                       synchronously generate the mipmap levels and structure. When done, onload( mipmaps ) is called
 *                       so that 'mipmaps' is the value require() statements return. Additionally, depending on the
 *                       presence of the buildCompatible query parameter, it will either use a fast Canvas-based mipmap
 *                       computation (if buildCompatible is not present), or use the same high-quality pixel-based
 *                       mipmap computation of the build.
 * - Chipper grunt build: r.js build will call load() with config.isBuild == true. We'll push path/module-name/options
 *                        to global.phet.chipper.mipmapsToBuild (created in the main build gruntfile), not doing any processing
 *                        at that time. Then write() is called, and we return a JS stub (to be inserted into the built
 *                        file like a define() block for a module) that will look up mipmap info from
 *                        window.phet.chipper.mipmaps, create a DOM Image for each level and notify Joist to wait until
 *                        all of the level images are loaded (currently done with window.phetImages). Later in the build
 *                        process, our Gruntfile will scan global.phet.chipper.mipmapsToBuild, asynchronously build high-quality
 *                        mipmaps, and will add JS to insert the mipmap objects (missing the DOM image) into
 *                        window.phet.chipper.mipmaps. Delaying mipmap computation until later in the build is clunky,
 *                        but required since require.js only supports the build-step synchonously and our image decoder
 *                        handles things asynchronously. See http://requirejs.org/docs/plugins.html:
 *                        > The optimizer traces dependencies synchronously to simplify the optimization logic. This is
 *                        > different from how require.js in the browser works, and it means that only plugins that can
 *                        > satisfy their dependencies synchronously should participate in the optimization steps that
 *                        > allow inlining of loader plugin values.
 *
 * For details on the high-quality mipmapping, see documentation for createMipmap.js.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
define( function( require ) {
  'use strict';

  // modules - paths are relative to the requirejs config.js file
  var getLicenseEntry = require( '../../chipper/js/common/getLicenseEntry' );
  var getProjectURL = require( '../../chipper/js/requirejs-plugins/getProjectURL' );
  var mipmapDownscale = require( '../../chipper/js/common/mipmapDownscale' );
  var registerLicenseEntry = require( '../../chipper/js/requirejs-plugins/registerLicenseEntry' );

  return {
    // called both in-browser and during build
    load: function( name, parentRequire, onload, config ) {

      // everything after the repository namespace, eg 'FUNCTION_BUILDER/functions/feet.png' -> '/functions/feet.png'
      var imagePath = name.substring( name.indexOf( '/' ) );

      // strip off optional arguments, eg '/functions/feet.png,level=5,quality=90' -> '/functions/feet.png'
      if ( imagePath.indexOf( ',' ) >= 0 ) {
        imagePath = imagePath.substring( 0, imagePath.indexOf( ',' ) );
      }

      // the path to our image file.
      var path = getProjectURL( name, parentRequire ) + 'images' + imagePath;

      // defaults
      var options = {
        level: 4, // maximum level
        quality: 98
      };

      // allow overriding the options via comma-separated clauses (see grammar above)
      if ( name.indexOf( ',' ) ) {
        name.substring( name.indexOf( ',' ) + 1 ).split( ',' ).forEach( function( clause ) {
          var keyValue = clause.split( '=' );
          var key = keyValue[ 0 ];
          var value = keyValue[ 1 ];
          options[ key ] = parseInt( value, 10 );
        } );
      }

      if ( config.isBuild ) {
        // Store a record that our mipmaps will need to be computed later in the build, and should be provided for the
        // module name 'name'.
        global.phet.chipper.mipmapsToBuild = global.phet.chipper.mipmapsToBuild || []; // initialize if this is the first mipmap
        global.phet.chipper.mipmapsToBuild.push( {
          name: name,
          path: path,
          level: options.level,
          quality: options.quality
        } );

        // remove optional args from name
        var optionsIndex = name.indexOf( ',' );
        var nameNoArgs = ( optionsIndex === -1 ) ? name : name.substring( 0, optionsIndex );

        registerLicenseEntry( nameNoArgs, getLicenseEntry( path ), global.phet.chipper.brand, 'images', onload );
      }
      else {
        // if buildCompatible is provided, use the high-quality build-like mipmapping
        var highQualityMipmaps = phet.chipper.queryParameters.buildCompatible;

        // load our base resolution image
        var image = document.createElement( 'img' );
        image.onerror = function( error ) {
          onload.error( error );
        };
        image.onload = function() {
          // try-catch for older browsers like Safari 6.1
          try {
            delete image.onload;
          }
          catch( e ) {
            // do nothing
          }

          var mipmaps = [];

          // draw it to a Canvas and set up the base mipmap level information
          var baseCanvas = document.createElement( 'canvas' );
          baseCanvas.width = image.naturalWidth;
          baseCanvas.height = image.naturalHeight;
          var baseContext = baseCanvas.getContext( '2d' );
          baseContext.drawImage( image, 0, 0 );
          var baseURL = baseCanvas.toDataURL();
          var baseImage = new Image(); // eslint-disable-line no-html-constructors
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

          // compute the non-level-0 mipmaps
          while ( ( mipmaps.length - 1 < options.level || options.level < 0 ) &&
                  ( finestMipmap().width > 1 || finestMipmap().height > 1 ) ) {
            var canvas = document.createElement( 'canvas' );
            var context = canvas.getContext( '2d' );
            var mipmap;
            if ( highQualityMipmaps ) {
              var imageData;
              mipmap = mipmapDownscale( finestMipmap(), function( width, height ) {
                // Callback to create the typed array, but we want to store a reference to the ImageData container
                // since we can use it to do a putImageData call later, instead of having to create a typed array
                // AND an ImageData.
                imageData = context.createImageData( width, height );
                return imageData.data;
              } );
              canvas.width = mipmap.width;
              canvas.height = mipmap.height;
              context.putImageData( imageData, 0, 0 );
            }
            else {
              // Lower-quality downscale by using the built-in Canvas drawImage. Somewhat dependent on the browser
              // implementation.
              mipmap = {};
              var largeCanvas = finestMipmap().canvas;
              canvas.width = mipmap.width = Math.ceil( largeCanvas.width / 2 );
              canvas.height = mipmap.height = Math.ceil( largeCanvas.height / 2 );
              context.setTransform( 0.5, 0, 0, 0.5, 0, 0 );
              context.drawImage( largeCanvas, 0, 0 );
            }

            // provide access to the Canvas for the next mipmap level
            mipmap.canvas = canvas;
            mipmap.url = canvas.toDataURL();

            // preloading image
            mipmap.img = new Image(); // eslint-disable-line no-html-constructors
            mipmap.img.src = mipmap.url;

            mipmaps.push( mipmap );
          }

          onload( mipmaps );
        };

        // trigger loading of the image, so that our onload is guaranteed to be called
        image.src = path + '?' + config.urlArgs;
      }
    },

    // called to provide the raw JS string to be written into the build output
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
             '    mipmap.canvas = document.createElement( \'canvas\' );\n' +
             '    mipmap.canvas.width = mipmap.width;\n' +
             '    mipmap.canvas.height = mipmap.height;\n' +
             '    var context = mipmap.canvas.getContext( \'2d\' );\n' +
             '    mipmap.updateCanvas = function() {\n' +
             '      if ( mipmap.img.complete && ( typeof mipmap.img.naturalWidth === \'undefined\' || mipmap.img.naturalWidth > 0 ) ) {\n' +
             '        context.drawImage( mipmap.img, 0, 0 );\n' +
             '        delete mipmap.updateCanvas;\n' +
             '      }\n' +
             '    };\n' +
             '  } );\n' +
             '  return mipmaps;\n' +
             '} );\n' );
    }

  };
} );
