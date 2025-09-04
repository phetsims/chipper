// Copyright 2020-2025, University of Colorado Boulder

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
  window.phet.chipper.stringMetadata = {};

  // Will be initialized after we have loaded localeData (below)
  let rtlLocales;

  const localesQueryParam = new window.URLSearchParams( window.location.search ).get( 'locales' );

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
    // See if we are in an RTL locale (lodash is unavailable at this point)
    let isRTL = false;
    rtlLocales.forEach( rtlLocale => {
      if ( locale.startsWith( rtlLocale ) ) {
        isRTL = true;
      }
    } );

    const stringKeyPrefix = `${requirejsNamespace}/`;

    // Ensure a locale-specific sub-object
    phet.chipper.strings[ locale ] = phet.chipper.strings[ locale ] || {};
    const localeStringMap = phet.chipper.strings[ locale ];

    const recurse = ( path, object ) => {
      Object.keys( object ).forEach( key => {
        if ( key === 'value' ) {
          let value = object.value;

          // Add directional marks
          if ( value.length > 0 ) {
            value = `${( isRTL ? '\u202b' : '\u202a' )}${value}\u202c`;
          }

          const stringKey = `${stringKeyPrefix}${path}`;

          localeStringMap[ stringKey ] = value;

          if ( locale === FALLBACK_LOCALE && object.simMetadata ) {
            phet.chipper.stringMetadata[ stringKey ] = object.simMetadata;
          }
        }
        else if ( object[ key ] && typeof object[ key ] === 'object' ) {
          recurse( `${path}${path.length ? '.' : ''}${key}`, object[ key ] );
        }
      } );
    };
    recurse( '', stringObject );
  };

  /**
   * Load a conglomerate string file with many locales.
   */
  const processConglomerateStringFile = ( stringObject, requirejsNamespace ) => {

    const locales = Object.keys( stringObject );

    locales.forEach( locale => {

      // See if we are in an RTL locale (lodash is unavailable at this point)
      let isRTL = false;
      rtlLocales.forEach( rtlLocale => {
        if ( locale.startsWith( rtlLocale ) ) {
          isRTL = true;
        }
      } );

      const stringKeyPrefix = `${requirejsNamespace}/`;

      // Ensure a locale-specific sub-object
      phet.chipper.strings[ locale ] = phet.chipper.strings[ locale ] || {};
      const localeStringMap = phet.chipper.strings[ locale ];

      const recurse = ( path, object ) => {
        Object.keys( object ).forEach( key => {
          if ( key === 'value' ) {
            let value = object.value;

            // Add directional marks
            if ( value.length > 0 ) {
              value = `${( isRTL ? '\u202b' : '\u202a' )}${value}\u202c`;
            }

            localeStringMap[ `${stringKeyPrefix}${path}` ] = value;
          }
          else if ( object[ key ] && typeof object[ key ] === 'object' ) {
            recurse( `${path}${path.length ? '.' : ''}${key}`, object[ key ] );
          }
        } );
      };
      recurse( '', stringObject[ locale ] );
    } );
  };

  /**
   * Fires off a request for a JSON file, either in babel (for non-English) strings, or in the actual repo
   * (for English) strings, or for the unbuilt_en strings file. When it is loaded, it will try to parse the response
   * and then pass the object for processing.
   *
   * @param {string} path - Relative path to load JSON file from
   * @param {Function|null} callback
   */
  const requestJSONFile = ( path, callback ) => {
    remainingFilesToProcess++;

    const request = new XMLHttpRequest();
    request.addEventListener( 'load', () => {
      if ( request.status === 200 ) {
        let json;
        try {
          json = JSON.parse( request.responseText );
        }
        catch( e ) {
          throw new Error( `Could load file ${path}, perhaps that translation does not exist yet?` );
        }
        callback && callback( json );
      }
      if ( --remainingFilesToProcess === 0 ) {
        finishProcessing();
      }
    } );

    request.addEventListener( 'error', () => {
      if ( !( localesQueryParam === '*' ) ) {
        console.log( `Could not load ${path}` );
      }
      if ( --remainingFilesToProcess === 0 ) {
        finishProcessing();
      }
    } );

    request.open( 'GET', path, true );
    request.send();
  };

  // The callback to execute when all string files are processed.
  const finishProcessing = () => {

    // Optional in-browser override of strings for unbuilt mode.
    try {
      const params = new window.URLSearchParams( window.location.search );
      const useOverride = params.has( 'stringsOverride' );
      if ( useOverride ) {
        const key = `phet-strings-override-${ourRepo}`;
        const raw = window.localStorage.getItem( key );
        if ( raw ) {
          const overrideObject = JSON.parse( raw );

          // Apply to English locale for this repo using the same processing as file-based loading.
          ourRequirejsNamespace && processStringFile( overrideObject, ourRequirejsNamespace, 'en' );

          // Clear after applying to avoid unexpected reuse.
          window.localStorage.removeItem( key );
        }
      }
    }
    catch( e ) {
      // Non-fatal: log and continue with default strings.
      console.log( 'Strings override not applied:', e );
    }

    // Because load-unbuilt-strings' "loading" of the locale data and strings might not have happened BEFORE initialize-globals
    // runs (and sets phet.chipper.locale), we'll attempt to handle the case where it hasn't been set yet. You'll see the same call over in initialize-globals
    phet.chipper.checkAndRemapLocale && phet.chipper.checkAndRemapLocale();

    // Progress with loading modules
    window.phet.chipper.loadModules();
  };

  const withStringPath = path => `${phet.chipper.stringPath ? phet.chipper.stringPath : ''}${path}`;

  // Check for phet.chipper.stringPath. This should be set to ADJUST the path to the strings directory, in cases
  // where we're running this case NOT from a repo's top level (e.g. sandbox.html)
  const getStringPath = ( repo, locale ) => withStringPath( `../${locale === FALLBACK_LOCALE ? '' : 'babel/'}${repo}/${repo}-strings_${locale}.json` );

  // See if our request for the sim-specific strings file works. If so, only then will we load the common repos files
  // for that locale.
  const ourRepo = phet.chipper.packageObject.name;
  let ourRequirejsNamespace;
  phet.chipper.stringRepos.forEach( data => {
    if ( data.repo === ourRepo ) {
      ourRequirejsNamespace = data.requirejsNamespace;
    }
  } );

  // TODO https://github.com/phetsims/phet-io/issues/1877 Uncomment this to load the used string list
  // requestJSONFile( `../phet-io-sim-specific/repos/${ourRepo}/used-strings_en.json`, json => {
  //
  //   // Store for runtime usage
  //   phet.chipper.usedStringsEN = json;
  // } );

  // Load locale data
  remainingFilesToProcess++;
  requestJSONFile( withStringPath( '../babel/localeData.json' ), json => {
    phet.chipper.localeData = json;

    rtlLocales = Object.keys( phet.chipper.localeData ).filter( locale => {
      return phet.chipper.localeData[ locale ].direction === 'rtl';
    } );

    // Load the conglomerate files
    requestJSONFile( withStringPath( `../babel/_generated_development_strings/${ourRepo}_all.json` ), json => {
      processConglomerateStringFile( json, ourRequirejsNamespace );
      phet.chipper.stringRepos.forEach( stringRepoData => {
        const repo = stringRepoData.repo;
        if ( repo !== ourRepo ) {
          requestJSONFile( withStringPath( `../babel/_generated_development_strings/${repo}_all.json` ), json => {
            processConglomerateStringFile( json, stringRepoData.requirejsNamespace );
          } );
        }
      } );
    } );

    // Even though the English strings are included in the conglomerate file, load the english file directly so that
    // you can change _en strings without having to run 'grunt generate-unbuilt-strings' before seeing changes.
    requestJSONFile( getStringPath( ourRepo, 'en' ), json => {
      processStringFile( json, ourRequirejsNamespace, 'en' );
      phet.chipper.stringRepos.forEach( stringRepoData => {
        const repo = stringRepoData.repo;
        if ( repo !== ourRepo ) {
          requestJSONFile( getStringPath( repo, 'en' ), json => {
            processStringFile( json, stringRepoData.requirejsNamespace, 'en' );
          } );
        }
      } );
    } );

    remainingFilesToProcess--;
  } );
} )();