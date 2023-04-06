function buildError(contents, severety = 'error'){
	return {type: 'build', value: contents, severety, position: -1};
}
const reservedWords = ['TRUE', 'FALSE', 'INFINITY', 'NEGATIVEINFINITY', 'RANDOM'];
function calculator(line, useRational, vars){
	const buildErrors = [];
	const globalScope = {};
	if(vars){
		for(let v of vars){
			globalScope[v.name.toUpperCase()] = {value: v.value, type: v.type};
		}
	}
	const parseResult = parser(line, useRational);
	const root = parseResult.root;
	const parseErrors = parseResult.errors;

	let critical = false;
	if(parseErrors && parseErrors.length > 0){
		for(let i = 0; i < parseErrors.length; i++){
			if(parseErrors[i].severety === 'error'){
				critical = true;
				break;
			}
		}
		if(critical)
			return {result: calcError(), errors: parseErrors};
	}
	let result = visit(root);
	if(result === null){
		buildErrors.push(buildError('Could not calculate a meaningful result'));
	}
	if(buildErrors && buildErrors.length > 0){
		for(let i = 0; i < buildErrors.length; i++){
			if(buildErrors[i].severety === 'error'){
				critical = true;
				break;
			}
		}
		if(critical)
			result =  calcError();
	}
	if(result.type === 'COMPLEX' && result.imaginary === 0)
		result =  calcNum(result.real);
	
	if(result.type === 'RATIONAL')
		result = simplifyRational(result);

	const errors = buildErrors.concat(parseErrors);
	return {result, errors};
	
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
			case 'Rational':
				return visit_Rational(node);
			case 'Assign':
				return visit_Assign(node);
			case 'CompoundStatement':
				return visit_CompoundStatement(node);
			case 'NoOp':
				return calcVoid();
			
		}
		buildErrors.push(buildError('Failed to build node ' + node.name));
		return calcError();
	}
	
	function visit_CompoundStatement(node){
		let result = calcVoid();
		let expressionCount = 0;
		for(let i = 0; i < node.value.length; i++){
			const s = visit(node.value[i]);
			if(s && s.name !== 'NoOp' && s.type !== 'VOID'){
				if(expressionCount === 0)
					result = s;
				expressionCount++;
			}
		}
		if(expressionCount > 1)
			buildErrors.push(buildError(`${expressionCount} expressions. Only showing expression 1`, 'warning'));
		return result;
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
			case 'RATIONAL':
				return PromoteRationalFunc(node);
		}
		buildErrors.push(buildError('Unknown function: ' + node.value, 'warning'));
		return calcVoid();
	}

	
	
	function visit_Variable(node){
		const varName = node.value.toUpperCase();
		switch(varName){
			case 'TRUE':
				return calcBool(true);
			case 'FALSE':
				return calcBool(false);
			case 'INFINITY':
				return calcNum(Infinity);
			case 'NEGATIVEINFINITY':
				return calcNum(-Infinity);
			case 'RANDOM':
				return calcNum(Math.random());
		}
		if(globalScope[varName] !== undefined)
			return globalScope[varName];
		buildErrors.push(buildError('Unknown variable: ' + node.value));
		return calcVoid();
	}

	function visit_Assign(node){
		for(let a of node.assignments){
			const val = visit(a.value);
			const varName = a.id.value.toUpperCase();
			if(globalScope[varName] !== undefined)
				buildErrors.push(buildError('Variable ' + a.id.value + ' already exists', 'warning'));
			else if (reservedWords.indexOf(varName) !== -1)
				buildErrors.push(buildError('Cannot assign to reserved word ' + a.id.value));
			globalScope[varName] = val;
		}
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
						buildErrors.push(buildError('Cannot perform factorial on negative (yet)'));
					}
				}
				else{
					if(val.value >= 0){
						return calcNum(gammaReal(val.value));
					}
					else{
						buildErrors.push(buildError('Cannot perform factorial on negative (yet)'));
					}
					//buildErrors.push('Cannot perform factorial on a non-integer (yet)');
				}
			}
			else if (val.type === 'RATIONAL'){
				if(val.den === 1 && val.num >= 0){
					return calcNum(factorial(val.num));
				}
				else{
					buildErrors.push(buildError('Cannot perform factorial on a rational number'));
				}
			}
			else{
				buildErrors.push(buildError('Can only perform factorial on a positive real integer (so far)'));
			}
		}
		else{
			buildErrors.push(buildError('Unknown postfix operator ' + node.op));
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
		else if(val.type === 'RATIONAL'){
			return calcRational(Math.abs(val.num), Math.abs(val.den));
		}
		buildErrors.push(buildError('Cannot take absolute of ' + val.type));
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
			else if (val.type === 'RATIONAL'){
				return calcRational(val.num * -1, val.den);
			}
			else{
				buildErrors.push(buildError('Unary negative only works on numbers'));
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
				buildErrors.push(buildError('Unary NOT only works on numbers and booleans'));
			}
		}
	}

	function visit_Rational(node){
		const lhs = visit(node.left);
		if(lhs === null){
			buildErrors.push(buildError('LHS was null'));
			return null;
		}
		const rhs = visit(node.right);
		if(rhs === null || rhs.type === 'VOID'){
			return lhs;
		}
		if(lhs.type === 'NUM' && rhs.type === 'NUM'){
			return calcRational(lhs.value, rhs.value);
		}
		else{
			buildErrors.push(buildError('Both sides of a rational must be numbers (for now)'));
		}
	}
	
	function visit_BinOp(node){
		const lhs = visit(node.left);
		if(lhs === null){
			buildErrors.push(buildError('LHS was null'));
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
						buildErrors.push(buildError('RHS was not a boolean'));
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
					buildErrors.push(buildError('RHS was not a number'));
					return null;
				}
			}
			buildErrors.push(buildError('Incompatible types'));
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
						parseErrors.push(buildError('Divide by 0 is undefined', 'warning'));
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
				else if (node.op === 'EQ')
					return calcBool(li.real === ri.real && li.imaginary === ri.imaginary);
				else if (node.op === 'NOTEQ')
					return calcBool(!(li.real === ri.real && li.imaginary === ri.imaginary));
			}
			if(lhs.type === 'RATIONAL' || rhs.type === 'RATIONAL'){
				const lr = promoteNumToRational(lhs);
				const rr = promoteNumToRational(rhs);
				console.log(lr);
				console.log(rr);
				if(node.op === 'ADD'){
					const den = lr.den * rr.den;
					const num = lr.num * rr.den + rr.num * lr.den;
					return calcRational(num,den);
				}
				else if(node.op === 'SUB'){
					const den = lr.den * rr.den;
					const num = lr.num * rr.den - rr.num * lr.den;
					return calcRational(num,den);
				}
				else if(node.op === 'MUL'){
					const den = lr.den * rr.den;
					const num = lr.num * rr.num;
					return calcRational(num,den);
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
						parseErrors.push(buildError('Divide by 0 is undefined', 'warning'));
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
						parseErrors.push(buildError('fractional powers of negatives are not supported', 'warning'));
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
				return calcBool((lhs.value || rhs.value) && !(lhs.value && rhs.value));
			}
		}
		const rhs = visit(node.right);
		if(rhs === null || rhs.type === 'VOID'){
			return lhs;
			//buildErrors.push('RHS was null');
			//return null;
		}
		buildErrors.push(buildError('Incompatible types ' + lhs.type + ' and ' + rhs.type + ' with operator ' + node.op));
		return null;
	}
	
	function sqrtComplex(node){
		if(node.paramList.length != 1){
			parseErrors.push(buildError(node.value + ' requires one parameter only', 'warning'));
			return calcVoid();
		}
		const p = visit(node.paramList[0]);
		if(p.type !== 'NUM'){//Allow sqrt of complex number
			parseErrors.push(buildError(node.value + ' requires a number', 'warning'));
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
			parseErrors.push(buildError(node.value + ' requires one parameter only', 'warning'));
			return calcVoid();
		}
		const p = visit(node.paramList[0]);
		if(p.type === 'NUM')
			return calcNum(Math.abs(p.value));
		else if (p.type === 'COMPLEX')
			return complexMagnitude(p);
		else{
			parseErrors.push(buildError(node.value + ' requires a number', 'warning'));
			return calcVoid();
		}
	}
	
	function oneParamNumFunc(node, callback){
		if(node.paramList.length != 1){
			parseErrors.push(buildError(node.value + ' requires one parameter only', 'warning'));
			return calcVoid();
		}
		let p = visit(node.paramList[0]);
		if(p.type === 'RATIONAL')
			p = calcNum(p.num / p.den);
		if(p.type !== 'NUM'){
			parseErrors.push(buildError(node.value + ' requires a number', 'warning'));
			return calcVoid();
		}
		return calcNum(callback(p.value));
	}
	
	function oneParamNumFuncBool(node, callback, defaultVal){
		if(node.paramList.length != 1){
			parseErrors.push(buildError(node.value + ' requires one parameter only', 'warning'));
			return calcBool(defaultVal);
		}
		let p = visit(node.paramList[0]);
		if(p.type === 'RATIONAL')
			p = calcNum(p.num / p.den);
		if(p.type !== 'NUM'){
			parseErrors.push(buildError(node.value + ' requires a number', 'warning'));
			return calcBool(defaultVal);
		}
		return calcBool(callback(p.value));
	}
	
	function twoParamNumFunc(node, callback){
		if(node.paramList.length != 2){
			parseErrors.push(buildError(node.value + ' requires two parameters only', 'warning'));
			return calcVoid();
		}
		let p1 = visit(node.paramList[0]);
		let p2 = visit(node.paramList[1]);
		if(p1.type === 'RATIONAL')
			p1 = calcNum(p1.num / p1.den);
		if(p2.type === 'RATIONAL')
			p2 = calcNum(p2.num / p2.den);
		
		if(p1.type === 'NUM' && p2.type === 'NUM'){
			return calcNum(callback(p1.value, p2.value));
		}
		else{
			parseErrors.push(buildError(node.value + ' requires two numbers', 'warning'));
			return calcVoid();
		}
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
				parseErrors.push(buildError('Empty element in sum', 'warning'));
				continue;
			}
			else{
				parseErrors.push(buildError('can only sum numbers', 'warning'));
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
			buildErrors.push(buildError('Cannot floor ' + val.type));
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
			buildErrors.push(buildError('Cannot mag floor ' + val.type));
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
			buildErrors.push(buildError('Cannot ceiling ' + val.type));
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
			buildErrors.push(buildError('Cannot perform max between ' + lhs.type + ' and ' + rhs.type));
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
			buildErrors.push(buildError('Cannot perform min between ' + lhs.type + ' and ' + rhs.type));
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
				parseErrors.push(buildError('Can only round numbers, but saw ' + p1.type, 'warning'));
				return calcVoid();
			}
		}
		else if(node.paramList.length === 2){
			const p1 = visit(node.paramList[0]);
			const p2 = visit(node.paramList[1]);
			
			if(p2.type !== 'NUM'){
				parseErrors.push(buildError('Can only round by a real number', 'warning'));
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
				parseErrors.push(buildError('Can only round numbers, but saw ' + p1.type, 'warning'));
				return calcVoid();
			}
		}
		else{
			parseErrors.push(buildError('Round requires 1-2 parameters', 'warning'));
			return calcVoid();
		}
	}
	
	function PromoteRationalFunc(node){
		if(node.paramList.length != 1){
			parseErrors.push(buildError(node.value + ' requires one parameter only', 'warning'));
			return calcBool(defaultVal);
		}
		const p = visit(node.paramList[0]);
		return promoteNumToRational(p);
	}
	
	function promoteNumToComplex(num){
		if(num.type === 'COMPLEX')
			return num;
		else if(num.type === 'NUM')
			return calcComplex(num.value, 0);
		else{
			buildErrors.push(buildError('Could not promote type ' + num.type + ' to complex'));
			return null;
		}
	}
	
	function promoteNumToRational(num){
		if(num.type === 'RATIONAL')
			return num;
		else if(num.type === 'NUM'){
			if(num.value === ~~num.value){
				return calcRational(num.value, 1);
			}
			else{
				const recep = 1/num.value;
				if(recep === ~~recep){
					return calcRational(1, recep);
				}
				const asString = num.value + '';
				const decLength = asString.substring(asString.indexOf('.') + 1).length;
				if(decLength > 5){
					return calcRational(num.value, 1);
				}
				else{
					const shiftedDen = Math.pow(10, decLength);
					const shiftedNum = num.value * shiftedDen;
					const divisor = gcd(shiftedNum, shiftedDen);
					return {type: 'RATIONAL', num: shiftedNum / divisor, den: shiftedDen / divisor};
				}
			}
		}
		else{
			buildErrors.push(buildError('Could not promote type ' + num.type + ' to rational'));
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