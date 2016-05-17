// Copyright 2016, University of Colorado Boulder
define( function( module ) {
  'use strict';

  var storedID = null;
  var buildMap = {};
  return {
    load: function( id, require, load, config ) {
      storedID = id;
      console.log( 'phetio loading id=' + id );
      if ( config.isBuild ) {
        console.log( 'phetio plugin isbuild, id = ' + id );

        var url = require.toUrl( id );

        if ( /\.js$/.test( url ) === false ) {
          url += ".js";
        }

        buildMap[ id ] = {
          content: global.phet.chipper.grunt.file.read( url ),
          attach: module.attach
        };
        console.log( 'build map got ', buildMap[ id ].content );

        require( [ id ], load );
      }
      else {
        var brand = window.phet.chipper.brand;
        console.log( 'found brand', brand );
        if ( brand === 'phet-io' ) {
          require( [ id ], load );
        }
        else {
          load();
        }
      }
    },
    write: function( pluginName, moduleName, write ) {
      console.log( 'module content: ', module.content );
      console.log( 'phetio.write, brand=', global.phet.chipper.brand );
      console.log( 'storedid was ', storedID );
      var text = null;
      if ( global.phet.chipper.brand === 'phet-io' ) {

        console.log( '########' );
        console.log( 'Build Map was' );
        console.log( buildMap[ moduleName ].content );

        // text = 'define("' + pluginName + '!' + moduleName + '", function(){' + buildMap[ moduleName ].content + '});';
        text = 'define("' + moduleName + '", function(){' + buildMap[ moduleName ].content + '});';
        console.log( '>>>>>WRITING MODULE\n' + text );
        write.asModule( moduleName, text, buildMap[ moduleName ].content );

        console.log( '########' );
      }
      else {
        // It wasn't phet-io so load an empty module instead
        // text = 'define("' + pluginName + '!' + moduleName + '", function(){});';
        text = 'define("' + moduleName + '", function(){});';
        write( text );
      }
    }
  };
} );