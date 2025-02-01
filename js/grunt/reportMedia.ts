// Copyright 2015-2025, University of Colorado Boulder

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
 * @author Sam Reid (PhET Interactive Simulations)
 */

import path from 'path';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';
import ChipperConstants from '../common/ChipperConstants.js';
import getLicenseEntry from '../common/getLicenseEntry.js';
import getPhetLibs from '../grunt/getPhetLibs.js';

export default async ( repo: string ): Promise<boolean> => {

  // Check for the dependencies of the target repo
  const dependencies = getPhetLibs( repo );

  // Start in the github checkout dir (above one of the sibling directories)
  const directory = process.cwd();
  const rootdir = `${directory}/../`;

  // Determines if our report was successful.
  let success = true;

  // Create a fast report based on the license.json files for the specified repository and directory (images or sound)
  for ( const repo of dependencies ) {

    // Check if the repo is missing from the directory
    if ( !grunt.file.exists( rootdir + repo ) ) {

      if ( repo.startsWith( 'phet-io' ) || repo === 'studio' ) {
        console.log( `skipping repo (not checked out): ${repo}` );
        success = true;
        continue;
      }
      else {
        console.log( `missing repo: ${repo}` );
        success = false;
        continue;
      }
    }
    for ( const directory of ChipperConstants.MEDIA_TYPES ) {
      const searchDir = `${rootdir + repo}/${directory}`;

      // Projects don't necessarily have all media directories
      if ( grunt.file.exists( searchDir ) ) {

        // Iterate over all media directories, such as images and sounds recursively
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        grunt.file.recurse( searchDir, ( abspath, rootdir, subdir, filename ) => {

          if ( filename.endsWith( '.js' ) || filename.endsWith( '.ts' ) ) {
            return; // modulified data doesn't need to be checked
          }

          // Some files don't need to be attributed in the license.json
          if ( !abspath.includes( 'README.md' ) &&
               !filename.startsWith( 'license.json' ) ) {

            // Classify the resource
            const result = getLicenseEntry( abspath );

            if ( !result ) {
              grunt.log.error( `not-annotated: ${abspath}` );
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
                const resourceFilename = `${path.dirname( abspath )}/${key}`;
                const exists = grunt.file.exists( resourceFilename );

                if ( !exists ) {
                  grunt.log.error( `missing-file: ${repo}/${directory}/${key}` );
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
    throw new Error( 'There is an issue with the licenses for media types.' );
  }

  return success;
};