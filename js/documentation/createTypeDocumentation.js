// Copyright 2016, University of Colorado Boulder

/**
 * Generates the PhET-iO API Type documentation which will be shown at https://phet-io.colorado.edu/devguide/
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';
var requirejs = require( '../../../node_modules/requirejs/bin/r.js' ); // eslint-disable-line require-statement-match
var fs = require( 'fs' );

// Mock up window globals for running in node mode

global.assert = require( 'assert' );
global.assert = null;
global._ = require( '../../../sherpa/lib/lodash-4.17.4.js' );
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

global.window = global; // eslint-disable-line no-native-reassign

var assert = global.assert;

requirejs.config( {
  paths: {
    text: '../../../sherpa/lib/text-2.0.12',
    ifphetio: '../../../chipper/js/requirejs-plugins/ifphetio',

    AXON: '../../../axon/js',
    DOT: '../../../dot/js',
    JOIST: '../../../joist/js',
    KITE: '../../../kite/js',
    PHETCOMMON: '../../../phetcommon/js',
    REPOSITORY: '../..',
    PHET_CORE: '../../../phet-core/js',
    PHET_IO: '../../../phet-io/js',
    SHRED: '../../../shred/js',
    SCENERY: '../../../scenery/js',
    SCENERY_PHET: '../../../scenery-phet/js',
    SUN: '../../../sun/js',
    TANDEM: '../../../tandem/js',
    VEGAS: '../../../vegas/js',
    VIBE: '../../../vibe/js'


    // Not sure how to handle individual simulations' documentation
    // BALLOONS_AND_STATIC_ELECTRICITY: '../../../balloons-and-static-electricity/js',
    // BEERS_LAW_LAB: '../../../beers-law-lab/js',
    // BUILD_AN_ATOM: '../../../build-an-atom/js',
    // CHARGES_AND_FIELDS: '../../../charges-and-fields/js',
    // COLOR_VISION: '../../../color-vision/js',
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
      if ( file.match( /^T[A-Z].*\.js/ ) ) {
        filelist.push( dir + '/' + file.replace( '.js', '' ) );
      }
    }
  } );
  return filelist;
};

var findFiles = function() {
  var activeRepos = fs.readFileSync( '../../../chipper/data/active-repos' ).toString();
  activeRepos = activeRepos.split( '\r\n' );

  var activeSims = fs.readFileSync( '../../../chipper/data/active-sims' ).toString();
  activeSims = activeSims.split( '\r\n' );

  // Repos that we don't want to search because they have no js/ directories, and won't have TTypes
  var blackList = [ 'babel', 'exemplar', 'function-basics', 'phet-info', 'phet-io-website', 'phet-ios-app',
    'phet-android-app', 'phet-cafepress', 'sherpa', 'slater', 'tambo', 'tasks', 'yotta', 'scenery' ];

  // TODO: this is a hack, we want these repos, but not the error
  // These are common code repos that throw a 'document is not defined error' but have files that need to be entered.
  blackList = blackList.concat( [ 'scenery-phet', 'sun', 'joist' ] );
  blackList.forEach( function( repo ) {
    activeRepos.splice( activeRepos.indexOf( repo ), 1 );
  } );

  activeSims.forEach( function( repo ) {
    activeRepos.splice( activeRepos.indexOf( repo ), 1 );
  } );

  var commonRepos = activeRepos;

  var files = [];
  commonRepos.forEach( function( repoName ) {
    walkSync( '../../../' + repoName + '/js', files );
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

module.exports = function( callback ) {
  var allFiles = findFiles();

  /*
  These are problematic phet-io imports, need to investigate more. It seems like requirejs is just stopping and not
  calling the callback that we give them. There aren't any errors though:

  // TODO: Why the heck do these files make the program die silently on requirejs import?
   '../../../phet-io/js/types/TString',
   '../../../phet-io/js/types/TPhETIO',
   '../../../phet-io/js/types/TFunctionWrapper',
   '../../../phet-io/js/types/TVoid',

   */



  // These are gathered dynamically above, but to test I manually removed the files that make it die silently
  allFiles = [
    '../../../phet-io/js/types/TArray',
    '../../../phet-io/js/types/TBoolean',
    '../../../phet-io/js/types/TNumber',
    '../../../phet-io/js/types/TSimIFrameAPI',
    '../../../phet-io/js/types/TObject',

    '../../../axon/js/TDerivedProperty',
    '../../../axon/js/TEvents',
    '../../../axon/js/TObservableArray',
    '../../../axon/js/TProperty',
    '../../../dot/js/TBounds2',
    '../../../dot/js/TBounds3',
    '../../../dot/js/TRandom',
    '../../../dot/js/TVector2',
    '../../../dot/js/TVector3',
    '../../../phetcommon/js/model/TSphereBucket',

    '../../../shred/js/model/TParticle',
    '../../../shred/js/model/TParticleAtom',
    '../../../shred/js/view/TPeriodicTableCell',
    '../../../tandem/js/axon/TTandemEmitter',
    '../../../tandem/js/scenery/input/TTandemSimpleDragHandler',
    '../../../tandem/js/TTandem' ];

  console.log( allFiles );
  var result = {};

  requirejs( allFiles, function( /* arguments */ ) {
    console.log( 'in require callback');
    var args = Array.prototype.slice.call( arguments );
    for ( var i = 0; i < args.length; i++ ) {
      var arg = args[ i ];
      var filename = allFiles[ i ];
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
    callback( html );
  } );
};

// Called from the command line, and not required
if ( require.main === module ) {
  module.exports( function( html ) { console.log( html ); } );
}
