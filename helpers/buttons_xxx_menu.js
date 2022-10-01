'use strict';
//22/03/22

include('menu_xxx.js');
include('helpers_xxx_properties.js')
include('helpers_xxx_file.js');

function settingsMenu(parent, bShowValues = false, readmeFiles = []) {
	const menu = new _menu();
	const properties = parent.buttonsProperties;
	const parentName = isFunction(parent.text) ? parent.text(parent) : parent.text;
	const readmeList = readmeFiles.length && _isFile(folders.xxx + 'helpers\\readme\\buttons_list.json') ? _jsonParseFileCheck(folders.xxx + 'helpers\\readme\\buttons_list.json', 'Readme list', window.Name, utf8) : null;
	// Menu
	menu.newEntry({entryText: 'Configurate button:', func: null, flags: MF_GRAYED});
	menu.newEntry({entryText: 'sep'});
	{
		const options = Object.keys(properties);
		options.forEach((key) => {
			const value = properties[key][1];
			const entryText = properties[key][0].replace(/[A-z]*[0-9]*_*[0-9]*\./,'') + (bShowValues ? '\t[' + (typeof value === 'string' && value.length > 10 ? value.slice(0,10) + '...' : value) + ']' : '');
			menu.newEntry({entryText, func: () => {
				let input;
				switch (typeof value) {
					case 'number': {
						input;
						try {input = Number(utils.InputBox(window.ID, 'Enter number:', parentName, value, true));}
						catch(e) {return;}
						if (isNaN(input)) {return;}
						break;
					}
					case 'string': {
						input = '';
						try {input = utils.InputBox(window.ID, 'Enter value:', parentName, value, true);}
						catch(e) {return;}
						break;
					}
				}
				if (value === input) {return;}
				properties[key][1] = input;
				overwriteProperties(properties); // Updates panel
			}});
		});
	}
	menu.newEntry({entryText: 'sep'});
	menu.newEntry({entryText: 'Restore defaults', func: () => {
		const options = Object.keys(properties);
		options.forEach((key) => {properties[key][1] = properties[key][3];});
		overwriteProperties(properties); // Updates panel
	}});
	if (readmeList) {
		menu.newEntry({entryText: 'sep'});
		if (readmeFiles.length > 1) {
			readmeFiles.forEach((name) => {
				const readmeFile = readmeList.hasOwnProperty(name) ? readmeList[name] : '';
				if (readmeFile.length) {
					menu.newEntry({entryText: readmeFile, func: () => {
						const readme = _open(folders.xxx + 'helpers\\readme\\' + readmeFile, utf8);
						if (readme.length) {fb.ShowPopupMessage(readme, readmeFile);}
						else {console.log(readmeFile + ' not found.');}
					}});
				}
			});
		} else {
			menu.newEntry({entryText: 'Readme...', func: () => {
				const readmeFile = readmeList.hasOwnProperty(readmeFiles[0]) ? readmeList[readmeFiles[0]] : '';
				const readme = readmeFile.length ? _open(folders.xxx + 'helpers\\readme\\' + readmeFile, utf8) : '';
				if (readme.length) {fb.ShowPopupMessage(readme, readmeFile);}
				else {console.log(readmeFile + ' not found.');}
			}});
		}
	}
	return menu;
}