'use strict';
//04/04/22

/* 
	Search same style
	Search n tracks (randomly) on library with the same style(s) than the current selected track.
	You can configure the number of tracks at properties panel. Also forced query to pre-filter tracks.
	
	NOTE: If you want to use arbitrary tags, use 'search_same_by.js' instead.
 */

include('..\\helpers\\helpers_xxx_prototypes.js');
include('..\\helpers\\helpers_xxx_playlists.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\helpers_xxx_math.js');
include('remove_duplicates.js');
 
function do_search_same_style({
								sel = fb.GetFocusItem(),
								playlistLength = 50, 
								styleTag = 'style',
								forcedQuery = 'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1) AND NOT (' + styleTag.toUpperCase() + ' IS Live AND NOT ' + styleTag.toUpperCase() + ' IS Hi-Fi) AND %channels% LESS 3 AND NOT COMMENT HAS Quad',
								sortBy = '', 
								checkDuplicatesBy = ['title', 'artist', 'date'],
								bSendToPls = true,
								playlistName = 'Search...',
								bProfile = false,
								bAscii = true // Sanitize all tag values with ACII equivalent chars
							}= {}) {
	if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('do_search_same_style: playlistLength (' + playlistLength + ') must be greater than zero'); return;}
	try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
	catch (e) {fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery); return;}
	if (bProfile) {var test = new FbProfiler('do_search_same_style');}
	if (!sel) {
		console.log('No track selected for mix.');
		return;
	}
	let sel_info = sel.GetFileInfo();
	//Loop styles
	let styleIdx = sel_info.MetaFind(styleTag);
	let styleNumber = (styleIdx !== -1) ? sel_info.MetaValueCount(styleIdx) : 0;
	if (styleNumber === 0) {
		console.log('Track selected has no \'' + styleTag + '\' tag');
		return;
	}
	let style = [];
	style.length = styleNumber;
	let i = 0;
	while (i < styleNumber) {
		style[i] = sel_info.MetaValue(styleIdx,i);
		i++;
	}
	if (bAscii) {style = style.map((val) => {return _asciify(val);});}
	let query = '';
	query += query_combinations(style, styleTag, 'AND');
	if (forcedQuery) {
		query = '(' + query + ') AND ' + forcedQuery;
	}
	
	//Load query
	let outputHandleList;
	try {outputHandleList = fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
	catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query); return;}

	//Find and remove duplicates. Sort Random
	if (checkDuplicatesBy !== null) {
		outputHandleList = do_remove_duplicates(outputHandleList, sortBy, checkDuplicatesBy, void(0), bProfile);
	}
	const oldCount = outputHandleList.Count;
	//Limit n tracks
	outputHandleList.RemoveRange(playlistLength, outputHandleList.Count);
	if (bSendToPls) {
		console.log('Items retrieved by query: ' + oldCount + ' tracks'); 
		sendToPlaylist(outputHandleList, playlistName);
	}
	if (bProfile) {test.Print('Task #1: Search same style tracks', false);}
	return outputHandleList;
}