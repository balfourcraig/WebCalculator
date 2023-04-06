const globalVars = [
	{ name: 'pi', value: Math.PI, type: 'NUM', description: 'The ratio of a circle\'s circumference to its diameter' },
	{ name: 'e', value: Math.E, type: 'NUM', description: 'The base of the natural logarithm' },
	{ name: 'c', value: 299792458.0, type: 'NUM', description: 'The speed of light in a vacuum' },
	{ name: 'phi', value: 1.61803398874989484820458683436, type: 'NUM', description: 'The golden ratio' },
	{ name: 'g', value: 9.80665, type: 'NUM', description: 'The acceleration due to gravity' },
];

//get variables from varTable
function getVars(){
	const varTable = document.getElementById('varTable');
	const varRows = varTable.getElementsByTagName('tr');
	const vars = [];
	let errors = [];
	for(let i = 0; i < varRows.length; i++){
		if(varRows[i].getElementsByTagName('td')[0]){
			const varName = varRows[i].getElementsByTagName('td')[0].getElementsByTagName('input')[0].value;
			if(varName){
				const valResult = calculator(varRows[i].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value, false, vars);
				if(valResult.errors.length === 0){
					vars.push({ name: varName, value: valResult.result.value, type: valResult.result.type });
				}
				errors = errors.concat(valResult.errors);
			}
		}
		
	}
	return {vars, errors};
}

function addVar(id, value, description){
	const varTable = document.getElementById('varTable');
	const varRow = document.createElement('tr');
	varRow.classList.add('varRow');
	const varName = document.createElement('td');
	const varNameInp = document.createElement('input');
	varNameInp.setAttribute('type', 'text');
	if(id)
		varNameInp.setAttribute('value', id);
	varNameInp.addEventListener('input', calc);
	varName.appendChild(varNameInp);
	const varValue = document.createElement('td');
	const varValueInp = document.createElement('input');
	varValueInp.setAttribute('type', 'text');
	if(value)
		varValueInp.setAttribute('value', value);
	varValueInp.addEventListener('input', calc);
	varValue.appendChild(varValueInp);
	const varDesc = document.createElement('td');
	const varDescInp = document.createElement('input');
	varDescInp.setAttribute('type', 'text');
	if(description)
		varDescInp.setAttribute('value', description);
	varDesc.appendChild(varDescInp);
	const del = document.createElement('td');
	const delBtn = document.createElement('button');
	delBtn.innerText = '\u2716';
	delBtn.classList.add('delBtn');
	delBtn.addEventListener('click', () => {
		varTable.removeChild(varRow);
		calc();
	});
	del.appendChild(delBtn);
	varRow.appendChild(varName);
	varRow.appendChild(varValue);
	varRow.appendChild(varDesc);
	varRow.appendChild(del);
	varTable.appendChild(varRow);
}

function populateVarTable(){
	for(let i = 0; i < globalVars.length; i++){
		addVar(globalVars[i].name, globalVars[i].value, globalVars[i].description);
	}
}

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
		const vars = getVars();
		const calculatorOutput = calculator(input, useRational, vars.vars);
		const result = calculatorOutput.result;
		console.log(result)
		const errors = calculatorOutput.errors.concat(vars.errors);
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
				else if(result.value === -Infinity){
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
	populateVarTable();
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
	document.getElementById('addVarBtn').addEventListener('click', () => {
		addVar('','','');
	});
	//document.getElementById('calcBtn').addEventListener('click',calc);
});