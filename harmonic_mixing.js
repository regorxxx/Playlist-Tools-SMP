'use strict';

/*	
	Harmonic Mixing v 0.1 21/04/21
	-----------------------------------
	DJ-like playlist creation with key changes following harmonic mixing rules... Uses 9 movements described at 'camelotWheel' on camelot_wheel_xxx.js
	The movements creates a 'path' along the track keys, so even changing or skipping one movement changes drastically the path;
	Therefore, the track selection may change on every execution. Specially if there are not tracks on the pool to match all required movements. 
	Those unmatched movements will get skipped (lowering the playlist length per step), but next movements are relative to the currently selected track... 
	so successive calls on a 'small' pool, will give totally different playlist lengths. We are not matching only keys, but a 'key path', which is stricter.
*/ 

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\camelot_wheel_xxx.js');

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
	if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) {console.log('do_harmonic_mixing: playlistLength (' + playlistLength + ') must be greater than zero'); return false;}
	if (!selItems || !selItems.Count) {return;}
	// Tags and constants
	const keyHandle = getTagsValuesV3(selItems, [keyTag], true);
	const poolLength = selItems.Count;
	// Instead of predefining a mixing pattern, create one randomly each time, with predefined proportions
	const movements = {
		perfectMatch: 	35	, // perfectMatch (=)
		energyBoost	: 	10	, // energyBoost (+1)
		energyDrop	:	10	, // energyDrop (-1)
		energySwitch:	10	, // energySwitch (B/A)
		moodBoost	:	5	, // moodBoost (+3)
		moodDrop	:	5	, // moodDrop (-3)
		energyRaise	:	5	, // energyRaise (+7)
		domKey		:	10	, // domKey (+1 & B/A) = energyBoost & energySwitch
		subDomKey	:	10	, // subDomKey (-1 & B/A) = energyDrop & energySwitch
	}; // Sum must be 100%
	let pattern = [];
	Object.keys(movements).forEach((key) => {
		pattern = pattern.concat(Array(Math.ceil(playlistLength * movements[key] / 100)).fill(key));
	});
	pattern.sort(() => Math.random() - 0.5);
	if (pattern.length > playlistLength) {pattern.length = playlistLength;} // finalPlaylistLength is always <= PlaylistLength
	if (bDebug) {console.log(pattern);}
	let nextKeyObj;
	let keyCache = new Map();
	let keyDebug = [];
	let selectedHandlesArray = [];
	let alreadySelected = new Set([0]); // equal to the desired order
	let toCheck = new Set(Array(poolLength).fill().map((_, index) => index).sort(() => Math.random() - 0.5));
	let nextIndex = 0; // Initial track, it will match most times the last reference track when using progressive playlists
	selectedHandlesArray.push(selItems[nextIndex]);
	for (let i = 0, j = 0, h = 0; i < playlistLength - 1; i++) {
		const index = nextIndex;
		let camelotKeyCurrent;
		if (!keyCache.has(i)) {
			const keyCurrent = keyHandle[index][0];
			if (bDebug && i === 0) {keyDebug.push(keyCurrent);}
			// camelotKeyCurrent = keyCurrent.length ? {...camelotWheel.keyNotationObject.get(keyCurrent)} : null;
			camelotKeyCurrent = keyCurrent.length ? camelotWheel.getKeyNotationObject(keyCurrent) : null;
			keyCache.set(i, camelotKeyCurrent);
		} else {camelotKeyCurrent = keyCache.get(i);}
		nextKeyObj = camelotKeyCurrent ? camelotWheel[pattern[i]](camelotKeyCurrent) : null; // Applies movement to current key
		if (nextKeyObj) { // Finds next track, but traverse pool with random indexes...
			let bFound = false;
			for (const toCheck_k of toCheck) {
				if (!alreadySelected.has(toCheck_k)){
					var camelotKeyNew;
					const indexNew = toCheck_k;
					if (!keyCache.has(toCheck_k)) {
						const keyNew = keyHandle[indexNew][0];
						// camelotKeyNew = (keyNew.length) ? {...camelotWheel.keyNotationObject.get(keyNew)} : null;
						camelotKeyNew = (keyNew.length) ? camelotWheel.getKeyNotationObject(keyNew) : null;
						keyCache.set(toCheck_k, camelotKeyNew);
					} else {camelotKeyNew = keyCache.get(toCheck_k);}
					if (camelotKeyNew) {
						if (nextKeyObj.hour === camelotKeyNew.hour && nextKeyObj.letter === camelotKeyNew.letter) {
							nextIndex = indexNew; // Which will be used for next movement
							selectedHandlesArray.push(selItems[indexNew]);
							alreadySelected.add(toCheck_k); // And not be selected again
							toCheck.delete(toCheck_k);
							bFound = true;
							// if (bDebug && nextKeyObj) {keyDebug.push(camelotWheel.wheelNotationSharp.get(nextKeyObj.hour)[nextKeyObj.letter]);}
							if (bDebug && nextKeyObj) {keyDebug.push(camelotWheel.getKeyNotationSharp(nextKeyObj));}
							break;
						}
					}
				}
			}
			if (!bFound) { // If nothing is found, then continue next movement with current track
				nextIndex = index;
				if (j === 1) {j = 0; continue;}  // try once retrying this step with default movement
				else {
					pattern[i] = 'perfectMatch';
					i--;
					j++;
				}
			} else {j = 0;} // Reset retry counter if found 
		} else {
			i--;
			toCheck.delete(index); // If there is no tag, it can be deleted
			if (toCheck.size) {nextIndex = [...toCheck][0];} // If tag was not found, then use next handle
		}
	}
	if (bDebug) {console.log(keyDebug);}
	if (selectedHandlesArray.length > 1) { // Otherwise it has failed
		// And output
		selectedHandlesArray = new FbMetadbHandleList(selectedHandlesArray);
		if (bSendToPls) {
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
			console.log('Final selection: ' +  selectedHandlesArray.Count  + ' tracks');
			plman.InsertPlaylistItems(plman.ActivePlaylist, 0, selectedHandlesArray);
		}
		return selectedHandlesArray;
	} return null;
}