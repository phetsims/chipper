// Copyright 2025, University of Colorado Boulder

/**
 * Returns true if a key is an accessibility string key. Often used to skip tests or other features where accessibility strings
 * are not supported yet.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

export default function isA11yStringKey( key: string ): boolean {
  return key.includes( '/a11y.' );
}