// Copyright 2015, University of Colorado Boulder

/**
 * This grunt task iterates over all of the license.json files and reports any media files (images, audio, ...)
 * that have any of the following problems:
 *
 * incompatible-license    Known to be from an unapproved source outside of PhET
 * not-annotated           Missing license.json file or missing entry in license.json
 * missing-file            There is an entry in the license.json but no corresponding file
 *
 * This can be run from any simulation directory with `grunt report-media` and it reports for
 * all directories (not just the simulation at hand).
 *
 * Note that this program relies on numerous heuristics for determining the output, such as allowed entries that
 * determine if a file originates from PhET.
 *
 * See https://github.com/phetsims/tasks/issues/274
 *
 * @author Sam Reid
 */
/* eslint-env node */
'use strict';

// modules
var assert = require( 'assert' );
var ChipperConstants = require( '../../../chipper/js/common/ChipperConstants' );

/**
 * @param grunt the grunt instance
 */
module.exports = function( grunt ) {

  // modules
  var getLicenseEntry = require( '../../../chipper/js/common/getLicenseEntry' );

  // constants
  var ACTIVE_REPOS_FILENAME = 'chipper/data/active-repos';  // The relative path to the list of active repos

  // Start in the github checkout dir (above one of the sibling directories)
  var directory = process.cwd();
  var rootdir = directory + '/../';

  // Iterate over all active-repos
  var repos = grunt.file.read( rootdir + '/' + ACTIVE_REPOS_FILENAME ).trim();
  var reposByLine = repos.split( /\r?\n/ );

  /**
   * Create a fast report based on the license.json files for the specified repository and directory (images or audio)
   * @param {string} repo - the name of the repository, such as 'balancing-act'
   * @param {string} directory - the name of the directory to search such as 'images'
   * @private
   */
  var reportForDirectory = function( repo, directory ) {

    assert( grunt.file.exists( rootdir + repo ), 'missing required repo: ' + repo );

    var searchDir = rootdir + repo + '/' + directory;

    // Not all projects have an audio/ directory
    if ( grunt.file.exists( searchDir ) ) {

      // Iterate over all media directories, such as images and audio recursively
      grunt.file.recurse( searchDir, function( abspath, rootdir, subdir, filename ) {

        // Some files don't need to be attributed in the license.json
        if ( abspath.indexOf( 'README.md' ) < 0 &&
             filename.indexOf( 'license.json' ) !== 0 ) {

          // Classify the resource
          var result = getLicenseEntry( abspath );

          if ( !result ) {
            grunt.log.writeln( 'not-annotated: ' + repo + '/' + directory + '/' + filename );
          }
          // Report if it is a problem
          else if ( result.isProblematic === true ) {
            grunt.log.writeln( 'incompatible-license: ' + repo + '/' + directory + '/' + filename );
          }
        }

        // Now iterate through the license.json entries and see which are missing files
        // This helps to identify stale entries in the license.json files.
        if ( filename === 'license.json' ) {

          var file = grunt.file.read( abspath );
          var json = JSON.parse( file );

          // For each key in the json file, make sure that file exists in the directory
          for ( var key in json ) {
            if ( json.hasOwnProperty( key ) ) {
              var resourceFilename = searchDir + '/' + key;
              var exists = grunt.file.exists( resourceFilename );
              if ( !exists ) {
                grunt.log.writeln( 'missing-file: ' + repo + '/' + directory + '/' + key );
              }
            }
          }
        }
      } );
    }
  };

  var mediaTypes = ChipperConstants.MEDIA_TYPES;
  for ( var i = 0; i < reposByLine.length; i++ ) {
    for ( var k = 0; k < mediaTypes.length; k++ ) {
      reportForDirectory( reposByLine[ i ], mediaTypes[ k ] );
    }
  }
};