// Copyright 2020-2022, University of Colorado Boulder

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

  // Prefixes, ideally a better way of accessing localeInfo on startup would exist. We have localeInfo, however it's
  // in the form of a module, and we can't use that at this point.
  const rtlLocales = [ 'ae', 'ar', 'fa', 'iw', 'ur' ];

  const localeQueryParam = new window.URLSearchParams( window.location.search ).get( 'locale' );
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

          if ( locale === FALLBACK_LOCALE && object.metadata ) {
            phet.chipper.stringMetadata[ stringKey ] = object.metadata;
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
   * Load a conglomerate string file with many locales. Only used in locales=*
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
   * Fires off a request for a conglomerate string object file.  Only used in locales=*
   *
   * @param {string} repo - The repository name
   * @param {string} requirejsNamespace - e.g. 'JOIST'
   * @param {Function|null} successCallback
   */
  const requestConglomerateFile = ( repo, requirejsNamespace, successCallback ) => {
    remainingFilesToProcess++;

    const request = new XMLHttpRequest();
    request.addEventListener( 'load', () => {
      if ( request.status === 200 ) {
        let json;
        try {
          json = JSON.parse( request.responseText );
        }
        catch( e ) {
          throw new Error( `Could not parse conglomerate string file for ${repo}, perhaps that translation does not exist yet?` );
        }
        processConglomerateStringFile( json, requirejsNamespace );
        successCallback && successCallback();
      }
      if ( --remainingFilesToProcess === 0 ) {
        finishProcessing();
      }
    } );

    request.addEventListener( 'error', () => {
      if ( !( localesQueryParam === '*' ) ) {
        console.log( `Could not load conglomerate string file for ${repo}, perhaps that translation does not exist yet?` );
      }
      if ( --remainingFilesToProcess === 0 ) {
        finishProcessing();
      }
    } );

    request.open( 'GET', `../babel/_generated_development_strings/${repo}_all.json`, true );
    request.send();
  };

  /**
   * Fires off a request for a string object file, either in babel (for non-English) strings, or in the actual repo
   * (for English) strings. When it is loaded, it will try to parse the response and then pass the object for
   * processing.
   *
   * @param {string} repo - The repository name
   * @param {string} requirejsNamespace - e.g. 'JOIST'
   * @param {string} locale
   * @param {Function|null} successCallback
   */
  const requestStringFile = ( repo, requirejsNamespace, locale, successCallback ) => {
    remainingFilesToProcess++;

    const request = new XMLHttpRequest();
    request.addEventListener( 'load', () => {
      if ( request.status === 200 ) {
        let json;
        try {
          json = JSON.parse( request.responseText );
        }
        catch( e ) {
          throw new Error( `Could not parse string file for ${repo} with locale ${locale}, perhaps that translation does not exist yet?` );
        }
        processStringFile( json, requirejsNamespace, locale );
        successCallback && successCallback();
      }
      if ( --remainingFilesToProcess === 0 ) {
        finishProcessing();
      }
    } );

    request.addEventListener( 'error', () => {
      if ( !( localesQueryParam === '*' ) ) {
        console.log( `Could not load string file for ${repo} with locale ${locale}, perhaps that translation does not exist yet?` );
      }
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

  let locales = [ FALLBACK_LOCALE ];

  if ( localesQueryParam === '*' ) {
    locales = 'aa,ab,ae,af,ak,am,an,ar,ar_MA,ar_SA,as,av,ay,az,ba,be,bg,bh,bi,bm,bn,bo,br,bs,ca,ce,ch,co,cr,cs,cu,cv,cy,da,de,dv,dz,ee,el,en,en_CA,en_GB,eo,es,es_CO,es_CR,es_ES,es_MX,es_PE,et,eu,fa,ff,fi,fj,fo,fr,fu,fy,ga,gd,gl,gn,gu,gv,ha,hi,ho,hr,ht,hu,hy,hz,ia,ie,ig,ii,ik,in,io,is,it,iu,iw,ja,ji,jv,ka,kg,ki,kj,kk,kl,km,kn,ko,kr,ks,ku,ku_TR,kv,kw,ky,la,lb,lg,li,lk,ln,lo,lt,lu,lv,mg,mh,mi,mk,ml,mn,mo,mr,ms,mt,my,na,nb,nd,ne,ng,nl,nn,nr,nv,ny,oc,oj,om,or,os,pa,pi,pl,ps,pt,pt_BR,qu,rm,rn,ro,ru,rw,ry,sa,sc,sd,se,sg,sh,si,sk,sl,sm,sn,so,sq,sr,ss,st,su,sv,sw,ta,te,tg,th,ti,tk,tl,tn,to,tr,ts,tt,tw,ty,ug,uk,ur,uz,ve,vi,vo,wa,wo,xh,yo,za,zh_CN,zh_HK,zh_TW,zu'.split( ',' );
  }
  else {
    // Load other locales we might potentially need (keeping out duplicates)
    [
      localeQueryParam,
      ...( localesQueryParam ? localesQueryParam.split( ',' ) : [] )
    ].forEach( locale => {
      if ( locale ) {
        // e.g. 'zh_CN'
        if ( !locales.includes( locale ) ) {
          locales.push( locale );
        }
        // e.g. 'zh'
        const shortLocale = locale.slice( 0, 2 );
        if ( locale.length > 2 && !locales.includes( shortLocale ) ) {
          locales.push( shortLocale );
        }
      }
    } );
  }

  // See if our request for the sim-specific strings file works. If so, only then will we load the common repos files
  // for that locale.
  const ourRepo = phet.chipper.packageObject.name;
  let ourRequirejsNamespace;
  phet.chipper.stringRepos.forEach( data => {
    if ( data.repo === ourRepo ) {
      ourRequirejsNamespace = data.requirejsNamespace;
    }
  } );

  if ( localesQueryParam === '*' ) {

    // Load the conglomerate files
    requestConglomerateFile( ourRepo, ourRequirejsNamespace, () => {
      phet.chipper.stringRepos.forEach( stringRepoData => {
        const repo = stringRepoData.repo;
        if ( repo !== ourRepo ) {
          requestConglomerateFile( repo, stringRepoData.requirejsNamespace, null );
        }
      } );
    } );

    // Even though the English strings are included in the conglomerate file, load the english file directly so that
    // you can change _en strings without having to run 'grunt generate-unbuilt-strings' before seeing changes.
    requestStringFile( ourRepo, ourRequirejsNamespace, 'en', () => {
      phet.chipper.stringRepos.forEach( stringRepoData => {
        const repo = stringRepoData.repo;
        if ( repo !== ourRepo ) {
          requestStringFile( repo, stringRepoData.requirejsNamespace, 'en', null );
        }
      } );
    } );
  }
  else {

    // Load just the specified locales
    locales.forEach( locale => {
      requestStringFile( ourRepo, ourRequirejsNamespace, locale, () => {
        phet.chipper.stringRepos.forEach( stringRepoData => {
          const repo = stringRepoData.repo;
          if ( repo !== ourRepo ) {
            requestStringFile( repo, stringRepoData.requirejsNamespace, locale, null );
          }
        } );
      } );
    } );
  }
} )();