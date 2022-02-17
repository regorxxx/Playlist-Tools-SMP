'use strict';
//17/02/22

/* 
	Removes duplicates on active playlist without changing order. It's currently set to title-artist-date, 
	that means that any track matching those will be considered a duplicate.
	
	But it can be set as a playlist filter too just by removing or adding tags. 
	You have 3 possible checks, you can delete any of them.
	i.e. Checking artist/date, effectively outputs only 1 track per year for every artist.
		
	Remove DuplicatesV3 allows a configurable number of duplicates allowed:
	number of final duplicates is always nAllowed + 1, since you allow n duplicates and the 'main' copy.
	
	Tooltip texts are changed according to the variables set!
*/

include('..\\helpers\\buttons_xxx.js');
include('..\\main\\remove_duplicates.js');
include('..\\helpers\\helpers_xxx_properties.js');
var prefix = 'rd_';

try {window.DefinePanel('Remove Duplicates Button', {author:'xxx'});} catch (e) {console.log('Remove Duplicates Button loaded.');} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	sortInputA:	['Tag or titleformat expression to check', 'artist'	],
	sortInputB:	['Tag or titleformat expression to check', 'date'	],
	sortInputC:	['Tag or titleformat expression to check', 'title'	],
	nAllowed:	['Number of duplicates allowed (n + 1)'	 , 1		]
};
newButtonsProperties['sortInputA'].push({func: isStringWeak}, newButtonsProperties['sortInputA'][1]);
newButtonsProperties['sortInputB'].push({func: isStringWeak}, newButtonsProperties['sortInputB'][1]);
newButtonsProperties['sortInputC'].push({func: isStringWeak}, newButtonsProperties['sortInputC'][1]);
newButtonsProperties['nAllowed'].push({greaterEq: 0, func: isInt}, newButtonsProperties['nAllowed'][1]);

setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix));

addButton({
	RemoveDuplicates: new themedButton({x: 0, y: 0, w: 123, h: 22}, 'Rmv. duplicates', function () {
		let t0 = Date.now();
		let t1 = 0;
		let badSortInput = getPropertiesValues(this.buttonsProperties, this.prefix, void(0), 4); //This gets all the panel properties at once but 4th
		let sortInput = badSortInput.filter((n) => n); //Filter the holes, since they can appear at any place!
        do_remove_duplicates(null, null, sortInput);
		t1 = Date.now();
		console.log('Call to do_remove_duplicates took ' + (t1 - t0) + ' milliseconds.');
	}, null, void(0), 'Removes duplicates according to equal ' + enumeratePropertiesValues(newButtonsProperties, prefix, void(0), void(0), 4), prefix, newButtonsProperties, chars.duplicates), //Skips 4th descriptor
	
	RemoveDuplicatesV3: new themedButton({x: 0, y: 0, w: 123, h: 22}, 'Filter playlist', function () {
		let t0 = Date.now();
		let t1 = 0;
		let badSortInput = getPropertiesValues(this.buttonsProperties, this.prefix); //This gets all the panel properties at once
		let nAllowed = badSortInput.splice(3, 1); // But we take away 4th variable for later
		let sortInput = badSortInput.filter((n) => n); //Filter the holes, since they can appear at any place!
        do_remove_duplicates(null, null, sortInput, nAllowed);
		t1 = Date.now();
		console.log('Call to do_remove_duplicates took ' + (t1 - t0) + ' milliseconds.');
	}, null, void(0), 'Filter playlist according to equal ' + enumeratePropertiesValues(newButtonsProperties, prefix, void(0), void(0), 4) + ' and allowing ' + getPropertiesValues(newButtonsProperties,prefix)[3] + ' duplicates', prefix, newButtonsProperties, chars.filter), // Changes a bit the tooltip to show duplicates number separated
});