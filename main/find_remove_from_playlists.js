'use strict';
//13/10/21

/*
	Find/Remove From Playlist(s)
	Finds or delete the selection from a different playlist. Returns all the playlists they are actually in.
	Also see 'playlist_tools_menu.js' for menu generation with playlist names from findInPlaylists().
*/

function removeFromPlaylist(selList, playlistIndex) {
	if (!selList) {return;}
	if (plman.PlaylistCount <= playlistIndex) {return;}
	plman.UndoBackup(playlistIndex);
	let handle_list = plman.GetPlaylistItems(playlistIndex);
	if (!handle_list || !handle_list.Count) {return;}
	for (const sel of selList.Convert()) {
		handle_list.Remove(sel);
	}	
	plman.ClearPlaylist(playlistIndex);
	plman.InsertPlaylistItems(playlistIndex, 0, handle_list);
}

function findInPlaylists(selList = fb.GetFocusItem(), lockType = []) {
	if (!selList) {return [];}
	let inPlaylist = [];
	let inPlaylistSet = new Set();
	const bAll = lockType.length ? true : false;
	for (const sel of selList.Convert()){
		for (let i = 0; i < plman.PlaylistCount; i++) {
			if (plman.GetPlaylistItems(i).Find(sel) !== -1) {
				if (!inPlaylistSet.has(i)) {
					const lockActions = plman.GetPlaylistLockedActions(i);
					const bLocked = bAll ? lockActions.length : new Set(lockActions).isSuperset(new Set(lockType));
					inPlaylist.push({index: i, name: plman.GetPlaylistName(i), bLocked});
					inPlaylistSet.add(i);
				}
			}
		}
	}
	return inPlaylist;
}

function focusInPlaylist(selList, playlistIndex) {
	if (!selList) {return;}
	if (plman.PlaylistCount <= playlistIndex) {return;}
	const selListArr = selList.Convert();
	let idx = -1;
	const handle_list = plman.GetPlaylistItems(playlistIndex);
	plman.ActivePlaylist = playlistIndex;
	plman.ClearPlaylistSelection(playlistIndex);
	for (const sel of selListArr) {
		idx = handle_list.Find(sel);
		if (idx !== -1) {plman.SetPlaylistSelection(plman.ActivePlaylist, [idx], true);}
	}	
	plman.SetPlaylistFocusItem(plman.ActivePlaylist, idx);
}