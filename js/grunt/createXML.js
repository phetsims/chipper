/*
 * TODO: clean up this file
 */
module.exports = function( grunt, sim ) {
  'use strict';

  grunt.file.defaultEncoding = 'utf8';

  var rootdir = "../babel/" + sim;
  var filenames = [];
  grunt.file.recurse( rootdir, function( abspath, rootdir, subdir, filename ) {
    filenames.push( filename );
  } );

  // getting individual language abbrevations for sim
  // for(var i = 0; i< filenames.length; i++){
  //   var filename = filenames[i];
  //   var firstUnderscoreIndex = filename.indexOf("_");
  //   var periodIndex= filename.indexOf(".");
  //   var language = filename.substring(firstUnderscoreIndex + 1, periodIndex);
  //   //console.log(language);
  // }

  // grab the title from sim/package.json
  var packageJSON = grunt.file.readJSON( '../' + sim + '/package.json' );
  var simTitleKey = packageJSON.simTitleStringKey;

  simTitleKey = simTitleKey.split( "/" )[ 1 ];

  console.log( simTitleKey );

  //create xml making a simulation tag for each language
  var finalXML = '<?xml version="1.0" encoding="utf-8" ?>\n' +
                 '<project name="molecules-and-light">\n' +
                 '<simulations>\n';

  for ( var j = 0; j < filenames.length; j++ ) {
    var languageJSON = grunt.file.readJSON( '../babel' + '/' + sim + '/' + filenames[ j ] );

    if ( languageJSON[ simTitleKey ] ) {
      finalXML = finalXML.concat( '<simulation name="' + sim + '" locale="en">\n' +
                                  '<title><![CDATA[' + languageJSON[ simTitleKey ].value + ']]></title>\n' +
                                  '</simulation>\n' );
    }
  }

  finalXML = finalXML.concat( '</simulations>\n' + '</project>' );

  console.log( finalXML );
};