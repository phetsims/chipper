// Copyright 2020-2021, University of Colorado Boulder

/**
 * Grunt configuration file for unit tests
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

'use strict';

const _ = require( 'lodash' ); // eslint-disable-line require-statement-match
const generateDevelopmentHTML = require( './generateDevelopmentHTML' );

/**
 * @param {string} repo
 * @param {Object} [options]
 * @returns {Promise.<undefined>}
 */
module.exports = async ( repo, options ) => {
  await generateDevelopmentHTML( repo, _.merge( {

    // Include QUnit CSS
    stylesheets: '  <link rel="stylesheet" href="../sherpa/lib/qunit-2.10.0.css">', // Note the preceding whitespace which makes the formatting match IDEA formatting

    // Leave the background the default color white
    bodystyle: '',

    // Output to a test file
    outputFile: `../${repo}/${repo}-tests.html`,

    // Add the QUnit divs (and Scenery display div if relevant)
    bodystart: `<div id="qunit"></div>\n<div id="qunit-fixture"></div>${repo === 'scenery' ? '<div id="display"></div>' : ''}`,

    // Add QUnit JS
    addedPreloads: [ '../sherpa/lib/qunit-2.10.0.js', '../chipper/js/sim-tests/qunit-connector.js' ],

    // Do not show the splash screen
    stripPreloads: [ '../joist/js/splash.js' ],

    mainFile: `../chipper/dist/axon/js/${repo}-tests.js`,

    // Specify to use test config
    qualifier: 'test-',

    // Unit tests do not include the phet-io baseline and overrides files
    forSim: false
  }, options ) );
};
