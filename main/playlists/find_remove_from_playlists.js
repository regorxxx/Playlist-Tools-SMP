'use strict';
//08/04/24

/*
	Find/Remove From Playlist(s)
	Finds or delete the selection from a different playlist. Returns all the playlists they are actually in.
	Also see 'playlist_tools_menu.js' for menu generation with playlist names from findInPlaylists().
*/

/* exported removeFromPlaylist, findInPlaylists, focusInPlaylist */

function removeFromPlaylist(selList, playlistIndex) {
	if (!selList) { return; }
	if (!Array.isArray(selList)) {
		selList = selList instanceof FbMetadbHandleList
			? selList.Convert()
			: [selList];
	}
	if (plman.PlaylistCount <= playlistIndex) { return; }
	plman.UndoBackup(playlistIndex);
	let handleList = plman.GetPlaylistItems(playlistIndex);
	if (!handleList || !handleList.Count) { return; }
	for (const sel of selList) {
		handleList.Remove(sel);
	}
	plman.ClearPlaylist(playlistIndex);
	plman.InsertPlaylistItems(playlistIndex, 0, handleList);
}

function findInPlaylists(selList = fb.GetFocusItem(), lockType = []) {
	if (!selList) { return []; }
	if (!Array.isArray(selList)) {
		selList = selList instanceof FbMetadbHandleList
			? selList.Convert()
			: [selList];
	}
	let inPlaylist = [];
	let inPlaylistSet = new Set();
	const bAll = !!lockType.length;
	const playlists = [];
	const plsCount = plman.PlaylistCount;
	for (const sel of selList) {
		for (let i = 0; i < plsCount; i++) {
			if (!inPlaylistSet.has(i)) {
				if (!playlists[i]) { playlists[i] = plman.GetPlaylistItems(i); playlists[i].Sort(); }
				if (playlists[i].BSearch(sel) !== -1) {
					const lockActions = plman.GetPlaylistLockedActions(i);
					const bLocked = bAll ? lockActions.length : new Set(lockActions).isSuperset(new Set(lockType));
					inPlaylist.push({ index: i, name: plman.GetPlaylistName(i), bLocked });
					inPlaylistSet.add(i);
				}
			}
		}
	}
	return inPlaylist;
}

function focusInPlaylist(selList, playlistIndex) {
	if (!selList) { return; }
	if (!Array.isArray(selList)) {
		selList = selList instanceof FbMetadbHandleList
			? selList.Convert()
			: [selList];
	}
	if (plman.PlaylistCount <= playlistIndex) { return; }
	let idx = -1;
	const handleList = plman.GetPlaylistItems(playlistIndex);
	plman.ActivePlaylist = playlistIndex;
	plman.ClearPlaylistSelection(playlistIndex);
	for (const sel of selList) {
		idx = handleList.Find(sel);
		if (idx !== -1) { plman.SetPlaylistSelection(plman.ActivePlaylist, [idx], true); }
	}
	plman.SetPlaylistFocusItem(plman.ActivePlaylist, idx);
}