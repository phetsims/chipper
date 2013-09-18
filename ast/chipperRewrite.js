function chipperRewrite( contents ) {
  var ast = esprima.parse( contents );
  // var ast = esprima.parse( contents, { raw: true, tokens: true, range: true, comment: true } );
  // ast = escodegen.attachComments( ast, ast.comments, ast.tokens );
  var result = escodegen.generate( ast, {
    comment: true,
    format: {
      indent: {
        style: '  '
      },
      quotes: 'single'
    }
  } );
  return result;
}
