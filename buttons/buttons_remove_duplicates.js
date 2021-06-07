'use strict';

/* 
	Removes duplicates on active playlist without changing order. It's currently set to title-artist-date, 
	that means that any track matching those will be considered a duplicate.
	
	But it can be set as a playlist filter too just by removing or adding tags. 
	You have 3 possible checks, you can delete any of them.
	i.e. Checking artist/date, effectively outputs only 1 track per year for every artist.
		
	Remove DuplicatesV3 allows a configurable number of duplicates allowed:
	number of final duplicates is always nAllowed + 1, since you allow n duplicates and the "main" copy.
	
	Tooltip texts are changed according to the variables set!
*/

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\buttons_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\main\\remove_duplicates.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx_properties.js');
var prefix = "rd_";

try { //May be loaded along other buttons
	window.DefinePanel('Remove Duplicates Button', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
	var buttonOrientation = 'x';
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset properties
	console.log('Remove Duplicates Button loaded.');
}
prefix = getUniquePrefix(prefix, "_"); // Puts new ID before "_"

var newButtonsProperties = { //You can simply add new properties here
	sortInputA:	["Tag or titleformat expression to check", "artist"	],
	sortInputB:	["Tag or titleformat expression to check", "date"	],
	sortInputC:	["Tag or titleformat expression to check", "title"	],
	nAllowed:	["Number of duplicates allowed (n + 1)"	 , 0		],
};

setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once

// we change the default coordinates here to accommodate text for x orientation. Apply this on vertical as global!
if (buttonOrientation === 'x') {buttonCoordinates.w += 25;}

var newButtons = {
	RemoveDuplicates: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, 'Remove Duplicates', function () {
		let t0 = Date.now();
		let t1 = 0;
		let badSortInput = getPropertiesValues(this.buttonsProperties, this.prefix, void(0), 4); //This gets all the panel properties at once but 4th
		let sortInput = badSortInput.filter((n) => n); //Filter the holes, since they can appear at any place!
        do_remove_duplicatesV2(null, null, sortInput);
		t1 = Date.now();
		console.log("Call to do_remove_duplicatesV2 took " + (t1 - t0) + " milliseconds.");
	}, null, g_font,'Removes duplicates according to equal ' + enumeratePropertiesValues(newButtonsProperties, prefix, void(0), void(0), 4), prefix, newButtonsProperties), //Skips 4th descriptor
	
	RemoveDuplicatesV3: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, buttonOrientation, buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, 'Filter playlist', function () {
		let t0 = Date.now();
		let t1 = 0;
		let badSortInput = getPropertiesValues(this.buttonsProperties, this.prefix); //This gets all the panel properties at once
		let nAllowed = badSortInput.splice(3, 1); // But we take away 4th variable for later
		let sortInput = badSortInput.filter((n) => n); //Filter the holes, since they can appear at any place!
        do_remove_duplicatesV3(null, null, sortInput, nAllowed);
		t1 = Date.now();
		console.log("Call to do_remove_duplicatesV3 took " + (t1 - t0) + " milliseconds.");
	}, null, g_font,'Filter playlist according to equal ' + enumeratePropertiesValues(newButtonsProperties, prefix, void(0), void(0), 4) + ' and allowing ' + getPropertiesValues(newButtonsProperties,prefix)[3] + ' duplicates', prefix, newButtonsProperties), // Changes a bit the tooltip to show duplicates number separated
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