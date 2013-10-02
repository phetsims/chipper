// Copyright 2002-2013, University of Colorado Boulder

/**
 * String plugin, loads a string using a syntax like:
 * var title = require( 'string!JOHN_TRAVOLTAGE/johnTravoltage.name' );
 *
 * The reasons we need our own string plugin:
 * So we can only include the (possibly) strings that are needed for a sim
 * So we can enumerate all of the used strings, for purposed of a translation utility
 * For uniformity with image and audio plugin
 *
 * TODO: exclude the plugin itself from build file.  RequireJS docs said there is an easy way to do so
 * TODO: Currently hard coded to use English.  Provide support for any language.
 * TODO: Should we build all strings into the final HTML file, or separate HTML file per language?
 * TODO: Provide fallbacks to higher languages for missing strings
 * @author Sam Reid
 */
define( function() {

  //Keep track of the strings that are used during dependency resolution so they can be looked up at build time
  var buildMap = {};

  var locale = 'en';

  return {
    load: function( name, parentRequire, onload, config ) {

      var url = parentRequire.toUrl( name );
      console.log( 'found url: ' + url );
      var question = url.lastIndexOf( '?' );
      var key = question < 0 ? url.substring( url.lastIndexOf( '/' ) + 1 ) : url.substring( url.lastIndexOf( '/' ) + 1, question );

      var project = name.substring( 0, name.indexOf( '/' ) );

      var stringPath = project.toLowerCase().split( '_' ).join( '-' ) + '-strings_' + locale;

      if ( config.isBuild ) {
        buildMap[name] = url;
        onload( null );
      }
      else {
        //Load it through the module system
//        debugger;
        parentRequire( [project + '/../nls/' + stringPath], function( stringFile ) {
          console.log( 'loaded through module system: ' + stringFile );
          console.log( 'checking query parameter:', key );
          var queryParameterValue = window.phetcommon.getQueryParameter( key );
          if ( queryParameterValue ) {
            onload( queryParameterValue );
          }
          else {
            onload( stringFile[key] );
          }
        } );
      }
    },

    //write method based on RequireJS official text plugin by James Burke
    //https://github.com/jrburke/requirejs/blob/master/text.js
    write: function( pluginName, moduleName, write ) {
      if ( moduleName in buildMap ) {
        var filename = buildMap[moduleName];
        var project = moduleName.substring( 0, moduleName.indexOf( '/' ) );
        var stringPath = project.toLowerCase().split( '_' ).join( '-' ) + '-strings_' + locale;
        var file = filename.substring( 0, filename.lastIndexOf( '/' ) ) + '/../nls/' + stringPath + '.js';

        //Load the string file, and evaluate with eval().  TODO: should these be JSON?
        //TODO: This may be inefficient at build time, since the same file may be loaded many times (one per string at worst)
        //TODO: We could cache those file loads

        //Load the file from the file system
        //TODO: What if it is UTF-16 or something?
        var loadedFile = fs.readFileSync( file, 'utf8' );

        //TODO: if the file doesn't use define({}), this will not work
        loadedFile = loadedFile.substring( loadedFile.indexOf( 'define' ) + 'define'.length );
        var evaled = eval( loadedFile );
        var key = moduleName.substring( moduleName.lastIndexOf( '/' ) + 1 );
        var value = evaled[key];

        console.log( 'pluginName: ' + pluginName );
        console.log( 'moduleName: ' + moduleName );
        console.log( 'found filename: ' + filename );
        console.log( 'file', file );
        console.log( 'loaded file', loadedFile );
        console.log( 'evaled', evaled );

        console.log( key );
        console.log( value );


//        define("string!ENERGY_SKATE_PARK/tab.introduction", function(){ return window.phetcommon.getQueryParameter( key ) || "Intro";};});

        //TODO: Will this harm performance on startup?
        //TODO: Do we need to encodeURIComponent on the key here?  Or decode the value?
        //TODO: why is the string coming out lower case
        var expression = 'window.phetcommon.getQueryParameter( "' + key + '" ) || "' + value + '";';

        //Write code that will load the image and register with a global `phetImages` to make sure everything loaded, see SimLauncher.js
//        write( 'define("' + pluginName + '!' + moduleName + '", function(){ return "' + value + '";});\n' );
        write( 'define("' + pluginName + '!' + moduleName + '", function(){ return ' + expression + ';});\n' );

        //Enumerate all of the strings used by the sim, with no false positives
        //TODO: A better way to do this without globals?  Perhaps the export value of this function?
        //TODO: if we stick with globals, make sure the globalStrings array is clean (undefined) when we start and delete it when we are done with it.
        global.globalStrings = global.globalStrings || [];
        global.globalStrings.push( {key: moduleName, value: value} );
      }
    }
  };
} );