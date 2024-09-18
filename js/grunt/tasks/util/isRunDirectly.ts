// Copyright 2024, University of Colorado Boulder
/**
 * Determines if the current module is the entry point (i.e., run directly). Tasks are mean to be invoked from the command line
 * but a subset of tasks can be launched from another task. In that case, they need to be await-able and invokable.
 *
 * @returns True if the script is run directly, false otherwise.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import path from 'path';
import { pathToFileURL } from 'url';

function isRunDirectly(): boolean {
  const scriptPath = path.resolve( process.argv[ 1 ] );
  const scriptUrl = pathToFileURL( scriptPath ).href;

  // @ts-expect-error
  return import.meta.url === scriptUrl;
}

export default isRunDirectly;