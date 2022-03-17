'use strict';
//16/03/22

include('menu_xxx.js');
include('helpers_xxx_properties.js')

function settingsMenu(parent, bShowValues = false) {
	const menu = new _menu();
	const properties = parent.buttonsProperties;
	const parentName = _isFunction(parent.text) ? parent.text(parent) : parent.text;
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
	return menu;
}