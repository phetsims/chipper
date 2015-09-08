var http = require( 'http' );
var spawn = require( 'child_process' ).spawn;
var path = require( 'path' );

var port = 45361;

var jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

// root of your GitHub working copy, relative to the name of the directory that the currently executing script resides in
var rootDir = path.normalize( __dirname + '/../../' );

http.createServer( function( req, res ) {
  var simName = req.url.slice( 1 );

  // validate that it is lower-case with hyphens
  for ( var i = 0; i < simName.length; i++ ) {
    var charCode = simName.charCodeAt( i );
    if ( charCode !== '-'.charCodeAt( 0 ) && ( charCode < 'a'.charCodeAt( 0 ) || charCode > 'z'.charCodeAt( 0 ) ) ) {
      res.writeHead( 403, jsonHeaders );
      res.end( JSON.stringify( {
        output: 'Sim name is invalid',
        success: false
      } ) );
      return;
    }
  }

  var success = false;
  var output = '';

  console.log( 'building ' + simName );

  // TODO: Why do these more portable versions not work?
  // var npmInstall = spawn( 'node', [ 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js', 'install' ], {
  var npmInstall = spawn( 'npm', [ 'install' ], {
    cwd: rootDir + simName
  } );
  console.log( 'running npm install on ' + simName );
  npmInstall.stderr.on( 'data', function( data ) {
    console.log( 'stderr: ' + data );
  } );
  npmInstall.on( 'close', function( code ) {
    console.log( 'npm install exit code: ' + code );

    // npm install failure
    if ( code !== 0 ) {
      res.writeHead( 500, jsonHeaders );
      res.end( JSON.stringify( {
        sim: simName,
        output: 'npm install exit code: ' + code,
        success: false
      } ) );
    }
    // npm install success, continue with grunt
    else {
      // var grunt = spawn( 'node', [ 'C:\\Users\\jon\\AppData\\Roaming\\npm\\node_modules\\grunt-cli\\bin\\grunt', '--no-color' ], {
      var grunt = spawn( 'grunt', [ '--no-color' ], {
        cwd: rootDir + simName
      } );
      console.log( 'running grunt on ' + simName );

      // accumulate output, send success response if we detect it
      grunt.stdout.on( 'data', function( data ) {
        output += data.toString();
      } );

      grunt.stderr.on( 'data', function( data ) {
        console.log( 'stderr: ' + data );
      } );

      // if no success has been sent, send a response when closed (failure depending on the code)
      grunt.on( 'close', function( code ) {
        console.log( 'grunt exited with code ' + code );
        if ( !success ) {
          res.writeHead( 200, jsonHeaders );
          res.end( JSON.stringify( {
            sim: simName,
            success: code === 0,
            output: output
          } ) );
        }
      } );
    }
  } );
} ).listen( port );

console.log( 'running on port ' + port + ' with root directory ' + rootDir );
