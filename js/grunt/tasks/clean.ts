// Copyright 2013-2024, University of Colorado Boulder

/**
 * Erases the build/ directory and all its contents, and recreates the build/ directory
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import * as grunt from 'grunt';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import fs from 'fs';

export const clean = ( async () => {
  const repo = getRepo();
  const buildDirectory = `../${repo}/build`;

  // Check if the build directory exists, then delete and recreate it
  if ( grunt.file.exists( buildDirectory ) ) {
    grunt.file.delete( buildDirectory );
  }
  fs.mkdirSync( buildDirectory, { recursive: true } );
} )();