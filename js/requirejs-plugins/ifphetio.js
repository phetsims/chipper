// Copyright 2016, University of Colorado Boulder

/**
 * This plugin conditionally loads another module based on the brand.  If the brand is phet-io, it loads the module
 * otherwise it returns a no-op function, so that parametric IO types will not exception out even in "phet" brand.
 *
 * The module works for requirejs mode and during the build.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( module ) {
  'use strict';

  var buildMap = {};

  return {

    /**
     * Required API function that loads a resource.
     * See http://requirejs.org/docs/plugins.html#apiload for description of parameters.
     */
    load: function( id, require, load, config ) {
      if ( config.isBuild ) {

        var url = require.toUrl( id );

        if ( /\.js$/.test( url ) === false ) {
          url += '.js';
        }

        if ( global.phet && global.phet.chipper && global.phet.chipper.brand === 'phet-io' ) {

          buildMap[ id ] = {
            content: global.phet.chipper.grunt.file.read( url ),
            attach: module.attach
          };

          require( [ id ], load );
        }
        else {
          load();
        }
      }
      else {
        var brand = window.phet && window.phet.chipper && window.phet.chipper.brand;
        if ( brand === 'phet-io' ) {
          require( [ id ], load );
        }
        else {
          load( function() {} );
        }
      }
    },

    /**
     * Used by the optimizer to indicate when the plugin should write out a representation of the resource
     * in the optimized file. See http://requirejs.org/docs/plugins.html#apiwrite for description of parameters.
     */
    write: function( pluginName, moduleName, write ) {
      var text = null;
      if ( global.phet && global.phet.chipper && global.phet.chipper.brand === 'phet-io' ) {
        text = 'define("' + moduleName + '", function(){' + buildMap[ moduleName ].content + '});';
        write.asModule( moduleName, text, buildMap[ moduleName ].content );
      }
      else {
        text = 'define("' + moduleName + '", function(){return function(){ return function(){}; };});';
        write( text );
      }
    }
  };
} );