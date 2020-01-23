function calculator(line){
	const buildErrors = [];
	const root = parser(line);
	if(parseErrors && parseErrors.length > 0){
		return calcError(parseErrors);
	}
	const result = visit(root);
	if(buildErrors && buildErrors.length > 0){
		return calcError(buildErrors);
	}
	return result;
	
	function visit(node){
		switch(node.name){
			case 'NumLit':
				return visit_NumLit(node);
			case 'BinOp':
				return visit_BinOp(node);
			case 'UnaryOp':
				return visit_Unary(node);
			case 'Variable':
				return visit_Variable(node);
			case 'Function':
				return visit_Function(node);
		}
		buildErrors.push('Failed to build node ' + node.name);
		return calcError(buildErrors);
	}
	
	function visit_Function(node){
		switch(node.value.toUpperCase()){
			case 'SQRT':
				return oneParamNumFunc(node, Math.sqrt);
			case 'LN':
				return oneParamNumFunc(node, Math.log);
			case 'SIN':
				return oneParamNumFunc(node, Math.sin);
			case 'COS':
				return oneParamNumFunc(node, Math.cos);
			case 'TAN':
				return oneParamNumFunc(node, Math.tan);
			case 'FLOOR':
				return oneParamNumFunc(node, Math.floor);
			case 'CEILING':
				return oneParamNumFunc(node, Math.ceiling);
			case 'MAX':
				return twoParamNumFunc(node, Math.max);
			case 'MIN':
				return twoParamNumFunc(node, Math.min);
			case 'LOG':
				return oneParamNumFunc(node, Math.log10);
			case 'SUM':
				return sum(node);
			case 'ISNAN':
				return oneParamNumFunc(node, isNaN);
		}
		buildErrors.push('Unknown function: ' + node.value);
		return null;
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
		buildErrors.push('Unknown variable: ' + node.value);
		return null;
	}
	
	function visit_NumLit(node){
		return calcNum(node.value);
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
				return calcBool(!val.type);
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
					if(rhs === null){
						buildErrors.push('RHS was null');
						return null;
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
				if(rhs === null){
					buildErrors.push('RHS was null');
					return null;
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
			if(rhs === null){
				buildErrors.push('RHS was null');
				return null;
			}
			if(lhs.type === 'NUM' && rhs.type === 'NUM'){
				if(node.op === 'ADD')
					return calcNum(lhs.value + rhs.value);
				else if(node.op === 'SUB')
					return calcNum(lhs.value - rhs.value);
				else if(node.op === 'MUL')
					return calcNum(lhs.value * rhs.value);
				else if(node.op === 'DIV')
					return calcNum(lhs.value / rhs.value);
				else if(node.op === 'POW')
					return calcNum(Math.pow(lhs.value, rhs.value));
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
		}
	}
	
	function oneParamNumFunc(node, callback){
		if(node.paramList.length != 1){
			buildErrors.push(node.value + ' requires one parameter only');
			return null;
		}
		const p = visit(node.paramList[0]);
		if(p.type !== 'NUM'){
			buildErrors.push(node.value + ' requires a number');
			return null;
		}
		return calcNum(callback(p.value));
	}
	
	function twoParamNumFunc(node, callback){
		if(node.paramList.length != 2){
			buildErrors.push(node.value + ' requires two parameters only');
			return null;
		}
		const p1 = visit(node.paramList[0]);
		const p2 = visit(node.paramList[1]);
		if(p1.type !== 'NUM' || p2.type !== 'NUM'){
			buildErrors.push(node.value + ' requires two numbers');
			return null;
		}
		return calcNum(callback(p1.value, p2.value));
	}
	
	function sum(node){
		let result = 0;
		for(let i = 0; i < node.paramList.length; i++){
			const val = visit(node.paramList[i]);
			if(val.type === 'NUM'){
				result += val.value;
			}
			else{
				buildErrors.push('can only Sum numbers');
				return null;
			}
		}
		return calcNum(result);
	}
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