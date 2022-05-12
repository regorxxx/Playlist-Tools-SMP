'use strict';
//23/11/21

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\helpers_xxx_file.js');
include('..\\helpers-external\\fooid-utils-js\\fooid-utils-js.js'); 

fooidUtils.compareFingerprints = function compareFingerprints({
		fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
		toHandleList = fb.GetLibraryItems(),
		tagName = 'fingerprint_fooid',
		threshold = 85,
		playlistName = 'Search...',
		bSendToPls = true
	}) {
	// Safecheck
	if (!fromHandleList || !fromHandleList.Count || !toHandleList || !toHandleList.Count) {return null;}
	// Get Tags
	const fromTags = getTagsValuesV4(fromHandleList, [tagName], true).flat(1);
	const toTags = getTagsValuesV4(toHandleList, [tagName], true).flat(1);
	// Compute similarity
	const simil = new Map();
	fromTags.forEach((fromTag, i) => {
		if (fromTag && fromTag.length) {
			toTags.forEach((toTag, idx) => {
				if (toTag && toTag.length) {
					const similarity = round(this.correlate(toTag, fromTag) * 100, 1);
					if (similarity > threshold) {
						if (simil.has(i)) {simil.set(i, simil.get(i).concat([{idx, similarity}]));}
						else {simil.set(i, [{idx, similarity}]);}
					}
				}
			});
		}
	});
	// Check results
	let outputHandleList = new FbMetadbHandleList();
	if (simil.size) {
		const outputItems = [];
		const report = [];
		simil.forEach((foundArr, i) => {
			if (foundArr && foundArr.length) {
				foundArr.forEach((foundObj) => {
					outputItems.push(toHandleList[foundObj.idx]);
					report.push(toHandleList[foundObj.idx].Path + ' (' + foundObj.similarity + '%)');
				});
			}
		});
		if (outputItems.length) {outputHandleList = new FbMetadbHandleList(outputItems);}
		// Output to playlist
		if (bSendToPls) {
			if (outputHandleList.Count) {
				// Clear playlist if needed. Preferred to removing it, since then we could undo later...
				// Look if target playlist already exists
				let i = 0;
				let plc = plman.PlaylistCount;
				while (i < plc) {
					if (plman.GetPlaylistName(i) === playlistName) {
						plman.ActivePlaylist = i;
						break;
					} else {
						i++;
					}
				}
				if (i === plc) { //if no playlist was found before
					plman.CreatePlaylist(plc, playlistName);
					plman.ActivePlaylist = plc;
				}
				if (plman.PlaylistItemCount(plman.ActivePlaylist)) {
					plman.UndoBackup(plman.ActivePlaylist);
					plman.ClearPlaylist(plman.ActivePlaylist);
				}
				// Create playlist
				console.log('Found: ' +  outputItems.length  + ' tracks');
				plman.InsertPlaylistItems(plman.ActivePlaylist, 0, outputHandleList);
				fb.ShowPopupMessage('Similar tracks found:\n' + report.join('\n'), 'Fingerprint Tag');
			} else {fb.ShowPopupMessage('No similar tracks were found.', 'Fingerprint Tag');}
		}
	} else if (bSendToPls) {fb.ShowPopupMessage('No similar tracks were found.', 'Fingerprint Tag');}
	return outputHandleList;
};

fooidUtils.calculateFingerprints = function calculateFingerprints({
		fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist)
	}) {
	// Safecheck
	if (!fromHandleList || !fromHandleList.Count) {return false;}
	if (!utils.CheckComponent('foo_biometric', true)) {fb.ShowPopupMessage('foo_biometric component is not installed.', 'FooID Tag'); return;}
	console.log(fromHandleList.Count,'items processed.')
	const bSucess = fb.RunContextCommandWithMetadb('Save fingerprint to file(s)', fromHandleList, 8);
	if (bSucess) {console.log(fromHandleList.Count,'items tagged.');}
	return bSucess;
}