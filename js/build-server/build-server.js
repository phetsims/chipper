// Copyright 2002-2015, University of Colorado Boulder

/**
 * PhET build and deploy server. The server is designed to run on the same host as the production site (simian or figaro).
 *
 * Starting and Stopping the Server
 * ================================
 *
 * All of the phet repos live on simian and figaro under /data/share/phet/phet-repos. The build server lives in chipper:
 * /data/share/phet/phet-repos/chipper. To start the build server, run this command on simian or figaro (without quotes):
 *
 * "cd /data/share/phet/phet-repos/chipper && nohup /usr/local/nodejs/bin/node js/build-server/build-server.js &"
 *
 * Do not start the build server unless you have the necessary fields filled out in ~/.phet/build-local.json
 * (see assertions in getDeployConfig).
 *
 * To configure the build server to send an email on build failure, fill out the optional email related fields in getDeployConfig.
 *
 * Additionally, you will need an ssh key set up to copy files from the production server to spot. To do this, you'll need
 * to have an rsa key in ~/.ssh on the production server (run "ssh-keygen -t rsa" to generate a key if you don't already have one).
 * Also, you will need to add an entry for spot in ~/.ssh/authorized_keys like so:
 *
 * Host spot
 *     HostName spot.colorado.edu
 *     User [identikey]
 *     Port 22
 *     IdentityFile ~/.ssh/id_rsa
 *
 * On spot, you'll need to add your public key from figaro to a file ~/.ssh/authorized_keys
 *
 * To stop the build server, look for its process id with "ps -elf | grep node" and kill the process.
 *
 *
 * Using the Build Server for Production Deploys
 * =============================================
 *
 * The build server starts a build process upon receiving and https request to /deploy-html-simulation. It takes as input
 * the following query parameters:
 * - repos - a json object with dependency repos and shas, in the form of dependencies.json files
 * - locales - a comma-separated list of locales to build [optional, defaults to all locales in babel]
 * - simName - the standardized name of the sim, lowercase with hyphens instead of spaces (i.e. area-builder)
 * - version - the version to be built. Production deploys will automatically strip everything after the major.minor.maintenance
 * - authorizationCode - a password to authorize legitimate requests
 * - serverName - server to deploy to, defaults to figaro.colorado.edu, but could be overriden for testing on simian.colorado.edu
 *
 * Note: You will NOT want to assemble these request URLs manually, instead use grunt deploy-production for deploys.
 *
 *
 * What the Build Server Does
 * ==========================
 *
 * The build server does the following steps when a deploy request is received:
 * - checks the authorization code, unauthorized codes will not trigger a build
 * - puts the build task on a queue so multiple builds don't occur simultaneously
 * - pull chipper and clone any missing repos
 * - npm install in the sim directory
 * - pull master for the sim and all dependencies
 * - grunt checkout-shas
 * - grunt build for selected locales
 * - grunt generate-thumbnails
 * - mkdir for the new sim version
 * - copy the build files to the correct location in the server doc root
 * - write necessary .htaccess files for indicating the latest directory and downloading the html files
 * - write the XML file that tells the website which translations exist
 * - notify the website that a new simulation/translation is published and should appear
 *
 * @author Aaron Davis
 */

// The following comment permits node-specific globals (such as process.cwd()) to pass jshint
/* jslint node: true */
'use strict';

// modules
var express = require( 'express' );
var doT = require( 'express-dot' );
var parseArgs = require( 'minimist' );
var winston = require( 'winston' );
var request = require( 'request' );
var child_process = require( 'child_process' );
var fs = require( 'fs.extra' );
var async = require( 'async' );
var email = require( 'emailjs/email' );
var getDeployConfig = require( '../../../chipper/js/common/getDeployConfig' );
var deployConfig = getDeployConfig( fs );

