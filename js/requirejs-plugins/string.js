// Copyright 2013-2019, University of Colorado Boulder

/**
 * String plugin, loads a string using a syntax like:
 * const title = require( 'string!JOHN_TRAVOLTAGE/john-travoltage.title' );
 *
 * This file conforms to the RequireJS plugin API which is described here: http://requirejs.org/docs/plugins.html#api
 *
 * The reasons we need our own string plugin:
 * So we can only include the (possibly) strings that are needed for a sim
 * So we can enumerate all of the used strings, for purposed of a translation utility
 * For uniformity with image and sound plugin
 *
 * The plugin code itself is excluded from the build by declaring it as a stubModule
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const _ = require( '../../sherpa/lib/lodash-4.17.4.min' ); // eslint-disable-line require-statement-match
  const ChipperStringUtils = require( '../../chipper/js/common/ChipperStringUtils' );
  const text = require( 'text' );

  let hasStartedLocaleDataLoad = false;
  let hasCompletedLocaleDataLoad = false;
  const onLocaleDataLoadCallbacks = [];
  const loadLocaleData = () => {
    const request = new XMLHttpRequest();
    request.addEventListener( 'load', () => {
      phet.chipper.localeData = JSON.parse( request.responseText );

      phet.chipper.checkAndRemapLocale && phet.chipper.checkAndRemapLocale();

      hasCompletedLocaleDataLoad = true;
      onLocaleDataLoadCallbacks.forEach( callback => callback() );
    } );

    request.addEventListener( 'error', () => {
      throw new Error( 'could not load localeData' );
    } );

    request.open( 'GET', '../babel/localeData.json', true );
    request.send();
  };

  let globalLocale = null;

  // Cache the loaded strings so they only have to be read once through file.read (for performance)
  // Object.<loadedURL:string,Object.<stringKeyName:string, stringValueObject:{value:string}>>}
  // Where stringValueObject is the value of each key in string json files.
  const cache = {};

  // See documentation of stringTest query parameter in initialize-globals.js
  const stringTest = ( typeof window !== 'undefined' && window.phet.chipper.queryParameters.stringTest ) ?
                     window.phet.chipper.queryParameters.stringTest :
                     null;

  /**
   * When running in requirejs mode, check to see if we have already loaded the specified file
   * Also parses it so that only happens once per file (instead of once per string key)
   * @param {string} url path for the string
   * @param {function} callback callback when the check succeeds
   * @param {function} errorBack callback for when an error occurred
   */
  const getWithCache = ( url, callback, errorBack ) => {

    const isRTL = phet.chipper.localeData[ globalLocale ].direction === 'rtl';

    // Check for cache hit, see discussion in https://github.com/phetsims/chipper/issues/730
    if ( cache[ url ] ) {
      callback( cache[ url ] );
    }
    else {

      // Cache miss: load the file parse, enter into cache and return it
      text.get( url, loadedText => {
        const parsed = JSON.parse( loadedText );
        for ( const stringKey in parsed ) {
          if ( parsed.hasOwnProperty( stringKey ) ) {

            // remove leading/trailing whitespace, see chipper#619. Do this before addDirectionalFormatting
            parsed[ stringKey ].value = parsed[ stringKey ].value.trim();

            parsed[ stringKey ].value = ChipperStringUtils.addDirectionalFormatting( parsed[ stringKey ].value, isRTL );
          }
        }
        cache[ url ] = parsed;
        callback( cache[ url ] );
      }, errorBack, { accept: 'application/json' } );
    }
  };

  return {

    /**
     * load is a function, and it will be called with the following arguments
     * Documentation taken from http://requirejs.org/docs/plugins.html#apiload
     * @param {string} name - The name of the resource to load. This is the part after the ! separator in the name. So,
     *        if a module asks for 'foo!something/for/foo', the foo module's load function will receive
     *        'something/for/foo' as the name.
     * @param {function} parentRequire - A local "require" function to use to load other modules. This require function
     *        has some utilities on it:
     *          parentRequire.toUrl(moduleResource): where moduleResource is a module name plus an extension. For
     *            instance "view/templates/main.html". It will return a full path to the resource, obeying any RequireJS
     *            configuration.
     *          parentRequire.defined(moduleName): Returns true if the module has already been loaded and defined.
     *            Used to be called require.isDefined before RequireJS 0.25.0.
     *          parentRequire.specified(moduleName): Returns true if the module has already been requested or is in the
     *            process of loading and should be available at some point.
     * @param {function} onload - A function to call with the value for name. This tells the loader that the plugin is
     *        done loading the resource. onload.error() can be called, passing an error object to it, if the plugin
     *        detects an error condition that means the resource will fail to load correctly.
     * @param {Object} config - A configuration object. This is a way for the optimizer and the web app to pass
     *        configuration information to the plugin. The i18n! plugin uses this to get the current current locale, if
     *        the web app wants to force a specific locale. The optimizer will set an isBuild property in the config to
     *        true if this plugin (or pluginBuilder) is being called as part of an optimizer build.
     */
    load: ( name, parentRequire, onload, config ) => {

      // Extract the key. Eg for 'JOHN_TRAVOLTAGE/john-travoltage.title', the key is 'john-travoltage.title'.
      const key = name.substring( name.lastIndexOf( '/' ) + 1 );

      // Apply the cache bust args (but only during requirejs mode)
      const suffix = config.isBuild ? '' : config.urlArgs( name, '' );

      const requirejsNamespace = name.substring( 0, name.indexOf( '/' ) ); // e.g. 'SOME_SIM'
      let requirePath;
      let repositoryPath;
      let repositoryName;

      // {function(string):string} - map locale to strings filename
      const getFilenameForLocale = locale => `${repositoryName}-strings_${locale}.json${suffix}`;

      // config.isBuild is set by to true when building the sim, i.e. running with the requirejs optimizer
      if ( config.isBuild ) {

        // --- build mode ---

        // extract information about the repository name, prefix, and path that will be recorded for later in the build
        requirePath = parentRequire.toUrl( requirejsNamespace ); // e.g. '/Users/something/phet/git/some-sim/js'
        if ( requirePath.substring( requirePath.lastIndexOf( '/' ) ) !== '/js' ) {
          onload.error( new Error( 'requirejs namespace REPO must resolve to repo/js' ) );
        }
        repositoryPath = requirePath.substring( 0, requirePath.lastIndexOf( '/' ) ); // e.g. '/Users/something/phet/git/some-sim'
        repositoryName = repositoryPath.substring( repositoryPath.lastIndexOf( '/' ) + 1 ); // e.g. 'some-sim'

        // lazily construct our strings list
        global.phet.chipper.strings = global.phet.chipper.strings || {};

        // entry saved for later in the build
        global.phet.chipper.strings[ name ] = {
          name: name, // 'SOME_SIM/string.title'
          requirejsNamespace: requirejsNamespace, // 'SOME_SIM'
          requirePath: requirePath, // '/Users/something/phet/git/some-sim/js'
          repositoryPath: repositoryPath, // '/Users/something/phet/git/some-sim'
          repositoryName: repositoryName // 'some-sim'
        };

        // tell require.js we're done processing
        onload( null );
      }
      else {

        // --- requirejs mode ---

        requirePath = parentRequire.toUrl( requirejsNamespace );
        if ( requirePath.indexOf( '?' ) >= 0 ) {
          requirePath = requirePath.substring( 0, requirePath.indexOf( '?' ) );
        }
        repositoryPath = `${requirePath}/..`;
        repositoryName = requirejsNamespace.toLowerCase().split( '_' ).join( '-' );

        const runLoad = () => {
          // strings may be specified via the 'strings' query parameter, value is expected to be encoded to avoid URI-reserved characters
          const queryParameterStrings = JSON.parse( phet.chipper.queryParameters.strings || '{}' );

          // Duplicated locale loading
          if ( globalLocale === null ) {
            let locale = phet.chipper.queryParameters.locale;

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
                const possibleLocales = Object.keys( phet.chipper.localeData );
                for ( let i = 0; i < possibleLocales.length; i++ ) {
                  if ( phet.chipper.localeData[ possibleLocales[ i ] ].locale3 === locale ) {
                    locale = possibleLocales[ i ];
                    break;
                  }
                }
              }
            }

            if ( !phet.chipper.localeData[ locale ] ) {
              locale = 'en';
            }

            globalLocale = locale;
          }

          const locale = globalLocale;

          // In the browser, a string specified via the '?strings' query parameter overrides anything,
          // to match the behavior of the chipper version (for dynamically substituting new strings like in the translation utility)
          const queryParameterStringValue = queryParameterStrings[ name ];
          if ( queryParameterStringValue ) {
            onload( queryParameterStringValue );
          }
          else {

            // Read the locale from a query parameter, if it is there, or use the fallback locale
            if ( !phet.chipper.localeData[ locale ] ) {
              onload.error( new Error( `unsupported locale: ${locale}` ) );
            }

            const fallbackLocales = [ locale ];
            const specificLocaleData = phet.chipper.localeData[ locale ];
            if ( specificLocaleData && specificLocaleData.fallbackLocales ) {
              specificLocaleData.fallbackLocales.forEach( function( locale ) {
                fallbackLocales.push( locale );
              } );
            }
            fallbackLocales.push( 'en' );

            let stringMap = {};

            // We will iteratively "wrap" this function with layers to load into stringMap
            let call = () => {
              const stringFromMap = _.at( stringMap, key )[ 0 ].value;
              if ( stringFromMap === null || stringFromMap === undefined ) {
                throw new Error( `String not found: ${key}` );
              }

              onload( window.phet.chipper.mapString( stringFromMap, stringTest ) );
            };

            // In order, so the "last" (outer) will be 'en', and it will be the first to be processed
            fallbackLocales.forEach( fallbackLocale => {
              const oldCall = call;

              const filename = getFilenameForLocale( fallbackLocale );
              const url = fallbackLocale === 'en' ? `${repositoryPath}/${filename}` : `${repositoryPath}/../babel/${repositoryName}/${filename}`;


              call = () => {
                getWithCache( url, fallbackStringMap => {
                  stringMap = _.extend( {}, stringMap, fallbackStringMap );
                  oldCall();
                }, () => {
                  // could not load the strings
                  console.log( `no string file for ${url}` );
                  oldCall();
                } );
              };
            } );

            call();
          }
        };

        // Take over the first load, and include the localeData load WITH it.
        if ( !hasCompletedLocaleDataLoad ) {
          onLocaleDataLoadCallbacks.push( runLoad );

          if ( !hasStartedLocaleDataLoad ) {
            hasStartedLocaleDataLoad = true;
            loadLocaleData();
          }
        }
        else {
          runLoad();
        }
      }
    },

    /**
     * Write code that will look up the string in the compiled sim, used in the compilation step.  write is only used
     * by the optimizer, and it only needs to be implemented if the plugin can output something that would belong in an
     * optimized layer.
     *
     * Documentation taken from http://requirejs.org/docs/plugins.html#apiwrite
     *
     * It is called with the following arguments:
     * @param {string} pluginName - The normalized name for the plugin. Most plugins will not be authored with a name
     *          (they will be anonymous plugins) so it is useful to know the normalized name for the plugin module for use
     *          in the optimized file.
     * @param {string} moduleName - The normalized resource name.
     * @param {function} write - A function to be called with a string of output to write to the optimized file. This
     *          function also contains a property function, write.asModule(moduleName, text). asModule can be used to
     *          write out a module that may have an anonymous define call in there that needs name insertion or/and
     *          contains implicit require("") dependencies that need to be pulled out for the optimized file. asModule
     *          is useful for text transform plugins, like a CoffeeScript plugin.
     */
    write: ( pluginName, moduleName, write ) => {
      write( `define("${pluginName}!${moduleName}",function(){return window.phet.chipper.strings.get(\"${moduleName}\");});\n` );
    }
  };
} );
