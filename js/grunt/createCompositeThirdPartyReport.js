/**
 * Given the simulation-specific reports created by createSimSpecificThirdPartyReport, aggregate them and provide a
 * complete report, indicating which third-party resources are used by which simulations.
 *
 * @author Sam Reid
 */
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
};