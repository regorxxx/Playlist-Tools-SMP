'use strict';
//05/07/25

/* exported ffprobeUtils */

include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable, soFeat:readable, globTags:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, _deleteFile:readable, _runHidden:readable, _jsonParseFileCheck:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _q:readable, round:readable */

const ffmpeg = {};

ffmpeg.calculateLoudness = function calculateLoudness({
	fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
	tagName = globTags.lra,
	ffmpegPath = folders.xxx + 'helpers-external\\ffmpeg\\ffmpeg' + (soFeat.x64 ? '' : '_32') + '.exe',
	bIncludeUnit = false,
	bWineBug = !soFeat.x64 && !soFeat.popup,
	bDebug = false,
	bProfile = true,
	bQuiet = false
}) {
	// Safecheck
	if (!fromHandleList || !fromHandleList.Count) { return false; }
	if (!_isFile(ffmpegPath)) { fb.ShowPopupMessage('ffmpeg executable not found:\n' + ffmpegPath, 'EBUR 128 Scanner'); return false; }
	const profile = bProfile ? new FbProfiler('EBUR 128 Scanner') : null;
	const batFile = ffmpegPath.replace((soFeat.x64 ? '' : '_32') + '.exe', bWineBug ? '_wine.bat' : '.bat');
	if (bDebug) { console.log(batFile); }
	if (!_isFile(batFile)) { fb.ShowPopupMessage('ffmpeg bat file not found:\n' + batFile, 'EBUR 128 Scanner'); return false; }
	const handleListArr = fromHandleList.Convert();
	const totalTracks = handleListArr.length, numTracks = 25, maxCount = Math.ceil(totalTracks / numTracks);
	let totalItems = 0;
	let bDone = true;
	let failedItems = [];
	const calcLRA = (count) => {
		const currMax = (count + 1) === maxCount ? totalTracks : (count + 1) * numTracks;
		console.log('Processing items: ' + currMax + '/' + totalTracks);
		const items = [];
		const LRA = [];
		const ffmpegJSON = folders.temp + 'ffmpegJSON' + (new Date().toDateString() + Date.now()).split(' ').join('_') + '.json';
		let prevProgress = -1, iSteps = (count + 1) === maxCount ? currMax : numTracks;
		handleListArr.slice(count * numTracks, currMax).forEach((handle, i) => {
			const path = handle.Path;
			if (_isFile(path)) {
				if (bDebug) {
					console.log(bWineBug
						? _q(ffmpegPath) + ' -hide_banner -i ' + _q(path) + ' -af loudnorm=dual_mono=true:print_format=json -nostats -f null -  >' + _q(ffmpegJSON + '.temp') + ' 2>&1\n' + ffmpegPath.replace('ffmpeg.exe', 'sed.exe') + ' 1,/^\[Parsed_loudnorm/d ' + _q(ffmpegJSON + '.temp') + ' >' + _q(ffmpegJSON) // eslint-disable-line no-useless-escape
						: _q(ffmpegPath) + ' -hide_banner -i ' + _q(path) + ' -af loudnorm=dual_mono=true:print_format=json -nostats -f null -  2>&1 | > ' + _q(ffmpegJSON) + '  sed 1,/^\\[Parsed_loudnorm/d'
					);
				}
				_runHidden(batFile, path, ffmpegJSON, ffmpegPath);
				const data = _jsonParseFileCheck(ffmpegJSON);
				if (data && Object.hasOwn(data, 'input_lra')) {
					let val = Number.parseFloat(data.input_lra);
					if (Number.isFinite(val)) {
						val = round(val, 2).toFixed(2);
						if (bIncludeUnit) { val += ' LU'; }
						items.push(handle);
						LRA.push(val);
					} else { failedItems.push(path); }
				} else { failedItems.push(path); }
				const progress = Math.round((i + 1) / iSteps * 10) * 10;
				if (progress > prevProgress) { prevProgress = progress; console.log('EBUR 128 scanning ' + progress + '%.'); }
			} else { failedItems.push(path); }
		});
		_deleteFile(ffmpegJSON);
		const itemsLength = items.length;
		totalItems += itemsLength;
		if (itemsLength) {
			const tags = LRA.map((value) => { return { [tagName]: value }; });
			if (itemsLength === tags.length) {
				new FbMetadbHandleList(items).UpdateFileInfoFromJSON(JSON.stringify(tags));
				if (maxCount > 1) { console.log(itemsLength, 'items tagged.'); } // Don't repeat this line when all is done in 1 step. Will be printed also later
			} else { bDone = false; console.log('Tagging failed: unknown error.'); }
		}
	};
	for (let count = 0; count < maxCount; count++) {
		calcLRA(count);
	}
	const failedItemsLen = failedItems.length;
	(bQuiet ? console.log : console.popup)(totalTracks + ' items processed.\n' + totalItems + ' items tagged.\n' + failedItemsLen + ' items failed.' + (failedItemsLen ? '\n\nList of failed items:\n' + failedItems.join('\n') : ''), 'EBUR 128 Scanner');
	if (bProfile) { profile.Print('Save Loudness tags to files - completed in '); }
	return bDone;
};