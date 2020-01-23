function calcNum(value){
	return {type: 'NUM', value: value};
}

function calcBool(value){
	return {type: 'BOOL', value: value};
}

function calcError(value){
	return {type: 'ERROR', value: value};
}