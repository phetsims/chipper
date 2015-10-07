// Copyright 2002-2015, University of Colorado Boulder

/**
 * Creates a composite report of all of the 3rd party images, code, audio and other media used by all of the PhET
 * Simulations which appear in a directory (required argument) and updates the online version by automatically adding and
 * pushing the changes to GitHub.  One of the reports is published at:
 * https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
 *
 * Third party entries are parsed from HTML, see getLicenseEntry.js
 *
 * If the --activeRunnables grunt option is supplied, the task iterates over the active-runnables and copies each built HTML file
 * into the directory specified with --input before running the report.  If any HTML files are missing, the report will fail.
 * Before using this options, the developer should run `grunt-all.sh` to make sure all of the HTML files are up-to-date.
 * The directory is neither automatically created nor automatically cleaned, this is the responsibility of the developer.
 * (Note that if you fail to manually clean the directory, you may end up with stale HTML files).
 *
 * See https://github.com/phetsims/chipper/issues/162
 *
 * @author Sam Reid
 */

// modules
var assert = require( 'assert' );

// Load shared constants
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

// constants
var SHERPA = '../sherpa';  // The relative path to sherpa, from the chipper path

/**
 * @param grunt - the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  var input = grunt.option( 'input' ); // relative or absolute path to the directory in which to find the HTML files for reporting
  assert( input, 'missing required option: input' );
  var output = grunt.option( 'output' ); // path to a file where the report should be written
  assert( output, 'missing required option: output' );
  var activeRunnables = !!grunt.option( 'active-runnables' ); // {boolean} see doc above

  var i;

  var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' );

  // If the option is provided, try to copy all of the active-runnables to the target directory before running the report
  if ( activeRunnables ) {

    var directory = process.cwd();

    // Start in the github checkout dir (above one of the sibling directories)
    var rootdir = directory + '/../';

    var ACTIVE_RUNNABLES_FILENAME = 'chipper/data/active-runnables';  // The relative path to the list of active runnables

    // Make sure we received a report from every active-runnable.  Otherwise, perhaps something isn't building properly
    var activeRunnablesString = grunt.file.read( rootdir + '/' + ACTIVE_RUNNABLES_FILENAME ).trim();
    var activeRunnablesByLine = activeRunnablesString.split( /\r?\n/ );
    for ( i = 0; i < activeRunnablesByLine.length; i++ ) {
      var element = activeRunnablesByLine[ i ];
      var src = rootdir + element + '/build/' + element + '_en.html';
      var dst = input + '/' + element + '_en.html';
      grunt.file.copy( src, dst );
    }
  }

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

  grunt.file.recurse( input, function( abspath, rootdir, subdir, filename ) {
    if ( ChipperStringUtils.endsWith( filename.toLowerCase(), '.html' ) &&

         // shortcut to avoid looking at the -iframe.html files when testing on a build directory.
         !ChipperStringUtils.endsWith( filename.toLowerCase(), '-iframe.html' ) ) {

      // load the file into a string
      var html = grunt.file.read( abspath ).trim();

      var startIndex = html.indexOf( ChipperConstants.START_THIRD_PARTY_LICENSE_ENTRIES );
      var endIndex = html.indexOf( ChipperConstants.END_THIRD_PARTY_LICENSE_ENTRIES );
      var substring = html.substring( startIndex, endIndex );

      var firstCurlyBrace = substring.indexOf( '{' );
      var lastCurlyBrace = substring.lastIndexOf( '}' );
      var jsonString = substring.substring( firstCurlyBrace, lastCurlyBrace + 1 );

      var json = JSON.parse( jsonString );

      var title = parseTitle( html );
      if ( !title || title.indexOf( 'undefined' ) === 0 ) {
        grunt.log.writeln( 'title not found for ' + abspath );
        title = filename;
      }
      augment( title, json.lib, compositeCode );
      augment( title, json.audio, compositeMedia );
      augment( title, json.images, compositeMedia );

      simTitles.push( title );
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
  for ( i = 0; i < libraries.length; i++ ) {
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
    mediaOutput.push( mediaEntryLines.join( '<br>' ) );

    if ( mediaLicensesUsed.indexOf( license ) < 0 ) {
      mediaLicensesUsed.push( license );
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
};