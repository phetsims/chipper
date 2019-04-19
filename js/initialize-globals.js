// Copyright 2015-2016, University of Colorado Boulder
/* eslint-disable bad-sim-text */

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
( function() {
  'use strict';

  // Note: the following jsdoc is for the public facing phet-io api. In addition, all query parameters in the schema
  // that are a "memberOf" the "PhetQueryParameters" namespace are used in the jsdoc that is public (client facing)
  // phet-io documentation. Private comments about implementation details will be in comments above the jsdoc, and
  // marked as such.
  // Note: this had to be jsdoc directly for QUERY_PARAMETERS_SCHEMA to support the correct auto formatting.

  /**
   * Query parameters that manipulate the startup state of the PhET simulation. This is not
   * an object defined in the global scope, but rather it serves as documentation about available query parameters.
   * Note: The "flag" type for query parameters does not expect a value for the key, but rather just the presence of
   * the key itself.
   * @namespace {Object} PhetQueryParameters
   */
  var QUERY_PARAMETERS_SCHEMA = {
    // Schema that describes query parameters for PhET common code.
    // These query parameters are available via global phet.chipper.queryParameters.

    /**
     * Whether accessibility features are enabled or not.  Use this option to render the Parallel DOM for
     * keyboard navigation and screen reader based auditory descriptions. This query parameter is meant for internal
     * use only, simulations published with accessibility enabled should use the Sim option `accessibility: true`.
     */
    accessibility: { type: 'flag' },

    /**
     * An alias for the "accessibility" query parameter above. Shorter and easier to type for convenience, see
     * https://github.com/phetsims/chipper/issues/716. Like "accessibility", meant for internal use only though
     * collaborators could use this.
     */
    a11y: { type: 'flag' },

    /**
     * Master volume control for the simulation.  Range is from 0 to 1, which is typical for web audio gain nodes.
     * 1.0 is unity volume, 0.5 is half volume, etc. This is primarily for Vibe sounds.
     * @deprecated see https://github.com/phetsims/vibe/issues/33
     * @type {number}
     */
    audioVolume: {
      type: 'number',
      defaultValue: 1,
      isValidValue: function( value ) { return value >= 0 && value <= 1; }
    },

    /**
     * Generates object reports that can be used by binder. For internal use.
     * See InstanceRegistry.js and binder repo (specifically getFromSimInMaster.js) sfor more details.
     */
    binder: { type: 'flag' },

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
     * Such sims are required to have a 'default' profile.  If a sim supports a 'projector mode' then
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
     * Controls whether enhanced sound is on or off at startup (user can change later)
     * @type {boolean}
     */
    enhancedSoundInitiallyEnabled: {
      type: 'boolean',
      defaultValue: false
    },

    /**
     * Randomly sends mouse events and touch events to sim.
     */
    fuzz: { type: 'flag' },

    /**
     * Randomly sends keyboard events to the sim. Must have accessibility enabled.
     */
    fuzzBoard: { type: 'flag' },

    /**
     * Randomly sends mouse events to sim.
     */
    fuzzMouse: { type: 'flag' },

    /**
     * The maximum number of concurrent pointers allowed for fuzzing. Using a value larger than 1 will test multitouch
     * behavior (with ?fuzz, ?fuzzMouse, ?fuzzTouch, etc.)
     */
    fuzzPointers: {
      type: 'number',
      defaultValue: 1
    },

    /**
     * Randomly sends touch events to sim.
     */
    fuzzTouch: { type: 'flag' },

    /**
     * if fuzzMouse=true or fuzzTouch=true, this is the average number of mouse/touch events to synthesize per frame.
     */
    fuzzRate: {
      type: 'number',
      defaultValue: 100,
      isValidValue: function( value ) { return value > 0; }
    },

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

    // Private doc:  For external use. The below jsdoc is public to the phet-io api documentation. Change wisely.
    /**
     * Indicates whether to display the home screen.
     * For multi-screen sims only, throws an assertion error if supplied for a single-screen sim.
     * @memberOf PhetQueryParameters
     * @type {boolean}
     */
    homeScreen: {
      type: 'boolean',
      defaultValue: true
    },

    // Private doc: For external use. The below jsdoc is public to the phet-io api documentation. Change wisely.
    // The value is one of the values in the screens array, not an index into the screens array.
    /**
     * Specifies the initial screen that will be visible when the sim starts.
     * See `?screens` query parameter for screen numbering.
     * For multi-screen sims only, throws an assertion error if applied in a single-screen sims.
     * The default value of 0 is the home screen.
     * @memberOf PhetQueryParameters
     * @type {number}
     */
    initialScreen: {
      type: 'number',
      defaultValue: 0 // the home screen
    },

    /**
     * Enables support for Legends of Learning platform, including broadcasting 'init' and responding to pause/resume.
     */
    legendsOfLearning: { type: 'flag' },

    /**
     * test with a specific locale
     */
    locale: {
      type: 'string',
      defaultValue: 'en'
    },

    /**
     * Enables basic logging to the console.
     * Usage in code: phet.log && phet.log( 'your message' );
     */
    log: { type: 'flag' },

    /**
     * Sets a maximum "memory" limit (in MB). If the simulation's running average of memory usage goes over this amount
     * in operation (as determined currently by using Chome's window.performance), then an error will be thrown.
     *
     * This is useful for continuous testing, to ensure we aren't leaking huge amounts of memory, and can also be used
     * with the Chrome command-line flag --enable-precise-memory-info to make the determination more accurate.
     *
     * The value 0 will be ignored, since our sims are likely to use more than that much memory.
     */
    memoryLimit: {
      type: 'number',
      defaultValue: 0
    },

    /**
     * Enables transforming the PDOM for accessibility on mobile devices. This work is experimental, and still hidden
     * in a scenery branch pdom-transform. Must be used in combination with the accessibility query parameter, or
     * on a sim that has accessibility enabled by default. This query parameter is not intended to be long lived,
     * in the future these features should be always enabled in the scenery a11y framework.
     * See https://github.com/phetsims/scenery/issues/852
     *
     * For internal use and testing only, though links with this may be shared with collaborators.
     *
     * @a11y
     */
    mobileA11yTest: { type: 'flag' },

    /**
     * When a simulation is run from the PhET iOS app, it should set this flag. It alters statistics that the sim sends
     * to Google Analytics and potentially other sources in the future.
     */
    'phet-app': { type: 'flag' },

    /**
     * When a simulation is run from the PhET Android app, it should set this flag. It alters statistics that the sim sends
     * to Google Analytics and potentially other sources in the future.
     */
    'phet-android-app': { type: 'flag' },

    /**
     * plays event logging back from the server, provide an optional name for the session
     */
    playbackInputEventLog: { type: 'flag' },

    /**
     * If true, puts the simulation in a special mode where it will wait for manual control of the sim playback.
     */
    playbackMode: {
      type: 'boolean',
      defaultValue: false
    },

    /**
     * Fires a post-message when the sim is about to change to another URL
     */
    postMessageOnBeforeUnload: { type: 'flag' },

    /**
     * passes errors to test-sims
     */
    postMessageOnError: { type: 'flag' },

    /**
     * triggers a post-message that fires when the sim finishes loading, currently used by aqua test-sims
     */
    postMessageOnLoad: { type: 'flag' },

    /**
     * triggers a post-message that fires when the simulation is ready to start.
     */
    postMessageOnReady: { type: 'flag' },

    /**
     * Controls whether the preserveDrawingBuffer:true is set on WebGL Canvases. This allows canvas.toDataURL() to work
     * (used for certain methods that require screenshot generation using foreign object rasterization, etc.).
     * Generally reduces WebGL performance, so it should not always be on (thus the query parameter).
     */
    preserveDrawingBuffer: { type: 'flag' },
    
    /**
     * shows profiling information for the sim
     */
    profiler: { type: 'flag' },

    /**
     * adds a menu item that will open a window with a QR code with the URL of the simulation
     */
    qrCode: { type: 'flag' },

    /**
     * Random seed in the preload code that can be used to make sure playback simulations use the same seed (and thus
     * the simulation state, given the input events and frames, can be exactly reproduced)
     * See Random.js
     */
    randomSeed: {
      type: 'number',
      defaultValue: Math.random()
    },

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
     * Don't change this without updating the signature in scenery unit tests too.
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

    // Private doc: For external use. The below jsdoc is public to the phet-io api documentation. Change wisely.
    /**
     * Specifies the set of screens that appear in the sim, and their order.
     * Uses 1-based (not zero-based) and "," delimited string such as "1,3,4" to get the 1st, 3rd and 4th screen.
     * @memberOf PhetQueryParameters
     * @type {Array.<number>}
     */
    screens: {
      type: 'array',
      elementSchema: {
        type: 'number'
      },
      defaultValue: null,
      isValidValue: function( value ) {

        // screen indices cannot be duplicated
        return value === null || ( value.length === _.uniq( value ).length );
      }
    },

    /**
     * Typically used to show answers (or hidden controls that show answers) to challenges in sim games.
     * For internal use by PhET team members only.
     */
    showAnswers: {
      type: 'flag',
      private: true
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

    // Private doc:  For external use. The below jsdoc is public to the phet-io api documentation. Change wisely.
    /**
     * Allows setting of the sound state, possible values are 'enabled' (default), 'muted', and 'disabled'.  Sound
     * must be supported by the sim for this to have any effect.
     * @memberOf PhetQueryParameters
     * @type {string}
     */
    sound: {
      type: 'string',
      defaultValue: 'enabled',
      validValues: [ 'enabled', 'disabled', 'muted' ]
    },

    /**
     * Speed multiplier for everything in the sim. This scales the value of dt for AXON/timer,
     * model.step, view.step, and anything else that is controlled from Sim.stepSimulation.
     * Normal speed is 1. Larger values make time go faster, smaller values make time go slower.
     * For example, ?speed=0.5 is half the normal speed.
     * Useful for testing multi-touch, so that objects are easier to grab while they're moving.
     * For internal use only, not public facing.
     */
    speed: {
      type: 'number',
      defaultValue: 1,
      isValidValue: function( value ) {
        return value > 0;
      }
    },

    /**
     * Override translated strings.
     * The value is encoded JSON of the form { "namespace.key":"value", "namespace.key":"value", ... }
     * Example: { "PH_SCALE/logarithmic":"foo", "PH_SCALE/linear":"bar" }
     * Encode the JSON in a browser console using: encodeURIComponent( JSON.stringify( value ) )
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
     *   other versions where assertions are not enabled.
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
     * Indicates whether enhanced sounds are used in addition to basic sounds as part of the sound design.  If true, the
     * PhET menu will have an option for enabling enhanced sounds.  This should never be set when the tambo sound lib is
     * NOT being used.
     * Primarily for internal use, though we may share links with collaborates that use this parameter.
     */
    supportsEnhancedSound: { type: 'flag' },

    /**
     * Indicates whether the sound library should be enabled.  If true, an icon is added to the nav bar icon to enable
     * the user to turn sound on/off.  There is also a Sim option for enabling sound which can override this.
     * Primarily for internal use, though we may share links with collaborates that use this parameter.
     */
    supportsSound: { type: 'flag' },

    /**
     * Enables WebGL rendering. See https://github.com/phetsims/scenery/issues/289
     */
    webgl: {
      type: 'boolean',
      defaultValue: true
    }
  };

  // Initialize query parameters, see docs above
  ( function() {

    // Create the attachment point for all PhET globals
    window.phet = window.phet || {};
    window.phet.chipper = window.phet.chipper || {};

    // Read query parameters
    window.phet.chipper.queryParameters = QueryStringMachine.getAll( QUERY_PARAMETERS_SCHEMA );

    // Add a log function that displays messages to the console. Examples:
    // phet.log && phet.log( 'You win!' );
    // phet.log && phet.log( 'You lose', { color: 'red' } );
    if ( window.phet.chipper.queryParameters.log ) {
      window.phet.log = function( message, options ) {
        options = _.extend( {
          color: '#009900' // green
        }, options );
        console.log( '%c' + message, 'color: ' + options.color ); // green
      };
    }

    /**
     * Gets the cache buster args based on the provided query parameters.  By default it is:
     * ?bust=<number>
     * But this can be omitted if ?cacheBuster=false is provided
     * See https://github.com/phetsims/joist/issues/196
     * @returns {string}
     */
    window.phet.chipper.getCacheBusterArgs = function() {
      return phet.chipper.queryParameters.cacheBuster ? ( 'bust=' + Date.now() ) : '';
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
     * @returns {string}
     */
    window.phet.chipper.mapString = function( string, stringTest ) {
      return stringTest === null ? string :
             stringTest === 'double' ? string + ':' + string :
             stringTest === 'long' ? '12345678901234567890123456789012345678901234567890' :
             stringTest === 'rtl' ? '\u202b\u062a\u0633\u062a (\u0632\u0628\u0627\u0646)\u202c' :
             stringTest === 'xss' ? string + '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NkYGD4DwABCQEBtxmN7wAAAABJRU5ErkJggg==" onload="window.location.href=atob(\'aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kUXc0dzlXZ1hjUQ==\')" />' :
             stringTest === 'none' ? string :

               //In the fallback case, supply whatever string was given in the query parameter value
             stringTest;
    };

    // If locale was provided as a query parameter, then change the locale used by Google Analytics.
    if ( QueryStringMachine.containsKey( 'locale' ) ) {
      window.phet.chipper.locale = phet.chipper.queryParameters.locale;
    }
  }() );

  /** Create a random seed in the preload code that can be used to make sure playback simulations use the same seed
   * See `Random.js`
   * @public (writable by phet-io) can be overwritten for replicable playback in phet-io.
   * @type {number}
   */
  window.phet.chipper.randomSeed = phet.chipper.queryParameters.randomSeed;

  /**
   * Global flag that indicates whether accessibility is enabled for the simulation
   * @public (writable by joist) can be overwritten in the constructor of Sim.js
   * @type {boolean}
   */
  window.phet.chipper.accessibility = phet.chipper.queryParameters.accessibility || phet.chipper.queryParameters.a11y;

  /**
   * Utility function to pause synchronously for the given number of milliseconds.
   * @param {number} millis - amount of time to pause synchronously
   */
  function sleep( millis ) {
    var date = new Date();
    var curDate;
    do {
      curDate = new Date();
    } while ( curDate - date < millis );
  }

  /*
   * These are used to make sure our sims still behave properly with an artificially higher load (so we can test what happens
   * at 30fps, 5fps, etc). There tend to be bugs that only happen on less-powerful devices, and these functions facilitate
   * testing a sim for robustness, and allowing others to reproduce slow-behavior bugs.
   */
  window.phet.chipper.makeEverythingSlow = function() {
    window.setInterval( function() { sleep( 64 ); }, 16 );
  };
  window.phet.chipper.makeRandomSlowness = function() {
    window.setInterval( function() { sleep( Math.ceil( 100 + Math.random() * 200 ) ); }, Math.ceil( 100 + Math.random() * 200 ) );
  };

  // Are we running a built html file?
  window.phet.chipper.isProduction = $( 'meta[name=phet-sim-level]' ).attr( 'content' ) === 'production';

  /**
   * Enables or disables assertions in common libraries using query parameters.
   * There are two types of assertions: basic and slow. Enabling slow assertions will adversely impact performance.
   * 'ea' enables basic assertions, 'eall' enables basic and slow assertions.
   * Must be run before RequireJS, and assumes that assert.js and query-parameters.js has been run.
   */
  ( function() {

    // enables all assertions (basic and slow)
    var enableAllAssertions = !phet.chipper.isProduction && phet.chipper.queryParameters.eall;

    // enables basic assertions
    var enableBasicAssertions = enableAllAssertions ||
                                ( !phet.chipper.isProduction && phet.chipper.queryParameters.ea ) ||
                                phet.chipper.isDebugBuild;

    if ( enableBasicAssertions ) {
      window.assertions.enableAssert();
    }
    if ( enableAllAssertions ) {
      window.assertions.enableAssertSlow();
    }

    // Communicate sim errors to joist/tests/test-sims.html
    if ( phet.chipper.queryParameters.postMessageOnError ) {
      window.addEventListener( 'error', function( a ) {
        var message = '';
        var stack = '';
        if ( a && a.message ) {
          message = a.message;
        }
        if ( a && a.error && a.error.stack ) {
          stack = a.error.stack;
        }
        ( window.parent !== window ) && window.parent.postMessage( JSON.stringify( {
          type: 'error',
          url: window.location.href,
          message: message,
          stack: stack
        } ), '*' );
      } );
    }

    if ( phet.chipper.queryParameters.postMessageOnBeforeUnload ) {
      window.addEventListener( 'beforeunload', function( e ) {
        ( window.parent !== window ) && window.parent.postMessage( JSON.stringify( {
          type: 'beforeUnload'
        } ), '*' );
      } );
    }
  }() );
}() );
