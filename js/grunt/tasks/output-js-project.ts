// Copyright 2013-2024, University of Colorado Boulder

import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import transpile, { getTranspileCLIOptions } from '../../common/transpile.js';
import getPhetLibs from '../getPhetLibs.js';
import _ from 'lodash';

/**
 * Outputs JS for the specified repo and its dependencies
 *
 * NOTE: We need to keep the name output-js-project because of maintenance tooling. This name should never change,
 * though SR and MK wish it was called "transpile-project".
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

const defaultOptions = {
  repos: getPhetLibs( getRepo() )

  // TODO: REVIEW, I removed silent: true, since this can be used outside of the maintenance tooling. Is that OK? see https://github.com/phetsims/chipper/issues/1522
};

// TODO: Use combineOptions, see https://github.com/phetsims/chipper/issues/1520
transpile( _.assignIn( {}, defaultOptions, getTranspileCLIOptions() ) );