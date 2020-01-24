let lexErrors = null;

function beginLex(line){
	let currentChar = null;
	if(line != null && line.length > 0)
		currentChar = line[0];
	let column = 0;
	
	lexErrors = [];
	
	const tokens = [];
	
	let t = getToken();
	while(t.type !== 'EOF'){
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
		
		while (currentChar != null && isLetter(currentChar)){
			result += currentChar;
			advance();
		}
		if(result === ''){
			return null;
		}
		
		const keyword = getKeyword(result);
		if(keyword === null){
			return token('ID', result);
		}
		else{
			return token(keyword, null);
		}
	}
	
	function hexNum(){
		let result = '';
		advance();// 0
		advance();// x
		while (currentChar != null && isHexDigit(currentChar) || currentChar == '_'){
			if(currentChar != '_')
				result += currentChar;
			advance();
		}
		return token('HEXNUM', result);
	}
	
	function binNum(){
		let result = '';
		advance();// 0
		advance();// b
		while (currentChar == '0' || currentChar == '1' || currentChar == '_'){
			if(currentChar != '_')
				result += currentChar;
			advance();
		}
		if(currentChar !== null && isDigit(currentChar)){
			lexErrors.push('unexpected numbers in binary number');
		}
		return token('BINNUM', result);
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
		if(currentChar === 'i' || currentChar === 'I'){
			advance();
			return token('COMPLEX', result);
		}
		else
			return token('NUM', result);
	}
	
	function skipWhitespace(){
		while(currentChar != null && currentChar == ' ')
			advance();
	}
	
	function getToken(){
		skipWhitespace();
		if(currentChar != null){
			const peeked = peek();
			
			if(currentChar === '0' && peeked != null && peeked == 'x'){
				return hexNum();
			}
			
			if(currentChar === '0' && peeked != null && peeked == 'b'){
				return binNum();
			}
			
			if(isDigit(currentChar) || currentChar === '.'){
				return num();
			}
			
			
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
			const asID = id();
			if(asID)
				return asID;
		}
		if(currentChar !== null)
			lexErrors.push('Unknown symbol ' + currentChar + ' parsing stopped here');
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

function isHexDigit(c){
	return c >= '0' && c <= '9' || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
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
		case 'X':
			return 'MUL';
		case 'I':
			return 'COMPLEX';
		case 'NAN':
			return 'NAN';
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
		case '<>'://Don't really like this notation
			return 'NOTEQ';
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
		case ',':
			return 'COMMA';
	}
	return null;
}