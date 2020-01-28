function buildExample(){
	let depth = 0;
	let maxDepth = 4;
	return ex(true, true);
	
	function ex(limitParen, limitConst, limitComplex){//Weight these a bit better, and provide options like noParen or noConst
		depth++;
		const rand = Math.random();
		
		if(depth > maxDepth){
			return exNumConst();
		}
		else if (limitParen && limitConst){
			const selected = Math.floor(Math.random() * 2);
			switch(selected){
				case 0:
					return exBinOp(limitComplex);
				case 1:
					return exFunction();
			}
		}
		else if (limitParen){
			const selected = Math.floor(Math.random() * 4);
			switch(selected){
				case 0:
					return exNumConst();
				case 1:
					return exBinOp(limitComplex);
				case 2:
					return exFunction();
				case 3:
					return limitComplex ? exNumConst() : exComplexConst();
			}
		}
		else if (limitConst){
			const selected = Math.floor(Math.random() * 3);
			switch(selected){
				case 0:
					return exBinOp(limitComplex);
				case 1:
					return exParen();
				case 2:
					return exFunction();
			}
		}
		else{
			const selected = Math.floor(Math.random() * 5);
			switch(selected){
				case 0:
					return exNumConst();
				case 1:
					return exBinOp(limitComplex);
				case 2:
					return exParen();
				case 3:
					return exFunction();
				case 4:
					return limitComplex ? exNumConst() : exComplexConst();
			}
		}
	}

	function exFunction(){
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
			return func + exParen();
		}
		else{
			func = twoParamFuncs[Math.floor(Math.random() * twoParamFuncs.length)];
			return func + '(' + ex(true, false, true) + ', ' + ex(true, false, true) + ')';
		}
		
		
	}

	function exParen(){
		return '(' + ex(true, true, false) + ')'; 
	}

	function exNumConst(){
		if(Math.random() > 0.5){//Integer
			return Math.floor(Math.random() * 100).toString();
		}
		else{//Float
			return Math.round(Math.random() * 1000) / 100;
		}
	}

	function exBinOp(limitComplex){
		const op = Math.floor(Math.random() * 5);
		switch(op){
			case 0:
				return ex(false, false, limitComplex) + ' + ' + ex(false, false, limitComplex);
			case 1:
				return ex(false, false, limitComplex) + ' - ' + ex(false, false, limitComplex);
			case 2:
				return ex(false, false, limitComplex) + ' x ' + ex(false, false, limitComplex);
			case 3:
				return ex(false, false, limitComplex) + ' / ' + ex(false, false, limitComplex);
			case 4:
				return ex(false, false, true) + ' ^ ' + ex(false, false, true);
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

