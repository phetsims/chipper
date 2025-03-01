// Copyright 2013-2025, University of Colorado Boulder

/**
 * Updates the normal automatically-generated files for this repository. Includes:
 * * runnables: generate-development-html and modulify
 * * accessible runnables: generate-a11y-view-html
 * * unit tests: generate-test-html
 * * simulations: generateREADME()
 * * phet-io simulations: generate overrides file if needed
 * * create the conglomerate string files for unbuilt mode, for this repo and its dependencies
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import fs, { readFileSync } from 'fs';
import _ from 'lodash';
import writeFileAndGitAdd from '../../../../perennial-alias/js/common/writeFileAndGitAdd.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import grunt from '../../../../perennial-alias/js/npm-dependencies/grunt.js';
import generateDevelopmentHTML from '../generateDevelopmentHTML.js';
import generateREADME from '../generateREADME.js';
import generateTestHTML from '../generateTestHTML.js';

const repo = getRepo();

const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );

// support repos that don't have a phet object
if ( !packageObject.phet ) {

  // skip, nothing to do
}
else {

  ( async () => {

    // modulify is graceful if there are no files that need modulifying.
    await ( await import( './modulify.js' ) ).modulifyPromise;

    // update README.md only for simulations
    if ( packageObject.phet.simulation && !packageObject.phet.readmeCreatedManually ) {
      await generateREADME( repo, !!packageObject.phet.published );
    }

    if ( packageObject.phet.supportedBrands && packageObject.phet.supportedBrands.includes( 'phet-io' ) ) {

      // Copied from build.json and used as a preload for phet-io brand
      const overridesFile = `js/${repo}-phet-io-overrides.js`;

      // If there is already an overrides file, don't overwrite it with an empty one
      if ( !fs.existsSync( `../${repo}/${overridesFile}` ) ) {

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
      catch( e: unknown ) {
        if ( e instanceof Error && !e.message.includes( 'no such file or directory' ) ) {
          throw e;
        }
      }
    }

    // The above code can mutate the package.json, so do these after
    if ( packageObject.phet.runnable ) {
      await generateDevelopmentHTML( repo );
    }
    if ( packageObject.phet.generatedUnitTests ) {
      await generateTestHTML( repo );
    }
  } )();
}