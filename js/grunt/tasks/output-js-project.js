// Copyright 2024, University of Colorado Boulder

const grunt = require( 'grunt' );

/**
 * @author Sam Reid (PhET Interactive Simulations)
 */
const Transpiler = require( '../../common/Transpiler' );
const parseGruntOptions = require( './parseGruntOptions' );
const transpiler = new Transpiler( { silent: true } );

grunt.option.init( parseGruntOptions() );
const repos = grunt.option( 'repos' );

transpiler.transpileRepo( repos.split( ',' ) );