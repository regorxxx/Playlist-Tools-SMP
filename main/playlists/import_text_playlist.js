'use strict';
//09/06/23

include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\helpers_xxx_tags.js');
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
include('..\\..\\helpers\\helpers_xxx_file.js');
include('..\\..\\helpers\\helpers_xxx_playlists_files.js');
include('..\\filter_and_query\\remove_duplicates.js');

// queryFilters will apply different conditions to the possible matches, and the ones which satisfy more will be selected
// duplicatesMask will filter the matches allowing only 1 track with same tags (no duplicates)
// Note in rare cases multiple matches could pass through the filter:
// Track A by Artist A -> (importTextPlaylist) -> output:
// 		01 - Track A -> Artist: Artist A//Artist B
// 		01 - Track A -> Artist: Artist A
// Since the default filter compares title and artist, both tracks are 'different' since only one artist
// is matched. Thus both tracks would be sent to the playlist. This behavior is preferred to only use
// title on the filter by default, since there could be cases where a list has same titles by different artists:
// Track A by Artist A
// ...
// Track A by Artist B
function importTextPlaylist({
		path = folders.data + 'playlistImport.txt',
		formatMask = ['', '. ', '%TITLE%', ' - ', '%ARTIST%'],
		duplicatesMask = [globTags.title, globTags.artist],
		bAdvTitle = true,
		queryFilters = [globQuery.noLiveNone, globQuery.notLowRating]
	} = {}) {
	if (!path || !path.length) {
		console.log('importTextPlaylist(): no file was provided');
		return -1;
	}
	let text = '';
	if (_isFile(path)) {
		text = _open(path);
		if (!text.length) {return -1;}
		const codePage = checkCodePage(text.split(/\r\n|\n\r|\n|\r/), '.' + path.split('.').pop(), true);
		if (codePage !== -1) {text = _open(path, codePage); if (!text.length) {return -1;}}
		return createPlaylistFromText(text, path, formatMask, duplicatesMask, queryFilters, bAdvTitle);
	} else if (path.indexOf('http://') !== -1 || path.indexOf('https://') !== -1) {
		let request = new ActiveXObject('Microsoft.XMLHTTP');
		request.open('GET', path, true);
		request.send();
		request.onreadystatechange = function () {
			if (request.readyState === 4) {
				if (request.status === 200) {
					var type = request.getResponseHeader('Content-Type');
					if (type.indexOf('text') !== 1) {
						text = request.responseText;
						return createPlaylistFromText(text, path, formatMask, duplicatesMask, queryFilters, bAdvTitle);
					} else {console.log('importTextPlaylist(): could not retrieve any text from ' + path); return -1;}
				} else {console.log('HTTP error: ' + request.status);}
			}
		}
	} else {console.log('importTextPlaylist(): file does not exist. ' + path); return -1;}
}

function createPlaylistFromText(text, path, formatMask, duplicatesMask, queryFilters, bAdvTitle) {
	let {handlePlaylist, notFound} = getHandlesFromText(text, formatMask, queryFilters);
	if (notFound && notFound.length) {
		const report = notFound.reduce((acc, line) => {return acc + (acc.length ? '\n' : '')+ 'Line ' + line.idx + '-> ' + Object.keys(line.tags).map((key) => {return capitalize(key) + ': ' + line.tags[key]}).join(', ');}, '');
		const reportPls = notFound.reduce((acc, line) => {return acc + (acc.length ? '\n' : '') + Object.keys(line.tags).map((key) => {return line.tags[key]}).join(' - ');}, '');
		fb.ShowPopupMessage(reportPls, 'Not found list');
		fb.ShowPopupMessage(report, 'Tracks not found at source');
	}
	if (handlePlaylist) {
		if (duplicatesMask && duplicatesMask.length) {handlePlaylist = removeDuplicatesV2({handleList: handlePlaylist, checkKeys: duplicatesMask.filter((n) => n), sortBias: globQuery.remDuplBias, bPreserveSort: true, bAdvTitle});}
		const idx = plman.PlaylistCount;
		plman.InsertPlaylistItems(plman.CreatePlaylist(idx, 'Import'), 0, handlePlaylist);
		if (!handlePlaylist.Count) {console.log('importTextPlaylist(): could not find any track with the given text');}
		return idx;
	} else {return -1;}
}

