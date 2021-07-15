'use strict';

/* 
	Add Skip Tag From Playback v 1.1 23/06/21
	Adds a 'SKIP' tag using current playback. Meant to be used along Skip Track (foo_skip) component.
	Has an intelligent switch which sets behavior according to playback time:
		- If time > half track length -> Track will play as usually up to the 'SKIP' time, where it jumps to next track.
		- If time < half track length -> Track will play from 'SKIP' time to the end.
	This is a workaround for using %playback_time% for tagging, since %playback_time% does not work within masstagger scripts.
 */

function skipTagFromPlayback(selItem = new FbMetadbHandleList(fb.GetNowPlaying())) {
	if (typeof selItem !== 'undefined' && selItem !== null) {
		const countItems = selItem.Count;
		if (countItems === 0) {
			console.log('No tracks selected.');
			return;
		}
		if (countItems > 1) {
			console.log('More than 1 track selected, playback time can only be used for one track at once.');
			return;
		}
	} else {return;}
	const currentPlayback = fb.PlaybackTime * 1000;
	const time = new Date(currentPlayback).toUTCString().substr(20,5) + '.00'; // doesn't care about ms
	const bEnd = currentPlayback > selItem[0].Length * 1000 / 2 ? true : false; // skips from start or end
	selItem.UpdateFileInfoFromJSON(JSON.stringify([{'SKIP' : (bEnd ? '' : '-') + time}]));
	console.log('Adding SKIP tag to current track: ' + time + (bEnd ? ' (skips end)' : ' (skips start)'));
	return time;
}