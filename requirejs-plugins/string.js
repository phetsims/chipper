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
 * TODO: Lump strings together into one script block--perhaps it would be readable by the translation utility and the runtime.  This could facilitate rewriting the html in place.
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  var text = require( 'text' );
  var _ = require( '../../sherpa/lodash-2.0.0.min' );
  var getProjectURL = require( '../../chipper/requirejs-plugins/getProjectURL' );

  var FALLBACK_LOCALE = 'en';

  var parse = (typeof JSON !== 'undefined' && typeof JSON.parse === 'function') ? JSON.parse : function( text ) { return eval( '(' + text + ')' ); };

  //Finish the build step (whether the specified strings were available or just the fallback strings were).
  var buildWithStrings = function( name, parsedStrings, onload, key ) {
    var locale = null;

    //During a build, iterate over the locales and provide the strings for each
    //Enumerate all of the strings used by the sim, with no false positives
    //TODO: A better way to do this without globals?  Perhaps the export value of this function?  Or attach to the config?
    //TODO: if we stick with globals, make sure the globalStrings array is clean (undefined) when we start and delete it when we are done with it.
    //TODO: make sure this string hasn't already been written (especially with a different value)
    if ( global.phet.localesToBuild.length === 1 ) {
      locale = global.phet.localesToBuild[0];
      global.phet.strings[locale][name] = parsedStrings[key];
      onload( null );
    }

    //Load files for all languages for postprocessing step
    else {
      for ( var i = 0; i < global.phet.localesToBuild.length; i++ ) {
        locale = global.phet.localesToBuild[i];

      }
    }
  };

  return {
    load: function( name, parentRequire, onload, config ) {

      //Read the locale from a query parameter, if it is there, or use english
      var theLocaleToUseIfNotOverridenByAQueryParameter = 'en';

      if ( config.phetLocale ) {
        theLocaleToUseIfNotOverridenByAQueryParameter = config.phetLocale;
      }
      var locale = typeof window !== 'undefined' && typeof window.phetcommon !== 'undefined' && typeof window.phetcommon.getQueryParameter === 'function' ?
                   window.phetcommon.getQueryParameter( 'locale' ) || theLocaleToUseIfNotOverridenByAQueryParameter :
                   theLocaleToUseIfNotOverridenByAQueryParameter;

      // Create the paths to the string files - primary and fallback.
      var project = name.substring( 0, name.indexOf( '/' ) );
      project = project.toLowerCase() === 'bam' ? 'build-a-molecule' :
                project.toLowerCase() === 'woas' ? 'wave-on-a-string' :
                project;
      var stringPath = getProjectURL( name, parentRequire ) + 'strings/' + project.toLowerCase().split( '_' ).join( '-' ) + '-strings_' + locale + '.json';
      var fallbackStringPath = getProjectURL( name, parentRequire ) + 'strings/' + project.toLowerCase().split( '_' ).join( '-' ) + '-strings_' + FALLBACK_LOCALE + '.json';

      // Pull out the key, which is between the last slash and the first question mark of the 'name' parameter.
      var questionMarkIndex = name.lastIndexOf( '?' );
      var key = questionMarkIndex < 0 ? name.substring( name.lastIndexOf( '/' ) + 1 ) : name.substring( name.lastIndexOf( '/' ) + 1, questionMarkIndex );

      //TODO: Simplify this logic by putting if (config.isBuild) first.  window.phetcommon.getQueryParameter only available for browser,
      //TODO: Only have the option to multiple locales files when config.isBuild===true, etc.
      //TODO: Missing files only need to be checked for config.isBuild===true, in the browser we get a callback from text.get() error

      //Browser version first
      if ( !config.isBuild ) {

        //In the browser, a query parameter overrides anything, to match the behavior of the chipper version (for dynamically substituting new strings like in the translation utility)
        var queryParameterValue = window.phetcommon.getQueryParameter( key );
        if ( queryParameterValue ) {
          onload( queryParameterValue )
        }
        else {
          //TODO: load & parse just once per file
          text.get( fallbackStringPath, function( fallbackStringFile ) {
              var parsedFallbackStrings = parse( fallbackStringFile );
              var fallback = parsedFallbackStrings[key] || key;

              // Now get the primary strings.
              text.get( stringPath, function( stringFile ) {

                  // Combine the primary and fallback strings into one object hash.
                  var parsedStrings = _.extend( parsedFallbackStrings, parse( stringFile ) );
                  if ( parsedStrings[key] ) {
                    onload( parsedStrings[key] );
                  }
                  else {
                    console.log( 'string not found for key: ' + key );
                    onload( fallback );
                  }
                },
                //Error callback in the text! plugin.  Couldn't load the strings for the specified language, so use a fallback
                function() {

                  if ( !parsedFallbackStrings[key] ) {
                    //It would be really strange for there to be no fallback for a certain string, that means it exists in the translation but not the original English
                    console.log( 'no fallback for key:' + key );
                  }
                  //Running in the browser (dynamic requirejs mode) and couldn't find the string file.  Use the fallbacks.
                  console.log( "No string file provided for " + stringPath );
                  onload( fallback );
                },
                { accept: 'application/json' }
              )
            },
            onload.error,
            { accept: 'application/json' }
          )
        }
      }

      //For compiler time
      else {
        text.get( fallbackStringPath, function( fallbackStringFile ) {

            var fallback = '';
            var parsedStrings = parse( fallbackStringFile );
            if ( parsedStrings[key] ) {
              fallback = parsedStrings[key];
            }
            else {
              console.log( 'string not found for key: ' + key );
              fallback = key;
            }

            //If the language specific file is not found during compilation, then use the fallback strings, see #36
            if ( !global.fs.existsSync( stringPath ) ) {
              console.log( "No string file provided for " + stringPath + "/" + key + ", using fallback " + fallback );
              buildWithStrings( name, parsedStrings, onload, key );
            }
            else {

              // Now get the primary strings.
              text.get( stringPath, function( stringFile ) {

                  // Combine the primary and fallback strings into one object hash.
                  var parsedStrings = _.extend( parse( fallbackStringFile ), parse( stringFile ) ); // TODO: Is there a way that we can just parse once?
                  buildWithStrings( name, parsedStrings, onload, key );
                },
                onload.error,
                { accept: 'application/json' }
              )
            }
          },
          onload.error,
          { accept: 'application/json' }
        )
      }
    },

    //Write code that will look up the string in the compiled sim.
    write: function( pluginName, moduleName, write ) {
      write( 'define("' + pluginName + '!' + moduleName + '",function(){return window.phetStrings.get(\"' + moduleName + '\");});\n' );
    }
  };
} );