var assert = require( 'assert' );
var fs = require( 'fs' );
var child_process = require( 'child_process' );

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
    } else {
      return str;
    }
  }
  
  assert( fs.existsSync( 'package.json' ), 'We need to be in a sim directory with package.json' );
  
  var pkg = grunt.file.readJSON( 'package.json' );
  
  // TODO: eek, this is scary! we are importing from the sim dir. ideally we should just have uglify-js installed once in chipper?
  var uglify = require( '../../' + pkg.name + '/node_modules/uglify-js' );
  var requirejs = require( '../../' + pkg.name + '/node_modules/requirejs' ); // TODO: not currently used, figure out how to include almond correctly?
  
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
                    // scenery assertions
                    sceneryAssert: false,
                    sceneryAssertExtra: false,
                    // scenery logging
                    sceneryLayerLog: false,
                    sceneryEventLog: false,
                    sceneryAccessibilityLog: false
                  },
                  dead_code: true
                }
              }
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
            '../dot/js/**/*.js',
            '../joist/js/**/*.js',
            '../kite/js/**/*.js',
            '../phet-core/js/**/*.js',
            '../phetcommon/js/**/*.js',
            '../scenery/js/**/*.js',
            '../scenery-phet/js/**/*.js',
            '../sun/js/**/*.js'
          ],
          // reference external JSHint options in jshint-options.js
          options: require( './jshint-options' )
        }
      } );

  // Default task ('grunt')
  grunt.registerTask( 'default', [ 'lint-sim', 'lint-common', 'build' ] );

  // Other tasks ('grunt taskName')
  grunt.registerTask( 'lint-sim', [ 'jshint:simFiles' ] );
  grunt.registerTask( 'lint-common', [ 'jshint:commonFiles' ] );
  grunt.registerTask( 'build', [ 'simBeforeRequirejs', 'requirejs:build', 'simAfterRequirejs' ] );
  
  // creates a performance snapshot for profiling changes
  grunt.registerTask( 'simBeforeRequirejs', 'Description', function() {
    grunt.log.writeln( 'Building simulation: ' + pkg.name + ' ' + pkg.version );
    
    assert( pkg.name, 'name required in package.json' );
    assert( pkg.version, 'version required in package.json' );
    assert( pkg.phetLibs, 'phetLibs required in package.json' );
    assert( pkg.preload, 'preload required in package.json' );
    
    if ( fs.existsSync( 'build' ) ) {
      grunt.log.writeln( 'Cleaning build directory' );
      grunt.file.delete( 'build' );
    }
    grunt.file.mkdir( 'build' );
    
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
    } else {
      grunt.log.error( 'WARNING: no changes.txt' );
    }
    
    // we ignore resourceDirs here, deprecated!
    
    var dependencies = pkg.phetLibs.split( ' ' );
    dependencies.push( 'chipper' );
    
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
      } else {
        // now continue on with the process! CALLBACK SOUP FOR YOU!
        
        // TODO: finish!
        grunt.log.writeln( 'Writing dependencies.txt' );
        grunt.file.write( 'build/dependencies.txt', '# ' + pkg.name + ' ' + pkg.version + ' ' + (new Date().toString()) + '\n' +
                                                    JSON.stringify( dependencyInfo, null, 2 ) + '\n' );
        
        var splashDataURI = loadFileAsDataURI( '../joist/images/phet-logo-loading.svg' );
        var mainInlineJavascript = grunt.file.read( 'build/' + pkg.name + '.min.js' );
        
        var imageFiles = pkg.images.concat( [
          '../joist/images/phet-logo-loading.svg',
          '../joist/images/phet-logo-short.svg',
          '../joist/images/phet-logo-short.png'
        ] );
        var inlineImageHTML = "";
        while ( imageFiles.length ) {
          var imageFile = imageFiles.pop();
          grunt.log.writeln( 'Inserting image: ' + imageFile );
          
          var dataURI = loadFileAsDataURI( imageFile );
          // TODO: share this as a CSS class, helps file space if we have tons of images
          inlineImageHTML += '<img id="' + imageFile + '" style="visibility: hidden; overflow: hidden; position: absolute;" src="' + dataURI + '"/>';
        }
        
        grunt.log.writeln( 'Constructing HTML from template' );
        var html = grunt.file.read( '../chipper/templates/sim.html' );
        html = stringReplace( html, 'SPLASH_SCREEN_DATA_URI', splashDataURI );
        html = stringReplace( html, 'PRELOAD_INLINE_JAVASCRIPT', preloadJS + '\n//# sourceMappingURL=preload.js.map' );
        html = stringReplace( html, 'MAIN_INLINE_JAVASCRIPT', mainInlineJavascript );
        html = stringReplace( html, 'SIM_INLINE_IMAGES', inlineImageHTML );
        
        grunt.log.writeln( 'Writing HTML' );
        grunt.file.write( 'build/' + pkg.name + '_en.html', html );
        
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
