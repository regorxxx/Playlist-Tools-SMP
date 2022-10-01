'use strict';
//29/06/22

/* 
	Top Rated Tracks
	Search n most rated tracks on library. Sorting is done by play count by default.
	Duplicates by title - artist - date are removed, so it doesn't output the same tracks
	multiple times like an auto-playlist does (if you have multiple versions of the same track).
 */

include('..\\helpers\\helpers_xxx_playlists.js');
include('remove_duplicates.js');
if (!(isCompatible('2.0', 'fb') || utils.CheckComponent('foo_playcount')) ) {fb.ShowPopupMessage('top_rated_tracks: foo_playcount component is not installed. Script can not work without it.');}

// Top n Rated Tracks
function do_top_rated_tracks({
						playlistLength = 50, 
						sortBy = '$sub(99999,%PLAY_COUNT%)', 
						checkDuplicatesBy = ['$ascii($lower($trim(%TITLE%)))', 'ARTIST', '$year(%DATE%)'],
						forcedQuery = '',
						ratingLimits = [1,5],
						ratingTag = 'RATING',
						playlistName = 'Top ' + playlistLength + ' Rated Tracks',
						bSendToPls = true,
						bProfile = false
					} = {}) {
	if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('do_top_tracks: playlistLength (' + playlistLength + ') must be greater than zero'); return;}
	try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
	catch (e) {fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery); return;}
	if (bProfile) {var test = new FbProfiler('do_top_rated_tracks');}
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
		if (checkDuplicatesBy !== null) {
			handleList_i = removeDuplicatesV2({handleList: handleList_i, sortOutput: sortBy, checkKeys: checkDuplicatesBy});
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