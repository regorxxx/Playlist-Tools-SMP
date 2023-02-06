'use strict';
//05/02/23

function _createSubMenuEditEntries(parent, menuName, options /*{name, list, defaults, input, bAdd}*/) {
	// options.list always point to the original entry list and original values are edited
	const subMenuSecondName = parent.newMenu('Edit entries from list...' + nextId('invisible', true, false), menuName);
	options.list.forEach( (entry, index) => {
		const entryName = (entry.name === 'sep' ? '------(separator)------' : (entry.name.length > 40 ? entry.name.substring(0,40) + ' ...' : entry.name));
		const subMenuThirdName = parent.newMenu(entryName + nextId('invisible', true, false), subMenuSecondName);
		parent.newEntry({menuName: subMenuThirdName, entryText: 'Edit entry...', func: () => {
			const oriEntry = JSON.stringify(entry);
			let newEntry = oriEntry;
			try {newEntry = utils.InputBox(window.ID, 'Edit entry as JSON:', scriptName + ': ' + options.name, oriEntry, true);}
			catch (e) {return;}
			if (newEntry === oriEntry) {return;}
			if (!newEntry || !newEntry.length) {fb.ShowPopupMessage('Input: ' + newEntry + '\n\nNon valid entry.', 'JSON error'); return;}
			try {newEntry = JSON.parse(newEntry);} catch (e) {fb.ShowPopupMessage('Input: ' + newEntry.toString() + '\n\n' + e, 'JSON error'); return;}
			if (!newEntry) {return;}
			options.list[index] = newEntry;
			return options.list;
		}});
		parent.newEntry({menuName: subMenuThirdName, entryText: 'Move entry...', func: () => {
			let pos = 1;
			try {pos = Number(utils.InputBox(window.ID, 'Move up X indexes (negative is down):\n', scriptName + ': ' + options.name, pos, true));} 
			catch (e) {return;}
			if (pos === 0 || !Number.isSafeInteger(pos)) {return;}
			if (index - pos < 0) {pos = 0;}
			else if (index - pos >= options.list.length) {pos = options.list.length;}
			else {pos = index - pos;}
			options.list.splice(pos, 0, options.list.splice(index, 1)[0]);
			return options.list;
		}});
		parent.newEntry({menuName: subMenuThirdName, entryText: 'sep'});
		parent.newEntry({menuName: subMenuThirdName, entryText: 'Remove entry', func: () => {
			options.list.splice(index, 1);
			return options.list;
		}});
	});
	if (!options.list.length) {parent.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
	parent.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
	if (!options.hasOwnProperty('bAdd') || options.bAdd) {
		parent.newEntry({menuName: subMenuSecondName, entryText: 'Add new entry to list...' , func: () => {
			// Input all variables
			let input;
			let entryName = '';
			try {entryName = utils.InputBox(window.ID, 'Enter name for menu entry\nWrite \'sep\' to add a line.', scriptName + ': ' + options.name, '', true);}
			catch (e) {return;}
			if (!entryName.length) {return;}
			if (entryName === 'sep') {input = {name: entryName};} // Add separator
			else { // or new entry
				const entry = options.input();
				if (!entry) {return;}
				input = {name: entryName, ...entry}
			}
			// Add entry
			options.list.push(input);
			return options.list;
		}});
	}
	parent.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
	parent.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults...', func: () => {
		options.list.length = 0;
		clone(options.defaults).forEach(e => options.list.push(e));
		return options.list;
	}});
}