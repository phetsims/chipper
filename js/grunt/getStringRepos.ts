// Copyright 2020-2024, University of Colorado Boulder

/**
 * For a given repository, it returns the JSON object content that should go in phet.chipper.stringRepos for a
 * compilation-free simulation run.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const fs = require( 'fs' );
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import getDependencies from './getDependencies.js';

module.exports = async ( repo: string ): Promise<IntentionalAny> => {
  return Object.keys( await getDependencies( repo ) ).filter( stringRepo => stringRepo !== 'comment' ).filter( stringRepo => {
    return fs.existsSync( `../${stringRepo}/${stringRepo}-strings_en.json` );
  } ).map( stringRepo => {
    return {
      repo: stringRepo,
      requirejsNamespace: JSON.parse( fs.readFileSync( `../${stringRepo}/package.json`, 'utf-8' ) ).phet.requirejsNamespace
    };
  } );
};