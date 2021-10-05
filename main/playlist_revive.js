'use strict';

/*
	Playlist Revive v 0.1 09/04/21
	Alternative to foo_playlist_revive.
	Playlist Revive makes dead items in a playlist alive again by replacing them with the matching ones in media library.
	A handy utility for those who often move or rename their media files/folders.
	
	Matching:
		- Audio MD5 (Exact Match)
		- Title + Length + Size (Exact Match)
		- Tags (Similarity)
	
	Usage:
		- Select the tracks in the relevant playlist.
		- Apply script (using a button, menu entry, main menu SMP, etc. associated to it).

 */
 
include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_prototypes.js');
include('..\\helpers\\helpers_xxx_tags.js');

function playlistRevive({
					playlist = plman.ActivePlaylist,
					selItems = plman.GetPlaylistSelectedItems(playlist),
					simThreshold = 1, // 1 only allows exact matches, lower allows some tag differences, but at least the main tag must be the same!
					bSimulate = false,
					} = {}) {
	if (typeof selItems === 'undefined' || selItems === null || selItems.Count === 0) {
		return;
	}
	
	let cache = new Set();
	
	// Filter items which already exist
	let items = new FbMetadbHandleList();
	selItems.Convert().forEach( (handle) => {
		if (cache.has(handle.RawPath)) {return;}
		if (utils.FileExists(handle.Path)) {cache.add(handle.RawPath);return;}
		if (handle.RawPath.indexOf('file://') === -1) {cache.add(handle.RawPath);return;} // Exclude streams and title-only tracks
		items.Insert(items.Count, handle);
	});
	console.log('Found ' + items.Count + ' dead item(s) on ' + (plman.ActivePlaylist === playlist ? 'active' : '')+ ' playlist: ' + plman.GetPlaylistName(playlist));
	if (!items.Count) {return;}
	// Filter library with items with same tags
	// First tag is considered the main one -> Exact Match: first tag + length + size OR first tag is a requisite to match by similarity
	// The other tags are considered crc checks -> Exact Match: any crc tag is matched. Otherwise, continue checking the other tags (See above).
	const tagsToCheck = ['title', 'audiomd5', 'md5'];
	const tags = getTagsValuesV4(items, tagsToCheck, void(0), void(0), null);
	if (tags === null || Object.prototype.toString.call(tags) !== '[object Array]' || tags.length === null || tags.length === 0) {return;}
	let queryArr = [];
	tagsToCheck.forEach( (tagName, index) => {
		queryArr.push(query_combinations(tags[index].filter(String), tagName, 'OR'));
	});
	// instead of using this, which would combine the different tags too
	// const query =  query_join(query_combinations(tags, tagsToCheck, 'OR', 'OR'), 'OR');
	const query = query_join(queryArr.filter(Boolean), 'OR');
	if (bSimulate) {console.log('Filtered library by: ' + query);}
	try {fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
	catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query); return;}
	const libraryItems = fb.GetQueryItems(fb.GetLibraryItems(), query);
	const tagsLibrary = getTagsValuesV4(libraryItems, tagsToCheck, void(0), void(0), null);
	const libraryItemsArr = libraryItems.Convert();
	// Find coincidences in library
	// Checks all tags from reference track and compares to all tags from library tracks that passed the filter
	// All tracks that pass the threshold are considered as alternatives, and sorted by similarity
	let alternatives = new Map();
	items.Convert().forEach( (handle, index) => {
		let alternativesSet = new Set();
		let alternativesObj = []; // {idx: , simil: , bExact: }
		if (isCompatible('1.4.0') ? utils.IsFile(handle.Path) : utils.FileTest(handle.Path, 'e')) {return;}
		const info = handle.GetFileInfo();
		if (!info) {return;}
		let numTags = 0;
		for (let i = 0; i < info.MetaCount; i++) {numTags += info.MetaValueCount(i);}
		let bExact = false; // For exact matching: title, size and length
		libraryItemsArr.forEach( (handleLibr, indexLibr) => {
			if (bExact) {return;} // No need to continue then
			const infoLibr = handleLibr.GetFileInfo();
			if (!infoLibr) {return;}
			let count = 0;
			const md5Idx = info.InfoFind('md5'), md5LibrIdx = infoLibr.InfoFind('md5'); // With same MD5 info, it's an exact match
			if (md5Idx !== -1 && md5LibrIdx !== -1 && info.InfoValue(md5Idx) === infoLibr.InfoValue(md5LibrIdx)) {count = numTags; bExact = true;}
			let tag = tags[1][index][0], tagLibr = tagsLibrary[1][indexLibr][0];
			if (tag.length && tagLibr.length && tag === tagLibr) {count = numTags; bExact = true;} // With same AUDIOMD5 tag, it's an exact match too
			tag = tags[2][index][0], tagLibr = tagsLibrary[2][indexLibr][0];
			if (tag.length && tagLibr.length && tag === tagLibr) {count = numTags; bExact = true;} // With same MD5 tag, it's an exact match too
			// Check tags
			if (new Set(tags[0][index]).intersectionSize(new Set(tagsLibrary[0][indexLibr]))) { // Instead of checking equality, tracks may have more than one title (?)
				if (handle.Length === handleLibr.Length) {
					count++; // Bonus score if it changed tags and thus size but length is the same
					if (handle.FileSize === handleLibr.FileSize) {count = numTags; bExact = true;}  // Or may have changed nothing, being exact match
				}
				for (let i = 0; i < info.MetaCount; i++) {
					if (numTags === count) {break;}
					for (let j = 0; j < infoLibr.MetaCount; j++) {
						if (numTags === count) {break;}
						const numVal = info.MetaValueCount(i);
						const numValLibr = infoLibr.MetaValueCount(j);
						for (let ii = 0; ii < numVal; ii++) {
							for (let jj = 0; jj < numValLibr; jj++) {
								if (info.MetaValue(i, ii) === infoLibr.MetaValue(j, jj)) {
									count++;
									break;
								}
							}
						}
					}
				}
			}
			if (bExact || isFinite(numTags) && numTags !== 0 && count / numTags >= simThreshold && !alternativesSet.has(indexLibr)) {
				alternativesSet.add(indexLibr);
				alternativesObj.push({idx: indexLibr, simil: Math.round(count / numTags * 100), bExact});
			}
		});
		if (alternativesSet.size !== 0) {alternatives.set(index, alternativesObj.sort(function (a, b) {return b.simil - a.simil;}));}
	});
	console.log('Found ' + alternatives.size + ' alternative(s) on active playlist');
	if (alternatives.size !== 0) {
		let bOverHundred = false;
		let bExact = false;
		// Process the alternatives
		alternatives.forEach ( (newHandleIdx, oldHandleIdx) => {
			const idx = selItems.Find(items[oldHandleIdx]);
			if (!bSimulate) { // Remove old items and insert new ones
				selItems.RemoveById(idx);
				selItems.Insert(idx, libraryItemsArr[newHandleIdx[0].idx]); // Always use the most similar item
				if (newHandleIdx[0].simil > 100) {bOverHundred = true;}
				if (newHandleIdx[0].bExact) {bExact = true;}
				console.log(items[oldHandleIdx].Path + '   --(' + (newHandleIdx[0].bExact ? 'Exact Match': newHandleIdx[0].simil + '% ') + ')-->   \n                  ' +  libraryItemsArr[newHandleIdx[0].idx].Path);
			} else { // Just console log
				newHandleIdx.forEach ( (obj) => {
					if (obj.simil > 100) {bOverHundred = true;}
					if (obj.bExact) {bExact = true;}
					console.log(items[oldHandleIdx].Path + '   --(' + (obj.bExact ? 'Exact Match': obj.simil + '% ') + ')-->   \n                  ' +  libraryItemsArr[obj.idx].Path);
				});
			}
		});
		// Extra info
		if (bOverHundred) {console.log('Tracks with a similarity value over 100% have been found. It\'s not an error, but an indicator that the new track matches all tags and has new ones compared to the dead one');}
		if (bExact) {console.log('Exact matches have been found. That means the tracks have the same Audio MD5 or Title + Length + File Size.');}
		// Remove all handles and insert new ones
		if (!bSimulate) {
			plman.UndoBackup(playlist);
			if (selItems.Count !== plman.PlaylistItemCount(playlist)) { // When selecting only a portion, replace selection and left the rest untouched
				const listItems = plman.GetPlaylistItems(playlist);
				let selectedIdx = [];
				listItems.Convert().forEach((handle, idx) => {
					if (plman.IsPlaylistItemSelected(playlist, idx)) {
						items.Convert().forEach((handleDead, idxDead) => {
							if (handle.RawPath === handleDead.RawPath) {
								if (alternatives.has(idxDead)) {
									listItems.RemoveById(idx);
									listItems.Insert(idx, libraryItemsArr[alternatives.get(idxDead)[0].idx]);
								}
							}
						});
						selectedIdx.push(idx);
					}
				});
				plman.ClearPlaylist(playlist);
				plman.InsertPlaylistItems(playlist, 0, listItems);
				plman.SetPlaylistSelection(playlist, selectedIdx, true);
			} else { 	// Just replace entire playlist
				plman.ClearPlaylist(playlist);
				plman.InsertPlaylistItems(playlist, 0, selItems);
			}
		}
	}
	fb.ShowConsole();
}

