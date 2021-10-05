'use strict';

/* 
	Search same by v 1.0 06/04/21
	Search n tracks (randomly) on library matching the conditions given according to the current selected track and tags.
	Note this ONLY USES already existing tags, it will not calculate similarity or anything else. 
	i.e. 'dynamic_genre' tag will not be calculated on the fly. Use 'search_bydistance.js' for that.
	If some tags are missing, then they get skipped.
	
	Conditions are set as an object with keys (tags) and values (number of coincidences):
	sameBy = {genre: 1, style: 2 , mood: 5} -> Must match at least 1 genre value, 2 style values and 5 mood values.
	
	Setting a 0 value for any key (tag) forces matching of all the tag values for that tag name.
	sameBy = {genre: 0, style: 2 , mood: 5} -> Must match all genre values, 2 style values and 5 mood values.
	
	If X value is greater than the values of a tag, then it simply must match all of them. For ex. if we select a track with 3 moods:
	sameBy = {genre: 0, style: 2 , mood: 5} -> Must match all genre values , 2 style values and (3 < 5) all moods values.
	
	Setting a -X value for any key (tag) forces matching of all the tag values less X. 
	If multi-value tag has less values than x, then must match only one. For ex. if we select a track with 3 genres:
	sameBy = {genre: -1, style: 2 , mood: 5} -> Must match (3-1=) 2 genre values , 2 style values and 5 mood values.
	sameBy = {genre: -2, style: 2 , mood: 5} -> Must match (3-2=) 1 genre values , 2 style values and 5 mood values.
	sameBy = {genre: -10, style: 2 , mood: 5} -> Must match (3 <= 10) 1 genre values, 2 style values and 5 mood values.
	
	+X/-X value for any key (tag) can be float € (0,1). Outside that range they have no use. 
	Final values are rounded, and minimum will always be 1. Maximum all tags values. Also f(-X) = f(1 - X):
	sameBy = {genre: -0.33, style: 2 , mood: 5} -> Must match (n - n * 1/3 = n * 2/3) two thirds of genre values , 2 style values and 5 mood values.
	sameBy = {genre: 0.66, style: 2 , mood: 5} -> Must match (n * 2/3) two thirds of genre values , 2 style values and 5 mood values.
	sameBy = {genre: 0.5, style: 2 , mood: 5} -> Must match (n * 1/2) half of the genre values , 2 style values and 5 mood values.
	
	After query search, duplicates are removed according to the tags set (checkDuplicatesBy).
    You can change sorting, playlist name and/or force a final query (added to the other requisites).
	
	- Tags logic - 
	Title-format only tags, like 'rating' or '$year(%date%)' are acquired via TF, but must be written without '%', like the rest. See dynamicTags.
	ONLY expressions defined there can be used. Why? No way to know if the output is a number, a string, etc. if arbitrary TF expressions are allowed.
	
	When the tags are not strings (genre, etc.) but numeric values (date, etc.), the pair {key: value} work as a range. See numericTags.
	sameBy = {genre: -1, date: 10} -> Must match all genre values and dates between (-10,+10).
	
	A special subset of numeric tags may be cyclic, so the values can only be within a predefined range. See cyclicTags and cyclicTagsDescriptor.
	
	- Examples of functionality -
	buttons_search_style_moods <-> use sameBy = {style: 2, mood: 6}
	buttons_search_same_style <-> use sameBy = {style: 0}
	Tracks from same artist and equal rating <-> use sameBy = {artist: 0, rating: 0}
	Tracks from same genre and style and date within 10 years <-> use sameBy = {genre: 0, style: 0, date: 10}
	Tracks from same genre but allowing n-2 style coincidences and date within 10 years <-> use sameBy = {genre: 0, style: -2, date: 10}
	
	- Caveat -
	Although the +X/-X notations seem to produce similar results, they don't. Let's say we have a track with n style values, then:
	Using -X notation: final number is always relative to number of tags of selected track.
	5 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (5-2=) 3 styles.
	4 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (4-2=) 2 styles.
	3 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (3-2=) 1 style.
	2 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (2 <= 2) 1 style.
	1 values && sameBy = {genre: 0, style: -2, date: 10} -> must match (2 <= 2) 1 style.
	But using +X notation: final number is a constant value (if possible).
	5 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 2 styles.
	4 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 2 styles.
	3 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 2 styles.
	2 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 2 styles.
	1 values && sameBy = {genre: 0, style: 2, date: 10} -> must match 1 style.
	
	TODO:
		-Use always TF instead of .MetaFind(), that would allow to execute arbitrary checks like $year(time), etc. (?)
		 but there is now way if output is a number, a string, ...
 */

