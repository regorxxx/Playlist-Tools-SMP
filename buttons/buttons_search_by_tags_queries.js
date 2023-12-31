'use strict';
//30/12/23

/*
	Search n tracks (randomly) on library with the same tag(s) than the current selected track.
	You can configure the number of tracks at properties panel. Also forced query to prefilter tracks.
 */

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, globTags:readable, globQuery:readable, globRegExp:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, themedButton:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isString:readable, isStringWeak:readable, isJSON:readable, isInt:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */
include('..\\helpers\\helpers_xxx_tags.js');
/* global checkQuery:readable */
include('..\\main\\search\\search_same_by.js');
/* global searchSameByQueries:readable */

var prefix = 'ssbytq'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Search Same By Tags (Queries) Button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) {/* console.log('Search Same By Button loaded.'); */ } //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	customName: ['Name for the custom UI button', 'Search Same By... (q)', { func: isStringWeak }, 'Search Same By... (q)'],
	playlistLength: ['Max Playlist Mix length', 50, { greater: 0, func: isInt }, 50],
	forcedQuery: ['Forced query to filter database', globQuery.filter, { func: (query) => { return checkQuery(query, true); } }, globQuery.filter],
	checkDuplicatesBy: ['Tags to look for duplicates', JSON.stringify(globTags.remDupl), { func: isJSON }, JSON.stringify(globTags.remDupl)],
	bAdvTitle: ['Advanced RegEx title matching?', true, { func: isBoolean }, true],
	sameBy: ['Tags to look for similarity', JSON.stringify([[globTags.style], [globTags.mood]]), { func: isJSON }, JSON.stringify([[globTags.style], [globTags.mood]])],
	playlistName: ['Playlist name', 'Search...', { func: isString }, 'Search...'],
	bIconMode: ['Icon-only mode?', false, { func: isBoolean }, false]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Search Same By Tags (Queries)': new themedButton({ x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 }, newButtonsProperties.customName[1], function (mask) {
		if (mask === MK_SHIFT) {
			const oldName = this.buttonsProperties.customName[1].toString();
			settingsMenu(this, true, ['buttons_search_by_tags_queries.js'], { bAdvTitle: { popup: globRegExp.title.desc } }).btn_up(this.currX, this.currY + this.currH);
			const newName = this.buttonsProperties.customName[1].toString();
			if (oldName !== newName) { this.adjustNameWidth(newName); }
		} else {
			searchSameByQueries({ checkDuplicatesBy: JSON.parse(this.buttonsProperties.checkDuplicatesBy[1]), bAdvTitle: this.buttonsProperties.bAdvTitle[1], playlistLength: Number(this.buttonsProperties.playlistLength[1]), sameBy: JSON.parse(this.buttonsProperties.sameBy[1]), bProfile: typeof menu_panelProperties !== 'undefined' ? menu_panelProperties.bProfile[1] : false });
		}
	}, null, void (0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		let info = 'Random playlist matching from currently selected track:';
		info += '\nTF (all):\t' + parent.buttonsProperties.sameBy[1];
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, chars.searchPlus, void (0), void (0), void (0), void (0), { scriptName: 'Playlist-Tools-SMP', version }),
});