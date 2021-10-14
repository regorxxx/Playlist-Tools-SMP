'use strict';
//13/10/21

/*	
	Harmonic Mixing
	-----------------------------------
	DJ-like playlist creation with key changes following harmonic mixing rules... Uses 9 movements described at 'camelotWheel' on camelot_wheel_xxx.js
	The movements creates a 'path' along the track keys, so even changing or skipping one movement changes drastically the path;
	Therefore, the track selection may change on every execution. Specially if there are not tracks on the pool to match all required movements. 
	Those unmatched movements will get skipped (lowering the playlist length per step), but next movements are relative to the currently selected track... 
	so successive calls on a 'small' pool, will give totally different playlist lengths. We are not matching only keys, but a 'key path', which is stricter.
*/ 

include('..\\helpers\\camelot_wheel_xxx.js');
include('..\\helpers\\helpers_xxx_playlists.js');
include('..\\helpers\\helpers_xxx_prototypes.js');

function do_harmonic_mixing({
								selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
								playlistLength = selItems.Count, 
								playlistName = 'Harmonic mix from ' + plman.GetPlaylistName(plman.ActivePlaylist),
								keyTag = 'key',
								bSendToPls = true,
								bDebug = false,
							} = {}) {
	// Safety checks
	if (!keyTag.length) {return;}
	if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('do_harmonic_mixing: playlistLength (' + playlistLength + ') must be an integer greater than zero'); return false;}
	if (!selItems || !selItems.Count) {return;}
	if (selItems.Count < playlistLength) {playlistLength = selItems.Count;}
	// Instead of predefining a mixing pattern, create one randomly each time, with predefined proportions
	const pattern = createHarmonicMixingPattern(playlistLength); // On camelot_wheel_xxx.js
	if (bDebug) {
		console.log('Original pattern:');
		console.log(pattern);
	}
	const {selectedHandlesArray, error} = findTracksWithPattern({selItems, pattern, keyTag, playlistLength, bDebug});
	if (!error) {
		const handleList = new FbMetadbHandleList(selectedHandlesArray);
		if (bSendToPls) {return sendToPlaylist(handleList, playlistName);}
		else {return handleList;}
		
	} else {
		console.log('do_harmonic_mixing: ' + error);
		console.log(pattern);
		return null;
	}
}

function findTracksWithPattern({selItems, pattern, keyTag, playlistLength, bDebug = false}) {
	// Tags and constants
	const keyHandle = getTagsValuesV3(selItems, [keyTag], true);
	const poolLength = selItems.Count;
	let nextKeyObj;
	let keyCache = new Map();
	let keyDebug = [];
	let keySharpDebug = [];
	let patternDebug = [];
	let selectedHandlesArray = [];
	let toCheck = new Set(Array(poolLength).fill().map((_, index) => index).sort(() => Math.random() - 0.5));
	let nextIndex = 0; // Initial track, it will match most times the last reference track when using progressive playlists
	let camelotKeyCurrent, camelotKeyNew;
	for (let i = 0, j = 0; i < playlistLength - 1; i++) {
		// Search key
		const index = nextIndex;
		if (!keyCache.has(index)) {
			const keyCurrent = keyHandle[index][0];
			camelotKeyCurrent = keyCurrent.length ? camelotWheel.getKeyNotationObjectCamelot(keyCurrent) : null;
			if (camelotKeyCurrent) {keyCache.set(index, camelotKeyCurrent);}
		} else {camelotKeyCurrent = keyCache.get(index);}
		// Delete from check selection
		toCheck.delete(index);
		if (!toCheck.size) {break;}
		// Find next key
		nextKeyObj = camelotKeyCurrent ? camelotWheel[pattern[i]]({...camelotKeyCurrent}) : null; // Applies movement to current key
		if (nextKeyObj) { // Finds next track, but traverse pool with random indexes...
			let bFound = false;
			for (const indexNew of toCheck) {
				if (!keyCache.has(indexNew)) {
					const keyNew = keyHandle[indexNew][0];
					camelotKeyNew = keyNew.length ? camelotWheel.getKeyNotationObjectCamelot(keyNew) : null;
					if (camelotKeyNew) {keyCache.set(indexNew, camelotKeyNew);}
					else {toCheck.delete(indexNew);}
				} else {camelotKeyNew = keyCache.get(indexNew);}
				if (camelotKeyNew) {
					if (nextKeyObj.hour === camelotKeyNew.hour && nextKeyObj.letter === camelotKeyNew.letter) {
						selectedHandlesArray.push(selItems[index]);
						if (bDebug) {keyDebug.push(camelotKeyCurrent); keySharpDebug.push(camelotWheel.getKeyNotationSharp(camelotKeyCurrent)); patternDebug.push(pattern[i]);}
						nextIndex = indexNew; // Which will be used for next movement
						bFound = true;
						break;
					}
				}
			}
			if (!bFound) { // If nothing is found, then continue next movement with current track
				camelotKeyNew = camelotKeyCurrent; // For debug console on last item
				if (j === 1) {j = 0; continue;}  // try once retrying this step with default movement
				else {
					pattern[i] = 'perfectMatch';
					i--;
					j++;
				}
			} else {j = 0;} // Reset retry counter if found 
		} else { // No tag or bad tag
			i--;
			if (toCheck.size) {nextIndex = [...toCheck][0];} // If tag was not found, then use next handle
		}
	}
	// Add tail
	selectedHandlesArray.push(selItems[nextIndex]); 
	if (bDebug) {keyDebug.push(camelotKeyNew); keySharpDebug.push(camelotWheel.getKeyNotationSharp(camelotKeyNew));}
	// Debug console
	if (bDebug) {
		console.log('Keys from selection:');
		console.log(keyDebug);
		console.log(keySharpDebug);
		console.log('Pattern applied:');
		console.log(patternDebug); // Always has one item less thankey arrays
	}
	const error = selectedHandlesArray.length <= 1 ? (toCheck.size ? 'Not enough tracks (' + selectedHandlesArray.length + ') matched the pattern.': 'Tracks don\'t have key tag (or ussing not recognized notation).') : null;
	return {selectedHandlesArray, error};
}