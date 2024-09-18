// Copyright 2013-2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
import * as grunt from 'grunt';

// @ts-expect-error
import assert from 'assert';
import getOption from './getOption';

const getRepo = (): string => {

  const packageObject = grunt.file.readJSON( 'package.json' );

  const repo = getOption( 'repo' ) || packageObject.name;
  assert( typeof repo === 'string' && /^[a-z]+(-[a-z]+)*$/u.test( repo ), 'repo name should be composed of lower-case characters, optionally with dashes used as separators' );

  return repo;
};

export default getRepo;