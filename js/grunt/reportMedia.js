// Copyright 2015, University of Colorado Boulder

/**
 * This grunt task iterates over all of the license.json files and reports any media files (images, sound, ...)
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

'use strict';

// TODO: File not brought up to es6+ standards
const ChipperConstants = require( '../common/ChipperConstants' );
const getLicenseEntry = require( '../common/getLicenseEntry' );
const getPhetLibs = require( '../grunt/getPhetLibs' );
const grunt = require( 'grunt' );
const path = require( 'path' );

/**
 * @param {string} repo
 */
module.exports = async ( repo ) => {

  // Check for the dependencies of the target repo
  const dependencies = getPhetLibs( repo );

  // Start in the github checkout dir (above one of the sibling directories)
  const directory = process.cwd();
  const rootdir = directory + '/../';

  // Determines if our report was successful.
  let success = true;

  // Create a fast report based on the license.json files for the specified repository and directory (images or sound)
  for ( const repo of dependencies ) {

    // Check if the repo is missing from the directory
    if ( !grunt.file.exists( rootdir + repo ) ) {

      if ( repo.indexOf( 'phet-io' ) === 0 ) {
        console.log( 'skipping repo (not checked out): ' + repo );
        success = true;
        continue;
      }
      else {
        console.log( 'missing repo: ' + repo );
        success = false;
        continue;
      }
    }
    for ( const directory of ChipperConstants.MEDIA_TYPES ) {
      const searchDir = rootdir + repo + '/' + directory;

      // Projects don't necessarily have all media directories
      if ( grunt.file.exists( searchDir ) ) {

        // Iterate over all media directories, such as images and sounds recursively
        grunt.file.recurse( searchDir, function( abspath, rootdir, subdir, filename ) {

          // Some files don't need to be attributed in the license.json
          if ( abspath.indexOf( 'README.md' ) < 0 &&
               filename.indexOf( 'license.json' ) !== 0 ) {

            // Classify the resource
            const result = getLicenseEntry( abspath );

            if ( !result ) {
              grunt.log.error( 'not-annotated: ' + repo + '/' + directory + '/' + filename );
              success = false;
            }
            // Report if it is a problem
            else if ( result.isProblematic === true ) {
              grunt.log.error( 'incompatible-license: ' + repo + '/' + directory + '/' + filename );
              success = false;
            }
          }

          // Now iterate through the license.json entries and see which are missing files
          // This helps to identify stale entries in the license.json files.
          if ( filename === 'license.json' ) {

            const file = grunt.file.read( abspath );
            const json = JSON.parse( file );

            // For each key in the json file, make sure that file exists in the directory
            for ( const key in json ) {
              if ( json.hasOwnProperty( key ) ) {

                // Checks for files in directory and subdirectory
                const resourceFilename = path.dirname( abspath ) + '/' + key;
                const exists = grunt.file.exists( resourceFilename );

                if ( !exists ) {
                  grunt.log.error( 'missing-file: ' + repo + '/' + directory + '/' + key );
                  success = false;
                }
              }
            }
          }
        } );
      }
    }
  }

  if ( !success ) {
    grunt.fail.fatal( 'There is an issue with the licenses for media types.' );
  }
};