/* jshint -W079 */
var _ = require( 'lodash' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

// constants
var LISTEN_PORT = 16371;
var REPOS_KEY = 'repos';
var LOCALES_KEY = 'locales';
var SIM_NAME_KEY = 'simName';
var VERSION_KEY = 'version';
var AUTHORIZATION_KEY = 'authorizationCode';
var SERVER_NAME = 'serverName';
var HTML_SIMS_DIRECTORY = '/data/web/htdocs/phetsims/sims/html/';
var ENGLISH_LOCALE = 'en';
var PERENNIAL = '../perennial';
var UMASK = 436; // decimal version of the octal permissions mask 664

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

// configure email server
var server;
if ( deployConfig.emailUsername && deployConfig.emailPassword && deployConfig.emailTo ) {
  server = email.server.connect( {
    user: deployConfig.emailUsername,
    password: deployConfig.emailPassword,
    host: deployConfig.emailServer,
    tls: true
  } );
}

/**
 * Send an email. Used to notify developers if a build fails
 * @param subject
 * @param text
 */
function sendEmail( subject, text ) {
  if ( server ) {
    server.send( {
      text: text,
      from: 'PhET Build Server <phethelp@colorado.edu>',
      to: deployConfig.emailTo,
      subject: subject
    }, function( err, message ) {
      if ( err ) {
        winston.log( 'error', 'sending email ' + err );
      }
      else {
        winston.log( 'info', 'sent email ' + message );
      }
    } );
  }
}

/**
 * exists method that uses fs.statSync instead of the deprecated existsSync
 * @param file
 * @returns {boolean} true if the file exists
 */
function exists( file ) {
  try {
    fs.statSync( file );
    return true;
  }
  catch( e ) {
    return false;
  }
}

/**
 * taskQueue ensures that only one build/deploy process will be happening at the same time.
 * The main build/deploy logic is here.
 */
var taskQueue = async.queue( function( task, taskCallback ) {
  var req = task.req;
  var res = task.res;


  //-----------------------------------------------------------------------------------------
  // Define helper functions exec, execWithoutAbort, and AbortBuild for use in this function
  //-----------------------------------------------------------------------------------------

  /**
   * Execute a step of the build process. The build aborts if any step fails.
   *
   * @param command the command to be executed
   * @param dir the directory to execute the command from
   * @param callback the function that executes upon completion
   */
  var exec = function( command, dir, callback ) {
    winston.log( 'info', 'running command: ' + command );
    child_process.exec( command, { cwd: dir }, function( err, stdout, stderr ) {
      if ( verbose ) {
        if ( stdout ) { winston.log( 'info', stdout ); }
        if ( stderr ) { winston.log( 'info', stderr ); }
      }
      if ( !err ) {
        winston.log( 'info', command + ' ran successfully in directory: ' + dir );
        if ( callback ) { callback(); }
      }

      // checkout master for all repos if the build fails so they don't get left at random shas
      else {
        if ( command === 'grunt checkout-master-all' ) {
          winston.log( 'error', 'error running grunt checkout-master-all in ' + dir + ', build aborted to avoid infinite loop.' );
          taskCallback( 'error running command ' + command + ': ' + err ); // build aborted, so take this build task off of the queue
        }
        else {
          winston.log( 'error', 'error running command: ' + command + ' in ' + dir + '. build aborted.' );
          exec( 'grunt checkout-master-all', PERENNIAL, function() {
            winston.log( 'info', 'checking out master for every repo in case build shas are still checked out' );
            taskCallback( 'error running command ' + command + ': ' + err ); // build aborted, so take this build task off of the queue
          } );
        }
      }
    } );
  };

  var execWithoutAbort = function( command, dir, callback ) {
    child_process.exec( command, { cwd: dir }, function( err, stdout, stderr ) {
      if ( err ) {
        winston.log( 'warn', command + ' had error ' + err );
      }
      if ( verbose ) {
        if ( stdout ) { winston.log( 'info', stdout ); }
        if ( stderr ) { winston.log( 'info', stderr ); }
      }
      callback( err );
    } );
  };

  /**
   * checkout master everywhere and abort build with err
   * @param err
   */
  var abortBuild = function( err ) {
    winston.log( 'error', 'abort build called: ' + err );
    exec( 'grunt checkout-master-all', PERENNIAL, function() {
      winston.log( 'info', 'build aborted: checking out master for every repo in case build shas are still checked out' );
      taskCallback( err ); // build aborted, so take this build task off of the queue
    } );
  };


  //-------------------------------------------------------------------------------------
  // Parse and validate query parameters
  //-------------------------------------------------------------------------------------

  var repos = JSON.parse( decodeURIComponent( req.query[ REPOS_KEY ] ) );
  var locales = ( req.query[ LOCALES_KEY ] ) ? decodeURIComponent( req.query[ LOCALES_KEY ] ) : '*';
  var simName = decodeURIComponent( req.query[ SIM_NAME_KEY ] );
  var version = decodeURIComponent( req.query[ VERSION_KEY ] );

  var server = deployConfig.productionServerName;
  if ( req.query[ SERVER_NAME ] ) {
    server = decodeURIComponent( req.query[ SERVER_NAME ] );
  }

  var simNameRegex = /^[a-z-]+$/;

  // make sure the repos passed in validates
  for ( var key in repos ) {

    // make sure all keys in repos object are valid sim names
    if ( simNameRegex.test( key ) ) {
      abortBuild( 'invalid simName in repos: ' + simName );
      return;
    }

    var value = repos[ key ];
    if ( key === 'comment' ) {
      if ( typeof value !== 'string' ) {
        abortBuild( 'invalid comment in repos: should be a string' );
        return;
      }
    }
    else if ( value instanceof Object && value.hasOwnProperty( 'sha' ) ) {
      if ( !/^[a-f0-9]{40}$/.test( value.sha ) ) {
        abortBuild( 'invalid sha in repos. key: ' + key + ' value: ' + value + ' sha: ' + value.sha );
        return;
      }
    }
    else {
      abortBuild( 'invalid item in repos. key: ' + key + ' value: ' + value );
      return;
    }
  }

  // validate simName
  if ( !simNameRegex.test( simName ) ) {
    abortBuild( 'invalid simName ' + simName );
  }

  // validate version and strip suffixes since just the numbers are used in the directory name on simian and figaro
  var versionMatch = version.match( /^(\d+\.\d+\.\d+)(?:-.*)?$/ );
  if ( versionMatch && versionMatch.length === 2 ) {
    version = versionMatch[ 1 ];
    winston.log( 'info', 'detecting version number: ' + version );
  }
  else {
    abortBuild( 'invalid version number: ' + version );
    return;
  }

  // define vars for build dir and sim dir
  var buildDir = './js/build-server/tmp';
  var simDir = '../' + simName;

  winston.log( 'info', 'building sim ' + simName );


  //-------------------------------------------------------------------------------------
  // Define other helper functions used in build process
  //-------------------------------------------------------------------------------------

  /**
   * Create a [sim name].xml file in the live sim directory in htdocs. This file tells the website which
   * translations exist for a given sim. It is used by the "synchronize" method in Project.java in the website code.
   * @param simTitleCallback
   * @param callback
   */
  var createTranslationsXML = function( simTitleCallback, callback ) {

    var rootdir = '../babel/' + simName;
    var englishStringsFile = simName + '-strings_en.json';
    var stringFiles = [ { name: englishStringsFile, locale: ENGLISH_LOCALE } ];

    // pull all the string filenames and locales from babel and store in stringFiles array
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

    // try opening the english strings file so we can read the english strings
    var englishStrings;
    try {
      englishStrings = JSON.parse( fs.readFileSync( '../' + simName + '/' + englishStringsFile, { encoding: 'utf-8' } ) );
    }
    catch( e ) {
      abortBuild( 'English strings file not found' );
      return;
    }

    var simTitleKey = simName + '.title'; // all sims must have a key of this form

    if ( englishStrings[ simTitleKey ] ) {
      simTitleCallback( englishStrings[ simTitleKey ].value );
    }
    else {
      abortBuild( 'no key for sim title' );
      return;
    }

    // create xml, making a simulation tag for each language
    var finalXML = '<?xml version="1.0" encoding="utf-8" ?>\n' +
                   '<project name="' + simName + '">\n' +
                   '<simulations>\n';

    for ( var j = 0; j < stringFiles.length; j++ ) {
      var stringFile = stringFiles[ j ];
      var languageJSON = ( stringFile.locale === ENGLISH_LOCALE ) ? englishStrings :
                         JSON.parse( fs.readFileSync( '../babel' + '/' + simName + '/' + stringFile.name, { encoding: 'utf-8' } ) );

      var simHTML = HTML_SIMS_DIRECTORY + simName + '/' + version + '/' + simName + '_' + stringFile.locale + '.html';

      if ( exists( simHTML ) ) {
        var localizedSimTitle = ( languageJSON[ simTitleKey ] ) ? languageJSON[ simTitleKey ].value : englishStrings[ simTitleKey ].value;
        finalXML = finalXML.concat( '<simulation name="' + simName + '" locale="' + stringFile.locale + '">\n' +
                                    '<title><![CDATA[' + localizedSimTitle + ']]></title>\n' +
                                    '</simulation>\n' );
      }
    }

    finalXML = finalXML.concat( '</simulations>\n' + '</project>' );

    fs.writeFileSync( HTML_SIMS_DIRECTORY + simName + '/' + version + '/' + simName + '.xml', finalXML, { mode: UMASK } );
    winston.log( 'info', 'wrote XML file:\n' + finalXML );
    callback();
  };

  /**
   * Write the .htaccess file to make "latest" point to the version being deployed and allow "download" links to work on Safari
   * @param callback
   */
  var writeHtaccess = function( callback ) {
    var contents = 'RewriteEngine on\n' +
                   'RewriteBase /sims/html/' + simName + '/\n' +
                   'RewriteRule latest(.*) ' + version + '$1\n' +
                   'Header set Access-Control-Allow-Origin "*"\n\n' +
                   'RewriteCond %{QUERY_STRING} =download\n' +
                   'RewriteRule ([^/]*)$ - [L,E=download:$1]\n' +
                   'Header onsuccess set Content-disposition "attachment; filename=%{download}e" env=download\n';
    fs.writeFileSync( HTML_SIMS_DIRECTORY + simName + '/.htaccess', contents );
    callback();
  };

  /**
   * Copy files to spot. This function calls scp once for each file instead of using scp -r. The reason for this is that
   * scp -r will create a new directory called 'build' inside the sim version directory if the version directory already exists.
   * Because this function is called for translations too, in many cases the directory will already exist.
   * @param callback
   */
  //var spotScp = function( callback ) {
  //  var buildDir = simDir + '/build';
  //  var files = fs.readdirSync( buildDir );
  //  var finished = _.after( files.length, callback );
  //  for ( var i = 0; i < files.length; i++ ) {
  //    var filename = files[ i ];
  //    exec( 'scp ' + filename + ' ' + deployConfig.devUsername + '@' + deployConfig.devDeployServer + ':' + deployConfig.devDeployPath + simName + '/' + version, buildDir, finished );
  //  }
  //};

  /**
   * Add an entry in for this sim in simInfoArray in rosetta, so it shows up as translatable.
   * Must be run after createTranslationsXML so that simTitle is initialized.
   * @param simTitle
   * @param callback
   */
  var addToRosetta = function( simTitle, callback ) {
    var simInfoArray = '../rosetta/data/simInfoArray.json';
    fs.readFile( simInfoArray, { encoding: 'utf8' }, function( err, simInfoArrayString ) {
      var data = JSON.parse( simInfoArrayString );
      if ( err ) {
        winston.log( 'error', 'couldn\'t read simInfoArray ' + err );
        abortBuild( 'couldn\'t read simInfoArray ' + err );
      }
      else {
        var host = ( server === 'simian.colorado.edu' ) ? 'phet-dev.colorado.edu' : 'phet.colorado.edu';
        var testUrl = 'http://' + host + '/sims/html/' + simName + '/latest/' + simName + '_en.html';
        var newSim = true;
        for ( var i = 0; i < data.length; i++ ) {
          var simInfoObject = data[ i ];
          if ( simInfoObject.projectName && simInfoObject.projectName === simName ) {
            simInfoObject.simTitle = simTitle;
            simInfoObject.testUrl = testUrl;
            newSim = false;
          }
        }
        if ( newSim ) {
          data.push( {
            simTitle: simTitle,
            projectName: simName,
            testUrl: testUrl
          } );
        }
        var contents = JSON.stringify( data, null, 2 );
        fs.writeFile( simInfoArray, contents, function( err ) {
          if ( err ) {
            winston.log( 'error', 'couldn\'t write simInfoArray ' + err );
            abortBuild( 'couldn\'t write simInfoArray ' + err );
          }
          else {
            if ( simInfoArrayString !== contents ) {
              exec( 'git pull', '../rosetta', function() {
                exec( 'git commit -a -m "[automated commit] add ' + simTitle + ' to simInfoArray"', '../rosetta', function() {
                  execWithoutAbort( 'git push origin master', '../rosetta', function( err ) {
                    if ( err ) {
                      sendEmail( 'ROSETTA PUSH FAILED', err );
                    }
                    callback();
                  } );
                } );
              } );
            }
            else {
              callback();
            }
          }
        } );
      }
    } );
  };

  /**
   * Pull chipper and perennial, then clone missing repos
   * @param callback
   */
  var cloneMissingRepos = function( callback ) {
    exec( 'git pull', '.', function() { // pull chipper first
      exec( 'git pull', PERENNIAL, function() {
        exec( './chipper/bin/clone-missing-repos.sh', '..', callback );
      } );
    } );
  };

  /**
   * pull master for every repo in dependencies.json (plus babel) to make sure everything is up to date
   * @param callback
   */
  var pullMaster = function( callback ) {

    // so we don't have to modify the repos object
    var reposCopy = _.clone( repos );

    if ( 'comment' in reposCopy ) {
      delete reposCopy.comment;
    }

    var errors = [];

    var finished = _.after( Object.keys( reposCopy ).length + 1, function() {
      if ( _.any( errors ) ) {
        abortBuild( 'at least one repository failed to pull master' );
      }
      callback();
    } );

    var errorCheckCallback = function( err ) {
      errors.push( err );
      finished();
    };

    for ( var repoName in reposCopy ) {
      if ( reposCopy.hasOwnProperty( repoName ) ) {
        winston.log( 'info', 'pulling from ' + repoName );
        execWithoutAbort( 'git pull', '../' + repoName, errorCheckCallback );
      }
    }
    execWithoutAbort( 'git pull', '../babel', errorCheckCallback );
  };

  /**
   * execute mkdir for the sim version directory if it doesn't exist
   * @param callback
   */
  var mkVersionDir = function( callback ) {
    var simDirPath = HTML_SIMS_DIRECTORY + simName + '/' + version + '/';
    try {
      fs.mkdirpSync( simDirPath, UMASK );
      callback();
    }
    catch( e ) {
      winston.log( 'error', 'in mkVersionDir ' + e );
      winston.log( 'error', 'build failed' );
      abortBuild( e );
    }
  };

  /**
   * Notify the website that a new sim or translation has been deployed. This will cause the project to
   * synchronize and the new translation will appear on the website.
   * @param callback
   */
  var notifyServer = function( callback ) {
    var host = ( server === 'simian.colorado.edu' ) ? 'phet-dev.colorado.edu' : 'phet.colorado.edu';
    var project = 'html/' + simName;
    var url = 'http://' + host + '/services/synchronize-project?projectName=' + project;
    request( url, function( error, response, body ) {
      var errorMessage;

      if ( !error && response.statusCode === 200 ) {
        var syncResponse = JSON.parse( body );

        if ( !syncResponse.success ) {
          errorMessage = 'request to synchronize project ' + project + ' on ' + server + ' failed with message: ' + syncResponse.error;
          winston.log( 'error', errorMessage );
          sendEmail( 'SYNCHRONIZE FAILED', errorMessage );
        }
        else {
          winston.log( 'info', 'request to synchronize project ' + project + ' on ' + server + ' succeeded' );
        }
      }
      else {
        errorMessage = 'request to synchronize project errored or returned a non 200 status code';
        winston.log( 'error', errorMessage );
        sendEmail( 'SYNCHRONIZE FAILED', errorMessage );
      }

      if ( callback ) {
        callback();
      }
    } );
  };


  /**
   * Write a dependencies.json file based on the the dependencies passed to the build server.
   * The reason to write this to a file instead of using the in memory values, is so the "grunt checkout-shas"
   * task works without much modification.
   */
  var writeDependenciesFile = function() {
    fs.writeFile( buildDir + '/dependencies.json', JSON.stringify( repos ), function( err ) {
      if ( err ) {
        winston.log( 'error', err );
        taskCallback( err );
      }
      else {
        winston.log( 'info', 'wrote file ' + buildDir + '/dependencies.json' );

        var simTitle; // initialized via simTitleCallback in createTranslationsXML() for use in addToRosetta()
        var simTitleCallback = function( title ) {
          simTitle = title;
        };

        // run every step of the build
        cloneMissingRepos( function() {
          exec( 'npm install', simDir, function() {
            pullMaster( function() {
              exec( 'grunt checkout-shas --buildServer', simDir, function() {
                exec( 'git checkout ' + repos[ simName ].sha, simDir, function() { // checkout the sha for the current sim
                  exec( 'grunt build --brand=phet --locales=' + locales, simDir, function() {
                    exec( 'grunt generate-thumbnails', simDir, function() {
                      mkVersionDir( function() {
                        exec( 'cp build/* ' + HTML_SIMS_DIRECTORY + simName + '/' + version + '/', simDir, function() {
                          writeHtaccess( function() {
                            createTranslationsXML( simTitleCallback, function() {
                              notifyServer( function() {
                                addToRosetta( simTitle, function() {
                                  //spotScp( function() { TODO: do we need this? grunt deploy-production does a spot deploy already
                                  exec( 'grunt checkout-master-all', PERENNIAL, function() {
                                    exec( 'rm -rf ' + buildDir, '.', function() {
                                      taskCallback();
                                    } );
                                  } );
                                  //} );
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
      }

    } );
  };

  try {
    fs.mkdirSync( buildDir );
  }
  catch( e ) {
    // do nothing, most likely failed because the directory already exists, which is fine
  }
  finally {
    writeDependenciesFile();
  }

  res.send( 'build process initiated, check logs for details' );

}, 1 ); // 1 is the max number of tasks that can run concurrently

function queueDeploy( req, res ) {
  var repos = req.query[ REPOS_KEY ];
  var simName = req.query[ SIM_NAME_KEY ];
  var version = req.query[ VERSION_KEY ];
  var locales = req.query[ LOCALES_KEY ];
  var authorizationKey = req.query[ AUTHORIZATION_KEY ];

  if ( repos && simName && version && authorizationKey ) {
    if ( authorizationKey !== deployConfig.buildServerAuthorizationCode ) {
      var err = 'wrong authorization code';
      winston.log( 'error', err );
      res.send( err );
    }
    else {
      winston.log( 'info', 'queuing build for ' + simName + ' ' + version );
      taskQueue.push( { req: req, res: res }, function( err ) {
        if ( err ) {
          var errorMessage = 'Build failed with error: ' + err + '. Sim = ' + simName +
                             ' Version = ' + version + ' Locales = ' + ( locales ? locales.toString() : 'undefined' );
          winston.log( 'error', errorMessage );
          sendEmail( 'BUILD ERROR', errorMessage.replace( /\n/g, ' ' ) ); // for some reason emails get cut off at newlines
        }
        else {
          winston.log( 'info', 'build for ' + simName + ' finished successfully' );
        }
      } );
    }
  }
  else {
    var errorString = 'missing one or more required query parameters: repos, simName, version, authorizationKey';
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
app.listen( LISTEN_PORT, function() {
  winston.log( 'info', 'Listening on port ' + LISTEN_PORT );
  winston.log( 'info', 'Verbose mode: ' + verbose );
} );
