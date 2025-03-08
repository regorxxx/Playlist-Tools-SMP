'use strict';
//08/03/25

/* exported harmonicMixing, queryReplaceKeys, harmonicMixingCycle */
/* global globTags:readable */

/*
	Harmonic Mixing
	-----------------------------------
	DJ-like playlist creation with key changes following harmonic mixing rules... Uses 9 movements described at 'camelotWheel' on camelot_wheel_xxx.js
	The movements creates a 'path' along the track keys, so even changing or skipping one movement changes drastically the path;
	Therefore, the track selection may change on every execution. Specially if there are not tracks on the pool to match all required movements.
	Those unmatched movements will get skipped (lowering the playlist length per step), but next movements are relative to the currently selected track...
	so successive calls on a 'small' pool, will give totally different playlist lengths. We are not matching only keys, but a 'key path', which is stricter.
*/

include('..\\..\\helpers\\camelot_wheel_xxx.js');
/* global camelotWheel:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _bt:readable, _p:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global getHandleListTags:readable */

function harmonicMixing({
	selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
	playlistLength = selItems.Count,
	playlistName = 'Harmonic mix from ' + plman.GetPlaylistName(plman.ActivePlaylist),
	keyTag = typeof globTags !== 'undefined' ? globTags.key : 'KEY',
	patternOptions = {},
	bShuffleInput = true,
	bSendToPls = true,
	bDoublePass = false,
	bDebug = false,
} = {}) {
	// Safety checks
	if (!keyTag.length) { return null; }
	if (!Number.isSafeInteger(playlistLength) || playlistLength <= 0) { console.log('harmonicMixing: playlistLength (' + playlistLength + ') must be an integer greater than zero'); return null; }
	if (!selItems || !selItems.Count) { return null; }
	if (selItems.Count < playlistLength) { playlistLength = selItems.Count; }
	// Instead of predefining a mixing pattern, create one randomly each time, with predefined proportions
	const pattern = camelotWheel.createHarmonicMixingPattern(playlistLength, patternOptions); // On camelot_wheel_xxx.js
	if (bDebug) {
		console.log('Original pattern:'); // DEBUG
		console.log(pattern); // DEBUG
	}
	const { selectedHandlesArray, error } = findTracksWithPattern({ selItems, pattern, keyTag, playlistLength, bShuffleInput, bDoublePass, bDebug });
	if (!error) {
		const handleList = new FbMetadbHandleList(selectedHandlesArray);
		if (bSendToPls) { return sendToPlaylist(handleList, playlistName); }
		else { return handleList; }

	} else {
		console.log('harmonicMixing: ' + error); // DEBUG
		console.log(pattern); // DEBUG
		return null;
	}
}

function harmonicMixingCycle({
	selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
	cycleLength = 30,
	playlistName = 'Harmonic cycle from ' + plman.GetPlaylistName(plman.ActivePlaylist),
	keyTag = typeof globTags !== 'undefined' ? globTags.key : 'KEY',
	patternOptions = {},
	bShuffleInput = true,
	bSendToPls = true,
	bDebug = false,
} = {}) {
	// Safety checks
	if (!keyTag.length) { return null; }
	if (!Number.isSafeInteger(cycleLength) || cycleLength <= 0) { console.log('harmonicMixingCycle: cycleLength (' + cycleLength + ') must be an integer greater than zero'); return null; }
	if (!selItems || !selItems.Count) { return null; }
	if (selItems.Count < cycleLength) { cycleLength = selItems.Count; }
	// Instead of predefining a mixing pattern, create one randomly each time, with predefined proportions
	let pool = selItems.Clone();
	let handleList = new FbMetadbHandleList();
	while (pool.Count > 0) {
		const newCycle = harmonicMixing({ keyTag, patternOptions, bShuffleInput, bDoublePass: false, bDebug, bSendToPls: false, playlistLength: cycleLength, selItems: pool });
		if (!newCycle) { break; }
		newCycle.Convert().forEach((handle) => pool.Remove(handle));
		handleList.InsertRange(handleList.Count, newCycle);
	}
	if (bSendToPls) { return sendToPlaylist(handleList, playlistName); }
	else { return handleList; }
}

