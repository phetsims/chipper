// Copyright 2017-2021, University of Colorado Boulder

/**
 * Determines a list of all dependent repositories (for dependencies.json or other creation)
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */


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

    // start with package.json
    let phetLibs = packageObject &&
                   packageObject.phet &&
                   packageObject.phet.phetLibs ?
                   packageObject.phet.phetLibs : [];

    // add the repo that's being built
    phetLibs.push( packageObject.name );

    // add common and brand-specific entries from build.json
    [ 'common', brand ].forEach( id => {
      if ( buildObject[ id ] && buildObject[ id ].phetLibs ) {
        phetLibs = phetLibs.concat( buildObject[ id ].phetLibs );
      }
    } );

    // add brand specific dependencies from the package json
    if ( packageObject.phet && packageObject.phet[ brand ] && packageObject.phet[ brand ].phetLibs ) {
      phetLibs = phetLibs.concat( packageObject.phet[ brand ].phetLibs );
    }

    // wrappers are also marked as phetLibs, so we can get their shas without listing them twice
    if ( brand === 'phet-io' && packageObject.phet && packageObject.phet[ brand ] ) {
      phetLibs = phetLibs.concat( packageObject.phet[ brand ].wrappers || [] );
    }

    // sort and remove duplicates
    return _.uniq( phetLibs.sort() );
  }
};
