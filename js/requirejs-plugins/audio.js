// Copyright 2002-2013, University of Colorado Boulder

/**
 * Audio plugin that loads an audio clip dynamically from the file system at
 * development time, but from base64 content after a build. For development time,
 * this is pretty similar to the image plugin at https://github.com/millermedeiros/requirejs-plugins.
 *
 * The plugin code itself is excluded from the build by declaring it as a stubModule.
 *
 * @author Sam Reid
 * @author John Blanco
 */
define( function( require ) {
  'use strict';

  //Paths are relative to the requirejs config.js file
  var loadFileAsDataURI = require( '../../chipper/js/requirejs-plugins/loadFileAsDataURI' );
  var getProjectURL = require( '../../chipper/js/requirejs-plugins/getProjectURL' );
  var checkAndRegisterLicenseEntry = require( '../../chipper/js/grunt/checkAndRegisterLicenseEntry' );

  // Keep track of the audio URL lists that are used during dependency
  // resolution so they can be converted to base64 at build time.
  var buildMap = {};

  // Define the plugin operations based on the RequireJS plugin API.
  return {
    load: function( name, parentRequire, onload, config ) {
      var audioName = name.substring( name.lastIndexOf( '/' ) + 1 );
      var baseUrl = getProjectURL( name, parentRequire ) + 'audio/';
      var urlList = [];

      // Create an array containing a list of URLs pointing to audio files.
      if ( audioName.indexOf( '.' ) === -1 ) {
        // Only the file stem has been specified, so assume that both mp3 and
        // ogg files are available.
        urlList.push( { url: baseUrl + audioName + '.mp3' } );
        urlList.push( { url: baseUrl + audioName + '.ogg' } );
      }
      else {
        // The sound name included a type extension (e.g. '.mp3'), so just
        // insert the full path name into the URL list.  This is done, at
        // least in part, for backwards compatibility with the first version
        // of this plugin.
        urlList.push( { url: baseUrl + audioName } );
      }

      if ( config.isBuild ) {
        // Save in the build map for the 'write' function to use.
        buildMap[ name ] = urlList;

        // Check the license entries for each file
        var errors = [];
        var onLoadAdapter = function() { };
        onLoadAdapter.error = function( error ) {
          errors.push( error );
        };
        for ( var i = 0; i < urlList.length; i++ ) {
          checkAndRegisterLicenseEntry( name, urlList[ i ].url, phet.chipper.brand, 'audio', onLoadAdapter );
        }

        // If any license entry was a problem, then we must fail the build, for simplicity, just report the first error
        if ( errors.length > 0 ) {
          onload.error( errors[ 0 ] );
        }
        else {
          onload( null );
        }
      }
      else {
        // Provide the list of URLs corresponding to the specified sound.
        onload( urlList );
      }
    },

    //write method based on RequireJS official text plugin by James Burke
    //https://github.com/jrburke/requirejs/blob/master/text.js
    write: function( pluginName, moduleName, write ) {
      if ( moduleName in buildMap ) {
        var urlList = buildMap[ moduleName ];
        var base64ListText = '[';
        for ( var i = 0; i < urlList.length; i++ ) {
          var base64 = loadFileAsDataURI( urlList[ i ].url );
          base64ListText += '{base64:\'' + base64 + '\'}';
          base64ListText += i === urlList.length - 1 ? '\n' : ',\n';
        }
        base64ListText += ']';
        // Return an array of objects with {base64:''} for interpretation by VIBE/Sound
        write( 'define("' + pluginName + '!' + moduleName + '", function(){ ' +
               'return ' + base64ListText + ';});\n' );
      }
    }
  };
} );