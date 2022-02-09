'use strict';
//03/02/22

/* 
	Search same by v 1.0 28/01/20
	Search n tracks (randomly) on library matching the conditions given according to the current selected track and tags.
	Note this ONLY USES existing tags, it will not calculate similarity or anything else. i.e. 'dynamic_genre' tag will not be calculated on the fly. 
	If some tags are missing, then they get skipped.
	
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
	buttons_search_same_style_moods <-> use sameBy = {style: 2, mood: 6}
	buttons_search_same_style <-> use sameBy = {style: 0}
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
include('..\\main\\search_same_by.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\helpers_xxx_tags.js');
var prefix = 'ssby_';
 
 
try { //May be loaded along other buttons
	window.DefinePanel('Search Same By Button', {author:'xxx'});
	var g_font = _gdiFont('Segoe UI', 12);
	var buttonCoordinates = {x: 0, y: 0, w: 98, h: 22};
} catch (e) {
	buttonCoordinates = {x: 0, y: 0, w: buttonsBar.config.buttonOrientation === 'x' ? 98 : buttonCoordinates.w , h: buttonsBar.config.buttonOrientation === 'y' ? 22 : buttonCoordinates.h}; // Reset 
	console.log('Search Same By Button loaded.');
}
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	playlistLength: 	['Max Playlist Mix length', 50],
	forcedQuery: 		['Forced query to filter database (added to any other internal query)', 
				'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1) AND NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi) AND %channels% LESS 3 AND NOT COMMENT HAS Quad'
				],
	checkDuplicatesBy:	['Tags to look for duplicates', 'title,artist,date'],
	sameBy: 			['Tags to look for similarity', JSON.stringify({genre:1 , style: 2, mood: 5})],
	playlistName:		['Playlist name','Search...'],
};
newButtonsProperties['playlistLength'].push({greater: 0, func: isInt}, newButtonsProperties['playlistLength'][1]);
newButtonsProperties['forcedQuery'].push({func: (query) => {return checkQuery(query, true);}}, newButtonsProperties['forcedQuery'][1]);
newButtonsProperties['checkDuplicatesBy'].push({func: isString}, newButtonsProperties['checkDuplicatesBy'][1]);
newButtonsProperties['sameBy'].push({func: isString}, newButtonsProperties['sameBy'][1]);
newButtonsProperties['playlistName'].push({func: isString}, newButtonsProperties['playlistName'][1]);

setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix));

// we change the default coordinates here to accommodate text
if (buttonsBar.config.buttonOrientation === 'x') {buttonCoordinates.w += 25;}

var newButtons = {
    SearchSameBy: new SimpleButton(calcNextButtonCoordinates(buttonCoordinates, void(0), buttonsBar.config.buttonOrientation === 'x' ? true : false).x, calcNextButtonCoordinates(buttonCoordinates, void(0), buttonsBar.config.buttonOrientation === 'x' ? false : true).y, buttonCoordinates.w, buttonCoordinates.h, 'Search Same By...', function () {
		let t0 = Date.now();
		let t1 = 0;
		let args = getProperties(this.buttonsProperties, this.prefix); //This gets all the panel properties at once
		args.checkDuplicatesBy = args.checkDuplicatesBy.split(',');
		args.playlistLength = Number(args.playlistLength);
		args.sameBy = JSON.parse(args.sameBy)
        do_search_same_by(args);
		t1 = Date.now();
		console.log('Call to do_search_same_by took ' + (t1 - t0) + ' milliseconds.');
	}, null, g_font,'Random playlist matching ' + getPropertiesValues(newButtonsProperties, prefix)[3] +  ' of the current selected track', prefix, newButtonsProperties, chars.link),
};
// Check if the button list already has the same button ID
for (var buttonName in newButtons) {
	if (buttons.hasOwnProperty(buttonName)) {
		// fb.ShowPopupMessage('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		// console.log('Duplicated button ID (' + buttonName + ') on ' + window.Name);
		Object.defineProperty(newButtons, buttonName + Object.keys(buttons).length, Object.getOwnPropertyDescriptor(newButtons, buttonName));
		delete newButtons[buttonName];
	}
}
// Adds to current buttons
buttons = {...buttons, ...newButtons};