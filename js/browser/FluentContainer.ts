// Copyright 2025, University of Colorado Boulder

/**
 * A class that manages the Fluent bundle when the locale changes or any string changes (like from
 * external PhET-iO control). If either of these change, the entire bundle is recreated.
 *
 * This is used by the generated fluent types files for each repo.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Multilink from '../../../axon/js/Multilink.js';
import Property from '../../../axon/js/Property.js';
import ReadOnlyProperty from '../../../axon/js/ReadOnlyProperty.js';
import localeProperty from '../../../joist/js/i18n/localeProperty.js';
import { FluentBundle, FluentResource } from '../browser-and-node/FluentLibrary.js';
import chipper from './chipper.js';

export default class FluentContainer {

  public readonly bundleProperty: ReadOnlyProperty<FluentBundle>;

  public constructor( getFTL: () => string, allStringProperties: Array<ReadOnlyProperty<string>> ) {

    // If the locale is changing, we only want to recompute the bundle once.
    let isLocaleChanging = false;
    localeProperty.lazyLink( () => {
      isLocaleChanging = true;
    } );

    const createFluentBundle = () => {
      const bundle = new FluentBundle( 'en' );
      const resource = new FluentResource( getFTL() );
      const errors = bundle.addResource( resource );
      assert && assert( errors.length === 0, 'Errors when adding resource for locale en' );

      return bundle;
    };

    // Initial compute of the bundle
    const bundleProperty = new Property<FluentBundle>( createFluentBundle() );
    this.bundleProperty = bundleProperty;

    Multilink.multilinkAny( allStringProperties, () => {
      if ( !isLocaleChanging ) {
        bundleProperty.value = createFluentBundle();
      }
    } );

    // Listener order is important. This listener must fire after the one that set
    // isLocaleChanging to true. Otherwise, the bundle will be recomputed for every
    // string change.
    localeProperty.lazyLink( () => {
      isLocaleChanging = false;
      bundleProperty.value = createFluentBundle();
    } );
  }
}

chipper.register( 'FluentContainer', FluentContainer );