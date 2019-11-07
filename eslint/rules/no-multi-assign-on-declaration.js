// Copyright 2019, University of Colorado Boulder

/**
 * @fileoverview Don't allow assignment within a variable declaration
 * @author Stewart Rand (original author of eslint file)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 *
 * This rule was adapted straight from eslint's no-multi-assign, and adapted/simplified for PhET purposes, see
 * original file: https://github.com/eslint/eslint/blob/7ad86de/lib/rules/no-multi-assign.js
 */

/* eslint-env node */

'use strict';

module.exports = {
  create( context ) {
    return {

      // run on any AssignmentExpression node
      AssignmentExpression( node ) {

        // if within a variable declaration, error out
        if ( node.parent.type === 'VariableDeclarator' ) {
          context.report( {
            node: node,
            message: 'Unexpected chained assignment when declaring variable.'
          } );
        }
      }
    };
  }
};