'use strict';
//04/03/23

/* 
	Callbacks for integration with other scripts
*/
 // When used along WilB's Biography script (on other panel), data may be fetched automatically
const lastfmListeners = {
	'on_notify_data' : (parent, name, info) => {
		if (name === 'bio_imgChange' || name === 'bio_chkTrackRev' || name === 'xxx-scripts: panel name reply') {return;}
		// Follow WilB's Biography script selection mode
		if (name === 'Biography notifySelectionProperty') { // Biography 1.1.3
			if (info.hasOwnProperty('property') && info.hasOwnProperty('val')) {
				parent.bioSelectionMode = info.val ? 'Follow selected track (playlist)' : 'Prefer nowplaying';
			}
		}// Follow WilB's Biography script selection mode
		if (name === 'biographyTags') { // Biography 1.2.0
			if (info.hasOwnProperty('selectionMode')) {
				parent.bioSelectionMode = info.selectionMode;
			}
		}
		// WilB's Biography script has a limitation, it only works with 1 track at once...
		// So when selecting more than 1 track, this only gets the focused/playing track's tag
		// If both panels don't have the same selection mode, it will not work
		if (name === 'biographyTags') {
			parent.bioTags = {};
			if (info.hasOwnProperty('handle') && info.hasOwnProperty('tags')) {
				// Find the biography track on the entire selection, since it may not be just the first track of the sel list
				const bioSel = parent.bioSelectionMode === 'Prefer nowplaying' 
					? fb.IsPlaying 
						? new FbMetadbHandleList(fb.GetNowPlaying()) 
						: fb.GetFocusItem()
					: fb.GetFocusItem();
				const sel = plman.ActivePlaylist !== -1 ? fb.GetFocusItem(true) : null;
				if (sel && bioSel && sel.RawPath === bioSel.RawPath) {
					parent.bioTags = JSON.parse(JSON.stringify(info.tags));
				}
			}
		}
	}
};