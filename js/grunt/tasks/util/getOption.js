// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */

// Use nopt to guarantee compatibility with grunt. See usage site: https://github.com/phetsims/chipper/issues/1459
// See usage in chipper/node_modules/grunt-cli/bin/grunt
const nopt = require( 'nopt' );

const options = nopt( {}, {}, process.argv, 2 );

module.exports = function( keyName ) {
  return options[ keyName ];
};