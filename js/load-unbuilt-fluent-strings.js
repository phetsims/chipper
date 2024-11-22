// Copyright 2024, University of Colorado Boulder

/**
 * A PROTOTYPE for loading unbuilt fluent strings. Meant to be a preload script, pulling in
 * the fluent strings before the simulation is loaded.
 *
 * This will need to be integrated into PhET's other string loading in a more general way.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

( () => {
  window.phet = window.phet || {};
  window.phet.chipper = window.phet.chipper || {};

  const repoName = phet.chipper.packageObject.name;

  // Constructing the string map
  window.phet.chipper.fluentStrings = {};

  const requestFluentFile = locale => {
    const xhr = new XMLHttpRequest();
    xhr.open( 'GET', `${repoName}-strings_${locale}.ftl`, true );
    xhr.responseType = 'text';
    xhr.onload = () => {
      if ( xhr.status === 200 ) {
        window.phet.chipper.fluentStrings[ locale ] = xhr.response;
      }
    };

    xhr.onerror = () => {

      // Handle network errors gracefully
      console.warn( `Network error while requesting fluent file for locale ${locale}` );
    };

    xhr.send();
  };

  // TODO: https://github.com/phetsims/joist/issues/992
  //   How to get these? I tried using Object.keys( phet.chipper.strings ) (like availableRuntimeLocales), but that
  //   results in many 404 errors when there ins't a file to load. load-unbuilt-strings.js pulls from babel but I
  //   didn't undersetand that. And this prototype pulls files from the sim repo for now. These also don't
  //   support fallback locales appropriately.
  const localeList = [ 'en', 'es' ];

  localeList.forEach( locale => {
    requestFluentFile( locale );
  } );
} )();