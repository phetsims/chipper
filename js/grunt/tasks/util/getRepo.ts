// Copyright 2013-2024, University of Colorado Boulder

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
import * as grunt from 'grunt';

import assert from 'assert';
import getOption from './getOption';
import process from 'process';

const getRepo = (): string => {

  let repo = getOption( 'repo' );

  if ( !repo ) {

    try {
      const packageObject = grunt.file.readJSON( 'package.json' );
      repo = packageObject.name;
    }
    catch( e ) {
      assert( false, `Expected package.json for current working directory: ${process.cwd()}` );
    }
  }

  assert( typeof repo === 'string' && /^[a-z]+(-[a-z]+)*$/u.test( repo ), 'repo name should be composed of lower-case characters, optionally with dashes used as separators' );

  return repo;
};

export default getRepo;