// Copyright 2016, University of Colorado Boulder

//TODO not ready for production use, see https://github.com/phetsims/chipper/issues/516
/**
 * Query parameters used by "post-load" PhET common code.
 * See initialize-globals.js for query parameters used in preload code.
 *
 * Sample usage:
 *
 * var QueryParameters = require( 'CHIPPER/QueryParameters' );
 * if ( QueryParameters.dev ) { ... }
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  // modules
  var chipper = require( 'CHIPPER/chipper' );
  var platform = require( 'PHET_CORE/platform' );

  var QueryParameters = QueryStringMachine.getAll( {

    // enables accessibility features, such as keyboard navigation (mileage may vary!)
    accessibility: { type: 'flag' },

    /**
     * When present, will trigger changes that are more similar to the build environment.
     * Right now, this includes computing higher-resolution mipmaps for the mipmap plugin.
     */
    buildCompatible: { type: 'flag' },

    //TODO not documented in initialize-globals.js
    brand: {
      type: 'string',
      defaultValue: 'adapted-from-phet',
      validValues: [ 'phet', 'phet-io', 'adapted-from-phet' ]
    },

    //TODO not documented in initialize-globals.js
    cacheBuster: { type: 'flag' },

    /**
     * The color profile used at startup, relevant only for sims that support multiple color profiles.
     * Such sims are required to have a 'default' profile.  If a sim supports a 'project mode' then
     * it should also have a 'projector' profile.  Other profile names are not currently standardized.
     */
    colorProfile: {
      type: 'string',
      defaultValue: 'default'
    },

    /**
     * When running one of the UI demo applications, selects a particular UI component in the Components screen.
     * See sun.DemosView.
     */
    component: {
      type: 'string',
      defaultValue: null
    },

    // enables developer-only features, such as showing the layout bounds
    dev: { type: 'flag' },

    // enables assertions
    ea: { type: 'flag' },

    // enables all assertions, as above but with more time-consuming checks
    eall: { type: 'flag' },

    // randomly sends mouse events to sim. value is the average number of mouse events to synthesize per frame.
    fuzzMouse: {
      type: 'number',
      defaultValue: 10
    },

    // Launches the game-up-camera code which delivers images to requests in BrainPOP/Game Up/SnapThought
    gameUp: { type: 'flag' },

    // Enables logging for game-up-camera, see gameUp
    gameUpLogging: { type: 'flag' },

    // for phet-io use relative path for finding the sim, instead of launching from phet-io.colorado.edu
    launchLocalVersion: { type: 'flag' },

    // test with a specific locale
    locale: {
      type: 'string',
      defaultValue: null
    },

    // When a simulation is run from the PhET app, it should set this flag. It alters statistics that the sim sends
    // to Google Analytics and potentially other sources in the future.
    'phet-app': { type: 'flag' },

    // when running a simulation using phetio.js, outputs states and deltas within the phetioEvents data stream, see phetio.js
    'phet-io.emitDeltas': { type: 'flag' },

    // when emitting deltas using phetio.js (see phet-io.emitDeltas) emit deltas that are empty, to simplify playback in some systems like Metacog.
    'phet-io.emitEmptyDeltas': { type: 'flag' },

    // emit the Scenery input events
    'phet-io.emitInputEvents': { type: 'flag' },

    // when running a simulation using phetio.js, outputs the state at the end of every frame
    'phet-io.emitStates': { type: 'flag' },

    // will output type documentation to the console, see https://github.com/phetsims/phet-io/issues/218
    'phet-io.docs': { type: 'flag' },

    // evaluate expressions on phet-io wrapper objects, like: ?phet-io.expressions=[["beaker.beakerScreen.soluteSelector","setVisible",[true]]]
    'phet-io.expressions': {
      type: 'string',
      defaultValue: null
    },

    // Specifies where to log phetioEvents
    'phet-io.log': {
      type: 'string',
      defaultValue: null,
      validValues: [
        null, // no logging
        'console', // stream to console in JSON format
        'lines' // stream colorized human-readable events to the console (Chrome and Firefox only)
      ]
    },

    // Causes a phet-io simulation to launch, even without a wrapper "go-ahead" step, see phet-io#181
    'phet-io.standalone': { type: 'flag' },

    // When running as phet-io assertions are normally thrown when uninstrumented objects are encountered.
    // Setting this to false will allow the simulation to proceed.  Useful for partially instrumented simulations.
    'phet-io.validateTandems': {
      type: 'flag',
      defaultValue: true
    },

    // plays event logging back from the server, provide an optional name for the session
    playbackInputEventLog: { type: 'flag' },

    //TODO document or delete, see https://github.com/phetsims/joist/issues/370
    playbackMode: { type: 'flag' },

    // triggers a post-message that fires when the sim finishes loading, currently used by aqua test-sims
    postMessageOnLoad: { type: 'flag' },

    // passes errors to test-sims
    postMessageOnError: { type: 'flag' },

    // shows profiling information for the sim
    profiler: { type: 'flag' },

    // adds a menu item that will open a window with a QR code with the URL of the simulation
    qrCode: { type: 'flag' },

    // enables input event logging, provide an optional name for the session, log is available via PhET menu
    recordInputEventLog: { type: 'flag' },

    // Specify a renderer for the Sim's rootNode to use. See joist#221 and joist#184.
    rootRenderer: {
      type: 'string',
      defaultValue: platform.edge ? 'canvas' : 'svg', // see https://github.com/phetsims/molarity/issues/24
      validValues: [ 'canvas', 'svg', 'dom', 'webgl' ] // see Node.setRenderer
    },

    //TODO array processing should be done here
    // List of one or more logs to enable in scenery 0.2+, delimited with .
    // For example: ?sceneryLog=Display.Drawable.WebGLBlock
    sceneryLog: {
      type: 'string',
      defaultValue: null
    },

    // Scenery logs will be output to a string instead of the window
    sceneryStringLog: { type: 'flag' },

    // identifier for a single simulation run
    sessionID: {
      type: 'string',
      defaultValue: null
    },

    //TODO not documented in initialize-globals.js
    screenIndex: {
      type: 'number',
      defaultValue: 0
    },

    //TODO array processing should be done here
    screens: {
      type: 'string',
      defaultValue: null
    },

    // Displays an overlay of the current bounds of each CanvasNode
    showCanvasNodeBounds: { type: 'flag' },

    // Displays an overlay of the current bounds of each scenery.FittedBlock
    showFittedBlockBounds: { type: 'flag' },

    // if false, go immediately to screenIndex
    showHomeScreen: { type: 'flag' },

    // Shows pointer areas as dashed lines. touchAreas are red, mouseAreas are blue.
    showPointerAreas: { type: 'flag' },

    // Displays a semi-transparent cursor indicator for the location of each active pointer on the screen.
    showPointers: { type: 'flag' },

    // Shows the visible bounds in ScreenView.js, for debugging the layout outside of the "dev" bounds
    showVisibleBounds: { type: 'flag' },

    /**
     * Sets a string used for various i18n test.  The values are:
     *
     * double: duplicates all of the translated strings which will allow to see (a) if all strings
     *   are translated and (b) whether the layout can accommodate longer strings from other languages.
     *   Note this is a heuristic rule that does not cover all cases.
     *
     * long: an exceptionally long string will be substituted for all strings. Use this to test for layout problems.
     *
     * rtl: a string that tests RTL (right-to-left) capabilities will be substituted for all strings
     *
     * xss: tests for security issues related to https://github.com/phetsims/special-ops/issues/18,
     *   and running a sim should NOT redirect to another page. Preferably should be used for built versions or
     *   other versions where assertions are not enabled (brackets can cause issues for SubSupText, etc.)
     *
     * none|null: the normal translated string will be shown
     *
     * {string}: if any other string provided, that string will be substituted everywhere. This facilitates testing
     *   specific cases, like whether the word 'vitesse' would substitute for 'speed' well.  Also, using "/u20" it
     *   will show whitespace for all of the strings, making it easy to identify non-translated strings.
     */
    stringTest: {
      type: 'string',
      defaultValue: null
    },

    // override strings, value is JSON that is identical to string.json files
    strings: {
      type: 'string',
      defaultValue: null
    },

    // Whether accessibility features are enabled or not.
    virtualCursor: { type: 'flag' },

    // Enables WebGL rendering. See https://github.com/phetsims/scenery/issues/289
    webgl: {
      type: 'flag',
      defaultValue: true
    },

    /**
     * Puts the WebGLLayer into a testing mode which simulates context loss between successively increasing gl
     * calls (starting at 1). This parameter should be used in conjunction with webglContextLossTimeout since
     * it only triggers upon the first context loss.
     */
    webglContextLossIncremental: { type: 'flag' },

    //TODO this one is problematic, it's both a 'flag' and a 'number'
    /**
     * Creates WebGL contexts that can simulate context loss. If a value is specified, it will simulate a context loss
     * after the specified number of milliseconds has elapsed. The value can be omitted to manually simulate the
     * context loss with simScene.simulateWebGLContextLoss()
     */
    webglContextLossTimeout: {
      type: 'number',
      defaultValue: 0
    }
  } );

  chipper.register( 'QueryParameters', QueryParameters );

  return QueryParameters;
} );