function findDeadItems() {
	let deadItems = [];
	const bComp = isCompatible('1.4.0') ;
	for (let i = 0; i < plman.PlaylistCount; i++) {
		if (!plman.IsAutoPlaylist(i)) { // Autoplaylist are created on startup, no need to check for dead items
			const selItems = plman.GetPlaylistItems(i);
			let count = 0;
			selItems.Convert().forEach( (handle) => {
				if (bComp ? utils.IsFile(handle.Path) : utils.FileTest(handle.Path, 'e')) {return;}
				if (handle.RawPath.indexOf('file://') === -1) {return;} // Exclude streams and title-only tracks
				count++;
			});
			if (count) {deadItems.push({name: plman.GetPlaylistName(i), idx: i, items: count});}
		}
	}
	if (deadItems.length) {
		const header = 'Found playlist(s) with dead items:';
		console.log(header);
		let list = '';
		deadItems.forEach( (playlistObj) => {
			list += playlistObj.name + ': ' + playlistObj.items + '\n';
			console.log(playlistObj.name + ': ' + playlistObj.items);
		});
		fb.ShowPopupMessage(header + '\n' + list, 'Dead Playlists');
	} else {
		const header = 'No playlist found with dead items.';
		fb.ShowPopupMessage(header, 'Dead Playlists');
	}
	return deadItems;
}

function playlistReviveAll() {
	const deadItems = findDeadItems();
	if (deadItems.length) {
		deadItems.forEach( (playlistObj) => {
			if (playlistObj.name === plman.GetPlaylistName(playlistObj.idx)) { // Safety check
				playlistRevive({playlist: playlistObj.idx, selItems: plman.GetPlaylistItems(playlistObj.idx), simThreshold: 1});
			}
		});
	}
}