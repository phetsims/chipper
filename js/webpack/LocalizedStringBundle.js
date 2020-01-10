export default class LocalizedStringBundle {
  // data[locale][key]
  constructor( data ) {
    // @private
    this.data = data;

    // TODO: Determine optimal API for this, see https://github.com/phetsims/chipper/issues/820
    // TODO: Support an API like REPO_strings.localized.myKey.subkey.
    // TODO: For non-code keys, like so: REPO_strings.localized['simName-something'].

    // TODO: @jonathanolson and @samreid like this API
    // acidBaseSolutionStrings.acidBaseSolutionTitle;
    // acidBaseSolutionStrings.a11y.keyboardTitle;
    // acidBaseSolutionStrings['acidBaseSolutionTitle-with-a-hyphen'];

    //  But we would probably often need to also do
    // TODO: REPO_strings.localized['my.key']
    // TODO: We prefer an API where you

    // TODO: fill in the fallbacks here.
    this.localized = _.mapValues( this.data.en, 'value' ); // TODO: select other locales https://github.com/phetsims/chipper/issues/820
  }
}