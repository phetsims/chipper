// Copyright 2002-2013, University of Colorado Boulder

/**
 * Initializes phet globals that are used by all simulations, including assertions, togetherEvents and query-parameters.
 * See https://github.com/phetsims/phetcommon/issues/23
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
 * For more on query parameters, please see http://en.wikipedia.org/wiki/Query_string
 *
 * Query parameters most useful for QA Testing:
 *
 * dev - enable developer-only features, such as showing the layout bounds
 * ea - enable assertions, internal code error checks
 * qrCode - adds a menu item that will open a window with a QR code with the URL of the simulation
 * fuzzMouse - randomly sends mouse events to sim
 * profiler - shows profiling information for the sim
 * showPointerAreas - touch areas in red, mouse areas in blue, both dotted outlines
 * webgl - can be set to false with ?webgl=false to turn off WebGL rendering, see https://github.com/phetsims/scenery/issues/289
 * stringTest - if set to "double", duplicates all of the translated strings which will allow to see (a) if all strings
 *                  are translated and (b) whether the layout can accommodate longer strings from other languages.
 *                  Note this is a heuristic rule
 *                  that does not cover all cases.
 *            - if set to "none" or omitted, then the normal translated string will be shown
 *            - if set to anything else, it will use that string everywhere.  This will allow testing specific cases, like
 *                  whether the word 'vitesse' would substitute for 'speed' well.  Also, using "%20" it will show whitespace for all
 *                  of the strings, making it easy to identify non-translated strings
 *
 * Other query parameters:
 *
 * component - when running the scenery-phet example, select a particular component in the components screen
 * datamite.actionHistogram - when running with together.js + togetherEvents, display a histogram of the action types, see togetherEvents.jsadded action
 * accessibility - enable accessibility features, such as keyboard navigation (mileage may vary!)
 * eall - enable all assertions, as above but with more time consuming checks
 * emitEmptyDeltas - when emitting states using together.js (see emitStates below) emit deltas that are empty, to simplify playback in some systems like Metacog.
 * emitStates - when running a simulation using together.js, outputs states and deltas within the togetherEvents data stream, see together.js
 * rootRenderer - specify a renderer for the Sim's rootNode to use, such as 'svg', 'webgl' or 'canvas'
 * locale - test with a specific locale
 * playbackInputEventLog - plays event logging back from the server, provide an optional name for the session
 * recordInputEventLog - enables input event logging, provide an optional name for the session, log is available via PhET menu
 * sceneryLog - list of one or more logs to enable in scenery 0.2+, delimited with .
 *                          - For example: ?sceneryLog=Display.Drawable.WebGLBlock
 * sceneryStringLog - Scenery logs will be output to a string instead of the window
 * screens - select one or more screens (with a 1-based index) to run in the sim, with a dot instead of a comma delimiter.
 *                          - For example ?screens=3.1 will launch with screen 1 and 3 with 3 first and 1 second.
 *                          - ?screens=2 would launch with just screen 2.
 *                          - Note that launching with a subset of screens can speed up the startup time significantly
 *                          - because only the selected screens are initialized
 * showHomeScreen - if false, go immediate to screenIndex, defaults to screenIndex=0
 * strings - override strings, value is JSON that is identical to string.json files
 * webglContextLossTimeout - if enabled, will create WebGL contexts that can simulate context loss
 *                         - if a value is specified, it will also simulate a context loss after the specified number
 *                         - of milliseconds has elapsed.
 *                         - The value can be omitted to manually simulate the context loss with simScene.simulateWebGLContextLoss()
 * webglContextLossIncremental - if this option is present, it will put the WebGLLayer into a testing mode which
 *                             - simulates context loss between successively increasing gl calls (starting at 1)
 *                             - this option should be used in conjunction with webglContextLossTimeout since
 *                             - it only triggers upon the first context lass.
 * buildCompatible - When present, will trigger changes that are more similar to the build environment. Right now, this
 *                   includes computing higher-resolution mipmaps for the mipmap plugin.
 *
 * This file reads query parameters from browser window's URL.
 * This file must be loaded before requirejs is started up, and this file cannot be loaded as an AMD module.
 * The easiest way to do this is via a <script> tag in your HTML file.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Chris Malley (PixelZoom, Inc.)
 */
