'use strict';
//18/02/21

/* 
	Automatic tagging...
	File processing takes time, specially for some functions (ReplayGain, etc.), so we delay next step execution 
	until onMetadbChanged fires for all selected handles. 
	
	Note there is no way to know when some arbitrary plugin finish their processing.
	Some plugins expect user input for final tagging after processing the files (ReplayGain for ex.), so those steps
	are delayed to the end so the user can press OK on those popups without blocking processing.
 */

include('..\\helpers\\helpers_xxx.js');
 
// Script
const bRgScan = utils.CheckComponent('foo_rgscan', true);
const bBiometric = utils.CheckComponent('foo_biometric', true);
const bMassTag = utils.CheckComponent('foo_masstag', true);
const bDynamicRange = utils.CheckComponent('foo_dynamic_range', true);
const bAudioMd5 = utils.CheckComponent('foo_audiomd5', true);
const bChromaPrint = utils.IsFile(folders.xxx + 'main\\chromaprint-utils-js_fingerprint.js') && utils.IsFile(folders.xxx + 'helpers-external\\fpcalc\\fpcalc.exe');
const bLRA = utils.IsFile(folders.xxx + 'helpers-external\\ffmpeg\\ffmpeg.exe');
if (bChromaPrint) {include('chromaprint-utils-js_fingerprint.js');}
if (bLRA) {include('ffmpeg-utils.js');}

// Variables
const tAut = {};
tAut.selItems = null;
tAut.countItems = null;
tAut.iStep = null;
tAut.currentTime = null;
tAut.tools = [
	{title: 'FooID Fingerprinting', bEnabled: bBiometric},
	{title: 'ChromaPrint Fingerprinting', bEnabled: bChromaPrint},
	{title: 'MD5', bEnabled: bMassTag},
	{title: 'AUDIOMD5', bEnabled: bAudioMd5},
	{title: 'ReplayGain', bEnabled: bRgScan},
	{title: 'DR', bEnabled: bDynamicRange},
	{title: 'EBUR 128 Scanner', bEnabled: bLRA}
];
const debouncedStep = debounce(stepTag, 300); // Only continues next step when last tag update was done >100ms ago

// Check if tag update was done on a selected file and wait until all tracks are updated
function onMetadbChangedTagsAuto(handleList, fromhook) {
	if (tAut.iStep) {
		if (typeof tAut.selItems !== 'undefined' && tAut.selItems !== null && tAut.countItems !== null) {
			handleList.Sort();
			handleList.MakeIntersection(tAut.selItems);
			if (handleList.Count !== 0 && tAut.countItems !== 0) {
				tAut.countItems -= handleList.Count;
				if (tAut.countItems === 0) {
					nextStepTag();
				}
			}
		}
	}
}
if (typeof on_metadb_changed !== 'undefined') {
	const oldFunc = on_metadb_changed;
	on_metadb_changed = function(handleList, fromhook) {
		oldFunc(handleList, fromhook);
		onMetadbChangedTagsAuto(handleList, fromhook);
	}
} else {var on_metadb_changed = onMetadbChangedTagsAuto;}

function getTagsAutomationDescription() {
	return tAut.tools.reduce((text, tool, index) => {return (tool.bEnabled ? (text.length ? text + ', ' + tool.title : tool.title) : text);}, ''); // Initial value is '';
}

