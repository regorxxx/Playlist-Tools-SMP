'use strict';

/* 
	Playlist History
	----------------
	Switch to previous playlists.
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');
try { //May be loaded along other buttons
	window.DefinePanel('Playlist Tools Macros', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
	var buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Playlist Tools Macros (CUSTOM) Button loaded.');
}

var prefix = "mac_";
prefix = getUniquePrefix(prefix, "_"); // Puts new ID before "_"
var newButtonsProperties = { //You can simply add new properties here
	customName: ['Name for the custom UI button', 'Customize!'],
	macro: 		['Macro entry', ''],
};
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix));
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix); // And retrieve

var newButtons = {
	menuButton: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, newButtonsProperties.customName[1], function (mask) {
		if (isPlaylistToolsLoaded()) {
			if (mask === MK_SHIFT) {
				const configMenu = new _menu();
				const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
				configMenu.newCondEntry({entryText: 'Macros', condFunc: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					let propMacros = JSON.parse(args.properties['macros'][1]);
					if (!macros.length && propMacros.length) {macros = propMacros;} // Restore macros list on first init
					configMenu.newEntry({entryText: 'Execute macros:', func: null, flags: MF_GRAYED});
					configMenu.newEntry({entryText: 'sep'});
					configMenu.newEntry({entryText: 'None', func: () => {
						this.buttonsProperties['macro'][1] = '';
						overwriteProperties(this.buttonsProperties);
					}});
					configMenu.newEntry({entryText: 'sep'});
					// List
					propMacros.forEach((macro) => {
						if (macro.name === 'sep') { // Create separators
							configMenu.newEntry({entryText: 'sep'});
						} else {
							configMenu.newEntry({entryText: macro.name, func: () => {
								macro.entry.forEach( (entry, idx, arr) => {
									this.buttonsProperties['macro'][1] = 'Macros\\' + macro.name;
									overwriteProperties(this.buttonsProperties); // Force overwriting
								});
							}});
						}
					});
					const options = propMacros.map((item) => {return item.name;}).filter((item) => {return item !== 'sep';})
					configMenu.newCheckMenu(configMenu.getMainMenuName(), 'None', options[options.length - 1], () => {
						const name = this.buttonsProperties['macro'][1].replace('Macros\\','');
						const idx = options.indexOf(name);
						return idx !== -1 ? idx + 1 : 0;
					});
					if (!propMacros.length) {configMenu.newEntry({entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
				}});
				configMenu.btn_up(this.x, this.y + this.h);
			} else {
				if (this.buttonsProperties['customName'][1] === 'Customize!') {
					const newName = utils.InputBox(window.ID, 'Enter button name. Then configure macro associated to your liking.', window.Name + ': Customizable Playlist Tools Macro Button');
					if (!newName.length) {
						return;
					} else {
						this.buttonsProperties.customName[1] = newName;
						overwriteProperties(this.buttonsProperties); // Force overwriting
						this.text = newName;
					}
				} else if (this.buttonsProperties['macro'][1].length) {
					menu.btn_up(void(0), void(0), void(0), this.buttonsProperties['macro'][1]); // Don't clear menu on last call
				}
			}
		} else {fb.ShowPopupMessage('WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS.', 'Playlist Tools');}
	}, null, g_font, (parent) => {return isPlaylistToolsLoaded() ? 'Executes Playlist Tools Menu assigned macros:\n' + (parent.buttonsProperties.macro[1] || '-None-') + '\n(L. Click to execute macro)\n(Shift + L. Click to configure macro)' : 'WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS.';}, null, newButtonsProperties, chars.hourglass),
};
// Check if the button list already has the same button ID
for (var buttonName in newButtons) {
	if (buttons.hasOwnProperty(buttonName)) {
		// fb.ShowPopupMessage('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		// console.log('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		Object.defineProperty(newButtons, buttonName + Object.keys(buttons).length, Object.getOwnPropertyDescriptor(newButtons, buttonName));
		delete newButtons[buttonName];
	}
}
// Adds to current buttons
buttons = {...buttons, ...newButtons};

// Helpers
function isPlaylistToolsLoaded() {return (typeof specialMenu !== 'undefined' && typeof configMenu !== 'undefined' && typeof scriptName !== 'undefined' && typeof menu !== 'undefined');}