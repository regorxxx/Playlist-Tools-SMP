'use strict';
//27/07/23

/* 
	Top Rated Tracks
	Search n most rated tracks on library. Sorting is done by play count by default.
	Duplicates by title - album artist - date are removed, so it doesn't output the same tracks
	multiple times like an auto-playlist does (if you have multiple versions of the same track).
 */

include('..\\..\\helpers\\helpers_xxx_playlists.js');
include('..\\filter_and_query\\remove_duplicates.js');
if (!isPlayCount) {fb.ShowPopupMessage('top_rated_tracks: foo_playcount component is not installed.');}

// Top n Rated Tracks
function topRatedTracks({
						playlistLength = 50, 
						sortBy = globTags.sortPlayCount, 
						checkDuplicatesBy = globTags.remDupl,
						checkDuplicatesBias = globQuery.remDuplBias,
						bAdvTitle = true,
						forcedQuery = '',
						ratingLimits = [1,5],
						ratingTag = globTags.rating,
						playlistName = 'Top ' + playlistLength + ' Rated Tracks',
						bSendToPls = true,
						bProfile = false
					} = {}) {
	if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('topRatedTracks: playlistLength (' + playlistLength + ') must be greater than zero'); return;}
	try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
	catch (e) {fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery); return;}
	if (bProfile) {var test = new FbProfiler('topRatedTracks');}
	// Check rating tag
	let bFunc = false;
	if (ratingTag.indexOf('$') === -1) {
		if (ratingTag.indexOf('%') === -1) {ratingTag = '%' + ratingTag + '%';}
	} else {bFunc = true;}
	let outputHandleList = new FbMetadbHandleList();
	let currRating = ratingLimits[1];
	let ratingBreak = Math.ceil(ratingLimits[1] / 2);
	while (outputHandleList.Count < playlistLength) {
		if (currRating < ratingBreak) {break;}
		//Load query
		let query = (bFunc ? '"' + ratingTag + '"' : ratingTag) + ' EQUAL ' + currRating;
		let handleList_i;
		query = forcedQuery.length ? '(' + query + ') AND (' + forcedQuery + ')' : query;
		try {handleList_i = fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query); return;}
		//Find and remove duplicates
		if (checkDuplicatesBy !== null && checkDuplicatesBy.length) {
			handleList_i = removeDuplicatesV2({handleList: handleList_i, sortOutput: sortBy, checkKeys: checkDuplicatesBy, sortBias: checkDuplicatesBias, bAdvTitle});
		}
		outputHandleList.AddRange(handleList_i);
		currRating--;
	}
	// Output n tracks
	outputHandleList.RemoveRange(playlistLength, outputHandleList.Count);
	if (bSendToPls) {sendToPlaylist(outputHandleList, playlistName);}
	if (bProfile) {test.Print('Task #1: Top rated tracks', false);}
	return outputHandleList;
}