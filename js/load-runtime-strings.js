// Copyright 2020, University of Colorado Boulder

/**
 * Kicks off the loading of runtime strings very early in the unbuilt loading process, ideally so that it
 * doesn't block the loading of modules. This is because we need the string information to be loaded before we can
 * kick off the module process.
 *
 * It will fill up phet.chipper.strings with the needed values, for use by simulation code and in particular
 * getStringModule. It will then call window.phet.chipper.loadModules() once complete, to progress with the module
 * process.
 *
 * To function properly, phet.chipper.stringRepos will need to be defined before this executes (generally in the
 * initialization script, or in the dev .html).
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

  /**
   * Takes the string-file object for a given locale/requirejsNamespace, and fills in the phet.chipper.strings inside
   * that locale with any recognized strings inside.
   *
   * @param {Object} stringObject - In general, an object where if it has a `value: {string}` key then it represents
   *                                a string key with a value, otherwise each level represents a grouping.
   * @param {string} requirejsNamespace - e.g. 'JOIST'
   * @param {string} locale
   */
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
        else if ( object[ key ] && typeof object[ key ] === 'object' ) {
          recurse( `${path}${path.length ? '.' : ''}${key}`, object[ key ] );
        }
      } );
    };
    recurse( '', stringObject );
  };

  /**
   * Fires off a request for a string object file, either in babel (for non-English) strings, or in the actual repo
   * (for English) strings. When it is loaded, it will try to parse the response and then pass the object for
   * processing.
   *
   * @param {string} repo - The repository name
   * @param {string} requirejsNamespace - e.g. 'JOIST'
   * @param {string} locale
   */
  const requestStringFile = ( repo, requirejsNamespace, locale ) => {
    remainingFilesToProcess++;

    const request = new XMLHttpRequest();
    request.addEventListener( 'load', () => {
      let json;
      try {
        json = JSON.parse( request.responseText );
      }
      catch ( e ) {
        console.log( `Could not parse string file for ${repo} with locale ${locale}, perhaps that translation does not exist yet?` );
      }
      if ( json ) {
        processStringFile( json, requirejsNamespace, locale );
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

  // The callback to execute when all string files are processed.
  const finishProcessing = () => {
    // Progress with loading modules
    window.phet.chipper.loadModules();
  };

  // We don't use QueryStringMachine, because we are loaded first.
  const customLocale = new window.URLSearchParams( window.location.search ).get( 'locale' );
  const loadCustomLocale = customLocale && customLocale !== 'en';
  const locales = [
    'en',
    ...( loadCustomLocale ? [ customLocale ] : [] ), // e.g. 'zh_CN'
    ...( ( loadCustomLocale && customLocale.length > 2 && customLocale.slice( 0, 2 ) !== 'en' ) ? [ customLocale.slice( 0, 2 ) ] : [] ) // e.g. 'zh'
  ];

  phet.chipper.stringRepos.forEach( stringRepoData => {
    const repo = stringRepoData.repo;
    const requirejsNamespace = stringRepoData.requirejsNamespace;

    locales.forEach( locale => {
      requestStringFile( repo, requirejsNamespace, locale );
    } );
  } );
} )();