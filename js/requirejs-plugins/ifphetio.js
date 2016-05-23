// Copyright 2016, University of Colorado Boulder
define( function( module ) {
  'use strict';

  var buildMap = {};
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
          load();
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
        text = 'define("' + moduleName + '", function(){});';
        write( text );
      }
    }
  };
} );