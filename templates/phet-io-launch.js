// Copyright 2013-2015, University of Colorado Boulder
// This template is used in the phet-io brand for the startup sequence, allowing automatic startup or wrapper-initiated startup
// See https://github.com/phetsims/together/issues/181 for full details of the phet-io startup sequence
// This code is a near-duplicate in sim-development.html

// This function launches the simulation by running the main require.js code
var launchSimulation = function() {

  // Clean up the global namespace, if we polluted it.
  if ( window.phetLaunchSimulation ) {
    delete window.phetLaunchSimulation;
  }

  // Load the main require.js code for the simulation.
  /*MAIN_INLINE_JAVASCRIPT*/
};

// The ?phet-io-standalone query parameter will cause a phet-io simulation to launch, even without a wrapper "go-ahead" step
var standalone = window.location.search.slice( 1 ).split( '&' ).indexOf( 'phet-io-standalone' ) >= 0;

if ( standalone ) {

  // Launch the simulation immediately
  launchSimulation();
}
else {

  // Wait for the wrapper to start up the sim, after it has finished pre-launch configuration.
  // We cannot use the phet namespace yet since it does not yet exist.
  if ( typeof window.phetLaunchSimulation !== 'undefined' ) {
    throw new Error( 'window.phetLaunchSimulation was already defined' );
  }
  window.phetLaunchSimulation = launchSimulation;
}