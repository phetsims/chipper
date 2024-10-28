// Copyright 2013-2024, University of Colorado Boulder

/**
 * Creates a report of third-party resources (code, images, sound, etc) used in the published PhET simulations by
 * reading the license information in published HTML files on the PhET website. This task must be run from main.
 * After running this task, you must push sherpa/third-party-licenses.md.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

// TODO: https://github.com/phetsims/chipper/issues/1461 probably does not need to be here in grunt
( async () => {
  const reportThirdParty = require( '../reportThirdParty.js' );

  await reportThirdParty();
} )();