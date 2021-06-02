'use strict';

/* 
	Top X Tracks From Date v 0.1 16/03/20
	Search n most played tracks from a given year on library. Sorting is done by play count by default.
	Duplicates by title - artist - date are removed, so it doesn't output the same tracks
	multiple times like an auto-playlist does (if you have multiple versions of the same track).
 */

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\main\\remove_duplicates.js');
if (!utils.CheckComponent("foo_playcount")) {fb.ShowPopupMessage('top_tracks_from_date: foo_playcount component is not installed. Script can not work without it.');}

const timeKeys = {Days: daysBetween, Weeks: weeksBetween};

// Most played n Tracks from date
function do_top_tracks_from_date({
						playlistLength = 25, 
						sortBy = '$sub(99999,%play_count%)', 
						checkDuplicatesBy = ['title', 'artist', 'date'],
						year =  new Date().getFullYear() - 1, // Previous year
						last = '1 WEEKS',
						bUseLast = false,
						forcedQuery = 'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1)',
						} = {}) {
		// Sanity checks
		if (!utils.CheckComponent("foo_enhanced_playcount"))  {fb.ShowPopupMessage('foo_enhanced_playcount is not installed and is required.', 'do_top_tracks_from_date'); return;}
		if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('do_top_tracks_from_date: playlistLength (' + playlistLength + ') must be greater than zero'); return;}
		try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);}
		catch (e) {fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery, 'do_top_tracks_from_date'); return;}
		last = last.trim();
		if (bUseLast && !last.length) {fb.ShowPopupMessage('Time period string is empty:\n' + last, 'do_top_tracks_from_date'); return;}
		// Find time-unit
		let timeKey = '';
		let timePeriod = Number(last.split(' ')[0]);
		if (!Number.isSafeInteger(timePeriod)) {fb.ShowPopupMessage('Time period is not a valid number:\n' + timePeriod, 'do_top_tracks_from_date'); return;}
		if (!Object.keys(timeKeys).some( (key) => {if (last.toLowerCase().indexOf(key.toLowerCase()) !== -1) {timeKey = key; return true;} else {return false;}})) {
				fb.ShowPopupMessage('Time-unit not valid (must be' + Object.keys(timeKeys).join(', ') + '):\n' + last, 'do_top_tracks_from_date');
				return;
		}
		
		// Load query
		const query = bUseLast ? '%last_played% DURING LAST ' + last.toUpperCase() : '%last_played% AFTER ' + year + '-01-01 AND NOT %first_played% AFTER ' + (year + 1) + '-01-01';
		let handleList;
		try {handleList = fb.GetQueryItems(fb.GetLibraryItems(), (forcedQuery.length ? '(' + query + ') AND (' + forcedQuery + ')' : query));} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + (forcedQuery.length ? '(' + query + ') AND (' + forcedQuery + ')' : query), 'do_top_tracks_from_date'); return;}
		
		// Find and remove duplicates
		if (checkDuplicatesBy !== null) {
			handleList = do_remove_duplicatesV2(handleList, sortBy, checkDuplicatesBy);
		}
		
		// Filter Play counts by date
		const datesArray = fb.TitleFormat('[%played_times%]').EvalWithMetadbs(handleList);
		const datesLastFMArray = fb.TitleFormat('[%lastfm_played_times%]').EvalWithMetadbs(handleList);
		const lastPlayedArray = fb.TitleFormat('[%last_played%]').EvalWithMetadbs(handleList);
		const firstPlayedArray = fb.TitleFormat('[%first_played%]').EvalWithMetadbs(handleList);
		const playCountArray = fb.TitleFormat('[%play_count%]').EvalWithMetadbs(handleList);
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
						if (temp.length === 3 && timeKeys[timeKey](currentDate, new Date(temp[0],temp[1],temp[2])) <= timePeriod) {count++;}
					});
				} else { // For tracks without advanced statistics
					const tempFirst = firstPlayedArray[i].substring(0, 10).split('-');
					if (tempFirst.length !== 3) {continue;}
					const diffFirst = timeKeys[timeKey](currentDate, new Date(tempFirst[0],tempFirst[1],tempFirst[2]));
					const tempLast = lastPlayedArray[i].substring(0, 10).split('-');
					if (tempLast.length !== 3) {continue;}
					const diffLast = timeKeys[timeKey](currentDate, new Date(tempLast[0],tempLast[1],tempLast[2]));
					// If first and last plays were from selected year, then all play counts too
					if (diffFirst <= timePeriod && diffLast <= timePeriod) {count += playCountArray[i];}
					// Or the first play
					else if (diffFirst <= timePeriod) {count++;}
					// Or the last play
					else if (diffLast <= timePeriod) {count++;}
					// Note any track known to have been played at selected year will be added to the pool, and since the handle List is already
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
		dataPool.forEach((item) => pool.push(handleList[item.idx]));
		handleList = new FbMetadbHandleList(pool);
		
		// Output n tracks
		handleList.RemoveRange(playlistLength, handleList.Count);
		
		// Look if target playlist already exists
		const playlist_name = bUseLast ? 'Top ' + playlistLength + ' Tracks from last ' + timePeriod + ' ' + timeKey : 'Top ' + playlistLength + ' Tracks ' + year;
		const plc = plman.PlaylistCount;
		let i = 0;
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
		// Clear playlist if needed. Preferred to removing it, since then we could undo later...
		if (plman.PlaylistItemCount(plman.ActivePlaylist)) {
			plman.UndoBackup(plman.ActivePlaylist);
			plman.ClearPlaylist(plman.ActivePlaylist);
		}

		// Add to playlist
		plman.InsertPlaylistItems(plman.ActivePlaylist, 0, handleList);
		
		console.log("Playlist created: " + playlist_name);
}

function weeksBetween(d1, d2) { // d1 and d2 are Dates objects
    return Math.round((d2 - d1) / (7 * 24 * 60 * 60 * 1000));
}

function daysBetween(d1, d2) { // d1 and d2 are Dates objects
    return Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
}