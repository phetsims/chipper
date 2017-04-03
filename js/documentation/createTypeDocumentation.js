// Copyright 2016, University of Colorado Boulder

/**
 * Generates the PhET-iO API Type documentation which will be shown at https://phet-io.colorado.edu/devguide/
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

// TODO: bad practice to load directly from chipper's node modules
// var customRequirejs = require( '../../../chipper/node_modules/requirejs/bin/r.js' ); // eslint-disable-line require-statement-match
var customRequirejs = require( 'requirejs' ); // eslint-disable-line require-statement-match
var fs = require( 'fs' );


var initializeHackyGlobalsForThisFile = function() {

// Mock up window globals for running in node mode

  global.assert = require( 'assert' );
  global._ = require( '../../../sherpa/lib/lodash-4.17.4.js' );

  global.phet = global.phet || {};

  global.phet.chipper = global.phet.chipper || {};
  global.phet.chipper.queryParameters = global.phet.chipper.queryParameters || {};
  global.phet.chipper.brand = 'phet-io';
  global.phet.phetio = {
    queryParameters: {
      phetioExpressions: '[]'
    }
  };

// This is a hack because we are loading scenery.js as a namespace.
  global.document = { createElement: function() {return { getContext: function() {} };} };


  global.window = global; // eslint-disable-line no-native-reassign
};

var assert = global.assert;

var paths = {
  text: '../sherpa/lib/text-2.0.12',
  ifphetio: '../chipper/js/requirejs-plugins/ifphetio',

  AXON: '../axon/js',
  DOT: '../dot/js',
  JOIST: '../joist/js',
  KITE: '../kite/js',
  PHETCOMMON: '../phetcommon/js',
  PHET_CORE: '../phet-core/js',
  PHET_IO: '../phet-io/js',
  REPOSITORY: './',
  SHRED: '../shred/js',
  SCENERY: '../scenery/js',
  SCENERY_PHET: '../scenery-phet/js',
  SUN: '../sun/js',
  TANDEM: '../tandem/js',
  VEGAS: '../vegas/js',
  VIBE: '../vibe/js'
};

customRequirejs.config( {
  baseUrl: process.cwd(),
  paths: paths
} );
/*
 requirejs.config( {
 baseUrl: process.cwd(),
 paths:{
 //Load dependencies from sibling directories
 AXON: '../axon/js',
 BRAND: '../brand/' + phet.chipper.brand + '/js',
 DOT: '../dot/js',
 SCENERY: '../scenery/js',
 SCENERY_PHET: '../scenery-phet/js',
 KITE: '../kite/js',
 PHET_CORE: '../phet-core/js',
 PHET_IO: '../phet-io/js',
 PHETCOMMON: '../phetcommon/js',
 REPOSITORY: '..',
 SUN: '../sun/js',
 JOIST: '../joist/js',
 FORCES_AND_MOTION_BASICS: '../forces-and-motion-basics/js',
 VIBE: '../vibe/js',
 TANDEM: '../tandem/js',

 //Load plugins
 audio: '../chipper/js/requirejs-plugins/audio',
 image: '../chipper/js/requirejs-plugins/image',
 mipmap: '../chipper/js/requirejs-plugins/mipmap',
 string: '../chipper/js/requirejs-plugins/string',
 ifphetio: '../chipper/js/requirejs-plugins/ifphetio',

 // third-party libs
 text: '../sherpa/lib/text-2.0.12'
 }
 });
 var sim = requirejs( 'js/' +repositoryName + '-main');
 console.log( sim);
 */


// Get a list of all of the types in the 'types' directory
var walkSync = function( dir, filelist ) {
  var files = fs.readdirSync( dir );
  filelist = filelist || [];
  files.forEach( function( file ) {
    if ( fs.statSync( dir + '/' + file ).isDirectory() ) {
      filelist = walkSync( dir + '/' + file, filelist );
    }
    else {
      if ( file.match( /^T[A-Z].*\.js/ ) ) {
        filelist.push( dir + '/' + file.replace( '.js', '' ) );
      }
    }
  } );
  return filelist;
};

