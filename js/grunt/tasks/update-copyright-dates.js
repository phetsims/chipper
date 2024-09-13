// Copyright 2024, University of Colorado Boulder

const getRepo = require( './getRepo' );
const updateCopyrightDates = require( '../updateCopyrightDates' );

/**
 * TODO: https://github.com/phetsims/chipper/issues/1459 Grunt uses --brands=myBrands. But my parser was --brands myBrands. Equals sign probably broken.
 * TODO: https://github.com/phetsims/chipper/issues/1459 helpful CLI --help is only available in grunt, not in these mini tasks.
 * @author Sam Reid (PhET Interactive Simulations)
 */
const repo = getRepo();

( async () => {
  await updateCopyrightDates( repo );
} )();