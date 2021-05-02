'use strict';

/* 
	Playlist Tools Menu v 0.1 23/03/21
	-----------------------------------
	Merges different playlist tools in one menu, called when pressing the button.
	If any script or plugin is missing, then the menu gets created without those entries.
	So the menu is created dynamically according to the foobar user's config.
	
	Currently contains pre-defined use-cases for these scripts:
	- Most played tracks from...
		.\xxx-scripts\top_tracks.js
		.\xxx-scripts\top_tracks_from_date.js
	- Top Rated tracks from..
		.\xxx-scripts\top_rated_tracks.js
	- Same by...
		.\xxx-scripts\search_same_by.js
	- Similar by... 
		.\xxx-scripts\search_bydistance.js
	- Special Playlists... (contains functionality from the other scripts)
		.\xxx-scripts\search_bydistance.js
		.\xxx-scripts\search_same_by.js
	- Tools...
		+ Remove duplicates
			.\xxx-scripts\remove_duplicates.js
		+ Query filtering
			.\xxx-scripts\filter_by_query.js
		+ Harmonic mix
			.\xxx-scripts\harmonic_mixing.js
		+ Sort by key
			.\xxx-scripts\sort_by_key.js
		+ Scatter by tags
			.\xxx-scripts\scatter_by_tags.js
		+ Check tags
			.\xxx-scripts\check_library_tags.js
		+ Write tags
			.\xxx-scripts\tags_automation.js
		+ Find track(s) in...
			.\xxx-scripts\find_remove_from_playlists.js
		+ Remove track(s) from...
			.\xxx-scripts\find_remove_from_playlists.js
		+ Playlist Revive
			.\xxx-scripts\playlist_revive.js
	
	NOTE: 'on_mouse_lbtn_up(x, y)' is simply replaced with a button to call the menu.
 */
 
try { //May be loaded along other buttons
	window.DefinePanel('Playlist Tools Menu', {author:'xxx'});
	include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\buttons_xxx.js');
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
	var buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Playlist Tools Menu Button loaded.');
}
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\playlist_tools_menu.js');

var prefix = 'menu_';
prefix = getUniquePrefix(prefix, "_"); // Puts new ID before "_"
menu_prefix = prefix; // update var for internal use of playlist_tools_menu

var newButtonsProperties = {
	...menu_properties,
};

setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
updateMenuProperties(getPropertiesPairs(newButtonsProperties, prefix)); // Update manually the default args

var newButtons = {
	menuButton: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, "Playlist Tools", function () {
		menu.btn_up(this.x, this.y + this.h)
	}, null, g_font, menuTooltip, null, null, '\uf149', _gdiFont('FontAwesome', 10)),
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