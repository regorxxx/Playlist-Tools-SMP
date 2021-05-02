'use strict';

/* 
	Top Tracks v 1.0 28/01/20
	Search n most played tracks on library. Sorting is done by play count by default.
	Duplicates by title - artist - date are removed, so it doesn't output the same tracks
	multiple times like an auto-playlist does (if you have multiple versions of the same track).
 */

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\remove_duplicates.js');
if (!utils.CheckComponent("foo_playcount")) {fb.ShowPopupMessage('top_tracks: foo_playcount component is not installed. Script can not work without it.');}

// Top n Tracks
function do_top_tracks({
						playlistLength = 25, 
						sortBy = "$sub(99999,%play_count%)", 
						checkDuplicatesBy = ["title", "artist", "date"],
						forcedQuery = 'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1)',
					} = {}) {
		if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('do_top_tracks: playlistLength (' + playlistLength + ') must be greater than zero'); return;}
		try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery); return;}
        const playlist_name = 'Top ' + playlistLength + ' Tracks';
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
		
		//Load query
		let query = "%play_count% GREATER 1";
		let handleList;
		query = forcedQuery.length ? '(' + query + ') AND (' + forcedQuery + ')' : query;
		console.log("Query created: " + query);
		try {handleList = fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query); return;}
		
		//Find and remove duplicates
		if (checkDuplicatesBy !== null) {
			handleList = do_remove_duplicatesV2(handleList, sortBy, checkDuplicatesBy);
		}
		
		// Output n tracks
		handleList.RemoveRange(playlistLength, handleList.Count);
		
		// Clear playlist if needed. Preferred to removing it, since then we could undo later...
		if (plman.PlaylistItemCount(plman.ActivePlaylist)) {
			plman.UndoBackup(plman.ActivePlaylist);
			plman.ClearPlaylist(plman.ActivePlaylist);
		}
		
		//Insert to playlist
		plman.InsertPlaylistItems(plman.ActivePlaylist, 0, handleList);
		
        console.log("Playlist created: " + playlist_name);
		console.log("Items retrieved by query: " + handleList.Count  + " tracks");
}