// Copyright 2022-2025, University of Colorado Boulder

/**
 * Size and raster data for levels in a mipmap.  See also type Mipmap in Imageable.ts.  Defined in phet-core instead of
 * scenery because it is loaded upstream and should not have any downstream dependencies such as scenery.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import asyncLoader from '../../../phet-core/js/asyncLoader.js';
import chipper from './chipper.js';

export default class MipmapElement {
  public readonly width: number;
  public readonly height: number;
  public readonly url: string;
  public readonly img: HTMLImageElement;
  public readonly canvas: HTMLCanvasElement;

  public constructor( width: number, height: number, url: string, lock = true ) {

    this.width = width;
    this.height = height;
    this.url = url;

    this.img = new Image(); // eslint-disable-line phet/no-html-constructors
    this.img.src = this.url; // trigger the loading of the image for its level

    this.canvas = document.createElement( 'canvas' );
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const context = this.canvas.getContext( '2d' )!;
    const unlock = lock ? asyncLoader.createLock( this.img ) : null;
    this.img.onload = () => {
      context.drawImage( this.img, 0, 0 );
      unlock && unlock();
    };
  }
}

chipper.register( 'MipmapElement', MipmapElement );