// Copyright 2022, University of Colorado Boulder

import phetCore from './phetCore.js';
import asyncLoader from './asyncLoader.js';

/**
 * Size and raster data for levels in a mipmap.  See also type Mipmap in Imageable.ts.  Defined in phet-core instead of
 * scenery because it is loaded upstream and should not have any downstream dependencies such as scenery.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
export default class MipmapElement {
  public readonly width: number;
  public readonly height: number;
  public readonly url: string;
  public readonly img: HTMLImageElement;
  public readonly canvas: HTMLCanvasElement;
  public updateCanvas?: () => void;

  public constructor( width: number, height: number, url: string ) {
    this.width = width;
    this.height = height;
    this.url = url;

    this.img = new Image(); // eslint-disable-line no-html-constructors
    const unlock = asyncLoader.createLock( this.img );
    this.img.onload = unlock;
    this.img.src = this.url; // trigger the loading of the image for its level
    this.canvas = document.createElement( 'canvas' );
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const context = this.canvas.getContext( '2d' )!;

    // TODO: https://github.com/phetsims/chipper/issues/1218 Could likely be moved to prototype, but would also need a
    // rendered: boolean flag, and there are other usages in scenery that would require adjustment
    this.updateCanvas = () => {
      if ( this.img.complete && ( typeof this.img.naturalWidth === 'undefined' || this.img.naturalWidth > 0 ) ) {
        context.drawImage( this.img, 0, 0 );
        delete this.updateCanvas;
      }
    };
  }
}

phetCore.register( 'MipmapElement', MipmapElement );