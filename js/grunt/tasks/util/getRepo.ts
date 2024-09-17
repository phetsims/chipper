// Copyright 2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const grunt = require( 'grunt' );
const assert = require( 'assert' );
const getOption = require( './getOption' );

module.exports = () => {

  const packageObject = grunt.file.readJSON( 'package.json' );

  const repo = getOption( 'repo' ) || packageObject.name;
  assert( typeof repo === 'string' && /^[a-z]+(-[a-z]+)*$/u.test( repo ), 'repo name should be composed of lower-case characters, optionally with dashes used as separators' );

  return repo;
};