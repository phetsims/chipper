// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const grunt = require( 'grunt' );
const parseGruntOptions = require( './parseGruntOptions' );
const assert = require( 'assert' );

// TODO: Unit tests to make sure options are parsed correctly from Gruntfile.js to here https://github.com/phetsims/chipper/issues/1459
grunt.option.init( parseGruntOptions() );

module.exports = () => {

  const packageObject = grunt.file.readJSON( 'package.json' );

  const repo = grunt.option( 'repo' ) || packageObject.name;
  assert( typeof repo === 'string' && /^[a-z]+(-[a-z]+)*$/u.test( repo ), 'repo name should be composed of lower-case characters, optionally with dashes used as separators' );

  return repo;
};