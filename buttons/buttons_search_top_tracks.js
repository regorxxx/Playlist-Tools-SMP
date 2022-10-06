'use strict';
//06/10/22

/* 
	Top Tracks
	Search n most played tracks on library. You can configure the number of tracks at properties panel.
	Button name and tooltip text is changed according to that value!
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\main\\top_tracks.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\buttons_xxx_menu.js');
var prefix = 'tt';

try {window.DefinePanel('Top Tracks Button', {author:'xxx'});} catch (e) {/* console.log('Top Tracks Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	playlistLength:	['Length of playlist', 25, {greater: 0, func: isInt}, 25],
	forcedQuery: 	['Forced query to pre-filter database', globQuery.notLowRating, {func: (query) => {return checkQuery(query, true);}}, globQuery.notLowRating],
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Top Tracks': new themedButton({x: 0, y: 0, w: 103, h: 22}, (parent) => {return 'Top ' + parent.buttonsProperties.playlistLength[1] + ' Tracks'}, function (mask) {
		if (mask === MK_SHIFT) {
			settingsMenu(this, true, ['buttons_search_top_tracks.js']).btn_up(this.currX, this.currY + this.currH);
		} else {
			do_top_tracks({playlistLength: Number(this.buttonsProperties.playlistLength[1]), forcedQuery: this.buttonsProperties.forcedQuery[1]});
		}
	}, null, void(0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		let info = 'Playlist with ' + parent.buttonsProperties.playlistLength[1] + ' Tracks most played (without duplicates).\nFiltered with: ' + parent.buttonsProperties.forcedQuery[1];
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, chars.heartOn),
});