function getHandlesFromText(text, formatMask, queryFilters) {
	let handlePlaylist = new FbMetadbHandleList();
	if (text && text.length) {
		const tags = extractTags(text.split(/\r\n|\n\r|\n|\r/), formatMask);
		if (tags && tags.length) {
			const {matches, notFound} = getQueryMatches(tags, queryFilters);
			if (matches && matches.Count) {handlePlaylist.AddRange(matches);}
			return {handlePlaylist, notFound};
		} else {console.log('getHandlesFromText(): no tags retrieved');}
	} else {console.log('getHandlesFromText(): text file is empty');}
	return {handlePlaylist, notFound: []};
}

function extractTags(text, formatMask) {
	let tags = [];
	if (typeof text !== 'undefined' && text.length) {
		const maskLength = formatMask.length;
		let lines = text.length;
		for (let j = 0; j < lines; j++) {
			const line = text[j];
			let breakPoint = [];
			let prevIdx = 0;
			let bPrevTag = false;
			formatMask.forEach((mask, index) => {
				if (mask.length) { // It's a string to extract
					const nextIdx = line.indexOf(mask, prevIdx);
					if (mask.indexOf('%') === -1) { // It's breakpoint
						if (nextIdx !== -1 && bPrevTag) {breakPoint.push(nextIdx);};
						bPrevTag = false;
					} else if (index === 0) { // Or fist value is a tag, so extract from start
						breakPoint.push(0);
						bPrevTag = true;
					} else if (index === maskLength - 1) { // Or last value is a tag, so extract until the end
						breakPoint.push(prevIdx + formatMask[index - 1].length);
						breakPoint.push(line.length + 1);
					} else {
						breakPoint.push(prevIdx + formatMask[index - 1].length);
						bPrevTag = true;
					}
					if (nextIdx !== -1) {prevIdx = nextIdx;}
				}
			});
			let lineTags = {};
			if (breakPoint.length) {
				let idx = 0;
				formatMask.forEach((tag, i) => {
					if (tag.length) { // It's a string to extract
						if (tag.indexOf('%') !== -1) { // It's a tag to extract
							lineTags[tag.replace(/%/g,'').toLowerCase()] = line.slice(breakPoint[idx], breakPoint[idx + 1]).toLowerCase();
							idx += 2;
						}
					}
				});
			}
			if (!Object.keys(lineTags).length) {console.log('extractTags(): line ' + (j + 1)+ ' does not have tags matched by mask');}
			tags.push(lineTags);
		}
	} else {console.log('extractTags(): no text was provided.')}
	return tags.length ? tags : null;
}

function extractTagsV2(text, formatMask) {
	let tags = [];
	if (typeof text !== 'undefined' && text.length) {
		const maskLength = formatMask.length;
		let lines = text.length;
		for (let j = 0; j < lines; j++) {
			const line = text[j];
			let breakPoint = [];
			formatMask.forEach((mask, index) => {
				if (mask.length) { // It's a string to extract
					if (mask.indexOf('%') === -1) { // It's breakpoint
						const nextIdx = line.indexOf(mask);
						if (nextIdx !== -1) {
							if (breakPoint.length % 2) {
								breakPoint.push(nextIdx);
								breakPoint.push(nextIdx + mask.length);
							} else {
								breakPoint.push(nextIdx + mask.length);
							}
						}
					} else if (index === 0) { // Or fist value is a tag, so extract from start
						breakPoint.push(0);
					} else if (index === maskLength - 1) { // Or last value is a tag, so extract until the end
						breakPoint.push(line.length + 1);
					}
				}
			});
			let lineTags = {};
			if (breakPoint.length) {
				let idx = 0;
				formatMask.forEach((tag) => {
					if (tag.length) { // It's a string to extract
						if (tag.indexOf('%') !== -1) { // It's a tag to extract
							lineTags[tag.replace(/%/g,'').toLowerCase()] = line.slice(breakPoint[idx], breakPoint[idx + 1]).toLowerCase();
							idx += 2;
						}
					}
				});
			}
			if (!Object.keys(lineTags).length) {console.log('extractTags(): line ' + (j + 1)+ ' does not have tags matched by mask');}
			tags.push(lineTags);
		}
	} else {console.log('extractTags(): no text was provided.')}
	return tags.length ? tags : null;
}

