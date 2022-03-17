'use strict';
//17/03/22

/* 
	Search same style and moods
	Search n tracks (randomly) on library matching at least 2 styles and 6 moods from the current selected track.
	You can configure the number of tracks at properties panel. Also forced query to pre-filter tracks.
		
	NOTE: If you want to use arbitrary tags, use 'search_same_by.js' instead.
 */

include('..\\helpers\\helpers_xxx_playlists.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\helpers_xxx_math.js');
include('remove_duplicates.js');
 
function do_search_same_style_moods({
										playlistLength = 50,
										styleTag = 'style',
										moodTag = 'mood',
										forcedQuery = 'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1) AND NOT (' + styleTag.toUpperCase() + ' IS Live AND NOT ' + styleTag.toUpperCase() + ' IS Hi-Fi) AND %channels% LESS 3 AND NOT COMMENT HAS Quad',
										sortBy = '',
										checkDuplicatesBy = ['title', 'artist', 'date'],
										bSendToPls = true,
										playlistName = 'Search...',
										bProfile = false
									} = {}) {
	if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('do_search_same_style_moods: playlistLength (' + playlistLength + ') must be greater than zero'); return;}							
	try {fb.GetQueryItems(new FbMetadbHandleList(), forcedQuery);} // Sanity check
	catch (e) {fb.ShowPopupMessage('Query not valid. Check forced query:\n' + forcedQuery); return;}
	if (bProfile) {var test = new FbProfiler('do_search_same_style_moods');}
	let sel = fb.GetFocusItem();
	if (!sel) {
		console.log('No track selected for mix.');
		return;
	}  
	let query = [];
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
	let ql = query.length;
	let i = 0;
	while (i < styleNumber) {
		style[i] = sel_info.MetaValue(styleIdx,i);
		i++;
	}
	let k = styleNumber >= 2 ? 2 : 1; //on combinations of 2
	style = k_combinations(style, k); 
	query[ql] = '';
	query[ql] += query_combinations(style, styleTag, 'OR', 'AND');
			
	//Loop moods
	let moodIdx = sel_info.MetaFind(moodTag);
	let moodNumber = (moodIdx !== -1) ? sel_info.MetaValueCount(moodIdx) : 0;
	if (moodNumber === 0) {
		console.log('Track selected has no \'' + moodTag + '\' tag');
		return;
	}
	let mood = [];
	mood.length = moodNumber;
	ql = query.length;
	i = 0;
	while (i < moodNumber) {
		mood[i] = sel_info.MetaValue(moodIdx,i);
		i++;
	}
	k = moodNumber >= 6 ? 6 : moodNumber; //on combinations of 6
	mood = k_combinations(mood, k);
	query[ql] = '';
	query[ql] += query_combinations(mood, moodTag, 'OR', 'AND');
	
	//Query
	ql = query.length;
	query[ql] = query_join(query, 'AND'); //join previous query's
	if (forcedQuery) {
		query[ql] = '(' + query[ql] + ') AND ' + forcedQuery;
	}
	
	//Load query
	let outputHandleList;
	try {outputHandleList = fb.GetQueryItems(fb.GetLibraryItems(), query[ql]);} // Sanity check
	catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query[ql]); return;}
	
	//Find and remove duplicates
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
	if (bProfile) {test.Print('Task #1: Search same style/mood tracks', false);}
	return outputHandleList;
}