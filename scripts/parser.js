function parser(line){
	let tokenIndex = 0;
	const tokens = beginLex(line);
	let currentToken = tokens.length > 0 ? tokens[tokenIndex] : null;
	const errors = [];
	
	return level_4();
	
	function eat(type){
		if(currentToken.type === type){
			tokenIndex++;
			currentToken = tokens[tokenIndex];
		}
		else{
			errors.push('Expected ' + type + ' but saw ' + currentToken.type);
		}
	}
	
	function level_1(){
		const token = currentToken;
		if(token.type === 'ADD'){
			eat('ADD');
			return unaryOp(level_1(), token);
		}
		else if(token.type === 'SUB'){
			eat('SUB');
			return unaryOp(level_1(), token);
		}
		else if(token.type === 'NOT'){
			eat('NOT');
			return unaryOp(level_1(), token);
		}
		else if(token.type === 'NUM'){
			eat('NUM');
			return numLit(token);
		}
		else if (token.type === 'LPAREN'){
			Eat('LPAREN');
			const node = level_4();//Should be about level_10
			Eat('RPAREN');
			return node;
		}
		else if(token.type === 'ID'){
			return functionOrVariable();
		}
		errors.push('Unexpected token ' + token.type);
		return noOp();
	}
	
	function level_2(){
		let node = level_1();
		while(currentToken.type === 'POW'){
			const token = currentToken;
			eat('POW');
			
			node = binOp(node, level_1(), token);
		}
		return node;
	}
	
	function level_3(){
		let node = level_2();
		while (currentToken.type === 'MUL' || currentToken.type === 'DIV' || currentToken.type === 'MOD'){
			const token = currentToken;
			if(currentToken.type === 'MUL')
				eat('MUL');
			if(currentToken.type === 'DIV')
				eat('DIV');
			if(currentToken.type === 'MOD')
				eat('MOD');
			
			node = binOp(node, level_2(), token);
		}
		return node;
	}
	
	function level_4(){
		let node = level_3();
		while (currentToken.type === 'ADD' || currentToken.type === 'SUB'){
			const token = currentToken;
			if(currentToken.type === 'ADD')
				eat('ADD');
			if(currentToken.type === 'SUB')
				eat('SUB');
			
			node = binOp(node, level_3(), token);
		}
		return node;
	}
	
	function functionOrVariable(){
		alert('oh no!');//This is really great error handling...
	}
}