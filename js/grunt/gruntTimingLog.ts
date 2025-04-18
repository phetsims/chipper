// Copyright 2024-2025, University of Colorado Boulder

/**
 * better formatting for logging during the build.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import _ from 'lodash';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';

// Align tabs to messages shorter than this number of chars.
const MAX_SUPPORTED_LENGTH = 29;

export default function gruntTimingLog( message: string, time: number, bytes?: number ): void {
  const tabsNeeded = Math.ceil( Math.max( MAX_SUPPORTED_LENGTH - message.length, 0 ) / 8 ) + 1;
  const tabs = _.times( tabsNeeded ).map( () => '\t' ).join( '' );
  const bytesString = bytes ? ` (${bytes} bytes)` : '';
  grunt.log.ok( `${message}:${tabs}${time}ms${bytesString}` );
}