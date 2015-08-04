// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task iterates over all of the license.json files and reports any images or audio that have any of the following
 * problems:
 *
 * missing-license.json    The resource file has no associated license.json file
 * incompatible-license    Known to be from an unapproved source outside of PhET
 * not-annotated           There is a license.json file but the asset is not in there
 * missing-file            There is an entry in the license.json but no corresponding file
 *
 * This can be run from any simulation directory with `grunt create-image-and-audio-license-report` and it reports for
 * all directories (not just the simulation at hand).
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
  // The following comment permits node-specific globals (such as process.cwd()) to pass jshint
  /* jslint node: true */
  'use strict';

  var getLicenseInfo = require( '../../../chipper/js/grunt/getLicenseInfo' );

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
         abspath.indexOf( 'README.md' ) < 0 &&

         // The license file doesn't need to annotate itself :)
         filename.indexOf( 'license.json' ) !== 0
    ) {
      var result = getLicenseInfo( abspath, abspath );
      if ( result.isProblematic === true ) {
        grunt.log.writeln( 'incompatible-license: ' + subdir + '/' + filename );
      }
    }

    if ( filename === 'license.json' ) {
      var file = global.fs.readFileSync( abspath, 'utf8' );
      var json = JSON.parse( file );

      // For each key in the json file, make sure that file exists in the directory
      for ( var key in json ) {
        if ( json.hasOwnProperty( key ) ) {
          var resourceFilename = rootdir + '/' + subdir + '/' + key;
          var exists = global.fs.existsSync( resourceFilename );
          if ( !exists ) {
            grunt.log.writeln( 'missing-file: ' + subdir + '/' + key );
          }
        }
      }
    }
  } );
};