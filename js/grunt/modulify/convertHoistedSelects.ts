// Copyright 2025, University of Colorado Boulder

/**
 * Converts nested select_* containers into Fluent select expressions, leaving other values untouched.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import yaml from 'js-yaml';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';

const SELECT_PREFIX = 'select_';
const SELECT_INDENT = '  ';

export const convertHoistedSelects = ( node: IntentionalAny ): IntentionalAny => {
  if ( Array.isArray( node ) ) {
    return node.map( convertHoistedSelects );
  }
  else if ( isPlainObject( node ) ) {
    const keys = Object.keys( node );
    if ( keys.length === 1 && keys[ 0 ].startsWith( SELECT_PREFIX ) ) {
      const selectKey = keys[ 0 ];
      const arms = node[ selectKey ];
      if ( isPlainObject( arms ) && Object.keys( arms ).length > 0 ) {
        const variable = selectKey.slice( SELECT_PREFIX.length );
        return renderSelectExpression( variable, arms );
      }
    }

    const result: Record<string, IntentionalAny> = {};
    for ( const key of keys ) {
      result[ key ] = convertHoistedSelects( node[ key ] );
    }
    return result;
  }

  return node;
};

const isPlainObject = ( value: IntentionalAny ): value is Record<string, IntentionalAny> => {
  return typeof value === 'object' && value !== null && !Array.isArray( value );
};

const renderSelectExpression = ( variable: string, arms: Record<string, IntentionalAny> ): string => {
  const entries = Object.entries( arms );
  const lines: string[] = [ `{ $${variable} ->` ];

  entries.forEach( ( [ armKey, armValue ], index ) => {
    const processedValue = convertHoistedSelects( armValue );
    const renderedValue = renderArmValue( processedValue );
    const isDefault = index === entries.length - 1;
    lines.push( formatArmLine( armKey, renderedValue, isDefault ) );
  } );

  lines.push( '}' );
  return lines.join( '\n' );
};

const renderArmValue = ( value: IntentionalAny ): string => {
  if ( typeof value === 'string' ) {
    return value;
  }
  if ( typeof value === 'number' || typeof value === 'boolean' ) {
    return String( value );
  }
  if ( value === null ) {
    return 'null';
  }
  if ( Array.isArray( value ) ) {
    return yaml.dump( value, { lineWidth: -1, noRefs: true } ).trimEnd();
  }
  if ( isPlainObject( value ) ) {
    return yaml.dump( value, { lineWidth: -1, noRefs: true } ).trimEnd();
  }
  return String( value );
};

const formatArmLine = ( armKey: string, value: string, isDefault: boolean ): string => {
  const indicator = isDefault ? '*' : '';
  const armHeader = `${SELECT_INDENT}${indicator}[${armKey}] `;
  const valueLines = value.split( '\n' );

  if ( valueLines.length === 0 ) {
    return armHeader.trimEnd();
  }

  const formattedLines = [ `${armHeader}${valueLines[ 0 ]}` ];
  if ( valueLines.length > 1 ) {
    const continuationIndent = ' '.repeat( armHeader.length );
    for ( let i = 1; i < valueLines.length; i++ ) {
      formattedLines.push( `${continuationIndent}${valueLines[ i ]}` );
    }
  }
  return formattedLines.join( '\n' );
};

export default convertHoistedSelects;
