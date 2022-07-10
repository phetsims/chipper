// Copyright 2022, University of Colorado Boulder

/**
 * Adapter for grunt compatibility.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const grunt = {
  file: {
    readJSON( path: string ) {
      const text = Deno.readTextFileSync( path );
      const repoPackageObject = JSON.parse( text );
      return repoPackageObject;
    },
    read( path: string ) {
      return Deno.readTextFileSync( path );
    }
  }
};

export default grunt;