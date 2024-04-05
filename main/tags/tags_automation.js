'use strict';
//04/04/24

/*
	Automatic tagging...
	File processing takes time, specially for some functions (ReplayGain, etc.), so we delay next step execution
	until onMetadbChanged fires for all selected handles.

	Note there is no way to know when some arbitrary plugin finish their processing.
	Some plugins expect user input for final tagging after processing the files (ReplayGain for ex.), so those steps
	are delayed to the end so the user can press OK on those popups without blocking processing.
 */

/* exported TagAutomation */

/* global chromaPrintUtils:readable, ffmpeg:readable, folksonomyUtils:readable, essentia:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global globTags:readable, folders:readable, soFeat:readable, isFoobarV2:readable, popup:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global WshShell:readable, _isFile:readable, testPath:readable, _isLink:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global BiMap:readable, debounce:readable, isArrayStrings:readable , repeatFn:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global getHandleListTags:readable */

function TagAutomation({
	toolsByKey = null /* {biometric: true, chromaPrint: true, massTag: true, audioMd5: true, rgScan: true, tpScan: false, dynamicRange: true, LRA: true, KEY: true} */,
	bOutputTools = false,
	bOutputDefTools = false,
	bWineBug = false,
	bFormatPopups = true,
	bToolPopups = true,
} = {}) {
	this.selItems = null;
	this.selItemsByCheck = {
		subSong: { present: null, missing: null, num: null },
		md5: { present: null, missing: null, num: null }
	};
	this.check = {
		subSong: null,
		md5: null
	};
	this.checkKeys = Object.keys(this.selItemsByCheck);
	this.countItems = null;
	this.iStep = null;
	this.currentTime = null;
	this.listener = null;
	this.timers = { debounce: 300, listener: 1000 };
	this.bWineBug = bWineBug;
	this.bToolPopups = bToolPopups;
	this.notAllowedTools = new Set();
	this.incompatibleTools = new BiMap({ ffmpegLRA: 'essentiaLRA', essentiaKey: 'essentiaFastKey' });
	this.tools = [
		{
			key: 'biometric', tag: [globTags.fooidFP],
			title: 'FooID Fingerprinting', bAvailable: utils.CheckComponent('foo_biometric', true), bDefault: true
		},
		{
			key: 'chromaPrint', tag: [globTags.acoustidFP],
			title: 'ChromaPrint Fingerprinting', bAvailable: _isFile(folders.xxx + 'main\\fingerprint\\chromaprint-utils-js_fingerprint.js') && _isFile(folders.xxx + 'helpers-external\\fpcalc\\fpcalc' + (soFeat.x64 ? '' : '_32') + '.exe'), bDefault: true
		},
		{
			key: 'massTag', tag: ['AUDIOMD5'],
			title: 'MD5', bAvailable: utils.CheckComponent('foo_masstag', true), bDefault: true
		},
		{
			key: 'audioMd5', tag: ['MD5'],
			title: 'AUDIOMD5', bAvailable: utils.CheckComponent('foo_audiomd5', true), bDefault: true
		},
		{
			key: 'rgScan', tag: ['REPLAYGAIN_ALBUM_GAIN', 'REPLAYGAIN_ALBUM_PEAK', 'REPLAYGAIN_TRACK_GAIN', 'REPLAYGAIN_TRACK_PEAK'],
			title: 'ReplayGain', bAvailable: isFoobarV2 || utils.CheckComponent('foo_rgscan', true), bDefault: true
		},
		{
			key: 'tpScan', tag: ['TRUEPEAK_SCANNER_ALBUM_GAIN', 'REPLAYGAIN_ALBUM_TRUE_PEAK', 'TRUEPEAK_SCANNER_TRACK_GAIN', 'REPLAYGAIN_TRACK_TRUE_PEAK','TRUEPEAK_SCANNER_PEAK_POSITION','TRUEPEAK_SCANNER_CLIPPED_SAMPLES','TRUEPEAK_SCANNER_CLIPPED_SAMPLES_ALBUM'],
			title: 'True Peak Scanner', bAvailable: utils.CheckComponent('foo_truepeak', true), bDefault: false
		},
		{
			key: 'dynamicRange', tag: ['ALBUM DYNAMIC RANGE', 'DYNAMIC RANGE'],
			title: 'DR', bAvailable: utils.CheckComponent('foo_dynamic_range', true), bDefault: true
		},
		{
			key: 'ffmpegLRA', tag: ['LRA'],
			title: 'EBUR 128 Scanner (ffmpeg)', bAvailable: _isFile(folders.xxx + 'helpers-external\\ffmpeg\\ffmpeg' + (soFeat.x64 ? '' : '_32') + '.exe'), bDefault: true
		},
		{
			key: 'folksonomy', tag: ['FOLKSONOMY'],
			title: 'Folksonomy', bAvailable: false, bDefault: false
		},
		{
			key: 'essentiaFastKey', tag: [globTags.key],
			title: 'Key (essentia fast)', bAvailable: _isFile(folders.xxx + 'helpers-external\\essentia\\essentia_streaming_key.exe'), bDefault: false
		},
		{
			key: 'essentiaKey', tag: [globTags.key],
			title: 'Key (essentia)', bAvailable: _isFile(folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe'), bDefault: true
		},
		{
			key: 'essentiaBPM', tag: [globTags.bpm],
			title: 'BPM (essentia)', bAvailable: _isFile(folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe'), bDefault: true
		},
		{
			key: 'essentiaDanceness', tag: ['DANCENESS'],
			title: 'Danceness (essentia)', bAvailable: _isFile(folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe'), bDefault: false
		},
		{
			key: 'essentiaLRA', tag: ['LRA'],
			title: 'EBUR 128 Scanner (essentia)', bAvailable: _isFile(folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe'), bDefault: false
		}
	];
	this.toolsByKey = Object.fromEntries(this.tools.map((tool) => { return [tool.key, tool.bAvailable && tool.bDefault]; }));
	this.tagsByKey = Object.fromEntries(this.tools.map((tool) => { return [tool.key, tool.tag]; }));
	this.titlesByKey = Object.fromEntries(this.tools.map((tool) => { return [tool.key, tool.title]; }));
	// Enabled tools?
	if (toolsByKey) {
		Object.keys(toolsByKey).forEach((key) => {
			if (Object.hasOwn(this.toolsByKey, key)) { this.toolsByKey[key] = toolsByKey[key]; }
			else { console.log('TagAutomation: tool key not recognized ' + key); }
		});
	}
	if (bOutputTools || bOutputDefTools) {
		if (bOutputDefTools) { this.tools.forEach((tool) => { this.toolsByKey[tool.key] = tool.bAvailable; }); }
		else { this.tools.forEach((tool) => { this.toolsByKey[tool.key] = tool.bAvailable ? tool.bDefault : false; }); }
		this.incompatibleTools.uniValues().forEach((tool) => { this.toolsByKey[tool] = false; });
		return this.toolsByKey;
	}

	this.description = () => {
		return this.tools.reduce((text, tool) => { return (this.toolsByKey[tool.key] ? (text.length ? text + ', ' + tool.title : tool.title) : text); }, ''); // Initial value is '';
	};

	this.setNotAllowedTools = (type) => {
		switch (type) {
			case 'subSong':
				this.notAllowedTools = new Set(['audioMd5', 'chromaPrint', 'ffmpegLRA', 'massTag', 'essentiaFastKey', 'essentiaKey', 'essentiaBPM', 'essentiaDanceness', 'essentiaLRA']);
				break;
			case 'md5':
				this.notAllowedTools = new Set(['massTag']);
				break;
			default:
				this.notAllowedTools = new Set();
				break;
		}
	};

	this.run = () => {
		// Usage tips
		if (this.bToolPopups && (this.toolsByKey.essentiaKey || this.toolsByKey.essentiaBPM || this.toolsByKey.essentiaDanceness || this.toolsByKey.essentiaLRA)) {
			if (this.toolsByKey.ffmpegLRA) {
				console.popup('ffmpeg is being used to calculate LRA tag, along Essentia (full extractor) for other tag(s); in such case it\'s recommended to disable ffmpeg and retrieve the LRA tag with Essentia too.\n\nCalculation time will decrease since Essentia computes all low level data even when retrieving only a single tag, thus skipping an additional step with ffmpeg.', 'Tags Automation');
			}
			if (this.toolsByKey.essentiaFastKey) {
				console.popup('Essentia (fast) is being used to calculate Key tag, along Essentia (full extractor) for other tag(s); in such case it\'s recommended to disable the former and retrieve the key tag with the full extractor instead. Results will be the same.\n\nCalculation time will decrease since Essentia (full extractor) computes all low level data even when retrieving only a single tag, thus skipping an additional step.', 'Tags Automation');
			}
		}
		if (this.bToolPopups && this.toolsByKey.rgScan && this.toolsByKey.tpScan) {
			console.popup('True Peak Scanner is being used along ReplayGain. Note some custom settings may duplicate file scanning or tagging unnecesarily, so it may be desirable to only use one of them. Check their original documentation for more usage info.', 'Tags Automation');
		}
		this.countItems = 0;
		this.currentTime = 0;
		this.selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
		if (typeof this.selItems !== 'undefined' && this.selItems !== null) {
			this.selItems.Sort();
			const inputCount = this.selItems.Count;
			this.selItems = new FbMetadbHandleList(this.selItems.Convert().filter((handle) => testPath(handle.Path) && !_isLink(handle.Path)));
			this.countItems = this.selItems.Count;
			const skippedCount = inputCount - this.countItems;
			if (this.countItems === 0) {
				console.log('No tracks selected (or all items were dead/links).');
				return;
			} else if (skippedCount !== 0) {
				console.popup('Skipped ' + skippedCount + ' dead or link items.' , window.Name);
			}
		} else { return; }
		// Safety check for accidental button pressing
		let answer = WshShell.Popup('Do you want to continue? Some tags will be edited, can not be undone.\n\nTools:\n' + this.description(), 0, window.Name, popup.question + popup.yes_no);
		if (answer === popup.no) {
			this.iStep = null;
			this.selItems = null;
			this.countItems = null;
			this.currentTime = null;
			['subSong', 'md5'].forEach((key) => {
				this.selItemsByCheck[key].missing = null;
				this.selItemsByCheck[key].present = null;
				this.selItemsByCheck[key].num = null;
				this.check[key] = null;
			});
		} else {
			// Check if there are ISO/CUE files (which can not be piped to ffmpeg)
			this.check.subSong = this.selItems.Convert().some((handle) => { return handle.SubSong !== 0; });
			// Check if there are MP3 files (which have no MD5 tag)
			const md5TF = fb.TitleFormat('[%__MD5%]');
			this.check.md5 = this.selItems.Convert().some((handle) => { return !md5TF.EvalWithMetadb(handle).length; });
			if (this.checkKeys.some((checkKey) => this.check[checkKey])) {
				if (this.check.subSong) {
					this.setNotAllowedTools('subSong');
					const notAllowedTools = this.tools.map((tool) => { return this.toolsByKey[tool.key] && this.notAllowedTools.has(tool.key) ? tool.title : null; }).flat(Infinity).filter(Boolean);
					this.check.subSong = this.check.subSong && notAllowedTools.length;
					if (this.check.subSong) {
						bFormatPopups && console.popup('Some of the selected tracks have a SubSong index different to zero, which means their container may be an ISO file, CUE, etc.\n\nThese tracks can not be used with the following tools (and will be omitted in such steps):\n' + notAllowedTools.join(', ') + '\n\nThis limitation may be bypassed converting the tracks into individual files, scanning them and finally copying back the tags. Only required for ChromaPrint (%' + globTags.acoustidFP + '%), Essentia (%' + globTags.key + '%, %LRA%, %DACENESS%, %' + globTags.bpm + '%) and ffmpeg (%LRA%).\nMore info and tips can be found here:\nhttps://github.com/regorxxx/Playlist-Tools-SMP/wiki/Known-problems-or-limitations#fingerprint-chromaprint-or-fooid-and-ebur-128-ffmpeg-tagging--fails-with-some-tracks', 'Tags Automation');
						// Remove old tags
						{	// Update problematic tracks with safe tools
							this.selItemsByCheck.subSong.present = new FbMetadbHandleList(this.selItems.Clone().Convert().filter((handle) => { return handle.SubSong !== 0; }));
							this.selItemsByCheck.subSong.present.Sort();
							let arr = [];
							const cleanTags = Object.fromEntries(this.tools.map((tool) => { return this.toolsByKey[tool.key] && !this.notAllowedTools.has(tool.key) ? tool.tag : null; }).flat(Infinity).filter(Boolean).map((tag) => { return [tag, '']; }));
							if (Object.keys(cleanTags).length) {
								this.selItemsByCheck.subSong.num = this.selItemsByCheck.subSong.present.Count;
								for (let i = 0; i < this.selItemsByCheck.subSong.num; ++i) { arr.push(cleanTags); }
								this.selItemsByCheck.subSong.present.UpdateFileInfoFromJSON(JSON.stringify(arr));
							}
						}
						{	// And then other tracks with the rest
							this.selItemsByCheck.subSong.missing = new FbMetadbHandleList(this.selItems.Clone().Convert().filter((handle) => { return handle.SubSong === 0; }));
							this.selItemsByCheck.subSong.missing.Sort();
							let arr = [];
							const cleanTags = Object.fromEntries(this.tools.map((tool) => { return this.toolsByKey[tool.key] ? tool.tag : null; }).flat(Infinity).filter(Boolean).map((tag) => { return [tag, '']; }));
							if (Object.keys(cleanTags).length) {
								const count = this.selItemsByCheck.subSong.missing.Count;
								for (let i = 0; i < count; ++i) { arr.push(cleanTags); }
								this.selItemsByCheck.subSong.missing.UpdateFileInfoFromJSON(JSON.stringify(arr));
							}
						}
					}
				}
				if (this.check.md5) {
					this.setNotAllowedTools('md5');
					const notAllowedTools = this.tools.map((tool) => { return this.toolsByKey[tool.key] && this.notAllowedTools.has(tool.key) ? tool.title : null; }).flat(Infinity).filter(Boolean);
					this.check.md5 = this.check.md5 && notAllowedTools.length;
					if (this.check.md5) {
						bFormatPopups && console.popup('Some of the selected tracks are encoded in a format with no MD5 support.\n\nThese tracks can not be used with the following tools (and will be omitted in such steps):\n' + notAllowedTools.join(', '), 'Tags Automation');
						// Remove old tags
						{	// Update problematic tracks with safe tools
							this.selItemsByCheck.md5.present = new FbMetadbHandleList(this.selItems.Clone().Convert().filter((handle) => { return !md5TF.EvalWithMetadb(handle).length; }));
							this.selItemsByCheck.md5.present.Sort();
							if (this.check.subSong && this.selItemsByCheck.subSong.num) {
								this.selItemsByCheck.md5.present.MakeIntersection(this.selItemsByCheck.subSong.present);
							}
							let arr = [];
							const cleanTags = Object.fromEntries(this.tools.map((tool) => { return this.toolsByKey[tool.key] && !this.notAllowedTools.has(tool.key) ? tool.tag : null; }).flat(Infinity).filter(Boolean).map((tag) => { return [tag, '']; }));
							if (Object.keys(cleanTags).length) {
								this.selItemsByCheck.md5.num = this.selItemsByCheck.md5.present.Count;
								for (let i = 0; i < this.selItemsByCheck.md5.num; ++i) { arr.push(cleanTags); }
								this.selItemsByCheck.md5.present.UpdateFileInfoFromJSON(JSON.stringify(arr));
							}
						}
						{	// And then other tracks with the rest
							this.selItemsByCheck.md5.missing = new FbMetadbHandleList(this.selItems.Clone().Convert().filter((handle) => { return md5TF.EvalWithMetadb(handle).length; }));
							this.selItemsByCheck.md5.missing.Sort();
							if (this.check.subSong && this.selItemsByCheck.subSong.missing && this.selItemsByCheck.subSong.missing.Count) {
								this.selItemsByCheck.md5.missing.MakeIntersection(this.selItemsByCheck.subSong.missing);
							}
							let arr = [];
							const cleanTags = Object.fromEntries(this.tools.map((tool) => { return this.toolsByKey[tool.key] ? tool.tag : null; }).flat(Infinity).filter(Boolean).map((tag) => { return [tag, '']; }));
							if (Object.keys(cleanTags).length) {
								const count = this.selItemsByCheck.md5.missing.Count;
								for (let i = 0; i < count; ++i) { arr.push(cleanTags); }
								this.selItemsByCheck.md5.missing.UpdateFileInfoFromJSON(JSON.stringify(arr));
							}
						}
					}
				}
			} else {
				// Remove old tags
				let arr = [];
				const cleanTags = Object.fromEntries(this.tools.map((tool) => { return this.toolsByKey[tool.key] ? tool.tag : null; })
					.flat(Infinity).filter(Boolean).map((tag) => { return [tag, '']; }));
				if (Object.keys(cleanTags).length) {
					for (let i = 0; i < this.countItems; ++i) { arr.push(cleanTags); }
					this.selItems.UpdateFileInfoFromJSON(JSON.stringify(arr));
				}
			}
			// Process files on steps
			this.iStep = 0;
			this.nextStepTag();
			this.createListener(); // Add a listener associated to the handle list instead of relying on callbacks which fail sometimes...
		}
	};

	this.stopStepTag = () => {
		this.iStep = null;
		this.selItems = null;
		this.countItems = null;
		this.currentTime = null;
		clearInterval(this.listener);
		this.listener = null;
		['subSong', 'md5'].forEach((key) => {
			this.selItemsByCheck[key].missing = null;
			this.selItemsByCheck[key].present = null;
			this.selItemsByCheck[key].num = null;
			this.check[key] = null;
		});
	};

	this.nextStepTag = () => {
		this.debouncedStep(this.iStep);
	};

	const orderKeys = ['rgScan', 'tpScan', 'biometric', 'massTag', 'dynamicRange', 'chromaPrint', 'ffmpegLRA', 'folksonomy', 'essentiaFastKey', ['essentiaKey', 'essentiaBPM', 'essentiaDanceness', 'essentiaLRA']]; // Must follow order at this.stepTag()
	if (orderKeys.flat(Infinity).some((k) => !Object.hasOwn(this.toolsByKey, k))) { throw new Error('Key not associated to any tool'); }
	this.stepTag = (i) => {
		let bSucess = false;
		this.iStep++;
		switch (i) {
			case 0: // Less than 100 ms / track?
				if (this.toolsByKey.rgScan) { // Replay gain info is not always removed
					bSucess = fb.RunContextCommandWithMetadb('ReplayGain/Remove ReplayGain information from files', this.selItems, 8);
				} else { bSucess = false; }
				break;
			case 1: // Less than 100 ms / track?
				if (this.toolsByKey.tpScan) { // True Peak info may use custom tags this way...
					bSucess = fb.RunContextCommandWithMetadb('ReplayGain/Remove True Peak information from files', this.selItems, 8);
				} else { bSucess = false; }
				break;
			case 2:  // Takes 260 ms / track
				if (this.toolsByKey.biometric) {
					bSucess = fb.RunContextCommandWithMetadb('Save fingerprint to file(s)', this.selItems, 8);
				} else { bSucess = false; }
				break;
			case 3: // Less than 170 ms / track?
				if (this.toolsByKey.massTag) {
					if (this.check.subSong || this.check.md5) {
						if (this.check.subSong && this.selItemsByCheck.subSong.missing.Count) {
							bSucess = fb.RunContextCommandWithMetadb('Tagging/Scripts/MD5', this.selItemsByCheck.subSong.missing, 8);
						}
						if (this.check.md5 && this.selItemsByCheck.md5.missing.Count) {
							bSucess = fb.RunContextCommandWithMetadb('Tagging/Scripts/MD5', this.selItemsByCheck.md5.missing, 8);
						}
					} else { bSucess = fb.RunContextCommandWithMetadb('Tagging/Scripts/MD5', this.selItems, 8); }
				} else { bSucess = false; }
				break;
			case 4: // Warning: This step updates tags for entire albums while processing the list... so times changes according to album length
				if (this.toolsByKey.dynamicRange) {
					bSucess = fb.RunContextCommandWithMetadb('Dynamic Range Meter', this.selItems, 8);
				}
				else { bSucess = false; }
				break;
			case 5:
				if (this.toolsByKey.chromaPrint) {
					if (this.check.subSong) {
						if (this.selItemsByCheck.subSong.missing.Count) {
							bSucess = chromaPrintUtils.calculateFingerprints({ fromHandleList: this.selItemsByCheck.subSong.missing });
						}
					} else { bSucess = chromaPrintUtils.calculateFingerprints({ fromHandleList: this.selItems }); }
				} else { bSucess = false; }
				break;
			case 6:
				if (this.toolsByKey.ffmpegLRA) {
					if (this.check.subSong) {
						if (this.selItemsByCheck.subSong.missing.Count) {
							bSucess = ffmpeg.calculateLoudness({ fromHandleList: this.selItemsByCheck.subSong.missing, bWineBug: this.bWineBug });
						}
					} else { bSucess = ffmpeg.calculateLoudness({ fromHandleList: this.selItems, bWineBug: this.bWineBug }); }
				} else { bSucess = false; }
				break;
			case 7:
				if (this.toolsByKey.folksonomy) {
					if (this.check.subSong) {
						if (this.selItemsByCheck.subSong.missing.Count) {
							bSucess = folksonomyUtils.calculateFolksonomy({ fromHandleList: this.selItemsByCheck.subSong.missing });
						}
					} else { bSucess = folksonomyUtils.calculateFolksonomy({ fromHandleList: this.selItems }); }
				} else { bSucess = false; }
				break;
			case 8:
				if (this.toolsByKey.essentiaFastKey) {
					if (this.check.subSong) {
						if (this.selItemsByCheck.subSong.missing.Count) {
							bSucess = essentia.calculateKey({ fromHandleList: this.selItemsByCheck.subSong.missing });
						}
					} else { bSucess = essentia.calculateKey({ fromHandleList: this.selItems }); }
				} else { bSucess = false; }
				break;
			case 9:
				if (this.toolsByKey.essentiaKey || this.toolsByKey.essentiaBPM || this.toolsByKey.essentiaDanceness || this.toolsByKey.essentiaLRA) {
					const tagName = ['essentiaKey', 'essentiaBPM', 'essentiaDanceness', 'essentiaLRA'].map((key) => { return this.toolsByKey[key] ? this.tagsByKey[key][0] : null; }).filter(Boolean);
					if (this.check.subSong) {
						if (this.selItemsByCheck.subSong.missing.Count) {
							bSucess = essentia.calculateHighLevelTags({ fromHandleList: this.selItemsByCheck.subSong.missing, tagName });
						}
					} else { bSucess = essentia.calculateHighLevelTags({ fromHandleList: this.selItems, tagName }); }
				} else { bSucess = false; }
				break;
			case 10: // These require user input before saving, so they are read only operations and can be done at the same time
				if (this.toolsByKey.audioMd5 || this.toolsByKey.rgScan || this.toolsByKey.tpScan ) {
					this.currentTime = 0; // ms
					const cacheSelItems = this.selItems;
					const cacheSelItemsNoSubSong = this.selItemsByCheck.subSong.missing;
					const bSubSong = this.check.subSong;
					if (this.toolsByKey.audioMd5) {
						setTimeout(function () {
							if (bSubSong) {
								if (cacheSelItemsNoSubSong.Count) {
									bSucess = ['Utilities/Create Audio MD5 checksum', 'Utilities/Create Audio MD5 tag']
										.some((name) => fb.RunContextCommandWithMetadb(name, cacheSelItemsNoSubSong, 8));
								}
							} else {
								bSucess = ['Utilities/Create Audio MD5 checksum', 'Utilities/Create Audio MD5 tag']
									.some((name) => fb.RunContextCommandWithMetadb(name, cacheSelItems, 8));
							}
						}, this.currentTime); // Takes 170 ms / track
						this.currentTime += 200 * this.countItems; // But we give them some time to run before firing the next one
					}
					if (this.toolsByKey.rgScan) {
						setTimeout(function () {
							bSucess = fb.RunContextCommandWithMetadb('ReplayGain/Scan as albums (by tags)', cacheSelItems, 8);
						}, this.currentTime); // Takes ~500 ms / track
						this.currentTime += 550 * this.countItems; // But we give them some time to run before firing the next one
					}
					if (this.toolsByKey.tpScan) {
						setTimeout(function () {
							bSucess = fb.RunContextCommandWithMetadb('ReplayGain/Scan True Peaks and Positions (as albums)', cacheSelItems, 8);
						}, this.currentTime); // Takes ~500 ms / track
						this.currentTime += 550 * this.countItems; // But we give them some time to run before firing the next one
					}
				} else { bSucess = false; }
				break;
			default:
				this.stopStepTag();
				return;
		}
		if (!bSucess) { this.stepTag(this.iStep); } // If the step was omitted, then run next step
	};

	this.debouncedStep = debounce(this.stepTag, this.timers.debounce); // Only continues next step when last tag update was done > X ms ago

	this.checkHandleList = () => {
		const i = this.iStep - 1;
		if (i >= 0) {
			const key = orderKeys[i];
			const checkKeys = this.checkKeys.filter((checkKey) => this.check[checkKey]);
			if (!checkKeys.length) { checkKeys.push('all'); }
			// Compare tags
			const check = (checkKey, key, i) => {
				if (isArrayStrings(key)) { return key.every((k) => check(k)); } // Some steps have multiple tags...
				const mergeTags = new Set(['chromaPrint', 'folksonomy']);
				const handleList = this.notAllowedTools.has(key) ? this.selItemsByCheck[checkKey].missing : this.selItems;
				if (this.toolsByKey[key] && handleList.Count) {
					const idx = this.tools.findIndex((tool) => { return tool.key === key; });
					const tag = this.tools[idx].tag;
					const itemTags = getHandleListTags(handleList, tag, { bMerged: true })
						.map((tagArr) => mergeTags.has(key) ? tagArr.join(', ') : tagArr)
						.flat(Infinity).filter(Boolean);
					if (i <= 1 && itemTags.length) { return false; } // Only at first steps it checks for no tags!
					else if (i > 1 && itemTags.length / tag.length !== handleList.Count) { return false; } // NOSONAR
				}
				return true;
			};
			// Process all checks
			for (let checkKey of checkKeys) {
				if (this.check[checkKey]) { this.setNotAllowedTools(checkKey); } else { this.setNotAllowedTools(); }
				if (!check(checkKey, key, i)) { return; }
			}
			this.nextStepTag();
			return;
		}
		this.nextStepTag();
	};

	this.createListener = () => {
		if (this.listener !== null) { clearInterval(this.listener); }
		this.listener = repeatFn(this.checkHandleList, this.timers.listener)();
		return this.listener;
	};

	this.changeTools = (toolsByKey) => {
		this.toolsByKey = toolsByKey;
		this.loadDependencies();
	};

	this.loadDependencies = () => {
		if (this.toolsByKey.chromaPrint) { include('..\\fingerprint\\chromaprint-utils-js_fingerprint.js'); }
		if (this.toolsByKey.ffmpegLRA) { include('..\\tags\\ffmpeg-utils.js'); }
		if (this.toolsByKey.essentiaFastKey) { include('..\\tags\\essentia-utils.js'); }
		if (this.toolsByKey.essentiaKey || this.toolsByKey.essentiaBPM || this.toolsByKey.essentiaDanceness || this.toolsByKey.essentiaLRA) { include('..\\tags\\essentia-utils.js'); }
		if (this.toolsByKey.folksonomy) { include('..\\tags\\folksonomy-utils.js'); }
	};

	this.isRunning = () => {
		return this.selItems !== null && this.countItems !== null && this.iStep !== null;
	};

	this.init = () => {
		this.loadDependencies();
	};

	this.init();
}