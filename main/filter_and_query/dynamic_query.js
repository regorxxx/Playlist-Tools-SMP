'use strict';
//29/07/23

/*
	Dynamic Query
	Filters library using query evaluated with selection
*/

include('..\\..\\helpers\\helpers_xxx_playlists.js');
include('..\\sort\\harmonic_mixing.js');

function dynamicQuery({query = 'ARTIST IS #ARTIST#', sort = {tfo: null, direction: 1}, handle = fb.GetFocusItem(true), handleList = null, playlistName = 'Search...', bSendToPls = true} = {}) {
	query = dynamicQueryProcess({query, handle, handleList});
	if (!query) {return null;}
	let outputHandleList = fb.GetQueryItems(fb.GetLibraryItems(), query);
	if (sort !== null && sort.tfo !== null) {outputHandleList.OrderByFormat(fb.TitleFormat(sort.tfo), sort.direction || 1)}
	if (bSendToPls) {
		console.log('Query: ' +  query);
		sendToPlaylist(outputHandleList, playlistName);
	}
	return outputHandleList;
}

function dynamicQueryProcess({query = 'ARTIST IS #ARTIST#', handle = fb.GetFocusItem(true), handleList = null} = {}) {
	if (!query || !query.length) {return null;}
	if (query.indexOf('#') !== -1) {
		if (!handle && !handleList) {return null;} // May pass a standard query which doesn't need a handle to evaluate
		else if (handleList) {
			const queries = [...new Set(handleList.Convert().map((handle) => {
				return /#NEXTKEY#|#PREVKEY#/.test(query) 
					? queryReplaceWithCurrent(queryReplaceKeys(query, handle), handle)
					: queryReplaceWithCurrent(query, handle);
			}))];
			query = query_join(queries, 'OR');
		} else if (handle) {
			if (/#NEXTKEY#|#PREVKEY#/.test(query)) {query = queryReplaceKeys(query, handle);}
			query = queryReplaceWithCurrent(query, handle);
		}
	}
	try {fb.GetQueryItems(new FbMetadbHandleList(), query);}
	catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, 'dynamicQuery'); return null;}
	return query;
}