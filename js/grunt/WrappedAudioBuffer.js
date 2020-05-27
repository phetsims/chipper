// Copyright 2020, University of Colorado Boulder

import TinyProperty from '../../../axon/js/TinyProperty.js';

/**
 * WrappedAudioBuffer is an object that contains a Web Audio AudioBuffer and a TinyProperty that indicates whether the
 * audio buffer has been decoded.  This is *only* intended for usage during the loading process, not during run time,
 * which is why it isn't namespaced.  This is part of the mechanism in PhET sims through which sounds are imported using
 * the standard JavaScript 'import' statement.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */
class WrappedAudioBuffer {

  constructor() {

    // @public {AudioBuffer|null} - Web Audio AudioBuffer object, to be filled in when a sound is fully decoded
    this.audioBuffer = null;

    // @public {TinyProperty.<boolean>} - Switches from false to true once the audio buffer is set, should never change
    // after that.
    this.loadedProperty = new TinyProperty( false );
  }
}

export default WrappedAudioBuffer;