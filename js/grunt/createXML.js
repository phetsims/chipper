// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates a file [sim-name].xml for use by the website when automatically deploying sims
 * and translations.
 *
 * @author Aaron Davis
 * @author Michael Kauzmann
 */

/* jslint node: true */ // allows "process" to pass lint instead of getting an undefined lint error

/**
 * @param grunt the grunt instance
 * @param sim the sim name, defaults to the current directory
 */
module.exports = function( grunt, sim ) {
  'use strict';

  if ( !sim ) {
    var directory = process.cwd();
    var directoryComponents = directory.split( '/' );
    sim = directoryComponents[ directoryComponents.length - 1 ];
  }

  grunt.file.defaultEncoding = 'utf8';

  var rootdir = '../babel/' + sim;
  var englishStringsFile = sim + '-strings_en.json';
  var filenames = [ englishStringsFile ];

  grunt.file.recurse( rootdir, function( abspath, rootdir, subdir, filename ) {
    filenames.push( filename );
  } );

  var getLocaleFromName = function( filename ) {
    var firstUnderscoreIndex = filename.indexOf( '_' );
    var periodIndex = filename.indexOf( '.' );
    return filename.substring( firstUnderscoreIndex + 1, periodIndex );
  };

  // grab the title from sim/package.json
  var packageJSON = grunt.file.readJSON( '../' + sim + '/package.json' );
  var simTitleKey = packageJSON.simTitleStringKey;

  simTitleKey = simTitleKey.split( '/' )[ 1 ];

  // create xml, making a simulation tag for each language
  var finalXML = '<?xml version="1.0" encoding="utf-8" ?>\n' +
                 '<project name="molecules-and-light">\n' +
                 '<simulations>\n';

  for ( var j = 0; j < filenames.length; j++ ) {
    var locale = getLocaleFromName( filenames[ j ] );
    var languageJSON = grunt.file.readJSON( ( locale === 'en' ) ? englishStringsFile : '../babel' + '/' + sim + '/' + filenames[ j ] );

    if ( languageJSON[ simTitleKey ] ) {
      finalXML = finalXML.concat( '<simulation name="' + sim + '" locale="' + locale + '">\n' +
                                  '<title><![CDATA[' + languageJSON[ simTitleKey ].value + ']]></title>\n' +
                                  '</simulation>\n' );
    }
  }

  finalXML = finalXML.concat( '</simulations>\n' + '</project>' );

  grunt.file.write( '../' + sim + '/build/' + sim + '.xml', finalXML );
};