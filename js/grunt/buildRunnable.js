// Copyright 2017, University of Colorado Boulder

/**
 * Builds a runnable (something that builds like a simulation)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

// modules
const minify = require( './minify' );
const requireBuild = require( './requireBuild' );

module.exports = async function( grunt, uglify, mangle ) {
  const packageObject = grunt.file.readJSON( 'package.json' );
  const repo = packageObject.name;

  var requireJS = await requireBuild( grunt, 'js/' + repo + '-config.js', { insertRequire: repo + '-main' } );

  if ( uglify ) {
    requireJS = minify( grunt, requireJS, { mangle: mangle } );
  }

  return requireJS;
};
