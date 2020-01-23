function unaryOp(left, token){
	return {name: 'UnaryOp', value: left, op: token.type};
}

function numLit(token){
	return {name: 'NumLit', value: parseFloat(token.value)};
}

function numLitHEX(token){
	return {name: 'NumLit', value: parseInt(token.value, 16)};
}

function numLitBIN(token){
	return {name: 'NumLit', value: parseInt(token.value, 2)};
}

function noOp(){
	return {name: 'NoOp'};
}

function binOp(left, right, token){
	return {name: 'BinOp', left:left, right:right, op:token.type};
}

function func(token, paramList){
	return {name: 'Function', value: token.value, paramList: paramList};
}

function variable(token){
	return {name: 'Variable', value: token.value};
}