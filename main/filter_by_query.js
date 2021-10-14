'use strict';
//13/10/21

/*
	Filter by Query
	Filters handle list or playlist using query
*/	

function do_filter_by_query(handleList = null, query = 'ALL') {
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