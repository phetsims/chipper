// Copyright 2025, University of Colorado Boulder

/**
 * Utilities for SceneryStack to create Fluent constants and patterns
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import LocalizedStringProperty from './LocalizedStringProperty.js';
import FluentContainer from './FluentContainer.js';
import FluentConstant from './FluentConstant.js';
import FluentPattern from './FluentPattern.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';

export const fluentConstantFromStringProperty = (
  targetProperty: LocalizedStringProperty,
  stringProperties: LocalizedStringProperty[],
  primaryFluentKey: string,
  fluentKeyMap: Map<LocalizedStringProperty, string> // map of string Property to fluent key (e.g. dots turned to underscores)
): FluentConstant => {
  const fluentContainer = new FluentContainer( () => {
    return stringProperties.map( stringProperty => {
      return `${fluentKeyMap.get( stringProperty )!} = ${stringProperty.value.replace( '\n', '\n ' )}\n`;
    } ).join( '\n' );
  }, stringProperties );

  return new FluentConstant( fluentContainer.bundleProperty, primaryFluentKey, targetProperty );
};

export const fluentPatternFromStringProperty = <T extends Record<string, unknown>>(
  targetProperty: LocalizedStringProperty,
  stringProperties: LocalizedStringProperty[],
  primaryFluentKey: string,
  fluentKeyMap: Map<LocalizedStringProperty, string>, // map of string Property to fluent key (e.g. dots turned to underscores)
  args: Record<string, IntentionalAny>[]
): FluentPattern<T> => {
  const fluentContainer = new FluentContainer( () => {
    return stringProperties.map( stringProperty => {
      return `${fluentKeyMap.get( stringProperty )!} = ${stringProperty.value.replace( '\n', '\n ' )}\n`;
    } ).join( '\n' );
  }, stringProperties );

  return new FluentPattern<T>( fluentContainer.bundleProperty, primaryFluentKey, targetProperty, args );
};