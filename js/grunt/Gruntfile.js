// Copyright 2013-2024, University of Colorado Boulder

/**
 * Grunt configuration file for PhET projects. In general when possible, modules are imported lazily in their task
 * declaration to save on overall load time of this file. The pattern is to require all modules needed at the top of the
 * grunt task registration. If a module is used in multiple tasks, it is best to lazily require in each
 * task.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

const assert = require( 'assert' );
require( './checkNodeVersion' );
const { spawn } = require( 'child_process' ); // eslint-disable-line require-statement-match

// TODO: Will ctrl-c correctly kill spawned tasks? https://github.com/phetsims/chipper/issues/1459

// Allow other Gruntfiles to potentially handle exiting and errors differently
if ( !global.processEventOptOut ) {

  // See https://medium.com/@dtinth/making-unhandled-promise-rejections-crash-the-node-js-process-ffc27cfcc9dd for how
  // to get unhandled promise rejections to fail out the node process.
  // Relevant for https://github.com/phetsims/wave-interference/issues/491
  process.on( 'unhandledRejection', up => { throw up; } );

  // Exit on Ctrl + C case
  process.on( 'SIGINT', () => {
    console.log( '\n\nCaught interrupt signal, exiting' );
    process.exit();
  } );
}

module.exports = function( grunt ) {
  const packageObject = grunt.file.readJSON( 'package.json' );

  const repo = grunt.option( 'repo' ) || packageObject.name;
  assert( typeof repo === 'string' && /^[a-z]+(-[a-z]+)*$/u.test( repo ), 'repo name should be composed of lower-case characters, optionally with dashes used as separators' );

  // TODO: This is working well but should we use execute? Let's chat: https://github.com/phetsims/chipper/issues/1459
  function execTask( taskFilename ) {

    // TODO switch to npx tsx, see https://github.com/phetsims/chipper/issues/1459 via npx ../chipper/node_modules/tsx
    // TODO: test on windows, see https://github.com/phetsims/chipper/issues/1459, maybe like gruntCommand.js
    const command = 'node';

    return () => {

      const done = grunt.task.current.async();
      try {
        const child = spawn( command, [ `../chipper/js/grunt/tasks/${taskFilename}`, ...process.argv.slice( 2 ) ], { stdio: [ 'inherit', 'pipe', 'pipe' ] } );

        child.stdout.on( 'data', data => process.stdout.write( data.toString() ) );
        child.stderr.on( 'data', data => process.stderr.write( data.toString() ) );

        // Listen for the close event when the command finishes
        child.on( 'close', code => {
          done();
          if ( code !== 0 ) {
            grunt.fail.fatal( `Command failed with exit code ${code}` );
          }
        } );
      }
      catch( e ) {
        grunt.fail.fatal( e );
        done();
      }
    };
  }

  grunt.registerTask( 'default', 'Builds the repository', [
    ...( grunt.option( 'lint' ) === false ? [] : [ 'lint-all' ] ),
    ...( grunt.option( 'report-media' ) === false ? [] : [ 'report-media' ] ),
    'clean',
    'build'
  ] );

  grunt.registerTask( 'clean', 'Erases the build/ directory and all its contents, and recreates the build/ directory',
    execTask( 'clean.js' )
  );

  grunt.registerTask( 'build-images', 'Build images only',
    execTask( 'build-images.js' )
  );

  grunt.registerTask( 'output-js', 'Outputs JS just for the specified repo',
    execTask( 'output-js.js' )
  );
  grunt.registerTask( 'output-js-project', 'Outputs JS for the specified repo and its dependencies',
    execTask( 'output-js-project.js' )
  );

  grunt.registerTask( 'output-js-all', 'Outputs JS for all repos',
    execTask( 'output-js-all.js' )
  );

  grunt.registerTask( 'build',
    `Builds the repository. Depending on the repository type (runnable/wrapper/standalone), the result may vary.
Runnable build options:
 --report-media - Will iterate over all of the license.json files and reports any media files, set to false to opt out.
 --brands={{BRANDS} - Can be * (build all supported brands), or a comma-separated list of brand names. Will fall back to using
                      build-local.json's brands (or adapted-from-phet if that does not exist)
 --XHTML - Includes an xhtml/ directory in the build output that contains a runnable XHTML form of the sim (with
           a separated-out JS file).
 --locales={{LOCALES}} - Can be * (build all available locales, "en" and everything in babel), or a comma-separated list of locales
 --noTranspile - Flag to opt out of transpiling repos before build. This should only be used if you are confident that chipper/dist is already correct (to save time).
 --noTSC - Flag to opt out of type checking before build. This should only be used if you are confident that TypeScript is already errorless (to save time).
 --encodeStringMap=false - Disables the encoding of the string map in the built file. This is useful for debugging.
 
Minify-specific options: 
 --minify.babelTranspile=false - Disables babel transpilation phase.
 --minify.uglify=false - Disables uglification, so the built file will include (essentially) concatenated source files.
 --minify.mangle=false - During uglification, it will not "mangle" variable names (where they get renamed to short constants to reduce file size.)
 --minify.beautify=true - After uglification, the source code will be syntax formatted nicely
 --minify.stripAssertions=false - During uglification, it will strip assertions.
 --minify.stripLogging=false - During uglification, it will not strip logging statements.`,
    execTask( 'build.js' )
  );

  grunt.registerTask( 'generate-used-strings-file',
    'Writes used strings to phet-io-sim-specific/ so that PhET-iO sims only output relevant strings to the API in unbuilt mode',
    execTask( 'generate-used-strings-file.js' )
  );

  grunt.registerTask( 'build-for-server', 'meant for use by build-server only',
    [ 'build' ]
  );

  grunt.registerTask( 'lint',
    `lint js files. Options:
--disable-eslint-cache: cache will not be read from, and cache will be cleared for next run.
--fix: autofixable changes will be written to disk
--chip-away: output a list of responsible devs for each repo with lint problems
--repos: comma separated list of repos to lint in addition to the repo from running`,
    execTask( 'lint.js' )
  );

  grunt.registerTask( 'lint-all', 'lint all js files that are required to build this repository (for the specified brands)',
    execTask( 'lint-all.js' )
  );

  grunt.registerTask( 'generate-development-html',
    'Generates top-level SIM_en.html file based on the preloads in package.json.',
    execTask( 'generate-development-html.js' )
  );

  grunt.registerTask( 'generate-test-html',
    'Generates top-level SIM-tests.html file based on the preloads in package.json.  See https://github.com/phetsims/aqua/blob/main/doc/adding-unit-tests.md ' +
    'for more information on automated testing. Usually you should ' +
    'set the "generatedUnitTests":true flag in the sim package.json and run `grunt update` instead of manually generating this.',
    execTask( 'generate-test-html.js' )
  );

  grunt.registerTask( 'generate-a11y-view-html',
    'Generates top-level SIM-a11y-view.html file used for visualizing accessible content. Usually you should ' +
    'set the "phet.simFeatures.supportsInteractiveDescription":true flag in the sim package.json and run `grunt update` ' +
    'instead of manually generating this.',
    execTask( 'generate-a11y-view.js' )
  );

  grunt.registerTask( 'update', `
Updates the normal automatically-generated files for this repository. Includes:
  * runnables: generate-development-html and modulify
  * accessible runnables: generate-a11y-view-html
  * unit tests: generate-test-html
  * simulations: generateREADME()
  * phet-io simulations: generate overrides file if needed
  * create the conglomerate string files for unbuilt mode, for this repo and its dependencies`,
    execTask( 'update.js' )
  );

  // This is not run in grunt update because it affects dependencies and outputs files outside of the repo.
  grunt.registerTask( 'generate-development-strings',
    'To support locales=* in unbuilt mode, generate a conglomerate JSON file for each repo with translations in babel. Run on all repos via:\n' +
    '* for-each.sh perennial-alias/data/active-repos npm install\n' +
    '* for-each.sh perennial-alias/data/active-repos grunt generate-development-strings',
    execTask( 'generate-development-strings.js' )
  );

  grunt.registerTask( 'published-README',
    'Generates README.md file for a published simulation.',
    execTask( 'published-README.js' )
  );

  grunt.registerTask( 'unpublished-README',
    'Generates README.md file for an unpublished simulation.',
    execTask( 'unpublished-README.js' )
  );

  // TODO: https://github.com/phetsims/chipper/issues/1459 probably does not need to be here in grunt. Separate issue for list to prune. Bring to dev meeting. chipper + perennial
  grunt.registerTask( 'sort-imports', 'Sort the import statements for a single file (if --file={{FILE}} is provided), or does so for all JS files if not specified',
    execTask( 'sort-imports.js' )
  );

  // TODO: https://github.com/phetsims/chipper/issues/1459 probably does not need to be here in grunt
  grunt.registerTask( 'commits-since', 'Shows commits since a specified date. Use --date=<date> to specify the date.',
    execTask( 'commits-since.js' )
  );

  // See reportMedia.js
  // TODO: https://github.com/phetsims/chipper/issues/1459 probably does not need to be here in grunt
  grunt.registerTask( 'report-media',
    '(project-wide) Report on license.json files throughout all working copies. ' +
    'Reports any media (such as images or sound) files that have any of the following problems:\n' +
    '(1) incompatible-license (resource license not approved)\n' +
    '(2) not-annotated (license.json missing or entry missing from license.json)\n' +
    '(3) missing-file (entry in the license.json but not on the file system)',
    execTask( 'report-media.js' )
  );

  // see reportThirdParty.js
  // TODO: https://github.com/phetsims/chipper/issues/1459 probably does not need to be here in grunt
  grunt.registerTask( 'report-third-party',
    'Creates a report of third-party resources (code, images, sound, etc) used in the published PhET simulations by ' +
    'reading the license information in published HTML files on the PhET website. This task must be run from main.  ' +
    'After running this task, you must push sherpa/third-party-licenses.md.',
    execTask( 'report-third-party.js' )
  );

  grunt.registerTask( 'modulify', 'Creates *.js modules for all images/strings/audio/etc in a repo',
    execTask( 'modulify.js' )
  );

  // Grunt task that determines created and last modified dates from git, and
  // updates copyright statements accordingly, see #403
  grunt.registerTask( 'update-copyright-dates', 'Update the copyright dates in JS source files based on Github dates',
    execTask( 'update-copyright-dates.js' )
  );

  // TODO: https://github.com/phetsims/chipper/issues/1459 probably does not need to be here in grunt
  grunt.registerTask(
    'webpack-dev-server', `Runs a webpack server for a given list of simulations.
--repos=REPOS for a comma-separated list of repos (defaults to current repo)
--port=9000 to adjust the running port
--devtool=string value for sourcemap generation specified at https://webpack.js.org/configuration/devtool or undefined for (none)
--chrome: open the sims in Chrome tabs (Mac)`,
    () => {
      // We don't finish! Don't tell grunt this...
      // TODO: https://github.com/phetsims/chipper/issues/1459 move into another file, make sure it lives forever. Can test ctrl-c
      grunt.task.current.async();

      const repos = grunt.option( 'repos' ) ? grunt.option( 'repos' ).split( ',' ) : [ repo ];
      const port = grunt.option( 'port' ) || 9000;
      let devtool = grunt.option( 'devtool' ) || 'inline-source-map';
      if ( devtool === 'none' || devtool === 'undefined' ) {
        devtool = undefined;
      }
      const openChrome = grunt.option( 'chrome' ) || false;

      const webpackDevServer = require( './webpackDevServer' );

      // NOTE: We don't care about the promise that is returned here, because we are going to keep this task running
      // until the user manually kills it.
      webpackDevServer( repos, port, devtool, openChrome );
    }
  );

  grunt.registerTask(
    'generate-phet-io-api',
    'Output the PhET-iO API as JSON to phet-io-sim-specific/api.\n' +
    'Options\n:' +
    '--sims=... a list of sims to compare (defaults to the sim in the current dir)\n' +
    '--simList=... a file with a list of sims to compare (defaults to the sim in the current dir)\n' +
    '--stable - regenerate for all "stable sims" (see perennial/data/phet-io-api-stable/)\n' +
    '--temporary - outputs to the temporary directory\n' +
    '--transpile=false - skips the transpilation step. You can skip transpilation if a watch process is handling it.',
    execTask( 'generate-phet-io-api.js' )
  );

  grunt.registerTask(
    'compare-phet-io-api',
    'Compares the phet-io-api against the reference version(s) if this sim\'s package.json marks compareDesignedAPIChanges.  ' +
    'This will by default compare designed changes only. Options:\n' +
    '--sims=... a list of sims to compare (defaults to the sim in the current dir)\n' +
    '--simList=... a file with a list of sims to compare (defaults to the sim in the current dir)\n' +
    '--stable, generate the phet-io-apis for each phet-io sim considered to have a stable API (see perennial-alias/data/phet-io-api-stable)\n' +
    '--delta, by default a breaking-compatibility comparison is done, but --delta shows all changes\n' +
    '--temporary, compares API files in the temporary directory (otherwise compares to freshly generated APIs)\n' +
    '--compareBreakingAPIChanges - add this flag to compare breaking changes in addition to designed changes',
    execTask( 'compare-phet-io-api.js' )
  );

  // TODO: https://github.com/phetsims/chipper/issues/1459 probably does not need to be here in grunt
  grunt.registerTask( 'profile-file-size', 'Profiles the file size of the built JS file for a given repo',
    execTask( 'profile-file-size.js' )
  );

  /**
   * Creates grunt tasks that effectively get forwarded to perennial. It will execute a grunt process running from
   * perennial's directory with the same options (but with --repo={{REPO}} added, so that perennial is aware of what
   * repository is the target).
   * @public
   *
   * @param {string} task - The name of the task
   */
  function forwardToPerennialGrunt( task ) {
    grunt.registerTask( task, 'Run grunt --help in perennial to see documentation', () => {
      grunt.log.writeln( '(Forwarding task to perennial)' );
      const child_process = require( 'child_process' );
      const done = grunt.task.current.async();

      // Include the --repo flag
      const args = [ `--repo=${repo}`, ...process.argv.slice( 2 ) ];
      const argsString = args.map( arg => `"${arg}"` ).join( ' ' );
      const isWindows = /^win/.test( process.platform );
      const spawned = child_process.spawn( isWindows ? 'grunt.cmd' : 'grunt', args, {
        cwd: '../perennial',
        shell: isWindows // shell is required for a NodeJS security update, see https://github.com/phetsims/perennial/issues/359
      } );
      grunt.log.debug( `running grunt ${argsString} in ../${repo}` );

      spawned.stderr.on( 'data', data => grunt.log.error( data.toString() ) );
      spawned.stdout.on( 'data', data => grunt.log.write( data.toString() ) );
      process.stdin.pipe( spawned.stdin );

      spawned.on( 'close', code => {
        if ( code !== 0 ) {
          throw new Error( `perennial grunt ${argsString} failed with code ${code}` );
        }
        else {
          done();
        }
      } );
    } );
  }

  [
    'checkout-shas',
    'checkout-target',
    'checkout-release',
    'checkout-main',
    'checkout-main-all',
    'create-one-off',
    'sha-check',
    'sim-list',
    'npm-update',
    'create-release',
    'cherry-pick',
    'wrapper',
    'dev',
    'one-off',
    'rc',
    'production',
    'prototype',
    'create-sim',
    'insert-require-statement',
    'lint-everything',
    'generate-data',
    'pdom-comparison',
    'release-branch-list'
  ].forEach( forwardToPerennialGrunt );
};