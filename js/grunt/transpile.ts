// Copyright 2013-2024, University of Colorado Boulder

import { Repo } from '../../../perennial-alias/js/common/PerennialTypes.js';
import Transpiler from '../common/Transpiler.js';

/**
 * Function to support transpiling on the project. See grunt output-js
 *
 * TODO: I wanted to name this "transpile" because I don't like a name like "outputJS", but let's talk, https://github.com/phetsims/chipper/issues/1499
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
const transpile = ( repos: Repo[] | 'all' ): void => {

  const transpiler = new Transpiler( { silent: true } );

  // TODO: Ew, https://github.com/phetsims/chipper/issues/1499
  if ( repos === 'all' ) {
    transpiler.transpileAll();
  }
  else {
    transpiler.transpileRepos( _.uniq( repos ) );
  }
};

export default transpile;