function findTracksWithPattern({ selItems, pattern, keyTag, playlistLength, bShuffleInput = false, bDoublePass = false, bDebug = false }) {
	// Tags and constants
	if (bShuffleInput) { selItems = new FbMetadbHandleList(selItems.Convert().shuffle()); }
	const keyHandle = getHandleListTags(selItems, [keyTag], { bMerged: true });
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
			if (camelotKeyCurrent) { keyCache.set(index, camelotKeyCurrent); }
		} else { camelotKeyCurrent = keyCache.get(index); }
		// Delete from check selection
		toCheck.delete(index);
		if (!toCheck.size) { break; }
		// Find next key
		nextKeyObj = camelotKeyCurrent ? camelotWheel[pattern[i]]({ ...camelotKeyCurrent }) : null; // Applies movement to current key
		if (nextKeyObj) { // Finds next track, but traverse pool with random indexes...
			let bFound = false;
			for (const indexNew of toCheck) {
				if (!keyCache.has(indexNew)) {
					const keyNew = keyHandle[indexNew][0];
					camelotKeyNew = keyNew.length ? camelotWheel.getKeyNotationObjectCamelot(keyNew) : null;
					if (camelotKeyNew) { keyCache.set(indexNew, camelotKeyNew); }
					else { toCheck.delete(indexNew); }
				} else { camelotKeyNew = keyCache.get(indexNew); }
				if (camelotKeyNew) {
					if (nextKeyObj.hour === camelotKeyNew.hour && nextKeyObj.letter === camelotKeyNew.letter) {
						selectedHandlesArray.push(selItems[index]);
						if (bDebug) { keyDebug.push(camelotKeyCurrent); keySharpDebug.push(camelotWheel.getKeyNotationSharp(camelotKeyCurrent)); patternDebug.push(pattern[i]); }
						nextIndex = indexNew; // Which will be used for next movement
						bFound = true;
						break;
					}
				}
			}
			if (!bFound) { // If nothing is found, then continue next movement with current track
				camelotKeyNew = camelotKeyCurrent; // For debug console on last item
				if (j === 1) { j = 0; continue; }  // try once retrying this step with default movement
				else {
					pattern[i] = 'perfectMatch';
					i--; // NOSONAR
					j++;
				}
			} else { j = 0; } // Reset retry counter if found
		} else { // No tag or bad tag
			i--;  // NOSONAR
			if (toCheck.size) { nextIndex = [...toCheck][0]; } // If tag was not found, then use next handle
		}
	}
	// Add tail
	selectedHandlesArray.push(selItems[nextIndex]);
	if (bDebug) { keyDebug.push(camelotKeyNew); keySharpDebug.push(camelotWheel.getKeyNotationSharp(camelotKeyNew)); }
	// Double pass
	if (bDoublePass) {
		const toAdd = {};
		const keyMap = new Map();
		// Find positions where the remainder tracks could be placed as long as they have the same key than other track
		const selectedHandles = new FbMetadbHandleList(selectedHandlesArray);
		for (let i = 0; i < poolLength; i++) {
			const currTrack = selItems[i];
			if (selectedHandles.Find(currTrack) === -1) {
				const matchIdx = selectedHandlesArray.findIndex((selTrack, j) => {
					let idx = -1;
					if (keyMap.has(j)) { idx = keyMap.get(j); }
					else { idx = selItems.Find(selTrack); keyMap.set(j, idx); }
					const selKey = keyHandle[idx];
					return selKey[0] === keyHandle[i][0];
				});
				if (matchIdx !== -1) {
					if (Object.hasOwn(toAdd, matchIdx)) { toAdd[matchIdx].push(currTrack); }
					else { toAdd[matchIdx] = [currTrack]; }
				}
			}
		}
		// Add items in reverse order to not recalculate new idx
		const indexes = Object.keys(toAdd).sort((a, b) => a.localeCompare(b)).reverse();
		if (indexes.length) {
			let count = 0;
			for (let idx of indexes) {
				selectedHandlesArray.splice(idx, 0, ...toAdd[idx]); // NOSONAR [is an object not an array]
				count += toAdd[idx].length;
			}
			if (bDebug) { console.log('Added ' + count + ' items on second pass'); }
		}
	}
	// Debug console
	if (bDebug) {
		console.log('Keys from selection:');
		console.log(keyDebug); // DEBUG
		console.log(keySharpDebug); // DEBUG
		console.log('Pattern applied:');
		console.log(patternDebug); // Always has one item less than key arrays
	}
	const error = selectedHandlesArray.length <= 1 ? (toCheck.size ? 'Not enough tracks (' + selectedHandlesArray.length + ') matched the pattern.' : 'Tracks don\'t have key tag (or using not recognized notation).') : null;
	return { selectedHandlesArray, error };
}

function queryReplaceKeys(query, handle, bDebug = false) {
	if (bDebug) { console.log('Initial query:', query); }
	if (!query.length) { console.log('queryReplaceKeys(): query is empty'); return ''; }
	else if (!handle) {
		if ((query.match(/#/g) || []).length >= 2) { console.log('queryReplaceKeys(): handle is null'); return; }
		else { return query; }
	}
	if (/#NEXTKEY#|#PREVKEY#/i.test(query)) {
		const keyTag = query.match(/(\S+) \S* #NEXTKEY#|#PREVKEY#/i)[1] || '';
		const key = fb.TitleFormat(_bt(keyTag)).EvalWithMetadb(handle);
		const keyObj = key.length ? camelotWheel.getKeyNotationObjectCamelot(key) : null;
		if (keyObj) {
			const nextKeys = camelotWheel.translateToNotation(camelotWheel.energyBoost(keyObj), ['flat', 'sharp', 'open', 'camelot']);
			const prevKeys = camelotWheel.translateToNotation(camelotWheel.energyDrop(keyObj), ['flat', 'sharp', 'open', 'camelot']);
			query = query
				.replace(/(\S+ \S* )#NEXTKEY#/gi, _p(nextKeys.map((val) => '$1' + val).join(' OR ')))
				.replace(/(\S+ \S* )#PREVKEY#/gi, _p(prevKeys.map((val) => '$1' + val).join(' OR ')));
		} else {
			query = query.replace(/(\S+) \S* #NEXTKEY#|#PREVKEY#/gi, 'NOT $1 PRESENT');
		}
	}
	return query;
}