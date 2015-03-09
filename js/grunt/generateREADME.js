// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates the README.md file for a simulation.
 * Placeholders in a template file are replaced with values specific to the simulation.
 *
 * @author Chris Malley {PixelZoom, Inc.}
 * @param grunt
 * @param {string} repositoryName name of the sim's repository
 * @param {string} phetLibs from package.json
 * @param {string} simTitleStringKey from package.json
 * @param {boolean} published has the sim been published?
 */
module.exports = function( grunt, repositoryName, phetLibs, simTitleStringKey, published ) {
  'use strict';

  //TODO other variations of this occur in Gruntfile.js, createSim.js, SimIFrameAPI.js
  // http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
  var replaceAll = function( str, find, replace ) {
    return str.replace( new RegExp( find.replace( /[-\/\\^$*+?.()|[\]{}]/g, '\\$&' ), 'g' ), replace );
  };

  // Read the title from the English strings file.
  var strings = grunt.file.readJSON( '../' + repositoryName + '/strings/' + repositoryName + '-strings_en.json' );
  var titleKey = simTitleStringKey.split( '/' ).pop(); // eg. 'EXAMPLE_SIM/example-sim.name' -> 'example-sim.name'
  var title = strings[ titleKey ];

  // Commands for cloning all required repositories
  var cloneCommands = '';
  var dependencies = phetLibs.split( ' ' );
  for ( var i = 0; i < dependencies.length; i++ ) {
    cloneCommands = cloneCommands + 'git clone https://github.com/phetsims/' + dependencies[ i ] + '.git';
    if ( i !== dependencies.length - 1 ) {
      cloneCommands += '\n';
    }
  }

  // Read the template.
  var templateFile = published ? 'README-published.md' : 'README-unpublished.md';
  var readme = grunt.file.read( '../chipper/templates/' + templateFile );

  // Replace placeholders in the template.
  readme = replaceAll( readme, '{REPOSITORY}', repositoryName );
  readme = replaceAll( readme, '{TITLE}', title );
  readme = replaceAll( readme, '{CLONE_COMMANDS}', cloneCommands );

  // Write to the repository's root directory.
  grunt.file.write( 'README.md', readme );
};

