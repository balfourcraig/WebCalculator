function unaryOp(left, token){
	return {name: 'UnaryOp', value: left, op: token.type};
}

function postfixOp(left, token){
	return {name: 'PostfixOp', value: left, op: token.type};
}

function numLit(token){
	return {name: 'NumLit', value: parseFloat(token.value)};
}

function numLitHEX(token){
	let val = token.value;
	if(!token.value || token.value.length === 0)
		val = 0;
	return {name: 'NumLit', value: parseInt(val, 16)};
}

function numLitBIN(token){
	let val = token.value;
	if(!token.value || token.value.length === 0)
		val = 0;
	return {name: 'NumLit', value: parseInt(val, 2)};
}

function rational(left, right){
	return {name: 'Rational', left:left, right:right, op:token.type};
}

function complexComponent(token){
	let val;
	if(token.value === null)
		val = 1;
	else
		val = parseFloat(token.value, 10);
	return {name: 'ComplexComponent', value: val};
}

function noOp(){
	return {name: 'NoOp'};
}

function binOp(left, right, token){
	return {name: 'BinOp', left:left, right:right, op:token.type};
}

function absBlock(contents){
	return {name: 'AbsBlock', value:contents};
}

function func(token, paramList){
	return {name: 'Function', value: token.value, paramList: paramList};
}

function variable(token){
	return {name: 'Variable', value: token.value};
}

function assign(id, token){
	return {name: 'Assign', id: id, value: token};
}

function compoundStatement(...statements){
	return {name: 'CompoundStatement', value: statements};
}