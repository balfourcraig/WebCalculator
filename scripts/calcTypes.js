function calcNum(value){
	return {type: 'NUM', value: value};
}

function calcComplex(real, imaginary){
	return {type: 'COMPLEX', real: real, imaginary:imaginary};
}

function calcBool(value){
	return {type: 'BOOL', value: value};
}

function calcError(value){
	return {type: 'ERROR', value: value};
}

function calcVoid(){
	return {type: 'VOID'};
}