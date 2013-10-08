// Copyright 2002-2013, University of Colorado Boulder

/**
 * Image plugin that loads an image dynamically from the file system at development time, but from base64 content after a build.
 * For development time, this is pretty similar to the image plugin at https://github.com/millermedeiros/requirejs-plugins
 *
 * The plugin code itself is excluded from the build by declaring it as a stubModule
 *
 * @author Sam Reid
 */
define( [

  //Path is relative to the simulation directory where grunt is run from
  '../../chipper/requirejs-plugins/loadFileAsDataURI'], function( loadFileAsDataURI ) {

  //Keep track of the images that are used during dependency resolution so they can be converted to base64 at compile time
  var buildMap = {};

  return {
    load: function( name, parentRequire, onload, config ) {
//      console.log( 'audio plugin trying to load', name );
      if ( config.isBuild ) {
        buildMap[name] = parentRequire.toUrl( name );
        onload( null );
      }
      else {
        buildMap[name] = parentRequire.toUrl( name );
        onload( {url: parentRequire.toUrl( name )} );
      }
    },

    //write method based on RequireJS official text plugin by James Burke
    //https://github.com/jrburke/requirejs/blob/master/text.js
    write: function( pluginName, moduleName, write ) {
      if ( moduleName in buildMap ) {
        var content = buildMap[moduleName];

        var base64 = loadFileAsDataURI( content );

        //return an object with {base64:''} for interpretation by VIBE/Sound
        write( 'define("' + pluginName + '!' + moduleName + '", function(){ ' +
               'return {base64:\'' + base64 + '\'};});\n' );
      }
    }
  };
} );