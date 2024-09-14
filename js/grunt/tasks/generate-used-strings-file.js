// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );
const getPhetLibs = require( '../getPhetLibs' );
const fs = require( 'fs' );
const webpackBuild = require( '../webpackBuild' );
const ChipperConstants = require( '../../common/ChipperConstants' );
const getLocalesFromRepository = require( '../getLocalesFromRepository' );
const getStringMap = require( '../getStringMap' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

const Transpiler = require( '../../../common/Transpiler' );
const transpiler = new Transpiler( { silent: true } );

transpiler.transpileRepos( getPhetLibs( repo ) );
( async () => {
  const webpackResult = await webpackBuild( repo, 'phet' );

  const phetLibs = getPhetLibs( repo, 'phet' );
  const allLocales = [ ChipperConstants.FALLBACK_LOCALE, ...getLocalesFromRepository( repo ) ];
  const { stringMap } = getStringMap( repo, allLocales, phetLibs, webpackResult.usedModules );

// TODO: https://github.com/phetsims/phet-io/issues/1877 This is only pertinent for phet-io, so I'm outputting
// it to phet-io-sim-specific.  But none of intrinsic data is phet-io-specific.
// Do we want a different path for it?
// TODO: https://github.com/phetsims/phet-io/issues/1877 How do we indicate that it is a build artifact, and
// should not be manually updated?
  fs.writeFileSync( `../phet-io-sim-specific/repos/${repo}/used-strings_en.json`, JSON.stringify( stringMap.en, null, 2 ) );
} )();