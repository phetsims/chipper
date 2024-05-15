// Copyright 2020, University of Colorado Boulder

/**
 * NOTE: This is only for loading strings in the unbuilt mode.
 *
 * NOTE: This will check the query string value for ?locale directly. See initialize-globals.js for reference.
 *
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
 * A string "key" is in the form of "NAMESPACE/key.from.strings.json"
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

  const FALLBACK_LOCALE = 'en';

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

    const stringKeyPrefix = `${requirejsNamespace}/`;

    // Ensure a locale-specific sub-object
    phet.chipper.strings[ locale ] = phet.chipper.strings[ locale ] || {};
    const localeStringMap = phet.chipper.strings[ locale ];

    const recurse = ( path, object ) => {
      Object.keys( object ).forEach( key => {
        if ( key === 'value' ) {
          localeStringMap[ `${stringKeyPrefix}${path}` ] = object.value;
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

    request.open( 'GET', `../${locale === FALLBACK_LOCALE ? '' : 'babel/'}${repo}/${repo}-strings_${locale}.json`, true );
    request.send();
  };

  // The callback to execute when all string files are processed.
  const finishProcessing = () => {
    // Progress with loading modules
    window.phet.chipper.loadModules();
  };

  const requestLocaleDataFile = callback => {
    const request = new XMLHttpRequest();
    request.addEventListener( 'load', () => {
      phet.chipper.localeData = JSON.parse( request.responseText );

      callback();
    } );

    request.addEventListener( 'error', () => {
      throw new Error( 'could not load localeData' );
    } );

    request.open( 'GET', '../babel/localeData.json', true );
    request.send();
  };

  requestLocaleDataFile( () => {
    phet.chipper.checkAndRemapLocale && phet.chipper.checkAndRemapLocale();

    // If we haven't loaded initialize-globals yet, this is somewhat duplicated (for MR)
    if ( !phet.chipper.locale ) {
      let locale = new window.URLSearchParams( window.location.search ).get( 'locale' );

      if ( locale ) {
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
      }

      if ( !phet.chipper.localeData[ locale ] ) {
        locale = 'en';
      }

      phet.chipper.locale = locale;
    }

    const locales = [ FALLBACK_LOCALE ];
    if ( phet.chipper.locale !== FALLBACK_LOCALE ) {
      locales.push( phet.chipper.locale );
    }
    const specificLocaleData = phet.chipper.localeData[ phet.chipper.locale ];
    if ( specificLocaleData && specificLocaleData.fallbackLocales ) {
      specificLocaleData.fallbackLocales.forEach( locale => {
        locales.push( locale );
      } );
    }

    phet.chipper.stringRepos.forEach( stringRepoData => {
      const repo = stringRepoData.repo;
      const requirejsNamespace = stringRepoData.requirejsNamespace;

      locales.forEach( locale => {
        requestStringFile( repo, requirejsNamespace, locale );
      } );
    } );
  } );
} )();