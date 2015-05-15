// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task reports on which strings are missing for each locale.
 * It's intended to be run after a build.
 */

/* jshint -W079 */
var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

/**
 * @param grunt the grunt instance
 * @param {string} repositoryName name field from package.json
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
      grunt.log.writeln( locale, 'missing\n', JSON.stringify( missing, null, '\t' ) );
    }
  }
};
