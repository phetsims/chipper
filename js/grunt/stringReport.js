// Copyright 2002-2015, University of Colorado Boulder

/* jshint -W079 */
var _ = require( '../../../sherpa/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

/**
 * After doing a build, reports on which strings are missing for each locale that was built.
 * @param grunt
 * @param {string} repositoryName
 * @param {string} fallbackLocale
 */
module.exports = function( grunt, repositoryName, fallbackLocale ) {
  'use strict';

  var stringMap = grunt.file.readJSON( 'build/' + repositoryName + '_string-map.json' );
  var fallbackStrings = stringMap[ fallbackLocale ];

  // for each locale, report what is missing
  for ( var locale in stringMap ) {
    if ( stringMap.hasOwnProperty( locale ) && locale !== fallbackLocale ) {
      var strings = stringMap[ locale ];
      var missing = _.omit( fallbackStrings, _.keys( strings ) );
      console.log( locale, 'missing\n', JSON.stringify( missing, null, '\t' ) );
    }
  }
};
