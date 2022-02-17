'use strict';
//17/02/22

/* 
	Top Tracks v 1.0 28/01/20
	Search n most played tracks on library. You can configure the number of tracks at properties panel.
	Button name and tooltip text is changed according to that value!
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\main\\top_tracks.js');
include('..\\helpers\\helpers_xxx_properties.js');
var prefix = 'tt_';

try {window.DefinePanel('Top Tracks Button', {author:'xxx'});} catch (e) {console.log('Top Tracks Button loaded.');} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	playlistLength:	['Length of playlist', 25],
	forcedQuery: 	['Forced query to pre-filter database','NOT (%rating% EQUAL 2 OR %rating% EQUAL 1)'],
};
newButtonsProperties['playlistLength'].push({greater: 0, func: isInt}, newButtonsProperties['playlistLength'][1]);
newButtonsProperties['forcedQuery'].push({func: (query) => {return checkQuery(query, true);}}, newButtonsProperties['forcedQuery'][1]);

setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix));

addButton({
	topTracks: new themedButton({x: 0, y: 0, w: 103, h: 22}, 'Top ' + getProperties(newButtonsProperties, prefix)['playlistLength'] + ' Tracks', function () {
		let t0 = Date.now();
		let t1 = 0;
		const [playlistLength, forcedQuery] = getPropertiesValues(this.buttonsProperties, this.prefix); //This gets all the panel properties at once
		do_top_tracks({playlistLength: Number(playlistLength), forcedQuery});
		t1 = Date.now();
		console.log('Call to do_top_tracks took ' + (t1 - t0) + ' milliseconds.');
	}, null, void(0),'Playlist with ' + getProperties(newButtonsProperties, prefix)['playlistLength'] + ' Tracks most played (without duplicates).\nFiltered with: ' + getProperties(newButtonsProperties, prefix)['forcedQuery'], prefix, newButtonsProperties, chars.heartOn),
});