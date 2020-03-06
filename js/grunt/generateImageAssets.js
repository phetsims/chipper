// Copyright 2020, University of Colorado Boulder

const generateThumbnails = require( './generateThumbnails' );
const generateTwitterCard = require( './generateTwitterCard' );
const grunt = require( 'grunt' );
const jimp = require( 'jimp' );

/**
 *
 * @param buildDir
 * @param repo
 * @param brand
 * @returns {Promise<void>}
 */
const generateImageAssets = async ( repo, brand ) => {
  console.log( 'hellooo' );

  // Create the build-specific directory, if it doesn't exist yet
  const buildDir = `../${repo}/build/${brand}`;
  if ( !grunt.file.exists( buildDir ) ) {
    grunt.file.mkdir( buildDir );
    console.log( 'made the build dir' );
  }

  // Thumbnails and twitter card
  if ( grunt.file.exists( `../${repo}/assets/${repo}-screenshot.png` ) ) {
    console.log( 'souce file exists, generating images' );
    const thumbnailConfigs = [
      { width: 600, height: 394 },
      { width: 420, height: 276 },
      { width: 128, height: 84 },
      { width: 15, height: 10 }
    ];
    for ( const config of thumbnailConfigs ) {
      console.log( 'processing image for ', `${config.width}` );
      try {
        grunt.file.write( `${buildDir}/${repo}-${config.width}${config.quality ? `-${config.quality}` : ''}.png`, await generateThumbnails( repo, config.width, config.height, config.quality || 100, config.mime || jimp.MIME_PNG ) );
      }
      catch ( e ) {
        console.error( 'unable to write image', e );
      }
      console.log( 'writing image to ', `${buildDir}/${repo}-${config.width}.png` );
    }

    if ( brand === 'phet' ) {
      grunt.file.write( `${buildDir}/${repo}-ios.png`, await generateThumbnails( repo, 420, 276, 90, jimp.MIME_JPEG ) );
      grunt.file.write( `${buildDir}/${repo}-twitter-card.png`, await generateTwitterCard( repo ) );
    }
  }
  else {
    console.error( 'Missing image source!' );
  }
};

module.exports = generateImageAssets;