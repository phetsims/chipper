// Copyright 2015-2016, University of Colorado Boulder

/**
 * Initializes phet globals that are used by all simulations, including assertions and query-parameters.
 * See https://github.com/phetsims/phetcommon/issues/23
 * This file must be loaded before requirejs is started up, and this file cannot be loaded as an AMD module.
 * The easiest way to do this is via a <script> tag in your HTML file.
 *
 * PhET Simulations can be launched with query parameters which enable certain features.  To use a query parameter,
 * provide the full URL of the simulation and append a question mark (?) then the query parameter (and optionally its
 * value assignment).  For instance:
 * http://www.colorado.edu/physics/phet/dev/html/reactants-products-and-leftovers/1.0.0-dev.13/reactants-products-and-leftovers_en.html?dev
 *
 * Here is an example of a value assignment:
 * http://www.colorado.edu/physics/phet/dev/html/reactants-products-and-leftovers/1.0.0-dev.13/reactants-products-and-leftovers_en.html?webgl=false
 *
 * To use multiple query parameters, specify the question mark before the first query parameter, then ampersands (&)
 * between other query parameters.  Here is an example of multiple query parameters:
 * http://www.colorado.edu/physics/phet/dev/html/reactants-products-and-leftovers/1.0.0-dev.13/reactants-products-and-leftovers_en.html?dev&showPointerAreas&webgl=false
 *
 * For more on query parameters in general, see http://en.wikipedia.org/wiki/Query_string
 * For details on common-code query parameters, see QUERY_PARAMETERS_SCHEMA below.
 * For sim-specific query parameters (if there are any), see *QueryParameters.js in the simulation's repository.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Malley (PixelZoom, Inc.)
 */
