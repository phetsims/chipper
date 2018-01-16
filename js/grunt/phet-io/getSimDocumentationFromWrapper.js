// Copyright 2017, University of Colorado Boulder

/**
 * Launch an instance of chrome headless mode, and load the sim to be built from requirejs mode. Once loaded get a list
 * of tandem instances and associated types used in the sim. Then return the data as json and kill chrome.
 *
 * @author Michael Kauzmann(PhET Interactive Simulations)
 */
/* eslint-env node */
'use strict';

const CDP = require( 'chrome-remote-interface' ); // eslint-disable-line require-statement-match
const chromeLauncher = require( 'chrome-launcher' ); // eslint-disable-line require-statement-match
const grunt = require( 'grunt' );
require( 'babel-polyfill' );

/**
 * Launches a debugging instance of Chrome.
 * @return {Promise<ChromeLauncher>}
 */
function launchChrome() {
  return chromeLauncher.launch( {
    // port: 9222, // Uncomment to force a specific port of your choice.
    chromeFlags: [
      '--window-size=412,732',
      '--disable-gpu',
      '--headless'
    ]
  } );
}

// TODO: doc
module.exports = function( simName, done ) {

  // // This code was used to create the below es5 code. It was converted using babel, see https://babeljs.io/repl/
  // (async function() {
  //
  //   var chrome = await launchChrome();
  //   var protocol = await CDP( { port: chrome.port } );
  //
  //   // Extract the DevTools protocol domains we need and enable them.
  //   // See API docs: https://chromedevtools.github.io/devtools-protocol/
  //   var Page= protocol.Page;
  //   var Runtime = protocol.Runtime;
  //   await Promise.all( [ Page.enable(), Runtime.enable() ] );
  //
  //   Page.navigate( { url: 'http://localhost/phet-io-wrappers/documentation/documentation.html?sim=' + simName + '&ea' } );
  //
  //   // Wait for window.onload before doing stuff.
  //   Page.loadEventFired( async function(){
  //
  //     var isLoaded = false;
  //
  //     // Poll to see if the sim is loaded, see phet-io-wrappers/documentation/
  //     while( isLoaded === false ){
  //       var isLoadedResult =  await Runtime.evaluate( { expression: 'window.isSimLoaded();' } )
  //         .catch( function( e ) { grunt.fail.fatal(  e ) } );
  //       if( isLoadedResult.exceptionDetails ){
  //         grunt.fail.fatal( 'Error getting phet-io documentation, waiting for sim load: ' + isLoadedResult.exceptionDetails.exception.description)
  //       }
  //       isLoaded = isLoadedResult.result.value;
  //     }
  //     var result = await Runtime.evaluate( { expression: 'window.getDocumentation();' } )
  //       .catch( function( e ) { grunt.fail.fatal( e ) } );
  //
  //     if( result.exceptionDetails ){
  //       grunt.fail.fatal( 'Error getting phet-io documentation wrapper result: ' + isLoadedResult.exceptionDetails.exception.description)
  //     }
  //
  //     done( result.result.value) ;
  //     protocol.close();
  //     chrome.kill(); // Kill Chrome.
  //   } );
  // } )();


  // Babel generated code, so disable lint for it.
  /* eslint-disable */
  function _asyncToGenerator( fn ) {
    return function() {
      var gen = fn.apply( this, arguments );
      return new Promise( function( resolve, reject ) {
        function step( key, arg ) {
          try {
            var info = gen[ key ]( arg );
            var value = info.value;
          }
          catch( error ) {
            reject( new Error( error ) );
            return;
          }
          if ( info.done ) { resolve( value ); }
          else { return Promise.resolve( value ).then( function( value ) { step( "next", value ); }, function( err ) { step( "throw", err ); } ); }
        }

        return step( "next" );
      } );
    };
  }

  // This code was used to create the below es5 code. It was converted using babel, see https://babeljs.io/repl/
  _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark( function _callee2() {
    var chrome, protocol, Page, Runtime;
    return regeneratorRuntime.wrap( function _callee2$( _context2 ) {
      while ( 1 ) {
        switch( _context2.prev = _context2.next ) {
          case 0:
            _context2.next = 2;
            return launchChrome();

          case 2:
            chrome = _context2.sent;
            _context2.next = 5;
            return CDP( { port: chrome.port } );

          case 5:
            protocol = _context2.sent;


            // Extract the DevTools protocol domains we need and enable them.
            // See API docs: https://chromedevtools.github.io/devtools-protocol/
            Page = protocol.Page;
            Runtime = protocol.Runtime;
            _context2.next = 10;
            return Promise.all( [ Page.enable(), Runtime.enable() ] );

          case 10:

            Page.navigate( { url: 'http://localhost/phet-io-wrappers/documentation/documentation.html?sim=' + simName + '&ea' } );

            // Wait for window.onload before doing stuff.
            Page.loadEventFired( _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark( function _callee() {
              var isLoaded, isLoadedResult, result;
              return regeneratorRuntime.wrap( function _callee$( _context ) {
                while ( 1 ) {
                  switch( _context.prev = _context.next ) {
                    case 0:
                      isLoaded = false;

                    // Poll to see if the sim is loaded, see phet-io-wrappers/documentation/

                    case 1:
                      if ( !(isLoaded === false) ) {
                        _context.next = 9;
                        break;
                      }

                      _context.next = 4;
                      return Runtime.evaluate( { expression: 'window.isSimLoaded();' } ).catch( function( e ) {
                        grunt.fail.fatal( e );
                      } );

                    case 4:
                      isLoadedResult = _context.sent;

                      if ( isLoadedResult.exceptionDetails ) {
                        grunt.fail.fatal( 'Error getting phet-io documentation, waiting for sim load: ' + isLoadedResult.exceptionDetails.exception.description );
                      }
                      isLoaded = isLoadedResult.result.value;
                      _context.next = 1;
                      break;

                    case 9:
                      _context.next = 11;
                      return Runtime.evaluate( { expression: 'window.getDocumentation();' } ).catch( function( e ) {
                        grunt.fail.fatal( e );
                      } );

                    case 11:
                      result = _context.sent;


                      if ( result.exceptionDetails ) {
                        grunt.fail.fatal( 'Error getting phet-io documentation wrapper result: ' + isLoadedResult.exceptionDetails.exception.description );
                      }

                      done( result.result.value );
                      protocol.close();
                      chrome.kill(); // Kill Chrome.

                    case 16:
                    case 'end':
                      return _context.stop();
                  }
                }
              }, _callee, this );
            } ) ) );

          case 12:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this );
  } ) )();
  /* eslint-enable */

};

// Run from the command line
if ( require.main === module ) {

  module.exports( 'faradays-law', function( result ) { console.log( result );} );
}