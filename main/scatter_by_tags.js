﻿'use strict';
//06/10/22

/*	
	Scatter by tags
	-----------------------------------
	Reorders selection to avoid consecutive tracks with the same 'tagValue' on tags ('tagName').
	Can be used to scatter instrumental tracks, an specific genre, etc.
	Output is sent to active playlist or as a handle list by setting 'bSendToActivePls'.
*/ 

// For an specific value (tagValue) for a given tag (tagName)
function scatterByTags({
							tagName = 'GENRE,STYLE',
							tagValue = 'instrumental',
							selItems = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null,
							bSendToActivePls = true,
							} = {}) {
	// Safety checks
	if (!tagName.length) {return;}
	if (!tagValue.length) {return;}
	if (!selItems || selItems.Count <= 2) {return;}
	// Convert input
	const totalTracks = selItems.Count;
	tagName = tagName.split(/;|,/g);
	tagValue = tagValue.toLowerCase().split(/;|,/g);
	const tagValueSet = new Set(tagValue);
	let selItemsArray = selItems.Clone().Convert();
	// Get tag values and find tag value
	const tagValues = getTagsValuesV3(selItems, tagName, true);
	let newOrder = [];
	for (let i = 0; i < totalTracks; i++) {
		const tagValue_i = tagValues[i].filter(Boolean).map((item) => {return item.toLowerCase();});
		const tagSet_i = new Set(tagValue_i);
		if (tagSet_i.intersectionSize(tagValueSet)) { // Any match, then add to reorder list
			newOrder.push(i);
		}
	}
	// Reorder
	const toMoveTracks = newOrder.length;
	const scatterInterval = toMoveTracks ? Math.round(totalTracks / toMoveTracks) : 0;
	if (scatterInterval >= 2) { // Lower value means we can not uniformly scatter instrumental tracks, better left it 'as is'
		let removed = [];
		[...newOrder].reverse().forEach((index) => {
			removed.push(...selItemsArray.splice(index, 1));
		});
		removed.reverse();
		removed.forEach((handle, index) => {
			const i_scatterInterval = index * scatterInterval;
			let j = Math.floor(Math.random() * (scatterInterval - 1)) + i_scatterInterval;
			if (j === 0 && scatterInterval > 2) {j = 1;} // Don't put first track as instrumental if possible
			selItemsArray.splice(j, 0, handle); // (at, 0, item)
		});
	} else {return selItems;}
	// And output
	selItemsArray = new FbMetadbHandleList(selItemsArray);
	if (bSendToActivePls) {
		// 'Hack' Inserts on focus (may be at any place of selection), but then removes the original selection, 
		// so inserted tracks get sent to the right position. Only works for contiguous selections!
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
		console.log('Selection scattered by tag(s) \'' + tagValue.join(',') + '\' (' + tagName.join(', ') + ') on playlist: ' + plman.GetPlaylistName(plman.ActivePlaylist));
	}
	return selItemsArray;
}

// Does the same but for any value for a given tag
function intercalateByTags({
							tagName = 'ARTIST',
							selItems = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null,
							bSendToActivePls = true,
							} = {}) {
	// Safety checks
	if (!tagName.length) {return;}
	if (!selItems || selItems.Count <= 2) {return;}
	// Convert input
	const totalTracks = selItems.Count;
	tagName = tagName.split(/;|,/g);
	let selItemsArray = selItems.Convert();
	let selItemsArrayOut = [];
	// Get tag values and find tag value
	// Split elements by equal value, by reverse order
	const tagValues = getTagsValuesV3(selItems, tagName, true).map((item) => {return item.filter(Boolean).sort().map((item) => {return item.toLowerCase();}).join(',');});
	let valMap = new ReverseIterableMap();
	for (let i = totalTracks - 1; i >= 0; i--) {
		const val = tagValues[i];
		if (valMap.has(val)) {
			const newVal = valMap.get(val);
			newVal.push(i);
			valMap.set(val, newVal);
		} else {
			valMap.set(val, [i]);
		}
	}
	// Intercalate them by reverse order again
	while (valMap.size) {
		let toDelete = [];
		valMap.forEachReverse((value, key) => {
			selItemsArrayOut.push(selItemsArray[value.pop()]);
			if (!value.length) {toDelete.push(key);}
		});
		toDelete.forEach((key) => {valMap.delete(key);});
	}
	// And output
	selItemsArray = new FbMetadbHandleList(selItemsArrayOut);
	if (bSendToActivePls) {
		// 'Hack' Inserts on focus (may be at any place of selection), but then removes the original selection, 
		// so inserted tracks get sent to the right position. Only works for contiguous selections!
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
		console.log('Selection scattered by tag(s) \'' + tagName.join(',') + '\' on playlist: ' + plman.GetPlaylistName(plman.ActivePlaylist));
	}
	return selItemsArray;
}

