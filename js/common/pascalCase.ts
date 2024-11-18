// Copyright 2022-2024, University of Colorado Boulder

import _ from 'lodash';

/**
 * Convert a string to PascalCase
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
export default function pascalCase( string: string ): string {
  return `${_.startCase( _.camelCase( string ) ).split( ' ' ).join( '' )}`;
}