// Copyright 2015, University of Colorado Boulder

/**
 * Generates the main require.js config file for simulations.
 *
 * See https://github.com/phetsims/chipper/issues/580
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

// modules
var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

/**
 * @param {Object} grunt - The grunt runtime object
 * @param {Object} buildConfig - see getBuildConfig.js
 * @param {string} destination - output location
 * @param {string} launchSuffix - text to use for the deps
 */
module.exports = function( grunt, buildConfig, destination, launchSuffix ) {

  var repositoryName = buildConfig.name;
  var configJS = grunt.file.read( '../chipper/templates/sim-config.js' ); // the template file

  var requirements = {}; // {string} require.js prefix => {string} of what is included
  buildConfig.phetLibs.forEach( function( lib ) {
    var packageFilename = '../' + lib + '/package.json';

    if ( grunt.file.exists( packageFilename ) ) {
      var packageJSON = grunt.file.readJSON( packageFilename );
      var prefix = packageJSON && packageJSON.phet && packageJSON.phet.requirejsNamespace;

      if ( prefix ) {
        if ( lib === 'brand' ) {
          requirements[ prefix ] = '\'../../brand/\' + phet.chipper.brand + \'/js\'';
        }
        else {
          requirements[ prefix ] = '\'../../' + lib + '/js\'';
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
  requirements[ buildConfig.requirejsNamespace ] = '\'.\'';

  // Replace placeholders in the template.
  configJS = ChipperStringUtils.replaceAll( configJS, '{{SIM_REQUIREJS_NAMESPACE}}', buildConfig.requirejsNamespace );
  configJS = ChipperStringUtils.replaceAll( configJS, '{{LAUNCH_SUFFIX}}', launchSuffix );
  configJS = ChipperStringUtils.replaceAll( configJS, '{{REPOSITORY}}', repositoryName );
  configJS = ChipperStringUtils.replaceAll( configJS, '{{CURRENT_YEAR}}', new Date().getFullYear() );
  configJS = ChipperStringUtils.replaceAll( configJS, '{{CONFIG_LINES}}', Object.keys( requirements ).sort().map( function( prefix ) {
    return prefix + ': ' + requirements[ prefix ];
  } ).join( ',\n    ' ) );

  // Write to the repository's root directory.
  grunt.file.write( destination, configJS );
};
