// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates a file [sim-name].xml for use by the website when automatically deploying sims
 * and translations.
 *
 * @author Aaron Davis
 * @author Michael Kauzmann
 */

/**
 * @param grunt the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  /* jslint node: true */
  // allows "process" to pass lint instead of getting an undefined lint error
  var directory = process.cwd();
  var directoryComponents = directory.split( '/' );
  var sim = directoryComponents[ directoryComponents.length - 1 ];

  grunt.file.defaultEncoding = 'utf8';

  var rootdir = '../babel/' + sim;
  var englishStringsFile = sim + '-strings_en.json';
  var stringFiles = [ { name: englishStringsFile, locale: 'en' } ];

  grunt.file.recurse( rootdir, function( abspath, rootdir, subdir, filename ) {
    var firstUnderscoreIndex = filename.indexOf( '_' );
    var periodIndex = filename.indexOf( '.' );
    var locale = filename.substring( firstUnderscoreIndex + 1, periodIndex );
    stringFiles.push( { name: filename, locale: locale } );
  } );

  // grab the title from sim/package.json
  var packageJSON = grunt.file.readJSON( '../' + sim + '/package.json' );
  var simTitleKey = packageJSON.simTitleStringKey;

  simTitleKey = simTitleKey.split( '/' )[ 1 ];

  // create xml, making a simulation tag for each language
  var finalXML = '<?xml version="1.0" encoding="utf-8" ?>\n' +
                 '<project name="' + sim + '">\n' +
                 '<simulations>\n';

  for ( var j = 0; j < stringFiles.length; j++ ) {
    var stringFile = stringFiles[ j ];
    var languageJSON = grunt.file.readJSON( ( stringFile.locale === 'en' ) ? englishStringsFile : '../babel' + '/' + sim + '/' + stringFile.name );

    if ( languageJSON[ simTitleKey ] ) {
      finalXML = finalXML.concat( '<simulation name="' + sim + '" locale="' + stringFile.locale + '">\n' +
                                  '<title><![CDATA[' + languageJSON[ simTitleKey ].value + ']]></title>\n' +
                                  '</simulation>\n' );
    }
  }

  finalXML = finalXML.concat( '</simulations>\n' + '</project>' );

  grunt.file.write( '../' + sim + '/build/' + sim + '.xml', finalXML );
};