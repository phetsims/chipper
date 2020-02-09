// Copyright 2020, University of Colorado Boulder

/**
 * Kicks off the loading of runtime strings very early in the compilation-free loading process, ideally so that it
 * doesn't block the loading of modules. This is because we need the string information to be loaded before we can
 * kick off the module process.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

( () => {
  // Namespace verification
  window.phet = window.phet || {};
  window.phet.chipper = window.phet.chipper || {};

  // Constructing the string map
  window.phet.chipper.strings = {};

  let remainingFilesToProcess = 0;

  const processStringFile = ( stringObject, requirejsNamespace, locale ) => {
    // if a key has `value`, it's a string with that value

    const prefix = `${requirejsNamespace}/`;

    // Ensure a locale-specific sub-object
    phet.chipper.strings[ locale ] = phet.chipper.strings[ locale ] || {};
    const stringMap = phet.chipper.strings[ locale ];

    const recurse = ( path, object ) => {
      Object.keys( object ).forEach( key => {
        if ( key === 'value' ) {
          stringMap[ `${prefix}${path}` ] = object.value;
        }
        else if ( typeof object[ key ] === 'object' ) {
          recurse( `${path}${path.length ? '.' : ''}${key}`, object[ key ] );
        }
      } );
    };
    recurse( '', stringObject );
  };

  const requestStringFile = ( repo, requirejsNamespace, locale ) => {
    remainingFilesToProcess++;

    const request = new XMLHttpRequest();
    request.addEventListener( 'load', () => {
      try {
        processStringFile( JSON.parse( request.responseText ), requirejsNamespace, locale );
      }
      catch ( e ) {
        console.log( `Could not parse string file for ${repo} with locale ${locale}` );
      }
      if ( --remainingFilesToProcess === 0 ) {
        finishProcessing();
      }
    } );

    request.addEventListener( 'error', () => {
      console.log( `Could not load string file for ${repo} with locale ${locale}, perhaps that translation does not exist yet?` );
      if ( --remainingFilesToProcess === 0 ) {
        finishProcessing();
      }
    } );

    request.open( 'GET', `../${locale === 'en' ? '' : 'babel/'}${repo}/${repo}-strings_${locale}.json`, true ); // enable CORS
    request.send();
  };

  const finishProcessing = () => {
    window.phet.chipper.loadModules();
  };

  const customLocale = new window.URLSearchParams( window.location.search ).get( 'locale' );
  const loadCustomLocale = customLocale && customLocale !== 'en';
  const locales = [
    'en',
    ...( loadCustomLocale ? [ customLocale ] : [] ), // e.g. 'zh_CN'
    ...( ( loadCustomLocale && customLocale.length > 2 ) ? [ customLocale.slice( 0, 2 ) ] : [] ) // e.g. 'zh'
  ];

  phet.chipper.stringRepos.forEach( stringRepoData => {
    const repo = stringRepoData.repo;
    const requirejsNamespace = stringRepoData.requirejsNamespace;

    locales.forEach( locale => {
      requestStringFile( repo, requirejsNamespace, locale );
    } );
  } );
} )();