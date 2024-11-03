'use strict';
//30/10/24

/* exported filterByQuery, selectByQuery */

/*
	Filter by Query
	Filters handle list or playlist using query
*/

function filterByQuery(handleList = null, query = 'ALL') {
	if (!query || !query.length || query === 'ALL') {
		return handleList;
	}

	let items; // Active playlist or input list?
	let bActivePlaylist = false;
	if (handleList === null) {
		bActivePlaylist = true;
		handleList = plman.GetPlaylistItems(plman.ActivePlaylist);
	}

	items = handleList.Clone();
	items = fb.GetQueryItems(items, query);

	if (bActivePlaylist) {
		let removedCount = handleList.Count - items.Count;
		if (removedCount) { // Send to active playlist if there was no input list and changes were made
			plman.UndoBackup(plman.ActivePlaylist);
			plman.ClearPlaylist(plman.ActivePlaylist);
			plman.InsertPlaylistItems(plman.ActivePlaylist, 0, items);
			console.log('Removed ' + removedCount + ' tracks from active playlist by: ' + query);
		} else {
			console.log('No tracks removed by: ' + query);
		}
	}
	return items;
}

function selectByQuery(handleList = null, query = 'ALL') {
	if (!query || !query.length || query === 'ALL') {
		return handleList;
	}

	let items; // Active playlist or input list?
	let bActivePlaylist = false;
	if (handleList === null) {
		bActivePlaylist = true;
		handleList = plman.GetPlaylistItems(plman.ActivePlaylist);
	}

	items = handleList.Clone();
	items = fb.GetQueryItems(items, query);

	if (bActivePlaylist) {
		let selCount = items.Count;
		plman.ClearPlaylistSelection(plman.ActivePlaylist);
		if (selCount) { // Send to active playlist if there was no input list and changes were made
			const selIdx = [];
			const selItems = items.Clone();
			selItems.Sort();
			handleList.Convert().map((handle, i) => {
				if (selItems.BSearch(handle) !== -1) {selIdx.push(i);}
			});
			plman.SetPlaylistSelection(plman.ActivePlaylist, selIdx, true);
			console.log('Selected ' + selCount + ' tracks from active playlist by: ' + query);
		} else {
			console.log('No tracks selected by: ' + query);
		}
	}
	return items;
}