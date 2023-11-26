'use strict';
//26/11/23

/* 
	Top Tracks
	Search n most played tracks on library. You can configure the number of tracks at properties panel.
	Button name and tooltip text is changed according to that value!
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\main\\search\\top_tracks.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\buttons_xxx_menu.js');
var prefix = 'tt';
var version = getButtonVersion('Playlist-Tools-SMP');

try {window.DefineScript('Top Tracks Button', {author:'regorxxx', version, features: {drag_n_drop: false}});} catch (e) {/* console.log('Top Tracks Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	playlistLength:	['Length of playlist', 25, {greater: 0, func: isInt}, 25],
	forcedQuery: 	['Forced query to pre-filter database', globQuery.notLowRating, {func: (query) => {return checkQuery(query, true);}}, globQuery.notLowRating],
	bIconMode:		['Icon-only mode?', false, {func: isBoolean}, false]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Top Tracks': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Top ' + newButtonsProperties.playlistLength[1] + ' Tracks', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) /_scale(buttonsBar.config.scale), h: 22}, (parent) => {return 'Top ' + parent.buttonsProperties.playlistLength[1] + ' Tracks'}, function (mask) {
		if (mask === MK_SHIFT) {
			settingsMenu(this, true, ['buttons_search_top_tracks.js']).btn_up(this.currX, this.currY + this.currH);
		} else {
			topTracks({playlistLength: Number(this.buttonsProperties.playlistLength[1]), forcedQuery: this.buttonsProperties.forcedQuery[1], bProfile: typeof menu_panelProperties !== 'undefined' ? menu_panelProperties.bProfile[1] : false});
		}
	}, null, void(0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		let info = 'Playlist with Tracks most played (without duplicates).';
		info += '\nTracks:\t' + parent.buttonsProperties.playlistLength[1];
		info += '\nFilter:\t' + parent.buttonsProperties.forcedQuery[1];
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, chars.heartOff, void(0), void(0), void(0), void(0), {scriptName: 'Playlist-Tools-SMP', version}),
});