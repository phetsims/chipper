// Copyright 2022-2024, University of Colorado Boulder

const _ = require( 'lodash' );

/**
 * Convert a string to PascalCase
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
module.exports = function pascalCase( string ) {
  return `${_.startCase( _.camelCase( string ) ).split( ' ' ).join( '' )}`;
};