// Copyright 2013-2024, University of Colorado Boulder

/**
 * Sort the import statements for a single file (if --file={{FILE}} is provided), or does so for all JS files if not specified
 * TODO: Delete this and the module, https://github.com/phetsims/chipper/issues/1461
 * @author Sam Reid (PhET Interactive Simulations)
 */

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