// Copyright 2019-2025, University of Colorado Boulder

/**
 * Runs webpack - DO NOT RUN MULTIPLE CONCURRENTLY
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import fs from 'fs';
import _ from 'lodash';
import { ConcatOperation, ModifySourcePlugin } from 'modify-source-webpack-plugin';
import path from 'path';
import { Stats } from 'webpack';
import dirname from '../../../perennial-alias/js/common/dirname.js';
import ChipperConstants from '../common/ChipperConstants.js';
import webpackGlobalLibraries from '../common/webpackGlobalLibraries.js';

const webpack = require( 'webpack' );

// @ts-expect-error - until we have "type": "module" in our package.json
const __dirname = dirname( import.meta.url );

const activeRepos = fs.readFileSync( path.resolve( __dirname, '../../../perennial-alias/data/active-repos' ), 'utf-8' ).trim().split( /\r?\n/ ).map( s => s.trim() );
const reposByNamespace: Record<string, string> = {};
const aliases: Record<string, string> = {};

for ( const repo of activeRepos ) {
  const packageFile = path.resolve( __dirname, `../../../${repo}/package.json` );
  if ( fs.existsSync( packageFile ) ) {
    const packageObject = JSON.parse( fs.readFileSync( packageFile, 'utf-8' ) );
    if ( packageObject.phet && packageObject.phet.requirejsNamespace ) {
      reposByNamespace[ packageObject.phet.requirejsNamespace ] = repo;
      aliases[ packageObject.phet.requirejsNamespace ] = path.resolve( __dirname, `../../../${repo}${repo === 'brand' ? '/phet' : ''}/js` );
    }
  }
}

const getModuleRules = function getModuleRules() {
  return Object.keys( webpackGlobalLibraries ).map( globalKey => {
    return {

      // path.join to normalize on the right path separator, perhaps there is another way?!
      test: ( fileName: string ) => fileName.includes( path.join( webpackGlobalLibraries[ globalKey as keyof typeof webpackGlobalLibraries ] ) ),
      loader: '../chipper/node_modules/expose-loader',
      options: {
        exposes: globalKey
      }
    };
  } );
};

/**
 * Convert absolute paths of modules to relative ones
 */
const getRelativeModules = ( modules: string[] ) => {
  const root = path.resolve( __dirname, '../../../' );
  return modules

    // Webpack 5 reports intermediate paths which need to be filtered out
    .filter( m => fs.lstatSync( m ).isFile() )

    // Get the relative path to the root, like "joist/js/Sim.js" or, on Windows, "joist\js\Sim.js"
    .map( m => path.relative( root, m ) )

    // Some developers check in a package.json to the root of the checkouts, as described in https://github.com/phetsims/chipper/issues/494#issuecomment-821292542
    // like: /Users/samreid/apache-document-root/package.json. This powers grunt only and should not be included in the modules
    .filter( m => m !== '../package.json' && m !== '..\\package.json' );
};

type WebpackBuildOptions = {
  outputDir?: string;
  profileFileSize?: boolean;
};

/**
 * Runs webpack - DO NOT RUN MULTIPLE CONCURRENTLY
 *
 * @returns The combined JS output from the process
 */
