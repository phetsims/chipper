// Copyright 2020, University of Colorado Boulder

/**
 * Runs the formatting rules on the specified files.
 *
 * @author @NickCrews
 */

'use strict';

// modules
const beautify = require( 'js-beautify' ); // eslint-disable-line 
const fs = require( 'fs' );
const grunt = require( 'grunt' );
const sortImports = require( './sortImports' );

const OPTIONS = {
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

function formatFile( absPath, verifyOnly = false ) {
  const before = fs.readFileSync( absPath, 'utf-8' );
  const formatted = beautify.js( before, OPTIONS );
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
 * @param {boolean} verifyOnly - Don't rewrite files
 */
module.exports = function( repos, verifyOnly = false ) {

  repos.forEach( repo => {
    grunt.file.recurse(
      `../${repo}/js`,
      absPath => formatFile( absPath, verifyOnly )
    );
  } );

};
