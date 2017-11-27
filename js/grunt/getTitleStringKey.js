// Copyright 2017, University of Colorado Boulder

/**
 * Returns the string key for the title of a runnable.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

/**
 * Returns the string key for the title of a runnable.
 * @public
 *
 * @param {Object} grunt
 * @param {string} repo
 */
module.exports = function getPhetLibs( grunt, repo ) {
  const packageObject = grunt.file.readJSON( '../' + repo + '/package.json' );

  return packageObject.phet.requirejsNamespace + '/' + repo + '.title';
};
