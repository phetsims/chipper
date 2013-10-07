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
 * The plugin code itself is excluded from the build by declaring it as a stubModule
 *
 * TODO: Can we use require( 'string!JOHN_TRAVOLTAGE:johnTravoltage.name' ) instead of require( 'string!JOHN_TRAVOLTAGE/johnTravoltage.name' )?
 * TODO: Currently hard coded to use English.  Provide support for any language.
 * TODO: Should we build all strings into the final HTML file, or separate HTML file per language?
 * TODO: Provide fallbacks to higher languages for missing strings
 * TODO: Could lump strings together into one script block--perhaps it would be readable by the translation utility and the runtime.
 *       This could facilitate rewriting the html in place.
 * @author Sam Reid
 */
define( ['text'], function( text ) {

  //Read the locale from a query parameter, if it is there, or use english
  //TODO: The locale should be updated to support translated minified versions
  var locale = typeof window !== 'undefined' && typeof window.phetcommon !== 'undefined' && typeof window.phetcommon.getQueryParameter === 'function' ?
               window.phetcommon.getQueryParameter( 'locale' ) || 'en' :
               'en';

  //Keep track of the strings that are used during dependency resolution so they can be looked up at build time
  var buildMap = {};

  var parse = (typeof JSON !== 'undefined' && typeof JSON.parse === 'function') ? JSON.parse : function( text ) { return eval( '(' + text + ')' ); };

  return {
    load: function( name, parentRequire, onload, config ) {

      var url = parentRequire.toUrl( name );

      var questionMarkIndex = url.lastIndexOf( '?' );
      var key = questionMarkIndex < 0 ? url.substring( url.lastIndexOf( '/' ) + 1 ) : url.substring( url.lastIndexOf( '/' ) + 1, questionMarkIndex );
      var urlWithoutQuery = questionMarkIndex < 0 ? url : url.substring( 0, questionMarkIndex );
      var urlWithoutString = urlWithoutQuery.substring( 0, urlWithoutQuery.lastIndexOf( '/' ) );

      var project = name.substring( 0, name.indexOf( '/' ) );
      project = project.toLowerCase() === 'bam' ? 'build-a-molecule' :
                project.toLowerCase() === 'woas' ? 'wave-on-a-string' :
                project;

//      var stringPath = project.toLowerCase().split( '_' ).join( '-' ) + '-strings_' + locale;
      var stringPath = urlWithoutString + '/../strings/' + project.toLowerCase().split( '_' ).join( '-' ) + '-strings_' + locale + '.json';

//      console.log( 'found url: ' + url );
//      console.log( 'found urlwithout query: ' + urlWithoutQuery );
//      console.log( 'found urlwithoutString: ' + urlWithoutString );
//      console.log( 'string path: ' + stringPath );
//      console.log( 'project: ', project );

      text.get( stringPath, function( stringFile ) {

          //put parsed json in the loaded file so we don't have to reparse
          if ( config.isBuild ) {
            buildMap[name] = parse( stringFile );
            onload( null );
          }

          else {

            //TODO: move the config.isBuild call here, by putting the stringFile data into the buildMap, like in the json plugin
//            console.log( 'loaded through module system: ' + stringFile );
//            console.log( 'checking query parameter:', key );
            var queryParameterValue = window.phetcommon.getQueryParameter( key );
            if ( queryParameterValue ) {
              onload( queryParameterValue );
            }
            else {
              var parsed = parse( stringFile );
              if ( parsed[key] ) {
                onload( parsed[key] );
              }
              else {
                console.log( 'string not found for key: ' + key );
                onload( key );
              }
            }
          }
        },
        onload.error, {
          accept: 'application/json'
        }
      );
    },

    //write method based on RequireJS official text plugin by James Burke
    //https://github.com/jrburke/requirejs/blob/master/text.js
    write: function( pluginName, moduleName, write ) {
//      console.log( 'write1' );
      if ( moduleName in buildMap ) {
//        console.log( 'write2' );
        var json = buildMap[moduleName ];
        var key = moduleName.substring( moduleName.lastIndexOf( '/' ) + 1 );
        var value = json[key];

//        console.log( 'pluginName: ' + pluginName );
//        console.log( 'moduleName: ' + moduleName );
//        console.log( 'json', json );
//
//        console.log( key );
//        console.log( value );

        //TODO: Do we need to encodeURIComponent on the key here?  Or decode the value?
        var expression = 'window.phetcommon.getQueryParameter( "' + key + '" ) || "' + value + '";';

        //Write code that will load the image and register with a global `phetImages` to make sure everything loaded, see SimLauncher.js
//        write( 'define("' + pluginName + '!' + moduleName + '", function(){ return "' + value + '";});\n' );
        write( 'define("' + pluginName + '!' + moduleName + '", function(){ return ' + expression + ';});\n' );

        //Enumerate all of the strings used by the sim, with no false positives
        //TODO: A better way to do this without globals?  Perhaps the export value of this function?  Or attach to the config?
        //TODO: if we stick with globals, make sure the globalStrings array is clean (undefined) when we start and delete it when we are done with it.
        global.globalStrings = global.globalStrings || {};

        //TODO: make sure this string hasn't already been written (especially with a different value)
        global.globalStrings[moduleName] = value;
      }
    }
  };
} );