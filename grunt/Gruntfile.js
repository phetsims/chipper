var assert = require( 'assert' );
var fs = require( 'fs' );
var child_process = require( 'child_process' );
var info = require( '../../sherpa/info' );
var _ = require( '../../sherpa/lodash-2.0.0.min' );
var checkoutShas = require( '../../chipper/grunt/checkout-shas' );

/**
 * Grunt configuration file for simulations.
 * Requires a package.json file containing project settings.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
module.exports = function( grunt ) {
  function trimWhitespace( str ) {
    return str.replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' );
  }

  function padString( str, n ) {
    while ( str.length < n ) {
      str += ' ';
    }
    return str;
  }

  function loadFileAsDataURI( filename ) {
    var mimeType = {
      'png': 'image/png',
      'svg': 'image/svg+xml',
      'jpg': 'image/jpeg',
      'cur': 'image/x-icon', // cursor files (used in build-a-molecule). x-win-bitmap gives off warnings in Chrome
      'mp3': 'audio/mpeg',
      'm4a': 'audio/mp4',
      'ogg': 'audio/ogg',
      'oga': 'audio/ogg',
      'bma': 'audio/webm', // webma is the full extension
      'wav': 'audio/wav'
    }[filename.slice( -3 )];
    assert( mimeType, 'Unknown mime type for filename: ' + filename );

    return 'data:' + mimeType + ';base64,' + Buffer( fs.readFileSync( filename ) ).toString( 'base64' );
  }

  function stringReplace( str, substring, replacement ) {
    var idx = str.indexOf( substring );
    if ( str.indexOf( substring ) !== -1 ) {
      return str.slice( 0, idx ) + replacement + str.slice( idx + substring.length );
    }
    else {
      return str;
    }
  }

  assert( fs.existsSync( 'package.json' ), 'We need to be in a sim directory with package.json' );

  var pkg = grunt.file.readJSON( 'package.json' );

  // TODO: eek, this is scary! we are importing from the sim dir. ideally we should just have uglify-js installed once in chipper?
  var uglify = require( '../../' + pkg.name + '/node_modules/uglify-js' );
  var requirejs = require( '../../' + pkg.name + '/node_modules/requirejs' ); // TODO: not currently used, figure out how to include almond correctly?
  var escodegen = require( '../../' + pkg.name + '/node_modules/escodegen' );
  var esprima = require( '../../' + pkg.name + '/node_modules/esprima' );

  var chipperRewrite = require( '../../chipper/ast/chipperRewrite.js' );
  var onBuildRead = function( name, path, contents ) {
    return chipperRewrite.chipperRewrite( contents, esprima, escodegen );
  };

  var preloadMapFilename = 'preload.js.map';

  // Project configuration.
  grunt.initConfig(
    {
      // Read in the project settings from the package.json file into the pkg property.
      // This allows us to refer to project settings from within this config file.
      pkg: pkg,

      // configure the RequireJS plugin
      requirejs: {

        // builds the minified script
        build: {
          options: {
            almond: true,
            mainConfigFile: 'js/<%= pkg.name %>-config.js',
            out: 'build/<%= pkg.name %>.min.js',
            name: '<%= pkg.name %>-config',
            optimize: 'uglify2',
            wrap: true,
            generateSourceMaps: true,
            preserveLicenseComments: false,
            uglify2: {
              output: {
                inline_script: true // escape </script
              },
              compress: {
                global_defs: {
                  // global assertions
                  assert: false,
                  assertSlow: false,
                  // scenery logging
                  sceneryLayerLog: false,
                  sceneryEventLog: false,
                  sceneryAccessibilityLog: false,
                  phetAllocation: false
                },
                dead_code: true
              }
            },

            //stub out the plugins so their source code won't be included in the minified file
            stubModules: ['string', 'audio', 'image']
          }
        }
      },

      // configure the JSHint plugin
      jshint: {
        // source files that are specific to this simulation
        simFiles: [ 'js/**/*.js' ],
        // source files for common-code dependencies
        commonFiles: [
          '../assert/js/**/*.js',
          '../axon/js/**/*.js',
          '../dot/js/**/*.js',
          '../joist/js/**/*.js',
          '../kite/js/**/*.js',
          '../nitroglycerin/js/**/*.js',
          '../phet-core/js/**/*.js',
          '../phetcommon/js/**/*.js',
          '../scenery/js/**/*.js',
          '../scenery-phet/js/**/*.js',
          '../sun/js/**/*.js',
          '../vibe/js/**/*.js'
        ],
        // reference external JSHint options in jshint-options.js
        options: require( './jshint-options' )
      }
    } );

  var clean = function() {
    if ( fs.existsSync( 'build' ) ) {
      grunt.log.writeln( 'Cleaning build directory' );
      grunt.file.delete( 'build' );
    }
    grunt.file.mkdir( 'build' );
  };

  // Default task ('grunt')
  grunt.registerTask( 'default', [ 'generateLicenseInfo', 'lint-sim', 'lint-common', 'build' ] );

  // Other tasks ('grunt taskName')
  grunt.registerTask( 'lint-sim', [ 'jshint:simFiles' ] );
  grunt.registerTask( 'lint-common', [ 'jshint:commonFiles' ] );
  grunt.registerTask( 'lint', [ 'lint-sim', 'lint-common' ] );
  grunt.registerTask( 'build', [ 'clean', 'simBeforeRequirejs', 'requirejs:build', 'simAfterRequirejs' ] );

  //Build without cleaning, so that files can be added from different tasks for i18n
  grunt.registerTask( 'build-more', [ 'simBeforeRequirejs', 'requirejs:build', 'simAfterRequirejs' ] );
  grunt.registerTask( 'nolint', [ 'generateLicenseInfo', 'clean', 'simBeforeRequirejs', 'requirejs:build', 'simAfterRequirejs' ] );
  grunt.registerTask( 'bump-version', [ 'simBeforeRequirejs', 'requirejs:build', 'simAfterRequirejs' ] );

  grunt.registerTask( 'build-all', 'Build minified files for all of the locales', function() {

    //Clean only once for generating all html files
    clean();

    //Enumerate all of the locales
    var stringFiles = fs.readdirSync( 'strings' );

    var done = this.async();
    var count = 0;

    //Recursive function to create all of the local HTML files
    (function runLocale() {
      var stringFile = stringFiles[count];

      //Requires a form like energy-skate-park-basics_ar_SA, where no _ appear in the sim name
      var locale = stringFile.substring( stringFile.indexOf( '_' ) + 1, stringFile.lastIndexOf( '.' ) );
      console.log( 'Spawning for locale: ' + locale );
      grunt.util.spawn( {
        grunt: true,
        args: ['build-more', '--locale', locale]
      }, function( err, res, code ) {
        console.log( 'spawn finished for locale: ', locale );
        if ( err ) {
          console.log( 'ERROR\n', locale );
        }
        if ( res ) {
          console.log( 'RESULT\n', res );
        }
        count++;
        if ( count === stringFiles.length ) {
          done();
        }
        else {
          //Recursive step to go to the next language
          runLocale();
        }
      } );
    })();
//    }
  } );

  //Scoped variable to hold the result from the generateLicenseInfoTask.
  //TODO: A better way to store the return value?
  var licenseText;
  grunt.registerTask( 'generateLicenseInfo', 'Generate the license info', function() {

    //Prepare the license info
    //Run this first so that if something is missing from the license file you will find out before having to wait for jshint/requirejs build
    var licenseInfo = info();

    //Find all dependencies that have 'sherpa' in the path.
    //Please note, this requires all simulations to keep their dependencies in sherpa!
    var sherpaDependencyPaths = _.filter( pkg.preload.split( ' ' ), function( dependency ) { return dependency.indexOf( 'sherpa' ) >= 0; } );

    //Add libraries that are not explicitly included by the sim
    //Note: must have a . character for the parsing below //TODO: Remove this restriction
    sherpaDependencyPaths.push( 'almond-0.2.6.js' );
    sherpaDependencyPaths.push( 'pegjs.' );
    sherpaDependencyPaths.push( 'font-awesome.' );
    sherpaDependencyPaths.push( 'require-i18n.js' );
    sherpaDependencyPaths.push( 'text.js' );
    sherpaDependencyPaths.push( 'base64binary.js' );//TODO: Not all simulations use Vibe

    //Sort by name of the library, have to match cases to sort properly
    var sortedSherpaDependencyPaths = _.sortBy( sherpaDependencyPaths, function( path ) {return path.toUpperCase();} );

    //Map the paths to instances from the info.js file
    var licenses = _.uniq( _.map( sortedSherpaDependencyPaths, function( sherpaDependencyPath ) {
      var lastSlash = sherpaDependencyPath.lastIndexOf( '/' );
      var lastDot = sherpaDependencyPath.lastIndexOf( '.' );
      var dependencyName = sherpaDependencyPath.substring( lastSlash + 1, lastDot );
      //    console.log( 'found dependency: ' + sherpaDependencyPath + ', name = ' + dependencyName );

      //Make sure there is an entry in the info.js file, and return it
      assert( licenseInfo[dependencyName], 'no license entry for ' + dependencyName );
      return licenseInfo[dependencyName];
    } ) );

    //Get the text of each entry
    var separator = '=';

    //TODO: better way to return a value?
    licenseText = _.reduce( licenses,function( memo, license ) {
      var selectedLicenseText = license.selectedLicense ? '> Selected license: ' + license.selectedLicense + '\n' : '';
      return memo + license.text + '\n' +
             selectedLicenseText +
             separator +
             '\n';
    }, separator + '\n' ).trim();

    grunt.log.writeln( 'created license info for ' + licenses.length + ' dependencies' );
  } );

  grunt.registerTask( 'checkout-shas', 'Check out the shas for a project as specified in a dependencies.json file in its top level', function() {
    checkoutShas( grunt, child_process, assert, pkg.name );
  } );

  //This task updates the last value in the version by one.  For example from 0.0.0-dev.12 to 0.0.0-dev.13
  //This updates the package.json and js/version.js files, and commits + pushes to git.
  //BEWARE: do not run this task unless your git is clean, otherwise it will commit other work on your repo as well
  //TODO: Also, if you embed this task in another, you should make sure the global pkg.version gets updated as well, since this modifies the files but not the pkg.version, which may be used elsewhere in the gruntfile.
  grunt.registerTask( 'bump-version', 'This task updates the last value in the version by one.  For example from 0.0.0-dev.12 to 0.0.0-dev.13.' +
                                      'This updates the package.json and js/version.js files, and commits + pushes to git.' +
                                      'BEWARE: do not run this task unless your git is clean, otherwise it will commit other work on your repo as well.', function() {
    var lastDot = pkg.version.lastIndexOf( '.' );
    var number = parseInt( pkg.version.substring( lastDot + 1 ) );
    var newNumber = number + 1;
    var newFullVersion = pkg.version.substring( 0, lastDot + 1 ) + newNumber;

    var replace = function( path, oldText, newText ) {
      var fullText = grunt.file.read( path );
      var firstIndex = fullText.indexOf( oldText );
      var lastIndex = fullText.lastIndexOf( oldText );
      assert( lastIndex === firstIndex, 'should only be one occurrence of the text string' );
      assert( lastIndex !== -1, 'should be at least one occurrence of the text string' );
      grunt.file.write( path, fullText.replace( oldText, newText ) );
      grunt.log.writeln( 'updated version in ' + path + ' from ' + oldText + ' to ' + newText );
    };

    //Write the new version to the package.json file and version.js file
    replace( 'package.json', pkg.version, newFullVersion );
    replace( 'js/version.js', pkg.version, newFullVersion );

    var cmd1 = 'git add js/version.js package.json';
    var cmd2 = 'git commit -m "updated version to ' + newFullVersion + '"';
    var cmd3 = 'git push';

    grunt.log.writeln( 'Running: ' + cmd1 );
    var done = grunt.task.current.async();

    child_process.exec( cmd1, function( error1, stdout1, stderr1 ) {
      assert( !error1, "error in " + cmd1 );
      console.log( 'finished ' + cmd1 );
      console.log( stdout1 );
      grunt.log.writeln( 'Running: ' + cmd2 )
      child_process.exec( cmd2, function( error2, stdout2, stderr2 ) {
        assert( !error2, "error in git commit" );
        console.log( 'finished ' + cmd2 );
        console.log( stdout2 );

        grunt.log.writeln( 'Running: ' + cmd3 );
        child_process.exec( cmd3, function( error3, stdout3, stderr3 ) {
          assert( !error3, "error in git push" );
          console.log( 'finished ' + cmd3 );
          console.log( stdout3 );
          done();
        } );
      } );
    } );
  } );

  grunt.registerTask( 'clean', 'Erases the build/ directory and all its contents, and recreates the build/ directory', clean );

  // creates a performance snapshot for profiling changes
  grunt.registerTask( 'simBeforeRequirejs', 'Description', function() {
    grunt.log.writeln( 'Building simulation: ' + pkg.name + ' ' + pkg.version );

    assert( pkg.name, 'name required in package.json' );
    assert( pkg.version, 'version required in package.json' );
    assert( pkg.phetLibs, 'phetLibs required in package.json' );
    assert( pkg.preload, 'preload required in package.json' );

    //See if a specific language was specified like:
    // grunt build --locale fr
    var locale = grunt.option( 'locale' ) || 'en';

    //Pass an option to requirejs through its config build options
    grunt.config.set( 'requirejs.build.options.phetLocale', locale );

    // grunt.log.writeln( 'Running Require.js optimizer' );
    // requirejs.optimize( {
    //   almond: true,
    //   mainConfigFile: 'js/' + pkg.name + '-config.js',
    //   out: 'build/' + pkg.name + '.min.js',
    //   name: pkg.name + '-config',
    //   optimize: 'uglify2',
    //   wrap: true,
    //   generateSourceMaps: true,
    //   preserveLicenseComments: false,
    //   uglify2: {
    //     output: {
    //       inline_script: true // escape </script
    //     },
    //     compress: {
    //       global_defs: {
    //         // scenery assertions
    //         sceneryAssert: false,
    //         sceneryAssertExtra: false,
    //         // scenery logging
    //         sceneryLayerLog: false,
    //         sceneryEventLog: false,
    //         sceneryAccessibilityLog: false
    //       },
    //       dead_code: true
    //     }
    //   }
    // }, function( response ) {
    // }
  } );

  grunt.registerTask( 'simAfterRequirejs', 'Description', function() {
    var done = this.async();

    console.log( 'RequireJS finished.  Found strings:', global.globalStrings );

    grunt.log.writeln( 'Minifying preload scripts' );
    var preloadResult = uglify.minify( pkg.preload.split( ' ' ), {
      outSourceMap: preloadMapFilename,
      output: {
        inline_script: true // escape </script
      },
      compress: {
        // here for now, for when we want to include options for the preloaded code
        global_defs: {}
      }
    } );

    var preloadJS = preloadResult.code; // minified output
    var preloadMap = preloadResult.map; // map for minified output, use preloadMapFilename

    grunt.log.writeln( 'Copying preload source map' );
    grunt.file.write( 'build/' + preloadMapFilename, preloadMap );

    grunt.log.writeln( 'Copying changes.txt' );
    if ( fs.existsSync( 'changes.txt' ) ) {
      grunt.file.copy( 'changes.txt', 'build/changes.txt' );
    }
    else {
      grunt.log.error( 'WARNING: no changes.txt' );
    }

    var dependencies = pkg.phetLibs.split( ' ' );
    if ( dependencies.indexOf( 'chipper' ) === -1 ) {
      dependencies.push( 'chipper' );
    }

    var dependencyInfo = {};

    // git --git-dir ../scenery/.git rev-parse HEAD                 -- sha
    // git --git-dir ../scenery/.git rev-parse --abbrev-ref HEAD    -- branch
    function nextDependency() {
      if ( dependencies.length ) {
        var dependency = dependencies.pop();

        // get the SHA
        child_process.exec( 'git --git-dir ../' + dependency + '/.git rev-parse HEAD', function( error, stdout, stderr ) {
          assert( !error, error ? ( 'ERROR on git SHA attempt: code: ' + error.code + ', signal: ' + error.signal + ' with stderr:\n' + stderr ) : 'An error without an error? not good' );

          var sha = trimWhitespace( stdout );

          // get the branch
          child_process.exec( 'git --git-dir ../' + dependency + '/.git rev-parse --abbrev-ref HEAD', function( error, stdout, stderr ) {
            assert( !error, error ? ( 'ERROR on git branch attempt: code: ' + error.code + ', signal: ' + error.signal + ' with stderr:\n' + stderr ) : 'An error without an error? not good' );

            var branch = trimWhitespace( stdout );

            grunt.log.writeln( padString( dependency, 20 ) + branch + ' ' + sha );
            dependencyInfo[dependency] = { sha: sha, branch: branch };


            nextDependency();
          } );
        } );
      }
      else {
        // now continue on with the process! CALLBACK SOUP FOR YOU!

        // TODO: finish!
        grunt.log.writeln( 'Writing dependencies.json' );

        var comment = '# ' + pkg.name + ' ' + pkg.version + ' ' + (new Date().toString());

        //protect against repos or other attributions named 'comment'
        assert( !dependencyInfo.comment, 'there was already a "comment" dependency!' );
        dependencyInfo.comment = comment;

        grunt.file.write( 'build/dependencies.json', JSON.stringify( dependencyInfo, null, 2 ) + '\n' );

        var splashDataURI = loadFileAsDataURI( '../joist/images/phet-logo-loading.svg' );
        var mainInlineJavascript = grunt.file.read( 'build/' + pkg.name + '.min.js' );

        //Create the license header for this html and all the 3rd party dependencies
        //TODO: This puts the license for everything as GPLv3.  If we want to build other libraries with this, we should change the license to MIT
        var htmlHeader = pkg.name + '\n' +
                         'Copyright 2002-2013, University of Colorado Boulder\n' +
                         'PhET Interactive Simulations\n' +
                         'Licensed under GPLv3\n' +
                         'http://phet.colorado.edu/en/about/licensing\n' +
                         '\n' +
                         'Libraries:\n' + licenseText;

        grunt.log.writeln( 'Constructing HTML from template' );
        var html = grunt.file.read( '../chipper/templates/sim.html' );
        html = stringReplace( html, 'HTML_HEADER', htmlHeader );
        html = stringReplace( html, 'SPLASH_SCREEN_DATA_URI', splashDataURI );
        html = stringReplace( html, 'PRELOAD_INLINE_JAVASCRIPT', preloadJS + '\n//# sourceMappingURL=preload.js.map' );
        html = stringReplace( html, 'MAIN_INLINE_JAVASCRIPT', mainInlineJavascript );

        grunt.log.writeln( 'Writing HTML' );
        var locale = grunt.option( 'locale' ) || 'en';
        grunt.file.write( 'build/' + pkg.name + '_' + locale + '.html', html );

        grunt.log.writeln( 'Cleaning temporary files' );
        grunt.file.delete( 'build/' + pkg.name + '.min.js' );

        done();
      }
    }

    grunt.log.writeln( 'Scanning dependencies from:\n' + dependencies.toString() );
    nextDependency();
  } );

  // Load tasks from grunt plugins that have been installed locally using npm.
  // Put these in package.json and run 'npm install' before running grunt.
  grunt.loadNpmTasks( 'grunt-requirejs' );
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
};
