'use strict';

/*	
	Sort by Key v 0.1 21/04/21
	-----------------------------------
	Uses notation described at 'camelotWheel' on camelot_wheel_xxx.js to sort selection by key.
*/ 

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\camelot_wheel_xxx.js');

function do_sort_by_key({
								playlistIdx = plman.ActivePlaylist,
								keyTag = 'key',
								bSelection = true,
								sortOrder = 1,
							} = {}) {
	// Safety checks
	if (!keyTag.length) {return false;}
	if (playlistIdx >= plman.PlaylistCount) {return false;}
	if (!plman.PlaylistItemCount(playlistIdx)) {return false;}
	if (bSelection && !plman.GetPlaylistSelectedItems(playlistIdx).Count) {return false;}
	let tfo = '';
	// Translate keys into something usable on TF
	camelotWheel.keyNotation.forEach ( (val, key) => {
		tfo += '$if($stricmp(%' + keyTag + '%,' + key + '),' + (sortOrder * val.substring(0, val.length - 1)) +  ')';
	});
	console.log(tfo);
	return plman.SortByFormat(playlistIdx, tfo, bSelection);
}