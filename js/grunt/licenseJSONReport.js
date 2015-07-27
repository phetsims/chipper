// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task iterates over all of the license.json files and reports any images or audio that have any of the following
 * problems:
 *
 * NOT ANNOTATED (NO FILE): Are missing the license.json file
 * 3RD PARTY:               Known to be from a source outside of PhET
 * NOT ANNOTATED IN FILE:   There is a license.json file but the asset is not in there
 * MULTIPLE ANNOTATIONS:    There is a license.json file but the asset is annotated more than once and hence may have
 *                          conflicts
 *
 * This can be run from any simulation directory with `grunt licenseJSONReport` and it reports for all directories (not
 * just the simulation at hand).
 *
 * Note that this program relies on numerous heuristics for determining the output, such as allowed entries that
 * determine if a file originates from PhET.
 *
 * See https://github.com/phetsims/tasks/issues/274
 *
 * @author Sam Reid
 */

/**
 * @param grunt the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  var getLicenseInfo = require( '../../../chipper/js/grunt/getLicenseInfo' );

  /* jslint node: true */
  // allows "process" to pass lint instead of getting an undefined lint error
  var directory = process.cwd();

  // Start in the github checkout dir (above one of the sibling directories)
  var rootdir = directory + '/../';

  // Iterate over all images and audio directories recursively
  grunt.file.recurse( rootdir, function( abspath, rootdir, subdir, filename ) {
    if ( subdir &&

         // Images and audio files
         (abspath.indexOf( '/images/' ) >= 0 ||
          abspath.indexOf( '/audio/' ) >= 0 ) &&

         // Skip things we don't need to report on that may also be in the working copy
         abspath.indexOf( '/node_modules/' ) < 0 &&
         abspath.indexOf( '/codap-data-interactives/' ) < 0 &&
         abspath.indexOf( '/an-unconventional-weapon/' ) < 0 && // SR's Ludum Dare entry
         abspath.indexOf( '/three.js/' ) < 0 &&
         abspath.indexOf( '/codap/' ) < 0 &&
         abspath.indexOf( 'README.txt' ) < 0 &&

         // The license file doesn't need to annotate itself :)
         filename.indexOf( 'license.json' ) !== 0
    ) {
      var result = getLicenseInfo( abspath, abspath );
      if ( result.isProblematic === true ) {
        grunt.log.warn( abspath + ': ' + result.classification );
      }
    }
  } );
};