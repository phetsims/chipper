// Copyright 2020-2021, University of Colorado Boulder

/**
 * Fix end of lines for a string based on the operating system this code is being run on.
 * See https://github.com/phetsims/chipper/issues/933
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */


// modules
// const os = require( 'os' );
import { EOL } from 'https://deno.land/std/fs/eol.ts';

// TODO: https://github.com/phetsims/chipper/issues/1272 test on 2 platforms
const eol = Deno.build.os === 'windows' ? EOL.CRLF : EOL.LF;

/**
 * @public
 *
 * @returns {string}
 */
export default string => string.split( '\r' ).join( '' ).split( '\n' ).join( eol );
