function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
}

function applyURLParameters(){
	const urlVars = getUrlVars();
	if(urlVars['calc']){
		document.getElementById('calcInput').value = urlVars['calc'];
	}
}

function calc(){
	const numFormat = document.getElementById('numFormatSelect').value;
	const formatWarning = document.getElementById('formatWarning');
	if(numFormat === 'bin')
		formatWarning.innerText = ' WARNING: Binary mode is a bit odd with fractinal values, and doesn\'t work with complex';
	else if(numFormat === 'hex')
		formatWarning.innerText = ' WARNING: Hex mode is a bit odd with fractinal values, and doesn\'t work with complex';
	else
		formatWarning.innerText = '';


	const output = document.getElementById('calcOutput');
	output.innerHTML = '&nbsp;';
	output.removeAttribute('class');
	const input = document.getElementById('calcInput').value;
	const errorList = document.getElementById('calcErrors');
	errorList.innerHTML = '';
	const useRational = document.getElementById('useRationalInput').checked;
	
	if(input){
		const calculatorOutput = calculator(input, useRational);
		const result = calculatorOutput.result;
		const errors = calculatorOutput.errors;
		
		output.setAttribute('class', result.type.toLowerCase());
		if(result.type == 'ERROR'){
			output.innerText = 'Invalid or incomplete equation';
			// for(let i = 0; i < result.value.length; i++){
			// 	const li = document.createElement('li');
			// 	li.setAttribute('class', result.type.toLowerCase());
			// 	li.innerText = 'ERROR: ' + result.value[i];
			// 	errorList.appendChild(li);
			// }
		}
		else{
			if(result.type === 'NUM'){
				if(result.value === Infinity){
					output.innerText = 'Result too large to represent (IEEE Infinity)';
				}
				else if(result.value === Infinity){
					output.innerText = 'Result too negative to represent (IEEE -Infinity)';
				}
				else if(numFormat == 'dec'){
					output.innerText = result.value.toString();
				}
				else{
					let compressed;
					let formatted;
					
					if (numFormat == 'bin'){
						compressed = result.value.toString(2);
						formatted = '0b_';
					}
					else{
						compressed = result.value.toString(16).toUpperCase();
						formatted = '0x_';
					}
					if(isNaN(result.value)){
						output.innerText = formatted + compressed;
					}
					
					else{
						for(let i = compressed.length; i % 4 != 0; i++){
							formatted += '0';
						}
						for(let i = 0; i < compressed.length; i++){
							if(i > 0 && (i + (4 - compressed.length) % 4) % 4 === 0){
								formatted += '_';
							}
							formatted += compressed[i];
						}
						output.innerText = formatted;
					}
					
				}
			}
			else if (result.type === 'RATIONAL'){
				let formatted = '';
				if(result.den === 0){
					formatted = 'Undefined (Div0)';
				}
				else if(result.num === 0){
					formatted = '0';
				}
				else{
					//TODO: format negative nicely
					formatted = result.num + '/' + result.den;
				}
				output.innerText = formatted;
			}
			else if (result.type === 'COMPLEX'){
				let formatted = '';
				if(result.real != 0){
					formatted += result.real;
					if(result.imaginary >= 0)
						formatted += ' + ';
					else
						formatted += ' - ';
				}
				else if (result.imaginary < 0)
					formatted += '-';
					
				
				if(result.imaginary !== 1 && result.imaginary !== -1)
					formatted += Math.abs(result.imaginary);
				formatted += 'i';
					
				output.innerText = formatted;
			}
			else if (result.type === 'VOID'){
				output.innerHTML = '&nbsp;';
			}
			else{
				output.innerText = result.value.toString();
			}
		}
		for(let e of errors){
			const li = document.createElement('li');
			li.classList.add(e.type.toLowerCase());
			li.classList.add(e.severety.toLowerCase());
			li.innerText = e.type.toUpperCase() + ': ' + e.value;
			errorList.appendChild(li);
		}
		
	}
}

window.addEventListener('DOMContentLoaded', () => {
	applyURLParameters();
	
	calc();
	
	document.getElementById('calcInput').addEventListener('input', calc);
	document.getElementById('numFormatSelect').addEventListener('change',calc);
	document.getElementById('useRationalInput').addEventListener('change',calc);
	document.getElementById('exampleNumBtn').addEventListener('click', () => {
		document.getElementById('calcInput').value = buildExample('NUM');
		calc();
	});
	document.getElementById('exampleBoolBtn').addEventListener('click', () => {
		document.getElementById('calcInput').value = buildExample('BOOL');
		calc();
	});
	//document.getElementById('calcBtn').addEventListener('click',calc);
});