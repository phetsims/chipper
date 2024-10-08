// Copyright 2024, University of Colorado Boulder

/**
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */
const phetSimBrowserGlobals = {
  languageOptions: {
    globals: {

      //=============================================================================================
      // globals that should never be accessed
      //=============================================================================================

      // TODO: Does this work if they are overridden later? https://github.com/phetsims/chipper/issues/1451
      // TODO: Is this still needed? https://github.com/phetsims/chipper/issues/1451
      // Using window.event is most likely a bug, instead the event should be passed through via a parameter,
      // discovered in https://github.com/phetsims/scenery/issues/1053
      event: 'off',

      //=============================================================================================
      // read-only globals
      //=============================================================================================

      phet: 'readonly',

      // allow assertions
      assert: 'readonly',

      // allow slow assertions
      assertSlow: 'readonly',

      phetio: 'readonly',

      // underscore, lodash
      _: 'readonly',

      // jQuery
      $: 'readonly',

      // jQuery for type documentation
      JQuery: 'readonly',

      // JSON diffs
      jsondiffpatch: 'readonly',

      document: 'readonly',

      // for linting Node.js code
      global: 'readonly',

      // QUnit
      QUnit: 'readonly',

      // as used in Gruntfile.js
      // TODO: not a browser global, only for Node https://github.com/phetsims/chipper/issues/1451
      module: 'readonly',

      // Misc
      QueryStringMachine: 'readonly',
      QueryStringMachineSchema: 'readonly',
      QSMParsedParameters: 'readonly',

      // Prism is a syntax highlighter that renders code in the browser. It is used for PhET-iO wrappers and for a11y.
      // TODO: define only where needed https://github.com/phetsims/chipper/issues/1451
      Prism: 'readonly',

      // sole/tween.js
      TWEEN: 'readonly',

      // TODO: redundant right? https://github.com/phetsims/chipper/issues/1451
      window: 'readonly',

      // TODO: old and unused right? Otherwise define only where needed https://github.com/phetsims/chipper/issues/1451
      handlePlaybackEvent: 'readonly',

      // TODO: define only where needed. https://github.com/phetsims/chipper/issues/1451
      paper: 'readonly',

      // TODO: define only where needed https://github.com/phetsims/chipper/issues/1451
      pako: 'readonly',

      // define globals for missing Web Audio types, see https://github.com/phetsims/chipper/issues/1214
      // TODO: define only where needed https://github.com/phetsims/chipper/issues/1451
      OscillatorType: 'readonly',
      AudioContextState: 'readonly',

      // type for QUnit assert
      // TODO: define only where needed https://github.com/phetsims/chipper/issues/1451
      Assert: 'readonly',

      // TODO: redundant right? https://github.com/phetsims/chipper/issues/1451
      fetch: 'readonly',

      // TODO: define only where needed https://github.com/phetsims/chipper/issues/1451
      // React
      React: 'readonly',
      ReactDOM: 'readonly',

      BigInt: 'readonly',

      FlatQueue: 'readonly',

      // TODO: define only where needed https://github.com/phetsims/chipper/issues/1451
      // WebGPU
      GPUShaderModule: 'readonly',
      GPUBindGroupLayout: 'readonly',
      GPUDevice: 'readonly',
      GPUShaderStage: 'readonly',
      GPUBindGroupLayoutEntry: 'readonly',
      GPUComputePipeline: 'readonly',
      GPUBuffer: 'readonly',
      GPUTextureView: 'readonly',
      GPUCommandEncoder: 'readonly',
      GPUBindGroupEntry: 'readonly',
      GPUBufferUsage: 'readonly',
      GPUTextureUsage: 'readonly',
      GPUTexture: 'readonly',
      GPUCanvasContext: 'readonly',
      GPUTextureFormat: 'readonly',
      GPUImageCopyExternalImageSource: 'readonly',
      GPUPipelineLayout: 'readonly',
      GPURenderPipeline: 'readonly',
      GPUBindGroup: 'readonly',
      GPUMapMode: 'readonly',
      GPUFeatureName: 'readonly',
      GPUQuerySet: 'readonly',
      GPUComputePassDescriptor: 'readonly',
      GPUComputePassTimestampWrites: 'readonly',
      GPUComputePipelineDescriptor: 'readonly',
      GPUComputePassEncoder: 'readonly',
      GPUTextureViewDimension: 'readonly',
      GPUStorageTextureAccess: 'readonly',
      GPUBufferBindingType: 'readonly',
      GPUTextureSampleType: 'readonly',
      GPUBufferBinding: 'readonly',
      GPURequestAdapterOptions: 'readonly',
      GPUDeviceDescriptor: 'readonly',
      GPUBufferDescriptor: 'readonly',
      GPUQueue: 'readonly',
      GPUQuerySetDescriptor: 'readonly',
      GPUAdapter: 'readonly',
      GPUMapModeFlags: 'readonly',
      GPUPipelineLayoutDescriptor: 'readonly',
      GPUCommandEncoderDescriptor: 'readonly',
      GPUCommandBuffer: 'readonly',
      GPUBindGroupDescriptor: 'readonly',
      GPUBindGroupLayoutDescriptor: 'readonly',
      GPUShaderModuleDescriptor: 'readonly',
      GPURenderPassDescriptor: 'readonly',
      GPURenderPassEncoder: 'readonly',
      GPUCommandBufferDescriptor: 'readonly',
      GPUImageCopyBuffer: 'readonly',
      GPUImageCopyTexture: 'readonly',
      GPUExtent3DStrict: 'readonly',
      GPUSampler: 'readonly',
      GPUExternalTexture: 'readonly'
    }
  }
};

export default phetSimBrowserGlobals;