function getQueryMatches(tags, queryFilters) {
	let matches = new FbMetadbHandleList();
	let notFound = [];
	const queryFiltersLength = queryFilters.length;
	const stripPrefix = ['a', 'an', 'the', 'la', 'los', 'las', 'el']; // Also match keys without prefixes! the rolling stones == the rolling stones OR rolling stones
	tags.forEach((handleTags, idx) => {
		if (Object.keys(handleTags).length) {
			const queryTags = Object.keys(handleTags).map((key) => {
				const query = key + ' IS ' + handleTags[key];
				if (key === 'artist' || key === 'album artist' || key === 'title') {
					const tfoKey = '"$stripprefix(%' +  key + '%,' + stripPrefix.join(',') + ')"';
					const tagVal = sanitizeTagTfo(handleTags[key]); // Quote special chars
					const tfo = '$stripprefix(' +  tagVal + ',' + stripPrefix.join(',') + ')';
					const tfoKeyVal = fb.TitleFormat(tfo).Eval(true);
					if (!tfoKeyVal.length) {console.log('Error creating query: ' + tfo);}
					const tfoQuery = tfoKey + ' IS ' + tfoKeyVal;
					let extraQuery = [];
					extraQuery.push('"$stricmp($ascii(%' + key + '%),$ascii(' + handleTags[key] + '))" IS 1');
					if ((key === 'artist' || key === 'album artist') && !handleTags[key].startsWith('the')) {
						extraQuery.push(key + ' IS the ' + handleTags[key]); // Done to match multivalued tags with 'the' on any item
						extraQuery.push('"$stricmp($ascii(%' + key + '%),$ascii(the ' + handleTags[key] + '))" IS 1');
					} else if (key === 'title') {
						if (handleTags[key].indexOf(',') !== -1) {
							const val = handleTags[key].replace(/,/g,'');
							extraQuery.push(key + ' IS ' + val);
							extraQuery.push('"$stricmp($ascii(%' + key + '%),$ascii(' + val + '))" IS 1');
						}
						extraQuery.push('"$replace(%' + key + '%,\',\',)" IS ' + handleTags[key]);
						extraQuery.push('"$stricmp($ascii($replace(%' + key + '%,\',\',)),$ascii(' + handleTags[key] + '))" IS 1');
					}
					if (extraQuery.length) {extraQuery = query_join(extraQuery, 'OR');}
					return query + ' OR ' + tfoQuery + (extraQuery.length ? ' OR ' + extraQuery : '');
				} else {
					return query;
				}
			});
			const query = query_join(queryTags, 'AND');
			const handles =  queryCache.has(query) ? queryCache.get(query) : (checkQuery(query, true) ? fb.GetQueryItems(fb.GetLibraryItems(), query) : null);
			if (!queryCache.has(query)) {queryCache.set(query, handles);}
			let bDone = false;
			if (handles && handles.Count) { // Filter the results step by step to see which ones satisfy more conditions
				if (queryFiltersLength) {
					const handlesFilter = new Array(queryFiltersLength);
					handlesFilter[0] = handles.Clone();
					queryFilters.forEach((queryFilter, i) => {
						const prevResult = handlesFilter[i ? i - 1 : 0];
						const bEmpty = prevResult.Count ? false : true;
						handlesFilter[i] = bEmpty ? new FbMetadbHandleList() : fb.GetQueryItems(prevResult, queryFilter);
						if (i !== queryFiltersLength - 1) {handlesFilter[i + 1] = bEmpty ? new FbMetadbHandleList() : handlesFilter[i].Clone();}
					});
					for (let i = queryFiltersLength - 1; i >= 0; i--) { // The last results are the handles which passed all the filters successfully, are the preferred results
						if (handlesFilter[i].Count) {matches.AddRange(handlesFilter[i]); bDone = true; break;}
					}
				}
				if (!bDone) {matches.AddRange(handles); bDone = true;}
			}
			if (!bDone) {
				const tags = {};
				Object.keys(handleTags).forEach((key) => {tags[key] = handleTags[key];});
				notFound.push({idx, tags});
			}
		}
	});
	return {matches, notFound};
}