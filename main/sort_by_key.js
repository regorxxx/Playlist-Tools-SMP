'use strict';
//13/10/21

/*	
	Sort by Key
	-----------------------------------
	Uses notation described at 'camelotWheel' on camelot_wheel_xxx.js to sort selection by key.
*/ 

include('..\\helpers\\camelot_wheel_xxx.js');

function do_sort_by_key({
								playlistIdx = plman.ActivePlaylist,
								keyTag = 'key',
								bSelection = true,
								sortOrder = 1,
								bDebug = false,
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
	plman.UndoBackup(plman.ActivePlaylist);
	return plman.SortByFormat(playlistIdx, tfo, bSelection);
}