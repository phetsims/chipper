// Copyright 2017, University of Colorado Boulder

/**
 * Gets the set of locales to be built.
 *
 * Uses the grunt options --locales and --localesRepo
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const ChipperConstants = require( '../common/ChipperConstants' );
const getLocalesFromRepository = require( './getLocalesFromRepository' );

/**
 * Gets the set of locales to be built.
 *
 * The grunt options are:
 *
 * --locales=* : all locales from the repo's strings/ directory
 * --locales=fr : French
 * --locales=ar,fr,es : Arabic, French and Spanish (comma-separated locales)
 * --localesRepo=beers-law-lab: all locales from another repository's strings/ directory, ignored if --locales is specified
 *
 * @param {Object} grunt - the grunt instance
 * @param {string} repo
 */
module.exports = function( grunt, repo ) {

  var locales = [ ChipperConstants.FALLBACK_LOCALE ];
  var localesValue = grunt.option( 'locales' );

  if ( localesValue ) {
    if ( localesValue === '*' ) {
      locales = locales.concat( getLocalesFromRepository( grunt, repo ) ); // all locales for the repository that we're building
    }
    else {
      // use only the specified locales, which may not include the fallback
      locales = localesValue.split( ',' );
    }
  }
  else {
    var localesRepo = grunt.option( 'localesRepo' );
    if ( localesRepo ) {
      locales = locales.concat( getLocalesFromRepository( grunt, localesRepo ) ); // all locales for some other repository
    }
  }

  return _.uniq( locales.sort() );
};
