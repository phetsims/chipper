// Copyright 2017-2021, University of Colorado Boulder

/**
 * Returns the string key for the title of a runnable.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import grunt from './grunt.ts';

/**
 * Returns the string key for the title of a runnable.
 * @public
 *
 * @param {string} repo
 */
export default function getPhetLibs( repo ) {
  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );

  return `${packageObject.phet.requirejsNamespace}/${repo}.title`;
};
