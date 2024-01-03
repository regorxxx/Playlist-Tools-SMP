'use strict';
//03/01/24

// Adjust paths as needed
include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable */
// include('EDIT.js');
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesValues:readable */
var prefix = 'EDIT'; // NOSONAR[global]

//Always loaded along other buttons and panel
include('..\\..\\helpers\\buttons_panel_xxx.js');
/* global buttonsPanel:readable, addButton:readable, ThemedButton:readable, getUniquePrefix:readable, calcNextButtonCoordinates:readable, on_paint_buttn:readable */
var buttonCoordinates = { x: 0, y: window.Height - 22, w: 98, h: 22 }; // NOSONAR[global]
buttonsPanel.config.orientation = 'x';

prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

//You can simply add new properties here
var newButtonsProperties = { // NOSONAR[global]
	EDIT: ['EDIT', 0],
};
// newButtonsProperties = {...defaultProperties, ...newButtonsProperties}; // Add default properties at the beginning to be sure they work
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once

addButton({
	OneButton: new ThemedButton(calcNextButtonCoordinates(buttonCoordinates, buttonsPanel.config.orientation).x, calcNextButtonCoordinates(buttonCoordinates, buttonsPanel.config.orientation, false).y, buttonCoordinates.w, buttonCoordinates.h, 'EDIT', function () {
		let t0 = Date.now();
		let t1 = 0;
		let [EDIT] = getPropertiesValues(this.buttonsProperties, this.prefix); // This gets all the panel properties at once
		console.log(EDIT);
		t1 = Date.now();
		console.log('Call to EDIT took ' + (t1 - t0) + ' milliseconds.');
	}, null, _gdiFont('Segoe UI', 12), 'EDIT', prefix, newButtonsProperties),
});

// Drawing must be integrated on main script calling the helper
if (on_paint) {
	const oldFunc = on_paint;
	on_paint = function (gr) {
		oldFunc(gr);
		on_paint_buttn(gr);
	};
} else { var on_paint = on_paint_buttn; } // eslint-disable-line no-redeclare