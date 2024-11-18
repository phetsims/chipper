// Copyright 2015-2024, University of Colorado Boulder

/**
 * Report which media files (such as images and sounds) from a sim were not used in the simulation with a require
 * statement.
 *
 * Each time a resource is loaded by a plugin (image, sounds, mipmap,...) its license info is added to this global by
 * the plugin.  After all resources are loaded, the global will contain the list of all resources that are actually used
 * by the sim.  Comparing what's in the filesystem to this list identifies resources that are unused.
 *
 * See https://github.com/phetsims/chipper/issues/172
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Denzell Barnett (Phet Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

// modules
import ChipperConstants from '../../../chipper/js/common/ChipperConstants.js';
import grunt from '../../../perennial-alias/js/npm-dependencies/grunt.js';

/**
 * @param usedModules - Used modules within the repo
 * @param repo - Name of the repo
 */
export default ( repo: string, usedModules: string[] ): void => {

  // on Windows, paths are reported with a backslash, normalize to forward slashes so this works everywhere
  const normalizedUsedModules = usedModules.map( module => module.split( '\\' ).join( '/' ) );

  ChipperConstants.MEDIA_TYPES.forEach( mediaType => {

    // Iterate over media directories and sub-directories
    const subdirectory = `../${repo}/${mediaType}`;
    if ( grunt.file.isDir( subdirectory ) ) {
      grunt.file.recurse( subdirectory, ( abspath, rootdir, subdir, filename ) => {

        if ( filename !== 'license.json' && filename !== 'README.md' && filename.includes( '.js' ) ) {
          const module = subdir ?
                         `${repo}/${mediaType}/${subdir}/${filename}` :
                         `${repo}/${mediaType}/${filename}`;

          // If no licenseEntries were registered, or some were registered but not one corresponding to this file
          if ( !normalizedUsedModules.includes( `chipper/dist/js/${module}` ) ) {
            grunt.log.warn( `Unused ${mediaType} module: ${module}` );
          }
        }
      } );
    }
  } );
};