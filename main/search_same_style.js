'use strict';

/* 
	Search same style v 1.0 28/01/20
	Search n tracks (randomly) on library with the same style(s) than the current selected track.
	You can configure the number of tracks at properties panel. Also forced query to pre-filter tracks.
	
	NOTE: If you want to use arbitrary tags, use "search_same_by.js" instead.
 */

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\main\\remove_duplicates.js');
 
function do_search_same_style(	playlistLength = 50, 
								forcedQuery = "NOT (%rating% EQUAL 2 OR %rating% EQUAL 1) AND NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi) AND %channels% LESS 3 AND NOT COMMENT HAS Quad",
								sortBy = "", 
								checkDuplicatesBy = ["title", "artist", "date"]) {
		if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('do_search_same_style: playlistLength (' + playlistLength + ') must be greater than zero'); return;}
		try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery); return;}
        let playlist_name = "Search...";
		let sel = fb.GetFocusItem();
        if (!sel) {
			console.log('No track selected for mix.');
            return;
		}
		// Look if target playlist already exists and clear it. Preferred to removing it, since then we could undo later...
		let i = 0;
		let plc = plman.PlaylistCount;
        while (i < plc) {
            if (plman.GetPlaylistName(i) === playlist_name) {
				plman.ActivePlaylist = i;
				break;
            } else {
                i++;
			}
        }
		if (i === plc) { //if no playlist was found before
			plman.CreatePlaylist(plc, playlist_name);
			plman.ActivePlaylist = plc;
		}
		
		let sel_info = sel.GetFileInfo();
        //Loop styles
		let styleIdx = sel_info.MetaFind("style");
        let styleNumber = (styleIdx !== -1) ? sel_info.MetaValueCount(styleIdx) : 0;
		if (styleNumber === 0) {
			console.log('Track selected has no "style" tag');
			return;
		}
        let style = [];
        style.length = styleNumber;
        i = 0;
        while (i < styleNumber) {
            style[i] = sel_info.MetaValue(styleIdx,i);
            i++;
        }
        let query = "";
		query += query_combinations(style, "style", "AND");
		if (forcedQuery) {
			query = "(" + query + ") AND " + forcedQuery;
		}
		
		//Load query
		let queryhandle_list;
		try {queryhandle_list = fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query); return;}

		//Find and remove duplicates. Sort Random
		if (checkDuplicatesBy !== null) {
			queryhandle_list = do_remove_duplicatesV2(queryhandle_list, sortBy, checkDuplicatesBy);
		}
		
		let oldCount = queryhandle_list.Count;
		//Limit n tracks
		queryhandle_list.RemoveRange(playlistLength, queryhandle_list.Count);
		
		// Clear playlist if needed. Preferred to removing it, since then we could undo later...
		if (plman.PlaylistItemCount(plman.ActivePlaylist)) {
			plman.UndoBackup(plman.ActivePlaylist);
			plman.ClearPlaylist(plman.ActivePlaylist);
		}
		
		//Insert to playlist
		plman.InsertPlaylistItems(plman.ActivePlaylist, 0, queryhandle_list);
		
        console.log("Playlist created: " + query);
		console.log("Items retrieved by query: " + oldCount + " tracks");
		console.log("Final selection: " +  queryhandle_list.Count  + " tracks");
}