function tagsAutomation() {
	tAut.countItems = 0;
	tAut.currentTime = 0;
	tAut.selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
	if (typeof tAut.selItems !== 'undefined' && tAut.selItems !== null) {
		tAut.selItems.Sort();
		tAut.countItems = tAut.selItems.Count;
		if (tAut.countItems === 0) {
			console.log('No tracks selected.');
			return;
		}
	} else {return;}
	
	// Safety check for accidental button pressing
	let answer = WshShell.Popup('Do you want to continue? Some tags will be edited, can not be undone.\n\nTools:\n' + getTagsAutomationDescription(), 0, window.Name, popup.question + popup.yes_no);
	if (answer === popup.no) {
		tAut.iStep = null;
		tAut.selItems = null;
		tAut.countItems = null;
		tAut.currentTime = null;
	} else {
		// Remove old tags
		let arr = [];
		for (let i = 0; i < tAut.countItems; ++i) {
			arr.push({
				'MD5' : '',
				'AUDIOMD5' : '',
				'ANALYSIS' : '',
				'FINGERPRINT_FOOID' : '',
				'REPLAYGAIN_ALBUM_GAIN' : '',
				'REPLAYGAIN_ALBUM_PEAK' : '',
				'REPLAYGAIN_TRACK_GAIN' : '',
				'REPLAYGAIN_TRACK_PEAK' : '',
				'ALBUM DYNAMIC RANGE' : '',
				'DYNAMIC RANGE' : '',
				'ACOUSTID_FINGERPRINT_RAW' : '',
				'LRA' : ''
			});
		}
		tAut.selItems.UpdateFileInfoFromJSON(JSON.stringify(arr));
		
		// Process files on steps
		tAut.iStep = 0;
		stepTag(tAut.iStep);
	}
	return;
}

function stopStepTag() {
	tAut.iStep = null;
	tAut.selItems = null;
	tAut.countItems = null;
	tAut.currentTime = null;
}

function nextStepTag() {
	tAut.countItems = tAut.selItems.Count;
	debouncedStep(tAut.iStep);
}

function stepTag(i) {
	let bSucess = false;
	tAut.iStep++;
	switch (i) {
		case 0: // Less than 100 ms / track?
			if (bRgScan) {bSucess = fb.RunContextCommandWithMetadb('ReplayGain/Remove ReplayGain information from files', tAut.selItems, 8);} // Replay gain info is not always removed
			else {bSucess = false;}
			break;
		case 1:  // Takes 260 ms / track
			if (bBiometric) {bSucess = fb.RunContextCommandWithMetadb('Save fingerprint to file(s)', tAut.selItems, 8);}
			else {bSucess = false;}
			break;
		case 2: // Less than 170 ms / track?
			if (bMassTag) {bSucess = fb.RunContextCommandWithMetadb('Tagging/Scripts/MD5', tAut.selItems, 8);}
			else {bSucess = false;}
			break;
		case 3: // Warning: This step updates tags for entire albums while processing the list... so times changes according to album length
			if (bDynamicRange) {bSucess = fb.RunContextCommandWithMetadb('Dynamic Range Meter', tAut.selItems, 8);}
			else {bSucess = false;}
			break;
		case 4: //
			if (bChromaPrint) {bSucess = chromaPrintUtils.calculateFingerprints({fromHandleList: tAut.selItems});}
			else {bSucess = false;}
			break;
		case 5: //
			if (bLRA) {bSucess = ffmpeg.calculateLoudness({fromHandleList: tAut.selItems});}
			else {bSucess = false;}
			break;
		case 6: // These require user input before saving, so they are read only operations and can be done at the same time
			if (bAudioMd5 || bRgScan) {
				tAut.currentTime = 0; // ms
				let cacheSel_items = tAut.selItems.Clone();
				if (bAudioMd5) {
					setTimeout(function(){
						bSucess = fb.RunContextCommandWithMetadb('Utilities/Create Audio MD5 checksum', cacheSel_items, 8);
					}, tAut.currentTime); // Takes 170 ms / track
					tAut.currentTime += 200 * tAut.countItems; // But we give them some time to run before firing the next one
				}
				if (bRgScan) {
					setTimeout(function(){
						bSucess = fb.RunContextCommandWithMetadb('ReplayGain/Scan as albums (by tags)', cacheSel_items, 8);
					}, tAut.currentTime); // Takes ~500 ms / track
					tAut.currentTime += 510 * tAut.countItems; // But we give them some time to run before firing the next one
				}
			} else {bSucess = false;}
			break;
		default:
			stopStepTag();
			return;
	}
	if (!bSucess) {stepTag(tAut.iStep);} // If the step was omitted, then run next step
	return;
}