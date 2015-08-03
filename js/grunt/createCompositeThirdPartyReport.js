// Copyright 2002-2015, University of Colorado Boulder

/**
 * Creates a composite report of all of the 3rd party images, code, audio, fonts used by PhET Simulations and updates
 * the online version by automatically adding and pushing the changes to GitHub.  The output can be seen at:
 * https://github.com/phetsims/sherpa/blob/master/third-party-licenses.md
 *
 * Entries in sherpa/license.json are used for the code report, and this is augmented by information obtained
 * by running mandatory simulation-specific reports using:
 *
 * grunt-all.sh build-no-lint --createSimSpecificThirdPartyReport
 *
 * indicating which third-party code resources are used by which simulations.
 *
 * See https://github.com/phetsims/chipper/issues/162
 *
 * @author Sam Reid
 */

// modules
var child_process = require( 'child_process' );
var assert = require( 'assert' );
var fs = require( 'fs' );

// constants
var SHERPA = '../sherpa';  // The relative path to sherpa, from the chipper path
var ACTIVE_RUNNABLES_FILENAME = 'chipper/data/active-runnables';  // The relative path to sherpa, from the chipper path
var OUTPUT_FILE = 'third-party-licenses.md';  // The name of the output file
var LICENSES_DIRECTORY = '../sherpa/licenses/'; // contains third-party licenses themselves.

