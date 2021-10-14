'use strict';
//13/10/21

/* 
	Top Tracks v 1.0 28/01/20
	Search n most played tracks on library. You can configure the number of tracks at properties panel.
	Button name and tooltip text is changed according to that value!
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\main\\top_tracks_from_date.js');
include('..\\helpers\\helpers_xxx_properties.js');
var prefix = 'tt_';

try { //May be loaded along other buttons
	window.DefinePanel('Top Tracks Button', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 120, h: 22};
	var buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Top Tracks from Date Button loaded.');
}
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	playlistLength:	['Length of playlist', 25],
	forcedQuery: 	['Forced query to pre-filter database','NOT (%rating% EQUAL 2 OR %rating% EQUAL 1)'],
};
newButtonsProperties['playlistLength'].push({greater: 0, func: isInt}, newButtonsProperties['playlistLength'][1]);
newButtonsProperties['forcedQuery'].push({func: (query) => {return checkQuery(query, true);}}, newButtonsProperties['forcedQuery'][1]);

setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix));

// we change the default coordinates here to accommodate text
if (buttonOrientation === 'x') {buttonCoordinates.w += 30;}

var newButtons  = {
    TopTracks: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, 'Top ' + getProperties(newButtonsProperties, prefix)['playlistLength'] + ' Tracks ' + (new Date().getFullYear() - 1), function () {
		let t0 = Date.now();
		let t1 = 0;
		const [playlistLength, forcedQuery] = getPropertiesValues(this.buttonsProperties, this.prefix); //This gets all the panel properties at once
		do_top_tracks_from_date({playlistLength: Number(playlistLength), forcedQuery, year: new Date().getFullYear() - 1});
		t1 = Date.now();
		console.log('Call to do_top_tracks took ' + (t1 - t0) + ' milliseconds.');
	}, null, g_font,'Playlist with ' + getProperties(newButtonsProperties, prefix)['playlistLength'] + ' Tracks most played (without duplicates) from ' + (new Date().getFullYear() - 1) + '.\nFiltered with: ' + getProperties(newButtonsProperties, prefix)['forcedQuery'], prefix, newButtonsProperties, chars.calendar),
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