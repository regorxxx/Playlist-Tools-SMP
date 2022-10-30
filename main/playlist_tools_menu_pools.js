'use strict';
//30/10/22

// Pools
{
	const name = 'Pools';
	if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
		include(folders.xxx + 'helpers\\helpers_xxx_playlists.js');
		include(folders.xxx + 'helpers\\helpers_xxx_playlists_files.js');
		const plsManHelper = folders.xxx + 'helpers\\playlist_manager_helpers.js';
		let isPlsMan = false;
		if (_isFile(plsManHelper)) {
			include(plsManHelper);
			isPlsMan = true;
		}
		readmes[newReadmeSep()] = 'sep';
		readmes[name] = folders.xxx + 'helpers\\readme\\playlist_tools_menu_pools.txt';
		readmes[name + ' (allowed keys)'] = folders.xxx + '\\presets\\Playlist Tools\\pools\\allowedKeys.txt';
		forcedQueryMenusEnabled[name] = true;
		let menuName = menu.newMenu(name);
		{	// Automate tags
			const staticPools = [
			];
			const plLen = defaultArgs.playlistLength;
			const plLenHalf = Math.floor(plLen / 2) + Math.ceil(plLen % 4 / 2);
			const plLenQuart = Math.floor(plLen / 4);
			let pools = [
				{name: 'Top tracks mix', pool: {
					fromPls: {_LIBRARY_0: plLenQuart, _LIBRARY_1: plLenQuart, _LIBRARY_2: plLenHalf}, 
					query: {_LIBRARY_0: globTags.rating + ' EQUAL 3', _LIBRARY_1: globTags.rating + ' EQUAL 4', _LIBRARY_2: globTags.rating + ' EQUAL 5'}, 
					pickMethod: {_LIBRARY_0: 'random', _LIBRARY_1: 'random', _LIBRARY_2: 'random'},
					toPls: 'Top tracks mix',
					sort: '',
				}},
				{name: 'Top tracks mix (harmonic)', pool: {
					fromPls: {_LIBRARY_0: plLenQuart, _LIBRARY_1: plLenQuart, _LIBRARY_2: plLenHalf}, 
					query: {_LIBRARY_0: globTags.rating + ' EQUAL 3', _LIBRARY_1: globTags.rating + ' EQUAL 4', _LIBRARY_2: globTags.rating + ' EQUAL 5'}, 
					pickMethod: {_LIBRARY_0: 'random', _LIBRARY_1: 'random', _LIBRARY_2: 'random'},
					toPls: 'Top tracks mix',
					harmonicMix: true
				}},
				{name: 'Top tracks mix (intercalate)', pool: {
					fromPls: {_LIBRARY_0: plLenQuart, _LIBRARY_1: plLenQuart, _LIBRARY_2: plLenHalf}, 
					query: {_LIBRARY_0: globTags.rating + ' EQUAL 3', _LIBRARY_1: globTags.rating + ' EQUAL 4', _LIBRARY_2: globTags.rating + ' EQUAL 5'}, 
					pickMethod: {_LIBRARY_0: 'random', _LIBRARY_1: 'random', _LIBRARY_2: 'random'},
					insertMethod: 'intercalate',
					toPls: 'Top tracks mix', 
					sort: '%PLAYLIST_INDEX%',
				}},
				{name: 'sep'},
				{name: 'Top recently played tracks mix', pool: {
					fromPls: {_LIBRARY_0: plLenQuart, _LIBRARY_1: plLenQuart, _LIBRARY_2: plLenHalf}, 
					query: {_LIBRARY_0: globTags.rating + ' EQUAL 3 AND %LAST_PLAYED% DURING LAST 3 WEEKS', _LIBRARY_1: globTags.rating + ' EQUAL 4 AND %LAST_PLAYED% DURING LAST 1 WEEKS', _LIBRARY_2: globTags.rating + ' EQUAL 5 AND %LAST_PLAYED% DURING LAST 5 WEEKS'}, 
					pickMethod: {_LIBRARY_0: 'random', _LIBRARY_1: 'random', _LIBRARY_2: 'random'},
					toPls: 'Top recently played tracks mix',
					sort: '',
				}},
				{name: 'Top recently added tracks mix', pool: {
					fromPls: {_LIBRARY_0: plLenQuart, _LIBRARY_1: plLenQuart, _LIBRARY_2: plLenHalf}, 
					query: {_LIBRARY_0: globTags.rating + ' EQUAL 3 AND %ADDED% DURING LAST 3 WEEKS', _LIBRARY_1: globTags.rating + ' EQUAL 4 AND %ADDED% DURING LAST 4 WEEKS', _LIBRARY_2: globTags.rating + ' EQUAL 5 AND %ADDED% DURING LAST 5 WEEKS'}, 
					pickMethod: {_LIBRARY_0: 'random', _LIBRARY_1: 'random', _LIBRARY_2: 'random'},
					toPls: 'Top recently added tracks mix',
					sort: '',
				}},
				{name: 'sep'},
				{name: 'Current genre/style and top tracks', pool: {
					fromPls: {_LIBRARY_0: plLenQuart, _LIBRARY_1: plLenQuart, _LIBRARY_2: plLenHalf}, 
					query: {_LIBRARY_0: '' + globTags.genre + ' IS #' + globTags.genre + '# AND NOT (' + globTags.rating + ' EQUAL 2 OR ' + globTags.rating + ' EQUAL 1)', _LIBRARY_1: globTags.style + ' IS #' + globTags.style + '# AND NOT (' + globTags.rating + ' EQUAL 2 OR ' + globTags.rating + ' EQUAL 1)', _LIBRARY_2: globTags.rating + ' EQUAL 5'}, 
					pickMethod: {_LIBRARY_0: 'random', _LIBRARY_1: 'random', _LIBRARY_2: 'random'},
					toPls: 'Current genre/style and top tracks', 
					sort: '',
				}},
				{name: 'Current genre/style and instrumentals', pool: {
					fromPls: {_LIBRARY_0: plLenHalf, _LIBRARY_1: plLenQuart, _LIBRARY_2: plLenQuart}, 
					query: {_LIBRARY_0: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND NOT (' + globTags.rating + ' EQUAL 2 OR ' + globTags.rating + ' EQUAL 1)', _LIBRARY_1: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND ' + globTags.rating + ' EQUAL 5', _LIBRARY_2: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND (' + globTags.genre + ' IS instrumental or ' + globTags.style + ' IS instrumental) AND NOT (' + globTags.rating + ' EQUAL 2 OR ' + globTags.rating + ' EQUAL 1)'}, 
					pickMethod: {_LIBRARY_0: 'random', _LIBRARY_1: 'random', _LIBRARY_2: 'random'},
					toPls: 'Current genre/style and instrumentals', 
					sort: '',
				}},
				{name: 'Current genre/style and instrumentals', pool: {
					fromPls: {_LIBRARY_0: plLenHalf, _LIBRARY_1: plLenQuart, _LIBRARY_2: plLenQuart}, 
					query: {_LIBRARY_0: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND NOT (' + globTags.rating + ' EQUAL 2 OR ' + globTags.rating + ' EQUAL 1)', 
					_LIBRARY_1: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND ' + globTags.rating + ' EQUAL 5', 
					_LIBRARY_2: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND (' + globTags.genre + ' IS instrumental or ' + globTags.style + ' IS instrumental) AND NOT (' + globTags.rating + ' EQUAL 2 OR ' + globTags.rating + ' EQUAL 1)'}, 
					pickMethod: {_LIBRARY_0: 'random', _LIBRARY_1: 'random', _LIBRARY_2: 'random'},
					toPls: 'Current genre/style and instrumentals', 
					sort: '',
				}},
				{name: 'sep'},
				{name: 'Classic Pools (50 artists current genre)', pool: {
					fromPls: {_GROUP_0: 50},
					group: {_GROUP_0: globTags.artist},
					limit: {_GROUP_0: 3},
					query: {_GROUP_0: '' + globTags.genre + ' IS #' + globTags.genre + '#'}, 
					toPls: 'Classic Pools (50 artists current genre)', 
					sort: '',
				}},
				{name: 'Classic Pools (50 random artists)', pool: {
					fromPls: {_GROUP_0: 50},
					group: {_GROUP_0: globTags.artist},
					limit: {_GROUP_0: 3},
					query: {_GROUP_0: ''}, 
					toPls: 'Classic Pools (50 artists)', 
					sort: '',
				}},
				{name: 'Classic Pools (all dates)', pool: {
					fromPls: {_GROUP_0: Infinity}, 
					group: {_GROUP_0: globTags.date},
					limit: {_GROUP_0: 2},
					query: {_GROUP_0: ''}, 
					toPls: 'Classic Pools (all dates)', 
					sort: globTags.date,
				}},
				{name: 'Classic Pools (3 tracks per artist letter)', pool: {
					fromPls: {_GROUP_0: Infinity}, 
					group: {_GROUP_0: '$lower($ascii($left(%' + globTags.artist + '%,1)))'},
					limit: {_GROUP_0: 3},
					query: {_GROUP_0: ''}, 
					toPls: 'Classic Pools (3 tracks per letter)', 
					sort: '',
				}},
				{name: 'Classic Pools (3 tracks per genre)', pool: {
					fromPls: {_GROUP_0: Infinity}, 
					group: {_GROUP_0: globTags.genre},
					limit: {_GROUP_0: 3},
					query: {_GROUP_0: ''}, 
					toPls: 'Classic Pools (3 tracks per genre)', 
					sort: '',
				}},
			];
			
			let selArg = {...pools[0]};
			const poolsDefaults = [...pools];
			// Create new properties with previous args
			menu_properties['pools'] = [name + ' entries', JSON.stringify(pools)];
			menu_properties['poolsCustomArg'] = [name + '\\Custom pool args', JSON.stringify(selArg)];
			// Checks
			menu_properties['pools'].push({func: isJSON}, menu_properties['pools'][1]);
			menu_properties['poolsCustomArg'].push({func: isJSON}, menu_properties['poolsCustomArg'][1]);
			// Functions
			const pickMethods = {
				random: (handleListFrom, num, count) => {
						const numbers = range(0, count - 1, 1).shuffle().slice(0, count > num ? num : count); // n randomly sorted. sort + random, highly biased!!
						const handleListFromClone = handleListFrom.Clone().Convert();
						return new FbMetadbHandleList(numbers.flatMap((i) => {return handleListFromClone.slice(i, i + 1)}));
					},
				start: (handleListFrom, num, count) => {if (count > num) {handleListFrom.RemoveRange(num - 1, count);} return handleListFrom;},
				end: (handleListFrom, num, count) => {if (count > num) {handleListFrom.RemoveRange(0, count - num);} return handleListFrom;},
			};
			const insertMethods = {
				standard: (handleListFrom, handleListTo) => {handleListTo.InsertRange(handleListTo.Count, handleListFrom);},
				intercalate: (handleListFrom, handleListTo, n) => { // Source 1 Track 1, Source 2  Track 2, Source 3  Track 3, Source 1 Track 2, ...
					if (!handleListTo.Count || !n) {insertMethods.standard(handleListFrom, handleListTo);}
					else {
						handleListFrom.Convert().forEach((handle, idx) => {
							const pos = (idx + 1)* (n + 1) - 1;
							handleListTo.Insert(pos, handle);
						});
					}
				},
			};
			const processPool = async (pool, properties) => {
				if (defaultArgs.bProfile) {var profiler = new FbProfiler('processPool');}
				let handleListTo = new FbMetadbHandleList();
				let bAbort = false;
				let n = 0;
				for await (const plsName of Object.keys(pool.fromPls)) {
					if (bAbort) {return;}
					let handleListFrom;
					// Select source
					switch (true) {
						case plsName.startsWith('_LIBRARY_'): { // Library Source
							handleListFrom = fb.GetLibraryItems();
							console.log('Playlist tools Pools: source -> Library');
							break;
						}
						case plsName.startsWith('_GROUP_'): { // Library Source grouping by TF
							console.log('Playlist tools Pools: source -> TF Group');
							// Pre-Filter with query
							handleListFrom = fb.GetLibraryItems();
							const query = typeof pool.query  !== 'undefined' ? pool.query[plsName] : '';
							if (query.length && query.toUpperCase() !== 'ALL') {
								const processedQuery = queryReplaceWithCurrent(query, fb.GetFocusItem(true));
								if (checkQuery(processedQuery, true)) {
									console.log('Playlist tools Pools: filter -> ' + processedQuery);
									handleListFrom = fb.GetQueryItems(handleListFrom, processedQuery);
								} else {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query + '\n->\n' + processedQuery, scriptName); bAbort = true; return;}
							}
							// Retrieve all possible groups
							const group = typeof pool.group !== 'undefined' ? pool.group[plsName] : '';
							const tagSet = [...new Set(getTagsValuesV4(handleListFrom, [group]).flat(Infinity).map((_) => {return sanitizeTagTfo(_.toString().toLowerCase());}))].filter(Boolean).shuffle();
							// Retrieve n random groups
							const num = Math.min(pool.fromPls[plsName] || Infinity, tagSet.length) - 1;
							const limit = typeof pool.limit !== 'undefined' ? pool.limit[plsName] : Infinity;
							const handleListsGroups = [];
							for (let i = 0; i <= num; i++) {
								const groupTF = group.indexOf('$') !== -1 ? _q(group) : group;
								const query = groupTF + ' IS ' + _q(tagSet[i]);
								if (!checkQuery(query, true)) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + groupTF + '\n' + query, scriptName); bAbort = true; return;}
								handleListsGroups[i] = new FbMetadbHandleList(fb.GetQueryItems(handleListFrom, query).Convert().shuffle().slice(0, limit));
								// Remove duplicates within the group (for ex. when retrieving 2 versions of same album)
								handleListsGroups[i] = removeDuplicatesV2({handleList: handleListsGroups[i], checkKeys: defaultArgs.checkDuplicatesBy, bAdvTitle: defaultArgs.bAdvTitle});
							}
							// Join all tracks
							handleListFrom = new FbMetadbHandleList();
							handleListsGroups.forEach((handleList) => {handleListFrom.AddRange(handleList);});
							console.log('Playlist tools Pools: group -> ' + limit + ' track(s) per ' + (group.length ? group : 'entire library'));
							break;
						}
						case plsName.startsWith('_SEARCHBYGRAPH_'): { // Search by GRAPH
							const nameGraph = 'Search similar by Graph...';
							const nameDynGenre = 'Search similar by DynGenre...';
							const nameWeight = 'Search similar by Weight...';
							const bScriptLoaded = !menusEnabled.hasOwnProperty(nameGraph) || !menusEnabled.hasOwnProperty(nameDynGenre) || !menusEnabled.hasOwnProperty(nameWeight) || !menusEnabled.hasOwnProperty(specialMenu) || menusEnabled[nameGraph] === true || menusEnabled[nameDynGenre] === true || menusEnabled[nameWeight] === true || menusEnabled[specialMenu] === true;
							if (typeof do_searchby_distance !== 'undefined' && bScriptLoaded) {
								// Get arguments
								const recipe = isString(pool.recipe[plsName]) ? _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\recipes\\' + pool.recipe[plsName], 'Recipe json', scriptName, utf8) : pool.recipe[plsName];
								// Check
								if (!recipe) {bAbort = true; return;}
								// Get reference (instead of selection)
								const theme = recipe.hasOwnProperty('theme') ? '' : pool.theme[plsName];
								const checks = ['sbd_max_graph_distance'];
								let bDone = true;
								checks.forEach((key) => {
									if (!recipe.hasOwnProperty(key)) {
										console.log('Playlist tools Pools: source recipe is missing ' + key + ' (' + folders.xxx + 'main\\search_bydistance.js' + ')');
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
								const [selectedHandlesArray, ...rest] = await do_searchby_distance({properties, theme, recipe});
								handleListFrom = new FbMetadbHandleList(selectedHandlesArray);
								console.log('Playlist tools Pools: source -> Search by GRAPH');
							} else {
								console.log('Playlist tools Pools: source requires a script not lodaded or disabled (' + folders.xxx + 'main\\search_bydistance.js' + ')');
								bAbort = true;
								return;
							}
							break;
						}
						case plsName.startsWith('_SEARCHBYWEIGHT_'): { // Search by WEIGHT
							if (typeof do_searchby_distance !== 'undefined') {
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
										console.log('Playlist tools Pools: source recipe is missing ' + key + ' (' + folders.xxx + 'main\\search_bydistance.js' + ')');
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
								const [selectedHandlesArray, ...rest] = await do_searchby_distance({properties, theme, recipe});
								handleListFrom = new FbMetadbHandleList(selectedHandlesArray);
								console.log('Playlist tools Pools: source -> Search by WEIGHT');
							} else {
								console.log('Playlist tools Pools: source requires a script not lodaded or disabled (' + folders.xxx + 'main\\search_bydistance.js' + ')');
								bAbort = true;
								return;
							}
							break;
						}
						case plsName.startsWith('_SEARCHBYDYNGENRE_'): { // Search by DYNGENRE
							if (typeof do_searchby_distance !== 'undefined') {
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
										console.log('Playlist tools Pools: source recipe is missing ' + key + ' (' + folders.xxx + 'main\\search_bydistance.js' + ')');
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
								const [selectedHandlesArray, ...rest] = await do_searchby_distance({properties, theme, recipe});
								handleListFrom = new FbMetadbHandleList(selectedHandlesArray);
								console.log('Playlist tools Pools: source -> Search by DYNGENRE');
							} else {
								console.log('Playlist tools Pools: source requires a script not lodaded or disabled (' + folders.xxx + 'main\\search_bydistance.js' + ')');
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
								// window.NotifyOthers('Playlist manager: get handleList', plsName); // Ask to share handle lists
								// if (plmPromises.length) {
									// handleListFrom = new FbMetadbHandleList();
									// Promise.all(plmPromises).then((handleList) => {
											// handleListFrom.AddRange(new FbMetadbHandleList(...handleList));
										// }).finally(() => {bDone = true; plmPromises.length = 0; console.log(handleListFrom);});
								// } 
								if (isPlsMan) {
									const playlistPath = JSON.parse(menu_panelProperties.playlistPath[1]); // This is retrieved everytime the menu is called
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
								if (!bDone) {console.log('Playlist tools Pools: source -> Not found - ' + plsName);}
								else {console.log('Playlist tools Pools: source -> ' + plsName + ' (' + plsMatch.path + ')');}
							} else { // Loaded playlist
								console.log('Playlist tools Pools: source -> ' + plsName);
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
							if (checkQuery(processedQuery, true)) {
								console.log('Playlist tools Pools: filter -> ' + processedQuery);
								handleListFrom = fb.GetQueryItems(handleListFrom, processedQuery);
							} else {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query + '\n->\n' + processedQuery, scriptName); bAbort = true; return;}
						}
						// Remove duplicates
						handleListFrom = removeDuplicatesV2({handleList: handleListFrom, checkKeys: defaultArgs.checkDuplicatesBy, bAdvTitle: defaultArgs.bAdvTitle});
					}
					// Remove tracks on destination list
					handleListTo.Clone().Convert().forEach((handle) => {handleListFrom.Remove(handle)});
					// Pick
					const num = pool.fromPls[plsName] || Infinity;
					if (!plsName.startsWith('_GROUP_')) {
						const count = handleListFrom.Count;
						if (count !== 1) {
							handleListFrom = pickMethods[pool.pickMethod[plsName]](handleListFrom, num, count);
						}
						console.log('Playlist tools Pools: pool size -> ' + handleListFrom.Count + ' (' + count +') tracks');
					} else {console.log('Playlist tools Pools: pool size -> ' + handleListFrom.Count + ' tracks from ' + num + ' groups');}
					// Insert
					if (pool.hasOwnProperty('insertMethod')) {
						insertMethods[pool.insertMethod](handleListFrom, handleListTo, n)
					} else {insertMethods['standard'](handleListFrom, handleListTo)}
					n++;
				}
				if (bAbort) {fb.ShowPopupMessage('Check console. Pools failed with major errors.', scriptName); return;}
				const idxTo = plman.FindOrCreatePlaylist(pool.toPls, true);
				if (addLock(idxTo) || removeLock(idxTo)) {Console.log('Output playlist is locked for adding\\removing items: ' + pool.toPls); return;}
				plman.UndoBackup(idxTo);
				plman.ClearPlaylist(idxTo);
				// Harmonic mix?
				if (pool.hasOwnProperty('harmonicMix') && pool.harmonicMix) {
					const handleListMix = harmonicMixing({selItems: handleListTo, keyTag: defaultArgs.keyTag, bSendToPls: false, bDoublePass: true, bDebug: defaultArgs.bDebug});
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
					console.log('Playlist tools Pools: harmonic mix -> ' + newCount + ' ' + _p('+' + (oriCount - newCount)) + ' tracks');
				}
				plman.InsertPlaylistItems(idxTo, 0, handleListTo, true);
				// Sort only when not doing harmonic mix
				if ((!pool.hasOwnProperty('harmonicMix') || !pool.harmonicMix) && typeof pool.sort !== 'undefined') {
					
					plman.SortByFormat(idxTo, pool.sort);
					console.log('Playlist tools Pools: sorting ' + _p(pool.sort.length ? pool.sort : 'random'));
				}
				plman.ActivePlaylist = idxTo;
				console.log('Playlist tools Pools: playlist -> ' + pool.toPls + ': ' + handleListTo.Count + ' tracks');
				if (defaultArgs.bProfile) {profiler.Print();}
			}
			const inputPool = () => {
				// Sources
				let fromPls;
				try {fromPls = utils.InputBox(window.ID, 'Enter playlist source(s) (pairs):\nNo playlist name equals to _LIBRARY_#.\n(playlist,# tracks;playlist,# tracks)', scriptName + ': ' + name, Object.keys(pools[0].pool.fromPls).reduce((total, key) => {return total + (total.length ? ';' : '') + key + ',' + pools[0].pool.fromPls[key];}, ''), true);}
				catch (e) {return;}
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
				try {query = utils.InputBox(window.ID, 'Enter queries to filter the sources (pairs):\nEmpty or ALL are equivalent, but empty applies global forced query too if enabled.\n(playlist,query;playlist,query)', scriptName + ': ' + name, Object.keys(fromPls).reduce((total, key) => {return total + (total.length ? ';' : '') + key + ',' + 'ALL';}, ''), true);}
				catch (e) {return;}
				if (!query.length) {console.log('Input was empty'); return;}
				if (query.indexOf(',') === -1) {console.log('Input was not a pair separated by \',\''); return;}
				query = query.split(';');
				query = query.map((pair) => {
					pair = pair.split(',');
					// if (!pair[1].length) {pair[1] = 'ALL'}
					return pair;
				});
				// TODO Check queries
				if (query.some((pair) => {return pair.length % 2 !== 0})) {console.log('Input was not a list of pairs separated \';\''); return;}
				if (query.some((pair) => {return !fromPls.hasOwnProperty(pair[0])})) {console.log('Playlist named did not match with sources'); return;}
				query = Object.fromEntries(query);
				// Picking Method
				let pickMethod;
				const pickMethodsKeys = Object.keys(pickMethods);
				try {pickMethod = utils.InputBox(window.ID, 'How tracks should be picked? (pairs)\nMethods: ' + pickMethodsKeys.join(', ') + '\n(playlist,method;playlist,method)', scriptName + ': ' + name, Object.keys(fromPls).reduce((total, key) => {return total + (total.length ? ';' : '') + key + ',' + pickMethodsKeys[0]}, ''), true);}
				catch (e) {return;}
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
				try {toPls = utils.InputBox(window.ID, 'Enter playlist destination:', scriptName + ': ' + name, 'Playlist C', true);}
				catch (e) {return;}
				if (!toPls.length) {console.log('Input was empty'); return;}
				// Sort
				let sort = '';
				try {sort = utils.InputBox(window.ID, 'Enter final sorting:\n(empty to randomize)', scriptName + ': ' + name, '%PLAYLIST_INDEX%', true);}
				catch (e) {return;}
				// TODO: Test sorting
				// Object
				return {pool : {fromPls, query, toPls, sort, pickMethod}};
			}
			// Menus
			menu.newEntry({menuName, entryText: 'Use Playlists / Queries as pools:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			// Static menus
			staticPools.forEach( (poolObj) => {
				if (poolObj.name === 'sep') {
					menu.newEntry({menuName, entryText: 'sep'});
				} else {
					let entryText = poolObj.name;
					// Global forced query
					const pool = clone(poolObj.pool);
					if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) { // With forced query enabled
						Object.keys(pool.query).forEach((key) => {
							if (pool.query[key].length && pool.query[key].toUpperCase() !== 'ALL') { // ALL query never uses forced query!
								pool.query[key] = '(' + pool.query[key] + ') AND (' + defaultArgs.forcedQuery + ')';
							} else if (!pool.query[key].length) { // Empty uses forced query or ALL
								pool.query[key] = defaultArgs.forcedQuery;
							}
						});
					} else {
						Object.keys(pool.query).forEach((key) => { // Otherwise empty is replaced with ALL
							if (!pool.query[key].length) {
								pool.query[key] = 'ALL';
							}
						});
					}
					menu.newEntry({menuName, entryText, func: () => {processPool(pool);}});
				}
			});
			menu.newCondEntry({entryText: 'Pools... (cond)', condFunc: () => {
				// Entry list
				pools = JSON.parse(menu_properties['pools'][1]);
				pools.forEach( (poolObj) => {
					// Add separators
					if (poolObj.hasOwnProperty('name') && poolObj.name === 'sep') {
						menu.newEntry({menuName, entryText: 'sep'});
					} else { 
						// Create names for all entries
						let poolName = poolObj.name;
						poolName = poolName.length > 40 ? poolName.substring(0,40) + ' ...' : poolName;
						// Global forced query
						const pool = clone(poolObj.pool);
						if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) {
							Object.keys(pool.query).forEach((key) => { // With forced query enabled
								if (pool.query[key].length && pool.query[key].toUpperCase() !== 'ALL') { // ALL query never uses forced query!
									pool.query[key] = '(' + pool.query[key] + ') AND (' + defaultArgs.forcedQuery + ')';
								} else if (!pool.query[key].length) { // Empty uses forced query or ALL
									pool.query[key] = defaultArgs.forcedQuery;
								}
							});
						} else {
							Object.keys(pool.query).forEach((key) => { // Otherwise empty is replaced with ALL
								if (!pool.query[key].length) {
									pool.query[key] = 'ALL';
								}
							});
						}
						menu.newEntry({menuName, entryText: poolName, func: () => {processPool(pool, menu_properties);}});
					}
				});
				menu.newEntry({menuName, entryText: 'sep'});
				{ // Static menu: user configurable
					menu.newEntry({menuName, entryText: 'Custom pool...', func: () => {
						// On first execution, must update from property
						selArg.tfo = JSON.parse(menu_properties['poolsCustomArg'][1]).tfo;
						// Input
						const input = inputPool();
						if (!input) {return;}
						const pool = clone(input.pool);
						if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) {
							Object.keys(pool.query).forEach((key) => { // With forced query enabled
								if (pool.query[key].length && pool.query[key].toUpperCase() !== 'ALL') { // ALL query never uses forced query!
									pool.query[key] = '(' + pool.query[key] + ') AND (' + defaultArgs.forcedQuery + ')';
								} else if (!pool.query[key].length) { // Empty uses forced query or ALL
									pool.query[key] = defaultArgs.forcedQuery;
								}
							});
						} else {
							Object.keys(pool.query).forEach((key) => { // Otherwise empty is replaced with ALL
								if (!pool.query[key].length) {
									pool.query[key] = 'ALL';
								}
							});
						}
						// Execute
						processPool(pool, menu_properties);
						// For internal use original object
						selArg.pool = input;
						menu_properties['poolsCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
						overwriteMenuProperties(); // Updates panel
					}});
					// Menu to configure property
					menu.newEntry({menuName, entryText: 'sep'});
				}
				{	// Add / Remove
					createSubMenuEditEntries(menuName, {
						name,
						list: pools, 
						propName: 'pools', 
						defaults: poolsDefaults, 
						defaultPreset: folders.xxx + 'presets\\Playlist Tools\\pools\\themes.json',
						input : inputPool
					});
				}
			}});
			menu.newCondEntry({entryText: 'Get playlist manager path (cond)', condFunc: () => {
				window.NotifyOthers('Playlist manager: playlistPath', null); // Ask to share paths
				isPlsMan = _isFile(plsManHelper); // Safety check
			}});
		}
	} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}