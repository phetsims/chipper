// Copyright 2017-2021, University of Colorado Boulder

/**
 * Returns the string key for the title of a runnable.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */


const grunt = require( 'grunt' );

/**
 * Returns the string key for the title of a runnable.
 * @public
 *
 * @param {string} repo
 */
module.exports = function getPhetLibs( repo ) {
  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );

  return `${packageObject.phet.requirejsNamespace}/${repo}.title`;
};
