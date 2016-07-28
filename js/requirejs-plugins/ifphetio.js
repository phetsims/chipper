// Copyright 2016, University of Colorado Boulder

/**
 * This plugin conditionally loads another module based on the brand.  If the brand is phet-io, it loads the module
 * otherwise it returns a no-op function, so that parametric wrapper types will not exception out even in "phet" brand.
 *
 * The module works for requirejs mode and during the build.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( module ) {
  'use strict';

  var buildMap = {};
  var NO_OP = function() {};

  return {

    load: function( id, require, load, config ) {
      if ( config.isBuild ) {

        var url = require.toUrl( id );

        if ( /\.js$/.test( url ) === false ) {
          url += '.js';
        }

        if ( global.phet.chipper.brand === 'phet-io' ) {

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
        var brand = window.phet.chipper.brand;
        if ( brand === 'phet-io' ) {
          require( [ id ], load );
        }
        else {
          load( NO_OP );
        }
      }
    },

    write: function( pluginName, moduleName, write ) {
      var text = null;
      if ( global.phet.chipper.brand === 'phet-io' ) {
        text = 'define("' + moduleName + '", function(){' + buildMap[ moduleName ].content + '});';
        write.asModule( moduleName, text, buildMap[ moduleName ].content );
      }
      else {
        // It wasn't phet-io so load an empty module instead
        text = 'define("' + moduleName + '", function(){return function(){};});';
        write( text );
      }
    }
  };
} );