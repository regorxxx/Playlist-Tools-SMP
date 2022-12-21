'use strict';
//17/02/22

include('..\\..\\helpers\\helpers_xxx.js');

// include('EDIT.js');
include('..\\..\\helpers\\helpers_xxx_properties.js');
var prefix = 'EDIT';
 
//Always loaded along other buttons and panel
include('..\\..\\helpers\\buttons_panel_xxx.js');
var buttonCoordinates = {x: 0, y: window.Height - 22, w: 98, h: 22};
buttonsPanel.config.orientation = 'x';

prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	EDIT: ['EDIT', 0],
};
// newButtonsProperties = {...defaultProperties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work 
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once

addButton({
	OneButton: new themedButton(calcNextButtonCoordinates(buttonCoordinates, buttonsPanel.config.orientation).x, calcNextButtonCoordinates(buttonCoordinates, buttonsPanel.config.orientation, false).y, buttonCoordinates.w, buttonCoordinates.h, 'EDIT', function () {
		let t0 = Date.now();
		let t1 = 0;
		let [EDIT] = getPropertiesValues(this.buttonsProperties, this.prefix); // This gets all the panel properties at once
		// EDIT();
		t1 = Date.now();
		console.log('Call to EDIT took ' + (t1 - t0) + ' milliseconds.');
	}, null, _gdiFont('Segoe UI', 12), 'EDIT', prefix, newButtonsProperties),
});

// Drawing must be integrated on main script calling the helper
if (on_paint) {
	const on_paint = on_paint_buttn;
	on_paint = function(gr) {
		oldFunc(gr);
		on_paint_buttn(gr);
	};
} else {var on_paint = on_paint_buttn;}