// Applies semi-random patterns, not allowing the same artist 2 times in a row, while not falling into strict intercalation
// Based on: https://engineering.atspotify.com/2014/02/how-to-shuffle-songs/
// Note for some proportions there is an exact solution, and that's used instead of relying on the random method
function shuffleByTags({
							tagName = 'ARTIST',
							selItems = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null,
							bSendToActivePls = true,
							} = {}) {
	// Safety checks
	if (!tagName.length) {return;}
	if (!selItems || selItems.Count <= 2) {return;}
	// Convert input and shuffle
	const totalTracks = selItems.Count;
	tagName = tagName.split(/;|,/g);
	let selItemsArray = selItems.Convert().shuffle();
	let selItemsClone = new FbMetadbHandleList(selItemsArray);
	let selItemsArrayOut = [];
	let tagValuesOut = [];
	// Get tag values and find tag value
	// Split elements by equal value, by reverse order
	const tagValues = getTagsValuesV3(selItemsClone, tagName, true).map((item) => {return item.filter(Boolean).sort().map((item) => {return item.toLowerCase();}).join(',');});
	let valMap = new ReverseIterableMap();
	for (let i = totalTracks - 1; i >= 0; i--) {
		const val = tagValues[i];
		if (valMap.has(val)) {
			const newVal = valMap.get(val);
			newVal.push(i);
			valMap.set(val, newVal);
		} else {
			valMap.set(val, [i]);
		}
	}
	// Calculate distribution
	const size = valMap.size;
	const distMap = new ReverseIterableMap();
	let bSolved = false, solution = '';
	valMap.forEach((value, key) => {
		const total = value.length;
		if ((totalTracks - total) === (total - 1)) {bSolved = true; solution = key;} // Only 1 exact solution intercalating tracks
		if (bSolved) {return;}
		const dist = totalTracks / total;
		const offset = bSolved ? 0: Math.random() * (totalTracks - total) / total;
		distMap.set(key, {dist, total, offset});
	})
	// Calculate timeline
	let timeLine = [];
	if (bSolved) {
		const keys = [...valMap.keys()].filter((key) => {return key !== solution;});
		timeLine = Array(totalTracks).fill(null).map((val, i) => {
			return {pos: i, key: (i % 2 === 0 ? solution : keys.splice(Math.floor(Math.random() * keys.length), 1)[0])};
		});
	} else {
		const timeLineMap = new ReverseIterableMap();
		distMap.forEach((value, key) => {
			const line = [];
			line.push({pos: value.offset, key});
			for (let i = 1; i < value.total; i++) {
				line.push({pos: value.offset + value.dist * (1 + (Math.random() * 2 - 1) * Math.random() * 0.3 ) * i, key});
			}
			timeLineMap.set(key, line);
		})
		timeLine = [...timeLineMap.values()].flat(Infinity).sort((a,b) => {return a.pos - b.pos;});
	}
	timeLine.forEach((track) => {
		const key = track.key;
		const tracks = valMap.get(key);
		const tracksNum = tracks.length;
		// Select a random track with chosen value
		const n = Math.floor(Math.random() * tracksNum);
		const index = tracks.splice(n, 1);
		selItemsArrayOut.push(selItemsArray[index]);
		tagValuesOut.push(tagValues[index]);
		// Delete empty values
		if ((tracksNum - 1) === 0) {
			valMap.delete(key); 
		}
	});
	// And output
	selItemsArray = new FbMetadbHandleList(selItemsArrayOut);
	if (bSendToActivePls) {
		// 'Hack' Inserts on focus (may be at any place of selection), but then removes the original selection, 
		// so inserted tracks get sent to the right position. Only works for contiguous selections!
		plman.UndoBackup(plman.ActivePlaylist);
		const focusIdx = plman.GetPlaylistFocusItemIndex(plman.ActivePlaylist);
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
		console.log('Selection scattered by tag(s) \'' + tagName.join(',') + '\' on playlist: ' + plman.GetPlaylistName(plman.ActivePlaylist));
	}
	return selItemsArray;
}