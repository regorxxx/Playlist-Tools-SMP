'use strict';

/* 
	Playlist Tools Menu v 0.1 23/03/21
	-----------------------------------
	Merges different playlist tools in one menu, called when pressing the button.
	If any script or plugin is missing, then the menu gets created without those entries.
	So the menu is created dynamically according to the foobar user's config.

	NOTE: 'on_mouse_lbtn_up(x, y)' is simply replaced with a button to call the menu.
 */

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\buttons_xxx.js'); 
try { //May be loaded along other buttons
	window.DefinePanel('Playlist Tools Menu', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
	var buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Playlist Tools Menu Button loaded.');
}
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\main\\playlist_tools_menu.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_properties.js');

var prefix = 'menu_';
prefix = getUniquePrefix(prefix, "_"); // Puts new ID before "_"
menu_prefix = prefix; // update var for internal use of playlist_tools_menu

var newButtonsProperties = {
	...menu_properties,
};

setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
updateMenuProperties(getPropertiesPairs(newButtonsProperties, prefix)); // Update manually the default args

var newButtons = {
	menuButton: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, "Playlist Tools", function (mask) {
		if (mask === MK_SHIFT) {
			menuAlt.btn_up(this.x, this.y + this.h);
		} else {
			menu.btn_up(this.x, this.y + this.h);
		}
		keyCallbackDate = Date.now(); // Update key checking
	}, null, g_font, menuTooltip, null, null, chars.wrench, _gdiFont('FontAwesome', 10)),
};
// Check if the button list already has the same button ID
for (var buttonName in newButtons) {
	if (buttons.hasOwnProperty(buttonName)) {
		// fb.ShowPopupMessage('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		console.log('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		Object.defineProperty(newButtons, buttonName + Object.keys(buttons).length, Object.getOwnPropertyDescriptor(newButtons, buttonName));
		delete newButtons[buttonName];
	}
}
// Adds to current buttons
buttons = {...buttons, ...newButtons};