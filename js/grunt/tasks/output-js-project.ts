// Copyright 2013-2024, University of Colorado Boulder

import _ from 'lodash';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import transpile, { getTranspileCLIOptions } from '../../common/transpile.js';
import getPhetLibs from '../getPhetLibs.js';

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
};

// TODO: Use combineOptions, see https://github.com/phetsims/chipper/issues/1523
transpile( _.assignIn( {}, defaultOptions, getTranspileCLIOptions() ) );