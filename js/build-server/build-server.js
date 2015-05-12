// Copyright 2002-2015, University of Colorado Boulder

/**
 * PhET build server
 *
 * @author Aaron Davis
 */

/* jslint node: true */
"use strict";

// modules
var express = require( 'express' );
var doT = require( 'express-dot' );
var parseArgs = require( 'minimist' );
var winston = require( 'winston' );
var request = require( 'request' );
var querystring = require( 'querystring' );
var child_process = require( 'child_process' );
var fs = require( 'fs' );
var client = require( 'scp2' );

var start = true;

try {
  var credentials = require( './credentials.json' ); // put this file in js/build-sever/ with your CU login info
}
catch( e ) {
  console.log( 'ERROR: SCP credentials not found. ' +
               'Please create a file "credentials.json" in js/build-server with fields for "username" and "password"' );
  start = false;
}

/* jshint -W079 */
var _ = require( '../../../sherpa/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

// constants
var LISTEN_PORT = 16371;
var REPOS_KEY = 'repos';
var LOCALES_KEY = 'locales';
var SIM_NAME = 'simName';
var VERSION = 'version';
var SERVER_NAME = 'serverName';

var verbose = false;

function exec( command, dir, callback ) {
  winston.log( 'info', 'running command: ' + command );
  child_process.exec( command, { cwd: dir }, function( err, stdout, stderr ) {
    if ( verbose ) {
      console.log( stdout );
      console.log( stderr );
    }
    if ( !err && callback ) {
      winston.log( 'info', command + ' ran successfully' );
      callback();
    }
    else if ( err ) {
      winston.log( 'error', 'error running command: ' + command + '. err: ' + err + '. build aborted.' );
    }
  } );
}

function deploy( req, res ) {
  if ( req.query[ REPOS_KEY ] && req.query[ LOCALES_KEY ] && req.query[ SIM_NAME ] && req.query[ VERSION ] ) {
    var repos = JSON.parse( req.query[ REPOS_KEY ] );
    var locales = JSON.parse( req.query[ LOCALES_KEY ] );
    var simName = req.query[ SIM_NAME ];
    var version = req.query[ VERSION ];

    var server = 'simian';
    if ( req.query[ SERVER_NAME ] ) {
      server = req.query[ SERVER_NAME ];
    }

    winston.log( 'info', 'building sim ' + simName );

    var buildDir = './js/build-server/tmp';
    var simDir = '../' + simName;

    var npmInstall = function( callback ) {
      fs.exists( simDir + '/node_modules', function( exists ) {
        if ( !exists ) {
          exec( 'npm install', simDir, callback );
        }
        else {
          callback();
        }
      } );
    };

    var scp = function( callback ) {
      winston.log( 'info', 'SCPing files to ' + server );

      client.scp( simDir + '/build/', {
        host: server + '.colorado.edu',
        username: credentials.username,
        password: credentials.password,
        path: '/data/web/htdocs/phetsims/sims/html/' + simName + '/' + version + '/'
      }, function( err ) {
        if ( err ) {
          winston.log( 'error', 'SCP failed with error: ' + err );
        }
        else {
          winston.log( 'info', 'SCP ran successfully' );
          if ( callback ) {
            callback();
          }
        }
      } );
    };

    var notifyServer = function( callback ) {
      var host = ( server === 'simian' ) ? 'phet-dev.colorado.edu' : 'phet.colorado.edu';
      var project = 'html/' + simName;
      var url = 'http://' + host + '/services/synchronize-project?projectName=' + project;
      request( url, function( error, response, body ) {
        if ( !error && response.statusCode === 200 ) {
          var syncResponse = JSON.parse( body );

          if ( !syncResponse.success ) {
            winston.log( 'error', 'request to synchronize project ' + project + ' on ' + server + ' failed with message: ' + syncResponse.error );
          }
          else {
            winston.log( 'info', 'request to synchronize project ' + project + ' on ' + server + ' succeeded' );
          }
        }
        else {
          winston.log( 'error', 'request to synchronize project failed' );
        }

        if ( callback ) {
          callback();
        }
      } );
    };

    var writeDependenciesFile = function() {
      fs.writeFile( buildDir + '/dependencies.json', JSON.stringify( repos ), function( err ) {
        if ( err ) {
          return winston.log( 'error', err );
        }
        winston.log( 'info', 'wrote file ' + buildDir + '/dependencies.json' );

        npmInstall( function() {
          exec( 'grunt checkout-shas --buildServer', simDir, function() {
            exec( 'grunt build-no-lint --locales=' + locales.toString(), simDir, function() {
              scp( function() {
                notifyServer( function() {
                  exec( 'grunt checkout-master', simDir, function() {
                    exec( 'rm -rf ' + buildDir, '.', function() {
                      winston.log( 'info', 'build finished' );
                    } );
                  } );
                } );
              } );
            } );
          } );
        } );

      } );
    };

    fs.exists( buildDir, function( exists ) {
      if ( !exists ) {
        fs.mkdir( buildDir, function( err ) {
          if ( !err ) {
            writeDependenciesFile();
          }
        } );
      }
      else {
        writeDependenciesFile();
      }
    } );
  }
  else {
    winston.log( 'error', 'missing one or more required query parameters repos, locales, simName, and version' );
  }
}

function test() {
  var repos = {
    "molecules-and-light": {
      "sha": "663973959fdec8724e1c197fbbd2bcdf636b41a8",
      "branch": "master"
    },
    "assert": {
      "sha": "903564a25a0f26acdbd334d3e104039864b405ef",
      "branch": "master"
    },
    "axon": {
      "sha": "084949f67b7fa6c87fa29acabcd3ee1cad90f27f",
      "branch": "master"
    },
    "brand": {
      "sha": "b3362651f1d7eddb7f8697d02400472f97f9d140",
      "branch": "master"
    },
    "chipper": {
      "sha": "1b58d12f40170c7a1d9282a4281ab0eca14f0a6d",
      "branch": "master"
    },
    "dot": {
      "sha": "10841da0d3d5288a3b3296ff7f5cc3361f7298f0",
      "branch": "master"
    },
    "joist": {
      "sha": "223beb469fb4d87bdd3aeb817ff500031d7cfe59",
      "branch": "master"
    },
    "kite": {
      "sha": "e659eb14701b55cb4579bcf42de5e8d044cfa5fe",
      "branch": "master"
    },
    "nitroglycerin": {
      "sha": "c6f79ce4664a1120a8d1d2393d5d48f9b72d4bc9",
      "branch": "master"
    },
    "phet-core": {
      "sha": "879ed37fe9489cb9d312f45333e9bfa27da0c48a",
      "branch": "master"
    },
    "phetcommon": {
      "sha": "bb92c52cd90fdaa0c2a746fea82594afd439b4db",
      "branch": "master"
    },
    "scenery": {
      "sha": "af8426352cfac4188eca3fadaf9114b36ac3b1db",
      "branch": "master"
    },
    "scenery-phet": {
      "sha": "92295da83d09a202e0a41ab217cc34b90afcef44",
      "branch": "master"
    },
    "sherpa": {
      "sha": "327c060c12ead53f3d6a2ad4229f6d0188e75be5",
      "branch": "master"
    },
    "sun": {
      "sha": "8aba31e7471b8752bde2086bdc65c4b1e8116e6a",
      "branch": "master"
    }
  };
  var locales = [ 'fr', 'es' ];
  var query = querystring.stringify( {
    'repos': JSON.stringify( repos ),
    'locales': JSON.stringify( locales ),
    'simName': 'molecules-and-light',
    'version': '1.0.0',
    'serverName': 'simian'
  } );
  var url = 'http://phet-dev.colorado.edu/deploy-html-simulation?' + query;
  winston.log( 'info', 'test url: ' + url );

  request( url, function( error, response, body ) {
    if ( !error && response.statusCode === 200 ) {
      winston.log( 'info', 'running test' );
    }
    else {
      winston.log( 'error', 'test deploy failed' );
    }
  } );
}

// Handle command line input
// First 2 args provide info about executables, ignore
var commandLineArgs = process.argv.slice( 2 );

var parsedCommandLineOptions = parseArgs( commandLineArgs, {
  boolean: true
} );

var defaultOptions = {
  logFile: undefined,
  silent: false,

  // options for supporting help
  help: false,
  h: false
};

for ( var key in parsedCommandLineOptions ) {
  if ( key !== '_' && parsedCommandLineOptions.hasOwnProperty( key ) && !defaultOptions.hasOwnProperty( key ) ) {
    console.log( 'Unrecognized option: ' + key );
    console.log( 'try --help for usage information.' );
    return;
  }
}

// If help flag, print help and usage info
if ( parsedCommandLineOptions.hasOwnProperty( 'help' ) || parsedCommandLineOptions.hasOwnProperty( 'h' ) ) {
  console.log( 'Usage:' );
  console.log( '  node build-server.js [options]' );
  console.log( '' );
  console.log( 'Options:' );
  console.log(
    '  --help (print usage and exit)\n' +
    '    type: bool  default: false\n' +
    '  --logFile (file name)\n' +
    '    type: string  default: undefined\n' +
    '  --silent (do not log to console)\n' +
    '    type: bool  default: false\n'
  );
  console.log(
    'Example - Run build-server without console output, but log to a file called log.txt:\n' +
    '  node build-server.js --silent --logFile=log.txt\n'
  );
  return;
}

// Merge the default and supplied options.
var options = _.extend( defaultOptions, parsedCommandLineOptions );

if ( options.logFile ) {
  winston.add( winston.transports.File, { filename: options.logFile } );
}
if ( options.silent ) {
  winston.remove( winston.transports.Console );
}

// Create and configure the ExpressJS app
var app = express();
app.set( 'views', __dirname + '/html/views' );
app.set( 'view engine', 'dot' );
app.engine( 'html', doT.__express );

// route that checks whether the user is logged in
app.get( '/deploy-html-simulation', deploy );

// start the server
if ( start ) {
  app.listen( LISTEN_PORT, function() {
    winston.log( 'info', 'Listening on port ' + LISTEN_PORT );
    test();
  } );
}
