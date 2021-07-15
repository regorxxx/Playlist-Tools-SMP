'use strict';

include('helpers_xxx.js');

var macros = [
];
let currListener = null;

function initMacro(menu) { // Linked to some menu object by Menu-Framework-SMP
	let name;
	let entry = [];
	try {name = utils.InputBox(window.ID, 'Enter name', window.Name, 'My macro', true);}
	catch (e) {return;}
	if (!name.length) {return;}
	if (macros.findIndex((macro) => {return macro.name === name;}) !== -1) {
		fb.ShowPopupMessage('Already exists a macro with same name', scriptName); 
		return;
	}
	macros.push({name, entry});
	menu.lastCall = '';
	currListener = listener(menu, name);
	return macros[macros.length -1];
}

function saveMacro() {
	clearInterval(currListener);
	currListener = null;
	return macros[macros.length -1];
}

const listener = repeatFn((menu, name) => {
	const selMacro = macros.find((macro) => {return macro.name === name;});
	if (!selMacro) {clearInterval(currListener); return;} // Safety check
	if (menu.lastCall.length) {
		selMacro.entry.push(menu.lastCall);
		menu.lastCall = '';
	}
}, 100); 
