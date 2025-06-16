﻿'use strict';
//16/06/25

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
 * @param {{ query?: string sort?: { tfo?: string direction: number } handle?: FbMetadbHandle handleList?: FbMetadbHandleList playlistName?: string bSendToPls?: boolean source?: FbMetadbHandleList bToLowerCase?: boolean bForceStatic?: boolean }} { query, sort, handle, handleList, playlistName, bSendToPls, source, bToLowerCase }? [{ query = 'ARTIST IS #ARTIST#', sort = { tfo: null, direction: 1 }, handle = fb.GetFocusItem(true), handleList = null, playlistName = 'Search...', bSendToPls = true, source = null, bToLowerCase = false, bForceStatic = false } = {}]
 * @returns {FbMetadbHandleList | null}
 */
function dynamicQuery({ query = 'ARTIST IS #ARTIST#', sort = { tfo: null, direction: 1 }, handle = fb.GetFocusItem(true), handleList = null, playlistName = 'Search...', bSendToPls = true, source = null, bToLowerCase = false, bForceStatic = false } = {}) {
	query = dynamicQueryProcess({ query, handle, handleList, bToLowerCase, bForceStatic });
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
 * Processes the query string and replaces any placeholders (within #) with actual values from the handleList or handle. If the query is an array, it's processed entry by entry and only the final query (all elements joined) is checked for validity.
 *
 * @function
 * @name dynamicQueryProcess
 * @kind function
 * @param {{ query?: string handle?: FbMetadbHandle handleList?: FbMetadbHandleList bToLowerCase?: boolean bOmitChecks?: boolean bForceStatic?: boolean }} { query, handle, handleList, bToLowerCase, bOmitChecks }? [{ query = 'ARTIST IS #ARTIST#', handle = fb.GetFocusItem(true), handleList = null, bToLowerCase = false, bOmitChecks = false, bForceStatic = false }={}]
 * @returns {string | null}
 */
function dynamicQueryProcess({ query = 'ARTIST IS #ARTIST#', handle = fb.GetFocusItem(true), handleList = null, bToLowerCase = false, bOmitChecks = false, bForceStatic = false } = {}) {
	if (!query || !query.length) { return null; }
	if (Array.isArray(query)) {
		query = query.map((q) => dynamicQueryProcess(
			{query: q, handle, handleList, bToLowerCase, bOmitChecks: true, bForceStatic}
		)).join('');
	} else if (query.includes('#')) {
		if (!handle && !handleList) { // May pass a standard query which doesn't need a handle to evaluate
			return bForceStatic
				? queryReplaceWithCurrent(query)
				: null;
		} else if (handleList) {
			const queries = [...new Set(handleList.Convert().map((handle) => {
				return /#NEXTKEY#|#PREVKEY#/i.test(query)
					? queryReplaceWithCurrent(queryReplaceKeys(query, handle), handle, null, { bToLowerCase })
					: queryReplaceWithCurrent(query, handle, null, { bToLowerCase });
			}))];
			query = queryJoin(queries, 'OR');
		} else if (handle) {
			if (/#NEXTKEY#|#PREVKEY#/i.test(query)) { query = queryReplaceKeys(query, handle); }
			query = queryReplaceWithCurrent(query, handle, null, { bToLowerCase });
		}
	}
	if (!bOmitChecks) {
		try { fb.GetQueryItems(new FbMetadbHandleList(), query); }
		catch (e) { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, 'dynamicQuery'); return null; } // eslint-disable-line no-unused-vars
	}
	return query;
}