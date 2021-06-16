// Copyright 2020-2021, University of Colorado Boulder

/**
 * For a given repository, it returns the JSON object content that should go in phet.chipper.stringRepos for a
 * compilation-free simulation run.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const fs = require( 'fs' );
const getDependencies = require( './getDependencies' );

/**
 * @returns {Promise.<Object>}
 */
module.exports = async repo => {
  return Object.keys( await getDependencies( repo ) ).filter( stringRepo => stringRepo !== 'comment' ).filter( stringRepo => {
    return fs.existsSync( `../${stringRepo}/${stringRepo}-strings_en.json` );
  } ).map( stringRepo => {
    return {
      repo: stringRepo,
      requirejsNamespace: JSON.parse( fs.readFileSync( `../${stringRepo}/package.json`, 'utf-8' ) ).phet.requirejsNamespace
    };
  } );
};
