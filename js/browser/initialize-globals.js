// Copyright 2015-2025, University of Colorado Boulder

/**
 * Initializes phet globals that are used by all simulations, including assertions and query-parameters.
 * See https://github.com/phetsims/phetcommon/issues/23
 * This file must be loaded before the simulation is started up, and this file cannot be loaded as an AMD module.
 * The easiest way to do this is via a <script> tag in your HTML file.
 *
 * PhET Simulations can be launched with query parameters which enable certain features.  To use a query parameter,
 * provide the full URL of the simulation and append a question mark (?) then the query parameter (and optionally its
 * value assignment).  For instance:
 * https://phet-dev.colorado.edu/html/reactants-products-and-leftovers/1.0.0-dev.13/reactants-products-and-leftovers_en.html?dev
 *
 * Here is an example of a value assignment:
 * https://phet-dev.colorado.edu/html/reactants-products-and-leftovers/1.0.0-dev.13/reactants-products-and-leftovers_en.html?webgl=false
 *
 * To use multiple query parameters, specify the question mark before the first query parameter, then ampersands (&)
 * between other query parameters.  Here is an example of multiple query parameters:
 * https://phet-dev.colorado.edu/html/reactants-products-and-leftovers/1.0.0-dev.13/reactants-products-and-leftovers_en.html?dev&showPointerAreas&webgl=false
 *
 * For more on query parameters in general, see http://en.wikipedia.org/wiki/Query_string
 * For details on common-code query parameters, see QUERY_PARAMETERS_SCHEMA below.
 * For sim-specific query parameters (if there are any), see *QueryParameters.js in the simulation's repository.
 *
 * Many of these query parameters' jsdoc is rendered and visible publicly to PhET-iO client. Those sections should be
 * marked, see top level comment in PhetioClient.js about private vs public documentation
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Malley (PixelZoom, Inc.)
 */
