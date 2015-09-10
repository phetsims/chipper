// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates the README.md file for a simulation.
 * Placeholders in a template file are replaced with values specific to the simulation.
 *
 * @author Chris Malley {PixelZoom, Inc.}
 */

var ChipperStringUtils = require( '../../../chipper/js/common/ChipperStringUtils' );

/**
 * @param grunt - the grunt instance
 * @param {string} repositoryName - name of the repository
 * @param {string[]} phetLibs - repositories that repositoryName depends on
 * @param {string} simTitleStringKey - key for the sim's title string
 * @param {boolean} published - has the sim been published?
 */
module.exports = function( grunt, repositoryName, phetLibs, simTitleStringKey, published ) {
  'use strict';

  // Read the title from the English strings file.
  var strings = grunt.file.readJSON( '../' + repositoryName + '/' + repositoryName + '-strings_en.json' );
  var titleKey = simTitleStringKey.split( '/' ).pop(); // eg. 'EXAMPLE_SIM/example-sim.title' -> 'example-sim.title'
  var title = strings[ titleKey ].value;

  // Commands for cloning all required repositories
  var cloneCommands = '';
  for ( var i = 0; i < phetLibs.length; i++ ) {
    cloneCommands = cloneCommands + 'git clone https://github.com/phetsims/' + phetLibs[ i ] + '.git';
    if ( i !== phetLibs.length - 1 ) {
      cloneCommands += '\n';
    }
  }

  // Read the template.
  var templateFile = published ? 'README-published.md' : 'README-unpublished.md';
  var readme = grunt.file.read( '../chipper/templates/' + templateFile );

  // Replace placeholders in the template.
  readme = ChipperStringUtils.replaceAll( readme, '{REPOSITORY}', repositoryName );
  readme = ChipperStringUtils.replaceAll( readme, '{TITLE}', title );
  readme = ChipperStringUtils.replaceAll( readme, '{CLONE_COMMANDS}', cloneCommands );

  // Write to the repository's root directory.
  grunt.file.write( 'README.md', readme );
};