var getCommonCodeTTypes = function() {
  var activeRepos = fs.readFileSync( '../chipper/data/active-repos' ).toString();
  activeRepos = activeRepos.split( /\r?\n/ );
  var activeSims = fs.readFileSync( '../chipper/data/active-sims' ).toString();
  activeSims = activeSims.split( /\r?\n/ );

  // Repos that we don't want to search because they have no js/ directories, and won't have TTypes
  var blackList = [ 'babel', 'exemplar', 'function-basics', 'phet-info', 'phet-io-website', 'phet-ios-app',
    'phet-android-app', 'phet-cafepress', 'sherpa', 'slater', 'tambo', 'tasks', 'yotta' ];


  blackList.forEach( function( repo ) {
    activeRepos.splice( activeRepos.indexOf( repo ), 1 );
  } );

  activeSims.forEach( function( repo ) {
    activeRepos.splice( activeRepos.indexOf( repo ), 1 );
  } );

  var commonRepos = activeRepos;

  var files = [];
  commonRepos.forEach( function( repoName ) {
    walkSync( '../' + repoName + '/js', files );
  } );

  return files;
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


/**
 * Given as list of types files, return a json that holds the necessary information for the type documentation.
 * It will have a structure like this: {
 *    typeName: TType from the requirejs call,
 *    nextTypeName: . . . ,
 *    }
 *
 * Parameterized types like TTandemEmitter and TFunctionWrapper are hard coded because they have different constructors.
 * @param ttypeFiles
 */
var getTypeJSON = function( ttypeFiles ) {

  console.log( customRequirejs.s.contexts );
  // console.log( customRequirejs.s.contexts.typeDocumentation.config );

  var TObject = customRequirejs( 'PHET_IO/types/TObject' );

  console.log( 'This is TObject below.');
  console.log( TObject );
  var result = {};

  // Load the dependencies one at a time. This is a hack workaround that somehow allows requirejs to proceed.  Batching them
  // (that is, loading them with an array) failed for unknown reasons.  See https://github.com/phetsims/phet-io/issues/972
  for ( var i = 0; i < ttypeFiles.length; i++ ) {
    var filename = ttypeFiles[ i ];

    console.log( process.cwd() );
    var TType = customRequirejs( filename );

    console.log( filename );
    console.log( TType );
    // See phetioInherit for more details
    if ( TType.typeName ) {
      result[ TType.typeName ] = TType;
    }
    else {

      // Hack around the parametrized nature of TFunctionWrapper
      if ( filename.indexOf( 'TFunctionWrapper' ) >= 0 ) {
        var returnType = TObject;
        var parameterTypes = [ TObject ];
        var instantiatedType = TType( returnType, parameterTypes );
        result[ instantiatedType.typeName ] = instantiatedType;
      }

      // Hack around the parametrized nature of TTandemEmitter
      else if ( filename.indexOf( 'TTandemEmitter' ) >= 0 ) {
        var tandemEmitterType = TType( [ TObject ] );
        result[ tandemEmitterType.typeName ] = tandemEmitterType;
      }

      else {
        var otherType = TType( TObject );
        result[ otherType.typeName ] = otherType;
      }
    }

    // Hack to clear namespaces so duplicate registration doesn't throw an assertion error.
    for ( var v in global.phet ) {
      if ( global.phet.hasOwnProperty( v ) ) {
        if ( global.phet[ v ].constructor.name === 'Namespace' ) {
          var myObject = global.phet[ v ];

          // Manually clear the namespace so it doesn't complain when getting repopulated in the next run
          for ( var member in myObject ) {
            if ( myObject.hasOwnProperty( member ) ) {
              delete myObject[ member ];
            }
          }
        }
      }
    }
  }
  return result;

};

module.exports = {
  getCommonCodeTypeDocs: function() {
    initializeHackyGlobalsForThisFile();
    var commonCodeTTypeFiles = getCommonCodeTTypes();
    var typeJSON = getTypeJSON( commonCodeTTypeFiles );

    return toHTML( typeJSON );
  },

  getSimSpecificTypeDocs: function( simRepoName, simFormalName, simCapsForRequire ) {
    initializeHackyGlobalsForThisFile();
    var simHTMLHeader = '<h3>Specific Types for ' + simFormalName + '</h3>';
    var ttypeFiles = [];

    // Get the list of TTypes
    walkSync( '../' + simRepoName + '/js', ttypeFiles );

    paths[ simCapsForRequire ] = '../' + simRepoName + '/js';

    console.log( 'requiring ' + ttypeFiles );
    var typeJSON = getTypeJSON( ttypeFiles );
    return simHTMLHeader + toHTML( typeJSON );
  }
};

// Called from the command line, and not required, just print the common code type docs. This is used to update the
// devGuide in the phet-io-website.
if ( require.main === module ) {
  console.log( module.exports.getCommonCodeTypeDocs() );
}
