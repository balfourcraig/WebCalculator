let parseErrors = [];
let parseWarnings = [];

function parser(line, useRational){
	if(useRational == undefined)
		useRational = false;
	let tokenIndex = 0;
	const tokens = beginLex(line);
	let currentToken = tokens.length > 0 ? tokens[tokenIndex] : null;
	parseErrors = [];
	parseWarnings = [];
	
	const root = level_9();
	if(tokenIndex < tokens.length -1){
		parseWarnings.push('Multiple statements detected. Are you missing an operator? Or Have ended with a =?. Only first statement is evaluated');
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
			if(currentToken.type === 'RPAREN')
				eat('RPAREN');
			return node;
		}
		else if(token.type === 'ABS'){
			eat('ABS');
			const node = level_9();
			if(currentToken.type === 'ABS')
				eat('ABS');
			return absBlock(node);
		}
		else if(token.type === 'ID'){
			return functionOrVariable();
		}
		else if (token.type === 'COMPLEX'){
			eat('COMPLEX');
			return complexComponent(token);
		}
		else if (token.type === 'NAN'){
			eat('NAN');
			return numLit(token);
		}
		if(token.type === 'EOF')
			parseWarnings.push('Incomplete equation');
		else
			parseWarnings.push('Unexpected token ' + token.type);
		return noOp();
	}
	
	function level_2(){
		let node = level_1();
		if(currentToken.type === 'NOT'){
			console.log('postfix');
			const token = currentToken;
			eat('NOT');
			
			node = postfixOp(node, token);
		}
		return node;
	}
	
	function level_3(){
		let node = level_2();
		while(currentToken.type === 'POW'){
			const token = currentToken;
			eat('POW');
			
			node = binOp(node, level_2(), token);
		}
		return node;
	}
	
	function level_4_R(){
		let node = level_3();
		if(useRational){
			while (currentToken.type === 'DIV'){
				const token = currentToken;
				eat(token.type);
				node = rational(node, level_3());
			}
		}
		return node;
	}
	
	function level_4(){
		let node = level_4_R();
		while (currentToken.type === 'MUL' || (!useRational && currentToken.type === 'DIV') || currentToken.type === 'MOD'){
			const token = currentToken;
			eat(token.type);
			node = binOp(node, level_4_R(), token);
		}
		return node;
	}
	
	function level_5(){
		let node = level_4();
		while (currentToken.type === 'ADD' || currentToken.type === 'SUB'){
			const token = currentToken;
			eat(token.type);
			
			node = binOp(node, level_4(), token);
		}
		return node;
	}
	
	function level_6(){
		let node = level_5();
		while(currentToken.type === 'GREATER' || currentToken.type === 'GREATEREQ' ||currentToken.type === 'LESS' ||currentToken.type === 'LESSEQ'){
			const token = currentToken;
			eat(token.type);
			node = binOp(node, level_5(), token);
		}
		return node;
	}
	
	function level_7(){
		let node = level_6();
		while(currentToken.type === 'EQ' || currentToken.type === 'NOTEQ'){
			const token = currentToken;
			eat(token.type);
			
			node = binOp(node, level_6(), token);
		}
		return node;
	}
	
	function level_8(){
		let node = level_7();
		while (currentToken.type === 'AND'){
			const token = currentToken;
			eat(token.type);
			node = binOp(node, level_7(), token);
		}
		return node;
	}
	
	function level_9(){
		let node = level_8();
		while (currentToken.type === 'XOR'){
			const token = currentToken;
			eat(token.type);
			node = binOp(node, level_8(), token);
		}
		return node;
	}
	
	function level_10(){
		let node = level_9();
		while (currentToken.type === 'OR'){
			const token = currentToken;
			eat(token.type);
			node = binOp(node, level_9(), token);
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
				paramList.push(level_10());
				while(currentToken.type === 'COMMA'){
					eat('COMMA');
					paramList.push(level_10());
				}
			}
			if(currentToken.type === 'RPAREN')
				eat('RPAREN');
			return func(token, paramList);
		}
		return variable(token);
	}
}