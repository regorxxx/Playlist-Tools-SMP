'use strict';
//13/04/24

/*
	Top X Tracks From Date
	Search n most played tracks from a given year on library. Sorting is done by play count by default.
	Duplicates by title - album artist - date are removed, so it doesn't output the same tracks
	multiple times like an auto-playlist does (if you have multiple versions of the same track).
 */

/* exported topTracksFromDate, getPlayCount, getSkipCount */

include('..\\..\\helpers\\helpers_xxx.js');
/* global globTags:readable, globQuery:readable, isEnhPlayCount:readable, isPlayCount:readable, isSkipCount:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _p:readable, _bt:readable, _b:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist:readable */
include('..\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicatesV2:readable */
const timeKeys = { Days: daysBetween, Weeks: weeksBetween };

/**
 * Most played n Tracks from date (may be a single year or a period using 'last x weeks')
 *
 * @function
 * @name topTracksFromDate
 * @kind function
 * @param {Object} [o={}] - Arguments
 * @param {number} [o.playlistLength=25] - N tracks to retrieve
 * @param {string} [o.sortBy=globTags.sortPlayCount] - TF expression to sort FbMetadbHandleList
 * @param {string[]} [o.checkDuplicatesBy=globTags.remDupl] - Duplication removal tags
 * @param {string} [o.checkDuplicatesBias=globQuery.remDuplBias] - Duplication removal bias
 * @param {boolean} [o.bAdvTitle=true] - Duplication removal by RegExp
 * @param {number} [o.year=new Date().getFullYear() - 1] - Year for lookup
 * @param {string} [o.last='1 WEEKS'] - Time period for lookup (bUseLast must be true)
 * @param {boolean} [o.bUseLast=false] - Use the period method instead of year
 * @param {string} [o.forcedQuery=globQuery.notLowRating] - Query filter
 * @param {boolean} [o.bSendToPls=true] - Send FbMetadbHandleList to new playlist
 * @param {boolean} [o.bProfile=false] - Enable profiling log
 */
function topTracksFromDate({
	playlistLength = 25,
	sortBy = globTags.sortPlayCount,
	checkDuplicatesBy = globTags.remDupl,
	checkDuplicatesBias = globQuery.remDuplBias,
	bAdvTitle = true,
	year = new Date().getFullYear() - 1, // Previous year
	last = '1 WEEKS',
	bUseLast = false,
	forcedQuery = globQuery.notLowRating,
	bSendToPls = true,
	bProfile = false
} = {}) {
	// Sanity checks
	if (!isPlayCount) { fb.ShowPopupMessage('top_tracks_from_date: foo_playcount component is not installed.', window.Name); return; }
	if (!isEnhPlayCount) { fb.ShowPopupMessage('top_tracks_from_date: foo_enhanced_playcount is not installed.', window.Name); return; }
	if (playlistLength !== Infinity && !Number.isSafeInteger(playlistLength) || playlistLength <= 0) { console.log('topTracksFromDate: playlistLength (' + playlistLength + ') must be an integer greater than zero'); return; }
	try { fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery); }
	catch (e) { fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery, 'topTracksFromDate'); return; }
	let timeKey, timePeriod;
	if (bUseLast) {
		if (last && typeof last === 'string') { last = last.trim(); }
		else { last = ''; }
		if (!last.length) { fb.ShowPopupMessage('Time period string is empty:\n' + last, 'topTracksFromDate'); return; }
		// Find time-unit
		timeKey = '';
		timePeriod = Number(last.split(' ')[0]);
		if (!Number.isSafeInteger(timePeriod)) { fb.ShowPopupMessage('Time period is not a valid number:\n' + timePeriod, 'topTracksFromDate'); return; }
		if (!Object.keys(timeKeys).some((key) => { if (last.toLowerCase().indexOf(key.toLowerCase()) !== -1) { timeKey = key; return true; } else { return false; } })) {
			fb.ShowPopupMessage('Time-unit not valid (must be ' + Object.keys(timeKeys).join(', ') + '):\n' + last, 'topTracksFromDate');
			return;
		}
	}
	const test = bProfile ? new FbProfiler('topTracksFromDate') : null;
	// Load query
	const query = bUseLast
		? '%LAST_PLAYED_ENHANCED% DURING LAST ' + last.toUpperCase()
		: '%LAST_PLAYED_ENHANCED% AFTER ' + year + '-01-01 AND NOT %FIRST_PLAYED_ENHANCED% AFTER ' + (year + 1) + '-01-01';
	let outputHandleList;
	try { outputHandleList = fb.GetQueryItems(fb.GetLibraryItems(), (forcedQuery.length ? _p(query) + ' AND ' + _p(forcedQuery) : query)); } // Sanity check
	catch (e) { fb.ShowPopupMessage('Query not valid. Check query:\n' + (forcedQuery.length ? _p(query) + ' AND ' + _p(forcedQuery) : query), 'topTracksFromDate'); return; }
	// Find and remove duplicates
	if (checkDuplicatesBy !== null && checkDuplicatesBy.length) {
		outputHandleList = removeDuplicatesV2({ handleList: outputHandleList, sortOutput: sortBy, checkKeys: checkDuplicatesBy, sortBias: checkDuplicatesBias, bAdvTitle });
	}
	// Filter Play counts by date
	const dataPool = bUseLast
		? getPlayCount(outputHandleList, timePeriod, timeKey).filter((v) => v.playCount)
		: getPlayCount(outputHandleList, year).filter((v) => v.playCount);
	let pool = [];
	// Order by Play Count
	dataPool.sort(function (a, b) { return b.playCount - a.playCount; });
	dataPool.forEach((item) => pool.push(outputHandleList[item.idx]));
	outputHandleList = new FbMetadbHandleList(pool);
	// Output n tracks
	if (playlistLength < outputHandleList.Count) { outputHandleList.RemoveRange(playlistLength, outputHandleList.Count); }
	const playlistName = bUseLast ? 'Top ' + (playlistLength !== Infinity ? playlistLength + ' ' : '') + 'Tracks from last ' + timePeriod + ' ' + timeKey : 'Top ' + playlistLength + ' Tracks ' + year;
	if (bSendToPls) { sendToPlaylist(outputHandleList, playlistName); }
	if (bProfile) { test.Print('Task #1: Top tracks from date', false); }
	return [outputHandleList, dataPool];
}

