'use strict';
//19/12/22

/*	
	Sort by Key
	-----------------------------------
	Uses notation described at 'camelotWheel' on camelot_wheel_xxx.js to sort selection by key.
*/ 

include('..\\..\\helpers\\camelot_wheel_xxx.js');

function sortByKey({
						playlistIdx = plman.ActivePlaylist,
						keyTag = typeof globTags !== 'undefined' ? globTags.key : 'KEY',
						bSelection = true,
						sortOrder = 1,
						bDebug = false
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
		const num = val.slice(0, -1);
		const letter = val.slice(-1);
		const sortVal = (sortOrder === -1 ? 999999999 - ( num + (letter === 'A' ? 0 : 1)) : num + (letter === 'A' ? 0 : 1));
		tfo += '$if($stricmp(' + keyTagTF + ',' + key + '),' + sortVal +  ',';
		i++;
		// Instead of
		// tfo += '$if($stricmp(%' + keyTag + '%,' + key + '),' + (sortOrder * val.substring(0, val.length - 1)) +  ')';
	});
	tfo += ')'.repeat(i) // Add closures!
	if (bDebug) {console.log(tfo);}
	plman.UndoBackup(plman.ActivePlaylist);
	return plman.SortByFormat(playlistIdx, tfo, bSelection);
}