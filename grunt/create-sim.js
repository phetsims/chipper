//  Copyright 2002-2014, University of Colorado Boulder
var assert = require( 'assert' );

/**
 * Create a simulation based on the simula-rasa template
 *
 * Example usage:
 * grunt create-sim --name=cannon-blaster --author="Sam Reid (PhET Interactive Simulations)"
 * or to force overwrite of existing files:
 * grunt create-sim --name=cannon-blaster --author="Sam Reid (PhET Interactive Simulations)" --overwrite=true
 *
 * @param {Grunt} grunt the grunt instance
 * @param {String} projectName the name of the project.  All lower case and hyphenated, like circuit-construction-kit
 * @param {String} author the new author for the project
 * @param {Boolean|undefined} overwrite whether existing files should be overwritten
 * @author Sam Reid (PhET Interactive Simulations)
 */
module.exports = function( grunt, projectName, author, overwrite ) {
  'use strict';

  if ( typeof(projectName) === 'undefined' ) {
    throw new Error( 'projectName unspecified, use --name=...' );
  }
  if ( typeof(author) === 'undefined' ) {
    throw new Error( 'Author unspecified, use --author=...' );
  }
  console.log( 'Greetings, ' + author + '!' );
  console.log( 'creating sim with projectName', projectName );

  //create the directory, if it didn't exist
  var destinationPath = '../' + projectName;
  grunt.file.mkdir( destinationPath );

  //Replace a single occurrence in a string (if any) with another.
  //Note: this was copied from Gruntfile.js
  var replaceOneString = function( str, substring, replacement ) {
    var idx = str.indexOf( substring );
    if ( str.indexOf( substring ) !== -1 ) {
      return str.slice( 0, idx ) + replacement + str.slice( idx + substring.length );
    }
    else {
      return str;
    }
  };

  //Replace all occurrences of a string recursively
  var replaceAllString = function( str, substring, replacement ) {
    var replaced = replaceOneString( str, substring, replacement );
    if ( replaced === str ) {
      return replaced;
    }
    else {
      return replaceAllString( replaced, substring, replacement );
    }
  };

  //See http://stackoverflow.com/questions/10425287/convert-string-to-camelcase-with-regular-expression
  function toCamelCase( input ) {
    return input.toLowerCase().replace( /-(.)/g, function( match, group1 ) {
      return group1.toUpperCase();
    } );
  }

  function toHumanReadable( input ) {
    return input.replace( /-(.)/g, function( match, group1 ) {
      return ' ' + group1.toUpperCase();
    } );
  }

  //Create the various renamings of the project for replacement
  var UPPER_CASE = replaceAllString( projectName.toUpperCase(), '-', '_' );
  var camelCase = toCamelCase( projectName );
  var UpperCamelCase = camelCase.substring( 0, 1 ).toUpperCase() + camelCase.substring( 1 );
  var humanReadable = toHumanReadable( projectName );
  var HumanReadable = humanReadable.substring( 0, 1 ).toUpperCase() + humanReadable.substring( 1 );

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
        contents = replaceAllString( contents, 'grunt create-sim --name=project-name --author="Your Name (Your Affiliation)', '' );
        contents = replaceAllString( contents, '```', '' );

        //Replace the sim names
        contents = replaceAllString( contents, 'simula-rasa', projectName );
        contents = replaceAllString( contents, 'SIMULA_RASA', UPPER_CASE );
        contents = replaceAllString( contents, 'SimulaRasa', UpperCamelCase );
        contents = replaceAllString( contents, 'simulaRasa', camelCase );
        contents = replaceAllString( contents, 'Simula Rasa', HumanReadable );

        contents = replaceOneString( contents, 'PhET Simulation Template.  "Simula rasa" is Latin for "blank sim".',
            HumanReadable + ' by ' + author + ', using libraries from PhET Interactive Simulations at the University of Colorado Boulder (please see http://bit.ly/phet-development-overview for more). Readme file automatically created by https://github.com/phetsims/chipper' );
        contents = replaceAllString( contents, 'Your Name (Your Affiliation)', author );
        var subdirPath = subdir || '';
        var destPath = destinationPath + '/' + subdirPath + '/' + filename;

        //Fix the dest path name
        destPath = replaceOneString( destPath, 'SimulaRasa', UpperCamelCase );
        destPath = replaceOneString( destPath, 'simula-rasa', projectName );
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