var bLoadTags = true; // This tells the helper to load tags descriptors extra files
include('..\\helpers\\helpers_xxx_prototypes.js');
include('..\\helpers\\helpers_xxx_math.js');
include('remove_duplicates.js');

function do_search_same_by({
								playlistLength = 50, 
								forcedQuery = 'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1) AND NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi) AND %channels% LESS 3 AND NOT COMMENT HAS Quad',
								sortBy = '', 
								checkDuplicatesBy = ['title', 'artist', 'date'],
								sameBy = {genre: 1, style: 2 , mood: 5},
								playlistName = 'Search...',
								logic = 'AND',
								remapTags = {},
								bOnlyRemap = false,
								bSendToPls = true,
								} = {}) {
		
		// - Tags logic - from helpers
		/* 		
		dynamicTags: Tags only found by title formatting
		numericTags: These are tags which use in range checking instead of string matching
		cyclicTags: These are numeric tags with limited range: {0...K, k + 1 = 0, 0 - 1 = K}
		cyclicTagsDescriptor: Put here the corresponding function for the cyclic tag. 
			Swap lower/upper values before return if required. They must be always ordered.
			ALWAYS RETURN [valueLower, valueUpper, lowerLimit, upperLimit];
			Object keys must match the tag names at cyclicTags... 
		*/
		//  - end Tags logic -- 
		if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('do_search_same_by: playlistLength (' + playlistLength + ') must be greater than zero'); return false;}
		let tags = Object.keys(sameBy);
		let k_tagsCombs = Object.values(sameBy);
		if (!isArrayStrings(tags)) {
			console.log('do_search_same_by: sameBy [' + JSON.stringify(sameBy) + '] some keys are not String objects');
			return false;
		}
		if (!isArrayNumbers(k_tagsCombs)) {
			console.log('do_search_same_by: sameBy [' + JSON.stringify(sameBy) + '] some values are not Number objects');
			return false;
		}
		if (!isArrayStrings(checkDuplicatesBy)) {
			console.log('do_search_same_by: sameBy [' + checkDuplicatesBy + '] some keys are not String objects');
			return false;
		}
		if (tags.length !== k_tagsCombs.length) {
			console.log('do_search_same_by: sameBy [' + JSON.stringify(sameBy) + '] some keys (tags) are missing values');
			return false;
		}
		for (let i = 0; i < k_tagsCombs.length; i++) {
			if (isFloat(k_tagsCombs[i]) && Math.abs(k_tagsCombs[i]) > 1) {
				console.log('do_search_same_by: sameBy [' + JSON.stringify(sameBy) + '] some values are float numbers but not in (0,1) range');
				return false;
			}
		}
		try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery); return;}
		if (logicDic.indexOf(logic) === -1) {
			console.log('do_search_same_by(): logic (' + logic + ') is wrong');
			return false;
		}
		
		let sel = fb.GetFocusItem();
        if (!sel) {
			console.log('No track selected for mix.');
            return true;
		}
		
		let query = [];
		let ql;
		let sel_info = sel.GetFileInfo();
		let nTags = tags.length;
		let i = 0;
		while (i < nTags) { // Check all tags
			const tagName = tags[i].toLowerCase(); // To match sets!
			const tagNameTF = (tagName.indexOf('$') === -1) ? '%' + tagName + '%' : tagName; // It's a function? Then at eval as is, and at queries use '"' + tagNameTF + '"'
			const tagIdx = sel_info.MetaFind(tags[i]);
			const tagNumber = (tagIdx !== -1) ? sel_info.MetaValueCount(tagIdx) : 0;
			if (tagNumber === 0 && !dynamicTags.has(tagName)) {
				console.log('Track selected has no ' + tags[i] + ' tag');
			} else { // For selected tag
				if (numericTags.has(tagName)) { // may be a numeric tag
					const tagValue = dynamicTags.has(tagName) ? Number(fb.TitleFormat(tagNameTF).EvalWithMetadb(sel)) : Number(sel_info.MetaValue(tagIdx, 0));
					const valueRange = k_tagsCombs[i] > 0 ? Math.abs(k_tagsCombs[i]) : 0; //instead of k comb number, is a range!
					const valueUpper = tagValue + valueRange;
					const valueLower = valueRange > tagValue ? 0 : tagValue - valueRange; // Safety check
					ql = query.length;
					query[ql] = '';
					if (valueUpper !== valueLower) {query[ql] += (dynamicTags.has(tagName) ? '"' + tagNameTF + '"' : tagName) + ' GREATER ' + valueLower + ' AND ' + (dynamicTags.has(tagName) ? '"' + tagNameTF + '"' : tagName) + ' LESS ' + valueUpper;} 
					else {query[ql] += (dynamicTags.has(tagName) ? '"' + tagNameTF + '"' : tagName) + ' EQUAL ' + tagValue;}
				} else if (cyclicTags.has(tagName)) { // a ciclic numeric tag
					const tagValue = Number(sel_info.MetaValue(tagIdx, 0));
					const valueRange = k_tagsCombs[i] > 0 ? Math.abs(k_tagsCombs[i]) : 0; //instead of k comb number, is a range!
					const [valueLower, valueUpper, lowerLimit, upperLimit] = cyclicTagsDescriptor[tagName](tagValue, valueRange, true);
					ql = query.length;
					query[ql] = '';
					if (valueUpper !== valueLower) {
						let tempQuery = [];
						if (valueLower > tagValue) { // we reached the limits and swapped values (x - y ... upperLimit + 1 = lowerLimit ... x ... x + y ... upperLimit)
							tempQuery[0] = tagName + ' GREATER ' + lowerLimit + ' AND ' + tagName + ' LESS ' + tagValue; // (lowerLimit , x)
							tempQuery[1] = tagName + ' GREATER ' + tagValue	  + ' AND ' + tagName + ' LESS ' + valueLower; // (x, x + y)
							tempQuery[2] = tagName + ' GREATER ' + valueUpper + ' AND ' + tagName + ' LESS ' + upperLimit; // (x - y, upperLimit)
						} else { // (x - y ... x .... x + y)
							tempQuery[0] = tagName + ' GREATER ' + valueLower + ' AND ' + tagName + ' LESS ' + valueUpper; // (x - y , x + y)
						}
						query[ql] += query_join(tempQuery, 'OR');
					} else {query[ql] += tagName + ' EQUAL ' + tagValue;}
				} else { // or a string one
					let tagValues = [];
					tagValues.length = tagNumber;
					ql = query.length;
					let j = 0;
					while (j < tagNumber) {
						tagValues[j] = sel_info.MetaValue(tagIdx,j);
						j++;
					}
					let k;
					if (k_tagsCombs[i] !== 0) { // Value may be !== 0
						if (k_tagsCombs[i] < 0) {
							let k_tagsNegativeCombs;
							if (isFloat(k_tagsCombs[i])) { // negative Float number -> match (tagNumber - tagNumber * value) # of tags
								k_tagsCombs[i] = Math.abs(k_tagsCombs[i]);
								k_tagsNegativeCombs = round(tagNumber * k_tagsCombs[i], 0);
								if (k_tagsNegativeCombs === 0) {k_tagsNegativeCombs = 1;} // rounded to nearest integer number, but maximum must be -1
								if (tagNumber <= k_tagsNegativeCombs) {k_tagsNegativeCombs = tagNumber - 1;} // and maximum must be tagnumber - 1
							} else {  // negative -> match (tagNumber - value) # of tags
								k_tagsCombs[i] = Math.abs(k_tagsCombs[i]);
								k_tagsNegativeCombs =  Math.abs(k_tagsCombs[i]);
							}
							k = (tagNumber > k_tagsCombs[i]) ? tagNumber - k_tagsNegativeCombs : 1; //on combinations of (tag values - K) or the minimum number possible
						} else {
							if (isFloat(k_tagsCombs[i])) { // positive Float number -> match (tagNumber * value) # of tags anything
								k = round(tagNumber * k_tagsCombs[i], 0);
								if (k === 0) {k = 1;} // rounded to nearest integer number, but minimum must be 1
								if (tagNumber < k) {k = tagNumber;} // and maximum must be tagnumber
							} else { // positive integer -> match value # of tags
								k = (tagNumber > k_tagsCombs[i]) ? k_tagsCombs[i] : tagNumber; //on combinations of K or the maximum number possible
							}
						}
					} else {k = tagNumber;} // Or 0 -> match all # of tags
					let tagQuery= k_combinations(tagValues, k);
					query[ql] = '';
					if (Object.keys(remapTags).length > 0 && remapTags.hasOwnProperty(tagName)) {
						let subQuery = [];
						if (!bOnlyRemap) { // When only mixing, don't use the query for the original tag... just remap
							subQuery.push(query_combinations(tagQuery, tagName, 'OR', 'AND'));
						}
						remapTags[tagName].forEach( (tag) => {
							subQuery.push(query_combinations(tagQuery, tag, 'OR', 'AND'));
						});
						query[ql] += query_join(subQuery, 'OR');
					} else {query[ql] += query_combinations(tagQuery, tagName, 'OR', 'AND');}
				}
			}
			i++;
		}
		
        // Query
		ql = query.length;
		if (!ql) {return false;}
		query[ql] = query_join(query, logic); //join previous query's
		if (forcedQuery) {
			query[ql] = '(' + query[ql] + ') AND (' + forcedQuery + ')';
		}

		// Load query
		console.log('Playlist created: ' + query[ql]);
		let queryhandle_list;
		try {queryhandle_list = fb.GetQueryItems(fb.GetLibraryItems(), query[ql]);} // Sanity check
		catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query[ql]); return false;}
		
		// Find and remove duplicates
		if (checkDuplicatesBy !== null) {
			queryhandle_list = do_remove_duplicates(queryhandle_list, sortBy, checkDuplicatesBy);
		}
		
		let oldCount = queryhandle_list.Count;
		console.log('Items retrieved by query: ' + oldCount + ' tracks');
		
		// Limit n tracks
		queryhandle_list.RemoveRange(playlistLength, queryhandle_list.Count);
		
		if (bSendToPls) {
			// Clear playlist if needed. Preferred to removing it, since then we could undo later...
			// Look if target playlist already exists
			i = 0;
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
			if (plman.PlaylistItemCount(plman.ActivePlaylist)) {
				plman.UndoBackup(plman.ActivePlaylist);
				plman.ClearPlaylist(plman.ActivePlaylist);
			}
			// Create playlist
			console.log('Final selection: ' +  queryhandle_list.Count  + ' tracks');
			plman.InsertPlaylistItems(plman.ActivePlaylist, 0, queryhandle_list);
		}
		return true;
}