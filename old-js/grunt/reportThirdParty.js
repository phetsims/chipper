// Copyright 2015-2016, University of Colorado Boulder

/**
 * Creates a composite report of all of the 3rd party images, code, audio and other media used by all of the published
 * PhET Simulations. The reports is published at: https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
 *
 * Usage:
 * grunt report-third-party
 * // then push sherpa/third-party-licenses.md
 *
 * Third party entries are parsed from the HTML files for all simulations published on the PhET website.
 * See getLicenseEntry.js for documentation of the fields in the entries.
 *
 * Copy the local-auth-code key value from phet-server:/etc/tomcat/context.xml into the value for
 * websiteAuthorizationCode in ~/.phet/build-local.json
 *
 * @author Sam Reid
 */
/* eslint-env node */
'use strict';

// Load shared constants
var assert = require( 'assert' );
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

// constants
var SHERPA = '../sherpa';  // The relative path to sherpa, from the chipper path

// node modules
var fs = require( 'fs' );
var https = require( 'https' );

var _ = require( '../../' + SHERPA + '/lib/lodash-4.17.4.min' ); // eslint-disable-line require-statement-match

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * @param grunt - the grunt instance
 */
module.exports = function( grunt ) {

  // read configuration file - required to write to website database
  var httpsResponse;
  var serverName = 'phet.colorado.edu';
  var BUILD_LOCAL_FILENAME = process.env.HOME + '/.phet/build-local.json';
  var buildLocalJSON = JSON.parse( fs.readFileSync( BUILD_LOCAL_FILENAME, { encoding: 'utf-8' } ) );
  assert ( buildLocalJSON && buildLocalJSON.websiteAuthorizationCode, 'websiteAuthorizationCode missing from ' + BUILD_LOCAL_FILENAME);

  // The file where the report will be written
  var outputFilename = SHERPA + '/third-party-licenses.md';

  // Since we download the HTML files, this task must wait until it is complete
  var gruntDone = grunt.task.current.async();

  // Prepare a directory where the HTML files will be downloaded.
  // This directory should have been deleted at the end of the last task, but this could be useful if the task was
  // interrupted before cleanup.
  if ( grunt.file.exists( 'downloaded-sims' ) ) {
    grunt.file.delete( 'downloaded-sims' );
  }
  grunt.file.mkdir( 'downloaded-sims' );

  // Download a URL to a local file
  // http://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js-without-using-third-party-libraries
  var download = function( url, dest, cb ) {
    var file = fs.createWriteStream( dest );
    https.get( url, function( response ) {
      response.pipe( file );
      file.on( 'finish', function() {
        file.close( cb );  // close() is async, call cb after close completes.
      } );
    } ).on( 'error', function( err ) { // Handle errors
      fs.unlink( dest ); // Delete the file async. (But we don't check the result)
      if ( cb ) {
        cb( err.message );
      }
    } );
  };

  /**
   * This takes a mapping of sims to libraries used and uploads it to the PhET Website.
   * The response in the returned object is created asynchronously and will be null at return time.
   * 
   * @param libraries [{name:"sim-name",libraries:"Library Name<br/>Library Name"}]
   * @returns {response: https.response || https.error.message, request: https.request}
   */
  var postLibrariesToWebsite = function( libraries ) {
    // Semaphore for receipt of http response.  If we call gruntDone() before it exists the database query will fail silently.
    // var response;

    // Change libraryobject to string in format that the database will recognize.
    // i.e. '{"sim-name":"Library Name<br/>Library Name", ...}'   
    var libraryString = '{' + libraries.map( function (o) { return '"' + o.name + '":"' + o.libraries + '"'; } ).join(',') + '}';

    var options = {
      host: serverName,
      path: '/services/add-simulation-libraries',
      port: 443,
      method: 'POST',
      auth: 'token:' + buildLocalJSON.websiteAuthorizationCode,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength( libraryString )
      }
    };
    var request = https.request( options, function( res ) {
      httpsResponse = res;
    } );
    request.on( 'error', function( e ) {
      grunt.log.writeln( 'There was a problem uploading the data to the website: ' + e.message );
      httpsResponse = e.message;
    } );

    // write data to request body
    request.write( libraryString );
    
    request.end();

    return {
      // response: response, 
      request: request
    };
  };

  // After the downloads are complete, write the report based on the metadata in the files.
  var writeReport = function() {

    // Aggregate results for each of the license types
    var compositeCode = {};
    var compositeMedia = {};

    // List of all of the repository names, so that we can detect which libraries are used by all-sims
    var simTitles = [];

    // List of libraries for each sim
    // Type: string in JSON format
    var simLibraries = [];

    /**
     * Given an HTML text, find the title attribute by parsing for <title>
     * @param html
     * @returns {string}
     */
    var parseTitle = function( html ) {
      var startKey = '<title>';
      var endKey = '</title>';

      var startIndex = html.indexOf( startKey );
      var endIndex = html.indexOf( endKey );

      return html.substring( startIndex + startKey.length, endIndex ).trim();
    };

    /**
     * Add the source (images/audio/media or code) entries to the destination object, keyed by name.
     * @param {string} repositoryName - the name of the repository, such as 'energy-skate-park-basics'
     * @param {Object} source - the object from which to read the entry
     * @param {Object} destination - the object to which to append the entry
     */
    var augment = function( repositoryName, source, destination ) {
      for ( var entry in source ) {
        if ( source.hasOwnProperty( entry ) ) {
          if ( !destination.hasOwnProperty( entry ) ) {
            destination[ entry ] = source[ entry ];//overwrites
            destination[ entry ].usedBy = [];
          }
          destination[ entry ].usedBy.push( repositoryName );
        }
      }
    };

    grunt.file.recurse( 'downloaded-sims', function( abspath, rootdir, subdir, filename ) {
      if ( ChipperStringUtils.endsWith( filename.toLowerCase(), '.html' ) ) {

        // load the file into a string
        var html = grunt.file.read( abspath ).trim();

        // If you request a page that doesn't exist, Apache returns HTML that says the page "was not found on this server"
        // Since we are looping through all active-sims, there are likely to be many simulations for which published
        // HTML is not available.  This is not an error, it is simply how we can differentiate between active-sims and
        // published sims.
        // The request may be redirected to the PhET Website 404 page instead of the default Apache page in some 
        // circumstances, which contains the text: "The requested page could not be found."
        if ( (html.indexOf( 'was not found on this server' ) < 0 || html.indexOf( 'was not found on this server' ) > 400) 
              && html.indexOf( 'The requested page could not be found.' ) === -1 ) {

          var startIndex = html.indexOf( ChipperConstants.START_THIRD_PARTY_LICENSE_ENTRIES );
          var endIndex = html.indexOf( ChipperConstants.END_THIRD_PARTY_LICENSE_ENTRIES );
          var substring = html.substring( startIndex, endIndex );

          var firstCurlyBrace = substring.indexOf( '{' );
          var lastCurlyBrace = substring.lastIndexOf( '}' );
          var jsonString = substring.substring( firstCurlyBrace, lastCurlyBrace + 1 );

          var json = JSON.parse( jsonString );


          var title = parseTitle( html );
          if ( !title || title.indexOf( 'undefined' ) === 0 || title.indexOf( 'TITLE' ) >= 0 ) {
            grunt.log.writeln( 'title not found for ' + abspath );
            title = filename;
          }
          augment( title, json.lib, compositeCode );
          augment( title, json.audio, compositeMedia );
          augment( title, json.images, compositeMedia );

          simTitles.push( title );

          // Get the name of the sim as referenced in the website database out of the filename
          var hyphenatedTitle = filename.substring( 0, filename.indexOf( '_' ) );

          // Concatenate all the libraries for this sim with html newline.
          var libString = '';
          for ( var entry in json.lib ) {
            libString += entry + '<br/>';
          }

          //  Update the object to be pushed to the website database
          simLibraries.push( {
            name: hyphenatedTitle,
            libraries: libString
          });
        }
      }
    } );

    // POST the library data to the website database
    var postObject = postLibrariesToWebsite( simLibraries );

    // Sort to easily compare lists of repositoryNames with usedBy columns, to see which resources are used by everything.
    simTitles.sort();

    // If anything is used by every sim indicate that here
    for ( var entry in compositeCode ) {
      if ( compositeCode.hasOwnProperty( entry ) ) {
        compositeCode[ entry ].usedBy.sort();
        if ( _.isEqual( simTitles, compositeCode[ entry ].usedBy ) ) {
          compositeCode[ entry ].usedBy = 'all-sims'; // this is an annotation, not the vestigial all-sims repo
        }
      }
    }

    var licenseJSON = grunt.file.readJSON( SHERPA + '/lib/license.json' );

    var codeOutput = [];
    var codeLicensesUsed = [];
    var mediaLicensesUsed = [];

    // Get a list of the library names
    var libraryNames = [];
    for ( var lib in licenseJSON ) {
      if ( licenseJSON.hasOwnProperty( lib ) ) {
        libraryNames.push( lib );
      }
    }

    // Use a case insensitive sort, see http://stackoverflow.com/questions/8996963/how-to-perform-case-insensitive-sorting-in-javascript
    libraryNames.sort( function( a, b ) {
      return a.toLowerCase().localeCompare( b.toLowerCase() );
    } );

    // Add info for each library to the MD report
    for ( var i = 0; i < libraryNames.length; i++ ) {
      var library = libraryNames[ i ];

      var lineElementsForLibrary = [
        '**' + library + '**',
        licenseJSON[ library ].text.join( '<br>' ),
        licenseJSON[ library ].projectURL,
        'License: [' + licenseJSON[ library ].license + '](licenses/' + library + '.txt)',
        'Notes: ' + licenseJSON[ library ].notes
      ];

      if ( licenseJSON[ library ].dependencies ) {
        lineElementsForLibrary.push( 'Dependencies: **' + licenseJSON[ library ].dependencies + '**' );
      }

      if ( compositeCode.hasOwnProperty( library ) && compositeCode[ library ].usedBy instanceof Array ) {
        lineElementsForLibrary.push( 'Used by: ' + compositeCode[ library ].usedBy.join( ', ' ) );
      }

      // \n worked well when viewing GitHub markdown as an issue comment, but for unknown reasons <br> is necessary when
      // viewing from https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
      codeOutput.push( lineElementsForLibrary.join( '<br>' ) );

      if ( codeLicensesUsed.indexOf( licenseJSON[ library ].license ) < 0 ) {
        codeLicensesUsed.push( licenseJSON[ library ].license );
      }
    }

    var mediaOutput = [];
    var mediaKeys = [];
    for ( var imageAudioEntry in compositeMedia ) {
      if ( compositeMedia.hasOwnProperty( imageAudioEntry ) ) {
        mediaKeys.push( imageAudioEntry );
      }
    }
    // Use a case insensitive sort, see http://stackoverflow.com/questions/8996963/how-to-perform-case-insensitive-sorting-in-javascript
    mediaKeys.sort( function( a, b ) {
      return a.toLowerCase().localeCompare( b.toLowerCase() );
    } );

    // Create the text for the image and audio, and keep track of which licenses were used by them.
    for ( i = 0; i < mediaKeys.length; i++ ) {
      var mediaKey = mediaKeys[ i ];

      var text = compositeMedia[ mediaKey ].text.join( '<br>' ).trim();
      var projectURL = compositeMedia[ mediaKey ].projectURL.trim();

      if ( text.length === 0 ) {
        text = '(no text)';
      }

      if ( projectURL.length === 0 ) {
        projectURL = '(no project url)';
      }

      var notes = compositeMedia[ mediaKey ].notes.trim();
      if ( notes.length === 0 ) {
        notes = '(no notes)';
      }

      var license = compositeMedia[ mediaKey ].license.trim();
      assert && assert( license.length > 0, 'All media entries must have a license' );

      var mediaEntryLines = [
        '**' + mediaKey + '**',
        text,
        projectURL,
        'License: ' + license,
        'Notes: ' + notes
      ];

      // PhET has temporarily chosen to publish John Travoltage with incompatible licenses, so the reasons for
      // making the exceptions are noted here.  The new artwork is being developed now and the simulation
      // will be republished without exception cases soon.
      // This code will remain in case we have other exception cases in the future.
      if ( compositeMedia[ mediaKey ].exception ) {
        mediaEntryLines.push( 'Exception: ' + compositeMedia[ mediaKey ].exception );
      }

      // TODO: is this a real license?  Why is there logic here but nowhere else?  Perhaps files annotated with
      // contact phethelp@colorado.edu are leaking into the HTML files unnecessarily
      if ( license !== 'contact phethelp@colorado.edu' ) {
        mediaOutput.push( mediaEntryLines.join( '<br>' ) );

        if ( mediaLicensesUsed.indexOf( license ) < 0 ) {
          mediaLicensesUsed.push( license );
        }
      }
    }

    // Summarize licenses used
    var fileList = simTitles.join( '\n* ' );

    var outputString =
      'This report enumerates the third-party resources (code, images, audio, etc) used in a set of simulations.\n' +
      '* [Third-party Code](#third-party-code)\n' +
      '* [Third-party Code License Summary](#third-party-code-license-summary)\n' +
      '* [Third-party Media](#third-party-media)\n' +
      '* [Third-party Media License Summary](#third-party-media-license-summary)\n' +
      '\n' +
      'This report is for the following simulations: \n\n* ' + fileList + '\n\nTo see the third party resources used in a particular published ' +
      'simulation, inspect the HTML file between the `' + ChipperConstants.START_THIRD_PARTY_LICENSE_ENTRIES + '` and `' + ChipperConstants.END_THIRD_PARTY_LICENSE_ENTRIES + '` ' +
      '(only exists in sim publications after Aug 7, 2015).\n' +
      '# <a name="third-party-code"></a>Third-party Code:<br>\n' +
      codeOutput.join( '\n\n' ) + '\n\n' +

      '---\n' +

      '# <a name="third-party-code-and-license-summary"></a>Third-party Code License Summary:<br>\n' +
      codeLicensesUsed.join( '<br>' ) + '\n\n' +

      '---\n' +

      '# <a name="third-party-media"></a>Third-party Media:<br>\n' +
      mediaOutput.join( '\n\n' ) + '\n\n' +

      '---\n' +

      '# <a name="third-party-media-license-summary"></a>Third-party Media License Summary:<br>\n' +
      mediaLicensesUsed.join( '<br>' ) + '\n\n';

    // Compare the file output to the existing file, and write & git commit only if different
    if ( !grunt.file.exists( outputFilename ) || grunt.file.read( outputFilename ) !== outputString ) {
      grunt.log.writeln( 'File output changed, writing file ' + outputFilename );
      grunt.file.write( outputFilename, outputString );
    }
    else {
      grunt.log.writeln( outputFilename + ' contents are the same.  No need to save.' );
    }

    // Delete the temporarily downloaded files when task complete
    if ( grunt.file.exists( 'downloaded-sims' ) ) {
      grunt.file.delete( 'downloaded-sims' );
    }


    if ( postObject && postObject.request ) {
      // Wait for the file upload to finish or fail.
      grunt.log.writeln( 'Uploading library information to website database ...' );
      var interval = setInterval( function () {
        if ( httpsResponse ) {
          clearInterval( interval );
          // Write any errors to the log
          if ( httpsResponse.statusCode && !( httpsResponse.statusCode >= 200 && httpsResponse.statusCode <= 299 ) ) {
            grunt.log.writeln( 'Error in website request: ' + httpsResponse.statusCode + ' ' + httpsResponse.statusMessage );
          }else {
            grunt.log.writeln( 'Upload finished successfully.' );
          }

          gruntDone();
        }
      }, 1000 );
    }
    else {
      gruntDone();
    }
  };

  // Download all of the simulations.  For simulations that are in "active-sims" but not published,
  // download them anyways but skip them in the report.
  // TODO: don't use this from chipper!
  var activeSimsString = fs.readFileSync( '../perennial/data/active-sims', 'utf-8' ).trim();
  var activeSimsArray = activeSimsString.split( '\n' );

  // Download files one at a time so we can make sure we get everything.
  var downloadNext = function( index ) {
    var sim = activeSimsArray[ index ].trim();
    var url = 'https://' + serverName + '/sims/html/' + sim + '/latest/' + sim + '_en.html';
    console.log( 'downloading ' + (index + 1) + '/' + activeSimsArray.length + ': ' + url );
    download( url, 'downloaded-sims/' + sim + '_en.html', function( err ) {
      assert && assert( !err, 'Error during download: ' + err );

      var next = index + 1;

      if ( next < activeSimsArray.length ) {
        downloadNext( next );
      }
      else {
        writeReport();
      }
    } );
  };

  downloadNext( 0 );
};