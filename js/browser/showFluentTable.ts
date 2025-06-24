// Copyright 2025, University of Colorado Boulder

/**
 * When a sim is run with ?fluentTable, show a UI that displays translations, for evaluation purposes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import Property from '../../../axon/js/Property.js';
import TReadOnlyProperty from '../../../axon/js/TReadOnlyProperty.js';
import localeProperty, { Locale } from '../../../joist/js/i18n/localeProperty.js';
import IntentionalAny from '../../../phet-core/js/types/IntentionalAny.js';
import FluentConstant from './FluentConstant.js';
import FluentPattern from './FluentPattern.js';
import FluentComment from './FluentComment.js';

// Types for fluent entries
type FluentEntry = {
  key: string;
  fluentConstant?: FluentConstant;
  fluentPattern?: FluentPattern<Record<string, unknown>>;
  fluentComment?: FluentComment;
  isConstant: boolean;
  isComment: boolean;
};

export default function showFluentTable( simFluent: Record<string, IntentionalAny>, translationLocale: Locale ): void {

  window.phetSplashScreen && window.phetSplashScreen.dispose();

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

  // Create locale selector
  const localeGroup = document.createElement( 'div' );
  localeGroup.style.cssText = `
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: bold;
    color: #2c3e50;
  `;

  const localeLabel = document.createElement( 'span' );
  localeLabel.textContent = 'Locale:';

  const localeInput = document.createElement( 'select' );
  localeInput.id = 'localeInput';
  localeInput.style.cssText = `
    padding: 0.25rem;
    border: 1px solid #bdc3c7;
    border-radius: 3px;
    font-size: 0.85rem;
  `;

  // Populate with available locales
  localeProperty.availableRuntimeLocales.forEach( locale => {
    const option = document.createElement( 'option' );
    option.value = locale;
    option.textContent = locale;
    if ( locale === translationLocale ) {
      option.selected = true;
    }
    localeInput.appendChild( option );
  } );

  // Create Property for the selected locale
  const userSelectedLocaleProperty = new Property<Locale>( translationLocale );

  localeInput.addEventListener( 'change', () => {
    userSelectedLocaleProperty.value = localeInput.value as Locale;
  } );

  localeGroup.appendChild( localeLabel );
  localeGroup.appendChild( localeInput );
  controls.appendChild( localeGroup );

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
          isConstant: true,
          isComment: false
        } );
      }
      else if ( value instanceof FluentPattern ) {
        fluentEntries.push( {
          key: fullKey,
          fluentPattern: value,
          isConstant: false,
          isComment: false
        } );
      }
      else if ( value instanceof FluentComment ) {
        fluentEntries.push( {
          key: fullKey,
          fluentComment: value,
          isConstant: false,
          isComment: true
        } );
      }
      else {
        collectEntries( value, fullKey, seen );
      }
    }
  };

  // NOTE: This preserves the order from the SimFluent file.
  collectEntries( simFluent );

  // Store parameter Properties for each row
  const rowParameterProperties = new Map<string, Map<string, TReadOnlyProperty<unknown>>>();
  const rowEnglishProperties = new Map<string, TReadOnlyProperty<string>>();
  const rowTranslationProperties = new Map<string, TReadOnlyProperty<string>>();

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
      color: #2c74e8;
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
      color: black;
    `;

    if ( entry.isConstant && entry.fluentConstant ) {
      // Handle FluentConstant (no parameters)
      optionsCell.textContent = '';
      optionsCell.style.fontStyle = 'italic';
      optionsCell.style.color = '#2c74e8';

      localeProperty.value = 'en';
      const result = entry.fluentConstant.value;

      // Create Properties for English and translation values
      const englishProperty = new Property( result );

      const translationProperty = new DerivedProperty( [ userSelectedLocaleProperty ], () => {
        localeProperty.value = userSelectedLocaleProperty.value;
        return entry.fluentConstant!.value;
      } );

      // Link Properties to DOM elements
      englishProperty.link( value => {
        englishCell.textContent = value;
      } );

      translationProperty.link( value => {
        translationCell.textContent = value;
      } );

      // Store Properties for cleanup if needed
      rowEnglishProperties.set( entry.key, englishProperty );
      rowTranslationProperties.set( entry.key, translationProperty );
    }
    else if ( !entry.isConstant && entry.fluentPattern ) {
      // Handle FluentPattern (has parameters)
      const pattern = entry.fluentPattern;

      // Create parameter inputs
      const inputContainer = document.createElement( 'div' );
      const parameterProperties = new Map<string, TReadOnlyProperty<IntentionalAny>>();

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
          let parameterProperty: Property<IntentionalAny>;

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

            // Create Property with initial value
            parameterProperty = new Property( variantMap.get( input.value ) );
          }
          else {
            // Create text input for parameters without variants
            input = document.createElement( 'input' );
            input.type = 'text';
            input.value = `{ $${paramName} }`; // Default value is to show the name of the parameter in fluent syntax
            input.style.cssText = `
              width: 100%;
              padding: 0.25rem;
              border: 1px solid #bdc3c7;
              border-radius: 3px;
              font-size: 0.8rem;
            `;

            // Create Property with initial value
            parameterProperty = new Property( input.value );
          }

          // Add event listener to update Property
          input.addEventListener( 'input', () => {
            if ( variantMap ) {
              // For dropdowns, use the original value from the map
              parameterProperty.value = variantMap.get( input.value );
            }
            else {
              // For text inputs, use the string value
              parameterProperty.value = input.value;
            }
          } );

          parameterProperties.set( paramName, parameterProperty );
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
      rowParameterProperties.set( entry.key, parameterProperties );

      // Create parameter object for FluentPattern.createProperty()
      const parameterObject: Record<string, unknown> = {};
      parameterProperties.forEach( ( property, paramName ) => {
        parameterObject[ paramName ] = property;
      } );

      // Create English Property (always uses 'en' locale)
      const englishProperty = DerivedProperty.deriveAny( Array.from( parameterProperties.values() ), () => {
        localeProperty.value = 'en';
        try {
          return pattern.createProperty( parameterObject ).value;
        }
        catch( error ) {
          return `Error: ${error instanceof Error ? error.message : String( error )}`;
        }
      } );

      // Create Translation Property (uses selected locale)
      const translationProperty = DerivedProperty.deriveAny( [ userSelectedLocaleProperty, ...Array.from( parameterProperties.values() ) ], () => {
        localeProperty.value = userSelectedLocaleProperty.value;
        try {
          return pattern.format( parameterObject );
        }
        catch( error ) {
          return `Error: ${error instanceof Error ? error.message : String( error )}`;
        }
      } );

      // Link Properties to DOM elements
      englishProperty.link( value => {
        englishCell.textContent = value;
        englishCell.style.color = value.startsWith( 'Error:' ) ? '#e74c3c' : '#2c74e8';
      } );

      translationProperty.link( value => {
        translationCell.textContent = value;
        translationCell.style.color = value.startsWith( 'Error:' ) ? '#e74c3c' : 'black';
      } );

      // Store Properties for cleanup if needed
      rowEnglishProperties.set( entry.key, englishProperty );
      rowTranslationProperties.set( entry.key, translationProperty );
    }
    else if ( entry.isComment && entry.fluentComment ) {
      // Handle FluentComment - create a single cell that spans all columns
      row.style.cssText += `
        background-color: #f8f9fa;
        border-left: 4px solid #6c757d;
      `;
      
      // Create a single cell that spans all 4 columns
      const commentCell = document.createElement( 'td' );
      commentCell.setAttribute( 'colspan', '4' );
      commentCell.textContent = entry.fluentComment.comment;
      commentCell.style.cssText = `
        padding: 0.75rem;
        font-weight: bold;
        font-size: 1rem;
        color: #2c3e50;
        background-color: #f8f9fa;
        text-align: left;
      `;
      
      row.appendChild( commentCell );
    }

    // Add cells for non-comment entries
    if ( !entry.isComment ) {
      row.appendChild( keyCell );
      row.appendChild( optionsCell );
      row.appendChild( englishCell );
      row.appendChild( translationCell );
    }
    tbody.appendChild( row );
  } );

  // Assemble the UI
  container.appendChild( header );
  container.appendChild( controls );
  container.appendChild( tableContainer );
  document.body.appendChild( container );


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

  // Set once after building, so it doesn't swap back and forth locales during the build
  userSelectedLocaleProperty.value = translationLocale;
}