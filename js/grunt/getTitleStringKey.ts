// Copyright 2017-2024, University of Colorado Boulder

/**
 * Returns the string key for the title of a runnable.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import { readFileSync } from 'fs';

/**
 * Returns the string key for the title of a runnable.
 */
export default function getTitleStringKey( repo:string ): string {
  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );

  return `${packageObject.phet.requirejsNamespace}/${repo}.title`;
}