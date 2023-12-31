﻿'use strict';
//30/12/23

/*
	Top Tracks
	Search n most played tracks on library. You can configure the number of tracks at properties panel.
	Button name and tooltip text is changed according to that value!
 */

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, globQuery:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, themedButton:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isInt:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */
include('..\\helpers\\helpers_xxx_tags.js');
/* global checkQuery:readable  */
include('..\\main\\search\\top_tracks_from_date.js');
/* global topTracksFromDate:readable  */

var prefix = 'ttd'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Top Tracks Button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) {/* console.log('Top Tracks from Date Button loaded.'); */ } //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	playlistLength: ['Length of playlist', 25, { greater: 0, func: isInt }, 25],
	forcedQuery: ['Forced query to pre-filter database', globQuery.filter, { func: (query) => { return checkQuery(query, true); } }, globQuery.filter],
	year: ['Year', 0, { greaterEq: 0, func: isInt }, 0],
	bIconMode: ['Icon-only mode?', false, { func: isBoolean }, false]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Top Tracks from Date': new themedButton({ x: 0, y: 0, w: _gr.CalcTextWidth('Top ' + newButtonsProperties.playlistLength[1] + ' Tracks ' + (newButtonsProperties.year[1] || (new Date().getFullYear() - 1)), _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 }, (parent) => { return 'Top ' + parent.buttonsProperties.playlistLength[1] + ' Tracks ' + (parent.buttonsProperties.year[1] || (new Date().getFullYear() - 1)); }, function (mask) {
		if (mask === MK_SHIFT) {
			settingsMenu(this, true, ['buttons_search_top_tracks_from_date.js']).btn_up(this.currX, this.currY + this.currH);
		} else {
			topTracksFromDate({ playlistLength: Number(this.buttonsProperties.playlistLength[1]), forcedQuery: this.buttonsProperties.forcedQuery[1], year: this.buttonsProperties.year[1] || (new Date().getFullYear() - 1), bProfile: typeof menu_panelProperties !== 'undefined' ? menu_panelProperties.bProfile[1] : false });
		}
	}, null, void (0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		let info = 'Playlist with Tracks most played (without duplicates).';
		info += '\nTracks:\t' + parent.buttonsProperties.playlistLength[1];
		info += '\nYear:\t' + (parent.buttonsProperties.year[1] || (new Date().getFullYear() - 1));
		info += '\nFilter:\t' + parent.buttonsProperties.forcedQuery[1];
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, chars.calendar, void (0), void (0), void (0), void (0), { scriptName: 'Playlist-Tools-SMP', version }),
});