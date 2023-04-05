'use strict';
//27/03/23

/* 
	Top X Tracks From Date
	Search n most played tracks from a given year on library. Sorting is done by play count by default.
	Duplicates by title - artist - date are removed, so it doesn't output the same tracks
	multiple times like an auto-playlist does (if you have multiple versions of the same track).
 */

include('..\\..\\helpers\\helpers_xxx_playlists.js');
include('..\\filter_and_query\\remove_duplicates.js');
if (!isPlayCount) {fb.ShowPopupMessage('top_tracks_from_date: foo_playcount component is not installed.');}

const timeKeys = {Days: daysBetween, Weeks: weeksBetween};

// Most played n Tracks from date
function topTracksFromDate({
						playlistLength = 25, 
						sortBy = globTags.sortPlayCount, 
						checkDuplicatesBy = globTags.remDupl,
						bAdvTitle = true,
						year =  new Date().getFullYear() - 1, // Previous year
						last = '1 WEEKS',
						bUseLast = false,
						forcedQuery = globQuery.notLowRating,
						bSendToPls = true,
						bProfile = false
						} = {}) {
	// Sanity checks
	if (!isEnhPlayCount)  {fb.ShowPopupMessage('top_tracks_from_date: foo_enhanced_playcount is not installed.', 'topTracksFromDate'); return;}
	if (playlistLength !== Infinity && !Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('topTracksFromDate: playlistLength (' + playlistLength + ') must be an integer greater than zero'); return;}
	try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);}
	catch (e) {fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery, 'topTracksFromDate'); return;}
	last = last.trim();
	if (bUseLast && !last.length) {fb.ShowPopupMessage('Time period string is empty:\n' + last, 'topTracksFromDate'); return;}
	// Find time-unit
	let timeKey = '';
	let timePeriod = Number(last.split(' ')[0]);
	if (!Number.isSafeInteger(timePeriod)) {fb.ShowPopupMessage('Time period is not a valid number:\n' + timePeriod, 'topTracksFromDate'); return;}
	if (!Object.keys(timeKeys).some( (key) => {if (last.toLowerCase().indexOf(key.toLowerCase()) !== -1) {timeKey = key; return true;} else {return false;}})) {
		fb.ShowPopupMessage('Time-unit not valid (must be ' + Object.keys(timeKeys).join(', ') + '):\n' + last, 'topTracksFromDate');
		return;
	}
	if (bProfile) {var test = new FbProfiler('topTracksFromDate');}
	// Load query
	const query = bUseLast 
		? '%LAST_PLAYED_ENHANCED% DURING LAST ' + last.toUpperCase()
		: '%LAST_PLAYED_ENHANCED% AFTER ' + year + '-01-01 AND NOT %FIRST_PLAYED_ENHANCED% AFTER ' + (year + 1) + '-01-01';
	let outputHandleList;
	try {outputHandleList = fb.GetQueryItems(fb.GetLibraryItems(), (forcedQuery.length ? _p(query) + ' AND ' + _p(forcedQuery) : query));} // Sanity check
	catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + (forcedQuery.length ? _p(query) + ' AND ' + _p(forcedQuery) : query), 'topTracksFromDate'); return;}
	// Find and remove duplicates
	if (checkDuplicatesBy !== null && checkDuplicatesBy.length) {
		outputHandleList = removeDuplicatesV2({handleList: outputHandleList, sortOutput: sortBy, checkKeys: checkDuplicatesBy, bAdvTitle});
	}
	// Filter Play counts by date
	const datesArray = fb.TitleFormat(_bt('PLAYED_TIMES')).EvalWithMetadbs(outputHandleList);
	const datesLastFMArray = fb.TitleFormat(_bt('LASTFM_PLAYED_TIMES')).EvalWithMetadbs(outputHandleList);
	const lastPlayedArray = fb.TitleFormat(_bt('LAST_PLAYED_ENHANCED')).EvalWithMetadbs(outputHandleList);
	const firstPlayedArray = fb.TitleFormat(_bt('FIRST_PLAYED_ENHANCED')).EvalWithMetadbs(outputHandleList);
	const playCountArray = fb.TitleFormat(_b(globTags.playCount)).EvalWithMetadbs(outputHandleList);
	const datesArrayLength = datesArray.length;
	let dataPool = [];
	let pool = [];
	if (bUseLast) { // During X time...
		const currentDate = new Date();	
		for (let i = 0; i < datesArrayLength; i++) {
		let count = 0;
			let dateArray_i = JSON.parse(datesArray[i]).concat(JSON.parse(datesLastFMArray[i])); 
			if (dateArray_i.length) { // Every entry is also an array of dates
				dateArray_i.forEach( (date) => {
					const temp = date.substring(0, 10).split('-');
					if (temp.length === 3 && timeKeys[timeKey](new Date(temp[0],temp[1],temp[2]), currentDate) <= timePeriod) {count++;}
				});
			} else { // For tracks without advanced statistics
				const tempFirst = firstPlayedArray[i].substring(0, 10).split('-');
				if (tempFirst.length !== 3) {continue;}
				const diffFirst = timeKeys[timeKey](new Date(tempFirst[0],tempFirst[1],tempFirst[2], currentDate));
				const tempLast = lastPlayedArray[i].substring(0, 10).split('-');
				if (tempLast.length !== 3) {continue;}
				const diffLast = timeKeys[timeKey](new Date(tempLast[0],tempLast[1],tempLast[2], currentDate));
				// If first and last plays were from selected period, then all play counts too
				if (diffFirst <= timePeriod && diffLast <= timePeriod) {count += playCountArray[i];}
				// Or the first play
				else if (diffFirst <= timePeriod) {count++;}
				// Or the last play
				else if (diffLast <= timePeriod) {count++;}
				// Note any track known to have been played at selected period will be added to the pool, and since the handle List is already
				// sorted by play Count, it will output tracks with higher total counts when they have not advanced statistics
				// being almost equivalent to 'top_tracks.js' in that case
			}
			if (count) {
				dataPool.push({idx: i, playCount: count});
			}
		}
	} else {// Equal to year..
		for (let i = 0; i < datesArrayLength; i++) {
			let count = 0;
			let dateArray_i = JSON.parse(datesArray[i]).concat(JSON.parse(datesLastFMArray[i])); 
			if (dateArray_i.length) { // Every entry is also an array of dates
				dateArray_i.forEach( (date) => {
					if (Number(date.substring(0, 4)) === year) {count++;}
				});
			} else { // For tracks without advanced statistics
				// If first and last plays were from selected year, then all play counts too
				if (Number(firstPlayedArray[i].substring(0, 4)) === year && Number(lastPlayedArray[i].substring(0, 4)) === year) {count += playCountArray[i];}
				// Or the first play
				else if (Number(firstPlayedArray[i].substring(0, 4)) === year) {count++;}
				// Or the last play
				else if (Number(lastPlayedArray[i].substring(0, 4)) === year) {count++;}
				// Note any track known to have been played at selected year will be added to the pool, and since the handle List is already
				// sorted by play Count, it will output tracks with higher total counts when they have not advanced statistics
				// being almost equivalent to 'top_tracks.js' in that case
			}
			if (count) {
				dataPool.push({idx: i, playCount: count});
			}
		}	
	}
	// Order by Play Count
	dataPool.sort(function (a, b) {return b.playCount - a.playCount;});
	dataPool.forEach((item) => pool.push(outputHandleList[item.idx]));
	// dataPool.forEach((item) => console.log(item.idx,item.playCount));
	outputHandleList = new FbMetadbHandleList(pool);
	// Output n tracks
	if (playlistLength < outputHandleList.Count) {outputHandleList.RemoveRange(playlistLength, outputHandleList.Count);}
	const playlistName = bUseLast ? 'Top ' + (playlistLength !== Infinity ? playlistLength + ' ' : '') + 'Tracks from last ' + timePeriod + ' ' + timeKey : 'Top ' + playlistLength + ' Tracks ' + year;
	if (bSendToPls) {sendToPlaylist(outputHandleList, playlistName);}
	if (bProfile) {test.Print('Task #1: Top tracks from date', false);}
	return [outputHandleList, dataPool];
}

function weeksBetween(d1, d2) { // d1 and d2 are Dates objects
    return Math.round((d2 - d1) / (7 * 24 * 60 * 60 * 1000));
}

function daysBetween(d1, d2) { // d1 and d2 are Dates objects
    return Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
}