// Copyright 2024, University of Colorado Boulder

const getRepo = require( './getRepo' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const grunt = require( 'grunt' );
const repo = getRepo();

const packageObject = grunt.file.readJSON( `../${repo}/package.json` );

const generateREADME = require( '../generateREADME' );
const fs = require( 'fs' );
const _ = require( 'lodash' );

// support repos that don't have a phet object
if ( !packageObject.phet ) {

  // skip, nothing to do
}
else {

  ( async () => {

    // modulify is graceful if there are no files that need modulifying.
    // TODO: make sure options go through? See https://github.com/phetsims/chipper/issues/1459
    require( './modulify' );

    // update README.md only for simulations
    if ( packageObject.phet.simulation && !packageObject.phet.readmeCreatedManually ) {
      await generateREADME( repo, !!packageObject.phet.published );
    }

    if ( packageObject.phet.supportedBrands && packageObject.phet.supportedBrands.includes( 'phet-io' ) ) {

      // Copied from build.json and used as a preload for phet-io brand
      const overridesFile = `js/${repo}-phet-io-overrides.js`;

      // If there is already an overrides file, don't overwrite it with an empty one
      if ( !fs.existsSync( `../${repo}/${overridesFile}` ) ) {
        const writeFileAndGitAdd = require( '../../../perennial-alias/js/common/writeFileAndGitAdd' );

        const overridesContent = '/* eslint-disable */\nwindow.phet.preloads.phetio.phetioElementsOverrides = {};';
        await writeFileAndGitAdd( repo, overridesFile, overridesContent );
      }

      let simSpecificWrappers;
      try {
        // Populate sim-specific wrappers into the package.json
        simSpecificWrappers = fs.readdirSync( `../phet-io-sim-specific/repos/${repo}/wrappers/`, { withFileTypes: true } )
          .filter( dirent => dirent.isDirectory() )
          .map( dirent => `phet-io-sim-specific/repos/${repo}/wrappers/${dirent.name}` );
        if ( simSpecificWrappers.length > 0 ) {

          packageObject.phet[ 'phet-io' ] = packageObject.phet[ 'phet-io' ] || {};
          packageObject.phet[ 'phet-io' ].wrappers = _.uniq( simSpecificWrappers.concat( packageObject.phet[ 'phet-io' ].wrappers || [] ) );
          grunt.file.write( 'package.json', JSON.stringify( packageObject, null, 2 ) );
        }
      }
      catch( e ) {
        if ( !e.message.includes( 'no such file or directory' ) ) {
          throw e;
        }
      }
    }

// The above code can mutate the package.json, so do these after
    if ( packageObject.phet.runnable ) {

      require( './generate-development-html' );

      if ( packageObject.phet.simFeatures && packageObject.phet.simFeatures.supportsInteractiveDescription ) {
        require( './generate-a11y-view-html' );
      }
    }
    if ( packageObject.phet.generatedUnitTests ) {
      require( './generate-test-html' );
    }
  } )();
}