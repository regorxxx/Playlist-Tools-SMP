'use strict';

/* 
	Add Skip Tag From Playback v 1.0 16/03/21
	Adds a 'SKIP' tag using current playback. Meant to be used along Skip Track component.
	Like skip bookmarking feature but the opposite,track will play as usually up to the 'SKIP' time, where it jumps to next track.
	This is a workaround for using %playback_time% for tagging, since %playback_time% does not work within masstagger scripts.
 */

function skipTagFromPlayback(selItems = new FbMetadbHandleList(fb.GetNowPlaying())) {
	if (typeof selItems !== 'undefined' && selItems !== null) {
		const countItems = selItems.Count;
		if (countItems === 0) {
			console.log('No tracks selected.');
			return;
		}
		if (countItems > 1) {
			console.log('More than 1 track selected, playback time can only be used for one track at once.');
			return;
		}
	} else {return;}
	const time = new Date(fb.PlaybackTime * 1000).toUTCString().substr(20,5) + '.00'; // doesn't care about ms
	selItems.UpdateFileInfoFromJSON(JSON.stringify([{'SKIP' : time}]));
	console.log('Adding SKIP tag to current track: ' + time);
	return time;
}