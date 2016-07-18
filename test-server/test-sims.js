// How long to run each sim
var durationOverride = phet.chipper.getQueryParameter( 'duration' );

// value to be passed to fuzzMouse query parameter
var fuzzOverride = phet.chipper.getQueryParameter( 'fuzz' );

// verify that sims start in requirejs mode, skip other tests
var loadOnly = !!phet.chipper.getQueryParameter( 'loadOnly' );

var DURATION_PER_SIM = durationOverride ? parseInt( durationOverride, 10 ) : 30000; // ms
var FUZZ_MOUSE_RATE = fuzzOverride ? parseInt( fuzzOverride, 10 ) : 100; // actions per frame

var simNames; // {Array.<string>} - will be filled in below by an AJAX request
var testQueue = []; // {Array.<{ simName: {string}, isBuild: {boolean} }>} - Sim test target queue
var buildQueue = []; // {Array.<string>} - sim names that need to be built

var simQueryParameters = [
  'ea', // assertions
  'rootRenderer=canvas',
  'postMessageOnLoad', // send 'load' postMessage once the sim has fully loaded
  'postMessageOnError', // send 'error' postMessage on any error
  'fuzzMouse=' + FUZZ_MOUSE_RATE // send random mouse events
];

var eventLog = document.createElement( 'div' );
eventLog.id = 'eventLog';
eventLog.innerHTML = '<div id="dev-errors" style="display: none;"><h1>Sim errors (dev):</h1></div>' +
                     '<div id="build-errors" style="display: none;"><h1>Sim errors (build):</h1></div>' +
                     '<div id="grunt-errors" style="display: none;"><h1>Grunt errors:</h1></div>';
eventLog.style.display = 'none';
document.body.appendChild( eventLog );
var devErrors = document.getElementById( 'dev-errors' );
var buildErrors = document.getElementById( 'build-errors' );
var gruntErrors = document.getElementById( 'grunt-errors' );

// a borderless iframe
var iframe = document.createElement( 'iframe' );
iframe.setAttribute( 'frameborder', '0' );
iframe.setAttribute( 'seamless', '1' );
// NOTE: we don't set allow-popups, but this was causing a security error when it was open
// instead, we override window.open AFTER it sends the load message (which isn't foolproof)
// see https://html.spec.whatwg.org/multipage/embedded-content.html#attr-iframe-sandbox
// iframe.setAttribute( 'sandbox', 'allow-forms allow-pointer-lock allow-same-origin allow-scripts' );
document.body.appendChild( iframe );

// a place for sim status divs
var simListDiv = document.createElement( 'div' );
simListDiv.id = 'simList';
document.body.appendChild( simListDiv );

var currentTest;
var simStatusElements = {}; // map simName {string} => {DOMElement}, which holds the status w/ classes
var timeoutId; // we need to clear the timeout if we bail from a sim early

function createStatusElement( simName ) {
  var simStatusElement = document.createElement( 'div' );
  simStatusElement.classList.add( 'status' );
  simListDiv.appendChild( simStatusElement );
  simStatusElements[ simName ] = simStatusElement;

  var devStatus = document.createElement( 'span' );
  devStatus.classList.add( 'dev' );
  devStatus.innerHTML = '■';
  simStatusElement.appendChild( devStatus );

  var gruntStatus = document.createElement( 'span' );
  gruntStatus.classList.add( 'grunt' );
  gruntStatus.innerHTML = '■';
  simStatusElement.appendChild( gruntStatus );

  var buildStatus = document.createElement( 'span' );
  buildStatus.classList.add( 'build' );
  buildStatus.innerHTML = '■';
  simStatusElement.appendChild( buildStatus );

  var simNameStatus = document.createElement( 'span' );
  simNameStatus.classList.add( 'simName' );
  simNameStatus.innerHTML = simName;
  simStatusElement.appendChild( simNameStatus );
}

function nextBuild() {
  if ( buildQueue.length ) {
    var simName = buildQueue.shift();

    var req = new XMLHttpRequest();
    req.onload = function() {
      var data = JSON.parse( req.responseText );

      if ( data.sim === simName && data.success ) {
        console.log( simName + ' built successfully' );
        simStatusElements[ simName ].classList.add( 'complete-grunt' );
        testQueue.push( {
          simName: simName,
          isBuild: true
        } );
        if ( !currentTest ) {
          nextSim();
        }
      }
      else {
        console.log( 'error building ' + simName );
        simStatusElements[ simName ].classList.add( 'error-grunt' );

        eventLog.style.display = 'block';
        gruntErrors.style.display = 'block';
        gruntErrors.innerHTML += '<strong>' + simName + '</strong>';
        gruntErrors.innerHTML += '<pre>' + data.output + '</pre>';
      }

      nextBuild();
    };
    console.log( 'building ' + simName );
    req.open( 'GET', 'http://' + window.location.hostname + ':45361/' + simName, true );
    req.send();
  }
}

