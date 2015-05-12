// Copyright 2002-2015, University of Colorado Boulder

/**
 * PhET build server
 *
 * @author Aaron Davis
 */

// modules
var express = require( 'express' );
var doT = require( 'express-dot' );
var parseArgs = require( 'minimist' );
var winston = require( 'winston' );
var _ = require( 'underscore' );
var request = require( 'request' );
var querystring = require( 'querystring' );
var child_process = require( 'child_process' );
var fs = require( 'fs' );

// constants
var LISTEN_PORT = 16371;
var REPOS_KEY = 'repos';
var LOCALES_KEY = 'locales';

function deploy( req, res ) {
  console.log( req.query );
  if ( req.query[ REPOS_KEY ] && req.query[ LOCALES_KEY ] ) {
    var repos = JSON.parse( req.query[ REPOS_KEY ] );
    var locales = JSON.parse( req.query[ LOCALES_KEY ] );
    console.log( repos );
    console.log( locales );

    var buildDir = '../build-server-tmp';

    var writeGruntFile = function( callback ) {
      var contents = 'module.exports = require( \'../chipper/js/grunt/Gruntfile.js\' );';
      fs.writeFile( buildDir + '/Gruntfile.js', contents, function( err ) {
        if ( err ) {
          return console.log( err );
        }
        else {
          console.log( 'wrote Gruntfile' );
          callback();
        }
      } );
    };

    var writeDependenciesFile = function() {
      fs.writeFile( buildDir + '/dependencies.json', JSON.stringify( repos ), function( err ) {
        if ( err ) {
          return console.log( err );
        }
        console.log( 'The file was saved!' );

        child_process.exec( 'grunt checkout-shas', { cwd: buildDir }, function( err, stdout, stderr ) {
          if (err) {
            console.log( err );
          }
          else {
            console.log( 'no error!' );
          }
        } );

      } );
    };

    fs.exists( buildDir, function( exists ) {
      if ( !exists ) {
        fs.mkdir( buildDir, function( err ) {
          if ( !err ) {
            writeGruntFile( writeDependenciesFile );
          }
        } );
      }
      else {
        writeGruntFile( writeDependenciesFile );
      }
    } );


  }
  else {
    winston.log( 'error', 'missing required query parameters repos and/or locales' )
  }

  //res.send( repos );
  //var child = spawn( 'ls', [ '-la', '.' ] );
  //var result = '';
  //
  //child.stdout.on( 'data', function( chunk ) {
  //  result += chunk.toString();
  //} );
  //
  //child.on( 'close', function( code ) {
  //  console.log( result );
  //} );
}

function test() {
  var repos = {
    "molecules-and-light": {
      "sha": "9020b1a3fb9e671ef2fcf47c44521276749abbe8",
      "branch": "1.0"
    },
    "assert": {
      "sha": "952d1ea66d2aa4c707413ff3a355120a5fe0a6d4",
      "branch": "HEAD"
    },
    "axon": {
      "sha": "9d415eb95eac561226402535dbbeb34d611b514b",
      "branch": "HEAD"
    },
    "brand": {
      "sha": "8565ca68078fa1015fa677ee5ff8075508f0216b",
      "branch": "HEAD"
    },
    "chipper": {
      "sha": "4a815b88a71b1796a09efb9fe81c27d491fa0e3a",
      "branch": "HEAD"
    },
    "dot": {
      "sha": "300d500db2b269cef3a57afff6a484bd22b889c1",
      "branch": "HEAD"
    },
    "joist": {
      "sha": "469839fa26e6f9dd6dc09efe398b2d62d70a8313",
      "branch": "HEAD"
    },
    "kite": {
      "sha": "4283618986d554da85329ebdbc6c2ddd54cba84f",
      "branch": "HEAD"
    },
    "nitroglycerin": {
      "sha": "a1b4005b9a6062887955274a9d14c31dab69b93c",
      "branch": "HEAD"
    },
    "phet-core": {
      "sha": "33450dabed3c9b3a2ed1c33666db534fb9e51fbc",
      "branch": "HEAD"
    },
    "phetcommon": {
      "sha": "bb92c52cd90fdaa0c2a746fea82594afd439b4db",
      "branch": "HEAD"
    },
    "scenery": {
      "sha": "422ff322b6b4749406adad4293d6700932ecf49e",
      "branch": "HEAD"
    },
    "scenery-phet": {
      "sha": "adbf7ffe7672f8321b4462a714b397146403e51e",
      "branch": "HEAD"
    },
    "sherpa": {
      "sha": "9a3ecfeeef516ec6361af14825f0581165625c44",
      "branch": "HEAD"
    },
    "sun": {
      "sha": "f290622fd4e3c6389779ce72fd32539b4d03ea72",
      "branch": "HEAD"
    }
  };
  var locales = [ 'fr' ];
  var query = querystring.stringify( { 'repos': JSON.stringify( repos ), 'locales': JSON.stringify( locales ) } );
  var url = 'http://localhost:' + LISTEN_PORT + '/deploy?' + query;
  request( url, function( error, response, body ) {
    if ( !error && response.statusCode == 200 ) {
      console.log( 'successfully tried to deploy to url: ' + url );
    }
    else {
      console.log( 'ERROR: tried to deploy to url: ' + url );
    }
  } );
}

test();

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
app.get( '/deploy', deploy );

// start the server
app.listen( LISTEN_PORT, function() { winston.log( 'info', 'Listening on port ' + LISTEN_PORT ) } );
