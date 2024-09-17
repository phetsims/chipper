// Copyright 2024, University of Colorado Boulder

const getRepo = require( './util/getRepo' );
const generateTestHTML = require( '../generateTestHTML' );

/**
 * Generates top-level SIM-tests.html file based on the preloads in package.json.  See https://github.com/phetsims/aqua/blob/main/doc/adding-unit-tests.md
 * for more information on automated testing. Usually you should
 * set the "generatedUnitTests":true flag in the sim package.json and run `grunt update` instead of manually generating this.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await generateTestHTML( repo );
} )();