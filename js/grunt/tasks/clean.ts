// Copyright 2013-2024, University of Colorado Boulder

/**
 * Erases the build/ directory and all its contents, and recreates the build/ directory
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import fs from 'fs';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';

export const cleanPromise = ( async () => {
  const repo = getRepo();
  const buildDirectory = `../${repo}/build`;

  // Check if the build directory exists, then delete and recreate it
  if ( fs.existsSync( buildDirectory ) ) {
    fs.rmSync( buildDirectory, { recursive: true, force: true } );
  }
  fs.mkdirSync( buildDirectory, { recursive: true } );
} )();