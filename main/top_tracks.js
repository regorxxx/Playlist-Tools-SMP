'use strict';
//24/10/22

/* 
	Top Tracks
	Search n most played tracks on library. Sorting is done by play count by default.
	Duplicates by title - artist - date are removed, so it doesn't output the same tracks
	multiple times like an auto-playlist does (if you have multiple versions of the same track).
 */
 
include('..\\helpers\\helpers_xxx_playlists.js');
include('remove_duplicates.js');
if (!(isCompatible('2.0', 'fb') || utils.CheckComponent('foo_playcount'))) {fb.ShowPopupMessage('top_tracks: foo_playcount component is not installed. Script can not work without it.');}

// Top n Tracks
function topTracks({
						playlistLength = 25, 
						sortBy = globTags.sortPlayCount, 
						checkDuplicatesBy = globTags.remDupl,
						bAdvTitle = true,
						forcedQuery = globQuery.notLowRating,
						playlistName = 'Top ' + playlistLength + ' Tracks',
						bSendToPls = true,
						bProfile = false
					} = {}) {
	if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('topTracks: playlistLength (' + playlistLength + ') must be greater than zero'); return;}
	try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
	catch (e) {fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery); return;}
	if (bProfile) {var test = new FbProfiler('topTracks');}
	//Load query
	let query = _q(globTags.playCount) + ' GREATER 1';
	let outputHandleList;
	query = forcedQuery.length ? '(' + query + ') AND (' + forcedQuery + ')' : query;
	try {outputHandleList = fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
	catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query); return;}
	//Find and remove duplicates
	if (checkDuplicatesBy !== null) {
		outputHandleList = removeDuplicatesV2({handleList: outputHandleList, sortOutput: sortBy, checkKeys: checkDuplicatesBy, bAdvTitle});
	}
	// Output n tracks
	outputHandleList.RemoveRange(playlistLength, outputHandleList.Count);
	if (bSendToPls) {sendToPlaylist(outputHandleList, playlistName);}
	if (bProfile) {test.Print('Task #1: Top tracks from date', false);}
	return outputHandleList;
}