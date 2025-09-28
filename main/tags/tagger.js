'use strict';
//28/09/25

/*
	Automatic tagging...
	File processing takes time, specially for some functions (ReplayGain, etc.), so we delay next step execution
	until onMetadbChanged fires for all selected handles.

	Note there is no way to know when some arbitrary plugin finish their processing.
	Some plugins expect user input for final tagging after processing the files (ReplayGain for ex.), so those steps
	are delayed to the end so the user can press OK on those popups without blocking processing.
 */

/* exported Tagger */

/* global chromaPrintUtils:readable, ffmpeg:readable, folksonomyUtils:readable, essentia:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global globTags:readable, folders:readable, soFeat:readable, isFoobarV2:readable, popup:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global WshShell:readable, _isFile:readable, testPath:readable, _isLink:readable, _copyDependencies:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global BiMap:readable, debounce:readable, isArrayStrings:readable , repeatFn:readable, _t:readable, _ps:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global getHandleListTags:readable, isSubsong:readable */

function Tagger({
	toolsByKey = null /* {biometric: true, chromaPrint: true, masstagger: true, audioMd5: true, rgScan: true, tpScan: false, dynamicRange: false, drMeter: true, LRA: true, KEY: true, bpmAnaly: false } */,
	quietByKey = null /* {audioMd5: true, rgScan: true, tpScan: true, bpmAnaly: false } */,
	menuByKey = null /* {biometric: ['Save fingerprint to file(s)'], ... } */,
	menuRemoveByKey = null /* {rgScan: ['ReplayGain/Remove ReplayGain information from files'], ... } */,
	tagsByKey = null /* {rgScan: ['REPLAYGAIN_ALBUM_GAIN', 'REPLAYGAIN_ALBUM_PEAK', 'REPLAYGAIN_TRACK_GAIN', 'REPLAYGAIN_TRACK_PEAK'], ... } */,
	bOutputTools = false,
	bOutputDefTools = false,
	bWineBug = false,
	bFormatPopups = true,
	bToolPopups = true,
	bRunPopup = true
} = {}) {
	this.selItems = null;
	this.selItemsByCheck = {
		dsf: { present: null, missing: null, num: null },
		subSong: { present: null, missing: null, num: null },
		md5: { present: null, missing: null, num: null }
	};
	this.check = {
		dsf: null,
		subSong: null,
		md5: null
	};
	this.checkKeys = Object.keys(this.selItemsByCheck);
	this.countItems = null;
	this.iStep = null;
	this.currentTime = null;
	this.listener = null;
	this.timers = { debounce: 1000, listener: 2000 };
	this.bWineBug = bWineBug;
	this.bFormatPopups = bFormatPopups;
	this.bToolPopups = bToolPopups;
	this.bRunPopup = bRunPopup;
	this.notAllowedTools = new Set();
	this.incompatibleTools = new BiMap({ ffmpegLRA: 'essentiaLRA', essentiaKey: 'essentiaFastKey', drMeter: 'dynamicRange', bpmAnaly: 'essentiaBPM' });
	this.tools = [
		{
			key: 'biometric', tag: [globTags.fooidFP],
			title: 'FooID Fingerprint',
			bAvailable: utils.CheckComponent('foo_biometric', true),
			menu: ['Save fingerprint to file(s)'],
			bDefault: false,
			bQuiet: true
		},
		{
			key: 'chromaPrint', tag: [globTags.acoustidFP],
			title: 'ChromaPrint Fingerprint',
			bAvailable: _isFile(folders.xxx + 'main\\fingerprint\\chromaprint-utils-js_fingerprint.js') && _isFile(folders.xxx + 'helpers-external\\fpcalc\\fpcalc' + (soFeat.x64 ? '' : '_32') + '.exe'),
			bDefault: true,
			bQuiet: false
		},
		{
			key: 'masstagger', tag: [globTags.md5Decoded],
			title: 'MD5 (Masstagger)',
			bAvailable: utils.CheckComponent('foo_masstag', true),
			menu: ['Tagging/Scripts/MD5', 'Tagging/Scripts/AUDIOMD5'],
			bDefault: true,
			bQuiet: true
		},
		{
			key: 'audioMd5', tag: [globTags.md5],
			title: 'MD5 (foo_audiomd5)',
			bAvailable: utils.CheckComponent('foo_audiomd5', true),
			menu: ['Utilities/Create Audio MD5 checksum', 'Utilities/Create Audio MD5 tag', 'Utilities/Create Audio MD5 tag (rescan)'],
			bDefault: false,
			bQuiet: false
		},
		{
			key: 'rgScan', tag: ['REPLAYGAIN_ALBUM_GAIN', 'REPLAYGAIN_ALBUM_PEAK', 'REPLAYGAIN_TRACK_GAIN', 'REPLAYGAIN_TRACK_PEAK'],
			title: 'ReplayGain',
			bAvailable: isFoobarV2 || utils.CheckComponent('foo_rgscan', true),
			menu: ['ReplayGain/Scan as albums (by tags)'],
			menuRemove: ['ReplayGain/Remove ReplayGain information from files'],
			bDefault: true,
			bQuiet: false
		},
		{
			key: 'tpScan', tag: ['REPLAYGAIN_ALBUM_TRUE_PEAK', 'REPLAYGAIN_TRACK_TRUE_PEAK', 'TRUEPEAK_SCANNER_TRACK_GAIN', 'TRUEPEAK_SCANNER_ALBUM_GAIN', 'TRUEPEAK_SCANNER_PEAK_POSITION', 'TRUEPEAK_SCANNER_CLIPPED_SAMPLES', 'TRUEPEAK_SCANNER_CLIPPED_SAMPLES_ALBUM', 'REPLAYGAIN_TRACK_RANGE', 'REPLAYGAIN_ALBUM_RANGE', 'TRUEPEAK_SCANNER_TRACK_MAX_LUFS_M', 'TRUEPEAK_SCANNER_ALBUM_MAX_LUFS_M', 'TRUEPEAK_SCANNER_TRACK_MAX_LUFS_S', 'TRUEPEAK_SCANNER_ALBUM_MAX_LUFS_S', 'TRUEPEAK_SCANNER_TRACK_LUFS_I', 'TRUEPEAK_SCANNER_ALBUM_LUFS_I', 'TRUEPEAK_SCANNER_TRACK_PLR', 'TRUEPEAK_SCANNER_ALBUM_PLR', 'TRUEPEAK_SCANNER_TRACK_RMS', 'TRUEPEAK_SCANNER_TRACK_BPS', 'TRUEPEAK_SCANNER_ALBUM_BPS', 'TRUEPEAK_SCANNER_TRACK_HDCD', 'TRUEPEAK_SCANNER_ALBUM_HDCD'],
			title: 'True Peak Scanner',
			bAvailable: utils.CheckComponent('foo_truepeak', true),
			menu: ['True Peak Scanner/Run TPS as albums'],
			menuRemove: ['True Peak Scanner/Remove TPS information from tracks'],
			bDefault: false,
			bQuiet: false
		},
		{
			key: 'bpmAnaly', tag: [globTags.bpm],
			title: 'BPM (foo_bpm)',
			bAvailable: utils.CheckComponent('foo_bpm', true),
			menu: ['BPM Analyser/Automatically analyse BPMs'],
			bDefault: true,
			bQuiet: false
		},
		{
			key: 'dynamicRange', tag: ['ALBUM DYNAMIC RANGE', 'DYNAMIC RANGE'],
			title: 'DR (foo_dynamic_range)',
			bAvailable: utils.CheckComponent('foo_dynamic_range', true),
			menu: ['Dynamic Range Meter'],
			bDefault: false,
			bQuiet: true
		},
		{
			key: 'drMeter', tag: ['ALBUM DYNAMIC RANGE', 'DYNAMIC RANGE'],
			title: 'DR (foo_dr_meter)',
			bAvailable: utils.CheckComponent('foo_dr_meter', true),
			menu: ['DR Meter/Measure Dynamic Range'],
			bDefault: true,
			bQuiet: false
		},
		{
			key: 'ffmpegLRA', tag: [globTags.lra],
			title: 'EBUR 128 Scanner (ffmpeg)',
			bAvailable: _isFile(folders.xxx + 'helpers-external\\ffmpeg\\ffmpeg' + (soFeat.x64 ? '' : '_32') + '.exe'),
			bDefault: true,
			bQuiet: false
		},
		{
			key: 'folksonomy', tag: [globTags.folksonomy],
			title: 'Folksonomy',
			bAvailable: false,
			bDefault: false,
			bQuiet: false
		},
		{
			key: 'essentiaFastKey', tag: [globTags.key],
			title: 'Key (essentia fast)',
			bAvailable: _isFile(folders.xxx + 'helpers-external\\essentia\\essentia_streaming_key.exe'), bDefault: true,
			bQuiet: false
		},
		{
			key: 'essentiaKey', tag: [globTags.key],
			title: 'Key (essentia)',
			bAvailable: _isFile(folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe'), bDefault: false,
			bQuiet: false
		},
		{
			key: 'essentiaBPM', tag: [globTags.bpm],
			title: 'BPM (essentia)',
			bAvailable: _isFile(folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe'), bDefault: false,
			bQuiet: false
		},
		{
			key: 'essentiaDanceness', tag: [globTags.danceness],
			title: 'Danceness (essentia)',
			bAvailable: _isFile(folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe'), bDefault: false,
			bQuiet: false
		},
		{
			key: 'essentiaLRA', tag: [globTags.lra],
			title: 'EBUR 128 Scanner (essentia)',
			bAvailable: _isFile(folders.xxx + 'helpers-external\\essentia\\streaming_extractor_music.exe'),
			bDefault: false,
			bQuiet: false
		}
	];
	this.availableByKey = Object.fromEntries(this.tools.map((tool) => { return [tool.key, tool.bAvailable]; }));
	this.toolsByKey = Object.fromEntries(this.tools.map((tool) => [tool.key, tool.bAvailable && tool.bDefault]));
	this.tagsByKey = Object.fromEntries(this.tools.map((tool) => [tool.key, tool.tag]));
	this.titlesByKey = Object.fromEntries(this.tools.map((tool) => [tool.key, tool.title]));
	this.quietByKey = Object.fromEntries(this.tools.map((tool) => [tool.key, tool.bQuiet]));
	this.menuByKey = Object.fromEntries(this.tools.map((tool) => [tool.key, tool.menu]));
	this.menuRemoveByKey = Object.fromEntries(this.tools.map((tool) => [tool.key, tool.menuRemove]));
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
	[{ key: 'quietByKey', var: quietByKey }, { key: 'menuByKey', var: menuByKey }, { key: 'menuRemoveByKey', var: menuRemoveByKey }, { key: 'tagsByKey', var: tagsByKey }].forEach((entry) => {
		if (entry.var) {
			Object.keys(entry.var).forEach((key) => {
				if (Object.hasOwn(this[entry.key], key)) { this[entry.key][key] = entry.var[key]; }
				else { console.log('TagAutomation: tool key not recognized ' + key); }
			});
		}
	});
	// Force settings for specific tools
	this.quietByKey.biometric = true;
	this.quietByKey.masstagger = true;

	this.description = () => {
		return this.tools.reduce((text, tool) => { return (this.toolsByKey[tool.key] ? (text.length ? text + ', ' + tool.title : tool.title) : text); }, ''); // Initial value is '';
	};

	this.setNotAllowedTools = (type) => {
		switch (type) {
			case 'subSong':
				this.notAllowedTools = new Set(['audioMd5', 'chromaPrint', 'ffmpegLRA', 'masstagger', 'essentiaFastKey', 'essentiaKey', 'essentiaBPM', 'essentiaDanceness', 'essentiaLRA']);
				break;
			case 'md5':
				this.notAllowedTools = new Set(['masstagger']);
				break;
			case 'dsf':
				this.notAllowedTools = new Set(['essentiaFastKey', 'essentiaKey', 'essentiaBPM', 'essentiaDanceness', 'essentiaLRA']);
				break;
			default:
				this.notAllowedTools = new Set();
				break;
		}
	};

	this.checkIncompatibleTools = (bForce) => {
		let bPass = true;
		if (this.toolsByKey.masstagger && this.toolsByKey.audioMd5) {
			const tag = new Set(this.tagsByKey.audioMd5).intersection(new Set(this.tagsByKey.masstagger));
			if (tag.size > 0) {
				this.toolsByKey.masstagger = false;
				if (this.bToolPopups || bForce) {
					console.popup('Masstagger is being used along foo_audiomd5 with the same tag assigned to both tools (' + [...tag] + ').\n\nThis setting is not allowed and masstagger has been disabled.', 'Tags Automation');
				}
				bPass = false;
			}
		}
		return bPass;
	};

	this.run = ({ bDebug = false, bProfile = false } = {}) => {
		// Usage tips
		if (this.bToolPopups && (this.toolsByKey.essentiaKey || this.toolsByKey.essentiaBPM || this.toolsByKey.essentiaDanceness || this.toolsByKey.essentiaLRA)) {
			if (this.toolsByKey.ffmpegLRA) {
				console.popup('ffmpeg is being used to calculate LRA tag, along Essentia (full extractor) for other tag(s); in such case it\'s recommended to disable ffmpeg and retrieve the LRA tag with Essentia too.\n\nCalculation time will decrease since Essentia computes all low level data even when retrieving only a single tag, thus skipping an additional step with ffmpeg.', 'Tags Automation');
			}
			if (this.toolsByKey.essentiaFastKey) {
				console.popup('Essentia (fast) is being used to calculate Key tag, along Essentia (full extractor) for other tag(s); in such case it\'s recommended to disable the former and retrieve the key tag with the full extractor instead. Results will be the same.\n\nCalculation time will decrease since Essentia (full extractor) computes all low level data even when retrieving only a single tag, thus skipping an additional step.', 'Tags Automation');
			}
			if (this.toolsByKey.bpmAnaly) {
				console.popup('BPM (foo_bpm) is being used to calculate BPM tag, along Essentia (full extractor) for other tag(s); in such case it\'s recommended to disable the former and retrieve the BPM tag with the full extractor instead.\n\nCalculation time will decrease since Essentia (full extractor) computes all low level data even when retrieving only a single tag, thus skipping an additional step.', 'Tags Automation');
			}
		}
		if (this.bToolPopups && this.toolsByKey.rgScan && this.toolsByKey.tpScan) {
			console.popup('True Peak Scanner is being used along ReplayGain. Note some custom settings may duplicate file scanning or tagging unnecessarily, so it may be desirable to only use one of them. Check their original documentation for more usage info.', 'Tags Automation');
		}
		this.checkIncompatibleTools();
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
				console.popup('Skipped ' + skippedCount + ' dead or link items.', window.Name + _ps(window.ScriptInfo.Name));
			}
		} else { return; }
		// Safety check for accidental button pressing
		const answer = this.bRunPopup
			? WshShell.Popup('Do you want to continue? Some tags will be edited, can not be undone.\n\nTools:\n' + this.description(), 0, window.Name + _ps(window.ScriptInfo.Name), popup.question + popup.yes_no)
			: popup.yes;
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
			// Check if there dsf files
			const exts = this.selItems.Convert().map((handle) => handle.Path.split('.').slice(-1)[0]);
			this.check.dsf = exts.some((ext) => ext === 'dsf');
			// Check if there are ISO/CUE/container files (which can not be piped to ffmpeg)
			this.check.subSong = this.selItems.Convert().some((handle, i) => isSubsong(handle, exts[i]));
			// Check if there are MP3 files (which have no MD5 tag)
			const md5TF = fb.TitleFormat('[%__MD5%]');
			this.check.md5 = this.selItems.Convert().some((handle) => !md5TF.EvalWithMetadb(handle).length);
			const createCheck = (key) => {
				this.setNotAllowedTools(key);
				const notAllowedTools = this.tools
					.map((tool) => this.toolsByKey[tool.key] && this.notAllowedTools.has(tool.key)
						? tool.title
						: null
					).flat(Infinity).filter(Boolean);
				this.check[key] = this.check[key] && notAllowedTools.length;
				return notAllowedTools;
			};
			// Remove old tags
			const getCleanTags = (bCheck) => {
				return bCheck
					? Object.fromEntries(
						this.tools.map((tool) => this.toolsByKey[tool.key] && !this.notAllowedTools.has(tool.key) ? tool.tag : null)
							.flat(Infinity).filter(Boolean)
							.map((tag) => [tag, ''])
					)
					: Object.fromEntries(
						this.tools.map((tool) => this.toolsByKey[tool.key] ? tool.tag : null)
							.flat(Infinity).filter(Boolean)
							.map((tag) => { return [tag, '']; })
					);
			};
			if (this.checkKeys.some((checkKey) => this.check[checkKey])) {
				const handleArr = this.selItems.Clone().Convert();
				if (this.check.subSong) {
					const notAllowedTools = createCheck('subSong');
					if (this.check.subSong) {
						this.bFormatPopups && console.popup('Some of the selected tracks have a SubSong index different to zero, which means their container may be an ISO file, CUE, etc.\n\nThese tracks can not be used with the following tools (and will be omitted in such steps):\n' + notAllowedTools.join(', ') + '\n\nThis limitation may be bypassed converting the tracks into individual files, scanning them and finally copying back the tags. Only required for ChromaPrint (%' + globTags.acoustidFP + '%), Essentia (' + _t(globTags.key) + ', ' + _t(globTags.lra) + ', %DANCENESS%, ' + _t(globTags.bpm) + ') and ffmpeg (' + _t(globTags.lra) + ').\nMore info and tips can be found here:\nhttps://github.com/regorxxx/Playlist-Tools-SMP/wiki/Known-problems-or-limitations#fingerprint-chromaprint-or-fooid-and-ebur-128-ffmpeg-tagging--fails-with-some-tracks', 'Tags Automation');
						// Remove old tags
						{	// Update problematic tracks with safe tools
							this.selItemsByCheck.subSong.present = new FbMetadbHandleList(handleArr.filter((handle) => isSubsong(handle)));
							this.selItemsByCheck.subSong.present.Sort();
							let arr = [];
							const cleanTags = getCleanTags(true);
							if (Object.keys(cleanTags).length) {
								this.selItemsByCheck.subSong.num = this.selItemsByCheck.subSong.present.Count;
								for (let i = 0; i < this.selItemsByCheck.subSong.num; ++i) { arr.push(cleanTags); }
								this.selItemsByCheck.subSong.present.UpdateFileInfoFromJSON(JSON.stringify(arr));
							}
						}
						{	// And then other tracks with the rest
							this.selItemsByCheck.subSong.missing = new FbMetadbHandleList(handleArr.filter((handle) => !isSubsong(handle)));
							this.selItemsByCheck.subSong.missing.Sort();
							let arr = [];
							const cleanTags = getCleanTags(false);
							if (Object.keys(cleanTags).length) {
								const count = this.selItemsByCheck.subSong.missing.Count;
								for (let i = 0; i < count; ++i) { arr.push(cleanTags); }
								this.selItemsByCheck.subSong.missing.UpdateFileInfoFromJSON(JSON.stringify(arr));
							}
						}
					}
				}
				if (this.check.md5) {
					const notAllowedTools = createCheck('md5');
					if (this.check.md5) {
						this.bFormatPopups && console.popup('Some of the selected tracks are encoded in a format with no MD5 support.\n\nThese tracks can not be used with the following tools (and will be omitted in such steps):\n' + notAllowedTools.join(', '), 'Tags Automation');
						// Remove old tags
						{	// Update problematic tracks with safe tools
							this.selItemsByCheck.md5.present = new FbMetadbHandleList(handleArr.filter((handle) => !md5TF.EvalWithMetadb(handle).length));
							this.selItemsByCheck.md5.present.Sort();
							if (this.check.subSong && this.selItemsByCheck.subSong.num) {
								this.selItemsByCheck.md5.present.MakeIntersection(this.selItemsByCheck.subSong.present);
							}
							let arr = [];
							const cleanTags = getCleanTags(true);
							if (Object.keys(cleanTags).length) {
								this.selItemsByCheck.md5.num = this.selItemsByCheck.md5.present.Count;
								for (let i = 0; i < this.selItemsByCheck.md5.num; ++i) { arr.push(cleanTags); }
								this.selItemsByCheck.md5.present.UpdateFileInfoFromJSON(JSON.stringify(arr));
							}
						}
						{	// And then other tracks with the rest
							this.selItemsByCheck.md5.missing = new FbMetadbHandleList(handleArr.filter((handle) => md5TF.EvalWithMetadb(handle).length));
							this.selItemsByCheck.md5.missing.Sort();
							if (this.check.subSong && this.selItemsByCheck.subSong.missing && this.selItemsByCheck.subSong.missing.Count) {
								this.selItemsByCheck.md5.missing.MakeIntersection(this.selItemsByCheck.subSong.missing);
							}
							let arr = [];
							const cleanTags = getCleanTags(false);
							if (Object.keys(cleanTags).length) {
								const count = this.selItemsByCheck.md5.missing.Count;
								for (let i = 0; i < count; ++i) { arr.push(cleanTags); }
								this.selItemsByCheck.md5.missing.UpdateFileInfoFromJSON(JSON.stringify(arr));
							}
						}
					}
				}
				if (this.check.dsf) {
					const notAllowedTools = createCheck('dsf');
					if (this.check.dsf) {
						this.bFormatPopups && console.popup('Some of the selected tracks are encoded DSF format.\n\nThese tracks can not be used with the following tools (and will be omitted in such steps):\n' + notAllowedTools.join(', '), 'Tags Automation');
						// Remove old tags
						{	// Update problematic tracks with safe tools
							this.selItemsByCheck.dsf.present = new FbMetadbHandleList(handleArr.filter((_, i) => exts[i] === 'dsf'));
							this.selItemsByCheck.dsf.present.Sort();
							let arr = [];
							const cleanTags = getCleanTags(true);
							if (Object.keys(cleanTags).length) {
								this.selItemsByCheck.dsf.num = this.selItemsByCheck.dsf.present.Count;
								for (let i = 0; i < this.selItemsByCheck.dsf.num; ++i) { arr.push(cleanTags); }
								this.selItemsByCheck.dsf.present.UpdateFileInfoFromJSON(JSON.stringify(arr));
							}
						}
						{	// And then other tracks with the rest
							this.selItemsByCheck.dsf.missing = new FbMetadbHandleList(handleArr.filter((_, i) => exts[i] !== 'dsf'));
							this.selItemsByCheck.dsf.missing.Sort();
							let arr = [];
							const cleanTags = getCleanTags(false);
							if (Object.keys(cleanTags).length) {
								const count = this.selItemsByCheck.dsf.missing.Count;
								for (let i = 0; i < count; ++i) { arr.push(cleanTags); }
								this.selItemsByCheck.dsf.missing.UpdateFileInfoFromJSON(JSON.stringify(arr));
							}
						}
					}
				}
			}
			// The value of the checks may have changed at previous step
			if (!this.checkKeys.some((checkKey) => this.check[checkKey])) {
				let arr = [];
				const cleanTags = Object.fromEntries(
					this.tools.map((tool) => this.toolsByKey[tool.key] ? tool.tag : null)
						.flat(Infinity)
						.filter(Boolean)
						.map((tag) => [tag, ''])
				);
				if (Object.keys(cleanTags).length) {
					for (let i = 0; i < this.countItems; ++i) { arr.push(cleanTags); }
					this.selItems.UpdateFileInfoFromJSON(JSON.stringify(arr));
				}
			}
			// Process files on steps
			this.iStep = 0;
			this.nextStepTag({ bDebug, bProfile });
			this.createListener({ bDebug, bProfile }); // Add a listener associated to the handle list instead of relying on callbacks which fail sometimes...
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

	this.nextStepTag = ({ bDebug = false, bProfile = false } = {}) => {
		this.debouncedStep({ step: this.iStep, bDebug, bProfile });
	};

	const orderKeys = ['rgScan', 'tpScan', 'biometric', 'masstagger', 'dynamicRange', 'drMeter', 'chromaPrint', 'ffmpegLRA', 'folksonomy', 'essentiaFastKey', ['essentiaKey', 'essentiaBPM', 'essentiaDanceness', 'essentiaLRA']]; // Must follow order at this.stepTag()
	if (orderKeys.flat(Infinity).some((k) => !Object.hasOwn(this.toolsByKey, k))) { throw new Error('Key not associated to any tool'); }
	this.stepTag = ({ step, bDebug = false, bProfile = false }) => {
		const runMenu = (menuArr, handleList, title) => {
			bSuccess = menuArr.some((name) => fb.RunContextCommandWithMetadb(name, handleList, 8));
			if (!bSuccess) { fb.ShowPopupMessage('Contextual menu entries not found:\n\n  - ' + menuArr.join('\n  - ') + '\n\nCheck they match the contextual menus associated to the component and don\'t have any typo. Otherwise report to the component\'s dev.', title); }
			return bSuccess;
		};
		let bSuccess = false;
		this.iStep++;
		switch (step) {
			case 0: // Less than 100 ms / track?
				bSuccess = this.toolsByKey.rgScan
					? runMenu(this.menuRemoveByKey.rgScan, this.selItems, this.titlesByKey.rgScan)
					: false;
				break;
			case 1: // Less than 100 ms / track?
				// True Peak info may use custom tags this way...
				bSuccess = this.toolsByKey.tpScan
					? runMenu(this.menuRemoveByKey.tpScan, this.selItems, this.titlesByKey.tpScan)
					: false;
				break;
			case 2:  // Takes 260 ms / track
				bSuccess = this.toolsByKey.biometric && this.quietByKey.biometric
					? runMenu(this.menuByKey.biometric, this.selItems, this.titlesByKey.biometric)
					: false;
				break;
			case 3: // Less than 170 ms / track?
				if (this.toolsByKey.masstagger) {
					if (this.check.subSong || this.check.md5) {
						if (this.check.subSong && this.selItemsByCheck.subSong.missing.Count) { bSuccess = runMenu(this.menuByKey.masstagger, this.selItemsByCheck.subSong.missing, this.titlesByKey.masstagger); }
						if (this.check.md5 && this.selItemsByCheck.md5.missing.Count) { bSuccess = runMenu(this.menuByKey.masstagger, this.selItemsByCheck.md5.missing, this.titlesByKey.masstagger); }
					} else { bSuccess = runMenu(this.menuByKey.masstagger, this.selItems, this.titlesByKey.masstagger); }
				} else { bSuccess = false; }
				break;
			case 4: // Warning: This step updates tags for entire albums while processing the list... so times changes according to album length
				bSuccess = this.toolsByKey.dynamicRange && this.quietByKey.dynamicRange
					? runMenu(this.menuByKey.dynamicRange, this.selItems, this.titlesByKey.dynamicRange)
					: false;
				break;
			case 5: // Warning: This step updates tags for entire albums while processing the list... so times changes according to album length
				bSuccess = this.toolsByKey.drMeter && this.quietByKey.drMeter
					? runMenu(this.menuByKey.drMeter, this.selItems, this.titlesByKey.drMeter)
					: false;
				break;
			case 6:
				if (this.toolsByKey.chromaPrint) {
					if (this.check.subSong) {
						if (this.selItemsByCheck.subSong.missing.Count) {
							bSuccess = chromaPrintUtils.calculateFingerprints({ fromHandleList: this.selItemsByCheck.subSong.missing, bQuiet: this.quietByKey.chromaPrint, bDebug, bProfile });
						}
					} else { bSuccess = chromaPrintUtils.calculateFingerprints({ fromHandleList: this.selItems, bQuiet: this.quietByKey.chromaPrint, bDebug, bProfile }); }
				} else { bSuccess = false; }
				break;
			case 7:
				if (this.toolsByKey.ffmpegLRA) {
					if (this.check.subSong) {
						if (this.selItemsByCheck.subSong.missing.Count) {
							bSuccess = ffmpeg.calculateLoudness({ fromHandleList: this.selItemsByCheck.subSong.missing, bWineBug: this.bWineBug, bQuiet: this.quietByKey.ffmpegLRA, bDebug, bProfile });
						}
					} else { bSuccess = ffmpeg.calculateLoudness({ fromHandleList: this.selItems, bWineBug: this.bWineBug, bQuiet: this.quietByKey.ffmpegLRA, bDebug, bProfile }); }
				} else { bSuccess = false; }
				break;
			case 8:
				if (this.toolsByKey.folksonomy) {
					if (this.check.subSong) {
						if (this.selItemsByCheck.subSong.missing.Count) {
							bSuccess = folksonomyUtils.calculateFolksonomy({ fromHandleList: this.selItemsByCheck.subSong.missing, bQuiet: this.quietByKey.folksonomy, bDebug, bProfile });
						}
					} else { bSuccess = folksonomyUtils.calculateFolksonomy({ fromHandleList: this.selItems, bQuiet: this.quietByKey.folksonomy, bDebug, bProfile }); }
				} else { bSuccess = false; }
				break;
			case 9:
				if (this.toolsByKey.essentiaFastKey) {
					if (this.check.subSong) {
						if (this.selItemsByCheck.subSong.missing.Count) {
							bSuccess = essentia.calculateKey({ fromHandleList: this.selItemsByCheck.subSong.missing, bQuiet: this.quietByKey.essentiaFastKey, bDebug, bProfile });
						}
					} else { bSuccess = essentia.calculateKey({ fromHandleList: this.selItems, bQuiet: this.quietByKey.essentiaFastKey, bDebug, bProfile }); }
				} else { bSuccess = false; }
				break;
			case 10:
				if (this.toolsByKey.essentiaKey || this.toolsByKey.essentiaBPM || this.toolsByKey.essentiaDanceness || this.toolsByKey.essentiaLRA) {
					const tagName = [{ name: 'KEY', tf: 'essentiaKey' }, { name: 'BPM', tf: 'essentiaBPM' }, { name: 'DANCENESS', tf: 'essentiaDanceness' }, { name: 'LRA', tf: 'essentiaLRA' }];
					const bQuiet = ['essentiaKey', 'essentiaBPM', 'essentiaDanceness', 'essentiaLRA'].some((key) => this.quietByKey[key]);
					tagName.forEach((tag) => tag.tf = this.toolsByKey[tag.tf] ? this.tagsByKey[tag.tf][0] : '');
					if (this.check.subSong) {
						if (this.selItemsByCheck.subSong.missing.Count) {
							bSuccess = essentia.calculateHighLevelTags({ fromHandleList: this.selItemsByCheck.subSong.missing, tagName, bQuiet, bDebug, bProfile });
						}
					} else { bSuccess = essentia.calculateHighLevelTags({ fromHandleList: this.selItems, tagName, bQuiet, bDebug, bProfile }); }
				} else { bSuccess = false; }
				break;
			case 11:
				if (this.toolsByKey.audioMd5 && this.quietByKey.audioMd5) {
					const bSubSong = this.check.subSong;
					bSuccess = bSubSong
						? this.selItemsByCheck.subSong.missing.Count
							? runMenu(this.menuByKey.audioMd5, this.selItemsByCheck.subSong.missing, this.titlesByKey.audioMd5)
							: false
						: runMenu(this.menuByKey.audioMd5, this.selItems, this.titlesByKey.audioMd5);
				} else { bSuccess = false; }
				break;
			case 12:
				bSuccess = this.toolsByKey.rgScan && this.quietByKey.rgScan
					? runMenu(this.menuByKey.rgScan, this.selItems, this.titlesByKey.rgScan)
					: false;
				break;
			case 13:
				bSuccess = this.toolsByKey.tpScan && this.quietByKey.tpScan
					? runMenu(this.menuByKey.tpScan, this.selItems, this.titlesByKey.tpScan)
					: false;
				break;
			case 14:
				bSuccess = this.toolsByKey.bpmAnaly && this.quietByKey.bpmAnaly
					? runMenu(this.menuByKey.bpmAnaly, this.selItems, this.titlesByKey.bpmAnaly)
					: false;
				break;
			case 15: // These require user input before saving, so they are read only operations and can be done at the same time
				if (this.toolsByKey.audioMd5 && !this.quietByKey.audioMd5 || this.toolsByKey.drMeter && !this.quietByKey.drMeter || this.toolsByKey.rgScan && !this.quietByKey.rgScan || this.toolsByKey.tpScan && !this.quietByKey.tpScan || this.toolsByKey.bpmAnaly && !this.quietByKey.bpmAnaly) {
					this.currentTime = 0; // ms
					[
						{ key: 'drMeter', coeff: 550, bSubSong: false },
						{ key: 'audioMd5', coeff: 200, bSubSong: this.check.subSong },
						{ key: 'rgScan', coeff: 550, bSubSong: false },
						{ key: 'tpScan', coeff: 550, bSubSong: false },
						{ key: 'bpmAnaly', coeff: 15000, bSubSong: false }
					].forEach((opt, i) => {
						if (this.toolsByKey[opt.key] && !this.quietByKey[opt.key]) {
							const handleList = opt.bSubSong ? this.selItemsByCheck.subSong.missing : this.selItems;
							bSuccess = i === 0
								? runMenu(this.menuByKey[opt.key], handleList, this.titlesByKey[opt.key])
								: setTimeout(runMenu, this.currentTime, this.menuByKey[opt.key], handleList, this.titlesByKey[opt.key]);
							this.currentTime += opt.coeff * this.countItems; // Give some time to run before firing the next one
						}
					});
				} else { bSuccess = false; }
				break;
			default:
				this.stopStepTag();
				return;
		}
		if (!bSuccess) { this.stepTag({ step: this.iStep, bDebug, bProfile }); } // If the step was omitted, then run next step
	};

	this.debouncedStep = debounce(this.stepTag, this.timers.debounce); // Only continues next step when last tag update was done > X ms ago

	this.checkHandleList = ({ bDebug = false, bProfile = false } = {}) => {
		if (!this.isRunning) { this.stopStepTag(); return; }
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
			this.nextStepTag({ bDebug, bProfile });
			return;
		}
		this.nextStepTag({ bDebug, bProfile });
	};

	this.createListener = ({ bDebug = false, bProfile = false } = {}) => {
		if (this.listener !== null) { clearInterval(this.listener); }
		this.listener = repeatFn(this.checkHandleList, this.timers.listener)({ bDebug, bProfile });
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
		this.checkIncompatibleTools(true);
	};

	this.init();
}