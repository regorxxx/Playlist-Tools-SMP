'use strict';
//13/10/21

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
var sel_items = null;
var count_items = null;
var iStep = null;
var currentTime = null;
const debouncedStep = debounce(step, 300); // Only continues next step when last tag update was done >100ms ago

// Check if tag update was done on a selected file and wait until all tracks are updated
function onMetadbChanged(handle_list, fromhook) {
	if (iStep) {
		if (typeof sel_items !== 'undefined' && sel_items !== null && count_items !== null) {
			handle_list.Sort();
			handle_list.MakeIntersection(sel_items);
			if (handle_list.Count !== 0 && count_items !== 0) {
				count_items -= handle_list.Count;
				if (count_items === 0) {
					count_items = sel_items.Count;
					debouncedStep(iStep);
				}
			}
		}
	}
}
if (typeof on_metadb_changed !== 'undefined') {
	const oldFunc = on_metadb_changed;
	on_metadb_changed = function(handle_list, fromhook) {
		oldFunc(handle_list, fromhook);
		onMetadbChanged(handle_list, fromhook);
	}
} else {var on_metadb_changed = onMetadbChanged;}

function getTagsAutomationDescription() {
	const boolArr = [bBiometric, bMassTag, bAudioMd5, bRgScan, bDynamicRange];
	const descArr = ['Fingerprinting', 'MD5', 'AUDIOMD5', 'ReplayGain', 'DR'];
	return boolArr.reduce((text, bVal, index) => {return (bVal ? (text.length ? text + ', ' + descArr[index]: descArr[index]) : text);}, ''); // Initial value is '';
}

function tagsAutomation() {
	count_items = 0;
	currentTime = 0;
	sel_items = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
	if (typeof sel_items !== 'undefined' && sel_items !== null) {
		sel_items.Sort();
		count_items = sel_items.Count;
		if (count_items === 0) {
			console.log('No tracks selected.');
			return;
		}
	} else {return;}
	
	// Safety check for accidental button pressing
	let answer = WshShell.Popup('Do you want to continue? Some tags will be edited, can not be undone.', 0, window.Name, popup.question + popup.yes_no);
	if (answer === popup.no) {
		iStep = null;
		sel_items = null;
		count_items = null;
		currentTime = null;
	} else {
		// Calcs the max required processing time between albums
		let codecTimes = {MP3: 2, FLAC: 1};
		let tfo = fb.TitleFormat('%album artist% | %date% | %album%##%__bitspersample%##%__bitrate%##%__samplerate%##%codec%');
		let strArray = tfo.EvalWithMetadbs(sel_items);
		let greatestAlbumSize = 1;
		let greatestBitDepth = 16;
		let greatestBitRate = 850;
		let greatestSampleRate = 44100;
		let codecMultiplier = 1;
		let albumCache = 1;
		let album, bitDepth, bitRate, sampleRate, codec;
		let albumNext, bitDepthNext, bitRateNext, sampleRateNext, codecNext;
		for (let i = 0; i < strArray.length - 1; i++) {
			[album, bitDepth, bitRate, sampleRate, codec] = (i === 0) ? strArray[i].split('##') : [albumNext, bitDepthNext, bitRateNext, sampleRateNext, codecNext];
			[albumNext, bitDepthNext, bitRateNext, sampleRateNext, codecNext] = strArray[i+1].split('##');
			if (album === albumNext) {
				albumCache++;
				if (albumCache > greatestAlbumSize) {greatestAlbumSize = albumCache;}
			} else {albumCache = 1;}
			if (bitDepth >= greatestBitDepth) {
				greatestBitDepth = bitDepth;
			}
			if (bitRate >= greatestBitRate) {
				greatestBitRate = bitRate;
			}
			if (sampleRate >= greatestSampleRate) {
				greatestSampleRate = sampleRate;
			}
			if (codecTimes[codec] > codecMultiplier) {
				codecMultiplier = codecTimes[codec];
			}
		}
		/* Not needed anymore
		let maxDrTime = greatestAlbumSize * greatestBitDepth / 16 * greatestBitRate / 850 * greatestSampleRate / 44100 * codecMultiplier * 1600;
		console.log(maxDrTime);
		debouncedStepHigh = debounce(step, maxDrTime); // And overwrites default value 
		*/
		// Remove old tags
		let arr = [];
		for (let i = 0; i < count_items; ++i) {
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
			});
		}
		sel_items.UpdateFileInfoFromJSON(JSON.stringify(arr));
		
		// Process files on steps
		iStep = 0;
		step(iStep);
	}
	return;
}

function step(i) {
	let bSucess = false;
	iStep++;
	switch (i) {
		case 0: // Less than 100 ms / track?
			if (bRgScan) {bSucess = fb.RunContextCommandWithMetadb('ReplayGain/Remove ReplayGain information from files', sel_items, 8);} // Replay gain info is not always removed
			else {bSucess = false;}
			break;
		case 1:  // Takes 260 ms / track
			if (bBiometric) {bSucess = fb.RunContextCommandWithMetadb('Save fingerprint to file(s)', sel_items, 8);}
			else {bSucess = false;}
			break;
		case 2: // Less than 170 ms / track?
			if (bMassTag) {bSucess = fb.RunContextCommandWithMetadb('Tagging/Scripts/MD5', sel_items, 8);}
			else {bSucess = false;}
			break;
		case 3: // Warning: This step updates tags for entire albums while processing the list... so times changes according to album length
			if (bDynamicRange) {bSucess = fb.RunContextCommandWithMetadb('Dynamic Range Meter', sel_items, 8);}
			else {bSucess = false;}
			break;
		case 4: // These require user input before saving, so they are read only operations and can be done at the same time
			if (bAudioMd5 || bRgScan) {
				currentTime = 0; // ms
				let cacheSel_items = sel_items.Clone();
				if (bAudioMd5) {
					setTimeout(function(){
						bSucess = fb.RunContextCommandWithMetadb('Utilities/Create Audio MD5 checksum', cacheSel_items, 8);
					}, currentTime); // Takes 170 ms / track
					currentTime += 200 * count_items; // But we give them some time to run before firing the next one
				}
				if (bRgScan) {
					setTimeout(function(){
						bSucess = fb.RunContextCommandWithMetadb('ReplayGain/Scan as albums (by tags)', cacheSel_items, 8);
					}, currentTime); // Takes ~500 ms / track
					currentTime += 510 * count_items; // But we give them some time to run before firing the next one
				}
			} else {bSucess = false;}
			break;
		default:
			iStep = null;
			sel_items = null;
			count_items = null;
			currentTime = null;
			return;
	}
	if (!bSucess) {step(iStep);} // If the step was omitted, then run next step
	return;
}