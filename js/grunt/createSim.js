// Copyright 2014-2015, University of Colorado Boulder

/**
 * This grunt task creates a simulation based on the simula-rasa template.
 * Run from any repository directory that is a sibling of simula-rasa.
 *
 * Example usage:
 * grunt create-sim --name=cannon-blaster --author="Sam Reid (PhET Interactive Simulations)"
 *
 * This task will attempt to coerce a sim title from the repository name. For example,
 * 'cannon-blaster' becomes 'Cannon Blaster'.  If this is not suitable, then use --title
 * to specify a title.  For example:
 * grunt create-sim --name=fractions-basics --title="Fractions: Basics" --author="Sam Reid (PhET Interactive Simulations)"
 *
 * For development and debugging, add --clean=true to delete the repository directory.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

var assert = require( 'assert' );
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

/**
 * @param grunt the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  // Coerces a repository name to a sim title. Eg, 'simula-rasa' -> 'Simula Rasa'
  function toTitle( input ) {
    var tmpString = input.replace( /-(.)/g, function( match, group1 ) {
      return ' ' + group1.toUpperCase();
    } );
    return tmpString.substring( 0, 1 ).toUpperCase() + tmpString.substring( 1 );
  }

  // grunt options
  var repositoryName = grunt.option( 'name' );
  assert( repositoryName, 'missing required option: name (the new repository name)' );
  var author = grunt.option( 'author' );
  assert( author, 'missing required option: author' );
  var title = grunt.option( 'title' ) || toTitle( repositoryName );
  var clean = !!grunt.option( 'clean' ); // {boolean}

  // Check for required parameters
  if ( typeof( repositoryName ) === 'undefined' ) {
    throw new Error( 'repositoryName unspecified, use --name=...' );
  }
  if ( typeof( author ) === 'undefined' ) {
    throw new Error( 'Author unspecified, use --author=...' );
  }

  grunt.log.writeln( 'Greetings ' + author + '!' );
  grunt.log.writeln( 'creating sim with repository name ' + repositoryName );

  // initialize the directory
  var destinationPath = '../' + repositoryName;
  if ( grunt.file.exists( destinationPath ) ) {
    if ( clean ) {
      grunt.log.writeln( 'Cleaning ' + destinationPath );
      grunt.file.delete( destinationPath, { force: true } ); // delete won't operate outside of current working dir unless forced
    }
    else {
      grunt.log.writeln( 'WARNING:' + destinationPath + ' already exists, overwriting' );
    }
  }
  grunt.file.mkdir( destinationPath );

  // Create variations of the repository name
  var configPath = ChipperStringUtils.replaceAll( repositoryName.toUpperCase(), '-', '_' ); // eg, 'simula-rasa' -> 'SIMULA_RASA'
  var lowerCamelCase = ChipperStringUtils.toCamelCase( repositoryName ); // eg, 'simula-rasa' -> 'simulaRasa'
  var upperCamelCase = lowerCamelCase.substring( 0, 1 ).toUpperCase() + lowerCamelCase.substring( 1 ); // eg, 'simula-rasa' -> 'SimulaRasa'

  // Iterate over the file system and copy files, changing filenames and contents as we go.
  grunt.file.recurse( '../simula-rasa', function( abspath, rootdir, subdir, filename ) {

      // skip these files
      if ( abspath.indexOf( '../simula-rasa/README.md' ) === 0 ||
           abspath.indexOf( '../simula-rasa/node_modules/' ) === 0 ||
           abspath.indexOf( '../simula-rasa/.git/' ) === 0 ||
           abspath.indexOf( '../simula-rasa/build/' ) === 0 ) {

        // do nothing
      }
      else {
        var contents = grunt.file.read( abspath );

        // Replace variations of the repository name
        contents = ChipperStringUtils.replaceAll( contents, 'simula-rasa', repositoryName );
        contents = ChipperStringUtils.replaceAll( contents, 'SIMULA_RASA', configPath );
        contents = ChipperStringUtils.replaceAll( contents, 'simulaRasa', lowerCamelCase );
        contents = ChipperStringUtils.replaceAll( contents, 'SimulaRasa', upperCamelCase );

        // Replace the title
        contents = ChipperStringUtils.replaceAll( contents, '$TITLE$', title );

        // Replace author
        contents = ChipperStringUtils.replaceAll( contents, '$AUTHOR$', author );

        // Replace names in the path where the contents will be written
        var contentsPath = subdir ? ( destinationPath + '/' + subdir + '/' + filename ) : ( destinationPath + '/' + filename );
        contentsPath = ChipperStringUtils.replaceFirst( contentsPath, 'simula-rasa', repositoryName );
        contentsPath = ChipperStringUtils.replaceFirst( contentsPath, 'simulaRasa', lowerCamelCase );
        contentsPath = ChipperStringUtils.replaceFirst( contentsPath, 'SimulaRasa', upperCamelCase );

        // Write the file
        grunt.file.write( contentsPath, contents );
        grunt.log.writeln( 'wrote', contentsPath );
      }
    }
  );

  grunt.log.writeln( 'Please generate README.md for your new repository by running "grunt generate-unpublished-README"' );
};