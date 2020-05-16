// Copyright 2020, University of Colorado Boulder

/**
 * Lints a single repo like "grunt lint" but optimized for speed.  Avoids the overhead of grunt and Gruntfile.js
 *
 * USAGE:
 * cd ${repo}
 * node ../chipper/js/scripts/lint-main.js
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

const lint = require( '../grunt/lint' );
const path = require( 'path' );

// Identify the current repo
const repo = process.cwd().split( path.sep ).pop();

// Run the lint, and report warnings.
// lint() automatically filters out non-lintable repos
// Exit code will be 1 if there are errors or warnings.
lint( [ repo ], true, false, true );