( function() {

  assert && assert( window.QueryStringMachine, 'QueryStringMachine is used, and should be loaded before this code runs' );

  // Create the attachment point for all PhET globals
  window.phet = window.phet ?? {};
  window.phet.preloads = window.phet.preloads || {};
  window.phet.chipper = window.phet.chipper ?? {};

  // packageObject may not always be available if initialize-globals used without chipper-initialization.js
  const packageObject = phet.chipper.packageObject ?? {};
  const packagePhet = packageObject.phet ?? {};

  // Not all runtimes will have this flag, so be graceful
  const allowLocaleSwitching = phet.chipper.allowLocaleSwitching ?? true;

  // duck type defaults so that not all package.json files need to have a phet.simFeatures section.
  const packageSimFeatures = packagePhet.simFeatures ?? {};

  // The color profile used by default, if no colorProfiles are specified in package.json.
  // NOTE: Duplicated in SceneryConstants.js since scenery does not include initialize-globals.js
  const DEFAULT_COLOR_PROFILE = 'default';

  const FALLBACK_LOCALE = 'en';

  // The possible color profiles for the current simulation.
  const colorProfiles = packageSimFeatures.colorProfiles ?? [ DEFAULT_COLOR_PROFILE ];

  // Private Doc: Note: the following jsdoc is for the public facing PhET-iO API. In addition, all query parameters in the schema
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
  const QUERY_PARAMETERS_SCHEMA = {
    // Schema that describes query parameters for PhET common code.
    // These query parameters are available via global phet.chipper.queryParameters.

    /**
     * In environments where users should not be able to navigate hyperlinks away from the simulation, clients can use
     * ?allowLinks=false.  In this case, links are displayed and not clickable. This query parameter is public facing.
     * @memberOf PhetQueryParameters
     * @type {boolean}
     */
    allowLinks: {
      type: 'boolean',
      defaultValue: true,
      public: true
    },

    /**
     * Allows setting of the sound state, possible values are 'enabled' (default), 'muted', and 'disabled'.  Sound
     * must be supported by the sim for this to have any effect.
     * @memberOf PhetQueryParameters
     * @type {string}
     */
    audio: {
      type: 'string',
      defaultValue: 'enabled',
      validValues: [ 'enabled', 'disabled', 'muted' ],
      public: true
    },

    /**
     * Generates object reports that can be used by binder. For internal use.
     * See InstanceRegistry.js and binder repo (specifically getFromSimInMain.js) for more details.
     */
    binder: { type: 'flag' },

    /**
     * specifies the brand that should be used in unbuilt mode
     */
    brand: {
      type: 'string',
      defaultValue: 'adapted-from-phet'
    },

    /**
     * When present, will trigger changes that are more similar to the build environment.
     * Right now, this includes computing higher-resolution mipmaps for the mipmap plugin.
     */
    buildCompatible: { type: 'flag' },

    /**
     * When provided a non-zero-length value, the sim will send out assorted events meant for continuous testing
     * integration (see sim-test.js).
     */
    continuousTest: {
      type: 'string',
      defaultValue: ''
    },

    // Private Doc:  For external use. The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * The color profile used at startup, relevant only for sims that support multiple color profiles. 'default' and
     * 'projector' are implemented in several sims, other profile names are not currently standardized.
     * @memberOf PhetQueryParameters
     * @type {string}
     */
    colorProfile: {
      type: 'string',
      defaultValue: colorProfiles[ 0 ], // usually "default", but some sims like masses-and-springs-basics do not use default at all
      validValues: colorProfiles,
      public: true
    },

    /**
     * For memory profiling, it can sometimes be difficult to know when the app crashed and automatically restarted itself.
     * This flag will show the launch counter so you can tell how many times it has been launched.
     *
     * NOTE: There is no easy way to clear the local storage for this value, so correct usage would focus on the differences
     * in values rather than the absolute values.
     */
    launchCounter: {
      type: 'flag'
    },

    /**
     * enables debugger commands in certain cases like thrown errors and failed tests.
     */
    debugger: { type: 'flag' },

    // Output deprecation warnings via console.warn, see https://github.com/phetsims/chipper/issues/882. For internal
    // use only.
    deprecationWarnings: { type: 'flag' },

    /**
     * enables developer-only features, such as showing the layout bounds
     */
    dev: { type: 'flag' },


    /**
     * sets all modal features of the sim as disabled. This is a development-only parameter that can be useful in
     * combination with fuzz testing. This was created to limit the amount of time fuzz testing spends on unimportant
     * features of the sim like the PhET Menu, Keyboard Help, and Preferences popups.
     */
    disableModals: { type: 'flag' },

    /**
     * enables assertions
     */
    ea: { type: 'flag' },

    /**
     * Enables all assertions, as above but with more time-consuming checks
     */
    eall: { type: 'flag' },

    /**
     * Controls whether extra sound is on or off at startup (user can change later).  This query parameter is public
     * facing.
     * @type {boolean}
     */
    extraSoundInitiallyEnabled: {
      type: 'flag',
      public: true
    },

    fluentTable: {
      type: 'string',
      defaultValue: 'none'
    },

    /**
     * Force Scenery to refresh SVG contents every frame (to help detect rendering/browser-repaint issues with SVG).
     */
    forceSVGRefresh: { type: 'flag' },

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
     * Used for providing an external Google Analytics 4 (gtag.js) property for tracking, see
     * https://github.com/phetsims/phetcommon/issues/46 for more information.
     *
     * Generally, this string will start with 'G-' for GA4 trackers
     *
     * This is useful for various users/clients that want to embed simulations, or direct users to simulations. For
     * example, if a sim is included in an epub, the sim HTML won't have to be modified to include page tracking.
     */
    ga4: {
      type: 'string',
      defaultValue: null,
      public: true
    },

    /**
     * Launches the game-up-camera code which delivers images to requests in BrainPOP/Game Up/SnapThought
     */
    gameUp: { type: 'flag' },

    /**
     * Enables the game-up-camera code to respond to messages from any origin
     */
    gameUpTestHarness: { type: 'flag' },

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

    // Private Doc:  For external use. The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    /**
     * Indicates whether to display the home screen.
     * For multiscreen sims only, throws an assertion error if supplied for a single-screen sim.
     * @memberOf PhetQueryParameters
     * @type {boolean}
     */
    homeScreen: {
      type: 'boolean',
      defaultValue: true,
      public: true
    },

    // Private Doc: For external use. The below jsdoc is public to the PhET-iO API documentation. Change wisely.
    // The value is one of the values in the screens array, not an index into the screens array.
    /**
     * Specifies the initial screen that will be visible when the sim starts.
     * See `?screens` query parameter for screen numbering.
     * For multiscreen sims only, throws an assertion error if applied in a single-screen sims.
     * The default value of 0 is the home screen.
     * @memberOf PhetQueryParameters
     * @type {number}
     */
    initialScreen: {
      type: 'number',
      defaultValue: 0, // the home screen
      public: true
    },

    /**
     * If true, and a second touch is detected, it will interrupt the first (active)
     * touch. See https://github.com/phetsims/scenery/issues/1684.
     *
     * See https://github.com/phetsims/scenery/issues/1684
     */
    interruptMultitouch: {
      type: 'boolean',
      defaultValue: packagePhet?.simFeatures?.interruptMultitouch ?? false
    },

    /**
     * Enables support for Legends of Learning platform, including broadcasting 'init' and responding to pause/resume.
     */
    legendsOfLearning: { type: 'flag' },

    /**
     * If this is a finite number AND assertions are enabled, it will track maximum (TinyEmitter) listener counts, and
     * will assert that the count is not greater than the limit.
     */
    listenerLimit: {
      type: 'number',
      defaultValue: Number.POSITIVE_INFINITY,
      public: false
    },

    /**
     * Select the language of the sim to the specific locale. Default to "en".
     * @memberOf PhetQueryParameters
     * @type {string}
     */
    locale: {
      type: 'string',
      defaultValue: window.phet.chipper.locale ?? FALLBACK_LOCALE
      // Do NOT add the `public` key here. We want invalid values to fall back to en.
    },

    /**
     * Specify supports for dynamic locale switching in the runtime of the sim. By default, the value will be the support
     * in the runnable's package.json. Use this to turn off things like the locale switcher preference.
     * The package flag for this means very specific things depending on its presence and value.
     * - By default, with no entry in the package.json, dynamic locale switching will not be available. This is to ensure
     * the package flag is used consistently when a sim supports this, see https://github.com/phetsims/joist/issues/1005
     * - If you add the truthy flag (`"supportsDynamicLocale": true`), then it will ensure that strings use StringProperties
     * in your sim.
     * - If you do not want to support this, then you can opt out in the package.json with `"supportsDynamicLocale": false`
     *
     * For more information about supporting dynamic locale, see the "Dynamic Strings Layout Quickstart Guide": https://github.com/phetsims/phet-info/blob/main/doc/dynamic-string-layout-quickstart.md
     */
    supportsDynamicLocale: {
      type: 'boolean',
      defaultValue: allowLocaleSwitching && !!packageSimFeatures.supportsDynamicLocale
    },

    /**
     * Enables basic logging to the console.
     * Usage in code: phet.log && phet.log( 'your message' );
     */
    log: { type: 'flag' },

    /**
     * Sets a maximum "memory" limit (in MB). If the simulation's running average of memory usage goes over this amount
     * in operation (as determined currently by using Chrome's window.performance), then an error will be thrown.
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
     * on a sim that has accessibility enabled by default. This query parameter is not intended to be long-lived,
     * in the future these features should be always enabled in the scenery a11y framework.
     * See https://github.com/phetsims/scenery/issues/852
     *
     * For internal use and testing only, though links with this may be shared with collaborators.
     *
     * @a11y
     */
    mobileA11yTest: { type: 'flag' },

    /**
     * When a simulation is run from the PhET Android app, it should set this flag. It alters statistics that the sim sends
     * to Google Analytics and potentially other sources in the future.
     *
     * Also removes the following items from the "PhET Menu":
     * Report a Problem
     * Check for Updates
     * Screenshot
     * Full Screen
     */
    'phet-android-app': { type: 'flag' },

    /**
     * When a simulation is run from the PhET iOS app, it should set this flag. It alters statistics that the sim sends
     * to Google Analytics and potentially other sources in the future.
     *
     * Also removes the following items from the "PhET Menu":
     * Report a Problem
     * Check for Updates
     * Screenshot
     * Full Screen
     */
    'phet-app': { type: 'flag' },

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
     * passes errors to parent frame (like fuzz-lightyear)
     */
    postMessageOnError: { type: 'flag' },

    /**
     * triggers a post-message that fires when the sim finishes loading, currently used by aqua fuzz-lightyear
     */
    postMessageOnLoad: { type: 'flag' },

    /**
     * triggers a post-message that fires when the simulation is ready to start.
     */
    postMessageOnReady: { type: 'flag' },

    /**
     * If true, the full screen button won't be shown in the phet menu
     */
    preventFullScreen: { type: 'flag' },

    /**
     * Allows prevention of multitouch in the sim (if for some reason the sim
     * cannot be made to work gracefully with multitouch).
     *
     * This will mainly prevent multiple touch-level pointers, but mouse + touch
     * or multiple mice will still be possible.
     *
     * See https://github.com/phetsims/scenery/issues/1684
     */
    preventMultitouch: {
      type: 'boolean',
      defaultValue: packagePhet?.simFeatures?.preventMultitouch ?? false
    },

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

    /*
     * Sets the default for the Region and Culture feature. The set of valid values is determined by
     * "supportedRegionsAndCulturesValues" in package.json. If not provided in the URL, the default can
     * be set via "defaultRegionAndCulture" in package.json, which defaults to 'usa'.
     */
    regionAndCulture: {
      public: true,
      type: 'string',
      defaultValue: packagePhet?.simFeatures?.defaultRegionAndCulture ?? 'usa'
    },

    /**
     * Specify a renderer for the Sim's rootNode to use.
     */
    rootRenderer: {
      type: 'string',
      defaultValue: null,
      validValues: [ null, 'canvas', 'svg', 'dom', 'webgl', 'vello' ] // see Node.setRenderer
    },

    /**
     * Array of one or more logs to enable in scenery 0.2+, delimited with commas.
     * For example: ?sceneryLog=Display,Drawable,WebGLBlock results in [ 'Display', 'Drawable', 'WebGLBlock' ]
     * Don't change this without updating the signature in scenery unit tests too.
     *
     * The entire supported list is in scenery.js in the logProperties object.
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
     * Specifies the set of screens that appear in the sim, and their order.
     * Uses 1-based (not zero-based) and "," delimited string such as "1,3,4" to get the 1st, 3rd and 4th screen.
     * @type {Array.<number>}
     */
    screens: {
      type: 'array',
      elementSchema: {
        type: 'number',
        isValidValue: Number.isInteger
      },
      defaultValue: null,
      isValidValue: function( value ) {

        // screen indices cannot be duplicated
        return value === null || ( value.length === _.uniq( value ).length && value.length > 0 );
      },
      public: true
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
     * Displays an overlay of the current bounds of each phet.scenery.FittedBlock
     */
    showFittedBlockBounds: { type: 'flag' },

    /**
     * Shows hit areas as dashed lines.
     */
    showHitAreas: { type: 'flag' },

    /**
     * Shows pointer areas as dashed lines. touchAreas are red, mouseAreas are blue.
     */
    showPointerAreas: { type: 'flag' },

    /**
     * Displays a semi-transparent cursor indicator for the position of each active pointer on the screen.
     */
    showPointers: { type: 'flag' },

    /**
     * Shows the visible bounds in ScreenView.js, for debugging the layout outside the "dev" bounds
     */
    showVisibleBounds: { type: 'flag' },

    /**
     * Shuffles listeners each time they are notified, to help us test order dependency, see https://github.com/phetsims/axon/issues/215
     *
     * 'default' - no shuffling
     * 'random' - chooses a seed for you
     * 'random(123)' - specify a seed
     * 'reverse' - reverse the order of listeners
     */
    listenerOrder: {
      type: 'string',
      defaultValue: 'default',
      isValidValue: function( value ) {

        // NOTE: this regular expression must be maintained in TinyEmitter.ts as well.
        const regex = /random(?:%28|\()(\d+)(?:%29|\))/;

        return value === 'default' || value === 'random' || value === 'reverse' || value.match( regex );
      }
    },

    /**
     * When true, use SpeechSynthesisParentPolyfill to assign an implementation of SpeechSynthesis
     * to the window so that it can be used in platforms where it otherwise would not be available.
     * Assumes that an implementation of SpeechSynthesis is available from a parent iframe window.
     * See SpeechSynthesisParentPolyfill in utterance-queue for more information.
     *
     * This cannot be a query parameter in utterance-queue because utterance-queue (a dependency of scenery)
     * can not use QueryStringMachine. See https://github.com/phetsims/scenery/issues/1366.
     *
     * For more information about the motivation for this see https://github.com/phetsims/fenster/issues/3
     *
     * For internal use only.
     */
    speechSynthesisFromParent: {
      type: 'flag'
    },

    /**
     * Speed multiplier for everything in the sim. This scales the value of dt for AXON/timer,
     * model.step, view.step, and anything else that is controlled from Sim.stepSimulation.
     * Normal speed is 1. Larger values make time go faster, smaller values make time go slower.
     * For example, ?speed=0.5 is half the normal speed.
     * Useful for testing multitouch, so that objects are easier to grab while they're moving.
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
     * dynamic: adds global hotkey listeners to change the strings, see https://github.com/phetsims/chipper/issues/1319
     *   right arrow - doubles a string, like string = string+string
     *   left arrow - halves a string
     *   up arrow - cycles to next stride in random word list
     *   down arrow - cycles to previous stride in random word list
     *   spacebar - resets to initial English strings, and resets the stride
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
     * adds keyboard shortcuts. ctrl+i (forward) or ctrl+u (backward). Also, the same physical keys on the
     * dvorak keyboard (c=forward and g=backwards)
     *
     * NOTE: DUPLICATION ALERT. Don't change this without looking at parameter in PHET_IO_WRAPPERS/PhetioClient.ts
     */
    keyboardLocaleSwitcher: {
      type: 'flag'
    },

    /**
     * Enables support for the accessible description plugin feature.
     */
    supportsDescriptionPlugin: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsDescriptionPlugin
    },

    /**
     *
     * Enables interactive description in the simulation. Use this option to render the Parallel DOM for keyboard
     * navigation and screen-reader-based auditory descriptions. Can be permanently enabled if
     * `supportsInteractiveDescription: true` is added under the `phet.simFeatures` entry of package.json. Query parameter
     * value will always override package.json entry.
     */
    supportsInteractiveDescription: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsInteractiveDescription
    },

    /**
     * Enables support for the "Interactive Highlights" feature, where highlights appear around interactive
     * UI components. This is most useful for users with low vision and makes it easier to identify interactive
     * components. Though enabled here, the feature will be turned off until enabled by the user from the Preferences
     * dialog.
     *
     * This feature is enabled by default whenever supportsInteractiveDescription is true in package.json, since PhET
     * wants to scale out this feature with all sims that support alternative input. The feature can be DISABLED when
     * supportsInteractiveDescription is true by setting `supportsInteractiveHighlights: false` under
     * `phet.simFeatures` in package.json.
     *
     * The query parameter will always override the package.json entry.
     */
    supportsInteractiveHighlights: {
      type: 'boolean',

      // If supportsInteractiveHighlights is explicitly provided in package.json, use that value. Otherwise, enable
      // Interactive Highlights when Interactive Description is supported.
      defaultValue: packageSimFeatures.hasOwnProperty( 'supportsInteractiveHighlights' ) ?
                    !!packageSimFeatures.supportsInteractiveHighlights : !!packageSimFeatures.supportsInteractiveDescription
    },

    /**
     * By default, Interactive Highlights are disabled on startup. Provide this flag to have the feature enabled on
     * startup. Has no effect if supportsInteractiveHighlights is false.
     */
    interactiveHighlightsInitiallyEnabled: {
      type: 'flag',
      public: true
    },

    /**
     * Indicates whether custom gesture control is enabled by default in the simulation.
     * This input method is still in development, mostly to be used in combination with the voicing
     * feature. It allows you to swipe the screen to move focus, double tap the screen to activate
     * components, and tap and hold to initiate custom gestures.
     *
     * For internal use, though may be used in shared links with collaborators.
     */
    supportsGestureControl: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsGestureControl
    },

    /**
     * Controls whether the "Voicing" feature is enabled.
     *
     * This feature is enabled by default when supportsVoicing is true in package.json. The query parameter will always
     * override the package.json entry.
     */
    supportsVoicing: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsVoicing
    },

    /**
     * Controls whether Core Voicing is enabled. This is a subset of the Voicing feature, the VoicingToolbar,
     * name responses, and hint responses are all avialable. Context and Object responses are disabled and cannot
     * be enabled from the Preferences dialog.
     *
     * This feature is enabled by default when supportsCoreVoicing is true in package.json. The query parameter will always
     * override the package.json entry.
     */
    supportsCoreVoicing: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsCoreVoicing
    },

    /**
     * Switches the Vello rendering of Text to use Swash (with embedded fonts), instead of Canvas.
     *
     * For internal use only. This is currently only used in prototypes.
     */
    swashText: {
      type: 'boolean',
      defaultValue: true
    },

    /**
     * If non-empty, Swash-rendered text will show up in the given color (useful for debugging)
     *
     * For internal use only. This is currently only used in prototypes.
     */
    swashTextColor: {
      type: 'string',
      defaultValue: ''
    },

    /**
     * By default, voicing is not enabled on startup. Add this flag to start the sim with voicing enabled.
     * Only relevant if the sim supports Voicing.
     *
     * Some browsers may not support this because user input is required to start SpeechSynthesis. But it allows
     * teachers to start the sim with Voicing enabled, so it is still public and usable where possible.
     */
    voicingInitiallyEnabled: {
      type: 'flag',
      public: true
    },

    /**
     * A debug query parameter that will save and load you preferences (from the Preferences Dialog) through multiple runtimes.
     * See PreferencesStorage.register to see what Properties support this save/load feature.
     */
    preferencesStorage: {
      type: 'flag'
    },

    /**
     * Print output from Voicing speech synthesis responses to the console.
     */
    logVoicingResponses: {
      type: 'flag'
    },

    /**
     * Enables panning and zooming of the simulation. Can be permanently disabled if supportsPanAndZoom: false is
     * added under the `phet.simFeatures` entry of package.json. Query parameter value will always override package.json entry.
     *
     * Public, so that users can disable this feature if they need to.
     */
    supportsPanAndZoom: {
      type: 'boolean',
      public: true,

      // even if not provided in package.json, this defaults to being true
      defaultValue: !packageSimFeatures.hasOwnProperty( 'supportsPanAndZoom' ) || packageSimFeatures.supportsPanAndZoom
    },

    /**
     * Indicates whether the sound library should be enabled.  If true, an icon is added to the nav bar icon to enable
     * the user to turn sound on/off.  There is also a Sim option for enabling sound which can override this.
     * Primarily for internal use, though we may share links with collaborates that use this parameter.
     */
    supportsSound: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsSound
    },

    /**
     * Indicates whether extra sounds are used in addition to basic sounds as part of the sound design.  If true, the
     * PhET menu will have an option for enabling extra sounds.  This will be ignored if sound is not generally
     * enabled (see ?supportsSound).
     *
     * Primarily for internal use, though we may share links with collaborates that use this parameter.
     */
    supportsExtraSound: {
      type: 'boolean',
      defaultValue: !!packageSimFeatures.supportsExtraSound
    },

    /**
     * Indicates whether or not vibration is enabled, and which paradigm is enabled for testing. There
     * are several "paradigms", which are different vibration output designs.  For temporary use
     * while we investigate use of this feature. In the long run there will probably be only
     * one design and it can be enabled/disabled with something more like `supportsVibration`.
     *
     * These are numbered, but type is string so default can be null, where all vibration is disabled.
     *
     * Used internally, though links are shared with collaborators and possibly in paper publications.
     */
    vibrationParadigm: {
      type: 'string',
      defaultValue: null
    },

    /**
     * Only relevant when the sim supports the Voicing feature. If true, Voicing object responses
     * are enabled by default.
     *
     * These parameters allow fine-=tuned control over the initial state and behavior of the Voicing feature,
     * allowing better customization and accessibility for various users.
     */
    voicingAddObjectResponses: {
      type: 'flag',
      public: true
    },

    /**
     * Only relevant when the sim supports the Voicing feature. If true, Voicing context responses
     * are enabled by default.
     *
     * These parameters allow fine-=tuned control over the initial state and behavior of the Voicing feature,
     * allowing better customization and accessibility for various users.
     */
    voicingAddContextResponses: {
      type: 'flag',
      public: true
    },

    /**
     * Only relevant when the sim supports the Voicing feature. If true, Voicing hint responses
     * are enabled by default.
     *
     * These parameters allow fine-=tuned control over the initial state and behavior of the Voicing feature,
     * allowing better customization and accessibility for various users.
     */
    voicingAddHintResponses: {
      type: 'flag',
      public: true
    },

    /**
     * Only relevant when the sim supports the Voicing feature. If true, the VoicingToolbar will be collapsed
     * by default when Voicing is enabled.
     *
     * These parameters allow fine-=tuned control over the initial state and behavior of the Voicing feature,
     * allowing better customization and accessibility for various users.
     */
    voicingCollapseToolbar: {
      type: 'flag',
      public: true
    },

    /**
     * Only relevant when the sim supports the Voicing feature. If true, the VoicingToolbar will be fully hidden
     * by default when Voicing is enabled.
     *
     * These parameters allow fine-=tuned control over the initial state and behavior of the Voicing feature,
     * allowing better customization and accessibility for various users.
     */
    voicingRemoveToolbar: {
      type: 'flag',
      public: true
    },

    /**
     * Enables WebGL rendering. See https://github.com/phetsims/scenery/issues/289.
     * Note that simulations can opt-in to webgl via new Sim({webgl:true}), but using ?webgl=true takes
     * precedence.  If no webgl query parameter is supplied, then simulations take the Sim option value, which
     * defaults to false.  See see https://github.com/phetsims/scenery/issues/621
     */
    webgl: {
      type: 'boolean',
      defaultValue: true
    },

    /**
     * Indicates whether yotta analytics are enabled.
     */
    yotta: {
      type: 'boolean',
      defaultValue: true,
      public: true
    }
  };

  {
    // Read query parameters
    window.phet.chipper.queryParameters = QueryStringMachine.getAll( QUERY_PARAMETERS_SCHEMA );

    // Are we running a built html file? (Note, if running in a Web Worker, we
    // won't have a document to check for this).
    window.phet.chipper.isProduction = self.document ? self.document.querySelector( 'meta[name="phet-sim-level"]' )?.content === 'production' : true;

    // Are we running in an app?
    window.phet.chipper.isApp = phet.chipper.queryParameters[ 'phet-app' ] || phet.chipper.queryParameters[ 'phet-android-app' ];

    /**
     * An IIFE here helps capture variables in final logic needed in the global, preload scope for the phetsim environment.
     *
     * Enables or disables assertions in common libraries using query parameters.
     * There are two types of assertions: basic and slow. Enabling slow assertions will adversely impact performance.
     * 'ea' enables basic assertions, 'eall' enables basic and slow assertions.
     * Must be run before the main modules, and assumes that assert.js and query-parameters.js has been run.
     */
    ( function() {

      // enables all assertions (basic and slow)
      const enableAllAssertions = !phet.chipper.isProduction && phet.chipper.queryParameters.eall;

      // enables basic assertions
      const enableBasicAssertions = enableAllAssertions ||
                                    ( !phet.chipper.isProduction && phet.chipper.queryParameters.ea ) ||
                                    phet.chipper.isDebugBuild;

      if ( enableBasicAssertions ) {
        window.assertions.enableAssert();
      }
      if ( enableAllAssertions ) {
        window.assertions.enableAssertSlow();
      }
    } )();
  }

  // Initialize query parameters in a new scope, see docs above
  {

    window.phet.chipper.colorProfiles = colorProfiles;

    /**
     * Determines whether any type of fuzzing is enabled. This is a function so that the associated query parameters
     * can be changed from the console while the sim is running. See https://github.com/phetsims/sun/issues/677.
     * @returns {boolean}
     */
    window.phet.chipper.isFuzzEnabled = () =>
      ( window.phet.chipper.queryParameters.fuzz ||
        window.phet.chipper.queryParameters.fuzzMouse ||
        window.phet.chipper.queryParameters.fuzzTouch ||
        window.phet.chipper.queryParameters.fuzzBoard
      );

    window.phet.chipper.supportsAnyVoicing = () => {
      return window.phet.chipper.queryParameters.supportsVoicing ||
             window.phet.chipper.queryParameters.supportsCoreVoicing;
    };

    // Add a log function that displays messages to the console. Examples:
    // phet.log && phet.log( 'You win!' );
    // phet.log && phet.log( 'You lose', { color: 'red' } );
    if ( window.phet.chipper.queryParameters.log ) {
      window.phet.log = function( message, options ) {
        options = _.assignIn( {
          color: '#009900' // green
        }, options );
        console.log( `%c${message}`, `color: ${options.color}` ); // green
      };
    }

    /**
     * Gets the name of brand to use, which determines which logo to show in the navbar as well as what options
     * to show in the PhET menu and what text to show in the About dialog.
     * See https://github.com/phetsims/brand/issues/11
     * @returns {string}
     */
    window.phet.chipper.brand = window.phet.chipper.brand || phet.chipper.queryParameters.brand || 'adapted-from-phet';

    // {string|null} - See documentation of stringTest query parameter - we need to support this during build, where
    //                 there aren't any query parameters.
    const stringTest = ( typeof window !== 'undefined' && phet.chipper.queryParameters.stringTest ) ?
                       phet.chipper.queryParameters.stringTest :
                       null;

    /**
     * Maps an input string to a final string, accommodating tricks like doubleStrings.
     * This function is used to modify all strings in a sim when the stringTest query parameter is used.
     * The stringTest query parameter and its options are documented in the query parameter docs above.
     * It is used in string.js and sim.html.
     * @param string - the string to be mapped
     * @returns {string}
     */
    window.phet.chipper.mapString = function( string ) {
      const script = 'script';
      return stringTest === null ? string :
             stringTest === 'double' ? `${string}:${string}` :
             stringTest === 'long' ? '12345678901234567890123456789012345678901234567890' :
             stringTest === 'rtl' ? mapRtlString( string ) :
             stringTest === 'xss' ? `${string}<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NkYGD4DwABCQEBtxmN7wAAAABJRU5ErkJggg==" onload="window.location.href=atob('aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kUXc0dzlXZ1hjUQ==')" />` :
             stringTest === 'xss2' ? `${string}<${script}>alert('XSS')</${script}>` :
             stringTest === 'none' ? string :
             stringTest === 'dynamic' ? string :

               // In the fallback case, supply whatever string was given in the query parameter value
             stringTest;
    };

    /**
     * Given a locale based on the supported query parameter schema, map it to the 2 or 5 char locale code (key in localeData).
     * @param {string} locale
     * @param {boolean} assertInsteadOfWarn - assert incorrect locale format, vs QSM warn by default
     * @returns {string}
     */
    phet.chipper.remapLocale = ( locale, assertInsteadOfWarn = false ) => {
      assert && assert( locale );
      assert && assert( phet.chipper.localeData );

      const inputValueLocale = locale;

      if ( locale.length < 5 ) {
        locale = locale.toLowerCase();
      }
      else {
        locale = locale.replace( /-/, '_' );

        const parts = locale.split( '_' );
        if ( parts.length === 2 ) {
          locale = parts[ 0 ].toLowerCase() + '_' + parts[ 1 ].toUpperCase();
        }
      }

      if ( locale.length === 3 ) {
        for ( const candidateLocale of Object.keys( phet.chipper.localeData ) ) {
          if ( phet.chipper.localeData[ candidateLocale ].locale3 === locale ) {
            locale = candidateLocale;
            break;
          }
        }
      }

      // Permissive patterns for locale query parameter patterns.
      // We don't want to show a query parameter warning if it matches these patterns, EVEN if it is not a valid locale
      // in localeData, see https://github.com/phetsims/qa/issues/1085#issuecomment-2111105235.
      const pairRegex = /^[a-zA-Z]{2}$/;
      const tripleRegex = /^[a-zA-Z]{3}$/;
      const doublePairRegex = /^[a-zA-Z]{2}[_-][a-zA-Z]{2}$/;

      // Sanity checks for verifying localeData (so hopefully we don't commit bad data to localeData).
      if ( assert ) {
        for ( const locale of Object.keys( phet.chipper.localeData ) ) {
          // Check the locale itself
          assert( pairRegex.test( locale ) || doublePairRegex.test( locale ), `Invalid locale format: ${locale}` );

          // Check locale3 (if it exists)
          if ( phet.chipper.localeData[ locale ].locale3 ) {
            assert( tripleRegex.test( phet.chipper.localeData[ locale ].locale3 ), `Invalid locale3 format: ${phet.chipper.localeData[ locale ].locale3}` );
          }

          // Check fallbackLocales (if it exists)
          if ( phet.chipper.localeData[ locale ].fallbackLocales ) {
            for ( const fallbackLocale of phet.chipper.localeData[ locale ].fallbackLocales ) {
              assert( phet.chipper.localeData[ fallbackLocale ] );
            }
          }
        }
      }

      if ( !phet.chipper.localeData[ locale ] ) {
        const badLocale = inputValueLocale;

        if ( !pairRegex.test( badLocale ) && !tripleRegex.test( badLocale ) && !doublePairRegex.test( badLocale ) ) {
          if ( assertInsteadOfWarn ) {
            assert && assert( false, 'invalid locale:', inputValueLocale );
          }
          else {
            // This may occur twice in unbuilt mode when done loading unbuilt strings and when running this file.
            QueryStringMachine.addWarning( 'locale', inputValueLocale, `Invalid locale format received: ${badLocale}. ?locale query parameter accepts the following formats: "xx" for ISO-639-1, "xx_XX" for ISO-639-1 and a 2-letter country code, "xxx" for ISO-639-2` );
          }
        }

        locale = FALLBACK_LOCALE;
      }

      return locale;
    };

    /**
     * Get the "most" valid locale, see https://github.com/phetsims/phet-io/issues/1882
     *  As part of https://github.com/phetsims/joist/issues/963, this as changed. We check a specific fallback order based
     *  on the locale. In general, it will usually try a prefix for xx_XX style locales, e.g. 'ar_SA' would try 'ar_SA', 'ar', 'en'
     *  NOTE: If the locale doesn't actually have any strings: THAT IS OK! Our string system will use the appropriate
     *  fallback strings.
     * @param locale
     * @returns {*}
     */
    phet.chipper.getValidRuntimeLocale = locale => {
      assert && assert( locale );
      assert && assert( phet.chipper.localeData );
      assert && assert( phet.chipper.strings );

      const possibleLocales = [
        locale,
        ...( phet.chipper.localeData[ locale ]?.fallbackLocales ?? [] ),
        FALLBACK_LOCALE
      ];

      const availableLocale = possibleLocales.find( possibleLocale => !!phet.chipper.strings[ possibleLocale ] );
      assert && assert( availableLocale, 'no fallback found for ', locale );
      return availableLocale;
    };

    // We will need to check for locale validity (once we have localeData loaded, if running unbuilt), and potentially
    // either fall back to `en`, or remap from 3-character locales to our locale keys. This overwrites phet.chipper.locale.
    // Used when setting locale through JOIST/localeProperty also. Default to the query parameter instead of
    // chipper.locale because we overwrite that value, and may run this function multiple times during the startup
    // sequence (in unbuilt mode).
    phet.chipper.checkAndRemapLocale = ( locale = phet.chipper.queryParameters.locale, assertInsteadOfWarn = false ) => {

      // We need both to proceed. Provided as a global, so we can call it from load-unbuilt-strings
      // (IF initialize-globals loads first). Also handle the unbuilt mode case where we have phet.chipper.strings
      // exists but no translations have loaded yet.
      if ( !phet.chipper.localeData || !phet.chipper.strings?.hasOwnProperty( FALLBACK_LOCALE ) || !locale ) {
        return locale;
      }

      const remappedLocale = phet.chipper.remapLocale( locale, assertInsteadOfWarn );
      const finalLocale = phet.chipper.getValidRuntimeLocale( remappedLocale );

      // Export this for analytics, see gogole-analytics.js
      // (Yotta and GA will want the non-fallback locale for now, for consistency)
      phet.chipper.remappedLocale = remappedLocale;
      phet.chipper.locale = finalLocale; // NOTE: this will change with every setting of JOIST/localeProperty
      return finalLocale;
    };

    // When providing `?locale=`, the value is null, rude.
    if ( phet.chipper.queryParameters.locale === null ) {
      phet.chipper.queryParameters.locale = FALLBACK_LOCALE;
    }

    // Query parameter default will pick up the phet.chipper.locale default from the built sim, if it exists.
    assert && assert( phet.chipper.queryParameters.locale, 'should exist with a default' );

    // NOTE: If we are loading in unbuilt mode, this may execute BEFORE we have loaded localeData. We have a similar
    // remapping in load-unbuilt-strings when this happens.
    phet.chipper.checkAndRemapLocale();
  }

  /**
   * Utility function to pause synchronously for the given number of milliseconds.
   * @param {number} millis - amount of time to pause synchronously
   */
  function sleep( millis ) {
    const date = new Date();
    let curDate;
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
    window.setInterval( () => { sleep( 64 ); }, 16 );
  };
  window.phet.chipper.makeRandomSlowness = function() {
    window.setInterval( () => { sleep( Math.ceil( 100 + Math.random() * 200 ) ); }, Math.ceil( 100 + Math.random() * 200 ) );
  };

  ( function() {

    /**
     * Sends a message to a continuous testing container.
     * @public
     *
     * @param {Object} [options] - Specific object results sent to CT.
     */
    window.phet.chipper.reportContinuousTestResult = options => {
      window.parent && window.parent.postMessage( JSON.stringify( _.assignIn( {
        continuousTest: JSON.parse( phet.chipper.queryParameters.continuousTest ),
        url: window.location.href
      }, options ) ), '*' );
    };

    if ( phet.chipper.queryParameters.continuousTest ) {
      window.addEventListener( 'error', a => {
        let message = '';
        let stack = '';
        if ( a && a.message ) {
          message = a.message;
        }
        if ( a && a.error && a.error.stack ) {
          stack = a.error.stack;
        }
        phet.chipper.reportContinuousTestResult( {
          type: 'continuous-test-error',
          message: message,
          stack: stack
        } );
      } );
      window.addEventListener( 'beforeunload', e => {
        phet.chipper.reportContinuousTestResult( {
          type: 'continuous-test-unload'
        } );
      } );
      // window.open stub. otherwise we get tons of "Report Problem..." popups that stall
      window.open = () => {
        return {
          focus: () => {},
          blur: () => {}
        };
      };
    }

    // Communicate sim errors to CT or other listening parent frames
    if ( phet.chipper.queryParameters.postMessageOnError ) {
      window.addEventListener( 'error', a => {
        let message = '';
        let stack = '';
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

    if ( phet.chipper.queryParameters.postMessageOnBeforeUnload ) {
      window.addEventListener( 'beforeunload', e => {
        window.parent && window.parent.postMessage( JSON.stringify( {
          type: 'beforeUnload'
        } ), '*' );
      } );
    }
  }() );

  ( () => {
    // Validation logic on the simFeatures section of the packageJSON, many of which are used in sims, and should be
    // defined correctly for the sim to run.

    const simFeaturesSchema = {
      supportsInteractiveDescription: { type: 'boolean' },
      supportsVoicing: { type: 'boolean' },
      supportsCoreVoicing: { type: 'boolean' },
      supportsInteractiveHighlights: { type: 'boolean' },
      supportsDescriptionPlugin: { type: 'boolean' },
      supportsSound: { type: 'boolean' },
      supportsExtraSound: { type: 'boolean' },
      supportsDynamicLocale: { type: 'boolean' },
      supportsPanAndZoom: { type: 'boolean' },
      colorProfiles: { type: 'array' },
      supportedRegionsAndCultures: { type: 'array' },
      defaultRegionAndCulture: { type: 'string' },
      preventMultitouch: { type: 'boolean' },
      interruptMultitouch: { type: 'boolean' }
    };

    Object.keys( simFeaturesSchema ).forEach( schemaKey => {
      assert && assert( !packagePhet.hasOwnProperty( schemaKey ),
        `${schemaKey} is a sim feature and should be in "simFeatures" in the package.json` );
    } );

    assert && assert( !packageObject.hasOwnProperty( 'simFeatures' ), 'simFeatures must be nested under \'phet\'' );
    if ( packagePhet.hasOwnProperty( 'simFeatures' ) ) {
      const simFeatures = packagePhet.simFeatures;
      Object.keys( simFeatures ).forEach( simFeatureName => {
        const simFeatureValue = simFeatures[ simFeatureName ];
        assert && assert( simFeaturesSchema.hasOwnProperty( simFeatureName ), `unsupported sim feature: ${simFeatureName}` );
        if ( simFeaturesSchema[ simFeatureName ] ) {

          if ( simFeaturesSchema[ simFeatureName.type ] === 'boolean' ) {
            assert && assert( typeof simFeatureValue === 'boolean', `boolean value expected for ${simFeatureName}` );
          }
          else if ( simFeaturesSchema[ simFeatureName.type ] === 'array' ) {
            assert && assert( Array.isArray( simFeatureValue ), `array value expected for ${simFeatureName}` );

            // At this time, all arrays are assumed to only support strings
            assert && assert( _.every( simFeatureValue, value => typeof value === 'string' ), `string entry expected for ${simFeatureName}` );
          }
        }
      } );
    }
  } )();
}() );


// constants used by mapRtlString
const LTR_MARK = '\u202a';
const RTL_MARK = '\u202b';
const NON_BREAKING_SPACE = '\u00a0';
const END_DIRECTIONAL_MARK = '\u202c';
const LONGER_RTL_STRING = `${RTL_MARK}\u062a\u0633\u062a (\u0632\u0628\u0627\u0646)${END_DIRECTIONAL_MARK}`;
const SHORTER_RTL_STRING = `${RTL_MARK}\u062a\u0633\u062a${END_DIRECTIONAL_MARK}`;
const RTL_FRAGMENT = '\u062a\u0633\u062a';

/**
 * Helper function to map a string to an right-to-left (RTL) string.  This keeps placeholders in place, and replaces the
 * textual fragments with a default RTL string.  See https://github.com/phetsims/phetcommon/issues/68 for more
 * background on this if needed.
 * @param {string} stringToMap - the string to map to an RTL string
 * @returns {string}
 */
function mapRtlString( stringToMap ) {

  // Regular expression to match placeholders in the string.  This matches both {{...}} and {...} patterns.
  const regex = /{{[^{}]*}}|{[^{}]*}/g;

  // return value
  let mappedString;

  if ( regex.test( stringToMap ) ) {

    // The string is a pattern, meaning that it contains placeholders.  We want to mark the whole string as RTL, keep
    // the placeholders roughly where they are, and replace the textual fragments with a default RTL string.
    mappedString = '' + RTL_MARK;

    // Loop through the string, mapping the placeholders and textual fragments to a synthetic RTL string.
    let braceDepth = 0;
    let placeholderStartIndex = -1;
    let textFragmentStartIndex = -1;
    for ( let currentIndex = 0; currentIndex < stringToMap.length; currentIndex++ ) {
      const char = stringToMap.charAt( currentIndex );

      if ( char === LTR_MARK || char === RTL_MARK || char === END_DIRECTIONAL_MARK ) {

        // This is a control character that sets the directionality of the text.  We want to ignore it.
        continue;
      }

      if ( char === '{' ) {

        // This is the start of a placeholder.  Check if this is the end of a textual fragment and, if so, handle it.
        if ( textFragmentStartIndex !== -1 ) {

          // Replace the textual fragment with an RTL string fragment, preserving any surrounding whitespace, and
          // handling the case where the string is *all* whitespace.
          if ( stringToMap.charAt( textFragmentStartIndex ) === NON_BREAKING_SPACE ||
               stringToMap.charAt( textFragmentStartIndex ) === ' ' ) {

            mappedString += stringToMap.charAt( textFragmentStartIndex );
          }
          if ( currentIndex - textFragmentStartIndex > 1 ) {
            mappedString += RTL_FRAGMENT;

            // If there is a space or non-breaking space before the placeholder, add it to the mapped string.
            const lastCharInFragment = stringToMap.charAt( currentIndex - 1 );
            if ( lastCharInFragment === NON_BREAKING_SPACE || lastCharInFragment === ' ' ) {
              mappedString += stringToMap.charAt( currentIndex - 1 );
            }
          }
          textFragmentStartIndex = -1;
        }

        if ( braceDepth === 0 ) {
          placeholderStartIndex = currentIndex;
        }
        braceDepth++;
        assert && assert( braceDepth <= 2, `max brace depth exceeded, string = ${stringToMap}` );
      }
      else if ( char === '}' ) {
        braceDepth--;
        assert && assert( braceDepth >= 0, `brace depth exceeded, string = ${stringToMap}` );
        if ( braceDepth === 0 ) {

          // This is the end of a placeholder, so add it unaltered to the mapped string.
          mappedString += stringToMap.substring( placeholderStartIndex, currentIndex + 1 );
        }
      }
      else if ( braceDepth === 0 && textFragmentStartIndex === -1 ) {

        // This is the start of a textual fragment.  Remember where it starts.
        textFragmentStartIndex = currentIndex;
      }
    }

    if ( textFragmentStartIndex !== -1 ) {

      // There is a textual fragment at the end of the string being mapped.  Add a corresponding RTL string fragment to
      // the mapped string.
      mappedString += ' ' + RTL_FRAGMENT;
    }

    // Add the control character that resets the directionality.
    mappedString += END_DIRECTIONAL_MARK;
  }
  else {

    // The string isn't a pattern, meaning that it contains no placeholders.  Return a default RTL string based on the
    // length of the string being mapped.
    mappedString = stringToMap.length < 5 ? SHORTER_RTL_STRING : LONGER_RTL_STRING;
  }

  return mappedString;
}