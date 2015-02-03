// Copyright 2002-2013, University of Colorado Boulder

/**
 * JSHint options for simulations and common code, meant to be passed to grunt-contrib-jshint
 */
module.exports = {
  // options documented at http://www.jshint.com/docs/#options

  // enforcing options
  curly: true, // require braces around blocks for loops and conditionals
  eqeqeq: true, // prohibit == and !=, use === and !===
  immed: true, // prohibits the use of immediate function invocations without wrapping them in parentheses
  latedef: true, // prohibits the use of a variable before it was defined
  newcap: true, // requires you to capitalize names of constructor functions
  noarg: true, // prohibits the use of arguments.caller and arguments.callee
  nonew: true, // prohibits calling new without assigning result to a variable
  undef: true, // prohibits the use of explicitly undeclared variables
  strict: true, // requires all functions to run in ECMAScript 5's strict mode

  // relaxing options
  expr: true, // suppresses warnings about the use of expressions where normally you would expect to see assignments or function calls, so we can use assert && assert( ... )
  loopfunc: true, // suppresses warnings about defining functions inside of loops, but we know how not to shoot ourselves in the foot, and this is useful for _.each
  unused: 'vars', // prohibit unused variables, allow unused function parameters

  // tell JSHint about global variables that are defined elsewhere. If value is false (default), JSHint will consider that variable as read-only.
  globals: {

    // writable globals ---------------------------------

    assert: true,  // allow assertions
    assertSlow: true, // allow slow assertions
    sceneryLog: true, // scenery logging levels
    sceneryLayerLog: true, // scenery logging levels
    sceneryEventLog: true, // scenery logging levels
    sceneryAccessibilityLog: true, // scenery accessibility levels
    phetAllocation: true, // for tracking object allocations, see phet-core's phetAllocation
    Float32Array: true, // we actually polyfill this, so allow it to be set
    phet: true,

    // read-only globals ---------------------------------

    define: false, // require.js
    require: false, // require.js
    Uint16Array: false,
    Uint32Array: false,
    XMLHttpRequest: false, // allow ajax requests directly
    document: false,
    window: false,
    console: false,
    HTMLImageElement: false,
    HTMLCanvasElement: false,
    Backbone: false, // backbone is currently run outside of requirejs
    module: false, // as used in Gruntfile.js
    $: false, // jQuery
    _: false, // underscore, lodash
    clearTimeout: false,
    Image: false, // DOM.js
    Blob: false,  // DOM.js
    canvg: false,
    io: false, //socket.io,
    TWEEN: false, //sole/tween.js
    navigator: false, //For Mobile Safari detection, see http://stackoverflow.com/questions/3007480/determine-if-user-navigated-from-mobile-safari
    Howl: false, //for web audio
    ActiveXObject: false, //for full screen
    Box2D: false, //For Box2D physics engine
    Stats: false, //For @mrdoob's stats + frame rate readout component
    poly2tri: false, //For poly2tri triangulation library
    THREE: false, //For three.js 3d things
    WebSocket: false, // for WebSocket communication
    WebGLDebugUtils: false, // for khronos webgl-debug.js debugging utilities
    iframePhone: false, // for CODAP or other Concord communication
    PIXI: false,
    arch: false,

    alert: false, //for debugging on ipad
    numeric: false, //Numeric library used in energy skate park
    location: false, //For setting location.href to save to local file, see http://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
    FileReader: false //For file loading, see SaveLoadNode in Energy Skate Park: Basics
  }
};

