// Copyright 2022-2025, University of Colorado Boulder

/**
 * Convert a string to PascalCase
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import _ from 'lodash';

export default function pascalCase( string: string ): string {
  return `${_.startCase( _.camelCase( string ) ).split( ' ' ).join( '' )}`;
}