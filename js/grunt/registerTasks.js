// Copyright 2024, University of Colorado Boulder
/**
 * registerTasks.js - Registers all *.js or *.ts files in the tasks directory as grunt tasks.
 * Visits the directory only, does not recurse.
 *
 * This file must remain as *.js + requirejs since it is loaded by Gruntfile.js
 *
 * Moved out of Gruntfile.js on Sept 17, 2024
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const fs = require( 'fs' );
const getDocumentationForTask = require( './getDocumentationForTask' );
const path = require( 'path' );
const gruntSpawn = require( './gruntSpawn' );
const isWindows = /^win/.test( process.platform );

function execTask( grunt, taskFilename ) {
  const command = `${path.join( '..', 'chipper', 'node_modules', '.bin', 'tsx' )}${isWindows ? '.cmd' : ''}`;

  return () => {
    gruntSpawn( grunt, command, [ `../chipper/js/grunt/tasks/${taskFilename}`, ...process.argv.slice( 2 ) ], process.cwd() );
  };
}

module.exports = ( grunt, dir ) => {
  // Load each file from tasks/ and register it as a task
  fs.readdirSync( dir ).forEach( file => {
    if ( file.endsWith( '.js' ) || file.endsWith( '.ts' ) ) {
      const taskName = file.substring( 0, file.lastIndexOf( '.' ) );

      const tsExists = fs.existsSync( `../chipper/js/grunt/tasks/${taskName}.ts` );
      const jsExists = fs.existsSync( `../chipper/js/grunt/tasks/${taskName}.js` );

      if ( tsExists && jsExists ) {
        throw new Error( `Both TypeScript and JavaScript versions of the task ${taskName} exist. Please remove one of them.` );
      }
      else {
        grunt.registerTask( taskName, getDocumentationForTask( file ), execTask( grunt, file ) );
      }
    }
  } );
};