/**
 * Calculates the number of weeks between the two dates.
 *
 * @function
 * @name weeksBetween
 * @kind function
 * @param {Date} d1
 * @param {Date} d2
 * @returns {number}
 */
function weeksBetween(d1, d2) {
	return Math.round((d2.getTime() - d1.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Calculates the number of days between the two dates.
 *
 * @function
 * @name daysBetween
 * @kind function
 * @param {Date} d1
 * @param {Date} d2
 * @returns {number}
 */
function daysBetween(d1, d2) {
	return Math.round((d2.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Creates an arrays of listens between firstListen and lastListen
 *
 * @function
 * @name fakeListens
 * @kind function
 * @param {Date} firstListen
 * @param {Date} lastListen
 * @param {number} total
 * @returns {Date[]}
 */
function fakeListens(firstListen, lastListen, total) {
	const listens = [];
	if (total >= 2) {
		if (total > 2) {
			const diffDays = daysBetween(firstListen, lastListen);
			if (diffDays > 1) {
				let added = 0;
				let listen;
				const range = total > diffDays
					? Math.min(Math.round(total / diffDays), diffDays)
					: Math.min(Math.round(diffDays / total), total);
				const offset = total > diffDays ? 1 : range;
				while (added < (total - range)) {
					for (let i = 0; i <= (diffDays - 1); i++) {
						listen = new Date(firstListen);
						listen.setDate(firstListen.getDate() + Math.min(offset * i, diffDays));
						listens.push(listen);
						added++;
						if (added === (total - range)) { break; }
					}
				}
				while (added < total) { listens.push(new Date(lastListen)); added++; }
			} else {
				for (let i = 0; i <= Math.round(total / 2); i++) { listens.push(new Date(firstListen)); }
				for (let i = Math.round(total / 2) + 1; i <= total; i++) { listens.push(new Date(lastListen)); }
			}
		} else {
			listens.push(firstListen);
			listens.push(lastListen);
		}
		listens.sort((a, b) => a.getTime() - b.getTime());
	} else {
		listens.push(lastListen);
	}
	return listens;
}

/**
 * Retrieves the play count on a time period, which may be a single year or a time unit number (days, weeks) from a reference date
 *
 * @function
 * @name getPlayCount
 * @kind function
 * @param {FbMetadbHandleList} handleList
 * @param {number} timePeriod - Single year or number of time units
 * @param {string} timeKey? - Time units: Days|Weeks
 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
 * @param {boolean} bFakeListens? - Fill listens when there is no play times available
 * @returns {{ idx: number; playCount: number; listens: Date[]; }[]}
 */
function getPlayCount(handleList, timePeriod, timeKey = null, fromDate = new Date(), bFakeListens = true) {
	if (!isPlayCount) { fb.ShowPopupMessage('getPlayCount: foo_playcount component is not installed.', window.Name); return []; }
	if (!isEnhPlayCount) { fb.ShowPopupMessage('getPlayCount: foo_enhanced_playcount is not installed.', window.Name); return []; }
	const datesArray = fb.TitleFormat(_bt('PLAYED_TIMES')).EvalWithMetadbs(handleList);
	const datesLastFMArray = fb.TitleFormat(_bt('LASTFM_PLAYED_TIMES')).EvalWithMetadbs(handleList);
	const lastPlayedArray = fb.TitleFormat(_bt('LAST_PLAYED_ENHANCED')).EvalWithMetadbs(handleList);
	const firstPlayedArray = fb.TitleFormat(_bt('FIRST_PLAYED_ENHANCED')).EvalWithMetadbs(handleList);
	const playCountArray = fb.TitleFormat(_b(globTags.playCount)).EvalWithMetadbs(handleList);
	const datesArrayLength = datesArray.length;
	const deDup = (dateArray) => { // Listens may be duplicated with a second offset
		const dateMap = Object.create(null);
		let i = dateArray.length;
		while (i--) {
			const date = dateArray[i];
			const day = date.substring(0, 10);
			const seconds = parseInt(date.substring(11, 13) * 3600 + date.substring(14, 16) * 60 + date.substring(17));
			const dayArr = dateMap[day];
			if (!dayArr) { dateMap[day] = [seconds]; }
			else {
				if (dayArr.every((listen) => Math.abs(seconds - listen) >= 30)) {
					dayArr.push(seconds);
				} else { dateArray.splice(i, 1); }
			}
		}
		return dateArray;
	};
	let dataPool = [];
	if (timePeriod && timeKey) { // During X time...
		for (let i = 0; i < datesArrayLength; i++) {
			let count = 0;
			const listens = [];
			const dateArray_i = [...new Set(
				JSON.parse(datesArray[i])
					.concat(JSON.parse(datesLastFMArray[i]))
			)];
			const lastLen = datesLastFMArray.length;
			if (lastLen) { deDup(dateArray_i); }
			if (lastLen || dateArray_i.length) { // Every entry is also an array of dates
				dateArray_i.forEach((date) => {
					const temp = date.substring(0, 10).split('-').map(Number);
					const listen = new Date(temp[0], temp[1] - 1, temp[2]);
					if (temp.length === 3 && timeKeys[timeKey](listen, fromDate) <= timePeriod) {
						count++;
						listens.push(listen);
					}
				});
			} else { // For tracks without advanced statistics
				const tempFirst = firstPlayedArray[i].substring(0, 10).split('-').map(Number);
				if (tempFirst.length !== 3) { continue; }
				const firstListen = new Date(tempFirst[0], tempFirst[1] - 1, tempFirst[2]);
				const diffFirst = timeKeys[timeKey](firstListen, fromDate);
				const tempLast = lastPlayedArray[i].substring(0, 10).split('-').map(Number);
				if (tempLast.length !== 3) { continue; }
				const lastListen = new Date(tempLast[0], tempLast[1] - 1, tempLast[2]);
				const diffLast = timeKeys[timeKey](lastListen, fromDate);
				// If first and last plays were from selected period, then all play counts too
				if (diffFirst <= timePeriod && diffLast <= timePeriod) {
					const total = playCountArray[i];
					count += total;
					if (bFakeListens) {
						fakeListens(firstListen, lastListen, total).forEach((listen) => listens.push(listen));
					} else {
						listens.push(firstListen);
						if (total >= 2) {
							if (total > 2) {
								for (let i = 2; i < total; i++) { listens.push(new Date(firstListen)); }
							}
							listens.push(lastListen);
						}
					}
				}
				// Or the first play
				else if (diffFirst <= timePeriod) { count++; listens.push(firstListen); }
				// Or the last play
				else if (diffLast <= timePeriod) { count++; listens.push(lastListen); }
				// Note any track known to have been played at selected period will be added to the pool, and since the handle List is already
				// sorted by play Count, it will output tracks with higher total counts when they have not advanced statistics
				// being almost equivalent to 'top_tracks.js' in that case
			}
			dataPool.push({ idx: i, playCount: count, listens });
		}
	} else { // Equal to year...
		for (let i = 0; i < datesArrayLength; i++) {
			let count = 0;
			const listens = [];
			const dateArray_i = [...new Set(
				JSON.parse(datesArray[i])
					.concat(JSON.parse(datesLastFMArray[i]))
			)];
			const lastLen = datesLastFMArray.length;
			if (lastLen) { deDup(dateArray_i); }
			if (lastLen || dateArray_i.length) { // Every entry is also an array of dates
				dateArray_i.forEach((date) => {
					if (Number(date.substring(0, 4)) === timePeriod) {
						const temp = date.substring(0, 10).split('-', 3).map(Number);
						if (temp.length !== 3) { return; }
						count++;
						listens.push(new Date(temp[0], temp[1] - 1, temp[2]));
					}
				});
			} else { // For tracks without advanced statistics
				// If first and last plays were from selected year, then all play counts too
				if (Number(firstPlayedArray[i].substring(0, 4)) === timePeriod && Number(lastPlayedArray[i].substring(0, 4)) === timePeriod) {
					const tempFirst = firstPlayedArray[i].substring(0, 10).split('-').map(Number);
					if (tempFirst.length !== 3) { continue; }
					const total = playCountArray[i];
					const firstListen = new Date(tempFirst[0], tempFirst[1] - 1, tempFirst[2]);
					const tempLast = lastPlayedArray[i].substring(0, 10).split('-').map(Number);
					if (tempLast.length !== 3) { continue; }
					const lastListen = new Date(tempLast[0], tempLast[1] - 1, tempLast[2]);
					count += total;
					if (bFakeListens) {
						fakeListens(firstListen, lastListen, total).forEach((listen) => listens.push(listen));
					} else {
						listens.push(firstListen);
						if (total >= 2) {
							if (total > 2) {
								for (let i = 2; i < total; i++) { listens.push(new Date(firstListen)); }
							}
							listens.push(lastListen);
						}
					}
				}
				// Or the first play
				else if (Number(firstPlayedArray[i].substring(0, 4)) === timePeriod) {
					const tempFirst = firstPlayedArray[i].substring(0, 10).split('-').map(Number);
					if (tempFirst.length !== 3) { continue; }
					count++;
					listens.push(new Date(tempFirst[0], tempFirst[1] - 1, tempFirst[2]));
				}
				// Or the last play
				else if (Number(lastPlayedArray[i].substring(0, 4)) === timePeriod) {
					const tempLast = lastPlayedArray[i].substring(0, 10).split('-').map(Number);
					if (tempLast.length !== 3) { continue; }
					count++;
					listens.push(new Date(tempLast[0], tempLast[1] - 1, tempLast[2]));
				}
				// Note any track known to have been played at selected year will be added to the pool, and since the handle List is already
				// sorted by play Count, it will output tracks with higher total counts when they have not advanced statistics
				// being almost equivalent to 'top_tracks.js' in that case
			}
			dataPool.push({ idx: i, playCount: count, listens });
		}
	}
	return dataPool;
}

/**
 * Retrieves the skip count on a time period, which may be a single year or a time unit number (days, weeks) from a reference date
 *
 * @function
 * @name getSkipCount
 * @kind function
 * @param {FbMetadbHandleList} handleList
 * @param {number} timePeriod - Single year or number of time units
 * @param {string} timeKey? - Time units: Days|Weeks
 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
 * @returns {{ idx: number; skipCount: number; skips: Date[]; }[]}
 */
function getSkipCount(handleList, timePeriod, timeKey = null, fromDate = new Date()) {
	if (!isSkipCount) { fb.ShowPopupMessage('getSkipCount: foo_skipcount is not installed.', window.Name); return []; }
	const datesArray = fb.TitleFormat(_bt('SKIP_TIMES_JS')).EvalWithMetadbs(handleList);
	const datesArrayLength = datesArray.length;
	let dataPool = [];
	if (timePeriod && timeKey) { // During X time...
		for (let i = 0; i < datesArrayLength; i++) {
			let count = 0;
			const skips = [];
			const dateArray_i = JSON.parse(datesArray[i]);
			if (dateArray_i.length) { // Every entry is also an array of dates
				dateArray_i.forEach((date) => {
					const skip = new Date(date);
					if (timeKeys[timeKey](skip, fromDate) <= timePeriod) {
						count++;
						skips.push(skip);
					}
				});
			}
			dataPool.push({ idx: i, skipCount: count, skips });
		}
	} else { // Equal to year...
		for (let i = 0; i < datesArrayLength; i++) {
			let count = 0;
			const skips = [];
			const dateArray_i = JSON.parse(datesArray[i]);
			if (dateArray_i.length) { // Every entry is also an array of dates
				dateArray_i.forEach((date) => {
					const skip = new Date(date);
					if (skip.getFullYear() === timePeriod) {
						count++;
						skips.push(skip);
					}
				});
			}
			dataPool.push({ idx: i, skipCount: count, skips });
		}
	}
	return dataPool;
}