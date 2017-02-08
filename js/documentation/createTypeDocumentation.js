// Copyright 2016, University of Colorado Boulder

/**
 * Generates the PhET-iO API Type documentation which will be shown at https://phet-io.colorado.edu/devguide/
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';
var requirejs = require( '../../node_modules/requirejs/bin/r.js' ); // eslint-disable-line require-statement-match
var fs = require( 'fs' );

// Mock up window globals for running in node mode
global.assert = require( 'assert' );
global._ = require( '../../../sherpa/lib/lodash-4.17.4.js' );
global.phet = {
  chipper: {
    queryParameters: {}
  },
  phetio: {
    queryParameters: {
      phetioExpressions: '[]'
    }
  }
};

global.window = global; // eslint-disable-line no-native-reassign

var assert = global.assert;

requirejs.config( {
  paths: {
    text: '../../../sherpa/lib/text-2.0.12',
    AXON: '../../../axon/js',
    REPOSITORY: '../..',
    PHET_CORE: '../../../phet-core/js',
    PHETCOMMON: '../../../phetcommon/js',
    PHET_IO: '../../../phet-io/js',
    TANDEM: '../../../tandem/js'
  }
} );

var TObject = requirejs( 'PHET_IO/types/TObject' );

// Get a list of all of the types in the 'types' directory
var walkSync = function( dir, filelist ) {
  var files = fs.readdirSync( dir );
  filelist = filelist || [];
  files.forEach( function( file ) {
    if ( fs.statSync( dir + '/' + file ).isDirectory() ) {
      filelist = walkSync( dir + '/' + file, filelist );
    }
    else {
      filelist.push( dir + '/' + file.replace( '.js', '' ) );
    }
  } );
  return filelist;
};

var toHTML = function( json ) {
  var html = '';
  var types = _.sortBy( _.keys( json ), function( key ) {
    return key;
  } );
  for ( var i = 0; i < types.length; i++ ) {

    var typeName = types[ i ];
    var wrapperType = json[ typeName ];
    var methods = '';
    var sortedMethodNames = _.sortBy( _.keys( wrapperType.methods ), function( key ) {
      return key;
    } );
    for ( var k = 0; k < sortedMethodNames.length; k++ ) {
      var methodName = sortedMethodNames[ k ];
      var method = wrapperType.methods[ methodName ];
      var params = method.parameterTypes.map( function( p ) {
        assert && assert( p.typeName, 'Parameter was not a type in toHTML: ' + typeName + '.' + methodName );
        return p.typeName;
      } );
      methods += '<DT>' + methodName + ': (' + params + ') &#10142; ' + method.returnType.typeName + '</DT>' +
                 '<DD>' + method.documentation + '</DD>';
    }
    var eventsString = wrapperType.events ? '<span>events: ' + ( wrapperType.events || '' ) + '</span>' : '';

    var supertype = wrapperType.supertype;
    html = html + '<h5 class="typeName" id="phetioType' + typeName + '">' + typeName + ' ' +
           (supertype.typeName ? '(extends <a class="supertypeLink" href="#phetioType' + supertype.typeName + '">' + supertype.typeName + '</a>)' : '') +
           '</h5>' +
           '<div class="typeDeclarationBody">' +
           '<span>' + wrapperType.documentation + '</span><br>' +
           eventsString +
           '<DL>' + methods + '</DL></div>';
  }
  return html;
};

module.exports = function(callback) {
  var allFiles = walkSync( '../types', [] );
  var result = {};

  // Load the files using the same strings as they are loaded in other files
  // This way they aren't loaded twice.
  // substring(3) to remove the '../' before the types directory
  var filesToGet = allFiles.map( function( elm ) {return 'PHET_IO/' + elm.substring( 3 );} );


  requirejs( filesToGet, function( /* arguments */ ) {
    var args = Array.prototype.slice.call( arguments );
    for ( var i = 0; i < args.length; i++ ) {
      var arg = args[ i ];
      var filename = filesToGet[ i ];
      if ( arg.typeName ) {
        result[ arg.typeName ] = arg;
      }
      else {
        if ( filename.indexOf( 'TFunctionWrapper' ) >= 0 ) {
          var returnType = TObject;
          var parameterTypes = [ TObject ];
          var instantiatedType = arg( returnType, parameterTypes );
          result[ instantiatedType.typeName ] = instantiatedType;
        }
        else {
          var instanceType = arg( TObject );
          result[ instanceType.typeName ] = instanceType;
        }
      }
    }

    var html = toHTML( result );
    callback(html);
  });
};