(function() {
  'use strict';

  // If togetherEvents has already been preloaded, then this script does nothing.
  // If togetherEvents has not been preloaded, then this will assign window.togetherEvents = null
  // This will enable us to use a pattern like `togetherEvents && togetherEvents.method`
  window.togetherEvents = window.togetherEvents || null;

  // If together has been preloaded, this line does nothing.  If together needs to be loaded, it will
  // overwrite this value with the together global.
  window.together = window.together || null;

// Initialize query parameters, see docs above
  (function() {

    // Create the attachment point for all PhET globals
    window.phet = window.phet || {};
    window.phet.chipper = window.phet.chipper || {};

    //Pre-populate the query parameters map so that multiple subsequent look-ups are fast
    var queryParamsMap = {};

    if ( typeof window !== 'undefined' && window.location.search ) {
      var params = window.location.search.slice( 1 ).split( '&' );
      for ( var i = 0; i < params.length; i++ ) {
        var nameValuePair = params[ i ].split( '=' );
        queryParamsMap[ nameValuePair[ 0 ] ] = decodeURIComponent( nameValuePair[ 1 ] );
      }
    }

    /**
     * Retrieves the first occurrence of a query parameter based on its key.
     * Returns undefined if the query parameter is not found.
     * @param {string} key
     * @return {string}
     */
    window.phet.chipper.getQueryParameter = function( key ) {
      return queryParamsMap[ key ];
    };

    /**
     * Retrieves the entire map of query parameters (may be empty)
     * @return {object} map from string->string
     */
    window.phet.chipper.getQueryParameters = function() {
      return queryParamsMap;
    };

    /**
     * Gets the cache buster args based on the provided query parameters.  Dy default it is:
     * ?bust=<number>
     * But this can be omitted if ?cacheBuster=false is provided
     * See https://github.com/phetsims/joist/issues/196
     * @returns {string}
     */
    window.phet.chipper.getCacheBusterArgs = function() {
      return (phet.chipper.getQueryParameter( 'cacheBuster' ) !== 'false') ? ('bust=' + Date.now()) : '';
    };

    /**
     * Gets the name of brand to use, which determines which logo to show in the navbar as well as what options
     * to show in the PhET menu and what text to show in the About dialog.
     * See https://github.com/phetsims/brand/issues/11
     * @returns {string}
     */
    window.phet.chipper.brand = window.phet.chipper.brand || phet.chipper.getQueryParameter( 'brand' ) || 'adapted-from-phet';

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
             stringTest === 'none' ? string :

               //In the fallback case, supply whatever string was given in the query parameter value
             stringTest;
    };
  }());
  /**
   * Enables or disables assertions in common libraries using query parameters.
   * There are two types of assertions: basic and slow. Enabling slow assertions will adversely impact performance.
   * 'ea' enables basic assertions, 'eall' enables basic and slow assertions.
   * Must be run before RequireJS, and assumes that assert.js and query-parameters.js has been run.
   */
  (function() {

    // TODO: separate this logic out into a more common area?
    var isProduction = $( 'meta[name=phet-sim-level]' ).attr( 'content' ) === 'production';

    var enableAllAssertions = !isProduction && !!phet.chipper.getQueryParameter( 'eall' ); // enables all assertions (basic and slow)
    var enableBasicAssertions = enableAllAssertions || ( !isProduction && !!phet.chipper.getQueryParameter( 'ea' ) );  // enables basic assertions

    if ( enableBasicAssertions ) {
      window.assertions.enableAssert();
    }
    if ( enableAllAssertions ) {
      window.assertions.enableAssertSlow();
    }

    // Communicate sim errors to joist/tests/test-sims.html
    if ( phet.chipper.getQueryParameter( 'postMessageOnError' ) ) {
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
