﻿'use strict';
//05/10/22

/* 
	Removes duplicates on active playlist without changing order. It's currently set to title-artist-date, 
	that means that any track matching those will be considered a duplicate.
	
	But it can be set as a playlist filter too just by removing or adding tags. 
	You have 3 possible checks, you can delete any of them.
	i.e. Checking artist/date, effectively outputs only 1 track per year for every artist.
	
	Tooltip texts are changed according to the variables set!
*/

include('..\\helpers\\buttons_xxx.js');
include('..\\main\\remove_duplicates.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\buttons_xxx_menu.js');
var prefix = 'rd';

try {window.DefinePanel('Remove Duplicates Button', {author:'xxx'});} catch (e) {/* console.log('Remove Duplicates Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	checkInputA:	['Tag or titleformat expression to check (1)', globTags.artist, {func: isStringWeak}, globTags.artist],
	checkInputB:	['Tag or titleformat expression to check (2)', globTags.date, {func: isStringWeak}, globTags.date],
	checkInputC:	['Tag or titleformat expression to check (3)', globTags.title, {func: isStringWeak}, globTags.title],
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Remove Duplicates': new themedButton({x: 0, y: 0, w: 116, h: 22}, 'Rmv. duplicates', function (mask) {
		if (mask === MK_SHIFT) {
			settingsMenu(this, true, ['buttons_playlist_remove_duplicates.js']).btn_up(this.currX, this.currY + this.currH);
		} else if (mask === MK_CONTROL) {
			const checkKeys = Object.keys(this.buttonsProperties).map((key) => {return this.buttonsProperties[key][1];}).filter((n) => n); //Filter the holes, since they can appear at any place!
			showDuplicates({checkKeys, bProfile: true});
		} else {
			const checkKeys = Object.keys(this.buttonsProperties).map((key) => {return this.buttonsProperties[key][1];}).filter((n) => n); //Filter the holes, since they can appear at any place!
			removeDuplicatesV2({checkKeys, bProfile: true});
		}
	}, null, void(0), (parent) => {
		const checkKeys = Object.keys(parent.buttonsProperties).map((key) => {return parent.buttonsProperties[key][1];}).filter((n) => n); //Filter the holes, since they can appear at any place!
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		let info = 'Removes duplicates according to equal ' + checkKeys.join('|');
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Ctrl + L. Click to show duplicates)';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, chars.duplicates),
});