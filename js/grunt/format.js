// Copyright 2020, University of Colorado Boulder

/**
 * Runs the formatting rules on the specified files.
 *
 * @author @NickCrews
 */

'use strict';

// modules
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const sortImports = require( './sortImports' );

// TODO: copied from lint.js, for testing right now, see https://github.com/phetsims/phet-info/issues/150
const NO_FORMAT_REPOS = [ // don't format these repos
  'babel',
  'decaf',
  'eliot',
  'phet-android-app',
  'phet-info',
  'phet-io-client-guides',
  'phet-io-wrapper-arithmetic',
  'phet-io-wrapper-hookes-law-energy',
  'phet-ios-app',
  'sherpa',
  'smithers',
  'tasks'
];

const JS_BEAUTIFY_OPTIONS = {
  'html': {
    'allowed_file_extensions': [ 'htm', 'html', 'xhtml', 'shtml', 'xml', 'svg' ],
    'brace_style': 'collapse',
    'end_with_newline': false,
    'indent_char': ' ',
    'indent_handlebars': false,
    'indent_inner_html': false,
    'indent_size': 2,
    'indent_scripts': 'keep',
    'max_preserve_newlines': 1,
    'preserve_newlines': true,
    'unformatted': [ 'a', 'span', 'img', 'code', 'pre', 'sub', 'sup', 'em', 'strong', 'b', 'i', 'u', 'strike', 'big', 'small', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
    'wrap_line_length': 0
  },
  'css': {
    'allowed_file_extensions': [ 'css', 'scss', 'sass', 'less' ],
    'end_with_newline': false,
    'newline_between_rules': true,
    'indent_char': ' ',
    'indent_size': 2,
    'selector_separator': ' ',
    'selector_separator_newline': true
  },
  'js': {
    'allowed_file_extensions': [ 'js', 'json', 'jshintrc', 'jsbeautifyrc', 'sublime-settings' ],
    'brace_style': 'end-expand',
    'break_chained_methods': false,
    'e4x': false,
    'end_with_newline': true,
    'indent_char': ' ',
    'indent_level': 0,
    'indent_size': 2,
    'indent_with_tabs': false,
    'jslint_happy': true,
    'keep_array_indentation': false,
    'keep_function_indentation': false,
    'max_preserve_newlines': 2,
    'preserve_newlines': true,
    'space_after_anon_function': false,
    'space_before_conditional': true,
    'space_in_empty_paren': false,
    'space_in_paren': true,
    'unescape_strings': false,
    'wrap_line_length': 0
  }
};

const PRETTIER_OPTIONS = {
  parser: 'babel',
  arrowParens: 'avoid',
  bracketSpacing: true,
  cursorOffset: -1,
  embeddedLanguageFormatting: 'auto',
  endOfLine: 'lf',
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  jsxBracketSameLine: false,
  jsxSingleQuote: true,
  printWidth: 180, // I'm not sure we want to actually wrap here
  proseWrap: 'preserve', // perhaps "always", but probably not
  quoteProps: 'as-needed',
  rangeEnd: null,
  rangeStart: 0,
  requirePragma: false,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'none', // possibly "all" at some point
  useTabs: false,
  vueIndentScriptAndStyle: false
};

function formatFile( format, absPath, verifyOnly = false ) {
  const before = fs.readFileSync( absPath, 'utf-8' );
  const formatted = format( before );
  if ( !verifyOnly ) {
    fs.writeFileSync( absPath, formatted, 'utf-8' );
  }
  const alreadySorted = sortImports( absPath, verifyOnly );
  return alreadySorted && ( before === formatted );
}

/**
 * Formats the specified repositories.
 * @public
 *
 * @param {Array.<string>} repos
 * @param {boolean} usePrettier
 * @param {boolean} verifyOnly - Don't rewrite files
 */
module.exports = function( repos, usePrettier = false, verifyOnly = false ) {
  // TODO: if we use Prettier, use prettier.check instead of current verifyOnly checking https://github.com/phetsims/phet-info/issues/150

  // TODO: require at top level if this makes it to production,   https://github.com/phetsims/phet-info/issues/150
  const prettier = require( 'prettier' ); // eslint-disable-line
  const js_beautify = require( 'js-beautify' ); // eslint-disable-line

  const format = usePrettier ? string => prettier.format( string, PRETTIER_OPTIONS ) :
                 string => js_beautify.js( string, JS_BEAUTIFY_OPTIONS );

  repos.forEach( repo => {
    if ( !NO_FORMAT_REPOS.includes( repo ) ) {
      grunt.file.recurse(
        `../${repo}/js`,
        absPath => formatFile( format, absPath, verifyOnly )
      );
    }
  } );
};
