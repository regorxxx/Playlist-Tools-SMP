﻿'use strict';
//19/12/22

/* 
	Automatic tagging...
	File processing takes time, specially for some functions (ReplayGain, etc.), so we delay next step execution 
	until onMetadbChanged fires for all selected handles. 
	
	Note there is no way to know when some arbitrary plugin finish their processing.
	Some plugins expect user input for final tagging after processing the files (ReplayGain for ex.), so those steps
	are delayed to the end so the user can press OK on those popups without blocking processing.
 */

include('..\\..\\helpers\\helpers_xxx.js');

function tagAutomation(toolsByKey = null /*{biometric: true, chromaPrint: true, massTag: true, audioMd5: true, rgScan: true, dynamicRange: true, LRA: true, KEY: true}*/, bOutputTools = false, bOutputDefTools = false) {
	this.selItems = null;
	this.selItemsSubSong = null;
	this.selItemsNoSubSong = null;
	this.bSubsong = null;
	this.subSongNum = null;
	this.countItems = null;
	this.iStep = null;
	this.currentTime = null;
	this.listener = null;
	this.timers = {debounce: 300, listener: 1000};
	this.notAllowedTools = new Set(['audioMd5', 'chromaPrint', 'ffmpegLRA', 'massTag', 'essentiaFastKey','essentiaKey','essentiaBPM','essentiaDanceness','essentiaLRA']);
	this.incompatibleTools = new biMap({ffmpegLRA: 'essentiaLRA', essentiaKey: 'essentiaFastKey'});
	this.tools = [
		{key: 'biometric', tag: [globTags.fooidFP], 
			title: 'FooID Fingerprinting', bAvailable: utils.CheckComponent('foo_biometric', true), bDefault: true},
		{key: 'chromaPrint', tag: [globTags.acoustidFP],
			title: 'ChromaPrint Fingerprinting', bAvailable: utils.IsFile(folders.xxx + 'main\\fingerprint\\chromaprint-utils-js_fingerprint.js') && utils.IsFile(folders.xxx + 'helpers-external\\fpcalc\\fpcalc.exe'), bDefault: true},
		{key: 'massTag', tag: ['AUDIOMD5'], 
			title: 'MD5', bAvailable: utils.CheckComponent('foo_masstag', true), bDefault: true},
		{key: 'audioMd5', tag: ['MD5'],
			title: 'AUDIOMD5', bAvailable: utils.CheckComponent('foo_audiomd5', true), bDefault: true},
		{key: 'rgScan', tag: ['REPLAYGAIN_ALBUM_GAIN', 'REPLAYGAIN_ALBUM_PEAK', 'REPLAYGAIN_TRACK_GAIN', 'REPLAYGAIN_TRACK_PEAK'],
			title: 'ReplayGain', bAvailable: utils.CheckComponent('foo_rgscan', true), bDefault: true},
		{key: 'dynamicRange', tag: ['ALBUM DYNAMIC RANGE', 'DYNAMIC RANGE'],
			title: 'DR', bAvailable: utils.CheckComponent('foo_dynamic_range', true), bDefault: true},
		{key: 'ffmpegLRA', tag: ['LRA'],
			title: 'EBUR 128 Scanner (ffmpeg)', bAvailable: utils.IsFile(folders.xxx + 'helpers-external\\ffmpeg\\ffmpeg.exe'), bDefault: true},
		{key: 'essentiaFastKey', tag: [globTags.key],
			title: 'Key (essentia fast)', bAvailable: utils.IsFile(folders.xxx + 'helpers-external\\essentia\\essentia_streaming_key.exe'), bDefault: false},
		{key: 'essentiaKey', tag: [globTags.key],
			title: 'Key (essentia)', bAvailable: utils.IsFile(folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe'), bDefault: true},
		{key: 'essentiaBPM', tag: [globTags.bpm],
			title: 'BPM (essentia)', bAvailable: utils.IsFile(folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe'), bDefault: true},
		{key: 'essentiaDanceness', tag: ['DANCENESS'],
			title: 'Danceness (essentia)', bAvailable: utils.IsFile(folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe'), bDefault: false},
		{key: 'essentiaLRA', tag: ['LRA'],
			title: 'EBUR 128 Scanner (essentia)', bAvailable: utils.IsFile(folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe'), bDefault: false},
	];
	this.toolsByKey = Object.fromEntries(this.tools.map((tool) => {return [tool.key, tool.bAvailable && tool.bDefault];}));
	this.tagsByKey = Object.fromEntries(this.tools.map((tool) => {return [tool.key, tool.tag];}));
	this.titlesByKey = Object.fromEntries(this.tools.map((tool) => {return [tool.key, tool.title];}));
	// Enabled tools?
	if (toolsByKey) {
		Object.keys(toolsByKey).forEach((key) => {
			if (this.toolsByKey.hasOwnProperty(key)) {this.toolsByKey[key] = toolsByKey[key];}
			else {console.log('tagAutomation: tool key not recognized ' + key);}
		})
	}
	if (bOutputTools || bOutputDefTools) {
		if (bOutputDefTools) {this.tools.forEach((tool) => {this.toolsByKey[tool.key] = tool.bAvailable ? true : false;});}
		else {this.tools.forEach((tool) => {this.toolsByKey[tool.key] = tool.bAvailable ? tool.bDefault : false;});}
		this.incompatibleTools.uniValues().forEach((tool) => {this.toolsByKey[tool] = false;});
		return this.toolsByKey;
	}
	
	this.description = () => {
		return this.tools.reduce((text, tool, index) => {return (this.toolsByKey[tool.key] ? (text.length ? text + ', ' + tool.title : tool.title) : text);}, ''); // Initial value is '';
	};
	
	this.run = () => {
		// Usage tips
		if (this.toolsByKey.essentiaKey || this.toolsByKey.essentiaBPM || this.toolsByKey.essentiaDanceness || this.toolsByKey.essentiaLRA) {
			if (this.toolsByKey.ffmpegLRA) {
				console.popup('ffmpeg is being used to calculate LRA tag, along Essentia (full extractor) for other tag(s); in such case it\'s recommended to disable ffmpeg and retrieve the LRA tag with Essentia too.\n\nCalculation time will decrease since Essentia computes all low level data even when retrieving only a single tag, thus skipping an additional step with ffmpeg.', 'Tags Automation');
			}
			if (this.toolsByKey.essentiaFastKey) {
				console.popup('Essentia (fast) is being used to calculate Key tag, along Essentia (full extractor) for other tag(s); in such case it\'s recommended to disable the former and retrieve the key tag with the full extractor instead. Results will be the same.\n\nCalculation time will decrease since Essentia (full extractor) computes all low level data even when retrieving only a single tag, thus skipping an additional step.', 'Tags Automation');
			}
		}
		this.countItems = 0;
		this.currentTime = 0;
		this.selItems = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
		if (typeof this.selItems !== 'undefined' && this.selItems !== null) {
			this.selItems.Sort();
			this.countItems = this.selItems.Count;
			if (this.countItems === 0) {
				console.log('No tracks selected.');
				return;
			}
		} else {return;}
		// Safety check for accidental button pressing
		let answer = WshShell.Popup('Do you want to continue? Some tags will be edited, can not be undone.\n\nTools:\n' + this.description(), 0, window.Name, popup.question + popup.yes_no);
		if (answer === popup.no) {
			this.iStep = null;
			this.selItems = null;
			this.selItemsSubSong = null;
			this.selItemsNoSubSong = null;
			this.bSubSong = null;
			this.subSongNum = null;
			this.countItems = null;
			this.currentTime = null;
		} else {
			// Check if there are ISO/CUE files (which can not be piped to ffmpeg)
			this.bSubSong = this.selItems.Convert().some((handle) => {return handle.SubSong !== 0;});
			if (this.bSubSong) {
				console.popup('Some of the selected tracks have a SubSong index different to zero, which means their container may be an ISO file, CUE, etc.\n\nThese tracks can not be used with the following tools (an will be omitted in such steps):\n' + this.tools.map((tool) => {return this.toolsByKey[tool.key] && this.notAllowedTools.has(tool.key) ? tool.title : null;}).flat(Infinity).filter(Boolean).join(', ') + '\n\nThis limitation may be bypassed converting the tracks into individual files, scanning them and finally copying back the tags. Only required for ChromaPrint (%' + globTags.acoustidFP + '%), Essentia (%' + globTags.key + '%, %LRA%, %DACENESS%, %' + globTags.bpm + '%) and ffmpeg (%LRA%).\nMore info and tips can be found here:\nhttps://github.com/regorxxx/Playlist-Tools-SMP/wiki/Known-problems-or-limitations#fingerprint-chromaprint-or-fooid-and-ebur-128-ffmpeg-tagging--fails-with-some-tracks', 'Tags Automation');
				// Remove old tags
				{	// Update subSong tracks with safe tools
					this.selItemsSubSong = new FbMetadbHandleList(this.selItems.Clone().Convert().filter((handle) => {return handle.SubSong === 0;}));
					let arr = [];
					const cleanTags = Object.fromEntries(this.tools.map((tool) => {return this.toolsByKey[tool.key] && !this.notAllowedTools.has(tool.key) ? tool.tag : null;}).flat(Infinity).filter(Boolean).map((tag) => {return [tag, ''];}));
					if (cleanTags.length) {
						this.subSongNum = this.selItemsSubSong.Count;
						for (let i = 0; i < this.subSongNum; ++i) {arr.push(cleanTags);}
						this.selItemsSubSong.UpdateFileInfoFromJSON(JSON.stringify(arr));
					}
				}
				{	// And then single file tracks with the rest
					this.selItemsNoSubSong = new FbMetadbHandleList(this.selItems.Clone().Convert().filter((handle) => {return handle.SubSong === 0;}));
					let arr = [];
					const cleanTags = Object.fromEntries(this.tools.map((tool) => {return this.toolsByKey[tool.key] ? tool.tag : null;}).flat(Infinity).filter(Boolean).map((tag) => {return [tag, ''];}));
					if (cleanTags.length) {
						const count = this.selItemsNoSubSong.Count;
						for (let i = 0; i < count; ++i) {arr.push(cleanTags);}
						this.selItemsNoSubSong.UpdateFileInfoFromJSON(JSON.stringify(arr));
					}
				}
			} else {
				// Remove old tags
				let arr = [];
				const cleanTags = Object.fromEntries(this.tools.map((tool) => {return this.toolsByKey[tool.key] ? tool.tag : null;})
				.flat(Infinity).filter(Boolean).map((tag) => {return [tag, ''];}));
				if (cleanTags.length) {
					for (let i = 0; i < this.countItems; ++i) {arr.push(cleanTags);}
					this.selItems.UpdateFileInfoFromJSON(JSON.stringify(arr));
				}
			}
			// Process files on steps
			this.iStep = 0;
			this.debouncedStep(this.iStep);
			this.createListener(); // Add a listener associated to the handle list instead of relying on callbacks which fail sometimes...
		}
		return;
	};

	this.stopStepTag = () => {
		this.iStep = null;
		this.selItems = null;
		this.selItemsSubSong = null;
		this.selItemsNoSubSong = null;
		this.bSubSong = null;
		this.subSongNum = null;
		this.countItems = null;
		this.currentTime = null;
		clearInterval(this.listener);
		this.listener = null;
	};

	this.nextStepTag = () => {
		this.debouncedStep(this.iStep);
	};

	this.stepTag = (i) => {
		let bSucess = false;
		this.iStep++;
		switch (i) {
			case 0: // Less than 100 ms / track?
				if (this.toolsByKey.rgScan) {bSucess = fb.RunContextCommandWithMetadb('ReplayGain/Remove ReplayGain information from files', this.selItems, 8);} // Replay gain info is not always removed
				else {bSucess = false;}
				break;
			case 1:  // Takes 260 ms / track
				if (this.toolsByKey.biometric) {bSucess = fb.RunContextCommandWithMetadb('Save fingerprint to file(s)', this.selItems, 8);}
				else {bSucess = false;}
				break;
			case 2: // Less than 170 ms / track?
				if (this.toolsByKey.massTag) {
					if (this.bSubSong) {
						if (this.selItemsNoSubSong.Count) {
							bSucess = fb.RunContextCommandWithMetadb('Tagging/Scripts/MD5', this.selItemsNoSubSong, 8);
						}
					} else {bSucess = fb.RunContextCommandWithMetadb('Tagging/Scripts/MD5', this.selItems, 8);}
				} else {bSucess = false;}
				break;
			case 3: // Warning: This step updates tags for entire albums while processing the list... so times changes according to album length
				if (this.toolsByKey.dynamicRange) {bSucess = fb.RunContextCommandWithMetadb('Dynamic Range Meter', this.selItems, 8);}
				else {bSucess = false;}
				break;
			case 4:
				if (this.toolsByKey.chromaPrint) {
					if (this.bSubSong) {
						if (this.selItemsNoSubSong.Count) {
							bSucess = chromaPrintUtils.calculateFingerprints({fromHandleList: this.selItemsNoSubSong});
						}

					} else {bSucess = chromaPrintUtils.calculateFingerprints({fromHandleList: this.selItems});}
				} else {bSucess = false;}
				break;
			case 5:
				if (this.toolsByKey.ffmpegLRA) {
					if (this.bSubSong) {
						if (this.selItemsNoSubSong.Count) {
							bSucess = ffmpeg.calculateLoudness({fromHandleList: this.selItemsNoSubSong});
						}
					} else {bSucess = ffmpeg.calculateLoudness({fromHandleList: this.selItems});}
					
				} else {bSucess = false;}
				break;
			case 6:
				if (this.toolsByKey.essentiaFastKey) {
					if (this.bSubSong) {
						if (this.selItemsNoSubSong.Count) {
							bSucess = essentia.calculateKey({fromHandleList: this.selItemsNoSubSong});
						}
					} else {bSucess = essentia.calculateKey({fromHandleList: this.selItems});}
					
				} else {bSucess = false;}
				break;
			case 7:
				if (this.toolsByKey.essentiaKey || this.toolsByKey.essentiaBPM || this.toolsByKey.essentiaDanceness || this.toolsByKey.essentiaLRA) {
					const tagName = ['essentiaKey', 'essentiaBPM', 'essentiaDanceness', 'essentiaLRA'].map((key) => {return this.toolsByKey[key] ? this.tagsByKey[key][0] : null;}).filter(Boolean);
					if (this.bSubSong) {
						if (this.selItemsNoSubSong.Count) {
							bSucess = essentia.calculateHighLevelTags({fromHandleList: this.selItemsNoSubSong, tagName});
						}
					} else {bSucess = essentia.calculateHighLevelTags({fromHandleList: this.selItems, tagName});}
					
				} else {bSucess = false;}
				break;
			case 8: // These require user input before saving, so they are read only operations and can be done at the same time
				if (this.toolsByKey.audioMd5 || this.toolsByKey.rgScan) {
					this.currentTime = 0; // ms
					const cacheSelItems = this.selItems;
					const cacheSelItemsNoSubSong = this.selItemsNoSubSong;
					const bSubSong = this.bSubSong;
					if (this.toolsByKey.audioMd5) {
						setTimeout(function(){
							if (bSubSong) {
								if (cacheSelItemsNoSubSong.Count) {
									bSucess = fb.RunContextCommandWithMetadb('Utilities/Create Audio MD5 checksum', cacheSelItemsNoSubSong, 8);
								}
							} else {bSucess = fb.RunContextCommandWithMetadb('Utilities/Create Audio MD5 checksum', cacheSelItems, 8);}
						}, this.currentTime); // Takes 170 ms / track
						this.currentTime += 200 * this.countItems; // But we give them some time to run before firing the next one
					}
					if (this.toolsByKey.rgScan) {
						setTimeout(function(){
							bSucess = fb.RunContextCommandWithMetadb('ReplayGain/Scan as albums (by tags)', cacheSelItems, 8);
						}, this.currentTime); // Takes ~500 ms / track
						this.currentTime += 510 * this.countItems; // But we give them some time to run before firing the next one
					}
				} else {bSucess = false;}
				break;
			default:
				this.stopStepTag();
				return;
		}
		if (!bSucess) {this.stepTag(this.iStep);} // If the step was omitted, then run next step
		return;
	};
	
	this.debouncedStep = debounce(this.stepTag, this.timers.debounce); // Only continues next step when last tag update was done >100ms ago
	
	this.checkHandleList = () => {
		const i = this.iStep - 1;
		const orderKeys = ['rgScan', 'biometric', 'massTag', 'dynamicRange', 'chromaPrint', 'LRA']
		if (i >= 0) {
			const key = orderKeys[i];
			const handleList = this.bSubSong && this.notAllowedTools.has(key) ? this.selItemsNoSubSong : this.selItems;
			if (this.toolsByKey[key] && handleList.Count) {
				const idx = this.tools.findIndex((tool) => {return tool.key === key;});
				const tag = this.tools[idx].tag;
				const itemTags = getTagsValuesV3(handleList, tag, true).flat(Infinity).filter(Boolean);
				if (i === 0 && itemTags.length) {return;} // Only at first step it checks for no tags!
				else if (i !== 0 && itemTags.length / tag.length !== handleList.Count) {return;}
			}
			this.nextStepTag();
			return;
		}
		this.nextStepTag();
	};
	
	this.createListener = () => {
		if (this.listener !== null) {clearInterval(this.listener);}
		this.listener = repeatFn(this.checkHandleList, this.timers.listener)();
		return this.listener;
	};
	
	this.changeTools = (toolsByKey) => {
		this.toolsByKey = toolsByKey;
		this.loadDependencies();
	};
	
	this.loadDependencies = () => {
		if (this.toolsByKey.chromaPrint) {include('..\\fingerprint\\chromaprint-utils-js_fingerprint.js');}
		if (this.toolsByKey.ffmpegLRA) {include('..\\tags\\ffmpeg-utils.js');}
		if (this.toolsByKey.essentiaFastKey) {include('..\\tags\\essentia-utils.js');}
		if (this.toolsByKey.essentiaKey || this.toolsByKey.essentiaBPM || this.toolsByKey.essentiaDanceness || this.toolsByKey.essentiaLRA) {include('..\\tags\\essentia-utils.js');}
	};
	
	this.isRunning = () => {
		return 	this.selItems !== null && this.countItems !== null && this.iStep !== null;
	};
	
	this.init = () => {
		this.loadDependencies();
	};
	
	this.init();
}