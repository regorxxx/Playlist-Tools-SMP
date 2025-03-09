'use strict';
//09/03/25

/*
	Add Skip Tag From Playback
	Adds a 'SKIP' tag using current playback. Meant to be used along Skip Track (foo_skip) component.
	Has an intelligent switch which sets behavior according to playback time:
		- If time > half track length -> Track will play as usually up to the 'SKIP' time, where it jumps to next track.
		- If time < half track length -> Track will play from 'SKIP' time to the end.
	This is a workaround for using %playback_time% for tagging, since %playback_time% does not work within masstagger scripts.
 */

/* exported skipTagFromPlayback */

/* global isSubsong:readable */

function skipTagFromPlayback(selItem = new FbMetadbHandleList(fb.GetNowPlaying())) {
	const isHandleSubsong = typeof isSubsong !== 'undefined'
		? isSubsong
		: (handle, ext = '') => {
			const blackList = new Set(['.dsf']);
			return handle.SubSong !== 0 && !blackList.has(ext || handle.Path.split('.').pop());
		};
	if (typeof selItem !== 'undefined' && selItem !== null) {
		const countItems = selItem.Count;
		if (countItems === 0) {
			console.log('Skip Tag: No tracks selected.');
			return;
		}
		if (countItems > 1) {
			console.log('Skip Tag: More than 1 track selected, playback time can only be used for one track at once.');
			return;
		}
	} else { return; }
	if (fb.PlaybackTime < 1) {
		console.popup('Tried to add SKIP tag at beginning of track (0:00.00). Tagging has been skipped.', 'Skip Tag');
		return;
	} else if (fb.PlaybackTime >= fb.PlaybackLength) {
		console.popup('Tried to add SKIP tag at end of track. Tagging has been skipped.', 'Skip Tag');
		return;
	}
	let bAppend = utils.IsKeyPressed(0x10); // Append tag instead of replace when pressing shift
	const currentPlayback = fb.PlaybackTime * 1000;
	const time = new Date(currentPlayback).toUTCString().substring(20, 25) + '.00'; // doesn't care about ms
	const bEnd = currentPlayback > selItem[0].Length * 1000 / 2; // skips from start or end
	const SKIP = [];
	if (bAppend) {
		const fileInfo = selItem[0].GetFileInfo();
		if (fileInfo) {
			const idx = fileInfo.MetaFind('SKIP');
			if (idx !== -1) {
				const count = fileInfo.MetaValueCount(idx);
				if (count) {
					for (let i = 0; i < count; i++) {
						SKIP.push(fileInfo.MetaValue(idx, i));
					}
				} else { bAppend = false; }
			} else { bAppend = false; }
		}
	}
	SKIP.push((bEnd ? '' : '-') + time);
	selItem.UpdateFileInfoFromJSON(JSON.stringify([{ SKIP }]));
	const path = selItem[0].Path.split('\\').pop();
	const ext = path.split('.').pop();
	console.log(
		'Skip Tag - ' + (bAppend ? 'Adding' : 'Setting') +
		' SKIP tag on current track:\n' +
		'\t ' + time + (bEnd ? ' (skips end)' : ' (skips start)') +
		' -> ' +
		path + (isHandleSubsong(selItem[0], ext) ? ',' + selItem[0].SubSong : '')
	);
	if (bEnd) { fb.Next(); }
	return time;
}