'use strict';

/*
	Dynamic Query 0.1 28/04/21
	Filters library using query evaluated with selection
*/	

function do_dynamic_query({query = 'ARTIST IS #ARTIST#', handle = fb.GetFocusItem(true), playlistName = 'Search...', bSendToPls = true} = {}) {
	if (!query || !query.length) {return null;}
	if (!handle) {return null}
	
	if (query.indexOf('#') != -1) {query = queryReplaceWithCurrent(query, handle);}
	try {fb.GetQueryItems(new FbMetadbHandleList(), query);}
	catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, 'do_dynamic_query'); return null;}
	let handleList = fb.GetQueryItems(fb.GetLibraryItems(), query);
	
	// Clear playlist if needed. Preferred to removing it, since then we could undo later...
	// Look if target playlist already exists
	if (bSendToPls) {
		let i = 0;
		let plc = plman.PlaylistCount;
		while (i < plc) {
			if (plman.GetPlaylistName(i) == playlistName) {
				plman.ActivePlaylist = i;
				break;
			} else {
				i++;
			}
		}
		if (i == plc) { //if no playlist was found before
			plman.CreatePlaylist(plc, playlistName);
			plman.ActivePlaylist = plc;
		}
		if (plman.PlaylistItemCount(plman.ActivePlaylist)) {
			plman.UndoBackup(plman.ActivePlaylist);
			plman.ClearPlaylist(plman.ActivePlaylist);
		}
		// Create playlist
		console.log('Query: ' +  query);
		console.log('Final selection: ' +  handleList.Count  + ' tracks');
		plman.InsertPlaylistItems(plman.ActivePlaylist, 0, handleList);
	}
	return handleList;
}