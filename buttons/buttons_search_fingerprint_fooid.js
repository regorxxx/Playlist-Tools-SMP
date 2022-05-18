'use strict';
//17/02/22

/* 
	Fingerprint tag (FooID)
	----------------
	Search by fingerprint on library.
 */

include('..\\helpers\\buttons_xxx.js'); 
include('..\\helpers\\helpers_xxx_file.js'); 
include('..\\main\\fingerprint_tools_menu.js');
var prefix = 'fp_0';

try {window.DefinePanel('Fingerprint FooID Search', {author:'xxx'});} catch (e) {console.log('Fingerprint FooID Search Button loaded.');} //May be loaded along other buttons

var newButtonsProperties = { //You can simply add new properties here
	fpTagC:			['Chromaprint Fingerprint tag', 'acoustid_fingerprint_raw'],
	bMergeC:		['Merge Chromaprint values sep by \', \' into one', true],
	thresholdC:		['Chromaprint minimum score', 85],
	fpTagF:			['FooID Fingerprint tag', 'fingerprint_fooid'],
	thresholdF:		['FooID minimum score', 85],
	playlistName:	['Playlist name','Search...'],
	databaseHash:	['Chromaprint database hash', -1]
};
newButtonsProperties['fpTagC'].push({func: isStringWeak}, newButtonsProperties['fpTagC'][1]);
newButtonsProperties['thresholdC'].push({greater: 0, lowerEq: 100, func: isInt}, newButtonsProperties['thresholdC'][1]);
newButtonsProperties['fpTagF'].push({func: isStringWeak}, newButtonsProperties['fpTagF'][1]);
newButtonsProperties['thresholdF'].push({greater: 0, lowerEq: 100, func: isInt}, newButtonsProperties['thresholdF'][1]);
newButtonsProperties['playlistName'].push({func: isString}, newButtonsProperties['playlistName'][1]);

setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix, 0));
if (!buttonsBar.list.some((properties) => {return properties.hasOwnProperty('fpTagC');})) {buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix, 0));}

addButton({
	fpsf: new themedButton({x: 0, y: 0, w: 133, h: 22}, 'Search by fooID', function () {
		// Reuse the menu entry
		return createFpMenuLeft.bind(this)().btn_up(void(0), void(0), void(0), 'Search by similar FooID');
	}, null, void(0), (parent) => {parent.selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist); return 'Look for similar tracks by fingerprint to selected tracks: ' + parent.selItems.Count + ' item(s)';}, prefix, newButtonsProperties, chars.wand),
});