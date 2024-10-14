// Copyright 2018-2024, University of Colorado Boulder

import assert from 'assert';
import { getBrowserConfiguration } from './browser.eslint.config.mjs';
import rootEslintConfig from './root.eslint.config.mjs';

// Ensure the pattern only applies to HTML files.
const getHTMLPatterns = pattern => {

  return {
    ...pattern,
    files: !pattern.files ? [ '*.html' ] : pattern.files.map( filePattern => {

      // This is likely only going to be this horrible until we complete https://github.com/phetsims/chipper/issues/1483
      assert( filePattern.endsWith( '/*' ), 'only limited support for files patterns right now to append "html" file suffix' );

      return `${filePattern}.html`;
    } )
  };
};

export const getSimConfiguration = ( pattern = {} ) => {
  const patternsForHTML = getHTMLPatterns( pattern );

  return [
    ...getBrowserConfiguration( pattern ),
    {
      rules: {
        'phet/bad-sim-text': 'error'
      },
      ...pattern
    },
    {
      // Most html files don't need to behave like sims
      rules: {
        'phet/bad-sim-text': 'off'
      },
      ...patternsForHTML
    }
  ];
};

/**
 * Eslint config applied only to simulations.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */
export default [
  ...rootEslintConfig,
  ...getSimConfiguration()
];