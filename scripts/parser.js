function parser(line, useRational){
	if(useRational == undefined)
		useRational = false;
	let tokenIndex = 0;
	const lexResult = beginLex(line);
	const tokens = lexResult.tokens;
	const lexErrors = lexResult.errors;
	let currentToken = tokens.length > 0 ? tokens[tokenIndex] : null;
	const parseErrors = [];
	
	const statements = [];
	statements.push(level_10());
	let statementCount = 1;
	
	let finalTokenIndex = 0;
	let itter = 0;
	while(tokenIndex < tokens.length - 1 && itter < 20 && finalTokenIndex != tokenIndex){
		finalTokenIndex = tokenIndex;
		//root = binOp(root, level_10(), {type: 'MUL', value: 'MUL'});
		if(currentToken.type === 'SEMI'){
			eat('SEMI');
		}
		statements.push(level_10());
		statementCount++;
		itter++;
	}
	const statementsWithMult = [];
	for(let i = 0; i < statements.length; i++){
		let node = statements[i];
		while(i < statements.length -1 && statements[i].parens && statements[i+1].parens){
			node = binOp(node, statements[i+1], {type: 'MUL', value: 'MUL'});
			i++;
			statementCount--;
		}
		statementsWithMult.push(node);
	}
	if(itter == 20){
		parseErrors.push(parseError('over 20 statements detected, further statements are ignored', 'warning'));
	}
	if(currentToken.type != 'EOF'){
		parseErrors.push(parseError('Equation ended unexpededly', 'warning'));
	}
	if(statementCount > 1){
		parseErrors.push(parseError(statementCount + ' statements detected', 'warning'));
	}

	return {root: compoundStatement(...statementsWithMult), errors: parseErrors.concat(lexErrors)};
	
	function parseError(contents, severety = 'error'){
		return {type: 'parse', value: contents, severety, position: -1};
	}

	function eat(type){
		if(currentToken.type === type){
			tokenIndex++;
			currentToken = tokens[tokenIndex];
		}
		else{
			parseErrors.push(parseError('Expected ' + type + ' but saw ' + currentToken.type));
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
			const node = level_10();
			if(currentToken.type === 'RPAREN')
				eat('RPAREN');
			node.parens = true;
			return node;
		}
		else if(token.type === 'ABS'){
			eat('ABS');
			const node = level_10();
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
		else if(token.type === 'ASSIGN'){
			eat('ASSIGN');
			const assignments = [];
			const idToken = currentToken;
			eat('ID');
			eat('EQ');
			const node = level_10();
			assignments.push({id: idToken, value: node});
			while(currentToken.type === 'COMMA'){
				eat('COMMA');
				const idToken = currentToken;
				eat('ID');
				eat('EQ');
				const node = level_10();
				assignments.push({id: idToken, value: node});
			}
			return assign(assignments);
		}
		if(token.type === 'EOF')
			parseErrors.push(parseError('Incomplete equation', 'warning'));
		else
			parseErrors.push(parseError('Unexpected token ' + token.type, 'warning'));
		return noOp();
	}
	
	function level_2(){
		let node = level_1();
		if(currentToken.type === 'NOT'){
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