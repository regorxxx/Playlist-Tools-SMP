'use strict';
//13/10/21

/* 
	Search n tracks (randomly) on library with the same style(s) than the current selected track.
	You can configure the number of tracks at properties panel. Also forced query to prefilter tracks.
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\main\\search_same_style.js');
include('..\\helpers\\helpers_xxx_properties.js');
var prefix = 'sss_';

try { //May be loaded along other buttons
	window.DefinePanel('Search Same Button', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
	var buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Same Styles Button loaded.');
}
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	playlistLength: ['Max Playlist Mix length', 50],
	query: ['Forced query to filter database (added to any other internal query)', 
				'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1) AND NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi) AND %channels% LESS 3 AND NOT COMMENT HAS Quad'
				],
};
newButtonsProperties['playlistLength'].push({greater: 0, func: isInt}, newButtonsProperties['playlistLength'][1]);
newButtonsProperties['forcedQuery'].push({func: (query) => {return checkQuery(query, true);}}, newButtonsProperties['forcedQuery'][1]);

setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix));

// we change the default coordinates here to accommodate text
if (buttonOrientation === 'x') {buttonCoordinates.w -= 5;}

var newButtons = {
	SameStyles: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, 'Same Styles', function () {
		let t0 = Date.now();
		let t1 = 0;
		let [playlistLength , forcedQuery] = getPropertiesValues(this.buttonsProperties, this.prefix); //This gets all the panel properties at once
		do_search_same_style(Number(playlistLength), forcedQuery);
		t1 = Date.now();
		console.log('Call to do_search_same_style took ' + (t1 - t0) + ' milliseconds.');
	}, null, g_font,'Random playlist matching the style(s) of the current selected track', prefix, newButtonsProperties, chars.link),
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
