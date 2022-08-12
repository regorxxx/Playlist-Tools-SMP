'use strict';
//12/08/22

/* 
	Removes duplicates on active playlist without changing order. It's currently set to title-artist-date, 
	that means that any track matching those will be considered a duplicate.
	
	But it can be set as a playlist filter too just by removing or adding tags. 
	You have 3 possible checks, you can delete any of them.
	i.e. Checking artist/date, effectively outputs only 1 track per year for every artist.
		
	Configurable number of duplicates allowed:
	number of final duplicates is always nAllowed + 1, since you allow n duplicates and the 'main' copy.
	
	Tooltip texts are changed according to the variables set!
*/

include('..\\helpers\\buttons_xxx.js');
include('..\\main\\remove_duplicates.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\buttons_xxx_menu.js');
var prefix = 'fpl';

try {window.DefinePanel('Filter Playlist Button', {author:'xxx'});} catch (e) {/* console.log('Filter Playlist Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	checkInputA:	['Tag or titleformat expression to check (1)', 'artist'	],
	checkInputB:	['Tag or titleformat expression to check (2)', 'date'	],
	checkInputC:	['Tag or titleformat expression to check (3)', 'title'	],
	nAllowed:	['Number of duplicates allowed (n + 1)'		 , 1		]
};
newButtonsProperties['checkInputA'].push({func: isStringWeak}, newButtonsProperties['checkInputA'][1]);
newButtonsProperties['checkInputB'].push({func: isStringWeak}, newButtonsProperties['checkInputB'][1]);
newButtonsProperties['checkInputC'].push({func: isStringWeak}, newButtonsProperties['checkInputC'][1]);
newButtonsProperties['nAllowed'].push({greaterEq: 0, func: isInt}, newButtonsProperties['nAllowed'][1]);

setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Filter Playlist': new themedButton({x: 0, y: 0, w: 100, h: 22}, 'Filter playlist', function (mask) {
			if (mask === MK_SHIFT) {
			settingsMenu(this, true).btn_up(this.currX, this.currY + this.currH);
		} else {
			const tagKeys = Object.keys(this.buttonsProperties).filter((key) => {return key.indexOf('checkInput') !== -1;});
			const checkKeys = tagKeys.map((key) => {return this.buttonsProperties[key][1];}).filter((n) => n); //Filter the holes, since they can appear at any place!
			const nAllowed = this.buttonsProperties.nAllowed[1];
			removeDuplicates({checkKeys, nAllowed, bProfile: true});
		}
	}, null, void(0), (parent) => {
		const tagKeys = Object.keys(parent.buttonsProperties).filter((key) => {return key.indexOf('checkInput') !== -1;});
		const checkKeys = tagKeys.map((key) => {return parent.buttonsProperties[key][1];}).filter((n) => n); //Filter the holes, since they can appear at any place!
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		let info = 'Filter playlist according to equal ' + checkKeys.join('|') + '\nand allowing ' + parent.buttonsProperties.nAllowed[3] + ' duplicates';
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, chars.filter),
});