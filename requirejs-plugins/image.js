// Copyright 2002-2013, University of Colorado Boulder

/**
 * Image plugin that loads an image dynamically from the file system at development time, but from base64 content after a build.
 * For development time, this is pretty similar to the image plugin at https://github.com/millermedeiros/requirejs-plugins
 *
 * The plugin code itself is excluded from the build by declaring it as a stubModule.
 *
 * @author Sam Reid
 */
define( function() {

  //Keep track of the images that are used during dependency resolution so they can be converted to base64 at compile time
  var buildMap = {};

  //This function was taken from chipper/grunt/Gruntfile.js
  var loadFileAsDataURI = function( filename ) {
    var mimeType = {
      'png': 'image/png',
      'svg': 'image/svg+xml',
      'jpg': 'image/jpeg',
      'cur': 'image/x-icon', // cursor files (used in build-a-molecule). x-win-bitmap gives off warnings in Chrome
      'mp3': 'audio/mpeg',
      'm4a': 'audio/mp4',
      'ogg': 'audio/ogg',
      'oga': 'audio/ogg',
      'bma': 'audio/webm', // webma is the full extension
      'wav': 'audio/wav'
    }[filename.slice( -3 )];

    //TODO: error check the mimeType
//    assert( mimeType, 'Unknown mime type for filename: ' + filename );

    var base64 = 'data:' + mimeType + ';base64,' + Buffer( fs.readFileSync( filename ) ).toString( 'base64' );
    return base64;
  };

  return {
    load: function( name, parentRequire, onload, config ) {
      if ( config.isBuild ) {
        buildMap[name] = parentRequire.toUrl( name );
        onload( null );
      }
      else {
        var image = new Image();
        image.onerror = function( error ) { onload.error( error ); };
        image.onload = function() {
          onload( image );

          //See https://github.com/millermedeiros/requirejs-plugins/blob/master/src/json.js
          buildMap[name] = parentRequire.toUrl( name );
          delete image.onload;
        };
        image.src = parentRequire.toUrl( name );
      }
    },

    //write method based on RequireJS official text plugin by James Burke
    //https://github.com/jrburke/requirejs/blob/master/text.js
    write: function( pluginName, moduleName, write ) {
      if ( moduleName in buildMap ) {
        var content = buildMap[moduleName];

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