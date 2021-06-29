// Copyright 2020-2021, University of Colorado Boulder

/**
 * Fix end of lines for a string based on the operating system this code is being run on.
 * See https://github.com/phetsims/chipper/issues/933
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */


// modules
const os = require( 'os' );

/**
 * @public
 *
 * @returns {string}
 */
module.exports = string => string.split( '\r' ).join( '' ).split( '\n' ).join( os.EOL );
