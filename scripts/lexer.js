function beginLex(line){
	let currentChar = null;
	if(line != null && line.length > 0)
		currentChar = line[0];
	let column = 0;
	
	let lexErrors = [];
	
	const tokens = [];
	
	let t = getToken();
	while(t.type != 'EOF'){
		tokens.push(t);
		t = getToken();
	}
	tokens.push(t);
	return tokens;
	
	function advance(){
		column += 1;
		if(column < line.length)
			currentChar = line[column];
		else
			currentChar = null;
	}
	
	function peek(){
		const peekpos = column + 1;
		if(peekpos < line.length)
			return line[peekpos];
		else
			return null;
	}
	
	function id(){
		let result = '';
		
		while (currentChar != null && isLetterOrDigit(currentChar)){
			result += currentChar;
			advance();
		}
		
		const keyword = getKeyword(result);
		if(keyword === null){
			return token('ID', result);
		}
		else{
			return token(keyword, null);
		}
	}
	
	function num(){
		let result = '';
		if(currentChar === '-'){
			result += currentChar;
			advance();
		}
		while (currentChar != null && isDigit(currentChar)){
			result += currentChar;
			advance();
		}
		if(currentChar === '.' || currentChar === 'E' || currentChar === 'e'){
			if(currentChar === '.'){
				result += '.';
				advance();
				while (currentChar != null && isDigit(currentChar)){
					result += currentChar;
					advance();
				}
			}
			if(currentChar === 'E' || currentChar === 'e'){
				result += 'E';
				advance();
				if(currentChar === '-'){
					result += '-';
					advance();
				}
				while (currentChar != null && isDigit(currentChar)){
					result += currentChar;
					advance();
				}
				if(currentChar === '.'){
					result += '.';
					advance();
					while (currentChar != null && isDigit(currentChar)){
						result += currentChar;
						advance();
					}
				}
			}
		}
		return token('NUM', result);
	}
	
	function skipWhitespace(){
		while(currentChar != null && currentChar == ' ')
			advance();
	}
	
	function getToken(){
		skipWhitespace();
		if(currentChar != null){
			if(isDigit(currentChar)){
				return num();
			}
			
			const peeked = peek();
			if(peeked !== null){
				const bigramSymbol = currentChar + '' + peeked;
				const bigram = getBiGram(bigramSymbol);
				if(bigram !== null){
					advance();
					advance();
					return token(bigram, null);
				}
			}
			
			const oneGram = getOneGram(currentChar);
			if(oneGram !== null){
				advance();
				return token(oneGram, null);
			}
			
			return id();
		}
		return token('EOF', null);
	}
	
	function getNextToken(){
		if(currentChar != null){
			return getToken();
		}
		return token('EOF', null);
	}
}

function token(type, value){
	return {type: type, value: value};
}

function isDigit(c){
	return c >= '0' && c <= '9';
}

function isLetter(c){
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

function isLetterOrDigit(c){
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9');
}

function getKeyword(word){
	switch(word.toUpperCase()){
		case 'AND':
			return 'AND';
		case 'OR':
			return 'OR';
		case 'NOT':
			return 'NOT';
		case 'XOR':
			return 'XOR';
		case 'MOD':
			return 'MOD';
	}
	return null;
}

function getBiGram(bigram){
	switch(bigram.toUpperCase()){
		case '==':
			return 'EQ';
		case '!=':
			return 'NOTEQ';
		case '<=':
			return 'LESSEQ';
		case '>=':
			return 'GREATEREQ';
		case '&&':
			return 'AND';
		case '||':
			return 'OR';
	}
	return null;
}

function getOneGram(gram){
	switch(gram.toUpperCase()){
		case '=':
			return 'EQ';
		case '!':
			return 'NOT';
		case '<':
			return 'LESS';
		case '>':
			return 'GREATER';
		case '+':
			return 'ADD';
		case '-':
			return 'SUB';
		case '*':
			return 'MUL';
		case '/':
			return 'DIV';
		case '%':
			return 'MOD';
		case '^':
			return 'POW';
		case '(':
			return 'LPAREN';
		case ')':
			return 'RPAREN';
		case '|':
			return 'OR';
		case '&':
			return 'AND';
	}
	return null;
}