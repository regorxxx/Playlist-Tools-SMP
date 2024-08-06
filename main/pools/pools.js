'use strict';
//06/08/24

/* exported _pools */

include('..\\..\\helpers\\helpers_xxx.js');
/* global globTags:readable, globQuery:readable, folders:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _jsonParseFileCheck:readable, utf8:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _p:readable, _q:readable, range:readable, isString:readable, isArrayEqual:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global addLock:readable, removeLock:readable */
include('..\\..\\helpers\\helpers_xxx_playlists_files.js');
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryReplaceWithCurrent:readable, getHandleListTagsV2:readable, checkQuery:readable, sanitizeQueryVal:readable, stripSort:readable, getSortObj:readable */
// Sorting and filter functions
include('..\\sort\\harmonic_mixing.js');
/* global shuffleByTags:readable */
include('..\\sort\\scatter_by_tags.js');
/* global harmonicMixing:readable */
include('..\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicates:readable */
// include('..\\playlist_manager\\playlist_manager_helpers.js'); // bEnablePlsMan
/* global loadPlaylistsFromFolder:readable, getHandlesFromPlaylist:readable */
// include('..\\search_by_distance\\search_by_distance.js'); // bEnableSearchDistance
/* global searchByDistance:readable */

function _pools({
	sortBias = globQuery.remDuplBias,
	checkDuplicatesBy = globQuery.checkDuplicatesBy,
	bAdvTitle = true,
	bMultiple = true,
	bAdvancedShuffle = true,
	smartShuffleSortBias,
	keyTag = globTags.key,
	bEnableSearchDistance = false,
	bEnablePlsMan = false,
	playlistPath = [],
	bDebug = false,
	bProfile = false,
	title = 'Playlist Tools'
} = {}) {
	this.sortBias = sortBias;
	this.checkDuplicatesBy = checkDuplicatesBy;
	this.bAdvTitle = bAdvTitle;
	this.bMultiple = bMultiple;
	this.bAdvancedShuffle = bAdvancedShuffle;
	this.smartShuffleSortBias = smartShuffleSortBias;
	this.keyTag = keyTag;
	this.bEnableSearchDistance = bEnableSearchDistance;
	this.bEnablePlsMan = bEnablePlsMan;
	this.playlistPath = playlistPath;
	this.bDebug = bDebug;
	this.bProfile = bProfile;
	this.title = title;
	let scriptName = '';

	this.validSources = () => [
		'Playlists names',
		'_LIBRARY_',
		'_GROUP_',
		...(this.bEnableSearchDistance ? ['_SEARCHBYGRAPH_', '_SEARCHBYWEIGHT_', '_SEARCHBYDYNGENRE_'] : [])
	];

	this.changeConfig = (config) => {
		for (let key in config) {
			if (Object.hasOwn(this, key)) { this[key] = config[key]; }
		}
		this.updateTitle();
		return this;
	};

	this.updateTitle = () => {
		scriptName = (this.title ? this.title + ' ' : '') + 'Pools';
	};

	this.pickMethods = {
		random: (handleListFrom, num, count) => {
			const numbers = range(0, count - 1, 1).shuffle().slice(0, count > num ? num : count); // n randomly sorted. sort + random, highly biased!!
			const handleListFromClone = handleListFrom.Clone().Convert();
			return new FbMetadbHandleList(numbers.flatMap((i) => { return handleListFromClone.slice(i, i + 1); }));
		},
		start: (handleListFrom, num, count) => { if (count > num) { handleListFrom.RemoveRange(num, count); } return handleListFrom; },
		end: (handleListFrom, num, count) => { if (count > num) { handleListFrom.RemoveRange(0, count - num); } return handleListFrom; },
	};
	this.insertMethods = {
		standard: (handleListFrom, handleListTo) => { handleListTo.InsertRange(handleListTo.Count, handleListFrom); },
		intercalate: (handleListFrom, handleListTo, n) => { // Source 1 Track 1, Source 2  Track 2, Source 3  Track 3, Source 1 Track 2, ...
			if (!handleListTo.Count || !n) { this.insertMethods.standard(handleListFrom, handleListTo); }
			else {
				handleListFrom.Convert().forEach((handle, idx) => {
					const pos = (idx + 1) * (n + 1) - 1;
					handleListTo.Insert(pos, handle);
				});
			}
		},
	};
	this.deDuplicate = ({ handleList, prevListArr, prevListHandle, checkKeys } = {}) => {
		handleList = removeDuplicates({ handleList, checkKeys, sortBias: this.sortBias, bPreserveSort: false, bAdvTitle: this.bAdvTitle, bMultiple: this.bMultiple });
		// Filter against current list
		if (prevListArr || prevListHandle) {
			const prevList = prevListHandle
				? prevListHandle.Clone()
				: prevListArr.reduce((acc, curr) => {
					acc.AddRange(curr);
					return acc;
				}, new FbMetadbHandleList());
			if (prevList.Count > 0) {
				prevList.Sort();
				let currList = prevList.Clone();
				currList.AddRange(handleList);
				currList.Sort();
				currList = removeDuplicates({ handleList: currList, checkKeys, sortBias: this.sortBias, bPreserveSort: false, bAdvTitle: this.bAdvTitle, bMultiple: this.bMultiple });
				currList.Sort();
				handleList = new FbMetadbHandleList(
					handleList.Convert().filter((handle) => {
						return currList.BSearch(handle) !== -1 && prevList.BSearch(handle) === -1;
					})
				);
			}
		}
		return handleList;
	};
	this.sortBiasReplace = ({ handleListFrom, handleListTo, checkKeys } = {}) => {
		let replaceByTF;
		checkKeys.forEach((check, i) => {
			if (i === 0) { replaceByTF = (check.replace('%',) === check) ? '%' + check + '%' : check; }
			else { replaceByTF += (check.replace('%',) === check) ? '|%' + check + '%' : '|' + check; }
		});
		const tfoFrom = new Set(fb.TitleFormat(replaceByTF).EvalWithMetadbs(handleListFrom));
		const tfoTo = new Set(fb.TitleFormat(replaceByTF).EvalWithMetadbs(handleListTo));
		const idxMap = new Map([...tfoFrom].map((tf, i) => [tf, i]));
		const matches = [];
		tfoFrom.intersection(tfoTo).forEach((from) => {
			let j = 0;
			for (let to of tfoTo) {
				if (from === to) { matches.push({ fromIdx: idxMap.get(from), toIdx: j }); break; }
				j++;
			}
		});
		if (matches.length) { // Delete from origin at inverse order
			matches.reverse().forEach((match) => { // NOSONAR
				handleListTo.RemoveById(match.toIdx);
				handleListTo.Insert(match.toIdx, handleListFrom[match.fromIdx]);
				handleListFrom.RemoveById(match.fromIdx);
			});
		}
	};
	this.processPool = async (pool, properties, options = { toPls: true }) => {
		options = { toPls: true, ...(options || {}) };
		const profiler = this.bProfile ? new FbProfiler('processPool') : null;
		let bError = false;
		// Checks
		['query', 'deDuplicate', 'pickMethod', 'limit'].forEach((type) => {
			if (Object.hasOwn(pool, type)) {
				Object.keys(pool[type]).forEach((checkSource) => {
					const found = Object.keys(pool.fromPls).some((source) => source === checkSource);
					if (!found) {
						console.log(scriptName + ': ' + type + ' source not found -> ' + checkSource);
						bError = true;
					}
				});
			}
		});
		if (bError) { fb.ShowPopupMessage('There are some errors processing the pool, check the console log.', scriptName); }
		// Process
		const libItems = Object.keys(pool.fromPls).some((key) => key.startsWith('_LIBRARY_') || key.startsWith('_GROUP_'))
			? fb.GetLibraryItems()
			: null;
		let handleListTo = new FbMetadbHandleList();
		let bAbort = false;
		let n = 0;
		for await (const plsName of Object.keys(pool.fromPls)) {
			if (bAbort) { return; }
			let handleListFrom;
			let sourceCount = 0;
			// Select source
			switch (true) {
				case plsName.startsWith('_LIBRARY_'): { // Library Source
					handleListFrom = libItems;
					console.log(scriptName + ': source -> Library'); // DEBUG
					break;
				}
				case plsName.startsWith('_GROUP_'): { // Library Source grouping by TF
					console.log(scriptName + ': source -> TF Group'); // DEBUG
					// Pre-Filter with query
					handleListFrom = libItems;
					const query = typeof pool.query !== 'undefined' ? pool.query[plsName] : '';
					if (query.length && query.toUpperCase() !== 'ALL') {
						const queryNoSort = stripSort(query);
						const sortedBy = query === queryNoSort
							? null
							: query.replace(queryNoSort, '');
						const sortObj = sortedBy
							? getSortObj(sortedBy)
							: null;
						const processedQuery = queryReplaceWithCurrent(queryNoSort, fb.GetFocusItem(true));
						if (checkQuery(processedQuery, false) && (!sortedBy || sortObj)) {
							console.log(scriptName + ': filter -> ' + processedQuery); // DEBUG
							if (sortedBy) { console.log(scriptName + ': sorted by -> ' + sortedBy); } // DEBUG
							handleListFrom = fb.GetQueryItems(handleListFrom, processedQuery);
							if (sortObj) { handleListFrom.OrderByFormat(sortObj.tf, sortObj.direction); }
						} else { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query + '\n->\n' + processedQuery, scriptName); return; }
					}
					// Retrieve all possible groups
					const group = typeof pool.group !== 'undefined' ? pool.group[plsName] : '';
					const tagSet = [
						...new Set(getHandleListTagsV2(handleListFrom, [group], { splitBy: '|' })
							.flat(Infinity)
							.map((_) => { return sanitizeQueryVal(_.toString().toLowerCase()); })
						)
					].filter(Boolean).shuffle();
					// Retrieve n random groups
					const num = Math.min(pool.fromPls[plsName] || Infinity, tagSet.length) - 1;
					const limit = typeof pool.limit !== 'undefined' ? pool.limit[plsName] : Infinity;
					const handleListsGroups = [];
					for (let i = 0; i <= num; i++) {
						const groupTF = group.indexOf('$') !== -1 ? _q(group) : group;
						const query = groupTF + ' IS ' + tagSet[i];
						if (!checkQuery(query, true)) { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + groupTF + '\n' + query, scriptName); return; }
						handleListsGroups[i] = fb.GetQueryItems(handleListFrom, query);
						// Remove tracks on destination list
						handleListTo.Convert().forEach((handle) => { handleListsGroups[i].Remove(handle); });
						// Filter current group against list of groups and destination list
						if (Object.hasOwn(pool, 'deDuplicate')) {
							const dedup = pool.deDuplicate[plsName];
							if (dedup && dedup.length) {
								handleListsGroups[i] = this.deDuplicate({ handleList: handleListsGroups[i], prevListArr: i > 0 ? handleListsGroups.slice(0, i) : null, checkKeys: dedup });
								handleListsGroups[i] = this.deDuplicate({ handleList: handleListsGroups[i], prevListHandle: handleListTo, checkKeys: dedup });
								// Still required since the sorting bias may introduce multiple versions of same tracks if the new one is preferred
								this.sortBiasReplace({ handleListFrom: handleListsGroups[i], handleListTo, checkKeys: dedup });
							}
						}
						// Remove duplicates within the group (for ex. when retrieving 2 versions of same album)
						if (this.checkDuplicatesBy.length) {
							handleListsGroups[i] = removeDuplicates({ handleList: handleListsGroups[i], checkKeys: this.checkDuplicatesBy, sortBias: this.sortBias, bPreserveSort: false, bAdvTitle: this.bAdvTitle, bMultiple: this.bMultiple });
							handleListsGroups[i] = new FbMetadbHandleList(handleListsGroups[i].Convert().shuffle().slice(0, limit));
						} else {
							handleListsGroups[i] = new FbMetadbHandleList(handleListsGroups[i].Convert().shuffle().slice(0, limit));
						}
					}
					// Join all tracks
					handleListFrom = new FbMetadbHandleList();
					handleListsGroups.forEach((handleList) => { handleListFrom.AddRange(handleList); });
					console.log(scriptName + ': group -> ' + limit + ' track(s) per ' + (group.length ? group : 'entire library')); // DEBUG
					break;
				}
				case plsName.startsWith('_SEARCHBYGRAPH_'): { // Search by GRAPH
					if (this.bEnableSearchDistance && typeof searchByDistance !== 'undefined') {
						// Get arguments
						const recipe = isString(pool.recipe[plsName]) ? _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\recipes\\' + pool.recipe[plsName], 'Recipe json', scriptName, utf8) : pool.recipe[plsName];
						// Check
						if (!recipe) { return; }
						// Get reference (instead of selection)
						const theme = Object.hasOwn(recipe, 'theme') ? '' : pool.theme[plsName];
						const checks = ['graphDistance'];
						let bDone = true;
						checks.forEach((key) => {
							if (!Object.hasOwn(recipe, key)) {
								console.log(scriptName + ': source recipe is missing ' + key + ' (' + folders.xxx + 'main\\search_by_distance.js' + ')'); // DEBUG
								bDone = false;
							}
						});
						if (!bDone) { return; }
						// Force arguments
						recipe.bCreatePlaylist = false;
						recipe.playlistLength = Infinity; // use all possible tracks
						recipe.method = 'GRAPH';
						recipe.bShowFinalSelection = false;
						recipe.bBasicLogging = false;
						// Apply
						const [selectedHandlesArray] = await searchByDistance({ properties, theme, recipe });
						handleListFrom = new FbMetadbHandleList(selectedHandlesArray);
						console.log(scriptName + ': source -> Search by GRAPH'); // DEBUG
					} else {
						console.log(scriptName + ': source requires a script not loaded or disabled (' + folders.xxx + 'main\\search_by_distance.js' + ')'); // DEBUG
						return;
					}
					break;
				}
				case plsName.startsWith('_SEARCHBYWEIGHT_'): { // Search by WEIGHT
					if (this.bEnableSearchDistance && typeof searchByDistance !== 'undefined') {
						// Get arguments
						const recipe = isString(pool.recipe[plsName]) ? _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\recipes\\' + pool.recipe[plsName], 'Recipe json', scriptName, utf8) : pool.recipe[plsName];
						// Check
						if (!recipe) { return; }
						// Get reference (instead of selection)
						const theme = Object.hasOwn(recipe, 'theme') ? '' : pool.theme[plsName];
						let bDone = true;
						if (!bDone) { return; }
						// Force arguments
						recipe.bCreatePlaylist = false;
						recipe.playlistLength = Infinity; // use all possible tracks
						recipe.method = 'WEIGHT';
						recipe.bShowFinalSelection = false;
						recipe.bBasicLogging = false;
						// Apply
						const [selectedHandlesArray] = await searchByDistance({ properties, theme, recipe });
						handleListFrom = new FbMetadbHandleList(selectedHandlesArray);
						console.log(scriptName + ': source -> Search by WEIGHT'); // DEBUG
					} else {
						console.log(scriptName + ': source requires a script not loaded or disabled (' + folders.xxx + 'main\\search_by_distance.js' + ')'); // DEBUG
						return;
					}
					break;
				}
				case plsName.startsWith('_SEARCHBYDYNGENRE_'): { // Search by DYNGENRE
					if (this.bEnableSearchDistance && typeof searchByDistance !== 'undefined') {
						// Get arguments
						const recipe = isString(pool.recipe[plsName]) ? _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\recipes\\' + pool.recipe[plsName], 'Recipe json', scriptName, utf8) : pool.recipe[plsName];
						// Check
						if (!recipe) { return; }
						// Get reference (instead of selection)
						const theme = Object.hasOwn(recipe, 'theme') ? '' : pool.theme[plsName];
						const checks = ['dyngenreWeight'];
						let bDone = true;
						checks.forEach((key) => {
							if (!Object.hasOwn(recipe, key)) {
								console.log(scriptName + ': source recipe is missing ' + key + ' (' + folders.xxx + 'main\\search_by_distance.js' + ')'); // DEBUG
								bDone = false;
							}
						});
						if (!bDone) { return; }
						// Force arguments
						recipe.bCreatePlaylist = false;
						recipe.playlistLength = Infinity; // use all possible tracks
						recipe.method = 'DYNGENRE';
						recipe.bShowFinalSelection = false;
						recipe.bBasicLogging = false;
						// Apply
						const [selectedHandlesArray] = await searchByDistance({ properties, theme, recipe });
						handleListFrom = new FbMetadbHandleList(selectedHandlesArray);
						console.log(scriptName + ': source -> Search by DYNGENRE'); // DEBUG
					} else {
						console.log(scriptName + ': source requires a script not loaded or disabled (' + folders.xxx + 'main\\search_by_distance.js' + ')'); // DEBUG
						return;
					}
					break;
				}
				default: { // Playlist Source
					const idxFrom = plman.FindPlaylist(plsName.replace(/_\d*$/, ''));
					// Try loaded playlist first, then matching pls name (within file) and then by filename
					if (idxFrom === -1) { // Playlist file
						let bDone = false;
						let plsMatch = {};
						if (this.bEnablePlsMan && typeof loadPlaylistsFromFolder !== 'undefined') {
							playlistPath.forEach((path) => { // Find first exact match
								if (bDone) { return; }
								const plsArr = loadPlaylistsFromFolder(path);
								plsArr.forEach((plsObj) => {
									if (bDone) { return; }
									if (plsObj.name === plsName) {
										handleListFrom = getHandlesFromPlaylist({ playlistPath: plsObj.path, relPath: path, bOmitNotFound: true }); // Load found handles, omit the rest instead of nothing
										plsMatch = plsObj;
										bDone = true;
									}
								});
								if (bDone) { return; }
								plsArr.forEach((plsObj) => {
									if (bDone) { return; }
									if (plsObj.path.replace(path, '').startsWith(plsName)) {
										handleListFrom = getHandlesFromPlaylist({ playlistPath: plsObj.path, relPath: path, bOmitNotFound: true }); // Load found handles, omit the rest instead of nothing
										plsMatch = plsObj;
										bDone = true;
									}
								});
							});
						}
						if (!bDone) { console.log(scriptName + ': source -> Not found - ' + plsName); }
						else { console.log(scriptName + ': source -> ' + plsName + ' (' + plsMatch.path + ')'); }
					} else { // Loaded playlist
						console.log(scriptName + ': source -> ' + plsName); // DEBUG
						handleListFrom = plman.GetPlaylistItems(idxFrom);
					}
				}
			}
			if (!handleListFrom || !handleListFrom.Count) { return; }
			// Only apply to non-classic pool
			if (!plsName.startsWith('_GROUP_')) {
				// Filter
				const query = typeof pool.query !== 'undefined' ? pool.query[plsName] : '';
				if (query.length && query.toUpperCase() !== 'ALL') {
					const queryNoSort = stripSort(query);
					const sortedBy = query === queryNoSort
						? null
						: query.replace(queryNoSort, '');
					const sortObj = sortedBy
						? getSortObj(sortedBy)
						: null;
					const processedQuery = queryReplaceWithCurrent(queryNoSort, fb.GetFocusItem(true));
					if (checkQuery(processedQuery, false) && (!sortedBy || sortObj)) {
						console.log(scriptName + ': filter -> ' + processedQuery); // DEBUG
						if (sortedBy) { console.log(scriptName + ': sorted by -> ' + sortedBy); } // DEBUG
						handleListFrom = fb.GetQueryItems(handleListFrom, processedQuery);
						if (sortObj) { handleListFrom.OrderByFormat(sortObj.tf, sortObj.direction); }
					} else { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query + '\n->\n' + processedQuery, scriptName); return; }
				}
				sourceCount = handleListFrom.Count;
				// Remove duplicates
				// Search by distance output should be already de-duplicated
				if (this.checkDuplicatesBy.length && !plsName.startsWith('_SEARCHBY')) {
					handleListFrom = removeDuplicates({ handleList: handleListFrom, checkKeys: this.checkDuplicatesBy, sortBias: this.sortBias, bPreserveSort: true, bAdvTitle: this.bAdvTitle, bMultiple: this.bMultiple });
				}
			}
			// Remove tracks on destination list
			handleListTo.Convert().forEach((handle) => { handleListFrom.Remove(handle); });
			// Filter current tracks against destination list
			if (!plsName.startsWith('_GROUP_') && Object.hasOwn(pool, 'deDuplicate')) {
				const dedup = pool.deDuplicate[plsName];
				if (dedup && dedup.length) {
					handleListFrom = this.deDuplicate({ handleList: handleListFrom, prevListHandle: handleListTo, checkKeys: dedup });
					// Still required since the sorting bias may introduce multiple versions of same tracks if the new one is preferred
					this.sortBiasReplace({ handleListFrom, handleListTo, checkKeys: dedup });
				}
			}
			// Pick
			const num = pool.fromPls[plsName] || Infinity;
			if (!plsName.startsWith('_GROUP_')) {
				const count = handleListFrom.Count;
				if (count !== 1) {
					const pickMethod = (Object.hasOwn(pool, 'pickMethod')
						? pool.pickMethod[plsName]
						: ''
					) || 'random';
					handleListFrom = this.pickMethods[pickMethod](handleListFrom, num, count);
				}
				console.log(scriptName + ': pool size -> ' + handleListFrom.Count + ' tracks (from ' + count + ' deduplicated / ' + sourceCount + ' total)'); // DEBUG
			} else { console.log(scriptName + ': pool size -> ' + handleListFrom.Count + ' tracks from ' + num + ' groups'); }
			// Insert
			if (Object.hasOwn(pool, 'insertMethod')) {
				this.insertMethods[pool.insertMethod](handleListFrom, handleListTo, n);
			} else { this.insertMethods['standard'](handleListFrom, handleListTo); }
			n++;
		}
		if (bAbort) { fb.ShowPopupMessage('Check console. Pools failed with major errors.', scriptName); return; }
		const idxTo = plman.FindOrCreatePlaylist(pool.toPls, true);
		if (addLock(idxTo) || removeLock(idxTo)) { console.log('Output playlist is locked for adding\\removing items: ' + pool.toPls); return; }
		plman.UndoBackup(idxTo);
		plman.ClearPlaylist(idxTo);
		// Harmonic mix
		const bHarmonic = Object.hasOwn(pool, 'harmonicMix') && pool.harmonicMix;
		if (bHarmonic) {
			const handleListMix = harmonicMixing({ selItems: handleListTo, keyTag: this.keyTag, bShuffleInput: true, bSendToPls: false, bDoublePass: true, bDebug: this.bDebug });
			const newCount = handleListMix ? handleListMix.Count : 0;
			const oriCount = handleListTo.Count;
			if (!newCount) { // For ex. without key tags
				handleListMix.RemoveAll();
				handleListMix.AddRange(handleListTo);
			} else if (newCount !== oriCount) {
				const cloneMix = handleListMix.Clone();
				cloneMix.Sort();
				const cloneOri = handleListTo.Clone();
				cloneOri.Sort();
				cloneOri.MakeDifference(cloneMix);
				// Add missing tracks to the end randomly
				cloneOri.Convert().shuffle().forEach((handle) => {
					handleListMix.Add(handle);
				});
			}
			handleListTo.RemoveAll();
			handleListTo.AddRange(handleListMix);
			console.log(scriptName + ': harmonic mix -> ' + newCount + ' ' + _p('+' + (oriCount - newCount)) + ' tracks'); // DEBUG
		}
		// Smart shuffle
		const bShuffle = Object.hasOwn(pool, 'smartShuffle') && pool.smartShuffle.length;
		if (Object.hasOwn(pool, 'smartShuffle') && pool.smartShuffle.length) {
			const shuffle = shuffleByTags({
				tagName: [pool.smartShuffle],
				selItems: handleListTo,
				bSendToActivePls: false,
				bAdvancedShuffle: this.bAdvancedShuffle,
				sortBias: this.smartShuffleSortBias,
				bDebug: this.bDebug
			});
			if (shuffle) {
				handleListTo.RemoveAll();
				handleListTo.AddRange(shuffle.handleList);
				console.log(scriptName + ': smart shuffle -> ' + pool.smartShuffle + ' tag'); // DEBUG
			}
		}
		// Legacy sorting only when not applying special sorting
		if (!bHarmonic && !bShuffle && Object.hasOwn(pool, 'sort')) {
			if (pool.sort.toUpperCase !== '%PLAYLIST_INDEX%') {
				if (pool.sort.length) { handleListTo.OrderByFormat(fb.TitleFormat(pool.sort), 1); }
				else { handleListTo = new FbMetadbHandleList(handleListTo.Convert().shuffle()); }
			}
			console.log(scriptName + ': sorting ' + _p(pool.sort.length ? pool.sort : 'random')); // DEBUG
		}
		if (options.toPls) {
			plman.InsertPlaylistItems(idxTo, 0, handleListTo, true);
			plman.ActivePlaylist = idxTo;
			console.log(scriptName + ': playlist -> ' + pool.toPls + ': ' + handleListTo.Count + ' tracks'); // DEBUG
		}
		if (this.bProfile) { profiler.Print(); }
		return handleListTo;
	};
	this.inputPool = (last = { fromPls: { _LIBRARY_0: 15, _LIBRARY_1: 15, _LIBRARY_2: 15 } }) => {
		// Sources
		const origKeys = Object.hasOwn(last, 'fromPls') ? Object.keys(last.fromPls) : [];
		let fromPls;
		try {
			fromPls = utils.InputBox(
				window.ID,
				'Enter playlist source(s) (pairs):\n(source,# tracks;source,# tracks)\n\nValid sources: Playlist names, ' + this.validSources().map(n => '\'' + n +'\'').slice(1, 3).join(', ') + '.\nSources left empty will be replaced with \'_LIBRARY_#\'.\nSources without an Id (#) will be automatically numbered.',
				(this.title ? this.title + ': ' : '') + 'Pools',
				Object.hasOwn(last, 'fromPls')
					? Object.keys(last.fromPls).reduce((total, key) => { return total + (total.length ? ';' : '') + key + ',' + last.fromPls[key]; }, '')
					: '_LIBRARY_0,15;_LIBRARY_1,15;_LIBRARY_2,15',
				true
			);
		} catch (e) { return; }
		if (!fromPls.length) { console.log('Input was empty'); return; }
		if (fromPls.indexOf(',') === -1) { console.log('Input was not a pair separated by \',\''); return; }
		fromPls = fromPls.split(';');
		const count = new Map();
		fromPls = fromPls.map((pair) => {
			pair = pair.split(',');
			if (!pair[0].length) { pair[0] = '_LIBRARY'; }
			if (pair[0].length) {
				const [, id, idx] = RegExp(/(.*)_(\d+)$/).exec(pair[0]) || [null, pair[0], null];
				const indexes = count.get(id) || new Set();
				if (typeof idx !== 'undefined' && idx !== null) { indexes.add(Number(idx)); }
				count.set(id, indexes);
			}
			pair[1] = Number(pair[1]);
			return pair;
		});
		if (fromPls.some((pair) => { return pair.length % 2 !== 0; })) { console.log('Input was not a list of pairs separated \';\''); return; }
		if (fromPls.some((pair) => { return Number.isNaN(pair[1]); })) { console.log('# tracks was not a number'); return; }
		fromPls = fromPls.map((pair) => {
			if (!RegExp(/_\d+$/).test(pair[0])) {
				const [, id] = RegExp(/(.*)_\d+$/).exec(pair[0]) || [null, pair[0]];
				const indexes = count.get(id);
				for (let i = 0; i < 1000; i++) {
					if (!indexes.has(i)) { pair[0] += (pair[0].endsWith('_') ? '' : '_') + i; indexes.add(i); break; }
				}
			}
			return pair;
		});
		fromPls = Object.fromEntries(fromPls);
		// Queries
		let query;
		try {
			query = utils.InputBox(
				window.ID,
				'Enter queries to filter the sources (pairs):\n(source,query;source,query)\n\nEmpty or ALL are equivalent, but empty applies global forced query too if enabled.',
				(this.title ? this.title + ': ' : '') + 'Pools',
				Object.hasOwn(last, 'query') && isArrayEqual(origKeys, Object.keys(fromPls))
					? Object.keys(last.query).reduce((total, key) => { return total + (total.length ? ';' : '') + key + ',' + last.query[key]; }, '')
					: Object.keys(fromPls).reduce((total, key) => { return total + (total.length ? ';' : '') + key + ',' + 'ALL'; }, ''),
				true
			);
		} catch (e) { return; }
		if (!query.length) { console.log('Input was empty'); return; }
		if (query.indexOf(',') === -1) { console.log('Input was not a pair separated by \',\''); return; }
		query = query.split(';');
		query = query.map((pair) => {
			pair = pair.split(',');
			return pair;
		});
		if (query.some((pair) => { return pair.length % 2 !== 0; })) { console.log('Input was not a list of pairs separated \';\''); return; }
		if (query.some((pair) => { return !Object.hasOwn(fromPls, pair[0]); })) { console.log('Playlist named did not match with sources'); return; }
		if (query.some((pair) => {
			const bCheck = pair[1] === 'ALL' || checkQuery(pair[1], true, true);
			if (!bCheck) { console.log('Query not valid: ' + pair[1]); }
			return !bCheck;
		})) { return; }
		query = Object.fromEntries(query);
		// Picking Method
		let pickMethod;
		const pickMethodsKeys = Object.keys(this.pickMethods);
		try {
			pickMethod = utils.InputBox(
				window.ID,
				'How tracks should be picked? (pairs)\nMethods: ' + pickMethodsKeys.join(', ') + '\n(playlist,method;playlist,method)',
				(this.title ? this.title + ': ' : '') + 'Pools',
				Object.hasOwn(last, 'pickMethod') && isArrayEqual(origKeys, Object.keys(fromPls))
					? Object.keys(last.pickMethod).reduce((total, key) => { return total + (total.length ? ';' : '') + key + ',' + last.pickMethod[key]; }, '')
					: Object.keys(fromPls).reduce((total, key) => { return total + (total.length ? ';' : '') + key + ',' + pickMethodsKeys[0]; }, ''),
				true
			);
		} catch (e) { return; }
		if (!pickMethod.length) { console.log('Input was empty'); return; }
		if (pickMethod.indexOf(',') === -1) { console.log('Input was not a pair separated by \',\''); return; }
		pickMethod = pickMethod.split(';');
		pickMethod = pickMethod.map((pair) => {
			pair = pair.split(',');
			pair[1] = pair[1].toLowerCase();
			return pair;
		});
		if (pickMethod.some((pair) => { return pair.length % 2 !== 0; })) { console.log('Input was not a list of pairs separated \';\''); return; }
		if (pickMethod.some((pair) => { return pickMethodsKeys.indexOf(pair[1]) === -1; })) { console.log('Picking method not recognized'); return; }
		pickMethod = Object.fromEntries(pickMethod);
		// Destination
		let toPls;
		try { toPls = utils.InputBox(window.ID, 'Enter playlist destination:', (this.title ? this.title + ': ' : '') + 'Pools', 'Playlist C', true); }
		catch (e) { return; }
		if (!toPls.length) { console.log('Input was empty'); return; }
		// Sort
		let sort = '';
		try { sort = utils.InputBox(window.ID, 'Enter final sorting:\n(empty to randomize)', (this.title ? this.title + ': ' : '') + 'Pools', '%PLAYLIST_INDEX%', true); }
		catch (e) { return; }
		return { pool: { fromPls, query, toPls, sort, pickMethod } };
	};

	this.updateTitle();
}