//  Copyright 2002-2014, University of Colorado Boulder

/**
 * This grunt task creates a simulation based on the simula-rasa template.
 * It is intended to be run from the root level of the simula-rasa directory.
 *
 * Example usage:
 * grunt create-sim --name=cannon-blaster --author="Sam Reid (PhET Interactive Simulations)"
 * or to force overwrite of existing files:
 * grunt create-sim --name=cannon-blaster --author="Sam Reid (PhET Interactive Simulations)" --overwrite=true
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

var fs = require( 'fs' );

/**
 * @param grunt the grunt instance
 * @param {string} repositoryName the repository name.  All lower case and hyphenated, like circuit-construction-kit
 * @param {string} author the new author for the project
 * @param {boolean|undefined} [overwrite] whether existing files should be overwritten
 */
module.exports = function( grunt, repositoryName, author, overwrite ) {
  'use strict';

  // Check for required parameters
  if ( typeof( repositoryName ) === 'undefined' ) {
    throw new Error( 'repositoryName unspecified, use --name=...' );
  }
  if ( typeof( author ) === 'undefined' ) {
    throw new Error( 'Author unspecified, use --author=...' );
  }

  console.log( 'Greetings, ' + author + '!' );
  console.log( 'creating sim with repositoryName', repositoryName );

  // Overwrite only if specified to do so.
  var destinationPath = '../' + repositoryName;
  if ( !overwrite && fs.existsSync( destinationPath ) ) {
     throw new Error( destinationPath + ' already exists. Use --overwrite=true to overwrite.' );
  }

  // Create the directory, if it didn't exist
  grunt.file.mkdir( destinationPath );

  // Replace a single occurrence in a string (if any) with another.
  var replaceOneString = function( str, substring, replacement ) {
    var idx = str.indexOf( substring );
    if ( str.indexOf( substring ) !== -1 ) {
      return str.slice( 0, idx ) + replacement + str.slice( idx + substring.length );
    }
    else {
      return str;
    }
  };

  // Replace all occurrences of a string recursively
  var replaceAllString = function( str, substring, replacement ) {
    var replaced = replaceOneString( str, substring, replacement );
    if ( replaced === str ) {
      return replaced;
    }
    else {
      return replaceAllString( replaced, substring, replacement );
    }
  };

  // See http://stackoverflow.com/questions/10425287/convert-string-to-camelcase-with-regular-expression
  // Eg: 'simula-rasa' -> 'simulaRasa'
  function toCamelCase( input ) {
    return input.toLowerCase().replace( /-(.)/g, function( match, group1 ) {
      return group1.toUpperCase();
    } );
  }

  // Eg, 'simula-rasa' -> 'Simula Rasa'
  function toHumanReadable( input ) {
    var tmpString = input.replace( /-(.)/g, function( match, group1 ) {
      return ' ' + group1.toUpperCase();
    } );
    return tmpString.substring( 0, 1 ).toUpperCase() + tmpString.substring( 1 );
  }

  // Create variations of the repository name
  var configPath = replaceAllString( repositoryName.toUpperCase(), '-', '_' ); // eg, 'simula-rasa' -> 'SIMULA_RASA'
  var lowerCamelCase = toCamelCase( repositoryName ); // eg, 'simula-rasa' -> 'simulaRasa'
  var upperCamelCase = lowerCamelCase.substring( 0, 1 ).toUpperCase() + lowerCamelCase.substring( 1 ); // eg, 'simula-rasa' -> 'SimulaRasa'
  var humanReadable = toHumanReadable( repositoryName ); // eg, 'simula-rasa' -> 'Simula Rasa'

  //Iterate over the file system and copy files, changing filenames and contents as we go.
  grunt.file.recurse( '../simula-rasa', function( abspath, rootdir, subdir, filename ) {
      if ( abspath.indexOf( '../simula-rasa/node_modules/' ) === 0 ||
           abspath.indexOf( '../simula-rasa/.git/' ) === 0 ||
           abspath.indexOf( '../simula-rasa/build/' ) === 0 ) {
      }
      else {
        var contents = grunt.file.read( abspath );

        //Clean the README
        contents = replaceAllString( contents, 'To create a sim based on this template, clone this and the other PhET libraries as described in the PhET Development Overview at http://bit.ly/phet-development-overview then run:', '' );
        contents = replaceAllString( contents, 'cd simula-rasa', '' );
        contents = replaceAllString( contents, 'npm install', '' );
        contents = replaceAllString( contents, 'grunt create-sim --name=project-name --author="Your Name (Your Affiliation)"', '' );
        contents = replaceAllString( contents, '```', '' );

        //Replace the sim names
        contents = replaceAllString( contents, 'simula-rasa', repositoryName );
        contents = replaceAllString( contents, 'SIMULA_RASA', configPath );
        contents = replaceAllString( contents, 'SimulaRasa', upperCamelCase );
        contents = replaceAllString( contents, 'simulaRasa', lowerCamelCase );
        contents = replaceAllString( contents, 'Simula Rasa', humanReadable );

        contents = replaceOneString( contents, 'PhET Simulation Template.  "Simula rasa" is Latin for "blank sim".',
          humanReadable + ' by ' + author + ', using libraries from PhET Interactive Simulations at the University of Colorado Boulder (please see http://bit.ly/phet-development-overview for more). Readme file automatically created by https://github.com/phetsims/chipper' );
        contents = replaceAllString( contents, 'Your Name (Your Affiliation)', author );
        var subdirPath = subdir || '';
        var destPath = destinationPath + '/' + subdirPath + '/' + filename;

        //Fix the dest path name
        destPath = replaceOneString( destPath, 'SimulaRasa', upperCamelCase );
        destPath = replaceOneString( destPath, 'simula-rasa', repositoryName );
        if ( !fs.existsSync( destPath ) || overwrite ) {
          grunt.file.write( destPath, contents );
          console.log( 'wrote', destPath );
        }
        else {
          console.log( 'file already existed: ' + destPath + '.  Aborting.' );
        }
      }
    }
  );
};