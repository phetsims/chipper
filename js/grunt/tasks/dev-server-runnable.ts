// Copyright 2025, University of Colorado Boulder

/**
 * Launch an esbuild dev server that bundles a simulation (or runnable)'s code into a single resource for quicker loading.
 * This watches all depenedncies and automatically rebundles on any dependency change.
 *
 * Expected to be used with the "unbuilt *_en.html" simulation html with `?esbuild`.
 *
 * Add `?liveReload` for esbuild to monitor dependency files for changes and reload the browser webpage
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { IntentionalPerennialAny } from '../../../../perennial-alias/js/browser-and-node/PerennialTypes.js';
import dirname from '../../../../perennial-alias/js/common/dirname.js';
import { getOptionIfProvided } from '../../../../perennial-alias/js/grunt/tasks/util/getOption.js';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import pascalCase from '../../common/pascalCase.js';

const __dirname = dirname(
// @ts-expect-error - until we have "type": "module" in our package.json
  import.meta.url
);

const options = {
  repo: getRepo(), // repo to bundle, must have a simluation entrypoint like repo/js/repo-main.ts
  port: getOptionIfProvided( 'port', 8123 )  // port of the server
};

( async () => {

  const gitRoot = `${path.resolve( __dirname, '../../../../' )}`;
  const chipper = `${gitRoot}/chipper/`;
  const bundleName = `${pascalCase( options.repo )}Bundle`;
  const outFile = `${chipper}/dist/dev-server-runnable/${options.repo}.js`;

  // mkdir on the outFile parent
  fs.mkdirSync( path.dirname( outFile ), { recursive: true } );

  const noExtension = `${gitRoot}/${options.repo}/js/${options.repo}-main`;
  const tsEntryPoint = `${noExtension}.ts`;
  const entryPoint = fs.existsSync( tsEntryPoint ) ? tsEntryPoint : `${noExtension}.js`;

  const buildConfig: IntentionalPerennialAny = {
    entryPoints: [ entryPoint ],
    bundle: true,
    format: 'iife',
    globalName: bundleName,
    outfile: outFile,
    sourcemap: true,
    logLevel: 'info' // indicate when builds begin and end
  };

  const context = await esbuild.context( buildConfig );

  await context.serve( {
    servedir: gitRoot,
    port: typeof options.port === 'number' ? options.port : parseInt( options.port, 10 )
  } );

  console.log( `Serving ${options.repo} on port: ` + options.port );
  await context.watch();
} )();