// Copyright 2016, University of Colorado Boulder
define( function( module ) {
  'use strict';

  var storedID = null;
  return {
    load: function( id, require, load, config ) {
      storedID = id;
      console.log( 'phetio loading id=' + id );
      if ( config.isBuild ) {
        console.log( 'phetio plugin isbuild, id = ' + id );
        load();
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

        text = 'define("' + pluginName + '!' + moduleName + '", function(){});';
        write( text );

        // TODO: load the downstream module
      }
      else {
        // It wasn't phet-io so load an empty module instead
        text = 'define("' + pluginName + '!' + moduleName + '", function(){});';
        write( text );
      }
    }
  };
} );