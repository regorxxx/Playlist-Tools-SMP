'use strict';
//06/10/22

/* 
	Fingerprint tag (FooID)
	----------------
	Search by fingerprint on library.
 */

include('..\\helpers\\buttons_xxx.js'); 
include('..\\helpers\\helpers_xxx_file.js'); 
include('..\\main\\fingerprint_tools_menu.js');
var prefix = 'fp_0';

try {window.DefinePanel('Fingerprint FooID Search', {author:'xxx'});} catch (e) {/* console.log('Fingerprint FooID Search Button loaded.'); */} //May be loaded along other buttons

var newButtonsProperties = { //You can simply add new properties here
	fpTagC:			['Chromaprint Fingerprint tag', globTags.acoustidFP, {func: isString}, globTags.acoustidFP],
	bMergeC:		['Merge Chromaprint values sep by \', \' into one', true, {func: isBoolean}, true],
	thresholdC:		['Chromaprint minimum score', 85, {greater: 0, lowerEq: 100, func: isInt}, 85],
	fpTagF:			['FooID Fingerprint tag', globTags.fooidFP, {func: isString}, globTags.fooidFP],
	thresholdF:		['FooID minimum score', 85, {greater: 0, lowerEq: 100, func: isInt}, 85],
	playlistName:	['Playlist name', 'Search...', {func: isString}, 'Search...'],
	databaseHash:	['Chromaprint database hash', -1]
};

setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix, 0));
if (!buttonsBar.list.some((properties) => {return properties.hasOwnProperty('fpTagC');})) {buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix, 0));}

addButton({
	'Fingerprint FooID Search': new themedButton({x: 0, y: 0, w: 133, h: 22}, 'Search by fooID', function () {
		// Reuse the menu entry
		return createFpMenuLeft.bind(this)().btn_up(void(0), void(0), void(0), 'Search by similar FooID');
	}, null, void(0), (parent) => {parent.selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist); return 'Look for similar tracks by fingerprint to selected tracks: ' + parent.selItems.Count + ' item(s)';}, prefix, newButtonsProperties, chars.wand),
});