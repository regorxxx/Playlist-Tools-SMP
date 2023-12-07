'use strict';
//07/12/23

include('..\\..\\helpers\\helpers_xxx_playlists.js');
include('..\\..\\helpers\\helpers_xxx_playlists_files.js');
// Sorting and filter functions
include('..\\sort\\harmonic_mixing.js');
include('..\\sort\\scatter_by_tags.js');
include('..\\filter_and_query\\remove_duplicates.js');
// include('..\\playlist_manager\\playlist_manager_helpers.js'); // bEnablePlsMan
// include('..\\search_by_distance\\search_by_distance.js'); // bEnableSearchDistance

function _pools({
	sortBias = globQuery.remDuplBias,
	checkDuplicatesBy = globQuery.checkDuplicatesBy,
	bAdvTitle = true,
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
	this.bAdvancedShuffle = bAdvancedShuffle; 
	this.smartShuffleSortBias = smartShuffleSortBias;
	this.keyTag = keyTag;
	this.bEnableSearchDistance = bEnableSearchDistance;
	this.bEnablePlsMan = bEnablePlsMan;
	this.playlistPath = playlistPath;
	this.bDebug = bDebug;
	this.bProfile = bProfile;
	this.title = title;
	
	this.changeConfig = (config) => {
		for (let key in config) {
			if (this.hasOwnProperty(key)) {this[key] = config[key];}
		}
		return this;
	};
	
	this.pickMethods = {
		random: (handleListFrom, num, count) => {
				const numbers = range(0, count - 1, 1).shuffle().slice(0, count > num ? num : count); // n randomly sorted. sort + random, highly biased!!
				const handleListFromClone = handleListFrom.Clone().Convert();
				return new FbMetadbHandleList(numbers.flatMap((i) => {return handleListFromClone.slice(i, i + 1)}));
			},
		start: (handleListFrom, num, count) => {if (count > num) {handleListFrom.RemoveRange(num - 1, count);} return handleListFrom;},
		end: (handleListFrom, num, count) => {if (count > num) {handleListFrom.RemoveRange(0, count - num);} return handleListFrom;},
	};
	this.insertMethods = {
		standard: (handleListFrom, handleListTo) => {handleListTo.InsertRange(handleListTo.Count, handleListFrom);},
		intercalate: (handleListFrom, handleListTo, n) => { // Source 1 Track 1, Source 2  Track 2, Source 3  Track 3, Source 1 Track 2, ...
			if (!handleListTo.Count || !n) {this.insertMethods.standard(handleListFrom, handleListTo);}
			else {
				handleListFrom.Convert().forEach((handle, idx) => {
					const pos = (idx + 1)* (n + 1) - 1;
					handleListTo.Insert(pos, handle);
				});
			}
		},
	};
	this.deDuplicate = ({handleList, prevListArr, prevListHandle, checkKeys} = {}) => {
		handleList = removeDuplicatesV2({handleList, checkKeys, sortBias: this.sortBias, bPreserveSort: false, bAdvTitle: this.bAdvTitle});
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
				currList = removeDuplicatesV2({handleList: currList, checkKeys, sortBias: this.sortBias, bPreserveSort: false, bAdvTitle: this.bAdvTitle});
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
	this.sortBiasReplace = ({handleListFrom, handleListTo, checkKeys} = {}) => {
		let replaceByTF;
		checkKeys.forEach((check, i) => {
			if (i === 0) {replaceByTF = (check.replace('%',) === check) ? '%' + check + '%' : check;}
			else {replaceByTF += (check.replace('%',) === check) ? '|%' + check + '%' :  '|' + check;}
		});
		const tfoFrom = new Set(fb.TitleFormat(replaceByTF).EvalWithMetadbs(handleListFrom));
		const tfoTo = new Set(fb.TitleFormat(replaceByTF).EvalWithMetadbs(handleListTo));
		const idxMap = new Map([...tfoFrom].map((tf, i) => [tf, i]));
		const matches = [];
		tfoFrom.intersection(tfoTo).forEach((from) => {
			let j = 0;
			for (let to of tfoTo) {
				if (from === to) {matches.push({fromIdx: idxMap.get(from), toIdx: j}); break;}
				j++;
			}
		});
		if (matches.length) {
			console.log(matches);
			matches.reverse().forEach((match) => { // Delete from origin at inverse order
				handleListTo.RemoveById(match.toIdx);
				handleListTo.Insert(match.toIdx, handleListFrom[match.fromIdx]);
				handleListFrom.RemoveById(match.fromIdx);
			});
		}
	};
	this.processPool = async (pool, properties) => {
		if (this.bProfile) {var profiler = new FbProfiler('processPool');}
		const libItems = Object.keys(pool.fromPls).some((key) => key.startsWith('_LIBRARY_') || key.startsWith('_GROUP_')) 
			? fb.GetLibraryItems() 
			: null;
		let handleListTo = new FbMetadbHandleList();
		let bAbort = false;
		let n = 0;
		for await (const plsName of Object.keys(pool.fromPls)) {
			if (bAbort) {return;}
			let handleListFrom;
			let sourceCount = 0;
			// Select source
			switch (true) {
				case plsName.startsWith('_LIBRARY_'): { // Library Source
					handleListFrom = libItems;
					console.log((this.title ? this.title + ' ' : '') + 'Pools: source -> Library');
					break;
				}
				case plsName.startsWith('_GROUP_'): { // Library Source grouping by TF
					console.log((this.title ? this.title + ' ' : '') + 'Pools: source -> TF Group');
					// Pre-Filter with query
					handleListFrom = libItems;
					const query = typeof pool.query  !== 'undefined' ? pool.query[plsName] : '';
					if (query.length && query.toUpperCase() !== 'ALL') {
						const processedQuery = queryReplaceWithCurrent(query, fb.GetFocusItem(true));
						if (checkQuery(processedQuery, false)) {
							console.log((this.title ? this.title + ' ' : '') + 'Pools: filter -> ' + processedQuery);
							handleListFrom = fb.GetQueryItems(handleListFrom, processedQuery);
						} else {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query + '\n->\n' + processedQuery, scriptName); bAbort = true; return;}
					}
					// Retrieve all possible groups
					const group = typeof pool.group !== 'undefined' ? pool.group[plsName] : '';
					const tagSet = [...new Set(getTagsValuesV4(handleListFrom, [group], void(0), void(0), '|').flat(Infinity).map((_) => {return sanitizeQueryVal(_.toString().toLowerCase());}))].filter(Boolean).shuffle();
					// Retrieve n random groups
					const num = Math.min(pool.fromPls[plsName] || Infinity, tagSet.length) - 1;
					const limit = typeof pool.limit !== 'undefined' ? pool.limit[plsName] : Infinity;
					const handleListsGroups = [];
					for (let i = 0; i <= num; i++) {
						const groupTF = group.indexOf('$') !== -1 ? _q(group) : group;
						const query = groupTF + ' IS ' + tagSet[i];
						if (!checkQuery(query, true)) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + groupTF + '\n' + query, scriptName); bAbort = true; return;}
						handleListsGroups[i] = fb.GetQueryItems(handleListFrom, query);
						// Remove tracks on destination list
						handleListTo.Convert().forEach((handle) => {handleListsGroups[i].Remove(handle)});
						// Filter current group against list of groups and destination list
						if (pool.hasOwnProperty('deDuplicate')) {
							const dedup = pool.deDuplicate[plsName];
							if (dedup && dedup.length) {
								handleListsGroups[i] = this.deDuplicate({handleList: handleListsGroups[i], prevListArr: i > 0 ? handleListsGroups.slice(0, i) : null, checkKeys: dedup});
								handleListsGroups[i] = this.deDuplicate({handleList: handleListsGroups[i], prevListHandle: handleListTo, checkKeys: dedup});
								// Still required since the sorting bias may introduce multiple versions of same tracks if the new one is preferred
								this.sortBiasReplace({handleListFrom: handleListsGroups[i], handleListTo, checkKeys: dedup});
							}
						}
						// Remove duplicates within the group (for ex. when retrieving 2 versions of same album)
						if (this.checkDuplicatesBy.length) {
							handleListsGroups[i] = removeDuplicatesV2({handleList: handleListsGroups[i], checkKeys: this.checkDuplicatesBy, sortBias: this.sortBias, bPreserveSort: false, bAdvTitle: this.bAdvTitle});
							handleListsGroups[i] = new FbMetadbHandleList(handleListsGroups[i].Convert().shuffle().slice(0, limit));
						} else {
							handleListsGroups[i] = new FbMetadbHandleList(handleListsGroups[i].Convert().shuffle().slice(0, limit));
						}
					}
					// Join all tracks
					handleListFrom = new FbMetadbHandleList();
					handleListsGroups.forEach((handleList) => {handleListFrom.AddRange(handleList);});
					console.log((this.title ? this.title + ' ' : '') + 'Pools: group -> ' + limit + ' track(s) per ' + (group.length ? group : 'entire library'));
					break;
				}
				case plsName.startsWith('_SEARCHBYGRAPH_'): { // Search by GRAPH
					if (this.bEnableSearchDistance && typeof searchByDistance !== 'undefined') {
						// Get arguments
						const recipe = isString(pool.recipe[plsName]) ? _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\recipes\\' + pool.recipe[plsName], 'Recipe json', scriptName, utf8) : pool.recipe[plsName];
						// Check
						if (!recipe) {bAbort = true; return;}
						// Get reference (instead of selection)
						const theme = recipe.hasOwnProperty('theme') ? '' : pool.theme[plsName];
						const checks = ['graphDistance'];
						let bDone = true;
						checks.forEach((key) => {
							if (!recipe.hasOwnProperty(key)) {
								console.log((this.title ? this.title + ' ' : '') + 'Pools: source recipe is missing ' + key + ' (' + folders.xxx + 'main\\search_by_distance.js' + ')');
								bDone = false;
							}
						});
						if (!bDone) {bAbort = true; return;}
						// Force arguments
						recipe.bCreatePlaylist = false; 
						recipe.playlistLength = Infinity; // use all possible tracks
						recipe.method = 'GRAPH';
						recipe.bShowFinalSelection = false;
						recipe.bBasicLogging = false;
						// Apply
						const [selectedHandlesArray, ...rest] = await searchByDistance({properties, theme, recipe});
						handleListFrom = new FbMetadbHandleList(selectedHandlesArray);
						console.log((this.title ? this.title + ' ' : '') + 'Pools: source -> Search by GRAPH');
					} else {
						console.log((this.title ? this.title + ' ' : '') + 'Pools: source requires a script not loaded or disabled (' + folders.xxx + 'main\\search_by_distance.js' + ')');
						bAbort = true;
						return;
					}
					break;
				}
				case plsName.startsWith('_SEARCHBYWEIGHT_'): { // Search by WEIGHT
					if (this.bEnableSearchDistance && typeof searchByDistance !== 'undefined') {
						// Get arguments
						const recipe = isString(pool.recipe[plsName]) ? _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\recipes\\' + pool.recipe[plsName], 'Recipe json', scriptName, utf8) : pool.recipe[plsName];
						// Check
						if (!recipe) {bAbort = true; return;}
						// Get reference (instead of selection)
						const theme = recipe.hasOwnProperty('theme') ? '' : pool.theme[plsName];
						const checks = [];
						let bDone = true;
						checks.forEach((key) => {
							if (!recipe.hasOwnProperty(key)) {
								console.log((this.title ? this.title + ' ' : '') + 'Pools: source recipe is missing ' + key + ' (' + folders.xxx + 'main\\search_by_distance.js' + ')');
								bDone = false;
							}
						});
						if (!bDone) {bAbort = true; return;}
						// Force arguments
						recipe.bCreatePlaylist = false; 
						recipe.playlistLength = Infinity; // use all possible tracks
						recipe.method = 'WEIGHT';
						recipe.bShowFinalSelection = false;
						recipe.bBasicLogging = false;
						// Apply
						const [selectedHandlesArray, ...rest] = await searchByDistance({properties, theme, recipe});
						handleListFrom = new FbMetadbHandleList(selectedHandlesArray);
						console.log((this.title ? this.title + ' ' : '') + 'Pools: source -> Search by WEIGHT');
					} else {
						console.log((this.title ? this.title + ' ' : '') + 'Pools: source requires a script not loaded or disabled (' + folders.xxx + 'main\\search_by_distance.js' + ')');
						bAbort = true;
						return;
					}
					break;
				}
				case plsName.startsWith('_SEARCHBYDYNGENRE_'): { // Search by DYNGENRE
					if (this.bEnableSearchDistance && typeof searchByDistance !== 'undefined') {
						// Get arguments
						const recipe = isString(pool.recipe[plsName]) ? _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\recipes\\' + pool.recipe[plsName], 'Recipe json', scriptName, utf8) : pool.recipe[plsName];
						// Check
						if (!recipe) {bAbort = true; return;}
						// Get reference (instead of selection)
						const theme = recipe.hasOwnProperty('theme') ? '' : pool.theme[plsName];
						const checks = ['dyngenreWeight'];
						let bDone = true;
						checks.forEach((key) => {
							if (!recipe.hasOwnProperty(key)) {
								console.log((this.title ? this.title + ' ' : '') + 'Pools: source recipe is missing ' + key + ' (' + folders.xxx + 'main\\search_by_distance.js' + ')');
								bDone = false;
							}
						});
						if (!bDone) {bAbort = true; return;}
						// Force arguments
						recipe.bCreatePlaylist = false; 
						recipe.playlistLength = Infinity; // use all possible tracks
						recipe.method = 'DYNGENRE';
						recipe.bShowFinalSelection = false;
						recipe.bBasicLogging = false;
						// Apply
						const [selectedHandlesArray, ...rest] = await searchByDistance({properties, theme, recipe});
						handleListFrom = new FbMetadbHandleList(selectedHandlesArray);
						console.log((this.title ? this.title + ' ' : '') + 'Pools: source -> Search by DYNGENRE');
					} else {
						console.log((this.title ? this.title + ' ' : '') + 'Pools: source requires a script not loaded or disabled (' + folders.xxx + 'main\\search_by_distance.js' + ')');
						bAbort = true;
						return;
					}
					break;
				}
				default : { // Playlist Source
					const idxFrom = plman.FindPlaylist(plsName);
					// Try loaded playlist first, then matching pls name (within file) and then by filename
					if (idxFrom === -1) { // Playlist file
						let bDone = false;
						let plsMatch = {};
						if (this.bEnablePlsMan && typeof loadPlaylistsFromFolder !== 'undefined') {
							playlistPath.forEach((path) => { // Find first exact match
								if (bDone) {return;}
								const plsArr = loadPlaylistsFromFolder(path);
								plsArr.forEach((plsObj) => {
									if (bDone) {return;}
									if (plsObj.name === plsName) {
										handleListFrom = getHandlesFromPlaylist(plsObj.path, path, true); // Load found handles, omit the rest instead of nothing
										plsMatch = plsObj;
										bDone = true;
									}
								});
								if (bDone) {return;}
								plsArr.forEach((plsObj) => {
									if (bDone) {return;}
									if (plsObj.path.replace(path,'').startsWith(plsName)) {
										handleListFrom = getHandlesFromPlaylist(plsObj.path, path, true); // Load found handles, omit the rest instead of nothing
										plsMatch = plsObj;
										bDone = true;
									}
								});
							});
						}
						if (!bDone) {console.log((this.title ? this.title + ' ' : '') + 'Pools: source -> Not found - ' + plsName);}
						else {console.log((this.title ? this.title + ' ' : '') + 'Pools: source -> ' + plsName + ' (' + plsMatch.path + ')');}
					} else { // Loaded playlist
						console.log((this.title ? this.title + ' ' : '') + 'Pools: source -> ' + plsName);
						handleListFrom = plman.GetPlaylistItems(idxFrom);
					}
				}
			}
			if (!handleListFrom || !handleListFrom.Count) {return;}
			// Only apply to non-classic pool
			if (!plsName.startsWith('_GROUP_')) {
				// Filter
				const query = typeof pool.query  !== 'undefined' ? pool.query[plsName] : '';
				if (query.length && query.toUpperCase() !== 'ALL') {
					const processedQuery = queryReplaceWithCurrent(query, fb.GetFocusItem(true));
					if (checkQuery(processedQuery, false)) {
						console.log((this.title ? this.title + ' ' : '') + 'Pools: filter -> ' + processedQuery);
						handleListFrom = fb.GetQueryItems(handleListFrom, processedQuery);
					} else {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query + '\n->\n' + processedQuery, scriptName); bAbort = true; return;}
				}
				sourceCount = handleListFrom.Count;
				// Remove duplicates
				// Search by distance output should be already de-duplicated
				if (this.checkDuplicatesBy.length && !plsName.startsWith('_SEARCHBY')) {
					handleListFrom = removeDuplicatesV2({handleList: handleListFrom, checkKeys: this.checkDuplicatesBy, sortBias: this.sortBias, bPreserveSort: true, bAdvTitle: this.bAdvTitle});
				}
			}
			// Remove tracks on destination list
			handleListTo.Convert().forEach((handle) => {handleListFrom.Remove(handle)});
			// Filter current tracks against destination list
			if (!plsName.startsWith('_GROUP_') && pool.hasOwnProperty('deDuplicate')) {
				const dedup = pool.deDuplicate[plsName];
				if (dedup && dedup.length) {
					handleListFrom = this.deDuplicate({handleList: handleListFrom, prevListHandle: handleListTo, checkKeys: dedup});
					// Still required since the sorting bias may introduce multiple versions of same tracks if the new one is preferred
					this.sortBiasReplace({handleListFrom, handleListTo, checkKeys: dedup});
				}
			}
			// Pick
			const num = pool.fromPls[plsName] || Infinity;
			if (!plsName.startsWith('_GROUP_')) {
				const count = handleListFrom.Count;
				if (count !== 1) {
					handleListFrom = this.pickMethods[pool.pickMethod[plsName]](handleListFrom, num, count);
				}
				console.log((this.title ? this.title + ' ' : '') + 'Pools: pool size -> ' + handleListFrom.Count + ' tracks (from ' + count + ' deduplicated / ' + sourceCount + ' total)');
			} else {console.log((this.title ? this.title + ' ' : '') + 'Pools: pool size -> ' + handleListFrom.Count + ' tracks from ' + num + ' groups');}
			// Insert
			if (pool.hasOwnProperty('insertMethod')) {
				this.insertMethods[pool.insertMethod](handleListFrom, handleListTo, n)
			} else {this.insertMethods['standard'](handleListFrom, handleListTo)}
			n++;
		}
		if (bAbort) {fb.ShowPopupMessage('Check console. Pools failed with major errors.', scriptName); return;}
		const idxTo = plman.FindOrCreatePlaylist(pool.toPls, true);
		if (addLock(idxTo) || removeLock(idxTo)) {Console.log('Output playlist is locked for adding\\removing items: ' + pool.toPls); return;}
		plman.UndoBackup(idxTo);
		plman.ClearPlaylist(idxTo);
		// Harmonic mix
		const bHarmonic = pool.hasOwnProperty('harmonicMix') && pool.harmonicMix;
		if (bHarmonic) {
			const handleListMix = harmonicMixing({selItems: handleListTo, keyTag: this.keyTag, bSendToPls: false, bDoublePass: true, bDebug: this.bDebug});
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
			console.log((this.title ? this.title + ' ' : '') + 'Pools: harmonic mix -> ' + newCount + ' ' + _p('+' + (oriCount - newCount)) + ' tracks');
		}
		// Smart shuffle
		const bShuffle = pool.hasOwnProperty('smartShuffle') && pool.smartShuffle.length;
		if (pool.hasOwnProperty('smartShuffle') && pool.smartShuffle.length) {
			const shuffle = shuffleByTags({
				tagName: [pool.smartShuffle], 
				selItems: handleListTo,
				bSendToActivePls: false,
				bAdvancedShuffle: this.bAdvancedShuffle,
				sortBias: this.smartShuffleSortBias,
				bDebug: this.bDebug
			});
			handleListTo.RemoveAll();
			handleListTo.AddRange(shuffle.handleList);
			console.log((this.title ? this.title + ' ' : '') + 'Pools: smart shuffle -> ' + pool.smartShuffle + ' tag');
		}
		plman.InsertPlaylistItems(idxTo, 0, handleListTo, true);
		// Legacy sorting only when not applying special sorting
		if (!bHarmonic && !bShuffle && typeof pool.sort !== 'undefined') {
			plman.SortByFormat(idxTo, pool.sort);
			console.log((this.title ? this.title + ' ' : '') + 'Pools: sorting ' + _p(pool.sort.length ? pool.sort : 'random'));
		}
		plman.ActivePlaylist = idxTo;
		console.log((this.title ? this.title + ' ' : '') + 'Pools: playlist -> ' + pool.toPls + ': ' + handleListTo.Count + ' tracks');
		if (this.bProfile) {profiler.Print();}
	}
	this.inputPool = (last = {fromPls: {_LIBRARY_0: 15, _LIBRARY_1: 15, _LIBRARY_2: 15}}) => {
		// Sources
		const origKeys = last.hasOwnProperty('fromPls') ? Object.keys(last.fromPls) : [];
		let fromPls;
		try {
			fromPls = utils.InputBox(
				window.ID,
				'Enter playlist source(s) (pairs):\nNo playlist name equals to _LIBRARY_#.\n(playlist,# tracks;playlist,# tracks)',
				(this.title ? this.title + ': ' : '') + 'Pools',
				last.hasOwnProperty('fromPls')
					? Object.keys(last.fromPls).reduce((total, key) => {return total + (total.length ? ';' : '') + key + ',' + last.fromPls[key];}, '')
					: '_LIBRARY_0,15;_LIBRARY_1,15;_LIBRARY_2,15',
				true
			);
		} catch (e) {return;}
		if (!fromPls.length) {console.log('Input was empty'); return;}
		if (fromPls.indexOf(',') === -1) {console.log('Input was not a pair separated by \',\''); return;}
		fromPls = fromPls.split(';');
		fromPls = fromPls.map((pair, index) => {
			pair = pair.split(',');
			if (!pair[0].length) {pair[0] = '_LIBRARY_' + index}
			pair[1] = Number(pair[1]);
			return pair;
		});
		if (fromPls.some((pair) => {return pair.length % 2 !== 0})) {console.log('Input was not a list of pairs separated \';\''); return;}
		if (fromPls.some((pair) => {return Number.isNaN(pair[1])})) {console.log('# tracks was not a number'); return;}
		fromPls = Object.fromEntries(fromPls);
		// Queries
		let query;
		try {
			query = utils.InputBox(
				window.ID,
				'Enter queries to filter the sources (pairs):\nEmpty or ALL are equivalent, but empty applies global forced query too if enabled.\n(playlist,query;playlist,query)',
				(this.title ? this.title + ': ' : '') + 'Pools',
				last.hasOwnProperty('query') && isArrayEqual(origKeys, Object.keys(fromPls))
					? Object.keys(last.query).reduce((total, key) => {return total + (total.length ? ';' : '') + key + ',' + last.query[key];}, '')
					: Object.keys(fromPls).reduce((total, key) => {return total + (total.length ? ';' : '') + key + ',' + 'ALL';}, ''),
				true
			);
		} catch (e) {return;}
		if (!query.length) {console.log('Input was empty'); return;}
		if (query.indexOf(',') === -1) {console.log('Input was not a pair separated by \',\''); return;}
		query = query.split(';');
		query = query.map((pair) => {
			pair = pair.split(',');
			return pair;
		});
		if (query.some((pair) => {return pair.length % 2 !== 0})) {console.log('Input was not a list of pairs separated \';\''); return;}
		if (query.some((pair) => {return !fromPls.hasOwnProperty(pair[0])})) {console.log('Playlist named did not match with sources'); return;}
		if (query.some((pair) => {
			const bCheck = pair[1] === 'ALL' || checkQuery(pair[1], true);
			if (!bCheck) {console.log('Query not valid: ' + pair[1])}
			return !bCheck;
		})) {return;}
		query = Object.fromEntries(query);
		// Picking Method
		let pickMethod;
		const pickMethodsKeys = Object.keys(this.pickMethods);
		try {
			pickMethod = utils.InputBox(
				window.ID,
				'How tracks should be picked? (pairs)\nMethods: ' + pickMethodsKeys.join(', ') + '\n(playlist,method;playlist,method)',
				(this.title ? this.title + ': ' : '') + 'Pools',
				last.hasOwnProperty('pickMethod') && isArrayEqual(origKeys, Object.keys(fromPls))
					? Object.keys(last.pickMethod).reduce((total, key) => {return total + (total.length ? ';' : '') + key + ',' + last.pickMethod[key]}, '')
					: Object.keys(fromPls).reduce((total, key) => {return total + (total.length ? ';' : '') + key + ',' + pickMethodsKeys[0]}, ''),
				true
			);
		} catch (e) {return;}
		if (!pickMethod.length) {console.log('Input was empty'); return;}
		if (pickMethod.indexOf(',') === -1) {console.log('Input was not a pair separated by \',\''); return;}
		pickMethod = pickMethod.split(';');
		pickMethod = pickMethod.map((pair) => {
			pair = pair.split(',');
			pair[1] = pair[1].toLowerCase();
			return pair;
		});
		if (pickMethod.some((pair) => {return pair.length % 2 !== 0})) {console.log('Input was not a list of pairs separated \';\''); return;}
		if (pickMethod.some((pair) => {return pickMethodsKeys.indexOf(pair[1]) === -1})) {console.log('Picking method not recognized'); return;}
		pickMethod = Object.fromEntries(pickMethod);
		// Destination
		let toPls;
		try {toPls = utils.InputBox(window.ID, 'Enter playlist destination:', (this.title ? this.title + ': ' : '') + 'Pools', 'Playlist C', true);}
		catch (e) {return;}
		if (!toPls.length) {console.log('Input was empty'); return;}
		// Sort
		let sort = '';
		try {sort = utils.InputBox(window.ID, 'Enter final sorting:\n(empty to randomize)', (this.title ? this.title + ': ' : '') + 'Pools', '%PLAYLIST_INDEX%', true);}
		catch (e) {return;}
		// TODO: Test sorting
		// Object
		return {pool : {fromPls, query, toPls, sort, pickMethod}};
	}
}