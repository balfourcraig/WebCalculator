function calcNum(value){
	return {type: 'NUM', value: typeof(value) === 'number' ? value : parseFloat(value)};
}

function calcComplex(real, imaginary){
	return {type: 'COMPLEX', real: typeof(real) === 'number' ? real : parseFloat(real), imaginary: typeof(imaginary) === 'number' ? imaginary : parseFloat(imaginary)};
}

function calcBool(value){
	return {type: 'BOOL', value: value};
}

function calcError(){
	return {type: 'ERROR', value: null};
}

function calcVoid(){
	return {type: 'VOID'};
}

function calcRational(num, den){
	num = typeof(num) === 'number' ? num : parseFloat(num);
	den = typeof(den) === 'number' ? den : parseFloat(den);

	//const deci = num/den;
	//if(deci === ~~deci || num !== ~~num || den !== ~~den)//decimals involved or evaluates to an integer
		//return {type: 'NUM', value: deci};
		
	//const divisor = gcd(num, den);
	return {type: 'RATIONAL', num: num, den: den, valid: num === ~~num && den === ~~den};
}

function simplifyRational(r){
	const deci = r.num/r.den;
	if(deci === ~~deci || r.num !== ~~r.num || r.den !== ~~r.den)//decimals involved or evaluates to an integer
		return {type: 'NUM', value: deci};
		
	const divisor = gcd(r.num, r.den);
	return {type: 'RATIONAL', num: r.num / divisor, den: r.den / divisor};
}

function gcd(a, b){
	if(b == 0)
		return a;
	else
		return gcd(b, a % b);
}