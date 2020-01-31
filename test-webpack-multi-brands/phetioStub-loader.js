// ignore the source input and return a stub
module.exports = function( source ) {

  console.log( 'in loader' );
  return '()=>"hi";';
};