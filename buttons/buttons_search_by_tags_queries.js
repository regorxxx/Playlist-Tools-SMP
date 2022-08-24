'use strict';
//24/08/22

/* 
	Search n tracks (randomly) on library with the same tag(s) than the current selected track.
	You can configure the number of tracks at properties panel. Also forced query to prefilter tracks.
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\main\\search_same_by.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\buttons_xxx_menu.js');
var prefix = 'ssbytq';
 
 
try {window.DefinePanel('Search Same By Tags (Queries) Button', {author:'xxx'});} catch (e) {/* console.log('Search Same By Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	customName:		['Name for the custom UI button', 'Search Same By... (q)'],
	playlistLength:		['Max Playlist Mix length', 50],
	forcedQuery:		['Forced query to filter database', 'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1) AND NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi) AND %channels% LESS 3 AND NOT COMMENT HAS Quad'],
	checkDuplicatesBy:	['Tags to look for duplicates', 'title,artist,date'],
	sameBy: 			['Tags to look for similarity', JSON.stringify([['STYLE'], ['MOOD']])],
	playlistName:		['Playlist name', 'Search...']
};
newButtonsProperties['playlistLength'].push({greater: 0, func: isInt}, newButtonsProperties['playlistLength'][1]);
newButtonsProperties['forcedQuery'].push({func: (query) => {return checkQuery(query, true);}}, newButtonsProperties['forcedQuery'][1]);
newButtonsProperties['checkDuplicatesBy'].push({func: isString}, newButtonsProperties['checkDuplicatesBy'][1]);
newButtonsProperties['sameBy'].push({func: isString}, newButtonsProperties['sameBy'][1]);
newButtonsProperties['playlistName'].push({func: isString}, newButtonsProperties['playlistName'][1]);

setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Search Same By Tags (Queries)': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont('Segoe UI', 12)) + 30, h: 22},  newButtonsProperties.customName[1], function (mask) {
		if (mask === MK_SHIFT) {
			const oldName = this.buttonsProperties.customName[1].toString();
			settingsMenu(this, true).btn_up(this.currX, this.currY + this.currH);
			const newName = this.buttonsProperties.customName[1].toString();
			if (oldName !== newName) {this.adjustNameWidth(newName);}
		} else {
			searchSameByQueries({checkDuplicatesBy: this.buttonsProperties.checkDuplicatesBy[1].split(','), playlistLength: Number(this.buttonsProperties.playlistLength[1]), sameBy: JSON.parse(this.buttonsProperties.sameBy[1]), bProfile: true});
		}
	}, null, void(0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		let info = 'Random playlist matching ' + parent.buttonsProperties.sameBy[1] +  '\nof the currently selected track';
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, chars.link),
});