'use strict';
//04/01/24

/*
	-> EDIT
 */

// Adjust paths as needed
include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\buttons_xxx.js');
/* global addButton:readable, ThemedButton:readable, getUniquePrefix:readable */
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesValues:readable */
include('..\\..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable */
var prefix = 'EDIT'; // NOSONAR[global]

try { window.DefinePanel('EDIT', { author: 'xxx' }); } catch (e) { console.log('Remove EDIT loaded.'); }  //May be loaded along other buttons
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

//You can simply add new properties here
var newButtonsProperties = {  // NOSONAR[global]
	EDIT: ['EDIT', 0],
};
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once

addButton({
	OneButton: new ThemedButton({ x: 0, y: 0, w: 98, h: 22 }, 'EDIT', function () {
		let t0 = Date.now();
		let t1 = 0;
		let [EDIT] = getPropertiesValues(this.buttonsProperties, this.prefix); // This gets all the panel properties at once
		console.log(EDIT); // DEBUG
		t1 = Date.now();
		console.log('Call to EDIT took ' + (t1 - t0) + ' milliseconds.');
	}, null, _gdiFont('Segoe UI', 12), 'EDIT', prefix, newButtonsProperties),
});