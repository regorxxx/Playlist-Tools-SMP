'use strict';

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx.js');

const plsHistory = [];
const plsHistoryMax = 6; // -1 for the head (active playlist)

function on_playlist_switch() {
	if (plsHistory.length) {
		if (plsHistory.length >= plsHistoryMax) {plsHistory.pop();}
		plsHistory.unshift({name: plman.GetPlaylistName(plman.ActivePlaylist), idx: plman.ActivePlaylist});
	} else {initplsHistory()};
}

function on_playlists_changed() {
	if (plsHistory.length) {
		// Track idx change for playlist already added (when reordering for ex.)
		plsHistory.forEach( (pls) => {
			const idx = getPlaylistIndexArray(pls.name); // Only non duplicated playlists can be tracked
			if (idx.length === 1 && idx[0] !== pls.idx) {pls.idx = idx[0];}
		});
		// Add new playlist if needed
		if (plman.ActivePlaylist !== plsHistory[0].idx) {
			if (plsHistory.length >= plsHistoryMax) {plsHistory.pop();}
			plsHistory.unshift({name: plman.GetPlaylistName(plman.ActivePlaylist), idx: plman.ActivePlaylist});
		}
	} else {initplsHistory()};
}

function on_selection_changed() {
 if (!plsHistory.length) {initplsHistory()}
}

const initplsHistory = delayFn(() => {plsHistory.push({name: plman.GetPlaylistName(plman.ActivePlaylist), idx: plman.ActivePlaylist});}, 300);