module.exports = function( grunt ) {
  // The following comment permits node-specific globals (such as process.cwd()) to pass jshint
  /* jslint node: true */
  'use strict';

  /* jshint -W079 */
  var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
  /* jshint +W079 */

  var directory = process.cwd();

  // Start in the github checkout dir (above one of the sibling directories)
  var rootdir = directory + '/../';

  // Aggregate results for each of the license types
  var compositeCode = {};
  var compositeImagesAndAudio = {};

  // List of all of the repository names, so that we can detect which libraries are used by all-sims
  var repositoryNames = [];

  /**
   * Add the source (images/audio or code/fonts) entries to the destination object, keyed by name.
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

  // Iterate over all repositories images and audio directories recursively
  grunt.file.recurse( rootdir, function( abspath, rootdir, subdir, filename ) {
    if ( filename === 'third-party-report.json' ) {
      var repositoryName = subdir.substring( 0, subdir.lastIndexOf( '/' ) );

      // Report on progress as we go
      grunt.log.writeln( 'checking ' + repositoryName + '...' );
      repositoryNames.push( repositoryName );

      var json = grunt.file.readJSON( abspath );

      augment( repositoryName, json.code, compositeCode );
      augment( repositoryName, json.imagesAndAudio, compositeImagesAndAudio );
    }
  } );

  // Make sure we received a report from every active-runnable.  Otherwise, perhaps something isn't building properly
  var activeRunnables = grunt.file.read( rootdir + '/' + ACTIVE_RUNNABLES_FILENAME ).trim();
  var activeRunnablesByLine = activeRunnables.split( /\r?\n/ );
  var missing = [];
  for ( var i = 0; i < activeRunnablesByLine.length; i++ ) {
    var element = activeRunnablesByLine[ i ];
    var completed = false;
    for ( var k = 0; k < repositoryNames.length; k++ ) {
      if ( repositoryNames[ k ] === element ) {
        completed = true;
        break;
      }
    }
    if ( !completed ) {
      missing.push( element );
    }
  }
  if ( missing.length > 0 ) {
    grunt.fail.warn( 'missing reports for ' + missing.join( ', ' ) );
  }

  // Sort to easily compare lists of repositoryNames with usedBy columns, to see which resources are used by everything.
  repositoryNames.sort();

  // If anything is used by every sim indicate that here
  for ( var entry in compositeCode ) {
    if ( compositeCode.hasOwnProperty( entry ) ) {
      compositeCode[ entry ].usedBy.sort();
      if ( _.isEqual( repositoryNames, compositeCode[ entry ].usedBy ) ) {
        compositeCode[ entry ].usedBy = 'all-sims';// Confusing that this matches a repo name, but since that repo isn't actually a sim, perhaps this will be ok
      }
    }
  }

  var json = grunt.file.readJSON( SHERPA + '/lib/license.json' );

  var entries = [];
  var codeLicensesUsed = [];
  var imageAndAudioLicensesUsed = [];

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

  var imagesAndAudioOutput = [];
  var imageAudioKeys = [];
  for ( var imageAudioEntry in compositeImagesAndAudio ) {
    if ( compositeImagesAndAudio.hasOwnProperty( imageAudioEntry ) ) {
      imageAudioKeys.push( imageAudioEntry );
    }
  }
  // Use a case insensitive sort, see http://stackoverflow.com/questions/8996963/how-to-perform-case-insensitive-sorting-in-javascript
  imageAudioKeys.sort( function( a, b ) {
    return a.toLowerCase().localeCompare( b.toLowerCase() );
  } );

  // Create the text for the image and audio, and keep track of which licenses were used by them.
  for ( i = 0; i < imageAudioKeys.length; i++ ) {
    var imageAndAudioKey = imageAudioKeys[ i ];

    // Exception for Snow Day Math, can be removed once we are generating that artwork
    if ( compositeImagesAndAudio[ imageAndAudioKey ].notes !== 'from Snow Day Math' ) {
      var imageAudioEntryLines = [
        '**' + imageAndAudioKey + '**',
        compositeImagesAndAudio[ imageAndAudioKey ].text.join( '<br>' ),
        compositeImagesAndAudio[ imageAndAudioKey ].projectURL,
        'License: ' + compositeImagesAndAudio[ imageAndAudioKey ].license,
        'Notes: ' + compositeImagesAndAudio[ imageAndAudioKey ].notes
      ];
      imagesAndAudioOutput.push( imageAudioEntryLines.join( '<br>' ) );
    }
    if ( imageAndAudioLicensesUsed.indexOf( compositeImagesAndAudio[ imageAndAudioKey ].license ) < 0 ) {
      imageAndAudioLicensesUsed.push( compositeImagesAndAudio[ imageAndAudioKey ].license );
    }
  }

  // Summarize licenses used
  var output =
      'This report is for the current branch & revision of each repository at the time the report was generated ' +
      'and may not match with published versions.  To see the third party resources used in published simulations, inspect ' +
      'their HTML files for the `window.phet.chipper.thirdPartyLicenses` and `window.phet.chipper.thirdPartyImagesAndAudio` ' +
      '(only exists in recent sim publications).\n' +
      '* [Third-party Code & Fonts](#third-party-code-and-fonts)\n' +
      '* [Third-party Code & Fonts License Summary](#third-party-code-and-fonts-license-summary)\n' +
      '* [Third-party Images & Audio](#third-party-images-and-audio)\n' +
      '* [Third-party Images & Audio License Summary](#third-party-images-and-audio-license-summary)\n\n' +
      '# <a name="third-party-code-and-fonts"></a>Third-party Code & Fonts:<br>\n' +
      entries.join( '\n\n' ) + '\n\n' +

      '---\n' +

      '# <a name="third-party-code-and-fonts-license-summary"></a>Third-party Code & Fonts License Summary:<br>\n' +
      codeLicensesUsed.join( '<br>' ) + '\n\n' +

      '---\n' +

      '# <a name="third-party-images-and-audio"></a>Third-party Images & Audio:<br>\n' +
      imagesAndAudioOutput.join( '\n\n' ) + '\n\n' +

      '---\n' +

      '# <a name="third-party-images-and-audio-license-summary"></a>Third-party Images & Audio License Summary:<br>\n' +
      imageAndAudioLicensesUsed.join( '<br>' ) + '\n\n'
    ;

  // It is sometimes convenient to iterate using GitHub issue preview rather than committing every time.
  // In this case, you may want to comment out the commit below.
  grunt.log.debug( '!!!!!! BEGIN LICENSES OUTPUT' );
  grunt.log.debug( output );
  grunt.log.debug( '!!!!!! END LICENSES OUTPUT' );

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
    exec( 'git add ' + OUTPUT_FILE, function() {
      exec( 'git commit --message "updated ' + OUTPUT_FILE + '"', function() {
        exec( 'git push', function() {
          done();
        } );
      } );
    } );
  }
  else {
    grunt.log.writeln( OUTPUT_FILE + ' contents are the same.  No need to save/commit.' );
  }
};