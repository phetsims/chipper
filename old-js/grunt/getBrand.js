// Copyright 2016, University of Colorado Boulder

/**
 * Gets the brand identifier.
 *
 * @param {Object} grunt - the grunt instance
 * @param {Object} buildLocalJSON - build-local.json
 * @returns {string}
 */
/* eslint-env node */
'use strict';

module.exports = function( grunt, buildLocalJSON ) {

  var assert = require( 'assert' );

  var brand = grunt.option( 'brand' ) || buildLocalJSON.brand || 'adapted-from-phet';
  assert( grunt.file.exists( '../brand/' + brand ), 'no such brand: ' + brand );
  return brand;
};