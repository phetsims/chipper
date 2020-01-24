// Copyright 2017-2019, University of Colorado Boulder

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
const execute = require( './execute' );
const getPhetLibs = require( './getPhetLibs' );
const grunt = require( 'grunt' );
const updateCopyrightDate = require( './updateCopyrightDate' );

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

  const configFilename = `../${repo}/${relativeFile}`;

  // Write to the repository's root directory.
  grunt.file.write( configFilename, configJS );

  //////////////////////////////
  // This is somewhat more complicated than it needs to be to support proper copyright dates
  //
  const tempBashFileName = 'temp.sh';

  // write to a bash file to support this complicated bash command
  grunt.file.write( tempBashFileName, '[ -d .git ] || git rev-parse --git-dir > /dev/null 2>&1' );
  await execute( 'chmod', [ 'u+x', tempBashFileName ], '' );

  try {

    // Test if this is a git repo, fail out if it isn't
    await execute( 'sh', [ './temp.sh' ], '' );

    // Test if the config file is checked in to git, fail if not
    await execute( 'git', [ 'ls-files', '--error-unmatch', relativeFile ], `../${repo}` );

    // If we get here, then we are overwriting the config file, so let's update the copyright to be appropriate.
    await updateCopyrightDate( repo, relativeFile, true /* don't log to the console */ );
  }
  catch( e ) {
    // if we errored out, then the config file isn't tracked, so don't update the copyright date
  }
  grunt.file.delete( tempBashFileName );
};
