﻿'use strict';
//10/10/22

/*	
	Sort by Key
	-----------------------------------
	Uses notation described at 'camelotWheel' on camelot_wheel_xxx.js to sort selection by key.
*/ 

include('..\\helpers\\camelot_wheel_xxx.js');

function do_sort_by_key({
						playlistIdx = plman.ActivePlaylist,
						keyTag = 'KEY',
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
	const keyTagTF = keyTag.indexOf('$') === -1 && keyTag.indexOf('%') === -1 ? '%' + keyTag + '%' : keyTag;
	let i = 0;
	camelotWheel.getKeyNotationTable().forEach ((val, key) => {
		const sortVal = (sortOrder === -1 ? 999999999 - val.substring(0, val.length - 1) : val.substring(0, val.length - 1));
		tfo += '$if($stricmp(' + keyTagTF + ',' + key + '),' + sortVal +  ',';
		i++;
		// Instead of
		// tfo += '$if($stricmp(%' + keyTag + '%,' + key + '),' + (sortOrder * val.substring(0, val.length - 1)) +  ')';
	});
	tfo += ')'.repeat(i) // Add closures!
	if (bDebug) {console.log(tfo);}
	console.log(tfo);
	plman.UndoBackup(plman.ActivePlaylist);
	return plman.SortByFormat(playlistIdx, tfo, bSelection);
}