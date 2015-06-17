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
var child_process = require( 'child_process' );
var fs = require( 'fs' );
var async = require( 'async' );
var client = require( 'scp2' );

var start = true; // whether or not to start the server - will be set to false if scp credentials are not found

try {
  var credentials = require( './credentials.json' ); // put this file in js/build-sever/ with your spot login info
}
catch( e ) {
  console.log( 'ERROR: SCP credentials for deploying to spot not found. ' +
               'Please create a file "credentials.json" in js/build-server with fields for "username" and "password"' );
  start = false;
}

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
var DEV_KEY = 'dev';
var HTML_SIMS_DIRECTORY = '/data/web/htdocs/phetsims/sims/html/';
var DEV_DIRECTORY = '/htdocs/physics/phet/dev/html/';


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

// add timestamps to log messages
winston.remove( winston.transports.Console );
winston.add( winston.transports.Console, { 'timestamp': true } );

if ( options.logFile ) {
  winston.add( winston.transports.File, { filename: options.logFile, 'timestamp': true } );
}
if ( options.silent ) {
  winston.remove( winston.transports.Console );
}
var verbose = options.verbose;

/**
 * Execute a step of the build process. The build aborts if any step fails.
 *
 * @param command the command to be executed
 * @param dir the directory to execute the command from
 * @param callback the function that executes upon completion
 */
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

    // checkout master for all repos if the build fails so they don't get left at random shas
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

/**
 * Create a [sim name].xml file in the live sim directory in htdocs. This file tells the website which
 * translations exist for a given sim. It is used by the "synchronize" method in Project.java in the webiste code.
 *
 * @param sim
 * @param version
 * @param callback
 */
