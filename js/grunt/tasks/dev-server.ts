// Copyright 2025, University of Colorado Boulder

/**
 * Launch an esbuild dev server that bundles a simulation's code into a single resource for quicker loading.
 *
 * Expected to be used with the "unbuilt *_en.html" simulation html with `?esbuild`.
 *
 * Add `?liveReload` for esbuild to monitor dependency files for changes and reload the browser webpage
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import path from 'node:path';
import dirname from '../../../../perennial-alias/js/common/dirname.js';
import execute from '../../../../perennial-alias/js/common/execute.js';
import { npxCommand } from '../../../../perennial-alias/js/common/npxCommand.js';
import { getOptionIfProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import pascalCase from '../../common/pascalCase.js';

const __dirname = dirname(
// @ts-expect-error - until we have "type": "module" in our package.json
  import.meta.url
);

const options = {
  repo: getRepo(), // repo to bundle, must have a simluation entrypoint like repo/js/repo-main.ts
  port: getOptionIfProvided( 'port' ) || 80 // port of the server
};

( async () => {

  const gitRoot = `${path.resolve( __dirname, '../../../../' )}`;
  const chipper = `${gitRoot}/chipper/`;
  const bundleName = `${pascalCase( options.repo )}Bundle`;
  const argsString = [
    'esbuild',
    // TODO: Support mode with ALL sim entrypoints? https://github.com/phetsims/chipper/issues/1559
    // TODO: Support mode with ALL non-sim entrypoints too? https://github.com/phetsims/chipper/issues/1559
    `${gitRoot}/${options.repo}/js/${options.repo}-main.ts`, // TODO: support js entrypoints. https://github.com/phetsims/chipper/issues/1558
    '--bundle',
    '--format=iife',
    `--global-name=${bundleName}`,
    `--outfile=${chipper}/dist/js/${options.repo}/bundle.js`,
    '--sourcemap',
    '--watch',
    `--servedir=${gitRoot}`,
    `--serve=${options.port}`
  ];

  await execute( npxCommand, argsString, chipper, {
    childProcessOptions: {
      stdio: 'inherit'
    }
  } );
} )();