// Copyright 2025, University of Colorado Boulder

/**
 * When a sim is run with ?showFluent, show a UI that displays translations, for evaluation purposes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import FluentConstant from './FluentConstant.js';
import FluentPattern from './FluentPattern.js';

// Types for fluent entries
type FluentEntry = {
  key: string;
  fluentConstant?: FluentConstant;
  fluentPattern?: FluentPattern<Record<string, unknown>>;
  isConstant: boolean;
};

export default function showFluent( simFluent: Record<string, IntentionalAny> ): void {

  // Create the main container
  const container = document.createElement( 'div' );
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 10000;
    font-family: Arial, sans-serif;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;

  // Create header
  const header = document.createElement( 'div' );
  header.style.cssText = `
    background: #2c3e50;
    color: white;
    padding: 1rem 1.5rem;
    flex-shrink: 0;
  `;

  const title = document.createElement( 'h1' );
  title.textContent = 'Fluent String Evaluation Tool';
  title.style.cssText = `
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  `;

  const subtitle = document.createElement( 'p' );
  subtitle.textContent = 'Evaluate fluent string translations with real-time parameter interpolation';
  subtitle.style.margin = '0';

  header.appendChild( title );
  header.appendChild( subtitle );

  // Create controls
  const controls = document.createElement( 'div' );
  controls.style.cssText = `
    background: #ecf0f1;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #bdc3c7;
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    flex-shrink: 0;
  `;

  // Create column visibility checkboxes
  const checkboxes = [
    { id: 'showKey', label: 'Show Key', checked: true },
    { id: 'showOptions', label: 'Show Options', checked: true },
    { id: 'showEnglish', label: 'Show English', checked: true },
    { id: 'showTranslation', label: 'Show Translation', checked: true }
  ];

  checkboxes.forEach( ( { id, label, checked } ) => {
    const controlGroup = document.createElement( 'label' );
    controlGroup.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: bold;
      color: #2c3e50;
      cursor: pointer;
    `;

    const checkbox = document.createElement( 'input' );
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.checked = checked;
    checkbox.addEventListener( 'change', updateColumnVisibility );

    const labelText = document.createElement( 'span' );
    labelText.textContent = label;

    controlGroup.appendChild( checkbox );
    controlGroup.appendChild( labelText );
    controls.appendChild( controlGroup );
  } );

  // Create table container
  const tableContainer = document.createElement( 'div' );
  tableContainer.style.cssText = `
    flex: 1;
    overflow: auto;
    background: white;
  `;

  // Create table
  const table = document.createElement( 'table' );
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  `;

  // Create table header
  const thead = document.createElement( 'thead' );
  const headerRow = document.createElement( 'tr' );

  const headers = [
    { id: 'keyHeader', text: 'Key' },
    { id: 'optionsHeader', text: 'Options' },
    { id: 'englishHeader', text: 'English' },
    { id: 'translationHeader', text: 'Translation' }
  ];

  headers.forEach( ( { id, text } ) => {
    const th = document.createElement( 'th' );
    th.id = id;
    th.textContent = text;
    th.style.cssText = `
      background: #34495e;
      color: white;
      padding: 0.75rem;
      text-align: left;
      font-weight: bold;
      position: sticky;
      top: 0;
      z-index: 10;
      border-right: 1px solid #2c3e50;
    `;
    headerRow.appendChild( th );
  } );

  thead.appendChild( headerRow );
  table.appendChild( thead );

  // Create table body
  const tbody = document.createElement( 'tbody' );
  table.appendChild( tbody );
  tableContainer.appendChild( table );

  // Collect all fluent entries
  const fluentEntries: FluentEntry[] = [];

  const collectEntries = (
    obj: IntentionalAny,
    prefix = '',
    seen: WeakSet<object> = new WeakSet()
  ): void => {
    if ( obj === null || typeof obj !== 'object' ) {
      return;
    }

    if ( seen.has( obj ) ) {
      return;
    }
    seen.add( obj );

    for ( const key of Object.keys( obj ) ) {
      const value = obj[ key ];
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if ( value instanceof FluentConstant ) {
        fluentEntries.push( {
          key: fullKey,
          fluentConstant: value,
          isConstant: true
        } );
      }
      else if ( value instanceof FluentPattern ) {
        fluentEntries.push( {
          key: fullKey,
          fluentPattern: value,
          isConstant: false
        } );
      }
      else {
        collectEntries( value, fullKey, seen );
      }
    }
  };

  collectEntries( simFluent );

  // Sort entries by key for consistent display
  fluentEntries.sort( ( a, b ) => a.key.localeCompare( b.key ) );

  // Store for parameter updates
  const parameterInputs = new Map<string, HTMLElement>();
  const updateTimeouts = new Map<string, number>();

  // Create table rows
  fluentEntries.forEach( entry => {
    const row = document.createElement( 'tr' );
    row.style.cssText = `
      border-bottom: 1px solid #ecf0f1;
    `;
    row.classList.add( 'fluent-row' );

    // Key column
    const keyCell = document.createElement( 'td' );
    keyCell.className = 'key-cell';
    keyCell.textContent = entry.key;
    keyCell.style.cssText = `
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      color: #2c3e50;
      padding: 0.75rem;
      vertical-align: top;
      min-width: 200px;
      max-width: 300px;
      word-break: break-word;
      border-right: 1px solid #ecf0f1;
    `;

    // Options column
    const optionsCell = document.createElement( 'td' );
    optionsCell.className = 'options-cell';
    optionsCell.style.cssText = `
      padding: 0.75rem;
      vertical-align: top;
      min-width: 200px;
      max-width: 300px;
      border-right: 1px solid #ecf0f1;
    `;

    // English column
    const englishCell = document.createElement( 'td' );
    englishCell.className = 'english-cell';
    englishCell.style.cssText = `
      padding: 0.75rem;
      vertical-align: top;
      max-width: 400px;
      word-wrap: break-word;
      color: #27ae60;
      border-right: 1px solid #ecf0f1;
    `;

    // Translation column
    const translationCell = document.createElement( 'td' );
    translationCell.className = 'translation-cell';
    translationCell.style.cssText = `
      padding: 0.75rem;
      vertical-align: top;
      max-width: 400px;
      word-wrap: break-word;
      color: #8e44ad;
    `;

    if ( entry.isConstant && entry.fluentConstant ) {
      // Handle FluentConstant (no parameters)
      optionsCell.textContent = 'No parameters';
      optionsCell.style.fontStyle = 'italic';
      optionsCell.style.color = '#7f8c8d';

      const constantValue = entry.fluentConstant.value;
      englishCell.textContent = constantValue;
      translationCell.textContent = constantValue; // Initially same as English
    }
    else if ( !entry.isConstant && entry.fluentPattern ) {
      // Handle FluentPattern (has parameters)
      const pattern = entry.fluentPattern;

      // Create parameter inputs
      const inputContainer = document.createElement( 'div' );
      const parameterValues: Record<string, unknown> = {};

      if ( pattern.args && pattern.args.length > 0 ) {
        pattern.args.forEach( ( argDef, index ) => {
          const inputGroup = document.createElement( 'div' );
          inputGroup.style.cssText = `
            margin-bottom: 0.5rem;
          `;

          const label = document.createElement( 'label' );
          label.style.cssText = `
            display: block;
            font-weight: bold;
            margin-bottom: 0.25rem;
            font-size: 0.8rem;
            color: #34495e;
          `;

          // Extract parameter name and variants from the arg definition
          const paramName = ( argDef as IntentionalAny ).name || `param${index}`;
          const variants = ( argDef as IntentionalAny ).variants;
          label.textContent = paramName;

          let input: HTMLInputElement | HTMLSelectElement;
          let variantMap: Map<string, unknown> | undefined;

          if ( variants && variants.length > 0 ) {
            // Create dropdown for parameters with variants
            input = document.createElement( 'select' );
            variantMap = new Map<string, unknown>();
            variants.forEach( ( variant: IntentionalAny, index: number ) => {
              const option = document.createElement( 'option' );
              // Handle complex variant objects like {"type":"number","value":"one"}
              const value = typeof variant === 'object' && variant.value !== undefined ? variant.value : variant;
              const optionKey = `${index}`;
              option.value = optionKey;
              option.textContent = String( value );
              variantMap!.set( optionKey, value );
              input.appendChild( option );
            } );
            input.style.cssText = `
              width: 100%;
              padding: 0.25rem;
              border: 1px solid #bdc3c7;
              border-radius: 3px;
              font-size: 0.8rem;
            `;

            // Store initial parameter value using original type
            parameterValues[ paramName ] = variantMap.get( input.value );
          }
          else {
            // Create text input for parameters without variants
            input = document.createElement( 'input' );
            input.type = 'text';
            input.value = 'hello world'; // Default value
            input.style.cssText = `
              width: 100%;
              padding: 0.25rem;
              border: 1px solid #bdc3c7;
              border-radius: 3px;
              font-size: 0.8rem;
            `;

            // Store initial parameter value
            parameterValues[ paramName ] = input.value;
          }

          // Add event listener for real-time updates
          input.addEventListener( 'input', () => {
            if ( variantMap ) {
              // For dropdowns, use the original value from the map
              parameterValues[ paramName ] = variantMap.get( input.value );
            }
            else {
              // For text inputs, use the string value
              parameterValues[ paramName ] = input.value;
            }
            debounceUpdate( entry.key, () => updatePatternRow( entry, parameterValues, englishCell, translationCell ) );
          } );

          inputGroup.appendChild( label );
          inputGroup.appendChild( input );
          inputContainer.appendChild( inputGroup );
        } );
      }
      else {
        const noParamsText = document.createElement( 'span' );
        noParamsText.textContent = 'No parameters defined';
        noParamsText.style.cssText = `
          font-style: italic;
          color: #7f8c8d;
        `;
        inputContainer.appendChild( noParamsText );
      }

      optionsCell.appendChild( inputContainer );
      parameterInputs.set( entry.key, inputContainer );

      // Initial interpolation
      updatePatternRow( entry, parameterValues, englishCell, translationCell );
    }

    row.appendChild( keyCell );
    row.appendChild( optionsCell );
    row.appendChild( englishCell );
    row.appendChild( translationCell );
    tbody.appendChild( row );
  } );

  // Assemble the UI
  container.appendChild( header );
  container.appendChild( controls );
  container.appendChild( tableContainer );
  document.body.appendChild( container );

  // Function to update pattern row
  function updatePatternRow(
    entry: FluentEntry,
    parameterValues: Record<string, unknown>,
    englishCell: HTMLElement,
    translationCell: HTMLElement
  ): void {
    if ( !entry.fluentPattern ) {
      return;
    }

    try {
      const result = entry.fluentPattern.format( parameterValues );
      englishCell.textContent = result;
      translationCell.textContent = result; // Initially same as English

      // Remove error styling
      englishCell.style.color = '#27ae60';
      translationCell.style.color = '#8e44ad';
    }
    catch( error ) {
      const errorMessage = `Error: ${error instanceof Error ? error.message : String( error )}`;
      englishCell.textContent = errorMessage;
      translationCell.textContent = errorMessage;

      // Add error styling
      englishCell.style.color = '#e74c3c';
      translationCell.style.color = '#e74c3c';
    }
  }

  // Debounce function for performance
  function debounceUpdate( key: string, callback: () => void ): void {
    const existingTimeout = updateTimeouts.get( key );
    if ( existingTimeout ) {
      clearTimeout( existingTimeout );
    }

    const timeoutId = window.setTimeout( () => {
      callback();
      updateTimeouts.delete( key );
    }, 300 );

    updateTimeouts.set( key, timeoutId );
  }

  // Function to update column visibility
  function updateColumnVisibility(): void {
    const showKey = ( document.getElementById( 'showKey' ) as HTMLInputElement ).checked;
    const showOptions = ( document.getElementById( 'showOptions' ) as HTMLInputElement ).checked;
    const showEnglish = ( document.getElementById( 'showEnglish' ) as HTMLInputElement ).checked;
    const showTranslation = ( document.getElementById( 'showTranslation' ) as HTMLInputElement ).checked;

    // Update headers
    const keyHeader = document.getElementById( 'keyHeader' );
    const optionsHeader = document.getElementById( 'optionsHeader' );
    const englishHeader = document.getElementById( 'englishHeader' );
    const translationHeader = document.getElementById( 'translationHeader' );

    if ( keyHeader ) {
      keyHeader.style.display = showKey ? '' : 'none';
    }
    if ( optionsHeader ) {
      optionsHeader.style.display = showOptions ? '' : 'none';
    }
    if ( englishHeader ) {
      englishHeader.style.display = showEnglish ? '' : 'none';
    }
    if ( translationHeader ) {
      translationHeader.style.display = showTranslation ? '' : 'none';
    }

    // Update cells
    const keyCells = document.querySelectorAll( '.key-cell' );
    const optionsCells = document.querySelectorAll( '.options-cell' );
    const englishCells = document.querySelectorAll( '.english-cell' );
    const translationCells = document.querySelectorAll( '.translation-cell' );

    keyCells.forEach( cell => {
      ( cell as HTMLElement ).style.display = showKey ? '' : 'none';
    } );
    optionsCells.forEach( cell => {
      ( cell as HTMLElement ).style.display = showOptions ? '' : 'none';
    } );
    englishCells.forEach( cell => {
      ( cell as HTMLElement ).style.display = showEnglish ? '' : 'none';
    } );
    translationCells.forEach( cell => {
      ( cell as HTMLElement ).style.display = showTranslation ? '' : 'none';
    } );
  }

  // Add some responsive styles
  const style = document.createElement( 'style' );
  style.textContent = `
    @media (max-width: 768px) {
      .fluent-row td {
        padding: 0.5rem 0.25rem !important;
        font-size: 0.8rem !important;
      }
      .fluent-row .key-cell {
        min-width: 120px !important;
        max-width: 200px !important;
      }
      .fluent-row .options-cell {
        min-width: 150px !important;
        max-width: 250px !important;
      }
    }
  `;
  document.head.appendChild( style );
}