export default function getString( stringFile, key ) {
  const locale = 'en'; // TODO: different locales https://github.com/phetsims/chipper/issues/820
  return stringFile[ locale ][ key ].value;
}