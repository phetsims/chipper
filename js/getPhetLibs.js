// Copyright 2017, University of Colorado Boulder

/**
 * Determines a list of all dependent repositories (for dependencies.json or other creation)
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match

module.exports = async function( grunt, repo, brand ) {

  const packageObject = grunt.file.readJSON( '../' + repo + '/package.json' );
  const buildObject = grunt.file.readJSON( '../chipper/build.json' );

  // If working with a wrapper, then just use the wrapper's phetLibs
  if ( packageObject.isWrapper && packageObject.wrapper.phetLibs ) {
    return packageObject.wrapper.phetLibs.concat( packageObject.name ).sort();
  }

  // start with package.json
  var phetLibs = packageObject.phet.phetLibs || [];

  // add the repo that's being built
  phetLibs.push( packageObject.name );

  // add common and brand-specific entries from build.json
  [ 'common', brand ].forEach( function( id ) {
    if ( buildObject[ id ] && buildObject[ id ].phetLibs ) {

      // We don't want common sim repos for wrappers
      if ( !packageObject.isWrapper || ( packageObject.isWrapper && id !== 'common' ) ) {
        phetLibs = phetLibs.concat( buildObject[ id ].phetLibs );
      }
    }
  } );

  // sort and remove duplicates
  return _.uniq( phetLibs.sort() );
};
