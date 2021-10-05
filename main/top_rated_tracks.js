'use strict';

/* 
	Top Rated Tracks v 1.0 15/04/21
	Search n most rated tracks on library. Sorting is done by play count by default.
	Duplicates by title - artist - date are removed, so it doesn't output the same tracks
	multiple times like an auto-playlist does (if you have multiple versions of the same track).
 */

include('remove_duplicates.js');
if (!utils.CheckComponent('foo_playcount')) {fb.ShowPopupMessage('top_rated_tracks: foo_playcount component is not installed. Script can not work without it.');}

// Top n Rated Tracks
function do_top_rated_tracks({
						playlistLength = 50, 
						sortBy = '$sub(99999,%play_count%)', 
						checkDuplicatesBy = ['title', 'artist', 'date'],
						forcedQuery = '',
						ratingLimits = [1,5],
						ratingTag = 'rating',
						playlistName = 'Top ' + playlistLength + ' Rated Tracks',
					} = {}) {
		if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('do_top_tracks: playlistLength (' + playlistLength + ') must be greater than zero'); return;}
		try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery); return;}
		// Look if target playlist already exists and clear it. Preferred to removing it, since then we could undo later...
		let i = 0;
		let plc = plman.PlaylistCount;
        while (i < plc) {
            if (plman.GetPlaylistName(i) === playlistName) {
				plman.ActivePlaylist = i;
				break;
            } else {
                i++;
			}
        }
		if (i === plc) { //if no playlist was found before
			plman.CreatePlaylist(plc, playlistName);
			plman.ActivePlaylist = plc;
		}
		// Check date tag
		let bFunc = false;
		if (ratingTag.indexOf('$') === -1) {
			if (ratingTag.indexOf('%') === -1) {ratingTag = '%' + ratingTag + '%';}
		} else {bFunc = true;}
		let handleList = new FbMetadbHandleList();
		let currRating = ratingLimits[1];
		let ratingBreak = Math.ceil(ratingLimits[1] / 2);
		while (handleList.Count < playlistLength) {
			if (currRating < ratingBreak) {break;}
			//Load query
			let query = (bFunc ? '"' + ratingTag + '"' : ratingTag) + ' EQUAL ' + currRating;
			let handleList_i;
			query = forcedQuery.length ? '(' + query + ') AND (' + forcedQuery + ')' : query;
			console.log('Query created: ' + query);
			try {handleList_i = fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
			catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query); return;}
			//Find and remove duplicates
			if (checkDuplicatesBy !== null) {
				handleList_i = do_remove_duplicates(handleList_i, sortBy, checkDuplicatesBy);
			}
			handleList.AddRange(handleList_i);
			currRating--;
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
		
        console.log('Playlist created: ' + playlistName);
		console.log('Items retrieved by query: ' + handleList.Count  + ' tracks');
}