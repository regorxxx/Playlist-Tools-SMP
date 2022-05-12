'use strict';
//04/02/22

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\helpers_xxx_file.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('chromaprint-utils-js_fingerprint.js');
include('fooid-utils-js_fingerprint.js');

function createFpMenuLeft() {
	const menu = new _menu();
	menu.clear(true); // Reset on every call
	// limits
	const maxSel = 20; // Don't search when selecting more than these items
	// Safe Check
	if (!this.selItems || !this.selItems.Count) {
		this.selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
		if (!this.selItems || !this.selItems.Count) {this.selItems = null; console.log('Fingerprint Tools: No selected items.')}
	}
	// Flags
	const bFlagsSel = this.selItems !== null;
	const bFlagsMaxSel = bFlagsSel && this.selItems.Count < maxSel;
	const bFlagsDb = _isFile(folders.data + 'fpChromaprintReverseMap.json');
	const bFlagsFooid = utils.CheckComponent('foo_biometric', true);
	const flagsSel = bFlagsSel ? MF_STRING : MF_GRAYED;
	const flagsMaxSel = bFlagsMaxSel ? MF_STRING : MF_GRAYED;
	const flagsDb =  bFlagsDb ? MF_STRING : MF_GRAYED;
	const flagsFooid =  bFlagsFooid ? MF_STRING : MF_GRAYED;
	// Args
	const fromHandleList = this.selItems;
	const toHandleList = fb.GetLibraryItems();
	const ppt = getPropertiesPairs(this.buttonsProperties, this.prefix, 0);
	const playlistName = ppt.playlistName[1];
	const chromaTag = ppt.fpTagC[1];
	const fooidTag = ppt.fpTagF[1];
	const databaseHash = ppt.databaseHash[1];
	const databasePath = folders.data + 'fpChromaprintReverseMap.json';
	const databaseIdxPath = folders.data + 'fpChromaprintReverseMapIdx.json';
	// Menus
	{	// Execute comparison Chromaprint
		menu.newEntry({entryText: 'Compare selection by Chromaprint' + (!bFlagsSel ? '\t(no selection)' : !bFlagsMaxSel ? '\t(selection > ' + maxSel + ')' : ''), func: () => {
			const bDone = chromaPrintUtils.compareFingerprints({fromHandleList, toHandleList: fromHandleList, tagName: chromaTag, threshold: 0, bSendToPls: false, bPopup: true});
			this.selItems = null;
			return bDone;
		}, flags: flagsMaxSel});
	}
	menu.newEntry({entryText: 'sep'});
	{	// Execute comparison Chromaprint
		menu.newEntry({entryText: 'Search by similar Chromaprint' + (!bFlagsSel ? '\t(no selection)' : !bFlagsMaxSel ? '\t(selection > ' + maxSel + ')' : ''), func: () => {
			const bDone = chromaPrintUtils.compareFingerprints({fromHandleList, toHandleList, tagName: chromaTag, threshold: ppt.thresholdC[1], playlistName});
			this.selItems = null;
			return bDone;
		}, flags: flagsMaxSel});
	}
	{	// Execute comparison Chromaprint + database
		menu.newEntry({entryText: 'Search by similar Chromaprint (fast)' + (!bFlagsDb ? '\t(no database)' : (!bFlagsSel ? '\t(no selection)' : !bFlagsMaxSel ? '\t(selection > ' + maxSel + ')' : '')), func: () => {
			const bDone = chromaPrintUtils.compareFingerprintsFilter({fromHandleList, toHandleList, tagName: chromaTag, /*threshold: ppt.thresholdC[1],*/ playlistName});
			this.selItems = null;
			return bDone;
		}, flags: flagsDb | flagsMaxSel});
	}
	{	// Execute comparison FooId
		menu.newEntry({entryText: 'Search by similar FooID' + (!bFlagsSel ? '\t(no selection)' : !bFlagsMaxSel ? '\t(selection > ' + maxSel + ')' : ''), func: () => {
			const bDone = fooidUtils.compareFingerprints({fromHandleList, toHandleList, tagName: fooidTag, threshold: ppt.thresholdF[1], playlistName});
			this.selItems = null;
			return bDone;
		}, flags: flagsMaxSel});
	}
	menu.newEntry({entryText: 'sep'});
	{	// Tag Chromaprint
		menu.newEntry({entryText: 'Tag with Chromaprint' + (!bFlagsSel ? '\t(no selection)' : ''), func: () => {
			// Rough estimation of processing time based on total duration... bitrate? Sample rate?
			const t = fromHandleList.CalcTotalDuration() / 3600 * 0.0029 , h = Math.floor(t), m = Math.round((t - h) * 60);
			const tText = ((h ? h + ' h': '') + (h && m ? ' ' : '') + (m ? m + ' min': '')) || '< 1 min';
			const answer = WshShell.Popup('Tag selected tracks with Chromaprint?\nEstimated time: ' + tText + '\n(based on selection\'s total duration)', 0, 'Fingerprint Tools', popup.question + popup.yes_no);
			if (answer === popup.no) {return;}
			// To avoid classes with other calls name the json with UUID
			fb.ShowConsole();
			const bDone = chromaPrintUtils.calculateFingerprints({fromHandleList, tagName: chromaTag, bMerge: ppt.bMergeC[1]});
			this.selItems = null;
			// Change hash to force database reloading on next call
			if (databaseHash !== -1 && fromHandleList.Convert().some((handle) => {return fb.IsMetadbInMediaLibrary(handle);})) {ppt.databaseHash[1] += 1; overwriteProperties(ppt);}
			return bDone;
		}, flags: flagsSel});
	}
	{	// Tag FooId
		menu.newEntry({entryText: 'Tag with FooID' + (!bFlagsFooid ? '\t(not installed)' :(!bFlagsSel ? '\t(no selection)' : '')), func: () => {
			// Tag
			if (bFlagsFooid) {fb.ShowConsole();}
			const bDone = fooidUtils.calculateFingerprints({fromHandleList});
			this.selItems = null;
			return bDone;
		}, flags: flagsSel | flagsFooid});
	}
	menu.newEntry({entryText: 'sep'});
	{	// Chromaprint database
		menu.newEntry({entryText: (databaseHash !== -1 ? '(Re)c': 'C') + 'reate Chromaprint database...', func: (bOmmit = false) => {
			const newhash = chromaprintDatabaseHash(toHandleList);
			if (!bOmmit) {
				const answer = WshShell.Popup('Scan entire library for "' + chromaTag + '" tags and create a reverse indexed database for faster mathing?.\nNote library must be tagged with Chromaprint first.\nRecreating the database is needed after adding or removing items.', 0, 'Fingerprint Tools', popup.question + popup.yes_no);
				if (answer === popup.no) {return;}
				if (newhash === databaseHash) {
					const answer = WshShell.Popup('Previous database has same hash than new one, this may happen if no items have been added/removed (duration and total count remains the same) but fingerprint tags have been changed.\nRecreate it anyway?', 0, 'Fingerprint Tools', popup.question + popup.yes_no);
					if (answer === popup.no) {return;}
				}
			}
			let reverseMap = chromaPrintUtils.reverseIndexingIter({toHandleList, bFast: true});
			// let reverseMap = chromaPrintUtils.reverseIndexing({toTags: getTagsValuesV4(toHandleList, [chromaTag], true, void(0), null), bFast: true});
			// _saveSplitJson(databasePath, Object.entries(reverseMap), SetReplacer, void(0), 1000);
			_save(databasePath, JSON.stringify(Object.entries(reverseMap), SetReplacer));
			// _save(databasePath, JSON.stringify(Array.from(reverseMap), SetReplacer));
			reverseMap = null; // Free memory immediately, these are huge
			let libraryMap = chromaPrintUtils.libraryMap({toHandleList, bReverse: false});
			_save(databaseIdxPath, JSON.stringify(Object.entries(libraryMap)));
			libraryMap = null;
			ppt.databaseHash[1] = newhash;
			overwriteProperties(ppt);
		}});
	}
	menu.newEntry({entryText: 'sep'});
	{	// Chromaprint database
		menu.newEntry({entryText: 'Readme...', func: (bOmmit = false) => {
			const readmePath = folders.xxx + 'helpers\\readme\\fingerprint_tools.txt';
			const readme = _open(readmePath, convertCharsetToCodepage('UTF-8'));
			if (readme.length) {fb.ShowPopupMessage(readme, 'Fingerprint Tools');}
		}});
	}
	if (databaseHash !== -1) {
		let bRecreate = popup.no;
		// Missing database?
		if (!_isFile(databasePath)) {
			ppt.databaseHash[1] = -1;
			overwriteProperties(ppt);
			bRecreate = WshShell.Popup('Chromaprint databasefile is missing.\nRecreate it?', 0, 'Fingerprint Tools', popup.question + popup.yes_no);
		} 
		// Check database is up to date and ask to recreate it otherwise
		else if (chromaprintDatabaseHash(toHandleList) !== databaseHash) {
			bRecreate = WshShell.Popup('Previous Chromaprint database may not be up to date.\nRecreate it?', 0, 'Fingerprint Tools', popup.question + popup.yes_no);
		}
		// Call the entry to recreate it directly without any more questions and continue with the menu
		if (bRecreate === popup.yes) {menu.btn_up(void(0), void(0), void(0), '(Re)create Chromaprint database...', void(0), void(0), void(0), {pos: 0, args: true});}
	}
	return menu;
}

// Just cache total duration of library + item count. 
// Don't consider file size since other tags not related to fingerprint may change... this case is covered at tagging step forcing an arbitrary hash change
function chromaprintDatabaseHash(libItems) {
	return round(libItems.CalcTotalDuration() + libItems.Count, 4);
}