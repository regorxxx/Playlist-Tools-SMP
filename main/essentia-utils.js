'use strict';
//19/04/22

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\helpers_xxx_file.js');
include('..\\helpers\\helpers_xxx_prototypes.js');

const essentia = {};

essentia.calculateKey = function calculateKey({
		fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
		tagName = 'KEY',
		bMerge = true,
		essentiaPath = folders.xxx + 'helpers-external\\essentia\\essentia_streaming_key.exe',
		bDebug = false,
		bProfile = true
	}) {
	// Safecheck
	if (!fromHandleList || !fromHandleList.Count) {return false;}
	if (!_isFile(essentiaPath)) {fb.ShowPopupMessage('essentia_streaming_key executable not found:\n' + essentiaPath, 'Essentia Key extractor');}
	const profile = bProfile ? new FbProfiler('Essentia Key extractor') : null;
	const handleListArr = fromHandleList.Convert();
	const totalTracks = handleListArr.length, numTracks = 25, maxCount = Math.ceil(totalTracks / numTracks);
	let totalItems = 0;
	let bDone = true;
	let failedItems = [];
	// const rgex = /.*key:.*/gi;
	// const rgexTag = /.*key: "(.*)"/i;
	const rgexKey = /.*key: "(.*)"/i;
	const rgexScale= /.*key_scale: "(.*)"/i;
	const calcKEY = (count) => {
			const currMax = (count + 1) === maxCount ? totalTracks : (count + 1) * numTracks;
			console.log('Processing items: ' + currMax + '/' + totalTracks);
			const items = [];
			const KEY = [];
			const essentiaJSON =  folders.temp + 'essentiaJSON' + (new Date().toDateString() + Date.now()).split(' ').join('_') + '.json';
			let prevProgress = -1, iSteps = (count + 1) === maxCount ? currMax : numTracks;
			handleListArr.slice(count * numTracks, currMax).forEach((handle, i) => {
				const path = handle.Path;
				if (_isFile(path)) {
					if (bDebug) {console.log(_q(essentiaPath) + _q(path) + ' ' + _q(essentiaJSON));}
					_runHidden(essentiaPath.replace('.exe','.bat'), path, essentiaJSON, essentiaPath);
					const data = _open(essentiaJSON);
					if (data) {
						const tag = (data.match(rgexKey) || [,])[1];
						const tagScale = (data.match(rgexScale) || [,])[1];
						const tagMerged = tag + (tagScale.toLowerCase() === 'minor' ? 'm' : '');
						if (tag && tagScale && tag.length && tagScale.length) {
							items.push(handle);
							KEY.push(tagMerged);
						}
					} else {failedItems.push(path);}
					const progress = Math.round((i + 1) / iSteps * 10) * 10;
					if (progress > prevProgress) {prevProgress = progress; console.log('Essentia Key extracting ' + progress + '%.');}
				} else {failedItems.push(path);}
			});
			_deleteFile(essentiaJSON);
			const itemsLength = items.length;
			totalItems += itemsLength;
			if (itemsLength) {
				const tags = KEY.map((value) => {return {[tagName]: value};});
				if (itemsLength === tags.length) {
					new FbMetadbHandleList(items).UpdateFileInfoFromJSON(JSON.stringify(tags));
					if (maxCount > 1) {console.log(itemsLength,'items tagged.');} // Don't repeat this line when all is done in 1 step. Will be printed also later
					bDone = bDone;
				} else {bDone = false; console.log('Tagging failed: unknown error.');}
			}
	}
	for (let count = 0; count < maxCount; count++) {
		calcKEY(count);
	}
	const failedItemsLen = failedItems.length;
	console.popup(totalTracks + ' items processed.\n' + totalItems + ' items tagged.\n' + failedItemsLen + ' items failed.' + (failedItemsLen ? '\n\nList of failed items:\n' + failedItems.join('\n') : ''), 'Essentia Key extractor');
	if (bProfile) {profile.Print('Save Key tags to files - completed in ');}
	return bDone;
}