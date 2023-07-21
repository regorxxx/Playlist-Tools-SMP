'use strict';
//21/07/23

include('..\\..\\helpers\\helpers_xxx_basic_js.js');
include('..\\..\\helpers\\helpers_xxx_prototypes.js');

/*	
	groupByTags
	-----------------------------------
	Reorders selection to group consecutive tracks with the same value by tags ('tagName').
	Respects source sorting, contrary to sorting tools which also group items by values.
	Output is sent to active playlist or as a handle list by setting 'bSendToActivePls'.
*/ 

function groupByTags({
						tagName = ['ALBUM'],
						selItems = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null,
						bSendToActivePls = true
					} = {}) {
	// Safety checks
	if (!tagName.length) {return;}
	if (!selItems || selItems.Count <= 2) {return;}
	// Convert input
	const totalTracks = selItems.Count;
	let selItemsArray = selItems.Clone().Convert();
	// Get tag values
	const tagValues = getTagsValuesV3(selItems, tagName, true);
	const valuesMap = new Map();
	for (let i = 0; i < totalTracks; i++) {
		const tagValue_i = tagValues[i].filter(Boolean).map((item) => {return item.toLowerCase();}).join(', ');
		if (valuesMap.has(tagValue_i)) {
			valuesMap.get(tagValue_i).Add(selItemsArray[i]);
		} else {
			valuesMap.set(tagValue_i, new FbMetadbHandleList([selItemsArray[i]]));
		}
	}
	// And output
	selItemsArray = [...valuesMap.values()].reduce((acc, val) => {acc.AddRange(val); return acc;}, new FbMetadbHandleList());
	if (bSendToActivePls) {
		// 'Hack' Inserts on focus (may be at any place of selection), but then removes the original selection, 
		// so inserted tracks get sent to the right position. Only works for contiguous selections!
		const focusIdx = plman.GetPlaylistFocusItemIndex(plman.ActivePlaylist);
		plman.UndoBackup(plman.ActivePlaylist);
		plman.InsertPlaylistItems(plman.ActivePlaylist, plman.GetPlaylistFocusItemIndex(plman.ActivePlaylist), selItemsArray);
		plman.RemovePlaylistSelection(plman.ActivePlaylist); 
		// Try to restore prev. selection
		let idx = [];
		if (focusIdx === 0) {
			idx = range(0, totalTracks - 1, 1);
		} else {
			const clone = selItemsArray.Clone();
			clone.Sort();
			const plsItems = plman.GetPlaylistItems(plman.ActivePlaylist).Convert();
			const end = focusIdx - totalTracks + 1;
			if (end >= 0) {
				const plsItemsBelow = new FbMetadbHandleList(plsItems.slice(end, end + totalTracks));
				plsItemsBelow.Sort();
				plsItemsBelow.MakeIntersection(clone);
				if	(plsItemsBelow.Count === totalTracks) {idx = range(end, focusIdx, 1);}
			}
			if (end < 0 || !idx.lenth) {
				const plsItemsOver = new FbMetadbHandleList(plsItems.slice(focusIdx, focusIdx + totalTracks));
				plsItemsOver.Sort();
				plsItemsOver.MakeIntersection(clone);
				if	(plsItemsOver.Count === totalTracks) {idx = range(focusIdx, focusIdx + totalTracks - 1, 1);}
			}
		}
		if (idx.length === totalTracks) {
			plman.SetPlaylistSelection(plman.ActivePlaylist, idx, true);
			plman.SetPlaylistFocusItem(plman.ActivePlaylist, focusIdx);
		}
		console.log('Selection grouped by tag(s) \'' + tagName.join(', ') + '\' on playlist: ' + plman.GetPlaylistName(plman.ActivePlaylist));
	}
	return selItemsArray;
}