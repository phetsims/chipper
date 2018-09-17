// Copyright 2013-2015, University of Colorado Boulder

/**
 * A RequireJS plugin for loading sound clips dynamically from the file system at development time and from base64
 * in built versions of simulation. It also provides the ability to convert sound files into base64 data so that it can
 * be built into a single-file simulation.  For development time, this is pretty similar to the image
 * plugin at https://github.com/millermedeiros/requirejs-plugins.
 *
 * General documentation about RequireJS plugins is available at http://requirejs.org/docs/plugins.html.
 *
 * The plugin code itself is excluded from the build by declaring it as a stubModule.
 *
 * @author John Blanco
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules - paths are relative to the requirejs config.js file
  var getLicenseEntry = require( '../../chipper/js/common/getLicenseEntry' );
  var getProjectURL = require( '../../chipper/js/requirejs-plugins/getProjectURL' );
  var loadFileAsDataURI = require( '../../chipper/js/common/loadFileAsDataURI' );
  var registerLicenseEntry = require( '../../chipper/js/requirejs-plugins/registerLicenseEntry' );

  // Keep track of the sound URL lists that are used during dependency resolution so they can be converted to base64
  // during builds.
  var buildMap = {};

  // define the plugin operations based on the RequireJS plugin API
  return {
    load: function( name, parentRequire, onload, config ) {

      // everything after the repository namespace, eg 'MY_REPO/explosions/boom' -> '/explosions/boom'
      var soundPath = name.substring( name.indexOf( '/' ) );
      var baseUrl = getProjectURL( name, parentRequire ) + 'sounds';
      var soundInfo = { url: baseUrl + soundPath };

      if ( config.isBuild ) {

        // save in the build map for the 'write' function to use
        buildMap[ name ] = soundInfo;

        // Create an adapter whose API matches the RequireJS onload function. This is necessary because we only want to
        // call onload(null) once per invocation of a media plugin. As a side-effect of calling registerLicenseEntry,
        // this adapter will populate the errors array for any license entry problems.
        var errors = [];
        var onloadAdapter = function( value ) { };
        onloadAdapter.error = function( error ) {
          errors.push( error );
        };

        // register the license for this sound clip
        registerLicenseEntry( name, getLicenseEntry( soundInfo.url ), global.phet.chipper.brand, 'sounds', onloadAdapter );

        // If any license entry was a problem, then we must fail the build. For simplicity, just report the first error.
        if ( errors.length > 0 ) {
          onload.error( errors[ 0 ] );
        }
        else {
          onload( null );
        }
      }
      else {
        // add the cache buster args to the URL
        soundInfo.url += '?' + config.urlArgs;

        // provide the URL corresponding to the specified sound
        onload( soundInfo );
      }
    },

    // The 'write' method is used during the build process to obtain the sound resource and then encode it as base64 so
    // that it can be embedded in the built HTML file.  This implementation is based on RequireJS official text plugin
    // by James Burke, see https://github.com/requirejs/text/blob/master/text.js.
    write: function( pluginName, moduleName, write ) {
      if ( moduleName in buildMap ) {
        var soundInfo = buildMap[ moduleName ];
        var base64SoundData = '{base64:\'' + loadFileAsDataURI( soundInfo.url ) + '\'}';

        // Write the base64 representation of the sound file as the return value of a function so that it can be
        // extracted and loaded in the built version of the sim.
        write( 'define("' + pluginName + '!' + moduleName + '", function(){ ' +
               'return ' + base64SoundData + ';});\n' );
      }
    }
  };
} );