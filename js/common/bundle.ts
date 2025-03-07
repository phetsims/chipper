// Copyright 2025, University of Colorado Boulder

/**
 * Bundles entrypoint(s) using esbuild.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import esbuild from 'esbuild';

export default async function bundle( file: string | string[], esbuildOptions?: Parameters<typeof esbuild.build>[0] ): Promise<esbuild.BuildResult> {

  esbuildOptions = {
    ...esbuildOptions, // eslint-disable-line phet/no-object-spread-on-non-literals
    entryPoints: typeof file === 'string' ? [ file ] : file,
    bundle: true,
    format: 'iife',
    sourcemap: 'inline',
    write: false
  };

  return esbuild.build( esbuildOptions );
}