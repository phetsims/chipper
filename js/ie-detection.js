// Copyright 2018-2020, University of Colorado Boulder

/**
 * Detects if the browser in use is Internet Explorer, and shows an error page if so.
 *
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
'use strict';

// constants
const CSS_STYLING =
  `#ie-error-container {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 100vh;
    width: 100vw;
    background: white;
    z-index: 1000000;
    align-items: center;
  }

  #ie-error {
    position: relative;
    border-radius: 10px;
    max-width: 550px;
    margin: auto;
    padding: 30px;
    font-size: 20px;
    font-weight: 500;
    font-family: sans-serif;
    text-align: center;
  }

  #ie-error .header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 46px;
  }

  #ie-error .header .h1 {
    font-size: 30px;
    font-weight: 500;
    margin: 0 0 0 10px;
  }

  #ie-error .header svg {
    width: 36px;
  }

  #ie-error p {
    margin: 14px 0;
  }`;
const ERROR_ICON_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" class="" x="0px" y="0px" viewBox="0 0 27.75 24.44">
     <g>
       <path style="fill:red" d="M12.52,0.78L0.21,22.1c-0.6,1.04,0.15,2.34,1.35,2.34h24.62c1.2,0,1.95-1.3,1.35-2.34L15.22,0.78
         C14.62-0.26,13.12-0.26,12.52,0.78z"/>
       <g>
         <path style="fill:white" d="M13.45,17.19c-1.13-6.12-1.7-9.42-1.7-9.9c0-0.59,0.22-1.07,0.65-1.43c0.44-0.36,0.93-0.54,1.48-0.54
           c0.59,0,1.09,0.19,1.5,0.58C15.79,6.29,16,6.74,16,7.27c0,0.5-0.57,3.81-1.7,9.92H13.45z M15.75,20.46c0,0.52-0.18,0.97-0.55,1.34
           c-0.37,0.37-0.81,0.55-1.32,0.55c-0.52,0-0.97-0.19-1.33-0.55c-0.37-0.37-0.55-0.81-0.55-1.34c0-0.51,0.18-0.95,0.55-1.32
           c0.37-0.37,0.81-0.55,1.33-0.55c0.51,0,0.95,0.18,1.32,0.55C15.57,19.5,15.75,19.94,15.75,20.46z"/>
       </g>
     </g>
   </svg>`;

// Detect which version of IE is in use. Remains -1 if not using IE. Copied from phet-core/platform.js.
const userAgent = window.navigator.userAgent;
let releaseVersion = -1;
let regex = null;
if ( window.navigator.appName === 'Microsoft Internet Explorer' ) {
  regex = new RegExp( 'MSIE ([0-9]{1,}[.0-9]{0,})' );
  if ( regex.exec( userAgent ) !== null ) {
    releaseVersion = parseFloat( RegExp.$1 );
  }
}
else if ( window.navigator.appName === 'Netscape' ) {
  regex = new RegExp( 'Trident/.*rv:([0-9]{1,}[.0-9]{0,})' );
  if ( regex.exec( userAgent ) !== null ) {
    releaseVersion = parseFloat( RegExp.$1 );
  }
}

// Browser is IE, so set a global to alert other scripts and show the error message. Can also be revealed with the
// flag `showInternetExplorerError`
if ( releaseVersion !== -1 || window.location.search.indexOf( 'showInternetExplorerError' ) >= 0 ) {

  // create the html elements dynamically
  const ieErrorStyling = document.createElement( 'style' );
  ieErrorStyling.innerHTML = CSS_STYLING;
  const ieErrorContainer = document.createElement( 'div' );
  ieErrorContainer.id = 'ie-error-container';
  const ieError = document.createElement( 'div' );
  ieError.id = 'ie-error';
  const header = document.createElement( 'div' );
  header.className = 'header';
  const ieErrorHeader = document.createElement( 'h1' );
  ieErrorHeader.id = 'ie-error-header';
  ieErrorHeader.className = 'h1';
  const ieErrorNotSupported = document.createElement( 'p' );
  ieErrorNotSupported.id = 'ie-error-not-supported';
  const ieErrorDifferentBrowser = document.createElement( 'p' );
  ieErrorDifferentBrowser.id = 'ie-error-header';

  // get the locale specified as a query parameter, if there is one
  const localeRegEx = /locale=[a-z]{2}(_[A-Z]{2}){0,1}/g;
  const localeQueryParameterMatches = window.location.search.match( localeRegEx ) || [];
  const localeQueryParameter = localeQueryParameterMatches.length ? localeQueryParameterMatches[ 0 ] : null;
  const localeQueryParameterValue = localeQueryParameter ? localeQueryParameter.split( '=' )[ 1 ] : null;

  // Prioritize the locale specified as a query parameter, otherwise fallback to the built locale. Then get the strings
  // in that locale.
  const locale = localeQueryParameterValue && window.phet.chipper.strings[ localeQueryParameterValue ] ?
                 localeQueryParameterValue : window.phet.chipper.locale;
  const strings = window.phet.chipper.strings[ locale ];

  // fill in the translated strings
  ieErrorHeader.innerText = strings[ 'JOIST/ieErrorPage.platformError' ];
  ieErrorNotSupported.innerText = strings[ 'JOIST/ieErrorPage.ieIsNotSupported' ];
  ieErrorDifferentBrowser.innerText = strings[ 'JOIST/ieErrorPage.useDifferentBrowser' ];

  // add the html elements to the page
  header.innerHTML = ERROR_ICON_SVG;
  header.appendChild( ieErrorHeader );
  ieError.appendChild( header );
  ieError.appendChild( ieErrorNotSupported );
  ieError.appendChild( ieErrorDifferentBrowser );
  ieErrorContainer.appendChild( ieError );
  document.body.appendChild( ieErrorStyling );
  document.body.appendChild( ieErrorContainer );

  // reveal the error
  document.getElementById( 'ie-error-container' ).style.display = 'flex';
}