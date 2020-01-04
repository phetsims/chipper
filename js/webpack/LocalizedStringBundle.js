export default class LocalizedStringBundle {
  // data[locale][key]
  constructor( data ) {
    // @private
    this.data = data;


    // TODO: Determine optimal API for this, see https://github.com/phetsims/chipper/issues/820
    // TODO: This API allows you to do REPO_strings.localized.myKey.  But we would probably often need to also do
    // TODO: REPO_strings.localized['my.key']
    this.localized = _.mapValues( this.data.en, 'value' ); // TODO: select other locales https://github.com/phetsims/chipper/issues/820
  }
}