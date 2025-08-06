﻿'use strict';
//06/08/25

/*
	Top Tracks
	Search n most played tracks on library. Sorting is done by play count by default.
	Duplicates by title - album artist - date are removed, so it doesn't output the same tracks
	multiple times like an auto-playlist does (if you have multiple versions of the same track).
 */

/* exported topTracks */

/* global isPlayCount:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global globTags:readable, globQuery:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _q:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist:readable */
include('..\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicates:readable */
if (!isPlayCount) {fb.ShowPopupMessage('top_tracks: foo_playcount component is not installed.');}

// Top n Tracks
function topTracks({
	playlistLength = 25,
	sortBy = globTags.sortPlayCount,
	checkDuplicatesBy = globTags.remDupl,
	checkDuplicatesBias = globQuery.remDuplBias,
	bAdvTitle = true,
	bMultiple = true,
	forcedQuery = globQuery.notLowRating,
	playlistName = 'Top ' + playlistLength + ' Tracks',
	bSendToPls = true,
	bProfile = false
} = {}) {
	if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('topTracks: playlistLength (' + playlistLength + ') must be greater than zero'); return;}
	try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
	catch (e) {fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery); return;} // eslint-disable-line no-unused-vars
	const test = bProfile ? new FbProfiler('topTracks') : null;
	//Load query
	let query = _q(globTags.playCount) + ' GREATER 1';
	let outputHandleList;
	query = forcedQuery.length ? '(' + query + ') AND (' + forcedQuery + ')' : query;
	try {outputHandleList = fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
	catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query); return;} // eslint-disable-line no-unused-vars
	//Find and remove duplicates
	if (checkDuplicatesBy !== null && checkDuplicatesBy.length) {
		outputHandleList = removeDuplicates({handleList: outputHandleList, sortOutput: globTags.sortPlayCount, checkKeys: checkDuplicatesBy, sortBias: checkDuplicatesBias, bAdvTitle, bMultiple});
	}
	// Output n tracks
	outputHandleList.RemoveRange(playlistLength, outputHandleList.Count - 1);
	if (globTags.sortPlayCount !== sortBy) {outputHandleList.OrderByFormat(fb.TitleFormat(sortBy ||'$rand()'), 1);}
	if (bSendToPls) {sendToPlaylist(outputHandleList, playlistName);}
	if (bProfile) {test.Print('Task #1: Top tracks from date', false);}
	return outputHandleList;
}