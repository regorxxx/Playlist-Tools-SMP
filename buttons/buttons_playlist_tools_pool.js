'use strict';
//13/10/21

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
	var buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Playlist Tools Pools Button loaded.');
}

buttonsBar.list.push({});

var newButtons = {
	menuButton: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, "Pools", function (mask) {
		if (isPlaylistToolsLoaded()) {
			const configMenu = new _menu();
			const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
			configMenu.newCondEntry({entryText: 'Pools', condFunc: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1](), 0); // Update properties from the panel. Note () call on second arg
				let propPools = JSON.parse(args.properties['pools'][1]);
				configMenu.newEntry({entryText: 'Playlist creation:', func: null, flags: MF_GRAYED});
				configMenu.newEntry({entryText: 'sep'});
				// List
				propPools.forEach((pool) => {
					if (pool.name === 'sep') { // Create separators
						configMenu.newEntry({entryText: 'sep'});
					} else {
						configMenu.newEntry({entryText: pool.name, func: () => {
							menu.btn_up(void(0), void(0), void(0), 'Pools\\' + pool.name); // Don't clear menu on last call
						}});
					}
				});
				if (!propPools.length) {configMenu.newEntry({entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
			}});
			configMenu.btn_up(this.x, this.y + this.h);
		} else {fb.ShowPopupMessage('WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS.', 'Playlist Tools');}
	}, null, g_font, () => {return isPlaylistToolsLoaded() ? 'Executes Playlist Tools Menu pool.\n(L. Click to show list)' : 'WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS.';}, null, null, chars.music),
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