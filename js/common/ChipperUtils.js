// Copyright 2015-2021, University of Colorado Boulder

/**
 * Utilities used throughout chipper.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

/* eslint-env node */
const fs = require( 'fs' );
const ChipperUtils = {

  /**
   * A repo supports typescript if the package.json has "typescript: true" in the "phet" section.
   * @param {string} repo - the name of a repo, like 'natural-selection'
   * @returns {boolean}
   * @public
   */
  isRepoTypeScript( repo ) {
    const packageObject = JSON.parse( fs.readFileSync( `../${repo}/package.json` ) );
    const phet = packageObject.phet;
    const typescript = phet.typescript === true;
    return typescript;
  }
};

module.exports = ChipperUtils;