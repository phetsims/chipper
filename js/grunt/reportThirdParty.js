// Copyright 2002-2015, University of Colorado Boulder

/**
 * Creates a composite report of all of the 3rd party images, code, audio and other media used by all of the PhET
 * Simulations which appear in a directory (required argument) and updates the online version by automatically adding and
 * pushing the changes to GitHub.  The output can be seen at:
 * https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
 *
 * Third party entries are parsed from HTML.  See getLicenseEntry.js
 *
 * See https://github.com/phetsims/chipper/issues/162
 *
 * @author Sam Reid
 */

// The following comment permits node-specific globals (such as process.cwd()) to pass jshint
/* jslint node: true */
'use strict';

// modules
var child_process = require( 'child_process' );
var assert = require( 'assert' );
var fs = require( 'fs' );

// Load shared constants
var ThirdPartyConstants = require( '../../../chipper/js/grunt/ThirdPartyConstants' );

// constants
var SHERPA = '../sherpa';  // The relative path to sherpa, from the chipper path
var OUTPUT_FILE = 'third-party-licenses.md';  // The name of the output file
var LICENSES_DIRECTORY = '../sherpa/licenses/'; // contains third-party licenses themselves.
var COMMIT_CHANGES = false;

/**
 * @param grunt
 * @param {string} path - the path to the directory in which to find the HTML files for reporting, can be relative to
 *                      - grunt or absolute
 */
module.exports = function( grunt, path ) {

  /* jshint -W079 */
  var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
  /* jshint +W079 */

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

    return html.substring( startIndex + startKey.length, endIndex );
  };

  /**
   * Add the source (images/audio/media or code) entries to the destination object, keyed by name.
   * @param {string} repositoryName - the name of the repository, such as 'energy-skate-park-basics'
   * @param {object} source - the object from which to read the entry
   * @param {object} destination - the object to which to append the entry
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

  var endsWith = function( string, substring ) {
    return string.indexOf( substring ) === string.length - substring.length;
  };

  grunt.file.recurse( path, function( abspath, rootdir, subdir, filename ) {
    if ( endsWith( filename.toLowerCase(), '.html' ) &&

         // shortcut to avoid looking at the -iframe.html files when testing on a build directory.
         !endsWith( filename.toLowerCase(), '-iframe.html' ) ) {

      // load the file into a string
      var html = grunt.file.read( abspath ).trim();

      var startIndex = html.indexOf( ThirdPartyConstants.START_THIRD_PARTY_LICENSE_ENTRIES );
      var endIndex = html.indexOf( ThirdPartyConstants.END_THIRD_PARTY_LICENSE_ENTRIES );
      var substring = html.substring( startIndex, endIndex );

      var firstCurlyBrace = substring.indexOf( '{' );
      var lastCurlyBrace = substring.lastIndexOf( '}' );
      var jsonString = substring.substring( firstCurlyBrace, lastCurlyBrace + 1 );

      var json = JSON.parse( jsonString );

      var title = parseTitle( html );
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
  for ( var i = 0; i < libraries.length; i++ ) {
    var library = libraries[ i ];

    // check for existence of the license file
    if ( !fs.existsSync( LICENSES_DIRECTORY + library + '.txt' ) ) {
      grunt.log.error( 'license file not found for ' + library );
    }

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

    var mediaEntryLines = [
      '**' + mediaKey + '**',
      compositeMedia[ mediaKey ].text.join( '<br>' ),
      compositeMedia[ mediaKey ].projectURL,
      'License: ' + compositeMedia[ mediaKey ].license,
      'Notes: ' + compositeMedia[ mediaKey ].notes
    ];
    if ( compositeMedia[ mediaKey ].exception ) {
      mediaEntryLines.push( 'Exception: ' + compositeMedia[ mediaKey ].exception );
    }
    mediaOutput.push( mediaEntryLines.join( '<br>' ) );

    if ( mediaLicensesUsed.indexOf( compositeMedia[ mediaKey ].license ) < 0 ) {
      mediaLicensesUsed.push( compositeMedia[ mediaKey ].license );
    }
  }

  // Summarize licenses used
  // TODO: Add the versions
  var fileList = simTitles.join( '* ' );

  var output =
    'This report enumerates the third-party resources (code, images, audio, etc) used in a set of simulations.\n' +
    '* [Third-party Code](#third-party-code)\n' +
    '* [Third-party Code License Summary](#third-party-code-license-summary)\n' +
    '* [Third-party Media](#third-party-media)\n' +
    '* [Third-party Media License Summary](#third-party-media-license-summary)\n' +
    '\n' +
    'This report is for the following simulations: \n\n* ' + fileList + '\n\nTo see the third party resources used in a particular published ' +
    'simulation, inspect the HTML file between the `' + ThirdPartyConstants.START_THIRD_PARTY_LICENSE_ENTRIES + '` and `' + ThirdPartyConstants.END_THIRD_PARTY_LICENSE_ENTRIES + '` ' +
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
  if ( grunt.file.read( SHERPA + '/' + OUTPUT_FILE ) !== output ) {
    grunt.log.writeln( 'File output changed, writing file ' + OUTPUT_FILE );
    grunt.file.write( SHERPA + '/' + OUTPUT_FILE, output );

    var done = grunt.task.current.async();

    // exec a command in the sherpa directory
    var exec = function( command, callback ) {
      child_process.exec( command, { cwd: SHERPA }, function( err, stdout, stderr ) {
        grunt.log.writeln( stdout );
        grunt.log.writeln( stderr );
        assert( !err, 'assertion error running ' + command );
        callback();
      } );
    };

    // Add and commit the changes to the output file
    if ( COMMIT_CHANGES ) {
      exec( 'git add ' + OUTPUT_FILE, function() {
        exec( 'git commit --message "updated ' + OUTPUT_FILE + '"', function() {
          exec( 'git push', function() {
            done();
          } );
        } );
      } );
    }
  }
  else {
    grunt.log.writeln( OUTPUT_FILE + ' contents are the same.  No need to save/commit.' );
  }
};