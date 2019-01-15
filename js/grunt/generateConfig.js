// Copyright 2015, University of Colorado Boulder

/**
 * Generates the main require.js config file for simulations.
 *
 * See https://github.com/phetsims/chipper/issues/580
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

// modules
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const getPhetLibs = require( './getPhetLibs' );
const grunt = require( 'grunt' );

//TODO https://github.com/phetsims/perennial/issues/120, this causes 'grunt create-sim' to fail
// const updateCopyrightDate = require( './updateCopyrightDate' );

/**
 * @param {string} repo
 * @param {string} relativeFile - output location
 * @param {string} launchSuffix - text to use for the deps
 * @returns {Promise}
 */
module.exports = async function( repo, relativeFile, launchSuffix ) {

  let configJS = grunt.file.read( '../chipper/templates/sim-config.js' ); // the template file
  const packageObject = grunt.file.readJSON( `../${repo}/package.json` );

  const requirements = {}; // {string} require.js prefix => {string} of what is included
  getPhetLibs( repo, 'phet' ).forEach( lib => {
    const packageFilename = `../${lib}/package.json`;

    if ( grunt.file.exists( packageFilename ) ) {
      const packageJSON = grunt.file.readJSON( packageFilename );
      const prefix = packageJSON && packageJSON.phet && packageJSON.phet.requirejsNamespace;

      if ( prefix ) {
        if ( lib === 'brand' ) {
          requirements[ prefix ] = '\'../../brand/\' + phet.chipper.brand + \'/js\'';
        }
        else {
          requirements[ prefix ] = `'../../${lib}/js'`;
        }
      }
    }
  } );

  // Include the REPOSITORY prefix
  requirements.REPOSITORY = '\'..\'';

  // Include phet-io manually, since it isn't listed in phetLibs (and we don't want to require having it checked out to
  // build this file).
  requirements.PHET_IO = '\'../../phet-io/js\'';

  // Override the simulation prefix to point to just '.'
  requirements[ packageObject.phet.requirejsNamespace ] = '\'.\'';

  // Replace placeholders in the template.
  configJS = ChipperStringUtils.replaceAll( configJS, '{{SIM_REQUIREJS_NAMESPACE}}', packageObject.phet.requirejsNamespace );
  configJS = ChipperStringUtils.replaceAll( configJS, '{{LAUNCH_SUFFIX}}', launchSuffix );
  configJS = ChipperStringUtils.replaceAll( configJS, '{{REPOSITORY}}', repo );
  configJS = ChipperStringUtils.replaceAll( configJS, '{{CURRENT_YEAR}}', new Date().getFullYear() );
  configJS = ChipperStringUtils.replaceAll( configJS, '{{CONFIG_LINES}}', Object.keys( requirements ).sort().map( prefix => {
    return prefix + ': ' + requirements[ prefix ];
  } ).join( ',\n    ' ) );

  // Write to the repository's root directory.
  grunt.file.write( `../${repo}/${relativeFile}`, configJS );

  //TODO https://github.com/phetsims/perennial/issues/120, this causes 'grunt create-sim' to fail
  // await updateCopyrightDate( repo, relativeFile );
};
