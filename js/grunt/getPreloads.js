// Copyright 2017, University of Colorado Boulder

/**
 * TODO doc
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

/**
 * Gets preload, the set of scripts to be preloaded in the .html file.
 * NOTE! Order of the return value is significant, since it corresponds to the order in which scripts will be preloaded.
 *
 * @param {Object} grunt
 * @param {string} brand
 * @returns {Array.<string>}
 */
module.exports = function( grunt, brand ) {

  const packageObject = grunt.file.readJSON( 'package.json' );
  const buildObject = grunt.file.readJSON( '../chipper/build.json' );

  // No preload needed for wrappers
  if ( packageObject.isWrapper ) {
    return [];
  }

  var preload = [];

  // add preloads that are common to all sims, from build.json
  if ( buildObject.common && buildObject.common.preload ) {
    preload = preload.concat( buildObject.common.preload );
  }

  // add sim-specific preloads from package.json
  if ( packageObject.phet.preload ) {
    preload = preload.concat( packageObject.phet.preload );
  }

  // add brand-specific preloads from build.json
  if ( buildObject[ brand ] && buildObject[ brand ].preload ) {
    preload = preload.concat( buildObject[ brand ].preload );
  }

  // add brand-specific preloads from package.json
  if ( packageObject.phet[ brand ] && packageObject.phet[ brand ].preload ) {
    preload = preload.concat( packageObject.phet[ brand ].preload );
  }

  // remove duplicates (do NOT sort, order is significant!)
  return _.uniq( preload );
};
