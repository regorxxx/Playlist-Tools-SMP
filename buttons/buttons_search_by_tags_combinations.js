'use strict';
//22/12/22

/* 
	Search same by v 1.0 24/08/22
	Search n tracks (randomly) on library matching the conditions given according to the current selected track and tags.
	Note this ONLY USES existing tags, it will not calculate similarity or anything else. i.e. 'dynamic_genre' tag will not
	be calculated on the fly. If some tags are missing, then they get skipped.
	
	Conditions are set as an object with keys (tags) and values (number of coincidences):
	sameBy = {genre: 1, style: 2 , mood: 5} -> Must match at least 1 genre value, 2 style values and 5 mood values.
	
	Setting a 0 value for any key (tag) forces matching of all the tag values for that tag name.
	sameBy = {genre: 0, style: 2 , mood: 5} -> Must match all genre values, 2 style values and 5 mood values.
	
	If X value is greater than the values of a tag, then it simply must match all of them. For ex. if we select a track with 3 moods:
	sameBy = {genre: 0, style: 2 , mood: 5} -> Must match all genre values , 2 style values and (3 < 5) all moods values.
	
	Setting a -X value for any key (tag) forces matching of all the tag values less X. 
	If multi-value tag has less values than x, then must match only one. For ex. if we select a track with 3 genres:
	sameBy = {genre: -1, style: 2 , mood: 5} -> Must match (3-1=) 2 genre values , 2 style values and 5 mood values.
	sameBy = {genre: -2, style: 2 , mood: 5} -> Must match (3-2=) 1 genre values , 2 style values and 5 mood values.
	sameBy = {genre: -10, style: 2 , mood: 5} -> Must match (3 <= 10) 1 genre values, 2 style values and 5 mood values.
	
	+X/-X value for any key (tag) can be float € (0,1). Outside that range they have no use. 
	Final values are rounded, and minimum will always be 1. Maximum all tags values. Also f(-X) = f(1 - X):
	sameBy = {genre: -0.33, style: 2 , mood: 5} -> Must match (n - n * 1/3 = n * 2/3) two thirds of genre values , 2 style values and 5 mood values.
	sameBy = {genre: 0.66, style: 2 , mood: 5} -> Must match (n * 2/3) two thirds of genre values , 2 style values and 5 mood values.
	sameBy = {genre: 0.5, style: 2 , mood: 5} -> Must match (n * 1/2) half of the genre values , 2 style values and 5 mood values.
	
	After query search, duplicates are removed according to the tags set (checkDuplicatesBy).
    You can change sorting, playlist name and/or force a final query (added to the other requisites).
	
	- Tags logic - 
	Title-format only tags, like rating are acquired via TF, but must be written without '%', like the rest. See dynamicTags.
	
	When the tags are not strings (genre, etc.) but numeric values (date, etc.), the pair {key: value} work as a range. See numericTags.
	sameBy = {genre: -1, date: 10} -> Must match all genre values and dates between (-10,+10).
	
	A special subset of numeric tags may be cyclic, so the values can only be within a predefined range. See cyclicTags and cyclicTagsDescriptor.
	
	- Examples of functionality -
	buttons_search_by_tags_queries {style} <-> use sameBy = {style: 0}
	buttons_search_by_tags_queries {style, artist} <-> use sameBy = {style: 0, artist: 0}
	Tracks from same artist and equal rating <-> use sameBy = {artist: 0, rating: 0}
	Tracks from same genre and style and date within 10 years <-> use sameBy = {genre: 0, style: 0, date: 10}
	Tracks from same genre but allowing n-2 style coincidences and date within 10 years <-> use sameBy = {genre: 0, style: -2, date: 10}
	
	- Caveat -
	Although the +X/-X notations seem to produce similar results, they don't. Let's say we have a track with n style values, then:
	Using -X notation: final number is always relative to number of tags of selected track.
	5 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (5-2=) 3 styles.
	4 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (4-2=) 2 styles.
	3 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (3-2=) 1 style.
	2 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (2 <= 2) 1 style.
	1 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (2 <= 2) 1 style.
	But using +X notation: final number is a constant value (if possible).
	5 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 2 styles.
	4 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 2 styles.
	3 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 2 styles.
	2 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 2 styles.
	1 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 1 style.
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\main\\search\\search_same_by.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\buttons_xxx_menu.js');
var prefix = 'ssbytc';
 
try {window.DefineScript('Search Same By Tags (Combinations) Button', {author:'xxx', features: {drag_n_drop: false}});} catch (e) {/* console.log('Search Same By Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	customName:			['Name for the custom UI button', 'Search Same By... (c)', {func: isString}, 'Search Same By... (c)'],
	playlistLength:		['Max Playlist Mix length', 50, {greater: 0, func: isInt}, 50],
	forcedQuery:		['Forced query to filter database', globQuery.filter, {func: (query) => {return checkQuery(query, true);}}, globQuery.filter],
	checkDuplicatesBy:	['Tags to look for duplicates', JSON.stringify(globTags.remDupl), {func: isJSON}, JSON.stringify(globTags.remDupl)],
	bAdvTitle:			['Advanced RegEx title matching?', true, {func: isBoolean}, true],
	sameBy: 			['Tags to look for similarity', JSON.stringify({GENRE:1 , STYLE: 2, MOOD: 5}), {func: isJSON}, JSON.stringify({GENRE:1 , STYLE: 2, MOOD: 5})],
	playlistName:		['Playlist name', 'Search...', {func: isString}, 'Search...']
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Search Same By Tags (Combinations)': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont('Segoe UI', 12 * buttonsBar.config.scale)) + 30, h: 22},  newButtonsProperties.customName[1], function (mask) {
		if (mask === MK_SHIFT) {
			const oldName = this.buttonsProperties.customName[1].toString();
			settingsMenu(this, true, ['buttons_search_by_tags_combinations.js'], {bAdvTitle: {popup: globRegExp.title.desc}}).btn_up(this.currX, this.currY + this.currH);
			const newName = this.buttonsProperties.customName[1].toString();
			if (oldName !== newName) {this.adjustNameWidth(newName);}
		} else {
			searchSameByCombs({checkDuplicatesBy: JSON.parse(this.buttonsProperties.checkDuplicatesBy[1]), bAdvTitle: this.buttonsProperties.bAdvTitle[1], playlistLength: Number(this.buttonsProperties.playlistLength[1]), sameBy: JSON.parse(this.buttonsProperties.sameBy[1]), bProfile: true});
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