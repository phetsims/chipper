// Copyright 2017, University of Colorado Boulder

/**
 * Determines a list of all dependent repositories (for dependencies.json or other creation)
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const assert = require( 'assert' );
const ChipperConstants = require( '../common/ChipperConstants' );
const grunt = require( 'grunt' );

/**
 * Returns a list of all dependent repositories.
 * @public
 *
 * @param {string} repo
 * @param {string} [brand] - If not specified, it will return the dependencies for all brands.
 * @returns {Array.<string>}
 */
module.exports = function getPhetLibs( repo, brand ) {
  assert( typeof repo === 'string', 'Repository required for getPhetLibs' );
  assert( brand === undefined || _.includes( ChipperConstants.BRANDS, brand ), 'Invalid brand for getPhetLibs: ' + brand );

  if ( brand === undefined ) {
    return _.reduce( ChipperConstants.BRANDS, ( dependencies, brand ) => {
      return _.uniq( dependencies.concat( getPhetLibs( repo, brand ) ).sort() );
    }, [] );
  }
  else {
    const packageObject = grunt.file.readJSON( `../${repo}/package.json` );
    let buildObject;
    try {
      buildObject = grunt.file.readJSON( '../chipper/build.json' );
    }
    catch( e ) {
      buildObject = {};
    }

    // If working with a wrapper, then just use the wrapper's phetLibs
    if ( packageObject.isWrapper && packageObject.wrapper.phetLibs ) {
      return packageObject.wrapper.phetLibs.concat( packageObject.name ).sort();
    }

    // start with package.json
    let phetLibs = packageObject.phet.phetLibs || [];

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
  }
};
