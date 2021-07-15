'use strict';

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\helpers_xxx_prototypes.js');
include('remove_duplicates.js');

// bSkipLive will not output matches which are live tracks
// filterMask will filter the matches allowing only 1 track with same tags (no duplicates)
// Note in rare cases multiple matches could pass through the filter:
// Track A by Artist A -> (importTextPlaylist) -> output:
// 		01 - Track A -> Artist: Artist A//Artist B
// 		01 - Track A -> Artist: Artist A
// Since the default filter compares title and artist, both tracks are "different" since only one artist
// is matched. Thus both tracks would be sent to the playlist. This behavior is preferred to only use
// title on the filter by default, since there could be cases where a list has same titles by different artists:
// Track A by Artist A
// ...
// Track A by Artist B
function importTextPlaylist({path = folders.data + 'playlistImport.txt', formatMask = ['', '. ', '%title%', ' - ', '%artist%'], filterMask = ['title', 'artist'], bSkipLive = true} = {}) {
	if (!path || !path.length) {
		console.log('importTextPlaylist(): no file was provided');
		return -1;
	}
	let text = '';
	if (_isFile(path)) {
		text = utils.ReadTextFile(path);
		return createPlaylistFromText(text, path, formatMask, filterMask, bSkipLive);
	} else if (path.indexOf('http://') !== -1 || path.indexOf('https://') !== -1) {
		let request = new ActiveXObject('Microsoft.XMLHTTP');
		request.open('GET', path, true);
		request.send();
		request.onreadystatechange = function () {
			if (request.readyState === 4) {
				if (request.status === 200) {
					var type = request.getResponseHeader('Content-Type');
					if (type.indexOf("text") !== 1) {
						text = request.responseText;
						return createPlaylistFromText(text, path, formatMask, filterMask, bSkipLive);
					} else {console.log('importTextPlaylist(): could not retrieve any text from ' + path); return -1;}
				} else {console.log('HTTP error: ' + request.status);}
			}
		}
	} else {console.log('importTextPlaylist(): file does not exist. ' + path); return -1;}
}

function createPlaylistFromText(text, path, formatMask, filterMask, bSkipLive) {
	let {handlePlaylist, notFound} = getHandlesFromText(text, formatMask, bSkipLive);
	if (notFound) {
		const report = notFound.reduce((acc, line) => {return acc + (acc.length ? '\n' : '')+ 'Line ' + line.idx + '-> ' + Object.keys(line.tags).map((key) => {return capitalize(key) + ': ' + line.tags[key]}).join(', ');}, '');
		fb.ShowPopupMessage(report, 'Tracks not found')
	}
	if (handlePlaylist) {
		if (filterMask && filterMask.length) {handlePlaylist = do_remove_duplicatesV3(handlePlaylist, null, filterMask.filter((n) => n), 0);}
		const idx = plman.PlaylistCount;
		plman.InsertPlaylistItems(plman.CreatePlaylist(idx, 'Import'), 0, handlePlaylist);
		if (!handlePlaylist.Count) {console.log('importTextPlaylist(): could not find any track with the given text');}
		return idx;
	} else {return -1;}
}

function getHandlesFromText(text, formatMask, bSkipLive = true) {
	let handlePlaylist = new FbMetadbHandleList();
	if (text && text.length) {
		const tags = extractTags(text.split('\r\n'), formatMask);
		if (tags && tags.length) {
			const {matches, notFound}  = getQueryMatches(tags, bSkipLive);
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


function getQueryMatches(tags, bSkipLive = true) {
	let matches = new FbMetadbHandleList();
	let notFound = [];
	const stripPrefix = ['a', 'an', 'the', 'la', 'los', 'las', 'el']; // Also match keys without prefixes! the rolling stones == the rolling stones OR rolling stones
	tags.forEach((handleTags, idx) => {
		if (Object.keys(handleTags).length) {
			const queryTags = Object.keys(handleTags).map((key) => {
					const query = key + ' IS ' + handleTags[key];
					if (key === 'artist' || key === 'album artist') {
						let tfoKey = '$stripprefix(' +  key + ',' + stripPrefix.join(',') + ')';
						let tfoKeyVal = fb.TitleFormat('$stripprefix(' +  handleTags[key] + ',' + stripPrefix.join(',') + ')').Eval(true);
						const tfoQuery = tfoKey + ' IS ' + tfoKeyVal;
						return query + ' OR ' + tfoQuery;
					} else {
						return query;
					}
			});
			if (bSkipLive) {queryTags.push('NOT genre IS live AND NOT style IS live')}
			const query = query_join(queryTags, 'AND');
			const handles = checkQuery(query, true) ? fb.GetQueryItems(fb.GetLibraryItems(), query) : null;
			if (handles && handles.Count) {matches.AddRange(handles)}
			else {
				const tags = {};
				Object.keys(handleTags).forEach((key) => {tags[key] = handleTags[key];});
				notFound.push({idx, tags});
			}
		}
	});
	return {matches, notFound};
}