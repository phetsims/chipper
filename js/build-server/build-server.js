// Copyright 2002-2015, University of Colorado Boulder

/**
 * PhET build and deploy server
 *
 * @author Aaron Davis
 */

/* jslint node: true */
'use strict';

// modules
var express = require( 'express' );
var doT = require( 'express-dot' );
var parseArgs = require( 'minimist' );
var winston = require( 'winston' );
var request = require( 'request' );
var querystring = require( 'querystring' );
var child_process = require( 'child_process' );
var fs = require( 'fs' );
var async = require( 'async' );
//var client = require( 'scp2' ); //TODO #141 required by scp

var start = true;

//TODO #141 needed by scp
//try {
//  var credentials = require( './credentials.json' ); // put this file in js/build-sever/ with your CU login info
//}
//catch( e ) {
//  console.log( 'ERROR: SCP credentials not found. ' +
//               'Please create a file "credentials.json" in js/build-server with fields for "username" and "password"' );
//  start = false;
//}

/* jshint -W079 */
var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

// constants
var LISTEN_PORT = 16371;
var REPOS_KEY = 'repos';
var LOCALES_KEY = 'locales';
var SIM_NAME = 'simName';
var VERSION = 'version';
var SERVER_NAME = 'serverName';
var HTML_SIMS_DIRECTORY = '/data/web/htdocs/phetsims/sims/html/';


// Handle command line input
// First 2 args provide info about executables, ignore
var commandLineArgs = process.argv.slice( 2 );

var parsedCommandLineOptions = parseArgs( commandLineArgs, {
  boolean: true
} );

