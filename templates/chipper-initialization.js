window.phet = {};
window.phet.chipper = {};
window.phet.chipper.project = '{{PHET_PROJECT}}';
window.phet.chipper.version = '{{PHET_VERSION}}';
window.phet.chipper.buildTimestamp = '{{PHET_BUILD_TIMESTAMP}}';
window.phet.chipper.brand = '{{PHET_BRAND}}';
window.phet.chipper.locale = '{{PHET_LOCALE}}';

// This simulation uses following third-party resources.  The following code block describes each resource
// and provides its licensing information.  The START and END tags make it easy to automatically parse
// and the entries are in JSON.  See getLicenseEntry.js for information about the attributes in each entry.
// {{PHET_START_THIRD_PARTY_LICENSE_ENTRIES}}
window.phet.chipper.thirdPartyLicenseEntries = {{PHET_THIRD_PARTY_LICENSE_ENTRIES}};
// {{PHET_END_THIRD_PARTY_LICENSE_ENTRIES}}
window.phet.chipper.dependencies = {{PHET_DEPENDENCIES}};
window.phet.chipper.strings = {{PHET_STRINGS}};
window.phet.chipper.isDebugBuild = {{PHET_IS_DEBUG_BUILD}};
window.phet.chipper.packageObject = {{PHET_PACKAGE_OBJECT}};

// IE warning page

// constants
const CSS_STYLING =
  `#ie-warning-container {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 100vh;
    width: 100vw;
    background: white;
    z-index: 10000;
    align-items: center;
  }

  #ie-warning {
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

  #ie-warning .header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 46px;
  }

  #ie-warning .header .h1 {
    font-size: 30px;
    font-weight: 500;
    margin: 0 0 0 10px;
  }

  #ie-warning .header svg {
    width: 36px;
  }

  #ie-warning p {
    margin: 11px 0;
  }`;
const WARNING_ICON_SVG =
  `<svg class="" x="0px" y="0px" viewBox="0 0 27.75 24.44">
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
const userAgent = navigator.userAgent;
let releaseVersion = -1;
let regex = null;
if ( navigator.appName === 'Microsoft Internet Explorer' ) {
  regex = new RegExp( 'MSIE ([0-9]{1,}[.0-9]{0,})' );
  if ( regex.exec( userAgent ) !== null ) {
    releaseVersion = parseFloat( RegExp.$1 );
  }
}
else if ( navigator.appName === 'Netscape' ) {
  regex = new RegExp( 'Trident/.*rv:([0-9]{1,}[.0-9]{0,})' );
  if ( regex.exec( userAgent ) !== null ) {
    releaseVersion = parseFloat( RegExp.$1 );
  }
}

// Browser is IE, so set a global to alert other scripts and show the warning message
if ( releaseVersion !== -1 ) {
  window.isIE = true;

  // create the html elements dynamically
  const ieWarningStyling = document.createElement( 'style' );
  ieWarningStyling.innerText = CSS_STYLING;
  const ieWarningContainer = document.createElement( 'div' );
  ieWarningContainer.id = 'ie-warning-container';
  const ieWarning = document.createElement( 'div' );
  ieWarning.id = 'ie-warning';
  const header = document.createElement( 'div' );
  header.className = 'header';
  const ieWarningHeader = document.createElement( 'h1' );
  ieWarningHeader.id = 'ie-warning-header';
  ieWarningHeader.className = 'h1';
  const ieWarningNotSupported = document.createElement( 'p' );
  ieWarningNotSupported.id = 'ie-warning-not-supported';
  const ieWarningDifferentBrowser = document.createElement( 'p' );
  ieWarningDifferentBrowser.id = 'ie-warning-header';

  const locale = 'en'; // TODO: get from query param and/or html path?
  const strings = window.phet.chipper.strings[ locale ];

  // fill in the translated strings
  ieWarningHeader.innerText = strings[ 'JOIST/ieWarningPage.platformWarning' ];
  ieWarningNotSupported.innerText = strings[ 'JOIST/ieWarningPage.ieIsNotSupported' ];
  ieWarningDifferentBrowser.innerText = strings[ 'JOIST/ieWarningPage.useDifferentBrowser' ];

  // add the html elements to the page
  header.innerHTML = WARNING_ICON_SVG;
  header.appendChild( ieWarningHeader );
  ieWarning.appendChild( header );
  ieWarning.appendChild( ieWarningNotSupported );
  ieWarning.appendChild( ieWarningDifferentBrowser );
  ieWarningContainer.appendChild( ieWarning );
  document.body.appendChild( ieWarningStyling );
  document.body.appendChild( ieWarningContainer );

  // reveal the warning
  document.getElementById( 'ie-warning-container' ).style.display = 'flex';
}