// Copyright 2020-2024, University of Colorado Boulder

/**
 * Fix end of lines for a string based on the operating system this code is being run on.
 * See https://github.com/phetsims/chipper/issues/933
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import os from 'os';

export default ( string: string ): string => string.split( '\r' ).join( '' ).split( '\n' ).join( os.EOL );