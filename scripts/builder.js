function calculator(line){
	const buildErrors = [];
	const root = parser(line);
	//if(lexErrors && lexErrors.length > 0){
		//return calcError(lexErrors);
	//}
	if(parseErrors && parseErrors.length > 0){
		return calcError(parseErrors);
	}
	const result = visit(root);
	if(result === null){
		buildErrors.push('Could not calculate a meaningful result');
	}
	if(buildErrors && buildErrors.length > 0){
		return calcError(buildErrors);
	}
	if(result.type === 'COMPLEX' && result.imaginary === 0)
		return calcNum(result.real);
	
	return result;
	
	function visit(node){
		switch(node.name){
			case 'NumLit':
				return visit_NumLit(node);
			case 'BinOp':
				return visit_BinOp(node);
			case 'PostfixOp':
				return visit_Postfix(node);
			case 'AbsBlock':
				return visit_Abs(node);
			case 'UnaryOp':
				return visit_Unary(node);
			case 'Variable':
				return visit_Variable(node);
			case 'Function':
				return visit_Function(node);
			case 'ComplexComponent':
				return visit_ComplexComponent(node);
			case 'NoOp':
				return calcVoid();
			
		}
		buildErrors.push('Failed to build node ' + node.name);
		return calcError(buildErrors);
	}
	
	function visit_ComplexComponent(node){
		return calcComplex(0, node.value);
	}
	
	function visit_Function(node){
		switch(node.value.toUpperCase()){
			case 'SQRT':
				return sqrtComplex(node);
			case 'LN':
				return oneParamNumFunc(node, Math.log);
			case 'ABS':
				return absComplex(node);
			case 'SIN':
				return oneParamNumFunc(node, Math.sin);
			case 'COS':
				return oneParamNumFunc(node, Math.cos);
			case 'TAN':
				return oneParamNumFunc(node, Math.tan);
			case 'ASIN':
				return oneParamNumFunc(node, Math.asin);
			case 'ACOS':
				return oneParamNumFunc(node, Math.acos);
			case 'ATAN':
				return oneParamNumFunc(node, Math.atan);
			case 'FLOOR':
				return floorComplex(node);
			case 'CEILING':
				return ceilingComplex(node);
			case 'CEIL':
				return ceilingComplex(node);
			case 'MAX':
				return maxComplex(node);
			case 'MIN':
				return minComplex(node);
			case 'LOG':
				return oneParamNumFunc(node, Math.log10);
			case 'SUM':
				return sum(node);
			case 'ISNAN':
				return oneParamNumFuncBool(node, isNaN, false);
			case 'RANDOM':
				return twoParamNumFunc(node, randomRange);
			case 'ROUND':
				return round(node);
			case 'ISEVEN':
				return oneParamNumFuncBool(node, (x) => x % 2 == 0, false);
			case 'ISODD':
				return oneParamNumFuncBool(node, (x) => x % 2 == 1, false);
		}
		parseWarnings.push('Unknown function: ' + node.value);
		return calcVoid();
	}
	
	function visit_Variable(node){
		switch(node.value.toUpperCase()){
			case 'TRUE':
				return calcBool(true);
			case 'FALSE':
				return calcBool(false);
			case 'PI':
				return calcNum(Math.PI);
			case 'INFINITY':
				return calcNum(Infinity);
			case 'NEGATIVEINFINITY':
				return calcNum(-Infinity);
			case 'E':
				return calcNum(Math.E);
			case 'PHI':
				return calcNum(1.61803398874989484820458683436);
			case 'G':
				return calcNum(9.80665);
			case 'C':
				return calcNum(299792458.0);
			case 'RANDOM':
				return calcNum(Math.random());
		}
		parseWarnings.push('Unknown variable: ' + node.value);
		return calcVoid();
	}
	
	function visit_NumLit(node){
		return calcNum(node.value);
	}
	
	function visit_Postfix(node){
		if(node.op === 'NOT'){
			const val = visit(node.value);
			if(val.type === 'NUM'){
				if(val.value === ~~val.value){//integer
					if(val.value >= 0){
						return calcNum(factorial(val.value));
					}
					else{
						buildErrors.push('Cannot perform factorial on negative (yet)');
					}
				}
				else{
					if(val.value >= 0){
						return calcNum(gammaReal(val.value));
					}
					else{
						buildErrors.push('Cannot perform factorial on negative (yet)');
					}
					//buildErrors.push('Cannot perform factorial on a non-integer (yet)');
				}
			}
			else{
				buildErrors.push('Can only perform factorial on a positive real integer (so far)');
			}
		}
		else{
			buildErrors.push('Unknown postfix operator ' + node.op);
		}
	}
	
	function visit_Abs(node){
		const val = visit(node.value);
		if(val.type === 'NUM'){
			if(val.value < 0)
				return calcNum(-1 * val.value);
			return val;
		}
		else if (val.type ==='COMPLEX'){
			return calcNum(Math.sqrt(val.real * val.real + val.imaginary * val.imaginary));
		}
		else if(val.type === 'BOOL'){
			return calcBool(true);
		}
		buildErrors.push('Cannot take absolute of ' + val.type);
	}
	
	function visit_Unary(node){
		if(node.op === 'ADD'){
			return visit(node.value);
		}
		else if(node.op === 'SUB'){
			const val = visit(node.value);
			if(val.type === 'NUM'){
				return calcNum(-1 * val.value);
			}
			else if (val.type === 'COMPLEX'){
				return calcComplex(val.real * -1, -1 * val.imaginary);
			}
			else{
				buildErrors.push('Unary negative only works on numbers');
			}
		}
		else if(node.op === 'NOT'){
			const val = visit(node.value);
			if(val.type === 'NUM'){
				return calcNum(~val.type);
			}
			else if(val.type === 'BOOL'){
				return calcBool(!val.value);
			}
			else{
				buildErrors.push('Unary NOT only works on numbers and booleans');
			}
		}
	}
	
	function visit_BinOp(node){
		const lhs = visit(node.left);
		if(lhs === null){
			buildErrors.push('LHS was null');
			return null;
		}
		if(node.op === 'AND' || node.op === 'OR'){
			if(lhs.type === 'BOOL'){
				if(node.op === 'OR' && node.value === true)
					return calcBool(true);
				else if (node.op === 'AND' && node.value === false)
					return calcBool(false);
				else{
					const rhs = visit(node.right);
					if(rhs === null || rhs.type === 'VOID'){
						return lhs;
					}
					if(rhs.type === 'BOOL'){
						if(node.op === 'AND')
							return calcBool(lhs.value && rhs.value);
						else if (node.op === 'OR')
							return calcBool(lhs.value || rhs.value);
					}
					else{
						buildErrors.push('RHS was not a boolean');
						return null;
					}
				}
			}
			else if(lhs.type === 'NUM'){
				const rhs = visit(node.right);
				if(rhs === null || rhs.type === 'VOID'){
					return lhs;
				}
				if(rhs.type === 'NUM'){
					if(node.op === 'AND'){
						return calcNum(lhs.value & rhs.value);
					}
					else if(node.op === 'OR'){
						return calcNum(lhs.value | rhs.value);
					}
				}
				else{
					buildErrors.push('RHS was not a number');
					return null;
				}
			}
			buildErrors.push('Incompatible types');
			return null;
		}
		else{
			const rhs = visit(node.right);
			if(rhs === null || rhs.type === 'VOID'){
				return lhs;
			}
			
			if(lhs.type === 'COMPLEX' || rhs.type === 'COMPLEX'){
				const li = promoteNumToComplex(lhs);
				const ri = promoteNumToComplex(rhs);
				
				if(node.op === 'ADD')
					return calcComplex(li.real + ri.real, li.imaginary + ri.imaginary);
				else if (node.op === 'SUB')
					return calcComplex(li.real - ri.real, li.imaginary - ri.imaginary);
				else if (node.op === 'MUL')
					return complexMul(li,ri);
				else if(node.op === 'DIV'){
					if(!ri.real && !ri.imaginary){
						parseWarnings.push('Divide by 0 is undefined');
						return calcNum(NaN);
					}
					const conjugate = calcComplex(ri.real, -ri.imaginary);
					const numerator = complexMul(li, conjugate);
					const denomenator = complexMul(ri, conjugate).real;
					return calcComplex(numerator.real / denomenator, numerator.imaginary / denomenator);
				}
				else if(node.op === 'POW' && rhs.type === 'NUM'){
					let powRes = calcComplex(1,0);
					for(let i = 0; i < rhs.value; i++){
						powRes = complexMul(li, powRes);
					}
					return powRes;
				}
			}
			if(lhs.type === 'NUM' && rhs.type === 'NUM'){
				if(node.op === 'ADD')
					return calcNum(lhs.value + rhs.value);
				else if(node.op === 'SUB')
					return calcNum(lhs.value - rhs.value);
				else if(node.op === 'MUL')
					return calcNum(lhs.value * rhs.value);
				else if(node.op === 'DIV'){
					if(rhs.value)
						return calcNum(lhs.value / rhs.value);
					else{
						parseWarnings.push('Divide by 0 is undefined');
						return calcNum(NaN);
					}
				}
				else if(node.op === 'POW'){
					if(lhs.value > 0){
						return calcNum(Math.pow(lhs.value, rhs.value));
					}
					else if(lhs.value < 0 && rhs.value === 0.5){
						return calcComplex(0, Math.sqrt(-lhs.value));
					}
					else{
						parseWarnings.push('fractional powers of negatives are not supported');
						return calcNum(NaN);
					}
				}
				else if(node.op === 'MOD')
					return calcNum(fullMod(lhs.value, rhs.value));
				if(node.op === 'XOR')
					return calcBool(lhs.value ^ rhs.value);
			}
			if(node.op === 'EQ')
				return calcBool(lhs.value === rhs.value);
			if(node.op === 'NOTEQ')
				return calcBool(lhs.value !== rhs.value);
			if(node.op === 'GREATEREQ')
				return calcBool(lhs.value >= rhs.value);
			if(node.op === 'LESSEQ')
				return calcBool(lhs.value <= rhs.value);
			if(node.op === 'LESS')
				return calcBool(lhs.value < rhs.value);
			if(node.op === 'GREATER')
				return calcBool(lhs.value > rhs.value);
			if(lhs.type === 'BOOL' && rhs.type === 'BOOL' && node.op === 'XOR'){
				console.log(lhs.type);
				console.log(rhs.type);
				console.log(lhs.value);
				console.log(rhs.value);
				return calcBool(lhs.value || rhs.value && !(lhs.value && rhs.value));
			}
		}
		const rhs = visit(node.right);
		if(rhs === null || rhs.type === 'VOID'){
			return lhs;
			//buildErrors.push('RHS was null');
			//return null;
		}
		buildErrors.push('Incompatible types ' + lhs.type + ' and ' + rhs.type + ' with operator ' + node.op);
		return null;
	}
	
	function sqrtComplex(node){
		if(node.paramList.length != 1){
			parseWarnings.push(node.value + ' requires one parameter only');
			return calcVoid();
		}
		const p = visit(node.paramList[0]);
		if(p.type !== 'NUM'){//Allow sqrt of complex number
			parseWarnings.push(node.value + ' requires a number');
			return calcVoid();
		}
		if(p.value < 0){
			return calcComplex(0, Math.sqrt(-p.value));
		}
		else
			return calcNum(Math.sqrt(p.value));
	}
	
	function absComplex(node){
		if(node.paramList.length != 1){
			parseWarnings.push(node.value + ' requires one parameter only');
			return calcVoid();
		}
		const p = visit(node.paramList[0]);
		if(p.type === 'NUM')
			return calcNum(Math.abs(p.value));
		else if (p.type === 'COMPLEX')
			return complexMagnitude(p);
		else{
			parseWarnings.push(node.value + ' requires a number');
			return calcVoid();
		}
	}
	
	function oneParamNumFunc(node, callback){
		if(node.paramList.length != 1){
			parseWarnings.push(node.value + ' requires one parameter only');
			return calcVoid();
		}
		const p = visit(node.paramList[0]);
		if(p.type !== 'NUM'){
			parseWarnings.push(node.value + ' requires a number');
			return calcVoid();
		}
		return calcNum(callback(p.value));
	}
	
	function oneParamNumFuncBool(node, callback, defaultVal){
		if(node.paramList.length != 1){
			parseWarnings.push(node.value + ' requires one parameter only');
			return calcBool(defaultVal);
		}
		const p = visit(node.paramList[0]);
		if(p.type !== 'NUM'){
			parseWarnings.push(node.value + ' requires a number');
			return calcBool(defaultVal);
		}
		return calcBool(callback(p.value));
	}
	
	function twoParamNumFunc(node, callback){
		if(node.paramList.length != 2){
			parseWarnings.push(node.value + ' requires two parameters only');
			return calcVoid();
		}
		const p1 = visit(node.paramList[0]);
		const p2 = visit(node.paramList[1]);
		if(p1.type !== 'NUM' || p2.type !== 'NUM'){
			parseWarnings.push(node.value + ' requires two numbers');
			return calcVoid();
		}
		return calcNum(callback(p1.value, p2.value));
	}
	
	function randomRange(low, high){
		const min = Math.min(low, high);
		const max = Math.max(low, high)
		const diff = max - min;
		return Math.floor(Math.random() * diff + min);
	}
	
	function sum(node){
		let result = calcComplex(0,0);
		for(let i = 0; i < node.paramList.length; i++){
			const val = visit(node.paramList[i]);
			if(val.type === 'NUM'){
				result = calcComplex(result.real + val.value, result.imaginary);
			}
			else if(val.type === 'COMPLEX'){
				result = calcComplex(result.real + val.real, result.imaginary + val.imaginary);
			}
			else if(val.type === 'VOID'){
				parseWarnings.push('Empty element in sum');
				continue;
			}
			else{
				parseWarnings.push('can only sum numbers');
				return calcVoid();
			}
		}
		if(result.imaginary === 0){
			return calcNum(result.real);
		}
		return result;
	}
	
	function floorComplex(node){
		const val = visit(node.paramList[0]);
		if(val.type === 'NUM'){
			return calcNum(Math.floor(val.value));
		}
		else if (val.type === 'COMPLEX'){
			return calcComplex(Math.floor(val.real), Math.floor(val.imaginary));
		}
		else{
			buildErrors.push('Cannot floor ' + val.type);
			return null;
		}
	}
	
	function floorComplexMag(node){
		const val = visit(node.paramList[0]);
		if (val.type === 'COMPLEX'){
			const mag = complexMagnitude(val);
			//const ratio = 
			//return calcComplex(Math.floor(val.real), Math.floor(val.imaginary));
		}
		else{
			buildErrors.push('Cannot mag floor ' + val.type);
			return null;
		}
	}
	
	function ceilingComplex(node){
		const val = visit(node.paramList[0]);
		if(val.type === 'NUM'){
			return calcNum(Math.ceil(val.value));
		}
		else if (val.type === 'COMPLEX'){
			return calcComplex(Math.ceil(val.real), Math.ceil(val.imaginary));
		}
		else{
			buildErrors.push('Cannot ceiling ' + val.type);
			return null;
		}
	}
	
	function maxComplex(node){
		const lhs = visit(node.paramList[0]);
		const rhs = visit(node.paramList[1]);
		if(lhs.type === 'NUM' && rhs.type === 'NUM'){
			return calcNum(Math.max(lhs.value, rhs.value));
		}
		else if ((lhs.type === 'NUM' || lhs.type === 'COMPLEX') && (rhs.type === 'NUM' || rhs.type === 'COMPLEX')){
			const magL = complexMagnitude(promoteNumToComplex(lhs));
			const magR = complexMagnitude(promoteNumToComplex(rhs));
			console.log(magL);
			console.log(magR);
			if(magL.value >= magR.value){
				return lhs;
			}
			else{
				return rhs;
			}
		}
		else{
			buildErrors.push('Cannot perform max between ' + lhs.type + ' and ' + rhs.type);
			return null;
		}
	}
	
	function minComplex(node){
		const lhs = visit(node.paramList[0]);
		const rhs = visit(node.paramList[1]);
		if(lhs.type === 'NUM' && rhs.type === 'NUM'){
			return calcNum(Math.min(lhs.value, rhs.value));
		}
		else if ((lhs.type === 'NUM' || lhs.type === 'COMPLEX') && (rhs.type === 'NUM' || rhs.type === 'COMPLEX')){
			const magL = complexMagnitude(promoteNumToComplex(lhs));
			const magR = complexMagnitude(promoteNumToComplex(rhs));
			console.log(magL);
			console.log(magR);
			if(magL.value <= magR.value){
				return lhs;
			}
			else{
				return rhs;
			}
		}
		else{
			buildErrors.push('Cannot perform min between ' + lhs.type + ' and ' + rhs.type);
			return null;
		}
	}
	
	function round(node){
		if(node.paramList.length === 1){//default to 0dp
			const p1 = visit(node.paramList[0]);
			if(p1.type === 'NUM'){
				return calcNum(Math.round(p1.value));
			}
			else if(p1.type === 'COMPLEX'){
				return calcComplex(Math.round(p1.real), Math.round(p1.imaginary));
			}
			else{
				parseWarnings.push('Can only round numbers, but saw ' + p1.type);
				return calcVoid();
			}
		}
		else if(node.paramList.length === 2){
			const p1 = visit(node.paramList[0]);
			const p2 = visit(node.paramList[1]);
			
			if(p2.type !== 'NUM'){
				parseWarnings.push('Can only round by a real number');
				return p1;
			}
			const offset = Math.pow(10, p2.value);
			if(p1.type === 'NUM'){
				return calcNum(Math.round((p1.value + Number.EPSILON) * offset) / offset);
			}
			else if (p1.type === 'COMPLEX'){
				return calcComplex(Math.round((p1.real + Number.EPSILON) * offset) / offset, Math.round((p1.imaginary + Number.EPSILON) * offset) / offset);
			}
			else{
				parseWarnings.push('Can only round numbers, but saw ' + p1.type);
				return calcVoid();
			}
		}
		else{
			parseWarnings.push('Round requires 1-2 parameters');
			return calcVoid();
		}
	}
	
	function promoteNumToComplex(num){
		if(num.type === 'COMPLEX')
			return num;
		else if(num.type === 'NUM')
			return calcComplex(num.value, 0);
		else{
			buildErrors.push('Could not promote type ' + num.type + ' to complex');
			return null;
		}
	}
}

function complexMagnitude(complex){
	return calcNum(Math.sqrt(complex.real * complex.real + complex.imaginary * complex.imaginary));
}

function complexMul(lhs, rhs){
	return calcComplex((lhs.real * rhs.real) - (lhs.imaginary * rhs.imaginary), (lhs.real * rhs.imaginary) + (rhs.real * lhs.imaginary));
}

function fullMod(lhs, rhs){
	const r = lhs % rhs;
	return r < 0 ? r + rhs : r;
}

function factorial(num){
	let r = 1;
	for(let i = 1; i <= num; i++){
		r *= i;
	}
	return r;
}

function gammaReal(x){
	const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];
	
	const g = 7;
    if (x < 0.5) {
        return Math.PI / (Math.sin(Math.PI * x) * gammaReal(1 - x));
    }
	
	//x -= 1;//This is in the actual function, but it breaks it here, and I don't know why
    let a = p[0];
    const t = x + g + 0.5;
    for (let i = 1; i < p.length; i++) {
        a += p[i] / (x + i);
    }
 
    return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}