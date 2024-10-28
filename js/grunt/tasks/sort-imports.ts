// Copyright 2013-2024, University of Colorado Boulder

/**
 * Sort the import statements for a single file (if --file={{FILE}} is provided), or does so for all JS files if not specified
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

  // TODO: https://github.com/phetsims/chipper/issues/1461 probably does not need to be here in grunt. Does anyone use it?
  // AV would like a way to sort the imports, OK if it is a grunt script or node script. As long as there way to do it.
  // Consensus: Get rid of this grunt task. OK to leave as a node script. But team members can use WebStorm to do the same thing.
  // MK: Let's just delete it. We have enough people using webstorm.
  // Consensus: ok, we will delete it
  // MK: Make an issue to make the sort by module part of the code style. Reformat the codebase by that style.
  // MK: All opposed?
  // MK: is working on it.

import * as grunt from 'grunt';
import getOption from '../../../../perennial-alias/js/grunt/tasks/util/getOption';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo';

const sortImports = require( '../sortImports.js' );

const repo = getRepo();
const file = getOption( 'file' );

if ( file ) {
  sortImports( file );
}
else {
  grunt.file.recurse( `../${repo}/js`, absfile => sortImports( absfile ) );
}