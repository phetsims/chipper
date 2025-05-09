// Copyright 2020-2025, University of Colorado Boulder

/**
 * Generates JS modules from the string file.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import fs, { readFileSync } from 'fs';
import _ from 'lodash';
import writeFileAndGitAdd from '../../../../perennial-alias/js/common/writeFileAndGitAdd.js';
import pascalCase from '../../common/pascalCase.js';
import getCopyrightLine from '../getCopyrightLine.js';
import getStringTypes from './getStringTypes.js';
import { fixEOL } from './modulify.js';

const OFF = 'off';

/**
 * Creates the string module at js/${_.camelCase( repo )}Strings.js for repos that need it.
 */
const createStringModule = async ( repo: string ): Promise<void> => {

  const packageObject = JSON.parse( readFileSync( `../${repo}/package.json`, 'utf8' ) );
  const stringModuleName = `${pascalCase( repo )}Strings`;
  const relativeStringModuleFile = `js/${stringModuleName}.ts`;
  const stringModuleFileJS = `../${repo}/js/${stringModuleName}.js`;
  const namespace = _.camelCase( repo );

  if ( fs.existsSync( stringModuleFileJS ) ) {
    console.log( 'Found JS string file in TS repo.  It should be deleted manually.  ' + stringModuleFileJS );
  }

  const copyrightLine = await getCopyrightLine( repo, relativeStringModuleFile );
  await writeFileAndGitAdd( repo, relativeStringModuleFile, fixEOL(
    `${copyrightLine}

/* eslint-disable */
/* @formatter:${OFF} */

/**
 * Auto-generated from modulify, DO NOT manually modify.
 */

import getStringModule from '../../chipper/js/browser/getStringModule.js';
import type LocalizedStringProperty from '../../chipper/js/browser/LocalizedStringProperty.js';
import createFluentMessageProperty from '../../chipper/js/browser/createFluentMessageProperty.js';
import LocalizedString from '../../chipper/js/browser/LocalizedString.js';
import { FluentBundle } from '../../chipper/js/browser-and-node/FluentLibrary.js';
import FluentUtils from '../../chipper/js/browser/FluentUtils.js';
import TReadOnlyProperty from '../../axon/js/TReadOnlyProperty.js';
import type IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import ${namespace} from './${namespace}.js';

${getStringTypes( repo )}

${namespace}.register( '${stringModuleName}', ${stringModuleName} );

export default ${stringModuleName};
` ) );
};

export default createStringModule;