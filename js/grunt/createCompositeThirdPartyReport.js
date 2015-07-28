/**
 * Given the simulation-specific reports created by createSimSpecificThirdPartyReport, aggregate them and provide a
 * complete report, indicating which third-party resources are used by which simulations.
 *
 * @author Sam Reid
 */

// modules
var child_process = require( 'child_process' );
var assert = require( 'assert' );
var fs = require( 'fs' );

// constants
var SHERPA = '../sherpa';  // The relative path to sherpa, from the chipper path
var OUTPUT_FILE = 'third-party-licenses.md';
var LICENSES_DIRECTORY = '../sherpa/licenses/'; // contains third-party licenses themselves.

module.exports = function( grunt ) {
  'use strict';

  /* jshint -W079 */
  var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
  /* jshint +W079 */

  /* jslint node: true */
  // allows "process" to pass lint instead of getting an undefined lint error
  var directory = process.cwd();

  // Start in the github checkout dir (above one of the sibling directories)
  var rootdir = directory + '/../';

  var compositeCode = {};
  var compositeImagesAndAudio = {};

  var repositoryNames = [];

  // TODO: Make sure we hit all of the repos from active-sims (if one didn't build, it might not have a report file).
  // TODO: Should we just use active-sims as the list to iterate over?
  // TODO: Should there be a sim report as well as a non-sim report?
  // TODO: Add other 3rd party things from sherpa that are used in non-requirejs projects.
  // TODO: Should we parse the HTML and get the values from the HTML so that we can (a) run reports for published sims
  // TODO:  instead of just master, and won't have to generate additional report files after the build?
  // TODO: At a minimum, let us fail the build if we didn't see a report for every active-sim

  // Iterate over all images and audio directories recursively
  grunt.file.recurse( rootdir, function( abspath, rootdir, subdir, filename ) {
    if ( filename === 'third-party-report.json' ) {
      var repositoryName = subdir.substring( 0, subdir.lastIndexOf( '/' ) );

      // Report on progress as we go
      grunt.log.writeln( repositoryName );
      repositoryNames.push( repositoryName );
      var json = grunt.file.readJSON( abspath );
      var code = json.code;
      for ( var entry in code ) {
        if ( code.hasOwnProperty( entry ) ) {
          if ( !compositeCode.hasOwnProperty( entry ) ) {
            compositeCode[ entry ] = json.code[ entry ];//overwrites
            compositeCode[ entry ].usedBy = [];
          }
          compositeCode[ entry ].usedBy.push( repositoryName );
        }
      }

      var imagesAndAudio = json.imagesAndAudio;
      for ( entry in imagesAndAudio ) {
        if ( imagesAndAudio.hasOwnProperty( entry ) ) {
          if ( !compositeImagesAndAudio.hasOwnProperty( entry ) ) {
            compositeImagesAndAudio[ entry ] = json.imagesAndAudio[ entry ];
            compositeImagesAndAudio[ entry ].usedBy = [];
          }
          compositeImagesAndAudio[ entry ].usedBy.push( repositoryName );
        }
      }
    }
  } );

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
  grunt.log.writeln( JSON.stringify( compositeCode, null, 2 ) );
  grunt.log.writeln( JSON.stringify( compositeImagesAndAudio, null, 2 ) );
  grunt.log.writeln( 'report completed for\n' + repositoryNames.join( ', ' ) );

  // Convert everything to MD, see updateThirdPartyLicensesMD
  var json = grunt.file.readJSON( SHERPA + '/lib/license.json' );

  var entries = [];
  var codeLicensesUsed = [];

  // Get a list of the library names
  var libraries = [];
  for ( var lib in json ) {
    libraries.push( lib );
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
  for ( i = 0; i < imageAudioKeys.length; i++ ) {
    var imageAndAudioKey = imageAudioKeys[ i ];
    if ( compositeImagesAndAudio[ imageAndAudioKey ].notes !== 'from Snow Day Math' ) {
      var imageAudioEntryLines = [
        '**' + imageAndAudioKey + '**',
        compositeImagesAndAudio[ imageAndAudioKey ].text.join( '<br>' ),
        compositeImagesAndAudio[ imageAndAudioKey ].projectURL,
        'License: ' + compositeImagesAndAudio[ imageAndAudioKey ].license,
        'Notes: ' + compositeImagesAndAudio[ imageAndAudioKey ].notes,
        'Used by: ' + 'TODO'
      ];
      imagesAndAudioOutput.push( imageAudioEntryLines.join( '<br>' ) );
    }
  }

  // Summarize licenses used
  var output = '# Third-party Code:<br>\n' +
               entries.join( '\n\n' ) + '\n\n' +

               '---\n' +

               '# Third-party Code License Summary:<br>\n' +
               codeLicensesUsed.join( '<br>' ) + '\n\n' +

               '---\n' +

               '# Third-party Images & Audio:<br>\n' +
               imagesAndAudioOutput.join( '\n\n' ) + '\n';

  // It is sometimes convenient to iterate using GitHub issue preview rather than committing every time.
  // In this case, you may want to comment out the commit below.
  grunt.log.debug( '!!!!!! BEGIN LICENSES OUTPUT' );
  grunt.log.debug( output );
  grunt.log.debug( '!!!!!! END LICENSES OUTPUT' );

  grunt.log.writeln( 'writing file ' + OUTPUT_FILE );
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

  exec( 'git add ' + OUTPUT_FILE, function() {
    exec( 'git commit --message "updated info.md"', function() {
      exec( 'git push', function() {
        done();
      } );
    } );
  } );
};