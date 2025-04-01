// Copyright 2025, University of Colorado Boulder

/**
 * Bundle the QSM module into a UMD to be used as a preload, https://github.com/phetsims/query-string-machine/issues/45
 * This ideally would live in query-string-machine, but there were complications with linting and type checking.
 * @author Michael Kauzmann (PhET Interactive Simulations)`
 */

import * as fs from 'node:fs';
import path from 'path';
import bundle from '../../../chipper/js/common/bundle.js';
import dirname from '../../../perennial-alias/js/common/dirname.js';

// @ts-expect-error - until we have "type": "module" in our package.json
const __dirname = dirname( import.meta.url );

( async () => {

  const bundledResult = await bundle( path.join( __dirname, '../../../query-string-machine/js/preload-main.ts' ) );
  let bundled = bundledResult.outputFiles![ 0 ].text;

  // We disable all linting below, so remove individual declarations. Handle cases like:
  bundled = bundled.replace( /^[ /]*eslint-disable-(next-)?line.*$\n/gm, '' );

  fs.writeFileSync( path.join( __dirname, '../../../query-string-machine/js/QueryStringMachine.js' ), `// Copyright 2025, University of Colorado Boulder
// @author Michael Kauzmann (PhET Interactive Simulations)
// AUTO GENERATED: DO NOT EDIT!!!! See QueryStringMachineModule.ts and chipper/js/scripts/build-qsm.ts
/* eslint-disable */

${bundled}` );
} )();