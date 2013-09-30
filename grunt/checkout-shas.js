// Copyright 2002-2013, University of Colorado Boulder

/**
 * Check out the shas for a project as specified in a dependencies.json file in its top level.
 *
 * TODO: this is untested
 * TODO: should the parent project (the sim itself) also be checked out, ignored, or moved into its specified branch?  Right now it is ignored (i.e. left as it was when the task was started)
 * @param grunt
 * @param child_process
 * @param assert
 */
module.exports = function( grunt, child_process, assert, projectName ) {
  console.log( 'hi again' );
  var json = grunt.file.readJSON( 'dependencies.json' );
  console.log( 'read json' );
  console.log( json );

  var done = grunt.task.current.async();
  var numToCheckout = 0;
  var numCheckedOut = 0;
  for ( var property in json ) {
    if ( property !== 'comment' && property !== projectName ) {
      numToCheckout++;
    }
  }

  for ( var property in json ) {
    if ( property !== 'comment' && property !== projectName ) {

      (function( property ) {

        console.log( property + ': ' + json[property].branch + '@' + json[property].sha );

        var command = 'git --git-dir ../' + property + '/.git checkout ' + json[property].sha;
        grunt.log.writeln( 'Running: ' + command );

        child_process.exec( command, function( error1, stdout1, stderr1 ) {
          assert( !error1, "error in " + command );
          console.log( 'finished ' + command );
          console.log( stdout1 );
          console.log( stderr1 );
          numCheckedOut = numCheckedOut + 1;
          if ( numToCheckout === numCheckedOut ) {
            done();
          }
        } );
      })( property );
    }
  }
};