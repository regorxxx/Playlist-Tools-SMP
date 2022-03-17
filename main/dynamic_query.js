'use strict';
//17/03/22

/*
	Dynamic Query
	Filters library using query evaluated with selection
*/

include('..\\helpers\\helpers_xxx_playlists.js');

function do_dynamic_query({query = 'ARTIST IS #ARTIST#', sort = {tfo: null, direction: 1}, handle = fb.GetFocusItem(true), handleList = null, playlistName = 'Search...', bSendToPls = true} = {}) {
	if (!query || !query.length) {return null;}
	
	if (query.indexOf('#') !== -1) {
		if (!handle && !handleList) {return null;} // May pass a standard query which doesn't need a handle to evaluate
		else if (handleList) {query = query_join(handleList.Convert().map((handle) => {return queryReplaceWithCurrent(query, handle);}), 'OR');}
		else if (handle) {query = queryReplaceWithCurrent(query, handle);}
	}
	try {fb.GetQueryItems(new FbMetadbHandleList(), query);}
	catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, 'do_dynamic_query'); return null;}
	let outputHandleList = fb.GetQueryItems(fb.GetLibraryItems(), query);
	if (sort !== null && sort.tfo !== null) {outputHandleList.OrderByFormat(fb.TitleFormat(sort.tfo), sort.direction || 1)}
	if (bSendToPls) {
		console.log('Query: ' +  query);
		sendToPlaylist(outputHandleList, playlistName);
	}
	return outputHandleList;
}