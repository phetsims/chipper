// Copyright 2024, University of Colorado Boulder

/**
 * TODO: delete as part of https://github.com/phetsims/chipper/issues/1437
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

module.exports = function typescriptTest() {

  const myTestNumber = 9;

  function myPrintFunc( x: number ): void {
    console.log( x );
  }

  myPrintFunc( myTestNumber );
};