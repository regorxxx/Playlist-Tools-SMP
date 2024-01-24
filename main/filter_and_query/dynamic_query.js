'use strict';
//21/01/24

/* exported dynamicQuery */

/*
	Dynamic Query
	Filters library using query evaluated with selection
*/

include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryReplaceWithCurrent:readable, queryJoin:readable */
include('..\\sort\\harmonic_mixing.js');
/* global queryReplaceKeys:readable */

/**
 * Processes the dynamic query against the handleList or handle and outputs a handleList or sends results to a playlist.
 *
 * @function
 * @name dynamicQuery
 * @kind function
 * @param {{ query?: string sort?: { tfo?: string direction: number } handle?: FbMetadbHandle handleList?: FbMetadbHandleList playlistName?: string bSendToPls?: boolean source?: FbMetadbHandleList  bToLowerCase?: boolean  }} { query, sort, handle, handleList, playlistName, bSendToPls, source, bToLowerCase }? [{ query = 'ARTIST IS #ARTIST#', sort = { tfo: null, direction: 1 }, handle = fb.GetFocusItem(true), handleList = null, playlistName = 'Search...', bSendToPls = true, source = null, bToLowerCase = false } = {}]
 * @returns {FbMetadbHandleList | null}
 */
function dynamicQuery({ query = 'ARTIST IS #ARTIST#', sort = { tfo: null, direction: 1 }, handle = fb.GetFocusItem(true), handleList = null, playlistName = 'Search...', bSendToPls = true, source = null, bToLowerCase = false } = {}) {
	query = dynamicQueryProcess({ query, handle, handleList, bToLowerCase });
	if (!query) { return null; }
	let outputHandleList = fb.GetQueryItems(source || fb.GetLibraryItems(), query);
	if (sort && sort.tfo !== null && sort.tfo.length) { outputHandleList.OrderByFormat(fb.TitleFormat(sort.tfo), sort.direction || 1); }
	if (bSendToPls) {
		console.log('Query: ' + query);
		sendToPlaylist(outputHandleList, playlistName);
	}
	return outputHandleList;
}

/**
 * Processes the query string and replaces any placeholders (within #) with actual values from the handleList or handle.
 *
 * @function
 * @name dynamicQueryProcess
 * @kind function
 * @param {{ query?: string handle?: FbMetadbHandle handleList?: FbMetadbHandleList bToLowerCase?: boolean }} { query, handle, handleList, bToLowerCase }? [{ query = 'ARTIST IS #ARTIST#', handle = fb.GetFocusItem(true), handleList = null, bToLowerCase = false }={}]
 * @returns {string | null}
 */
function dynamicQueryProcess({ query = 'ARTIST IS #ARTIST#', handle = fb.GetFocusItem(true), handleList = null, bToLowerCase = false } = {}) {
	if (!query || !query.length) { return null; }
	if (query.indexOf('#') !== -1) {
		if (!handle && !handleList) { return null; } // May pass a standard query which doesn't need a handle to evaluate
		else if (handleList) {
			const queries = [...new Set(handleList.Convert().map((handle) => {
				return /#NEXTKEY#|#PREVKEY#/.test(query)
					? queryReplaceWithCurrent(queryReplaceKeys(query, handle), handle, null, { bToLowerCase })
					: queryReplaceWithCurrent(query, handle, null, { bToLowerCase });
			}))];
			query = queryJoin(queries, 'OR');
		} else if (handle) {
			if (/#NEXTKEY#|#PREVKEY#/.test(query)) { query = queryReplaceKeys(query, handle); }
			query = queryReplaceWithCurrent(query, handle, null, { bToLowerCase });
		}
	}
	try { fb.GetQueryItems(new FbMetadbHandleList(), query); }
	catch (e) { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, 'dynamicQuery'); return null; }
	return query;
}