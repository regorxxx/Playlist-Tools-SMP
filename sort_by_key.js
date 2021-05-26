'use strict';

/*	
	Sort by Key v 1.0 25/05/21
	-----------------------------------
	Uses notation described at 'camelotWheel' on camelot_wheel_xxx.js to sort selection by key.
*/ 

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\camelot_wheel_xxx.js');

function do_sort_by_key({
								playlistIdx = plman.ActivePlaylist,
								keyTag = 'key',
								bSelection = true,
								sortOrder = 1,
								bDebug = true,
							} = {}) {
	// Safety checks
	if (!keyTag.length) {return false;}
	if (playlistIdx >= plman.PlaylistCount) {return false;}
	if (!plman.PlaylistItemCount(playlistIdx)) {return false;}
	if (bSelection && !plman.GetPlaylistSelectedItems(playlistIdx).Count) {return false;}
	let tfo = '';
	// Translate keys into something usable on TF
	// Also, instead of adding multiple individual if statements, better to nest them (so only those required are evaluated)
	// camelotWheel.keyNotation.forEach ( (val, key) => {
		// tfo += '$if($stricmp(%' + keyTag + '%,' + key + '),' + (sortOrder * val.substring(0, val.length - 1)) +  ')';
	// });
	camelotWheel.keyNotation.forEach ( (val, key) => {
		tfo += '$if($stricmp(%' + keyTag + '%,' + key + '),' + (sortOrder * val.substring(0, val.length - 1)) +  ',';
	});
	camelotWheel.keyNotation.forEach ( () => {tfo += ')';}); // Add closures!
	if (bDebug) {console.log(tfo);}
	return plman.SortByFormat(playlistIdx, tfo, bSelection);
}