(function() {
  'use strict';

  // Schema that describes query parameters for PhET common code.
  // These query parameters are available via global phet.chipper.queryParameters.
  var QUERY_PARAMETERS_SCHEMA = {

    // Whether accessibility features are enabled or not.  Use this option to render the Parallel DOM for
    // keyboard navigation and screen reader based auditory descriptions.
    accessibility: { type: 'flag' },

    /**
     * Master volume control for the simulation (for Vibe sounds).
     * 1.0 is unity volume, 2.0 is double volume, etc.
     */
    audioVolume: {
      type: 'number',
      defaultValue: 1,
      isValidValue: function( value ) { return value >= 0; }
    },

    /**
     * specifies the brand that should be used in requirejs mode
     */
    brand: {
      type: 'string',
      defaultValue: 'adapted-from-phet',
      validValues: [ 'phet', 'phet-io', 'adapted-from-phet' ]
    },

    /**
     * When present, will trigger changes that are more similar to the build environment.
     * Right now, this includes computing higher-resolution mipmaps for the mipmap plugin.
     */
    buildCompatible: { type: 'flag' },

    /**
     * enables cache busting in requirejs mode.
     */
    cacheBuster: {
      type: 'boolean',
      defaultValue: true
    },

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
     * enables developer-only features, such as showing the layout bounds
     */
    dev: { type: 'flag' },

    /**
     * enables assertions
     */
    ea: { type: 'flag' },

    /**
     * Enables all assertions, as above but with more time-consuming checks
     */
    eall: { type: 'flag' },

    /**
     * Randomly sends mouse events to sim.
     */
    fuzzMouse: { type: 'flag' },

    /**
     * if fuzzMouse=true, this is the average number of mouse events to synthesize per frame.
     */
    fuzzRate: {
      type: 'number',
      defaultValue: 100,
      isValidValue: function( value ) { return value > 0; }
    },

    /**
     * When a simulation is run from the PhET app, it should set this flag. It alters statistics that the sim sends
     * to Google Analytics and potentially other sources in the future.
     */
    'phet-app': { type: 'flag' },

    /**
     * Used for providing a external Google Analytics property for tracking, see
     * https://github.com/phetsims/phetcommon/issues/46 for more information.
     *
     * This is useful for various users/clients that want to embed simulations, or direct users to simulations. For
     * example, if a sim is included in an epub, the sim HTML won't have to be modified to include page tracking.
     */
    ga: {
      type: 'string',
      defaultValue: null
    },

    /**
     * Launches the game-up-camera code which delivers images to requests in BrainPOP/Game Up/SnapThought
     */
    gameUp: { type: 'flag' },

    /**
     * Enables logging for game-up-camera, see gameUp
     */
    gameUpLogging: { type: 'flag' },

    /**
     * Used for providing a Google Analytics page ID for tracking, see
     * https://github.com/phetsims/phetcommon/issues/46 for more information.
     *
     * This is given as the 3rd parameter to a pageview send when provided
     */
    gaPage: {
      type: 'string',
      defaultValue: null
    },

    /**
     * test with a specific locale
     */
    locale: {
      type: 'string',
      defaultValue: 'en'
    },

    /**
     * plays event logging back from the server, provide an optional name for the session
     */
    playbackInputEventLog: { type: 'flag' },

    /**
     * passes errors to test-sims
     */
    postMessageOnError: { type: 'flag' },

    /**
     * triggers a post-message that fires when the sim finishes loading, currently used by aqua test-sims
     */
    postMessageOnLoad: { type: 'flag' },

    /**
     * shows profiling information for the sim
     */
    profiler: { type: 'flag' },

    /**
     * adds a menu item that will open a window with a QR code with the URL of the simulation
     */
    qrCode: { type: 'flag' },

    /**
     * enables input event logging, provide an optional name for the session, log is available via PhET menu
     */
    recordInputEventLog: { type: 'flag' },

    /**
     * Specify a renderer for the Sim's rootNode to use.
     */
    rootRenderer: {
      type: 'string',
      defaultValue: null,
      validValues: [ null, 'canvas', 'svg', 'dom', 'webgl' ] // see Node.setRenderer
    },

    /**
     * Array of one or more logs to enable in scenery 0.2+, delimited with commas.
     * For example: ?sceneryLog=Display,Drawable,WebGLBlock results in [ 'Display', 'Drawable', 'WebGLBlock' ]
     */
    sceneryLog: {
      type: 'array',
      elementSchema: {
        type: 'string'
      },
      defaultValue: null
    },

    /**
     * Scenery logs will be output to a string instead of the window
     */
    sceneryStringLog: { type: 'flag' },

    /**
     * Indicates the screen that will be initially selected on the home screen.
     * If showHomeScreen is false, go immediately to this screen.
     * Like query parameter 'screens', the value is 1-based; e.g. 'screenIndex=2' selects the 2nd screen.
     * Use this query parameter only with multi-screen sims.
     */
    screenIndex: {
      type: 'number',
      defaultValue: 1
    },

    /**
     * Specifies the set of screens that appear in the sim, and their order.  Uses 1-based (not zero-based) and ","
     * delimited string such as "1,3,4" to get the 1st, 3rd and 4th screen.
     */
    screens: {
      type: 'array',
      elementSchema: {
        type: 'number'
      },
      defaultValue: null
    },

    /**
     * Displays an overlay of the current bounds of each CanvasNode
     */
    showCanvasNodeBounds: { type: 'flag' },

    /**
     * Displays an overlay of the current bounds of each scenery.FittedBlock
     */
    showFittedBlockBounds: { type: 'flag' },

    /**
     * if false, go immediately to screenIndex
     */
    showHomeScreen: {
      type: 'boolean',
      defaultValue: true
    },

    /**
     * Shows pointer areas as dashed lines. touchAreas are red, mouseAreas are blue.
     */
    showPointerAreas: { type: 'flag' },

    /**
     * Displays a semi-transparent cursor indicator for the location of each active pointer on the screen.
     */
    showPointers: { type: 'flag' },

    /**
     * Shows the visible bounds in ScreenView.js, for debugging the layout outside of the "dev" bounds
     */
    showVisibleBounds: { type: 'flag' },

    /**
     * override strings, value is JSON that is identical to string.json files
     */
    strings: {
      type: 'string',
      defaultValue: null
    },

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

    /**
     * Enables WebGL rendering. See https://github.com/phetsims/scenery/issues/289
     */
    webgl: {
      type: 'boolean',
      defaultValue: true
    }
  };

  // Initialize query parameters, see docs above
  (function() {

    // Create the attachment point for all PhET globals
    window.phet = window.phet || {};
    window.phet.chipper = window.phet.chipper || {};

    // Read query parameters
    window.phet.chipper.queryParameters = QueryStringMachine.getAll( QUERY_PARAMETERS_SCHEMA );

    /**
     * Gets the cache buster args based on the provided query parameters.  By default it is:
     * ?bust=<number>
     * But this can be omitted if ?cacheBuster=false is provided
     * See https://github.com/phetsims/joist/issues/196
     * @returns {string}
     */
    window.phet.chipper.getCacheBusterArgs = function() {
      return phet.chipper.queryParameters.cacheBuster ? ('bust=' + Date.now()) : '';
    };

    /**
     * Gets the name of brand to use, which determines which logo to show in the navbar as well as what options
     * to show in the PhET menu and what text to show in the About dialog.
     * See https://github.com/phetsims/brand/issues/11
     * @returns {string}
     */
    window.phet.chipper.brand = window.phet.chipper.brand || phet.chipper.queryParameters.brand || 'adapted-from-phet';

    /**
     * Maps an input string to a final string, accommodating tricks like doubleStrings.
     * This function is used to modify all strings in a sim when the stringTest query parameter is used.
     * The stringTest query parameter and its options are documented in the query parameter docs above.
     * It is used in string.js and sim.html.
     * @param string - the string to be mapped
     * @param stringTest - the value of the stringTest query parameter
     * @returns {*}
     */
    window.phet.chipper.mapString = function( string, stringTest ) {
      return stringTest === null ? string :
             stringTest === 'double' ? string + ':' + string :
             stringTest === 'long' ? '12345678901234567890123456789012345678901234567890' :
             stringTest === 'rtl' ? '\u202b\u062a\u0633\u062a (\u0632\u0628\u0627\u0646)\u202c' :
             stringTest === 'xss' ? '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NkYGD4DwABCQEBtxmN7wAAAABJRU5ErkJggg==" onload="window.location.href=atob(\'aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kUXc0dzlXZ1hjUQ==\')" />' :
             stringTest === 'none' ? string :

               //In the fallback case, supply whatever string was given in the query parameter value
             stringTest;
    };

    // If locale was provided as a query parameter, then change the locale used by Google Analytics.
    if ( QueryStringMachine.containsKey( 'locale' ) ) {
      window.phet.chipper.locale = phet.chipper.queryParameters.locale;
    }
  }());

  // Create a random seed in the preload code that can be used to make sure playback simulations use the same seed
  // See Random.js
  // @public (writeable by phet-io) can be overwritten for replicable playback in phet-io.
  window.phet.chipper.randomSeed = Math.random();

  /**
   * Enables or disables assertions in common libraries using query parameters.
   * There are two types of assertions: basic and slow. Enabling slow assertions will adversely impact performance.
   * 'ea' enables basic assertions, 'eall' enables basic and slow assertions.
   * Must be run before RequireJS, and assumes that assert.js and query-parameters.js has been run.
   */
  (function() {

    // TODO: separate this logic out into a more common area?
    var isProduction = $( 'meta[name=phet-sim-level]' ).attr( 'content' ) === 'production';

    var enableAllAssertions = !isProduction && phet.chipper.queryParameters.eall; // enables all assertions (basic and slow)
    var enableBasicAssertions = enableAllAssertions || ( !isProduction && phet.chipper.queryParameters.ea );  // enables basic assertions

    if ( enableBasicAssertions ) {
      window.assertions.enableAssert();
    }
    if ( enableAllAssertions ) {
      window.assertions.enableAssertSlow();
    }

    // Communicate sim errors to joist/tests/test-sims.html
    if ( phet.chipper.queryParameters.postMessageOnError ) {
      window.addEventListener( 'error', function( a, b, c, d, e ) {
        var message = '';
        var stack = '';
        if ( a && a.message ) {
          message = a.message;
        }
        if ( a && a.error && a.error.stack ) {
          stack = a.error.stack;
        }
        window.parent && window.parent.postMessage( JSON.stringify( {
          type: 'error',
          url: window.location.href,
          message: message,
          stack: stack
        } ), '*' );
      } );
    }
  }());
}());
