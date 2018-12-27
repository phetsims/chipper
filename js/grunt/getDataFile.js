// Copyright 2018, University of Colorado Boulder

/**
 * Load a data file from perennial/data/
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

'use strict';

const fs = require( 'fs' );

/**
 * @public
 *
 * @param {string} listName - name of the perennial data file
 * @returns {string[]} - list of the items in the perennial list
 */
module.exports = listName => {

  return fs.readFileSync( `../perennial/data/${listName}`, 'utf-8' ).trim().split( '\n' ).map( sim => sim.trim() );
};