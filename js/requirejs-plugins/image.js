// Copyright 2002-2013, University of Colorado Boulder

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

  //Paths are relative to the requirejs config.js file
  var loadFileAsDataURI = require( '../../chipper/js/requirejs-plugins/loadFileAsDataURI' );
  var getProjectURL = require( '../../chipper/js/requirejs-plugins/getProjectURL' );
  var getLicenseEntry = require( '../../chipper/js/grunt/getLicenseEntry' );
  var LicenseEntryClassifier = require( '../../chipper/js/grunt/LicenseEntryClassifier' );

  //Keep track of the images that are used during dependency resolution so they can be converted to base64 at compile time
  var buildMap = {};

  return {
    load: function( name, parentRequire, onload, config ) {
      var imageName = name.substring( name.lastIndexOf( '/' ) );
      var path = getProjectURL( name, parentRequire ) + 'images' + imageName;

      if ( config.isBuild ) {
        buildMap[ name ] = path;
        var licenseEntry = getLicenseEntry( path );

        // Check for errors, but only if the brand is 'phet' or 'phet-io', see #176
        if ( (phet.chipper.brand === 'phet' || phet.chipper.brand === 'phet-io') && LicenseEntryClassifier.isProblematic( licenseEntry ) ) {
          onload.error( new Error( 'problematic license entry' ) );
        }
        else {
          global.phet.chipper.licenseEntries.images = global.phet.chipper.licenseEntries.images || {};
          global.phet.chipper.licenseEntries.images[ name ] = licenseEntry;
          onload( null );
        }
      }
      else {
        var image = document.createElement( 'img' );
        image.onerror = function( error ) {
          console.log( 'failed to load image: ' + path );
          onload.error( error );
        };
        image.onload = function() {
          onload( image );

          // try-catch for older browsers like Safari 6.1
          try {
            delete image.onload;
          }
          catch( e ) {}
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
