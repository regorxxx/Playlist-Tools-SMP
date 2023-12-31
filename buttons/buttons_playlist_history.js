'use strict';
//30/12/23

/*
	Playlist History
	----------------
	Switch to previous playlists.
 */

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, themedButton:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */
include('..\\helpers\\playlist_history.js');
/* global PlsHistory:readable */

var prefix = 'ph'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Playlist Tools History', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) {/* console.log('Playlist Tools History Button loaded.'); */ } //May be loaded along other buttons

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	bIconMode: ['Icon-only mode?', false, { func: isBoolean }, false]
};

setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playlist Tools History': new themedButton({ x: 0, y: 0, w: _gr.CalcTextWidth('Prev. Playlist', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 }, 'Prev. Playlist', function (mask) {
		if (mask === MK_SHIFT) {
			this.plsHistory.menu().btn_up(this.currX, this.currY + this.currH);
		} else {
			this.plsHistory.goPrevPls();
		}
	}, null, void (0), (parent) => {
		return 'Switch to previous playlist:' +
			'\nPlaylist:\t' + parent.plsHistory.getPrevPlsName() +
			(typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1]
				? '\n-----------------------------------------------------\n(Shift + L. Click to see entire history)'
				: '');
	}, prefix, newButtonsProperties, chars.history, void (0), { plsHistory: new PlsHistory() }, void (0), void (0), { scriptName: 'Playlist-Tools-SMP', version })
});