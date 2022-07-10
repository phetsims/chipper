// Copyright 2022, University of Colorado Boulder

/**
 * tempo (name to be determined) is a build system that uses deno and replaces chipper
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { parse } from 'https://deno.land/std/flags/mod.ts';
import 'https://deno.land/x/lodash@4.17.19/dist/lodash.min.js';
import Gruntfile from '../grunt/Gruntfile.js';

const parsedArgs = parse( Deno.args );
console.log( parsedArgs );
const brand = parsedArgs.brands || 'phet';
console.log( brand );

const tasks = {};
const grunt = {
  file: {
    async readJSON( path: string ) {
      const text = await Deno.readTextFile( path );
      const repoPackageObject = JSON.parse( text );
      return repoPackageObject;
    }
  },
  option( key: string ) {
    return parsedArgs[ key ];
  },
  registerTask( taskName: string, description: string, commands: string[] | ( () => void ) ) {
    tasks[ taskName ] = commands;
  },
  fail: {
    fatal( string: string ) {
      console.log( string );
      Deno.exit( 1 );
    }
  },
  task: {
    run( taskName: string ) {
      tasks[ taskName ]
    }
  }
};

const task = parsedArgs._[ 0 ] || 'build';
console.log( task );

await Gruntfile( grunt );

const runTask = ( taskName: string ) => {
  console.log( 'running task: ' + taskName );
  const selectedTask = tasks[ taskName ];
  if ( Array.isArray( selectedTask ) ) {

  }
  else {
    selectedTask();
  }
};
runTask( task );