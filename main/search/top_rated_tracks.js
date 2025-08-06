'use strict';
//06/08/25

/*
	Top Rated Tracks
	Search n most rated tracks on library. Sorting is done by play count by default.
	Duplicates by title - album artist - date are removed, so it doesn't output the same tracks
	multiple times like an auto-playlist does (if you have multiple versions of the same track).
 */

/* exported topRatedTracks */

include('..\\..\\helpers\\helpers_xxx.js');
/* global globTags:readable, globQuery:readable, isPlayCount:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist:readable */
include('..\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicates:readable */
if (!isPlayCount) { fb.ShowPopupMessage('top_rated_tracks: foo_playcount component is not installed.'); }

// Top n Rated Tracks
function topRatedTracks({
	playlistLength = 50,
	sortBy = globTags.sortPlayCount,
	checkDuplicatesBy = globTags.remDupl,
	checkDuplicatesBias = globQuery.remDuplBias,
	bAdvTitle = true,
	bMultiple = true,
	forcedQuery = '',
	ratingLimits = [1, 5],
	ratingTag = globTags.rating,
	playlistName = 'Top ' + playlistLength + ' Rated Tracks',
	bSendToPls = true,
	bProfile = false
} = {}) {
	if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) { console.log('topRatedTracks: playlistLength (' + playlistLength + ') must be greater than zero'); return; }
	try { fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery); } // Sanity check
	catch (e) { fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery); return; } // eslint-disable-line no-unused-vars
	const test = bProfile ? new FbProfiler('topRatedTracks') : null;
	// Check rating tag
	let bFunc = false;
	if (!ratingTag.includes('$')) {
		if (!ratingTag.includes('%')) { ratingTag = '%' + ratingTag + '%'; }
	} else { bFunc = true; }
	let outputHandleList = new FbMetadbHandleList();
	let currRating = ratingLimits[1];
	let ratingBreak = Math.ceil(ratingLimits[1] / 2);
	while (outputHandleList.Count < playlistLength) {
		if (currRating < ratingBreak) { break; }
		//Load query
		let query = (bFunc ? '"' + ratingTag + '"' : ratingTag) + ' EQUAL ' + currRating;
		let handleList_i;
		query = forcedQuery.length ? '(' + query + ') AND (' + forcedQuery + ')' : query;
		try { handleList_i = fb.GetQueryItems(fb.GetLibraryItems(), query); } // Sanity check
		catch (e) { fb.ShowPopupMessage('Query not valid. Check query:\n' + query); return; } // eslint-disable-line no-unused-vars
		//Find and remove duplicates
		if (checkDuplicatesBy !== null && checkDuplicatesBy.length) {
			handleList_i = removeDuplicates({ handleList: handleList_i, sortOutput: globTags.sortPlayCount, checkKeys: checkDuplicatesBy, sortBias: checkDuplicatesBias, bAdvTitle, bMultiple });
		}
		outputHandleList.AddRange(handleList_i);
		currRating--;
	}
	// Output n tracks
	outputHandleList.RemoveRange(playlistLength, outputHandleList.Count - 1);
	if (globTags.sortPlayCount !== sortBy) { outputHandleList.OrderByFormat(fb.TitleFormat(sortBy || '$rand()'), 1); }
	if (bSendToPls) { sendToPlaylist(outputHandleList, playlistName); }
	if (bProfile) { test.Print('Task #1: Top rated tracks', false); }
	return outputHandleList;
}