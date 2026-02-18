// Copyright 2017-2026, University of Colorado Boulder

/**
 * Returns the string key for the title of a runnable.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import { readFileSync } from 'fs';

/**
 * Returns the string key for the title of a runnable.
 */
export default function getTitleStringKey( repo:string ): string {
  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );

  return `${packageObject.phet.requirejsNamespace}/${repo}.title`;
}