'use strict';
//20/03/22

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\helpers_xxx_file.js');

const ffmpeg = {};

ffmpeg.calculateLoudness = function calculateLoudness({
		fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
		tagName = 'LRA',
		bMerge = true,
		ffmpegPath = folders.xxx + 'helpers-external\\ffmpeg\\ffmpeg.exe',
		bDebug = false,
		bProfile = true
	}) {
	// Safecheck
	if (!fromHandleList || !fromHandleList.Count) {return false;}
	if (!_isFile(ffmpegPath)) {fb.ShowPopupMessage('ffmpeg executable not found:\n' + ffmpegPath, 'EBUR 128 Scanner');}
	const profile = bProfile ? new FbProfiler('EBUR 128 Scanner') : null;
	const handleListArr = fromHandleList.Convert();
	const totalTracks = handleListArr.length, numTracks = 100, maxCount = Math.ceil(totalTracks / numTracks);
	let totalItems = 0;
	let bDone = true;
	let failedItems = [];
	const calcLRA = (count) => {
			const currMax = (count + 1) === maxCount ? totalTracks : (count + 1) * numTracks;
			console.log('Processing items: ' + currMax + '/' + totalTracks);
			const items = [];
			const LRA = [];
			const ffmpegJSON =  folders.data + 'ffmpegJSON' + (new Date().toDateString() + Date.now()).split(' ').join('_') + '.json';
			let prevProgress = -1, iSteps = (count + 1) === maxCount ? currMax : numTracks;
			handleListArr.slice(count * numTracks, currMax).forEach((handle, i) => {
				const path = handle.Path;
				if (_isFile(path)) {
					if (bDebug) {console.log(_q(ffmpegPath) + ' -i ' + _q(path) + ' -af loudnorm=dual_mono=true:print_format=json -nostats -f null -  2>&1 | > ' + _q(ffmpegJSON) + ' FINDSTR /BIR "{ .*\\" }"');}
					_runHidden(ffmpegPath.replace('.exe','.bat'), path, ffmpegJSON, ffmpegPath);
					const data = _jsonParseFileCheck(ffmpegJSON);
					if (data && data.hasOwnProperty('input_lra')) {
						items.push(handle);
						LRA.push(data.input_lra);
					} else {failedItems.push(path);}
					const progress = Math.round((i + 1) / iSteps * 10) * 10;
					if (progress > prevProgress) {prevProgress = progress; console.log('EBUR 128 scanning ' + progress + '%.');}
				} else {failedItems.push(path);}
			});
			_deleteFile(ffmpegJSON);
			const itemsLength = items.length;
			totalItems += itemsLength;
			if (itemsLength) {
				const tags = LRA.map((value) => {return {[tagName]: value};});
				if (itemsLength === tags.length) {
					new FbMetadbHandleList(items).UpdateFileInfoFromJSON(JSON.stringify(tags));
					if (maxCount > 1) {console.log(itemsLength,'items tagged.');} // Don't repeat this line when all is done in 1 step. Will be printed also later
					bDone = bDone;
				} else {bDone = false; console.log('Tagging failed: unknown error.');}
			}
	}
	for (let count = 0; count < maxCount; count++) {
		calcLRA(count);
	}
	const failedItemsLen = failedItems.length;
	console.popup(totalTracks + ' items processed.\n' + totalItems + ' items tagged.\n' + failedItemsLen + ' items failed.' + (failedItemsLen ? '\n\nList of failed items:\n' + failedItems.join('\n') : ''), 'EBUR 128 Scanner');
	if (bProfile) {profile.Print('Save Loudness tags to files - completed in ');}
	return bDone;
}