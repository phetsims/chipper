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




module.exports = function(done) {

  (async function() { // eslint-disable-line

    var chrome = await launchChrome();
    var protocol = await    CDP( { port: chrome.port } );

    // Extract the DevTools protocol domains we need and enable them.
    // See API docs: https://chromedevtools.github.io/devtools-protocol/
    var { Page, Runtime } = protocol;
    await    Promise.all( [ Page.enable(), Runtime.enable() ] );

    Page.navigate( { url: 'http://localhost/phet-io-wrappers/documentation/documentation.html?sim=faradays-law&ea' } );

    // Wait for window.onload before doing stuff.
    Page.loadEventFired( async function(){

      var isLoaded = false;
      while( isLoaded === false ){
        var isLoadedResult =  await Runtime.evaluate( { expression: 'window.isSimLoaded();' } );
        isLoaded = isLoadedResult.result.value;
      }

      var result = await Runtime.evaluate( { expression: 'window.getInstances();' } );

      done(  result.result.value) ;
      protocol.close();
      chrome.kill(); // Kill Chrome.
    });
  } )();
};

if ( require.main === module ) {

  module.exports(function( result){ console.log(result);});
}