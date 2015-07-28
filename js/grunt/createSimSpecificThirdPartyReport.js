// Copyright 2002-2015, University of Colorado Boulder

/**
 * Creates a report on third-party images, audio and code which are used by the simulation.  This is only run if the option
 * 'createSimSpecificThirdPartyReport' is provided to the grunt command.
 *
 * The report is stored in a file build/third-party-report.json in order to make it easy to restart/update the
 * composite report, since running a report for each simulation may take several minutes.  For the file that generates
 * the composite report, please see createCompositeThirdPartyReport.js
 *
 * See https://github.com/phetsims/chipper/issues/162
 *
 * @author Sam Reid
 */

/**
 * @param grunt the grunt instance
 * @param {object} codeEntries - the sherpa 3rd party dependencies as reported in the HTML
 * @param {object} imageAudioEntries - the images and audio files used by the simulation.
 */
module.exports = function( grunt, codeEntries, imageAudioEntries ) {
  'use strict';

  var result = { code: codeEntries, imagesAndAudio: imageAudioEntries };
  var resultString = JSON.stringify( result, null, 2 );

  grunt.file.write( 'build/third-party-report.json', resultString );
};
