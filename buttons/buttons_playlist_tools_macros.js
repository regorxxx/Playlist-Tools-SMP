'use strict';
//03/02/22

/* 
	Playlist History
	----------------
	Switch to previous playlists.
 */

include('..\\helpers\\buttons_xxx.js'); 
try { //May be loaded along other buttons
	window.DefinePanel('Playlist Tools Macros', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonsBar.config.buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonsBar.config.buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Playlist Tools Macros Button loaded.');
}

buttonsBar.list.push({});

var newButtons = {
	menuButton: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonsBar.config.buttonOrientation, buttonsBar.config.buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonsBar.config.buttonOrientation, buttonsBar.config.buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, 'Macros', function (mask) {
		if (isPlaylistToolsLoaded()) {
			const configMenu = new _menu();
			const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
			configMenu.newCondEntry({entryText: 'Macros', condFunc: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1](), 0); // Update properties from the panel. Note () call on second arg
				let propMacros = JSON.parse(args.properties['macros'][1]);
				if (!macros.length && propMacros.length) {macros = propMacros;} // Restore macros list on first init
				configMenu.newEntry({entryText: 'Execute macros:', func: null, flags: MF_GRAYED});
				configMenu.newEntry({entryText: 'sep'});
				// List
				propMacros.forEach((macro) => {
					if (macro.name === 'sep') { // Create separators
						configMenu.newEntry({entryText: 'sep'});
					} else {
						configMenu.newEntry({entryText: macro.name, func: () => {
							menu.btn_up(void(0), void(0), void(0), 'Macros\\' + macro.name); // Don't clear menu on last call
						}});
					}
				});
				if (!propMacros.length) {configMenu.newEntry({entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
			}});
			configMenu.btn_up(this.x, this.y + this.h);
		} else {fb.ShowPopupMessage('WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS', 'Playlist Tools');}
	}, null, g_font, () => {return isPlaylistToolsLoaded() ? 'Executes Playlist Tools Menu macros' + (getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0).bTooltipInfo[1] ? '\n-----------------------------------------------------\n(L. Click to show list)' : '') : 'WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS';}, null, null, chars.hourglass),
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