const webpackBuild = function webpackBuild( repo: string, brand: string, providedOptions?: WebpackBuildOptions ): Promise<{ js: string; usedModules: string[] }> {

  return new Promise( ( resolve, reject ) => {

    const options = _.merge( {
      outputDir: repo
    }, providedOptions );

    const outputDir = path.resolve( __dirname, `../../${ChipperConstants.BUILD_DIR}`, options.outputDir );
    const outputFileName = `${repo}.js`;
    const outputPath = path.resolve( outputDir, outputFileName );

    // Create plugins to ignore brands that we are not building at this time. Here "resource" is the module getting
    // imported, and "context" is the directory that holds the module doing the importing. This is split up because
    // of how brands are loaded in simLauncher.js. They are a dynamic import who's import path resolves to the current
    // brand. The way that webpack builds this is by creating a map of all the potential resources that could be loaded
    // by that import (by looking at the file structure). Thus the following resource/context regex split is accounting
    // for the "map" created in the built webpack file, in which the "resource" starts with "./{{brand}}" even though
    // the simLauncher line includes the parent directory: "brand/". For more details see https://github.com/phetsims/chipper/issues/879
    const ignorePhetBrand = new webpack.IgnorePlugin( { resourceRegExp: /\/phet\//, contextRegExp: /brand/ } );
    const ignorePhetioBrand = new webpack.IgnorePlugin( { resourceRegExp: /\/phet-io\//, contextRegExp: /brand/ } );
    const ignoreAdaptedFromPhetBrand = new webpack.IgnorePlugin( {
      resourceRegExp: /\/adapted-from-phet\//,
      contextRegExp: /brand/
    } );

    // Allow builds for developers that do not have the phet-io repo checked out. IgnorePlugin will skip any require
    // that matches the following regex.
    const ignorePhetioDirectories = new webpack.IgnorePlugin( {
      resourceRegExp: /\/phet-io\// // ignore anything in a phet-io named directory
    } );

    const compiler = webpack( {

      module: {
        rules: [
          // Apply affirm transformation before any other processing
          {
            test: /\.js$/,
            exclude: /affirm\.js$/,

            // Run this loader at 'pre' priority so the affirm→assert && affirm rewrite sees pristine source before
            // Babel, TS, etc. For each matched file Webpack gathers post-enforced loaders first, then normal, then pre,
            // and executes the list right-to-left—so without 'pre' this loader would run last, when it’s too late.
            enforce: 'pre',
            use: [ {
              loader: require.resolve( './affirmTransformLoader.js' )
            } ]
          },
          ...getModuleRules()
        ]
      },

      // We uglify as a step after this, with many custom rules. So we do NOT optimize or uglify in this step.
      optimization: {
        minimize: false
      },

      // Simulations or runnables will have a single entry point
      entry: {
        repo: `../chipper/dist/js/${repo}/js/${repo}-main.js`
      },

      // We output our builds to the following dir
      output: {
        path: outputDir,
        filename: outputFileName,
        hashFunction: 'xxhash64' // for Node 17+, see https://github.com/webpack/webpack/issues/14532
      },

      // {Array.<Plugin>}
      plugins: [

        // Exclude brand specific code. This includes all of the `phet-io` repo for non phet-io builds.
        ...( brand === 'phet' ? [ ignorePhetioBrand, ignorePhetioDirectories, ignoreAdaptedFromPhetBrand ] :
             brand === 'phet-io' ? [ ignorePhetBrand, ignoreAdaptedFromPhetBrand ] :

               // adapted-from-phet and all other brands
               [ ignorePhetBrand, ignorePhetioBrand, ignorePhetioDirectories ] ),
        ...( options.profileFileSize ? [
          new ModifySourcePlugin( {
            rules: [ {
              test: /.*/,
              operations: [
                new ConcatOperation(
                  'start',
                  'console.log(\'START_MODULE\',\'$FILE_PATH\');\n\n'
                ),
                new ConcatOperation(
                  'end',
                  '\n\nconsole.log(\'END_MODULE\',\'$FILE_PATH\');\n\n'
                )
              ]
            } ]
          } )
        ] : [] )
      ]
    } );

    compiler.run( ( err: Error, stats: Stats ) => {
      if ( err || stats.hasErrors() ) {
        console.error( 'Webpack build errors:', stats.compilation.errors );
        reject( err || stats.compilation.errors[ 0 ] );
      }
      else {
        const jsFile = outputPath;
        const js = fs.readFileSync( jsFile, 'utf-8' );

        fs.unlinkSync( jsFile );

        resolve( {
          js: js,
          usedModules: getRelativeModules( Array.from( stats.compilation.fileDependencies ) )
        } );
      }
    } );
  } );
};

webpackBuild.getModuleRules = getModuleRules;
export default webpackBuild;