// Copyright 2020-2021, University of Colorado Boulder

/**
 * Isolating out our logic for updating copyright dates on generated files.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 * @author Michael Kauzmann
 */

// modules
const execute = require( '../dual/execute' );
const grunt = require( 'grunt' );
const updateCopyrightDate = require( './updateCopyrightDate' );

/**
 * @param {string} repo - e.g. 'joist'
 * @param {string} relativeFile - e.g. 'js/something.js'
 * @returns {Promise} - Async function
 */
module.exports = async ( repo, relativeFile ) => {
  //////////////////////////////
  // This is somewhat more complicated than it needs to be to support proper copyright dates
  //
  const tempBashFileName = 'temp.sh';

  // write to a bash file to support this complicated bash command
  grunt.file.write( tempBashFileName, '[ -d .git ] || git rev-parse --git-dir > /dev/null 2>&1' );
  await execute( 'chmod', [ 'u+x', tempBashFileName ], process.cwd() );

  // Wrapped in a try catch because the below execute calls will fail if we don't want to
  try {

    // Test if this is a git repo, fail out if it isn't
    await execute( 'sh', [ `./${tempBashFileName}` ], process.cwd() );

    // Test if the config file is checked in to git, fail if not
    await execute( 'git', [ 'ls-files', '--error-unmatch', relativeFile ], `../${repo}` );

    // If we get here because the previous two execute calls didn't error out, then we are overwriting the config file
    // instead of creating a new one (like simula-rasa would do). So let's update the copyright to have the creation
    // date and the last modified date. Don't log to the console because that is just noise; we aren't "updating"
    // the copyright date but instead keeping it in sync with our conventions which here are different than for new files.
    // See https://github.com/phetsims/chipper/issues/830, https://github.com/phetsims/chipper/issues/763, and
    // https://github.com/phetsims/perennial/issues/120
    await updateCopyrightDate( repo, relativeFile, true );
  }
  catch( e ) {
    // if we errored out, then the config file isn't tracked, so don't update the copyright date
  }
  grunt.file.delete( tempBashFileName );
};
