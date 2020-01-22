function unaryOp(left, token){
	return {name: 'UnaryOp', expr: left, op: token.type};
}

function numLit(token){
	return {name: 'NumLit', value: parseFloat(token.value)};
}

function noOp(){
	return {name: 'NoOp'};
}

function binOp(left, right, token){
	return {name: 'BinOp', left:left, right:right, op:token.type};
}