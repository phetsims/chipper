// Copyright 2016, University of Colorado Boulder

/**
 * Generates the PhET-iO API Type documentation which will be shown at https://phet-io.colorado.edu/devguide/
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

var fs = require( 'fs' );
var requirejs = require( 'requirejs' ); // eslint-disable-line require-statement-match

// Mock up window globals for running in node mode

global._ = require( '../../../../sherpa/lib/lodash-4.17.4.js' );
global.assert = require( 'assert' );
global.phet = {
  chipper: {
    queryParameters: {},
    brand: 'phet-io'
  },
  phetio: {
    queryParameters: {
      phetioExpressions: '[]'
    }
  }
};

// This is a hack because we are now loading scenery.js as a namespace.
global.document = { createElement: function() {return { getContext: function() {} };} };


global.window = global; // eslint-disable-line no-native-reassign

var assert = global.assert;

// These paths are relative to this file location because they are used by requirejs.
var paths = {

  // plugins
  image: '../../../../chipper/js/requirejs-plugins/image',
  mipmap: '../../../../chipper/js/requirejs-plugins/mipmap',
  string: '../../../../chipper/js/requirejs-plugins/string',
  text: '../../../../sherpa/lib/text-2.0.12',
  ifphetio: '../../../../chipper/js/requirejs-plugins/ifphetio',

  AXON: '../../../../axon/js',
  BRAND: '../../../../brand/phet-io/js',
  CIRCUIT_CONSTRUCTION_KIT_COMMON: '../../../../circuit-construction-kit-common/js',
  DOT: '../../../../dot/js',
  GRIDDLE: '../../../../griddle/js',
  INVERSE_SQUARE_LAW_COMMON: '../../../../inverse-square-law-common/js',
  JOIST: '../../../../joist/js',
  KITE: '../../../../kite/js',
  PHETCOMMON: '../../../../phetcommon/js',
  REPOSITORY: '../../..',
  PHET_CORE: '../../../../phet-core/js',
  PHET_IO: '../../../../phet-io/js',
  SHRED: '../../../../shred/js',
  SCENERY: '../../../../scenery/js',
  SCENERY_PHET: '../../../../scenery-phet/js',
  SUN: '../../../../sun/js',
  TANDEM: '../../../../tandem/js',
  TWIXT: '../../../../twixt/js',
  VEGAS: '../../../../vegas/js',
  VIBE: '../../../../vibe/js'
};
paths['../../sherpa'] = '../../../../sherpa';
paths['../../chipper'] = '../../../../chipper';

requirejs.config( {
  paths: paths
} );

var TObject = requirejs( 'PHET_IO/types/TObject' );


// Get a list of all of the types in the 'types' directory
function walkSync( dir, filelist ) {
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
}

function getCommonCodeTTypes() {
  var activeRepos = fs.readFileSync( '../../../../chipper/data/active-repos' ).toString();
  activeRepos = activeRepos.split( /\r?\n/ );
  var activeSims = fs.readFileSync( '../../../../chipper/data/active-sims' ).toString();
  activeSims = activeSims.split( /\r?\n/ );

  // Repos that we don't want to search because they have no js/ directories, and won't have TTypes
  var blackList = [ 'smithers', 'babel', 'exemplar', 'function-basics', 'phet-info', 'phet-io-website', 'phet-ios-app',
    'phet-android-app', 'phet-cafepress', 'sherpa', 'slater', 'tambo', 'tasks', 'yotta', 'phet-io-wrappers', 'phet-io-wrapper' ];


  var commonRepos = [];
  activeRepos.forEach( function( repo ) {

    // Don't include the black list above
    if ( blackList.indexOf( repo ) >= 0 ) {
      return;
    }

    // Don't include any sims in the common repos
    if ( activeSims.indexOf( repo ) >= 0 ) {
      return;
    }

    // There are no types in dedicated wrapper repos, exclude this special and dynamic case
    else if ( repo.indexOf( 'phet-io-wrapper-' ) >= 0 ) {
      return;
    }
    commonRepos.push( repo );
  } );

  var files = [];
  commonRepos.forEach( function( repoName ) {
    walkSync( '../../../../' + repoName + '/js', files );
  } );
  return files;
}

function toHTML( json ) {
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
}


/**
 * Given as list of types files, return a json that holds the necessary information for the type documentation.
 * It will have a structure like this: {
 *    typeName: TType from the requirejs call,
 *    nextTypeName: . . . ,
 *    }
 *
 * Parameterized types like TEmitter and TFunctionWrapper are hard coded because they have different constructors.
 * @param ttypeFiles
 */
function getTypeJSON( ttypeFiles ) {

  var result = {};

  // Load the dependencies one at a time. This is a hack workaround that somehow allows requirejs to proceed.  Batching them
  // (that is, loading them with an array) failed for unknown reasons.  See https://github.com/phetsims/phet-io/issues/972
  for ( var i = 0; i < ttypeFiles.length; i++ ) {
    var filename = ttypeFiles[ i ];

    // The walking if from cwd ( sim repo) but requirejs is from the module ( chipper/js/grunt/phet-io)
    var TType = requirejs( filename );

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

      // Hack around the parametrized nature of TEmitter
      else if ( filename.indexOf( 'TEmitter' ) >= 0 ) {
        var emitterType = TType( [ TObject ] );
        result[ emitterType.typeName ] = emitterType;
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
}

function getCommonCodeTypeDocs() {
  var commonCodeTTypeFiles = getCommonCodeTTypes();
  var typeJSON = getTypeJSON( commonCodeTTypeFiles );

  return toHTML( typeJSON );
}

// Called from the command line, and not required, option support for both modules, used by the grunt build process. This
// can also be used to update the devGuide in the phet-io-website.
if ( require.main === module ) {
    console.log( getCommonCodeTypeDocs() );
}
