// Copyright 2015, University of Colorado Boulder

/**
 * Creates a composite report of all of the 3rd party images, code, audio and other media used by all of the published
 * PhET Simulations. The reports is published at: https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
 *
 * Usage:
 * cd chipper
 * grunt report-third-party
 * // then push the updated license file to sherpa
 *
 * Third party entries are parsed from the HTML files for all simulations published on the PhET website, see
 * getLicenseEntry.js
 *
 * @author Sam Reid
 */

// Load shared constants
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

// constants
var SHERPA = '../sherpa';  // The relative path to sherpa, from the chipper path

// node modules
var fs = require( 'fs' );
var http = require( 'http' );

var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // eslint-disable-line require-statement-match

/**
 * @param grunt - the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  // The file where the report will be written
  var output = '../sherpa/third-party-licenses.md';

  // Since we download the HTML files, this task must wait until it is complete
  var gruntDone = grunt.task.current.async();

  // Prepare a directory where the HTML files will be downloaded
  if ( grunt.file.exists( 'downloaded-sims' ) ) {
    grunt.file.delete( 'downloaded-sims' );
  }
  grunt.file.mkdir( 'downloaded-sims' );

  // Download a URL to a local file
  // http://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js-without-using-third-party-libraries
  var download = function( url, dest, cb ) {
    var file = fs.createWriteStream( dest );
    http.get( url, function( response ) {
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

  // After the downloads are complete, write the report based on the metadata in the files.
  var writeReport = function() {

    // Aggregate results for each of the license types
    var compositeCode = {};
    var compositeMedia = {};

    // List of all of the repository names, so that we can detect which libraries are used by all-sims
    var simTitles = [];

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
      if ( ChipperStringUtils.endsWith( filename.toLowerCase(), '.html' ) &&

           // shortcut to avoid looking at the -iframe.html files when testing on a build directory.
           !ChipperStringUtils.endsWith( filename.toLowerCase(), '-iframe.html' ) ) {

        // load the file into a string
        var html = grunt.file.read( abspath ).trim();

        if ( html.indexOf( 'was not found on this server' ) < 0 || html.indexOf( 'was not found on this server' ) > 400 ) {

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
        }
      }
    } );

    // Sort to easily compare lists of repositoryNames with usedBy columns, to see which resources are used by everything.
    simTitles.sort();

    // If anything is used by every sim indicate that here
    for ( var entry in compositeCode ) {
      if ( compositeCode.hasOwnProperty( entry ) ) {
        compositeCode[ entry ].usedBy.sort();
        if ( _.isEqual( simTitles, compositeCode[ entry ].usedBy ) ) {
          compositeCode[ entry ].usedBy = 'all-sims';// Confusing that this matches a repo name, but since that repo isn't actually a sim, perhaps this will be ok
        }
      }
    }

    var json = grunt.file.readJSON( SHERPA + '/lib/license.json' );

    var entries = [];
    var codeLicensesUsed = [];
    var mediaLicensesUsed = [];

    // Get a list of the library names
    var libraries = [];
    for ( var lib in json ) {
      if ( json.hasOwnProperty( lib ) ) {
        libraries.push( lib );
      }
    }

    // Use a case insensitive sort, see http://stackoverflow.com/questions/8996963/how-to-perform-case-insensitive-sorting-in-javascript
    libraries.sort( function( a, b ) {
      return a.toLowerCase().localeCompare( b.toLowerCase() );
    } );

    // Add info for each library to the MD report
    for ( var i = 0; i < libraries.length; i++ ) {
      var library = libraries[ i ];

      var lines = [
        '**' + library + '**',
        json[ library ].text.join( '<br>' ),
        json[ library ].projectURL,
        'License: [' + json[ library ].license + '](licenses/' + library + '.txt)',
        'Notes: ' + json[ library ].notes
      ];

      if ( json[ library ].dependencies ) {
        lines.push( 'Dependencies: **' + json[ library ].dependencies + '**' );
      }

      if ( compositeCode.hasOwnProperty( library ) && compositeCode[ library ].usedBy instanceof Array ) {
        lines.push( 'Used by: ' + compositeCode[ library ].usedBy.join( ', ' ) );
      }

      // \n worked well when viewing GitHub markdown as an issue comment, but for unknown reasons <br> is necessary when
      // viewing from https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
      entries.push( lines.join( '<br>' ) );

      if ( codeLicensesUsed.indexOf( json[ library ].license ) < 0 ) {
        codeLicensesUsed.push( json[ library ].license );
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

      var copyrightStatement = compositeMedia[ mediaKey ].text.join( '<br>' ).trim();
      var projectURL = compositeMedia[ mediaKey ].projectURL.trim();

      if ( copyrightStatement.length === 0 ) {
        copyrightStatement = '(no text)';
      }

      if ( projectURL.length === 0 ) {
        projectURL = '(no project url)';
      }

      var notes = compositeMedia[ mediaKey ].notes.trim();
      if ( notes.length === 0 ) {
        notes = '(no notes)';
      }

      var license = compositeMedia[ mediaKey ].license.trim();
      if ( license.length === 0 ) {
        license = '(no license)';
      }

      var mediaEntryLines = [
        '**' + mediaKey + '**',
        copyrightStatement,
        projectURL,
        'License: ' + license,
        'Notes: ' + notes
      ];
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
      entries.join( '\n\n' ) + '\n\n' +

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
    if ( !grunt.file.exists( output ) || grunt.file.read( output ) !== outputString ) {
      grunt.log.writeln( 'File output changed, writing file ' + output );
      grunt.file.write( output, outputString );
    }
    else {
      grunt.log.writeln( output + ' contents are the same.  No need to save.' );
    }

    gruntDone();
  };

  // Download all of the simulations.  For simulations that are in "active-sims" but not published,
  // download them anyways but skip them in the report.
  var activeSimsString = fs.readFileSync( '../chipper/data/active-sims', 'utf-8' ).trim();
  var activeSimsArray = activeSimsString.split( '\n' );

  // Download files one at a time so we can make sure we get everything.
  var downloadNext = function( index ) {
    var sim = activeSimsArray[ index ];

    var url = 'http://phet.colorado.edu/sims/html/' + sim + '/latest/' + sim + '_en.html';
    console.log( 'downloading ' + (index + 1) + '/' + activeSimsArray.length + ': ' + url );

    download( url, 'downloaded-sims/' + sim + '_en.html', function() {
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

  activeSimsArray.forEach( function( sim ) {

  } );
};