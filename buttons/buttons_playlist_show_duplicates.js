﻿'use strict';
//09/05/24

/*
	Removes duplicates on active playlist without changing order. It's currently set to title-artist-date,
	that means that any track matching those will be considered a duplicate.

	But it can be set as a playlist filter too just by removing or adding tags.
	You have 3 possible checks, you can delete any of them.
	i.e. Checking artist/date, effectively outputs only 1 track per year for every artist.

	Tooltip texts are changed according to the variables set!
*/

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, globTags:readable, globQuery:readable, VK_CONTROL:readable, MK_CONTROL:readable, globRegExp:readable*/
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isStringWeak:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */
include('..\\main\\filter_and_query\\remove_duplicates.js');
/* global showDuplicates:readable, removeDuplicates:readable */

var prefix = 'sd'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Show Duplicates Button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ }
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	checkInputA: 	['Tag or TitleFormat expression to check (1)', globTags.artist, { func: isStringWeak }, globTags.artist],
	checkInputB: 	['Tag or TitleFormat expression to check (2)', globTags.date, { func: isStringWeak }, globTags.date],
	checkInputC: 	['Tag or TitleFormat expression to check (3)', globTags.title, { func: isStringWeak }, globTags.title],
	sortBias:		['Track selection bias', globQuery.remDuplBias, { func: isStringWeak }, globQuery.remDuplBias],
	bAdvTitle:		['Advanced RegExp title matching', true, { func: isBoolean }, true],
	bMultiple: 		['Partial Multi-value tag matching', true, { func: isBoolean }, true],
	bIconMode: 		['Icon-only mode?', false, { func: isBoolean }, false]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Show Duplicates': new ThemedButton({ x: 0, y: 0, w: _gr.CalcTextWidth('Show duplicates', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 }, 'Show duplicates', function (mask) {
		if (mask === MK_SHIFT) {
			settingsMenu(this, true, ['buttons_playlist_show_duplicates.js'], { bAdvTitle: { popup: globRegExp.title.desc } }).btn_up(this.currX, this.currY + this.currH);
		} else {
			const checkKeys = Object.keys(this.buttonsProperties).filter((key) => { return key.startsWith('check'); })
				.map((key) => { return this.buttonsProperties[key][1]; }).filter((n) => n); //Filter the holes, since they can appear at any place!
			const sortBias = this.buttonsProperties.sortBias[1];
			const bAdvTitle = this.buttonsProperties.bAdvTitle[1];
			const bMultiple = this.buttonsProperties.bMultiple[1];
			if (mask === MK_CONTROL) {
				removeDuplicates({ checkKeys, sortBias, bAdvTitle, bMultiple, bProfile: typeof menu_panelProperties !== 'undefined' ? menu_panelProperties.bProfile[1] : false });
			} else {
				showDuplicates({ checkKeys, bAdvTitle, bMultiple, bProfile: typeof menu_panelProperties !== 'undefined' ? menu_panelProperties.bProfile[1] : false });
			}
		}
	}, null, void (0), (parent) => {
		const checkKeys = Object.keys(parent.buttonsProperties).filter((key) => { return key.startsWith('check'); })
			.map((key) => { return parent.buttonsProperties[key][1]; }).filter((n) => n); //Filter the holes, since they can appear at any place!
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bCtrl = utils.IsKeyPressed(VK_CONTROL);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		let info = 'Show duplicates according to equal:';
		info += '\nTF:\t' + checkKeys.join('|').cut(50);
		info += '\nBias:\t' + parent.buttonsProperties.sortBias[1].cut(50);
		info += '\nRegExp:\t' + parent.buttonsProperties.bAdvTitle[1];
		if (bShift || bCtrl || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Ctrl + L. Click to remove duplicates)';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, chars.duplicates, void (0), void (0), void (0), void (0), { scriptName: 'Playlist-Tools-SMP', version }),
});