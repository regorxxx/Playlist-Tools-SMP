'use strict';
//08/12/24

/*
	Top X Tracks From Date
	Search n most played tracks from a given year on library. Sorting is done by play count by default.
	Duplicates by title - album artist - date are removed, so it doesn't output the same tracks
	multiple times like an auto-playlist does (if you have multiple versions of the same track).
 */

/* exported topTracksFromDate, topTracksFromDateV2, getPlayCount, getPlayCountV2, getSkipCount */

include('..\\..\\helpers\\helpers_xxx.js');
/* global globTags:readable, globQuery:readable, isEnhPlayCount:readable, isPlayCount:readable, isSkipCount:readable, isPlayCount2003:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _p:readable, _bt:readable, _b:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist:readable */
include('..\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicates:readable */
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
 * @param {boolean} [o.bMultiple=true] - Duplication removal with a single Multi-value tag match
 * @param {number} [o.year=new Date().getFullYear() - 1] - Year for lookup
 * @param {string} [o.last='1 WEEKS'] - Time period for lookup (bUseLast must be true)
 * @param {boolean} [o.bUseLast=false] - Use the period method instead of year
 * @param {string} [o.forcedQuery=globQuery.notLowRating] - Query filter
 * @param {boolean} [o.bSendToPls=true] - Send FbMetadbHandleList to new playlist
 * @param {boolean} [o.bProfile=false] - Enable profiling log
 * @returns {[FbMetadbHandleList, {idx:number; playCount:number; listens: Date[];}[]]}
 */
function topTracksFromDate({
	playlistLength = 25,
	sortBy = globTags.sortPlayCount,
	checkDuplicatesBy = globTags.remDupl,
	checkDuplicatesBias = globQuery.remDuplBias,
	bAdvTitle = true,
	bMultiple = true,
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
		if (!Object.keys(timeKeys).some((key) => { if (last.toLowerCase().includes(key.toLowerCase())) { timeKey = key; return true; } else { return false; } })) {
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
		outputHandleList = removeDuplicates({ handleList: outputHandleList, sortOutput: sortBy, checkKeys: checkDuplicatesBy, sortBias: checkDuplicatesBias, bAdvTitle, bMultiple });
	}
	// Filter Play counts by date
	const dataPool = (bUseLast
		? getPlayCount(outputHandleList, timePeriod, timeKey)
		: getPlayCount(outputHandleList, year)
	).filter((v) => v.playCount);
	let pool = [];
	// Order by Play Count
	dataPool.sort(function (a, b) { return b.playCount - a.playCount; });
	// Output n tracks
	if (dataPool.length > playlistLength) { dataPool.length = playlistLength; }
	dataPool.forEach((item) => pool.push(outputHandleList[item.idx]));
	outputHandleList = new FbMetadbHandleList(pool);
	const playlistName = bUseLast ? 'Top ' + (playlistLength !== Infinity ? playlistLength + ' ' : '') + 'Tracks from last ' + timePeriod + ' ' + timeKey : 'Top ' + playlistLength + ' Tracks ' + year;
	if (bSendToPls) { sendToPlaylist(outputHandleList, playlistName); }
	if (bProfile) { test.Print('Task #1: Top tracks from date', false); }
	return [outputHandleList, dataPool];
}

/**
 * Most played n Tracks from date (may be a single year or a period using 'last x weeks'). There are additional settings for compatibility with ListenBrainz API listens retrieval (compared to the {@link topTracksFromDate}).
 *
 * @function
 * @name topTracksFromDateV2
 * @kind function
 * @param {Object} [o={}] - Arguments
 * @param {number} [o.playlistLength=25] - N tracks to retrieve
 * @param {string} [o.sortBy=globTags.sortPlayCount] - TF expression to sort FbMetadbHandleList
 * @param {string[]} [o.checkDuplicatesBy=globTags.remDupl] - Duplication removal tags
 * @param {string} [o.checkDuplicatesBias=globQuery.remDuplBias] - Duplication removal bias
 * @param {boolean} [o.bAdvTitle=true] - Duplication removal by RegExp
 * @param {boolean} [o.bMultiple=true] - Duplication removal with a single Multi-value tag match
 * @param {number} [o.year=new Date().getFullYear() - 1] - Year for lookup
 * @param {string} [o.last='1 WEEKS'] - Time period for lookup (bUseLast must be true)
 * @param {boolean} [o.bUseLast=false] - Use the period method instead of year
 * @param {string} [o.forcedQuery=globQuery.notLowRating] - Query filter
 * @param {boolean} [o.bSendToPls=true] - Send FbMetadbHandleList to new playlist
 * @param {boolean} [o.bProfile=false] - Enable profiling log
 * @param {{token:string, bOffline:boolean}} o.listenBrainz - [={token: '', bOffline: true}] ListenBrainz settings to retrieve playcounts. If no token provided, it's skipped
 * @returns {Promise.<[FbMetadbHandleList, {idx:number; playCount:number; listens: Date[];}[]]>}
 */
async function topTracksFromDateV2({
	playlistLength = 25,
	sortBy = globTags.sortPlayCount,
	checkDuplicatesBy = globTags.remDupl,
	checkDuplicatesBias = globQuery.remDuplBias,
	bAdvTitle = true,
	bMultiple = true,
	year = new Date().getFullYear() - 1, // Previous year
	last = '1 WEEKS',
	bUseLast = false,
	forcedQuery = globQuery.notLowRating,
	bSendToPls = true,
	bProfile = false,
	listenBrainz = {token: '', bOffline: true}
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
		if (!Object.keys(timeKeys).some((key) => { if (last.toLowerCase().includes(key.toLowerCase())) { timeKey = key; return true; } else { return false; } })) {
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
		outputHandleList = removeDuplicates({ handleList: outputHandleList, sortOutput: sortBy, checkKeys: checkDuplicatesBy, sortBias: checkDuplicatesBias, bAdvTitle, bMultiple });
	}
	// Filter Play counts by date
	const dataPool = (bUseLast
		? await getPlayCountV2(outputHandleList, timePeriod, timeKey, void(0), void(0), listenBrainz)
		: await getPlayCountV2(outputHandleList, year, void(0), void(0), void(0), listenBrainz)
	).filter((v) => v.playCount);
	let pool = [];
	// Order by Play Count
	dataPool.sort(function (a, b) { return b.playCount - a.playCount; });
	// Output n tracks
	if (dataPool.length > playlistLength) { dataPool.length = playlistLength; }
	dataPool.forEach((item) => pool.push(outputHandleList[item.idx]));
	outputHandleList = new FbMetadbHandleList(pool);
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
 * Retrieves the play count on a time period, which may be a single year or a time unit number (days, weeks) from a reference date. Compatible with foo_playcount and foo_playcount_2003 components.
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
	if (!isPlayCount2003 && !isEnhPlayCount) {
		fb.ShowPopupMessage('getPlayCount: neither foo_enhanced_playcount nor foo_playcount_2003 is installed.');
		return [];
	}
	const sep = '|‎|';
	const data = fb.TitleFormat(
		(isEnhPlayCount ? _bt('PLAYED_TIMES_JS') : '') +
		sep +
		(isEnhPlayCount ? _bt('LASTFM_PLAYED_TIMES_JS') : '') +
		sep +
		(isPlayCount2003 ? _bt('2003_TIMESTAMPS') : '') +
		sep +
		(isEnhPlayCount ? _bt('FIRST_PLAYED_ENHANCED') : _bt('2003_FIRST_PLAYED')) +
		sep +
		(isEnhPlayCount ? _bt('LAST_PLAYED_ENHANCED') : _bt('2003_LAST_PLAYED')) +
		sep +
		_b(globTags.playCount)
	).EvalWithMetadbs(handleList);
	const dataLen = data.length;
	const deDup = (dateArray) => { // Listens may be duplicated with some seconds offset (30s)
		const dateMap = Object.create(null);
		let i = dateArray.length;
		while (i--) {
			const jsDate = dateArray[i];
			const date = dateArray[i] = new Date(jsDate);
			const day = date.toDateString();
			if (!dateMap[day]) { dateMap[day] = [jsDate]; }
			else {
				const dayArr = dateMap[day];
				if (dayArr.every((listen) => Math.abs(jsDate - listen) >= 30000)) {
					dayArr.push(jsDate);
				} else { dateArray.splice(i, 1); }
			}
		}
		return dateArray;
	};
	let dataPool = [];
	if (timePeriod && timeKey) { // During X time...
		for (let i = 0; i < dataLen; i++) {
			const [dates, datesLastFM, dates2003, dateFirst, dateLast, playCount] = data[i].split(sep);
			let count = 0;
			const bHasLastFM = isEnhPlayCount && datesLastFM.length > 2;
			const bHasDates2003 = isPlayCount2003 && dates2003.length > 2;
			const listens = [];
			const dateArray = [...new Set(
				JSON.parse(dates)
					.concat(bHasDates2003 ? JSON.parse(dates2003) : [])
					.concat(bHasLastFM ? JSON.parse(datesLastFM) : [])
			)];
			if (bHasLastFM || bHasDates2003) { deDup(dateArray); }
			if (bHasLastFM || bHasDates2003 || dateArray.length) { // Every entry is also an array of dates
				if (bHasLastFM || bHasDates2003) {
					dateArray.forEach((listen) => {
						if (timeKeys[timeKey](listen, fromDate) <= timePeriod) {
							count++;
							listens.push(listen);
						}
					});
				} else {
					dateArray.forEach((date) => {
						const listen = new Date(date);
						if (timeKeys[timeKey](listen, fromDate) <= timePeriod) {
							count++;
							listens.push(listen);
						}
					});
				}
			} else { // For tracks without advanced statistics
				if (!dateFirst) { continue; }
				const firstListen = new Date(dateFirst);
				const diffFirst = timeKeys[timeKey](firstListen, fromDate);
				if (!dateLast) { continue; }
				const lastListen = new Date(dateLast);
				const diffLast = timeKeys[timeKey](lastListen, fromDate);
				// If first and last plays were from selected period, then all play counts too
				if (diffFirst <= timePeriod && diffLast <= timePeriod) {
					count += playCount;
					if (bFakeListens) {
						fakeListens(firstListen, lastListen, playCount).forEach((listen) => listens.push(listen));
					} else {
						listens.push(firstListen);
						if (playCount >= 2) {
							if (playCount > 2) {
								for (let i = 2; i < playCount; i++) { listens.push(firstListen); }
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
		for (let i = 0; i < dataLen; i++) {
			const [dates, datesLastFM, dates2003, dateFirst, dateLast, playCount] = data[i].split(sep);
			let count = 0;
			const bHasLastFM = isEnhPlayCount && datesLastFM.length > 2;
			const bHasDates2003 = isPlayCount2003 && dates2003.length > 2;
			const listens = [];
			const dateArray = [...new Set(
				JSON.parse(dates)
					.concat(bHasDates2003 ? JSON.parse(dates2003) : [])
					.concat(bHasLastFM ? JSON.parse(datesLastFM) : [])
			)];
			if (bHasLastFM || bHasDates2003) { deDup(dateArray); }
			if (bHasLastFM || bHasDates2003 || dateArray.length) { // Every entry is also an array of dates
				if (bHasLastFM || bHasDates2003) {
					dateArray.forEach((listen) => {
						if (listen.getFullYear() === timePeriod) {
							count++;
							listens.push(listen);
						}
					});
				} else {
					dateArray.forEach((date) => {
						const listen = new Date(date);
						if (listen.getFullYear() === timePeriod) {
							count++;
							listens.push(listen);
						}
					});
				}
			} else if (!dateFirst && !dateLast) { // For tracks without advanced statistics
				const firstListen = dateFirst ? new Date(dateFirst) : void (0);
				const lastListen = dateLast ? new Date(dateLast) : void (0);
				// If first and last plays were from selected year, then all play counts too
				if (firstListen && lastListen && firstListen.getFullYear() === timePeriod && lastListen.getFullYear() === timePeriod) {
					count += playCount;
					if (bFakeListens) {
						fakeListens(firstListen, lastListen, playCount).forEach((listen) => listens.push(listen));
					} else {
						listens.push(firstListen);
						if (playCount >= 2) {
							if (playCount > 2) {
								for (let i = 2; i < playCount; i++) { listens.push(new Date(firstListen)); }
							}
							listens.push(lastListen);
						}
					}
				}
				// Or the first play
				else if (firstListen && firstListen.getFullYear() === timePeriod) {
					count++;
					listens.push(firstListen);
				}
				// Or the last play
				else if (lastListen && lastListen.getFullYear() === timePeriod) {
					count++;
					listens.push(lastListen);
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
 * Retrieves the play count on a time period, which may be a single year or a time unit number (days, weeks) from a reference date. Compatible with foo_playcount and foo_playcount_2003 components and also retrieves listens from ListenBrainz.
 *
 * @async
 * @function
 * @name getPlayCountV2
 * @kind function
 * @param {FbMetadbHandleList} handleList
 * @param {number} timePeriod - Single year or number of time units
 * @param {string} timeKey? - Time units: Days|Weeks
 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
 * @param {boolean} bFakeListens? - Fill listens when there is no play times available
 * @param {{user?: '', token:string, bOffline:boolean}} listenBrainz - [={user: '', token: '', bOffline: true}] ListenBrainz settings to retrieve playcounts. If no token provided, it's skipped. If no user is provided, it's retrieved from token
 * @returns {Promise.<{ idx: number; playCount: number; listens: Date[]; }[]>}
 */
async function getPlayCountV2(handleList, timePeriod, timeKey = null, fromDate = new Date(), bFakeListens = true, listenBrainz = { user: '', token: '', bOffline: true }) {
	if (!isPlayCount2003 && !isEnhPlayCount) {
		fb.ShowPopupMessage('getPlayCount: neither foo_enhanced_playcount nor foo_playcount_2003 is installed.');
		return [];
	}
	const sep = '|‎|';
	const data = fb.TitleFormat(
		(isEnhPlayCount ? _bt('played_times_js') : '') +
		sep +
		(isEnhPlayCount ? _bt('lastfm_played_times_js') : '') +
		sep +
		(isPlayCount2003 ? _bt('2003_timestamps') : '') +
		sep +
		(isEnhPlayCount ? _bt('FIRST_PLAYED_ENHANCED') : _bt('2003_first_played')) +
		sep +
		(isEnhPlayCount ? _bt('LAST_PLAYED_ENHANCED') : _bt('2003_last_played')) +
		sep +
		_b(globTags.playCount)
	).EvalWithMetadbs(handleList);
	let lbData;
	if (listenBrainz && (listenBrainz.token || '').length) {
		/* global ListenBrainz:readable */
		if (!listenBrainz.user) { listenBrainz.user = await ListenBrainz.retrieveUser(listenBrainz.token , false); }
		const timeUnit = timeKey === 'Weeks'
			? 7 * 24 * 60 * 60
			: timeKey === 'Days'
				? 24 * 60 * 60
				: null;
		const max_ts = Math.round(
			timePeriod && timeKey
				? fromDate.getTime() / 1000
				: new Date(String(timePeriod + 1)).getTime() / 1000
		);
		const min_ts = Math.round(
			timePeriod && timeKey
				? Math.max(max_ts - timePeriod * timeUnit, 0)
				: new Date(String(timePeriod)).getTime() / 1000
		);
		lbData = (await ListenBrainz.retrieveListensForHandleList(handleList, listenBrainz.user, { max_ts, min_ts }, listenBrainz.token, true, listenBrainz.bOffline));
	}
	const dataLen = data.length;
	/* 	const deDup = (dateArray) => { // Listens may be duplicated with some seconds offset (30s)
		const dateMap = Object.create(null);
		let i = dateArray.length;
		while (i--) {
			const jsDate = dateArray[i];
			const date = dateArray[i] = new Date(jsDate);
			const day = date.toDateString();
			if (!dateMap[day]) { dateMap[day] = [jsDate]; }
			else {
				const dayArr = dateMap[day];
				// https://github.com/phw/foo_listenbrainz2/issues/23
				if (dayArr.every((listen) => Math.abs(jsDate - listen) >= (lbData ? 300000 : 30000))) {
					dayArr.push(jsDate);
				} else { dateArray.splice(i, 1); }
			}
		}
		return dateArray;
	}; */
	const deDup = (dateArray) => { // Listens may be duplicated with some seconds offset (30s)
		const dateMap = Object.create(null);
		let i = dateArray.length;
		while (i--) {
			const listen = dateArray[i];
			if (listen) {
				const jsDate = lbData
					? listen.listened_at || listen
					: listen;
				const player = lbData && listen.additional_info && listen.additional_info.media_player
					? listen.additional_info.media_player
					: null;
				const isNotFb = player && player !== 'foobar2000';
				const date = dateArray[i] = new Date(jsDate);
				const day = date.toDateString();
				if (!dateMap[day]) { dateMap[day] = [jsDate]; }
				else {
					const dayArr = dateMap[day];
					// https://github.com/phw/foo_listenbrainz2/issues/23
					if (isNotFb || dayArr.every((listen) => Math.abs(jsDate - listen) >= (lbData ? 300000 : 30000))) {
						dayArr.push(jsDate);
					} else { dateArray.splice(i, 1); }
				}
			}
		}
		return dateArray;
	};
	let dataPool = [];
	if (timePeriod && timeKey) { // During X time...
		for (let i = 0; i < dataLen; i++) {
			const [dates, datesLastFM, dates2003, dateFirst, dateLast, playCount] = data[i].split(sep);
			const bHasLastFM = isEnhPlayCount && datesLastFM.length > 2;
			const bHasDates2003 = isPlayCount2003 && dates2003.length > 2;
			const bHasLb = lbData && lbData[i].length;
			let count = 0;
			const listens = [];
			const dateArray = [...new Set(
				JSON.parse(dates)
					.concat(bHasDates2003 ? JSON.parse(dates2003) : [])
					.concat(bHasLastFM ? JSON.parse(datesLastFM) : [])
					.concat(bHasLb ? lbData[i] : [])
			)];
			if (bHasLastFM || bHasDates2003 || bHasLb) { deDup(dateArray); }
			if (bHasLastFM || bHasDates2003 || dateArray.length) { // Every entry is also an array of dates
				if (bHasLastFM || bHasDates2003 || bHasLb) {
					dateArray.forEach((listen) => {
						if (timeKeys[timeKey](listen, fromDate) <= timePeriod) {
							count++;
							listens.push(listen);
						}
					});
				} else {
					dateArray.forEach((date) => {
						const listen = new Date(date);
						if (timeKeys[timeKey](listen, fromDate) <= timePeriod) {
							count++;
							listens.push(listen);
						}
					});
				}
			} else { // For tracks without advanced statistics
				if (!dateFirst) { continue; }
				const firstListen = new Date(dateFirst);
				const diffFirst = timeKeys[timeKey](firstListen, fromDate);
				if (!dateLast) { continue; }
				const lastListen = new Date(dateLast);
				const diffLast = timeKeys[timeKey](lastListen, fromDate);
				// If first and last plays were from selected period, then all play counts too
				if (diffFirst <= timePeriod && diffLast <= timePeriod) {
					count += playCount;
					if (bFakeListens) {
						fakeListens(firstListen, lastListen, playCount).forEach((listen) => listens.push(listen));
					} else {
						listens.push(firstListen);
						if (playCount >= 2) {
							if (playCount > 2) {
								for (let i = 2; i < playCount; i++) { listens.push(firstListen); }
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
		for (let i = 0; i < dataLen; i++) {
			const [dates, datesLastFM, dates2003, dateFirst, dateLast, playCount] = data[i].split(sep);
			let count = 0;
			const bHasLastFM = isEnhPlayCount && datesLastFM.length > 2;
			const bHasDates2003 = isPlayCount2003 && dates2003.length > 2;
			const bHasLb = lbData && lbData[i].length;
			const listens = [];
			const dateArray = [...new Set(
				JSON.parse(dates)
					.concat(bHasDates2003 ? JSON.parse(dates2003) : [])
					.concat(bHasLastFM ? JSON.parse(datesLastFM) : [])
					.concat(bHasLb ? lbData[i] : [])
			)];
			if (bHasLastFM || bHasDates2003 || bHasLb) { deDup(dateArray); }
			if (bHasLastFM || bHasDates2003 || dateArray.length) { // Every entry is also an array of dates
				if (bHasLastFM || bHasDates2003 || bHasLb) {
					dateArray.forEach((listen) => {
						if (listen && listen.getFullYear() === timePeriod) {
							count++;
							listens.push(listen);
						}
					});
				} else {
					dateArray.forEach((date) => {
						if (date) {
							const listen = new Date(date);
							if (listen.getFullYear() === timePeriod) {
								count++;
								listens.push(listen);
							}
						}
					});
				}
			} else if (dateFirst || dateLast) { // For tracks without advanced statistics
				const firstListen = dateFirst ? new Date(dateFirst) : void (0);
				const lastListen = dateLast ? new Date(dateLast) : void (0);
				// If first and last plays were from selected year, then all play counts too
				if (firstListen && lastListen && firstListen.getFullYear() === timePeriod && lastListen.getFullYear() === timePeriod) {
					count += playCount;
					if (bFakeListens) {
						fakeListens(firstListen, lastListen, playCount).forEach((listen) => listens.push(listen));
					} else {
						listens.push(firstListen);
						if (playCount >= 2) {
							if (playCount > 2) {
								for (let i = 2; i < playCount; i++) { listens.push(new Date(firstListen)); }
							}
							listens.push(lastListen);
						}
					}
				}
				// Or the first play
				else if (firstListen && firstListen.getFullYear() === timePeriod) {
					count++;
					listens.push(firstListen);
				}
				// Or the last play
				else if (lastListen && lastListen.getFullYear() === timePeriod) {
					count++;
					listens.push(lastListen);
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