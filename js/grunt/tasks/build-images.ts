// Copyright 2013-2024, University of Colorado Boulder

/**
 * Build images only
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Jimp from 'jimp';
import getRepo from '../../../../perennial-alias/js/grunt/tasks/util/getRepo.js';
import grunt from '../../../../perennial-alias/js/npm-dependencies/grunt.js';
import generateThumbnails from '../generateThumbnails.js';
import generateTwitterCard from '../generateTwitterCard.js';

const brand = 'phet';

const repo = getRepo();

( async () => {
  const buildDir = `../${repo}/build/${brand}`;
  // Thumbnails and twitter card
  if ( grunt.file.exists( `../${repo}/assets/${repo}-screenshot.png` ) ) {
    const thumbnailSizes = [
      { width: 900, height: 591 },
      { width: 600, height: 394 },
      { width: 420, height: 276 },
      { width: 128, height: 84 },
      { width: 15, height: 10 }
    ];
    for ( const size of thumbnailSizes ) {
      grunt.file.write( `${buildDir}/${repo}-${size.width}.png`, await generateThumbnails( repo, size.width, size.height, 100, Jimp.MIME_PNG ) );
    }

    const altScreenshots = grunt.file.expand( { filter: 'isFile', cwd: `../${repo}/assets` }, [ `./${repo}-screenshot-alt[0123456789].png` ] );
    for ( const altScreenshot of altScreenshots ) {
      const imageNumber = Number( altScreenshot.substr( `./${repo}-screenshot-alt`.length, 1 ) );
      grunt.file.write( `${buildDir}/${repo}-${600}-alt${imageNumber}.png`, await generateThumbnails( repo, 600, 394, 100, Jimp.MIME_PNG, `-alt${imageNumber}` ) );
      grunt.file.write( `${buildDir}/${repo}-${900}-alt${imageNumber}.png`, await generateThumbnails( repo, 900, 591, 100, Jimp.MIME_PNG, `-alt${imageNumber}` ) );
    }

    if ( brand === 'phet' ) {
      grunt.file.write( `${buildDir}/${repo}-ios.png`, await generateThumbnails( repo, 420, 276, 90, Jimp.MIME_JPEG ) );
      grunt.file.write( `${buildDir}/${repo}-twitter-card.png`, await generateTwitterCard( repo ) );
    }
  }
} )();