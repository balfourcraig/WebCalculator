let parseErrors = [];

function parser(line){
	let tokenIndex = 0;
	const tokens = beginLex(line);
	let currentToken = tokens.length > 0 ? tokens[tokenIndex] : null;
	parseErrors = [];
	
	const root = level_9();
	if(tokenIndex < tokens.length -1){
		parseErrors.push('Multiple statements detected.');
	}
	return root;
	
	function eat(type){
		if(currentToken.type === type){
			tokenIndex++;
			currentToken = tokens[tokenIndex];
		}
		else{
			parseErrors.push('Expected ' + type + ' but saw ' + currentToken.type);
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
		else if(token.type === 'HEXNUM'){
			eat('HEXNUM');
			return numLitHEX(token);
		}
		else if(token.type === 'BINNUM'){
			eat('BINNUM');
			return numLitBIN(token);
		}
		else if (token.type === 'LPAREN'){
			eat('LPAREN');
			const node = level_9();
			eat('RPAREN');
			return node;
		}
		else if(token.type === 'ID'){
			return functionOrVariable();
		}
		parseErrors.push('Unexpected token ' + token.type);
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
	
	function level_5(){
		let node = level_4();
		while(currentToken.type === 'GREATER' || currentToken.type === 'GREATEREQ' ||currentToken.type === 'LESS' ||currentToken.type === 'LESSEQ'){
			const token = currentToken;
			eat(token.type);
			node = binOp(node, level_4(), token);
		}
		return node;
	}
	
	function level_6(){
		let node = level_5();
		while(currentToken.type === 'EQ' || currentToken.type === 'NOTEQ'){
			const token = currentToken;
			eat(token.type);
			
			node = binOp(node, level_5(), token);
		}
		return node;
	}
	
	function level_7(){
		let node = level_6();
		while (currentToken.type === 'AND'){
			const token = currentToken;
			eat(token.type);
			node = binOp(node, level_6(), token);
		}
		return node;
	}
	
	function level_8(){
		let node = level_7();
		while (currentToken.type === 'XOR'){
			const token = currentToken;
			eat(token.type);
			node = binOp(node, level_7(), token);
		}
		return node;
	}
	
	function level_9(){
		let node = level_8();
		while (currentToken.type === 'OR'){
			const token = currentToken;
			eat(token.type);
			node = binOp(node, level_8(), token);
		}
		return node;
	}
	
	function functionOrVariable(){
		const token = currentToken;
		eat('ID');
		if(currentToken.type == 'LPAREN'){
			eat('LPAREN');
			const paramList = [];
			if(currentToken.type !== 'RPAREN'){
				paramList.push(level_9());
				while(currentToken.type === 'COMMA'){
					eat('COMMA');
					paramList.push(level_9());
				}
			}
			eat('RPAREN');
			return func(token, paramList);
		}
		return variable(token);
	}
}