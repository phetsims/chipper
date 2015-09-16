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

  // modules - paths are relative to the requirejs config.js file
  var loadFileAsDataURI = require( '../../chipper/js/common/loadFileAsDataURI' );
  var getProjectURL = require( '../../chipper/js/requirejs-plugins/getProjectURL' );
  var registerLicenseEntry = require( '../../chipper/js/requirejs-plugins/registerLicenseEntry' );
  var getLicenseEntry = require( '../../chipper/js/common/getLicenseEntry' );

  // Keep track of the audio URL lists that are used during dependency
  // resolution so they can be converted to base64 at build time.
  var buildMap = {};

  // Define the plugin operations based on the RequireJS plugin API.
  return {
    load: function( name, parentRequire, onload, config ) {

      // everything after the repository namespace, eg 'MY_REPO/explosions/boom' -> '/explosions/boom'
      var audioPath = name.substring( name.indexOf( '/' ) );
      var baseUrl = getProjectURL( name, parentRequire ) + 'audio';
      var urlList = [];

      // Create an array containing a list of URLs pointing to audio files.
      if ( audioPath.indexOf( '.' ) === -1 ) {

        // Only the file stem has been specified, so assume that both mp3 and ogg files are available.
        urlList.push( { url: baseUrl + audioPath + '.mp3' } );
        urlList.push( { url: baseUrl + audioPath + '.ogg' } );
      }
      else {

        // The sound name included a type extension (e.g. '.mp3'), so just insert the full path name into the URL list.
        // This is done, at least in part, for backwards compatibility with the first version of this plugin.
        urlList.push( { url: baseUrl + audioPath } );
      }

      if ( config.isBuild ) {

        // Save in the build map for the 'write' function to use.
        buildMap[ name ] = urlList;

        // Create an adapter whose API matches the requirejs onload function.
        // This is necessary because we only want to call onload(null) once per invocation of a media plugin.
        // As a side-effect of calling registerLicenseEntry, this adapter will populate the errors array for any problem
        // license entries.
        var errors = [];
        var onloadAdapter = function( value ) { };
        onloadAdapter.error = function( error ) {
          errors.push( error );
        };

        // Register the license entries for each file.
        for ( var i = 0; i < urlList.length; i++ ) {

          // If the name has no suffix, borrow the suffix from the URL so that each file is registered, see #261
          var nameToRegister = name;
          if ( name.lastIndexOf( '.' ) < 0 ) {
            var suffix = urlList[ i ].url.substring( urlList[ i ].url.lastIndexOf( '.' ) + 1 );
            nameToRegister = name + '.' + suffix;
          }
          registerLicenseEntry( nameToRegister, getLicenseEntry( urlList[ i ].url ), global.phet.chipper.brand, 'audio', onloadAdapter );
        }

        // If any license entry was a problem, then we must fail the build. For simplicity, just report the first error.
        if ( errors.length > 0 ) {
          onload.error( errors[ 0 ] );
        }
        else {
          onload( null );
        }
      }
      else {
        // add the cache buster args to each url
        urlList.forEach( function( urlObject ){
          urlObject.url = urlObject.url + '?' + config.urlArgs;
        } );
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