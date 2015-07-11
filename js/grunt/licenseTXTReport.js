// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task iterates over all of the license.txt files and reports any images or audio that have any of the following
 * problems:
 *
 * NOT ANNOTATED (NO FILE): Are missing the license.txt file
 * 3RD PARTY:               Known to be from a source outside of PhET
 * NOT ANNOTATED IN FILE:   There is a license.txt file but the asset is not in there
 * MULTIPLE ANNOTATIONS:    There is a license.txt file but the asset is annotated more than once and hence may have
 *                          conflicts
 *
 * This can be run from any simulation directory with `grunt licenseTXTReport` and it reports for all directories (not
 * just the simulation at hand).
 *
 * Note that this program relies on numerous heuristics for determining the output, such as allowed entries that
 * determine if a file originates from PhET.
 *
 * See https://github.com/phetsims/tasks/issues/274
 *
 * @author Sam Reid
 */
var fs = require( 'fs' );

/**
 * @param grunt the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

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
         abspath.indexOf( '/an-unconventional-weapon/' ) < 0 &&
         abspath.indexOf( '/three.js/' ) < 0 &&
         abspath.indexOf( '/codap/' ) < 0 &&
         abspath.indexOf( 'README.txt' ) < 0 &&

         // The license file doesn't need to annotate itself :)
         filename.indexOf( 'license.txt' ) !== 0
    ) {

      // look in the license.txt file to see if there is an entry for that file
      try {
        var licenseFilename = rootdir + '/' + subdir + '/license.txt';
        var file = fs.readFileSync( licenseFilename, 'utf8' );

        //find the line that annotates the asset
        var lines = file.split( /\r?\n/ );

        // Count how many entries found in case there are conflicting annotations
        var foundEntries = 0;
        for ( var i = 0; i < lines.length; i++ ) {
          var line = lines[ i ];
          if ( line.indexOf( filename ) === 0 ) {
            foundEntries++;

            // Heuristics for whether PhET created the asset
            if (
              line.indexOf( 'source=PhET' ) < 0 &&
              line.indexOf( 'author=PhET' ) < 0 &&
              line.indexOf( 'author=phet' ) < 0 &&
              line.indexOf( 'author=Ron Le Master' ) < 0 &&
              line.indexOf( 'author=Emily Randall' ) < 0 &&
              line.indexOf( 'author=Yuen-ying Carpenter' ) < 0 &&
              line.indexOf( 'author=Bryce' ) < 0
            ) {

              // Report that the item came from a 3rd party
              grunt.log.writeln( '3RD PARTY: \t\t\t\t\t' + abspath + ': ' + line );
            }
          }
        }
        if ( foundEntries !== 1 ) {
          if ( foundEntries === 0 ) {
            grunt.log.writeln( 'NOT ANNOTATED IN FILE:\t\t' + abspath );
          }
          else {
            grunt.log.writeln( 'MULTIPLE ANNOTATIONS:\t\t' + abspath );
          }

        }
      }
      catch( err ) {
        grunt.log.writeln( 'NOT ANNOTATED (NO FILE):\t' + abspath );
      }

    }
  } );
};