var defaultOptions = {
  logFile: undefined,
  silent: false,
  verbose: false,

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
    '    type: bool  default: false\n' +
    '  --verbose (output grunt logs in addition to build-server)\n' +
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
var verbose = options.verbose;

function exec( command, dir, callback ) {
  winston.log( 'info', 'running command: ' + command );
  child_process.exec( command, { cwd: dir }, function( err, stdout, stderr ) {
    if ( verbose ) {
      winston.log( 'info', stdout );
      winston.log( 'info', stderr );
    }
    if ( !err && callback ) {
      winston.log( 'info', command + ' ran successfully in directory: ' + dir );
      callback();
    }
    else if ( err ) {
      if ( command === 'grunt checkout-master' ) {
        winston.log( 'error', 'error running grunt checkout-master, build aborted to avoid infinite loop.' );
        winston.log( 'error', dir );
      }
      else {
        winston.log( 'error', 'error running command: ' + command + '. build aborted.' );
        winston.log( 'error', dir );
        exec( 'grunt checkout-master', dir, function() {
          winston.log( 'info', 'checking out master for every repo in case build shas are still checked out' );
        } );
        exec( 'git checkout master', dir );
      }
    }
  } );
}

function createXML( sim, version, callback ) {

  console.log( "CWD: " + process.cwd() );

  var rootdir = '../babel/' + sim;
  var englishStringsFile = sim + '-strings_en.json';
  var stringFiles = [ { name: englishStringsFile, locale: 'en' } ];

  var files = fs.readdirSync( rootdir );
  for ( var i = 0; i < files.length; i++ ) {
    var filename = files[ i ];
    var firstUnderscoreIndex = filename.indexOf( '_' );
    var periodIndex = filename.indexOf( '.' );
    var locale = filename.substring( firstUnderscoreIndex + 1, periodIndex );
    stringFiles.push( { name: filename, locale: locale } );
  }

  try {
    // grab the title from sim/package.json
    var packageJSON = JSON.parse( fs.readFileSync( '../' + sim + '/package.json', { encoding: 'utf-8' } ) );
    var simTitleKey = packageJSON.simTitleStringKey;

    simTitleKey = simTitleKey.split( '/' )[ 1 ];

    // create xml, making a simulation tag for each language
    var finalXML = '<?xml version="1.0" encoding="utf-8" ?>\n' +
                   '<project name="' + sim + '">\n' +
                   '<simulations>\n';

    for ( var j = 0; j < stringFiles.length; j++ ) {
      var stringFile = stringFiles[ j ];
      var languageJSON = JSON.parse( fs.readFileSync(
        ( stringFile.locale === 'en' ) ? englishStringsFile : '../babel' + '/' + sim + '/' + stringFile.name,
        { encoding: 'utf-8' } ) );

      if ( languageJSON[ simTitleKey ] ) {
        finalXML = finalXML.concat( '<simulation name="' + sim + '" locale="' + stringFile.locale + '">\n' +
                                    '<title><![CDATA[' + languageJSON[ simTitleKey ].value + ']]></title>\n' +
                                    '</simulation>\n' );
      }
    }

    finalXML = finalXML.concat( '</simulations>\n' + '</project>' );

    fs.writeFileSync( HTML_SIMS_DIRECTORY + sim + '/' + version + '/' + sim + '.xml', finalXML, { mode: 436 } ); // 436 = 0664
    winston.log( 'info', 'wrote XML file:\n' + finalXML );
    callback();
  }
  catch( e ) {
    winston.log( 'error', e );
    callback( true );
  }
}

var taskQueue = async.queue( function( task, taskCallback ) {
  var req = task.req;
  var res = task.res;

  /*
   * For some configurations, Node doesn't automatically decode the query string properly.
   * DecodeURIComponent is a more robust solution that json/querystring.parse
   */
  var repos = JSON.parse( decodeURIComponent( req.query[ REPOS_KEY ] ) );
  var locales = ( req.query[ LOCALES_KEY ] ) ? JSON.parse( decodeURIComponent( req.query[ LOCALES_KEY ] ) ) : '*';

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

  var pullMaster = function( callback ) {

    if ( 'comment' in  repos ) {
      delete repos.comment;
      winston.log( 'info', 'comment was deleted' );
    }

    var finished = _.after( Object.keys( repos ).length, callback );

    for ( var repoName in repos ) {
      if ( repos.hasOwnProperty( repoName ) ) {
        if ( fs.existsSync( '../' + repoName ) ) {
          winston.log( 'info', 'pulling from ' + repoName );
          exec( 'git pull', '../' + repoName, finished );
        }
        else {
          winston.log( 'error', repoName + ' is not a repo.' );
          callback();
        }
      }
    }
  };

  var mkVersionDir = function( callback ) {
    var simDirPath = HTML_SIMS_DIRECTORY + simName + '/' + version + '/';

    fs.exists( simDirPath, function( exists ) {
      if ( !exists ) {
        fs.mkdir( simDirPath, function( err ) {
          if ( !err ) {
            callback();
          }
          else {
            winston.log( 'error', err );
          }
        } );
      }
      else {
        callback();
      }
    } );
  };


  // #141 TODO: will we ever need to SCP files, or just cp since we will be on the same machine that the files are deploying to
  //var scp = function( callback ) {
  //  winston.log( 'info', 'SCPing files to ' + server );
  //
  //  client.scp( simDir + '/build/', {
  //    host: server + '.colorado.edu',
  //    username: credentials.username,
  //    password: credentials.password,
  //    path: '/data/web/htdocs/phetsims/sims/html/' + simName + '/' + version + '/'
  //  }, function( err ) {
  //    if ( err ) {
  //      winston.log( 'error', 'SCP failed with error: ' + err );
  //    }
  //    else {
  //      winston.log( 'info', 'SCP ran successfully' );
  //      if ( callback ) {
  //        callback();
  //      }
  //    }
  //  } );
  //};

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

      // run every step of the build
      npmInstall( function() {
        pullMaster( function() {
          exec( 'grunt checkout-shas --buildServer', simDir, function() {
            exec( 'git checkout ' + repos[ simName ].sha, simDir, function() { // checkout the sha for the current sim
              exec( 'grunt build-no-lint --locales=' + locales.toString(), simDir, function() {
                exec( 'grunt generate-thumbnails', simDir, function() {
                  mkVersionDir( function() {
                    exec( 'cp build/* ' + '/data/web/htdocs/phetsims/sims/html/' + simName + '/' + version + '/', simDir, function() {
                      createXML( simName, version, function( err ) {
                        if ( err ) {
                          winston.log( 'error', 'didn\'t write XML file' );
                        }
                        notifyServer( function() {
                          exec( 'grunt checkout-master', simDir, function() {
                            exec( 'git checkout master', simDir, function() { // checkout the master for the current sim
                              exec( 'rm -rf ' + buildDir, '.', function() {
                                taskCallback();
                              } );
                            } );
                          } );
                        } );
                      } );
                    } );
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

  res.send( 'build process initiated, check logs for details' );

}, 1 ); // 1 is the max number of tasks that can run concurrently

function queueDeploy( req, res ) {
  if ( req.query[ REPOS_KEY ] && req.query[ SIM_NAME ] && req.query[ VERSION ] ) {
    winston.log( 'info', 'queuing task' );
    taskQueue.push( { req: req, res: res }, function() {
      winston.log( 'info', 'build finished' );
    } );
  }
  else {
    var errorString = 'missing one or more required query parameters repos, locales, simName, and version';
    winston.log( 'error', errorString );
    res.send( errorString );
  }
}

function test() {
  var repos = {
    "assert": {
      "sha": "903564a25a0f26acdbd334d3e104039864b405ef",
      "branch": "master"
    },
    "axon": {
      "sha": "1199217e4b4a158afe5cf2fd59e5a7a087fd4179",
      "branch": "master"
    },
    "brand": {
      "sha": "b3362651f1d7eddb7f8697d02400472f97f9d140",
      "branch": "master"
    },
    "chipper": {
      "sha": "4602156c89dd307be35ec6ada2cdece82e0ac956",
      "branch": "master"
    },
    "dot": {
      "sha": "9e70b8cac3ddfcb9e1dff786b23bc64de3b98350",
      "branch": "master"
    },
    "joist": {
      "sha": "c9f2b67459f59f292a59bca7a714cd6f0908b4f9",
      "branch": "master"
    },
    "kite": {
      "sha": "affd230ecc0d01f4f217ed7060007e3c71de4937",
      "branch": "master"
    },
    "molecules-and-light": {
      "sha": "ce00d086b33499d523c35142de86ce3a98986344",
      "branch": "master"
    },
    "nitroglycerin": {
      "sha": "c6f79ce4664a1120a8d1d2393d5d48f9b72d4bc9",
      "branch": "master"
    },
    "phet-core": {
      "sha": "23834d107dc1cb368c00901c76927b712b9caa10",
      "branch": "master"
    },
    "phetcommon": {
      "sha": "bb92c52cd90fdaa0c2a746fea82594afd439b4db",
      "branch": "master"
    },
    "scenery": {
      "sha": "a69dfeb8452edb51348eb2187ce25939a8b0dda1",
      "branch": "master"
    },
    "scenery-phet": {
      "sha": "4ca937ebfe35a021d4c781a4c6877be22ddbcf9b",
      "branch": "master"
    },
    "sherpa": {
      "sha": "7c1f8f58b67a29014fb75ef4c80c3a5904193630",
      "branch": "master"
    },
    "sun": {
      "sha": "5ae6c12634dc188f5b9ba8bc3aca76dcf96448c8",
      "branch": "master"
    },
    "comment": {
      "message": "this is a comment"
    }
  };
  var locales = [ 'de' ];
  var query = querystring.stringify( {
    'repos': JSON.stringify( repos ),
    'locales': JSON.stringify( locales ),
    'simName': 'molecules-and-light',
    'version': '1.0.1',
    'serverName': 'simian'
  } );
  var url = 'http://localhost:' + LISTEN_PORT + '/deploy-html-simulation?' + query;
  // var url = 'phet-dev.colorado.edu' + query;
  winston.log( 'info', 'test url: ' + url );

  //
  // request( url, function( error, response, body ) {
  //  if ( !error && response.statusCode === 200 ) {
  //    winston.log( 'info', 'running test' );
  //  }
  //  else {
  //    winston.log( 'error', 'test deploy failed' );
  //  }
  // } );
}

// Create and configure the ExpressJS app
var app = express();
app.set( 'views', __dirname + '/html/views' );
app.set( 'view engine', 'dot' );
app.engine( 'html', doT.__express );

// route that checks whether the user is logged in
app.get( '/deploy-html-simulation', queueDeploy );

// start the server
if ( start ) {
  app.listen( LISTEN_PORT, function() {
    winston.log( 'info', 'Listening on port ' + LISTEN_PORT );
    winston.log( 'info', 'Verbose mode: ' + verbose );
    test();
  } );
}