// loads a sim into the iframe
function loadSim( simName, isBuild ) {
  iframe.src = '../../' + simName + '/' + ( isBuild ? 'build/' : '' ) + simName + '_en.html?' + simQueryParameters.join( '&' );
  simStatusElements[ simName ].classList.add( 'loading-' + ( isBuild ? 'build' : 'dev' ) );
}
// switches to the next sim (if there are any)
function nextSim() {
  clearTimeout( timeoutId );

  if ( currentTest ) {
    simStatusElements[ currentTest.simName ].classList.add( 'complete-' + ( currentTest.isBuild ? 'build' : 'dev' ) );
  }

  if ( testQueue.length ) {
    var test = testQueue.shift();
    currentTest = test;
    loadSim( test.simName, test.isBuild );
    timeoutId = setTimeout( nextSim, DURATION_PER_SIM );
  }
  else {
    iframe.src = 'about:blank';
    currentTest = null;
  }
}

function onSimLoad( simName ) {
  console.log( 'loaded ' + simName );

  var isBuild = simName === currentTest.simName && currentTest.isBuild;

  // not loading anymore
  simStatusElements[ simName ].classList.remove( 'loading-' + ( isBuild ? 'build' : 'dev' ) );

  // window.open stub on child. otherwise we get tons of "Report Problem..." popups that stall
  iframe.contentWindow.open = function() {
    return {
      focus: function() {},
      blur: function() {}
    }
  };

  if ( loadOnly ) {
    nextSim();
  }
}

function onSimError( simName, data ) {
  console.log( 'error on ' + simName );

  var isBuild = simName === currentTest.simName && currentTest.isBuild;
  var errorLog = isBuild ? buildErrors : devErrors;

  eventLog.style.display = 'block';
  errorLog.style.display = 'block';
  errorLog.innerHTML += '<strong>' + simName + '</strong>';

  if ( data.message ) {
    console.log( 'message: ' + data.message );
    errorLog.innerHTML += '<pre>' + data.message + '</pre>';
  }
  if ( data.stack ) {
    console.log( data.stack );
    errorLog.innerHTML += '<pre>' + data.stack + '</pre>';
  }

  simStatusElements[ simName ].classList.add( 'error-' + ( isBuild ? 'build' : 'dev' ) );

  // since we can have multiple errors for a single sim (due to being asynchronous),
  // we need to not move forward more than one sim
  if ( simName === currentTest.simName ) {
    // on failure, speed up by switching to the next sim
    nextSim();
  }
}

// handling messages from sims
window.addEventListener( 'message', function( evt ) {
  var data = JSON.parse( evt.data );

  function simNameFromURL( url ) {
    // url like http://localhost/phet/git/molecule-shapes/molecule-shapes_en.html?ea&postMessageOnLoad&postMessageOnError
    // output molecule-shapes
    return url.slice( 0, url.lastIndexOf( '_en.html' ) ).slice( url.lastIndexOf( '/' ) + 1 );
  }

  var simName;
  if ( data.type === 'load' ) {
    onSimLoad( simNameFromURL( data.url ) );
  }
  else if ( data.type === 'error' ) {
    onSimError( simNameFromURL( data.url ), data );
  }
} );

// load the list of sims before kicking things off
(function() {
  var req = new XMLHttpRequest();
  req.onload = function() {
    var simListText = req.responseText;
    // handle empty lines (or newline at the end) gracefully
    simNames = simListText.replace( /\r/g, '' ).split( '\n' ).filter( function( simName ) {
      return simName.length > 0;
    } );

    simNames.forEach( function( simName ) {
      createStatusElement( simName );

      // ready to test all dev versions
      testQueue.push( {
        simName: simName,
        build: false
      } );

      buildQueue.push( simName );
    } );

    // kick off the loops
    nextSim();
    nextBuild();
  };
  // location of active sims
  req.open( 'GET', '../../chipper/data/active-runnables', true );
  req.send();
})();
