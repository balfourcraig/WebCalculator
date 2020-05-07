function buildExample(type){
	let depth = 0;
	let maxDepth = 4;
	
	if(type === 'NUM'){
		return exNum(true, true);
	}
	else if (type === 'BOOL'){
		return exBoolean(true, true);
	}
	else{
		return 'ERROR';
	}
	
	function exBoolean(limitParen, limitConst){
		depth++;
		
		if(depth > maxDepth){
			return exBoolConst();
		}
		
		else if (limitParen && limitConst){
			const selected = Math.floor(Math.random() * 1);
			switch(selected){
				case 0:
					return exBinOpBool();
			}
		}
		else if (limitParen){
			const selected = Math.floor(Math.random() * 2);
			switch(selected){
				case 0:
					return exBinOpBool();
				case 1:
					return exBoolConst();
			}
		}
		else if (limitConst){
			const selected = Math.floor(Math.random() * 2);
			switch(selected){
				case 0:
					exBinOpBool();
				case 1:
					return exParenBool();
			}
		}
		else{
			const selected = Math.floor(Math.random() * 3);
			switch(selected){
				case 0:
					return exBinOpBool();
				case 1:
					return exBoolConst();
				case 2:
					return exParenBool();
			}
		}
	}
	
	function exNum(limitParen, limitConst, limitComplex){
		depth++;
		
		if(depth > maxDepth){
			return exNumConst();
		}
		else if (limitParen && limitConst){
			const selected = Math.floor(Math.random() * 4);
			switch(selected){
				case 0:
					return exBinOpNum(limitComplex);
				case 1:
					return exBinOpNum(limitComplex);
				case 2:
					return exBinOpNum(limitComplex);
				case 3:
					return exNumFunction();
			}
		}
		else if (limitParen){
			const selected = Math.floor(Math.random() * 5);
			switch(selected){
				case 0:
					return exNumConst();
				case 1:
					return exBinOpNum(limitComplex);
				case 2:
					return exBinOpNum(limitComplex);
				case 3:
					return exNumFunction();
				case 4:
					return limitComplex ? exNumConst() : exComplexConst();
				case 5:
					return exNumVariable();
			}
		}
		else if (limitConst){
			const selected = Math.floor(Math.random() * 5);
			switch(selected){
				case 0:
					return exBinOpNum(limitComplex);
				case 1:
					return exBinOpNum(limitComplex);
				case 2:
					return exBinOpNum(limitComplex);
				case 3:
					return exParenNum();
				case 4:
					return exNumFunction();
			}
		}
		else{
			const selected = Math.floor(Math.random() * 8);
			switch(selected){
				case 0:
					return exNumConst();
				case 1:
					return exBinOpNum(limitComplex);
				case 2:
					return exBinOpNum(limitComplex);
				case 3:
					return exBinOpNum(limitComplex);
				case 4:
					return exParenNum();
				case 5:
					return exNumFunction();
				case 6:
					return limitComplex ? exNumConst() : exComplexConst();
				case 7:
					return exNumVariable();
			}
		}
	}

	function exNumFunction(){
		const oneParamFuncs = [
			'Sqrt',
			'Ln',
			'abs',
			'Sin',
			'Cos',
			'Tan',
			'aSin',
			'aCos',
			'aTan',
			'floor',
			'ceiling',
			'Log',
			'round'
		];
		const twoParamFuncs = [
			'max',
			'min',
			'sum',
			'random',
		];
		
		let func = '';
		if(Math.random() > 0.7){//One param
			func = oneParamFuncs[Math.floor(Math.random() * oneParamFuncs.length)];
			return func + exParenNum();
		}
		else{
			func = twoParamFuncs[Math.floor(Math.random() * twoParamFuncs.length)];
			return func + '(' + exNum(true, false, true) + ', ' + exNum(true, false, true) + ')';
		}
	}
	
	function exNumVariable(){
		const variables = [
			'PI',
			'Infinity',
			'NegativeInfinity',
			'e',
			'Phi',
			'g',
			'c',
			'Random'
		];
		return variables[Math.floor(Math.random() * variables.length)];
	}

	function exParenNum(){
		return '(' + exNum(true, true, false) + ')'; 
	}
	
	function exParenBool(){
		return '(' + exBoolean(true, true) + ')'; 
	}

	function exNumConst(){
		if(Math.random() > 0.5){//Integer
			return Math.floor(Math.random() * 100).toString();
		}
		else{//Float
			return Math.round(Math.random() * 1000) / 100;
		}
	}
	
	function exBoolConst(){
		return Math.random() > 0.5 ? 'True' : 'False';
	}

	function exBinOpNum(limitComplex){
		const op = Math.floor(Math.random() * 5);
		switch(op){
			case 0:
				return exNum(false, false, limitComplex) + ' + ' + exNum(false, false, limitComplex);
			case 1:
				return exNum(false, false, limitComplex) + ' - ' + exNum(false, false, limitComplex);
			case 2:
				return exNum(false, false, limitComplex) + ' x ' + exNum(false, false, limitComplex);
			case 3:
				return exNum(false, false, limitComplex) + ' / ' + exNum(false, false, limitComplex);
			case 4:
				return exNum(false, false, true) + ' ^ ' + exNum(false, false, true);
		}
	}
	
	function exBinOpBool(){
		const op = Math.floor(Math.random() * 5);
		switch(op){
			case 0:
				return exBoolean(false, false) + ' && ' + exBoolean(false, false);
			case 1:
				return exBoolean(false, false) + ' || ' + exBoolean(false, false);
			case 2:
				return exBoolean(false, false) + ' XOR ' + exBoolean(false, false);
			case 3:
				return exBoolean(false, false) + ' AND ' + exBoolean(false, false);
			case 4:
				return exBoolean(false, false) + ' OR ' + exBoolean(false, false);
		}
	}
	
	function exComplexConst(){
		if(Math.random() > 0.5){//compound
			return '(' + exNumConst() + (Math.random() > 0.5 ? ' + ' : ' - ') + exNumConst() + 'i)';
		}
		else{//complex only
			return exNumConst() + 'i';
		}
	}
}