function createXML( sim, version, callback ) {

  var rootdir = '../babel/' + sim;
  var englishStringsFile = sim + '-strings_en.json';
  var stringFiles = [ { name: englishStringsFile, locale: 'en' } ];

  try {
    var files = fs.readdirSync( rootdir );
    for ( var i = 0; i < files.length; i++ ) {
      var filename = files[ i ];
      var firstUnderscoreIndex = filename.indexOf( '_' );
      var periodIndex = filename.indexOf( '.' );
      var locale = filename.substring( firstUnderscoreIndex + 1, periodIndex );
      stringFiles.push( { name: filename, locale: locale } );
    }
  }
  catch( e ) {
    winston.log( 'warn', 'no directory for the given sim exists in babel' );
  }

  try {
    // grab the title from sim/package.json
    var packageJSON = JSON.parse( fs.readFileSync( '../' + sim + '/package.json', { encoding: 'utf-8' } ) );
    var simTitleKey = packageJSON.simTitleStringKey;
    simTitleKey = simTitleKey.split( '/' )[ 1 ];

    var englishStrings = JSON.parse( fs.readFileSync( '../' + sim + '/' + englishStringsFile, { encoding: 'utf-8' } ) );

    // create xml, making a simulation tag for each language
    var finalXML = '<?xml version="1.0" encoding="utf-8" ?>\n' +
                   '<project name="' + sim + '">\n' +
                   '<simulations>\n';

    for ( var j = 0; j < stringFiles.length; j++ ) {
      var stringFile = stringFiles[ j ];
      var languageJSON = ( stringFile.locale === 'en' ) ? englishStrings :
                         JSON.parse( fs.readFileSync( '../babel' + '/' + sim + '/' + stringFile.name, { encoding: 'utf-8' } ) );

      var simHTML = HTML_SIMS_DIRECTORY + sim + '/' + version + '/' + sim + '_' + stringFile.locale + '.html';

      if ( fs.existsSync( simHTML ) ) {
        if ( languageJSON[ simTitleKey ] ) {
          finalXML = finalXML.concat( '<simulation name="' + sim + '" locale="' + stringFile.locale + '">\n' +
                                      '<title><![CDATA[' + languageJSON[ simTitleKey ].value + ']]></title>\n' +
                                      '</simulation>\n' );
        }
        else {
          winston.log( 'warn', 'Sim name not found in translation for ' + simHTML + '. Defaulting to English name.' );
          finalXML = finalXML.concat( '<simulation name="' + sim + '" locale="' + stringFile.locale + '">\n' +
                                      '<title><![CDATA[' + englishStrings[ simTitleKey ].value + ']]></title>\n' +
                                      '</simulation>\n' );
        }
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

/**
 * taskQueue ensures that only one build/deploy process will be happening at the same time.
 * This main build/deploy logic is here.
 */
var taskQueue = async.queue( function( task, taskCallback ) {
  var req = task.req;
  var res = task.res;

  /*
   * For some configurations, Node doesn't automatically decode the query string properly.
   * DecodeURIComponent is a more robust solution that json/querystring.parse
   */
  var repos = JSON.parse( decodeURIComponent( req.query[ REPOS_KEY ] ) );
  var locales = ( req.query[ LOCALES_KEY ] ) ? JSON.parse( decodeURIComponent( req.query[ LOCALES_KEY ] ) ) : '*';

  var isDev = ( req.query[ DEV_KEY ] ) ? true : false;
  var simName = req.query[ SIM_NAME ];
  var version = req.query[ VERSION ];

  if ( !isDev ) {
    // strip suffixes from version since just the numbers are used in the directory name on simian and figaro
    version = version.match( /\d\.\d\.\d/ );
  }
  winston.log( 'info', 'detecting version number: ' + version );

  var server = 'simian'; // while testing, default to simian
  if ( req.query[ SERVER_NAME ] ) {
    server = req.query[ SERVER_NAME ];
  }

  winston.log( 'info', 'building sim ' + simName );

  var buildDir = './js/build-server/tmp';
  var simDir = '../' + simName;

  /**
   * pull master for every repo in dependencies.json (plus babel) to make sure everything is up to date
   * @param callback
   */
  var pullMaster = function( callback ) {

    if ( 'comment' in repos ) {
      delete repos.comment;
    }

    var finished = _.after( Object.keys( repos ).length + 1, callback );

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
    exec( 'git pull', '../babel', finished );
  };

  /**
   * execute mkdir for the sim version directory if it doesn't exist
   * @param callback
   */
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

  /**
   * scp files to dev server. This will usually be spot.
   * @param callback
   */
  var scp = function( callback ) {
    winston.log( 'info', 'SCPing files to ' + server );

    client.scp( simDir + '/build/', {
      host: server + '.colorado.edu',
      username: credentials.username,
      password: credentials.password,
      path: DEV_DIRECTORY + 'ad-tests/' + simName + '/' + version + '/'
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

  /**
   * Notify the website that a new sim or translation has been deployed. This will cause the project to
   * synchronize and the new translation will appear on the website.
   * @param callback
   */
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

  /**
   * Clean up after deploy. Check out master and remove the temp build dir
   */
  var afterDeploy = function() {
    exec( 'grunt checkout-master', simDir, function() {
      exec( 'git checkout master', simDir, function() { // checkout the master for the current sim
        exec( 'rm -rf ' + buildDir, '.', function() {
          taskCallback();
        } );
      } );
    } );
  };

  /**
   * Write a dependencies.json file based on the the dependencies passed to the build server.
   * The reason to write this to a file is so the "grunt checkout-shas" task works without much modification.
   */
  var writeDependenciesFile = function() {
    fs.writeFile( buildDir + '/dependencies.json', JSON.stringify( repos ), function( err ) {
      if ( err ) {
        return winston.log( 'error', err );
      }
      winston.log( 'info', 'wrote file ' + buildDir + '/dependencies.json' );

      // run every step of the build
      exec( 'npm install', simDir, function() {
        pullMaster( function() {
          exec( 'grunt checkout-shas --buildServer', simDir, function() {
            exec( 'git checkout ' + repos[ simName ].sha, simDir, function() { // checkout the sha for the current sim
              exec( 'grunt build-no-lint --locales=' + locales.toString(), simDir, function() {

                // if deploying a dev version just scp to spot
                if ( isDev ) {
                  scp( afterDeploy );
                }

                // otherwise do a full deploy to simian or figaro
                else {
                  exec( 'grunt generate-thumbnails', simDir, function() {
                    mkVersionDir( function() {
                      exec( 'cp build/* ' + HTML_SIMS_DIRECTORY + simName + '/' + version + '/', simDir, function() {
                        createXML( simName, version, function() {
                          notifyServer( afterDeploy );
                        } );
                      } );
                    } );
                  } );
                }

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

// Create and configure the ExpressJS app
var app = express();
app.set( 'views', __dirname + '/html/views' );
app.set( 'view engine', 'dot' );
app.engine( 'html', doT.__express );

// add the route to build and deploy
app.get( '/deploy-html-simulation', queueDeploy );

// start the server
if ( start ) {
  app.listen( LISTEN_PORT, function() {
    winston.log( 'info', 'Listening on port ' + LISTEN_PORT );
    winston.log( 'info', 'Verbose mode: ' + verbose );
  } );
}
