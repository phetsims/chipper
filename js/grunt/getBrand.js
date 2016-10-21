// Copyright 2016, University of Colorado Boulder

/**
 * Gets the brand identifier.
 *
 * @param {Object} grunt - the grunt instance
 * @param {Object} buildLocalJSON - build-local.json
 * @returns {string}
 */
module.exports = function( grunt, buildLocalJSON ) {
  'use strict';

  var assert = require( 'assert' );

  var brand = grunt.option( 'brand' ) || buildLocalJSON.brand || 'adapted-from-phet';
  assert( grunt.file.exists( '../brand/' + brand ), 'no such brand: ' + brand );
  return brand;
};