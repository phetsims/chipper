// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task make sure license.json entries match directory contents, so that there are
 * no orphaned json entries and no orphaned files, see https://github.com/phetsims/chipper/issues/185
 *
 * @author Sam Reid
 */

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
    if ( filename === 'license.json' ) {
      var file = global.fs.readFileSync( abspath, 'utf8' );
      var json = JSON.parse( file );

      // For each key in the json file, make sure that file exists in the directory
      for ( var key in json ) {
        if ( json.hasOwnProperty( key ) ) {
          var resourceFilename = rootdir + '/' + subdir + '/' + key;
          var exists = global.fs.existsSync( resourceFilename );
          if ( !exists ) {
            console.log( 'Entry in JSON has no file: ' + resourceFilename );
          }
        }
      }

      // For each file in the directory, make sure it appears in license.json
      var directoryContents = global.fs.readdirSync( rootdir + '/' + subdir );
      for ( var i = 0; i < directoryContents.length; i++ ) {
        var listedFile = directoryContents[ i ];
        if ( listedFile !== 'license.json' &&
             listedFile !== 'README.txt' && !json.hasOwnProperty( listedFile ) ) {
          console.log( 'File is missing entry in license.json, ' + rootdir + '/' + subdir + '/' + listedFile );
        }
      }
    }
  } );
};