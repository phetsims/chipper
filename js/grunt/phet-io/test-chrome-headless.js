var chromeLauncher = require('chrome-launcher');
var CDP = require('chrome-remote-interface');

/**
 * Launches a debugging instance of Chrome.
 * @return {Promise<ChromeLauncher>}
 */
function launchChrome() {
  return chromeLauncher.launch( {
    // port: 9222, // Uncomment to force a specific port of your choice.
    chromeFlags: [
      '--window-size=412,732',
      '--disable-gpu',
      '--headless'
    ]
  });
}



  (async function() {

    var chrome = await launchChrome();
    var protocol = await    CDP( { port: chrome.port } );

// Extract the DevTools protocol domains we need and enable them.
// See API docs: https://chromedevtools.github.io/devtools-protocol/
    var { Page, Runtime } = protocol;
    await    Promise.all( [ Page.enable(), Runtime.enable() ] );

    Page.navigate( { url: 'http://localhost/phet-io-wrappers/documentation/documentation.html?sim=faradays-law&ea' } );

// Wait for window.onload before doing stuff.
    Page.loadEventFired( async function(){
      var js = "window.getInstances()";
    // Evaluate the JS expression in the page.

    await setTimeout( async function() {
      var result = await Runtime.evaluate( { expression: js } );

      console.log( 'Title of page: ' + result.result.value );
      protocol.close();
      chrome.kill(); // Kill Chrome.

    }, 2000);

  });

  } )();