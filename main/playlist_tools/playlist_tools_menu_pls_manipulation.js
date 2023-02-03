﻿'use strict';
//03/02/23

// Playlist manipulation...
{
	const name = 'Playlist manipulation';
	if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
		readmes[newReadmeSep()] = 'sep';
		let menuName = menu.newMenu(name);
		{	// Remove Duplicates / Show Duplicates
			const scriptPath = folders.xxx + 'main\\filter_and_query\\remove_duplicates.js';
			if (_isFile(scriptPath)){
				const name = 'Duplicates and tag filtering';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath.replace(folders.xxx  + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\remove_duplicates.txt';
					let subMenuName = menu.newMenu(name, menuName);
					let sortInputDuplic = globTags.remDupl;
					let sortInputFilter = globTags.remDupl;
					let nAllowed = 2;
					// Create new properties with previous args
					menu_properties['sortInputDuplic'] = [menuName + '\\' + name + ' Tags to remove duplicates', sortInputDuplic.join(',')];
					menu_properties['sortInputFilter'] = [menuName + '\\' + name + ' Tags to filter playlists', sortInputFilter.join(',')];
					menu_properties['nAllowed'] = [menuName + '\\' + name + ' Filtering number allowed (n + 1)', nAllowed];
					// Checks
					menu_properties['sortInputDuplic'].push({func: isString}, menu_properties['sortInputDuplic'][1]);
					menu_properties['sortInputFilter'].push({func: isString}, menu_properties['sortInputFilter'][1]);
					menu_properties['nAllowed'].push({greaterEq: 0, func: isInt}, menu_properties['nAllowed'][1]);
					// Menus
					menu.newEntry({menuName: subMenuName, entryText: 'Filter playlists using tags or TF:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newCondEntry({entryText: 'Remove Duplicates... (cond)', condFunc: () => {
						// Update args
						sortInputDuplic = menu_properties.sortInputDuplic[1].split(',');
						sortInputFilter = menu_properties.sortInputFilter[1].split(',');
						nAllowed = menu_properties.nAllowed[1];
						// Menus
						const entryKeysD = sortInputDuplic.join(', ').replace(globTags.title, 'Title').replace(globTags.date, 'Year').toLowerCase();
						const entryKeysF = sortInputFilter.join(', ').replace(globTags.title, 'Title').replace(globTags.date, 'Year').toLowerCase();
						menu.newEntry({menuName: subMenuName, entryText: 'Remove duplicates by ' + entryKeysD, func: () => {removeDuplicatesV2({checkKeys: sortInputDuplic, bAdvTitle: defaultArgs.bAdvTitle});}, flags: playlistCountFlagsAddRem});
						menu.newEntry({menuName: subMenuName, entryText: 'Show duplicates by ' + entryKeysD, func: () => {showDuplicates({checkKeys: sortInputDuplic, bAdvTitle: defaultArgs.bAdvTitle});}, flags: playlistCountFlagsAddRem});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Filter playlist by ' + entryKeysF + ' (n = ' + nAllowed + ')', func: () => {removeDuplicates({checkKeys: sortInputFilter, nAllowed, bAdvTitle: defaultArgs.bAdvTitle});}, flags: playlistCountFlagsAddRem});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Filter playlist by... (tags)' , func: () => {
							let tags;
							try {tags = utils.InputBox(window.ID, 'Enter list of tags separated by comma', scriptName + ': ' + name, sortInputDuplic.join(','), true);}
							catch (e) {return;}
							if (!tags.length) {return;}
							tags = tags.split(',').filter((val) => val);
							let n;
							try {n = Number(utils.InputBox(window.ID, 'Number of duplicates allowed (n + 1)', scriptName + ': ' + name, nAllowed, true));}
							catch (e) {return;}
							if (!Number.isSafeInteger(n)) {return;}
							removeDuplicates({checkKeys: tags, nAllowed: n, bAdvTitle: defaultArgs.bAdvTitle});
						}, flags: playlistCountFlagsAddRem});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Set tags (for duplicates)...', func: () => {
							const input = utils.InputBox(window.ID, 'Enter list of tags separated by comma', scriptName + ': ' + name, sortInputDuplic.join(','));
							if (sortInputDuplic.join(',') === input) {return;}
							if (!input.length) {return;}
							sortInputDuplic = input.split(',').filter((n) => n);
							menu_properties['sortInputDuplic'][1] = sortInputDuplic.join(',');
							overwriteMenuProperties(); // Updates panel
							updateShortcutsNames({sortInputDuplic: menu_properties['sortInputDuplic'][1]});
						}});
						menu.newEntry({menuName: subMenuName, entryText: 'Set tags (for filtering)...', func: () => {
							const input = utils.InputBox(window.ID, 'Enter list of tags separated by comma', scriptName + ': ' + name, sortInputFilter.join(','));
							if (sortInputFilter.join(',') === input) {return;}
							if (!input.length) {return;}
							sortInputFilter = input.split(',').filter((n) => n);
							menu_properties['sortInputFilter'][1] = sortInputFilter.join(',');
							overwriteMenuProperties(); // Updates panel
							updateShortcutsNames({sortInputFilter: menu_properties['sortInputFilter'][1], nAllowed});
						}});
						menu.newEntry({menuName: subMenuName, entryText: 'Set number allowed (for filtering)...', func: () => {
							const input = Number(utils.InputBox(window.ID, 'Number of duplicates allowed (n + 1)', scriptName + ': ' + name, nAllowed));
							if (nAllowed === input) {return;}
							if (!Number.isSafeInteger(input)) {return;}
							nAllowed = input;
							menu_properties['nAllowed'][1] = nAllowed;
							overwriteMenuProperties(); // Updates panel
							updateShortcutsNames({sortInputFilter: menu_properties['sortInputFilter'][1], nAllowed});
						}});
					}});
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Filter by Query
			const scriptPath = folders.xxx + 'main\\filter_and_query\\filter_by_query.js';
			if (_isFile(scriptPath)){
				const name = 'Query filtering';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath.replace(folders.xxx  + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\filter_by_query.txt';
					forcedQueryMenusEnabled[name] = false;
					const subMenuName = menu.newMenu(name, menuName);
					let queryFilter = [
							{name: 'Rating > 2', query: globQuery.notLowRating}, 
							{name: 'Not live (none)', query: globQuery.noLiveNone},  
							{name: 'Not live (except Hi-Fi)', query: globQuery.noLive},  
							{name: 'Not multichannel', query: globQuery.stereo}, 
							{name: 'Not SACD or DVD', query: globQuery.noSACD}, 
							{name: 'Global forced query', query: defaultArgs['forcedQuery']},
							{name: 'sep'},
							{name: 'Same title than sel', query: globQuery.compareTitle},
							{name: 'Same song than sel', query: globTags.artist + ' IS #' + globTags.artist + '# AND ' + globQuery.compareTitle + ' AND ' + _q(globTags.date) + ' IS #' + globTags.date + '#'},
							{name: 'Same artist(s) than sel', query: globTags.artist + ' IS #' + globTags.artist + '#'},
							{name: 'Same genre than sel', query: globTags.genre + ' IS #' + globTags.genre + '#'},
							{name: 'Same key than sel', query: globTags.key + ' IS #' + globTags.key + '#'},
							{name: 'sep'},
							{name: 'Different genre than sel', query: 'NOT ' + globTags.genre + ' IS #' + globTags.genre + '#'},
							{name: 'Different style than sel', query: 'NOT ' + globTags.style + ' IS #' + globTags.style + '#'}
					];
					let selArg = {name: 'Custom', query: queryFilter[0].query};
					const queryFilterDefaults = [...queryFilter];
					// Create new properties with previous args
					menu_properties['queryFilter'] = [menuName + '\\' + name + ' queries', JSON.stringify(queryFilter)];
					menu_properties['queryFilterCustomArg'] = [menuName + '\\' + name + ' Dynamic menu custom args', selArg.query];
					// Check
					menu_properties['queryFilter'].push({func: isJSON}, menu_properties['queryFilter'][1]);
					menu_properties['queryFilter'].push({func: (query) => {return checkQuery(query, true);}}, menu_properties['queryFilter'][1]);
					// Helpers
					const inputPlsQuery = () => {
							let query;
							try {query = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.', scriptName + ': ' + name, '', true);}
							catch (e) {return;}
							if (query.indexOf('#') === -1) { // Try the query only if it is not a dynamic one
								try {fb.GetQueryItems(new FbMetadbHandleList(), query);}
								catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, scriptName + ': ' + name); return;}
							}
							return {query};
						};
					// Menus
					menu.newEntry({menuName: subMenuName, entryText: 'Filter active playlist: (Ctrl + click to invert)', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newCondEntry({entryText: 'Filter playlists using queries... (cond)', condFunc: () => {
						const options = JSON.parse(menu_properties.dynQueryEvalSel[1]);
						const bEvalSel = options['Dynamic queries'];
						queryFilter = JSON.parse(menu_properties['queryFilter'][1]);
						queryFilter.forEach( (queryObj) => {
							if (queryObj.name === 'sep') { // Create separators
								menu.newEntry({menuName: subMenuName, entryText: 'sep'});
							} else { 
								// Create names for all entries
								const queryName = queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name;
								menu.newEntry({menuName: subMenuName, entryText: 'Filter playlist by ' + queryName, func: () => {
									let query = queryObj.query;
									// Invert query when pressing Control
									if (utils.IsKeyPressed(VK_CONTROL) && query.length) {
										query = 'NOT ' + _p(query);
									}
									// Forced query
									if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) { // With forced query enabled
										if (query.length && query.toUpperCase() !== 'ALL') { // ALL query never uses forced query!
											query = _p(query) + ' AND ' + _p(defaultArgs.forcedQuery);
										} else if (!query.length) {query = defaultArgs.forcedQuery;} // Empty uses forced query or ALL
									} else if (!query.length) {query = 'ALL';} // Otherwise empty is replaced with ALL
									// Test
									let focusHandle = fb.GetFocusItem(true);
									if (focusHandle && query.indexOf('#') !== -1) {
										if (bEvalSel) {
											const queries = [...new Set(plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Convert().map((handle) => {return queryReplaceWithCurrent(query, handle);}))];
											query = query_join(queries, 'OR');
										} else {
											query = queryReplaceWithCurrent(query, focusHandle);
										}
									}
									try {fb.GetQueryItems(new FbMetadbHandleList(), query);}
									catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, scriptName); return;}
									// Execute
									filterByQuery(null, query);
								}, flags: playlistCountFlagsAddRem});
							}
						});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Filter playlist by... (query)' , func: () => {
							selArg.query = menu_properties['queryFilterCustomArg'][1];
							let input;
							try {input = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.', scriptName + ': ' + name, selArg.query, true);}
							catch (e) {return;}
							// Forced query
							let query = input;
							if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) { // With forced query enabled
								if (query.length && query.toUpperCase() !== 'ALL') { // ALL query never uses forced query!
									query = '(' + query + ') AND (' + defaultArgs.forcedQuery + ')';
								} else if (!query.length) {query = defaultArgs.forcedQuery;} // Empty uses forced query or ALL
							} else if (!query.length) {query = 'ALL';} // Otherwise empty is replaced with ALL
							// Test
							let focusHandle = fb.GetFocusItem(true);
							if (focusHandle && query.indexOf('#') !== -1) {
								if (bEvalSel) {
									const queries = [...new Set(plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Convert().map((handle) => {return queryReplaceWithCurrent(query, handle);}))];
									query = query_join(queries, 'OR');
								} else {
									query = queryReplaceWithCurrent(query, focusHandle);
								}
							}
							try {fb.GetQueryItems(new FbMetadbHandleList(), query);}
							catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, scriptName); return;}
							// Execute
							filterByQuery(null, query);
							// For internal use original object
							selArg.query = input; 
							menu_properties['queryFilterCustomArg'][1] = input; // And update property with new value
							overwriteMenuProperties(); // Updates panel
						}, flags: playlistCountFlagsAddRem});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						createSubMenuEditEntries(subMenuName, {
							name,
							list: queryFilter, 
							propName: 'queryFilter', 
							defaults: queryFilterDefaults, 
							defaultPreset: folders.xxx + 'presets\\Playlist Tools\\pls_query_filter\\themes.json',
							input : inputPlsQuery
						});
					}});
					menu.newEntry({menuName, entryText: 'sep'});
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Create harmonic mix from playlist
			const scriptPath = folders.xxx + 'main\\sort\\harmonic_mixing.js';
			if (_isFile(scriptPath)){
				const name = 'Harmonic mix';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath.replace(folders.xxx  + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\harmonic_mixing.txt';
					const subMenuName = menu.newMenu(name, menuName);
					const selArgs = [
						{name: 'Harmonic mix from playlist'	, args: {selItems: () => {return plman.GetPlaylistItems(plman.ActivePlaylist);}}, flags: playlistCountFlags},
						{name: 'Harmonic mix from selection'	, args: {selItems: () => {return plman.GetPlaylistSelectedItems(plman.ActivePlaylist);}}, flags: multipleSelectedFlags},
					];
					if (!menu_properties.hasOwnProperty('bHarmonicMixDoublePass')) {menu_properties['bHarmonicMixDoublePass'] = ['Harmonic mixing double pass to match more tracks', true];}
					// Menus
					menu.newEntry({menuName: subMenuName, entryText: 'Using rule of Fifths (new playlist):', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					selArgs.forEach( (selArg) => {
						if (selArg.name === 'sep') {
							menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						} else {
							let entryText = selArg.name;
							menu.newEntry({menuName: subMenuName, entryText, func: (args = {...defaultArgs, ...selArg.args}) => {
								args.selItems = args.selItems();
								args.playlistLength = args.selItems.Count; // Max allowed
								args.bDoublePass = menu_properties.bHarmonicMixDoublePass[1]; // Max allowed
								if (defaultArgs.bProfile) {var profiler = new FbProfiler('harmonicMixing');}
								harmonicMixing(args);
								if (defaultArgs.bProfile) {profiler.Print();}
							}, flags: selArg.flags ? selArg.flags : undefined});
						}
					});
					menu.newEntry({menuName, entryText: 'sep'});
					if (!menusEnabled.hasOwnProperty(configMenu) || menusEnabled[configMenu] === true) {
						const subMenuName = 'Harmonic mixing';
						if (!menu.hasMenu(subMenuName, configMenu)) {
							menu.newMenu(subMenuName, configMenu);
							{	// bHarmonicMixDoublePass
								menu.newEntry({menuName: subMenuName, entryText: 'For any tool which uses harmonic mixing:', func: null, flags: MF_GRAYED});
								menu.newEntry({menuName: subMenuName, entryText: 'sep'});
								menu.newEntry({menuName: subMenuName, entryText: 'Enable double pass to match more tracks', func: () => {
									menu_properties['bHarmonicMixDoublePass'][1] = !menu_properties['bHarmonicMixDoublePass'][1];
									overwriteMenuProperties(); // Updates panel
								}});
								menu.newCheckMenu(subMenuName, 'Enable double pass to match more tracks', void(0), () => {return menu_properties['bHarmonicMixDoublePass'][1];});
							}
							menu.newEntry({menuName: configMenu, entryText: 'sep'});
						}
					} else {menuDisabled.push({menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Find / New Playlist
			const name = 'Find or create playlist...';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				menu.newEntry({menuName, entryText: name, func: () => {
					let input;
					try {input = utils.InputBox(window.ID, 'Enter name:', scriptName + ': ' + name, 'New playlist', true);}
					catch (e) {return;}
					if (!input.length) {return;}
					plman.ActivePlaylist = plman.FindOrCreatePlaylist(input, false);
				}});
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
		{	// Crop playlist length (for use with macros!!)
			const name = 'Cut playlist length to...';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				const subMenuName = menu.newMenu(name, menuName);
				const selArgs = [
					{name: '25 tracks', func: (idx) => {removeNotSelectedTracks(idx, 25);}},
					{name: '50 tracks', func: (idx) => {removeNotSelectedTracks(idx, 50);}},
					{name: '75 tracks', func: (idx) => {removeNotSelectedTracks(idx, 75);}},
					{name: '100 tracks', func: (idx) => {removeNotSelectedTracks(idx, 100);}},
					{name: 'sep'},
					{name: '25 tracks from end', func: (idx) => {removeNotSelectedTracks(idx, -25);}},
					{name: '50 tracks from end', func: (idx) => {removeNotSelectedTracks(idx, -50);}},
					{name: '75 tracks from end', func: (idx) => {removeNotSelectedTracks(idx, -75);}},
					{name: '100 tracks from end', func: (idx) => {removeNotSelectedTracks(idx, -100);}},
					{name: 'sep'},
					{name: () => {return 'Global pls. length: ' + menu_properties.playlistLength[1]}, func: (idx) => {removeNotSelectedTracks(idx, menu_properties.playlistLength[1]);}},
					{name: () => {return 'Global pls. length (end): ' + menu_properties.playlistLength[1]}, func: (idx) => {removeNotSelectedTracks(idx, menu_properties.playlistLength[1]);}},
				];
				menu.newEntry({menuName: subMenuName, entryText: 'Set playlist length to desired #:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				// Menus
				selArgs.forEach( (selArg) => {
					if (selArg.name === 'sep') {
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					} else {
						let entryText = selArg.name;
						menu.newEntry({menuName: subMenuName, entryText, func: () => {
							const ap = plman.ActivePlaylist;
							if (ap === -1) {return;}
							plman.UndoBackup(ap);
							selArg.func(ap)
						}, flags: playlistCountFlagsRem});
					}
				});
				menu.newEntry({menuName, entryText: 'sep'});
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
		{	// Merge / Intersect / Difference
			const nameMerge = 'Merge with playlist...';
			const nameInter = 'Intersect with playlist...';
			const nameDiff = 'Difference with playlist...';
			if (!menusEnabled.hasOwnProperty(nameMerge) || !menusEnabled.hasOwnProperty(nameInter) || !menusEnabled.hasOwnProperty(nameDiff) || menusEnabled[nameMerge] === true || menusEnabled[nameInter] === true || menusEnabled[nameDiff] === true) {
				if (!menu_properties.hasOwnProperty('playlistSplitSize')) {
					menu_properties['playlistSplitSize'] = ['Playlist lists submenu size', 20];
					// Checks
					menu_properties['playlistSplitSize'].push({greater: 1, func: isInt}, menu_properties['playlistSplitSize'][1]);
				}
				// Bools
				const bMerge = !menusEnabled.hasOwnProperty(nameMerge) || menusEnabled[nameMerge] === true;
				const bInter = !menusEnabled.hasOwnProperty(nameInter) || menusEnabled[nameInter] === true;
				const bDiff = !menusEnabled.hasOwnProperty(nameDiff) || menusEnabled[nameDiff] === true;
				// Menus
				const subMenuNameMerge = bMerge ? menu.newMenu(nameMerge, menuName) : null;
				if (!bMerge) {menuDisabled.push({menuName: nameMerge, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				const subMenuNameInter = bInter ? menu.newMenu(nameInter, menuName) : null;
				if (!bInter) {menuDisabled.push({menuName: nameInter, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				const subMenuNameDiff = bDiff ? menu.newMenu(nameDiff, menuName) : null;
				if (!bDiff) {menuDisabled.push({menuName: nameDiff, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				if (bMerge) {
					menu.newEntry({menuName: subMenuNameMerge, entryText: 'Merge current playlist\'s tracks with:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameMerge, entryText: 'sep'});
				}
				if (bInter) {
					menu.newEntry({menuName: subMenuNameInter, entryText: 'Output current playlist\'s tracks present on:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameInter, entryText: 'sep'});
				}
				if (bDiff) {
					menu.newEntry({menuName: subMenuNameDiff, entryText: 'Remove current playlist\'s tracks present on:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameDiff, entryText: 'sep'});
				}
				menu.newEntry({menuName, entryText: 'sep'});
				// Build submenus
				menu.newCondEntry({entryText: 'Merge/Intersect/Difference to Playlists...', condFunc: () => {
					if (defaultArgs.bProfile) {var profiler = new FbProfiler('Merge/Intersect/Difference to Playlists...');}
					const ap = plman.ActivePlaylist;
					const bPlaylist = ap !== -1;
					const playlistsNum = plman.PlaylistCount;
					const bTracks = bPlaylist ? plman.PlaylistItemCount(ap) !== 0 : false;
					const bAddLock =  bPlaylist ? addLock() : false;
					const bAddRemLock = bAddLock || (bPlaylist ? removeLock() : false);
					if (playlistsNum && bTracks && ((bMerge && !bAddLock) || ((bInter || bDiff) && !bAddRemLock))) {
						// Split entries in sub-menus if there are too many playlists...
						let ss = menu_properties['playlistSplitSize'][1];
						const splitBy =  playlistsNum < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
						if (playlistsNum > splitBy) {
							const subMenusCount =  Math.ceil(playlistsNum / splitBy);
							let skipped = 0; // Only used on bMerge, to account for locked playlists
							for (let i = 0; i < subMenusCount; i++) {
								const bottomIdx =  i * splitBy;
								const topIdx = (i + 1) * splitBy - 1;
								// Prefix ID is required to avoid collisions with same sub menu names
								// Otherwise both menus would be called 'Playlist X-Y', leading to bugs (entries duplicated on both places)
								// Send
								const idxMerge = bMerge ? '(Merge with) Playlists ' + bottomIdx + ' - ' + topIdx : null;
								const subMenu_i_merge = bMerge ? menu.newMenu(idxMerge, subMenuNameMerge) : null;
								// Go to
								const idxInter = bInter ? '(Intersect with) Playlists ' + bottomIdx + ' - ' + topIdx : null;
								const subMenu_i_inter = bInter ? menu.newMenu(idxInter, subMenuNameInter) : null;
								// Close
								const idxDiff = bDiff ? '(Difference with) Playlists ' + bottomIdx + ' - ' + topIdx : null;
								const subMenu_i_diff = bDiff ? menu.newMenu(idxDiff, subMenuNameDiff) : null;
								for (let j = bottomIdx; j <= topIdx + skipped && j < playlistsNum; j++) {
									const playlist = {name: plman.GetPlaylistName(j), index : j};
									const entryText = playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : '')
									if (bMerge && !bAddLock) {
										menu.newEntry({menuName: subMenu_i_merge, entryText, func: () => {
											plman.UndoBackup(ap);
											const handleListA = plman.GetPlaylistItems(ap);
											const handleListB = plman.GetPlaylistItems(playlist.index).Convert();
											handleListA.Sort();
											const toAdd = new FbMetadbHandleList();
											handleListB.forEach((handle) => {if (handleListA.BSearch(handle) === -1) {toAdd.Add(handle);}});
											if (toAdd.Count) {
												plman.InsertPlaylistItems(ap, plman.PlaylistItemCount(ap), toAdd);
												console.log('Added ' + toAdd.Count + ' items.');
											} else {console.log('No items were added.');}
										}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
										// Add radio check on current playlist
										if (playlist.index === ap) {menu.newCheckMenu(subMenu_i_merge, entryText, entryText, () => 0);}
									}
									if (bInter && !bAddRemLock) {
										menu.newEntry({menuName: subMenu_i_inter, entryText, func: () => {
											plman.UndoBackup(ap);
											const handleListA = plman.GetPlaylistItems(ap);
											const handleListAOri = handleListA.Clone().Convert();
											const handleListB = plman.GetPlaylistItems(playlist.index);
											handleListA.Sort();
											handleListB.Sort();
											const intersect = handleListA.Clone();
											intersect.MakeIntersection(handleListB);
											const toAdd = new FbMetadbHandleList();
											handleListAOri.forEach((handle, i) => {if (intersect.BSearch(handle) !== -1) {toAdd.Add(handle);}});
											plman.ClearPlaylist(ap);
											const toAddCount = toAdd.Count;
											const remCount = handleListAOri.Count - toAddCount;
											if (toAddCount) {plman.InsertPlaylistItems(ap, 0, toAdd);}
											if (remCount) {console.log('Removed ' + remCount + ' items.');} else {console.log('No items were removed.');}
										}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
										// Add radio check on current playlist
										if (playlist.index === ap) {menu.newCheckMenu(subMenu_i_inter, entryText, entryText, () => 0);}
									}
									if (bDiff && !bAddRemLock) {
										menu.newEntry({menuName: subMenu_i_diff, entryText, func: () => {
											plman.UndoBackup(ap);
											const handleListA = plman.GetPlaylistItems(ap)
											const handleListAOri = handleListA.Clone().Convert();
											const handleListB = plman.GetPlaylistItems(playlist.index);
											handleListA.Sort();
											handleListB.Sort();
											const difference = handleListA.Clone();
											difference.MakeDifference(handleListB);
											const toAdd = new FbMetadbHandleList();
											handleListAOri.forEach((handle, i) => {if (difference.BSearch(handle) !== -1) {toAdd.Add(handle);}});
											plman.ClearPlaylist(ap);
											const toAddCount = toAdd.Count;
											const remCount = handleListAOri.Count - toAddCount;
											if (toAddCount) {plman.InsertPlaylistItems(ap, 0, toAdd);}
											if (remCount) {console.log('Removed ' + remCount + ' items.');} else {console.log('No items were removed.');}
										}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
										// Add radio check on current playlist
										if (playlist.index === ap) {menu.newCheckMenu(subMenu_i_diff, entryText, entryText, () => 0);}
									}
								}
							}
						} else { // Or just show all
							for (let i = 0; i < playlistsNum; i++) {
								const playlist = {name: plman.GetPlaylistName(i), index : i};
								const entryText = playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : '')
								if (bMerge && !bAddLock) {
									menu.newEntry({menuName: subMenuNameMerge,  entryText, func: () => {
										plman.UndoBackup(ap);
										const handleListA = plman.GetPlaylistItems(ap);
										const handleListB = plman.GetPlaylistItems(playlist.index).Convert();
										handleListA.Sort();
										const toAdd = new FbMetadbHandleList();
										handleListB.forEach((handle) => {if (handleListA.BSearch(handle) === -1) {toAdd.Add(handle);}});
										if (toAdd.Count) {
											plman.InsertPlaylistItems(ap, plman.PlaylistItemCount(ap), toAdd);
											console.log('Added ' + toAdd.Count + ' items.');
										} else {console.log('No items were added.');}
									}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
									// Add radio check on current playlist
									if (playlist.index === ap) {menu.newCheckMenu(subMenuNameMerge, entryText, entryText, () => 0);}
								}
								if (bInter && !bAddRemLock) {
									menu.newEntry({menuName: subMenuNameInter, entryText, func: () => {
										plman.UndoBackup(ap);
										const handleListA = plman.GetPlaylistItems(ap);
										const handleListAOri = handleListA.Clone().Convert();
										const handleListB = plman.GetPlaylistItems(playlist.index);
										handleListA.Sort();
										handleListB.Sort();
										const intersect = handleListA.Clone();
										intersect.MakeIntersection(handleListB);
										const toAdd = new FbMetadbHandleList();
										handleListAOri.forEach((handle, i) => {if (intersect.BSearch(handle) !== -1) {toAdd.Add(handle);}});
										plman.ClearPlaylist(ap);
										const toAddCount = toAdd.Count;
										const remCount = handleListAOri.Count - toAddCount;
										if (toAddCount) {plman.InsertPlaylistItems(ap, 0, toAdd);}
										if (remCount) {console.log('Removed ' + remCount + ' items.');} else {console.log('No items were removed.');}
									}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
									// Add radio check on current playlist
									if (playlist.index === ap) {menu.newCheckMenu(subMenuNameInter, entryText, entryText, () => 0);}
								}
								if (bDiff && !bAddRemLock) {
									menu.newEntry({menuName: subMenuNameDiff, entryText, func: () => {
										plman.UndoBackup(ap);
										const handleListA = plman.GetPlaylistItems(ap)
										const handleListAOri = handleListA.Clone().Convert();
										const handleListB = plman.GetPlaylistItems(playlist.index);
										handleListA.Sort();
										handleListB.Sort();
										const difference = handleListA.Clone();
										difference.MakeDifference(handleListB);
										const toAdd = new FbMetadbHandleList();
										handleListAOri.forEach((handle, i) => {if (difference.BSearch(handle) !== -1) {toAdd.Add(handle);}});
										plman.ClearPlaylist(ap);
										const toAddCount = toAdd.Count;
										const remCount = handleListAOri.Count - toAddCount;
										if (toAddCount) {plman.InsertPlaylistItems(ap, 0, toAdd);}
										if (remCount) {console.log('Removed ' + remCount + ' items.');} else {console.log('No items were removed.');}
									}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
									// Add radio check on current playlist
									if (playlist.index === ap) {menu.newCheckMenu(subMenuNameDiff, entryText, entryText, () => 0);}
								}
							}
						}
					} else {
						if (bMerge) {menu.newEntry({menuName: subMenuNameMerge, entryText: !bAddLock ? 'No items.' : 'Playlist is locked for adding items.', func: null, flags: MF_GRAYED});}
						if (bInter) {menu.newEntry({menuName: subMenuNameInter, entryText: !bAddRemLock ? 'No items.' : 'Playlist is locked for adding\\removing items.', func: null, flags: MF_GRAYED});}
						if (bDiff) {menu.newEntry({menuName: subMenuNameDiff, entryText: !bAddRemLock ? 'No items.' : 'Playlist is locked for adding\\removing items.', func: null, flags: MF_GRAYED});}
					}
					if (defaultArgs.bProfile) {profiler.Print();}
				}});
			} else {
				menuDisabled.push({menuName: nameMerge, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
				menuDisabled.push({menuName: nameInter, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
				menuDisabled.push({menuName: nameDiff, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
			}
		}
		{	// Send Playlist to Playlist / Close playlist / Go to Playlist
			const nameSend = 'Send playlist\'s tracks to...';
			const nameGo = 'Go to playlist...';
			const nameClose = 'Close playlist...';
			if (!menusEnabled.hasOwnProperty(nameSend) || !menusEnabled.hasOwnProperty(nameGo) || !menusEnabled.hasOwnProperty(nameClose) || menusEnabled[nameSend] === true || menusEnabled[nameGo] === true || menusEnabled[nameClose] === true) {
				if (!menu_properties.hasOwnProperty('playlistSplitSize')) {
					menu_properties['playlistSplitSize'] = ['Playlist lists submenu size', 20];
					// Checks
					menu_properties['playlistSplitSize'].push({greater: 1, func: isInt}, menu_properties['playlistSplitSize'][1]);
				}
				// Bools
				const bSend = !menusEnabled.hasOwnProperty(nameSend) || menusEnabled[nameSend] === true;
				const bGo = !menusEnabled.hasOwnProperty(nameGo) || menusEnabled[nameGo] === true;
				const bClose = !menusEnabled.hasOwnProperty(nameClose) || menusEnabled[nameClose] === true; 
				// Menus
				const subMenuNameSend = bSend ? menu.newMenu(nameSend, menuName) : null;
				if (!bSend) {menuDisabled.push({menuName: nameSend, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				const subMenuNameGo = bGo ? menu.newMenu(nameGo, menuName) : null;
				if (!bGo) {menuDisabled.push({menuName: nameGo, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				const subMenuNameClose = bClose ? menu.newMenu(nameClose, menuName) : null;
				if (!bClose) {menuDisabled.push({menuName: nameClose, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				if (bSend) {
					menu.newEntry({menuName: subMenuNameSend, entryText: 'Sends all tracks from current playlist to:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameSend, entryText: 'sep'});
				}
				if (bGo) {
					menu.newEntry({menuName: subMenuNameGo, entryText: 'Switch to another playlist:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameGo, entryText: 'sep'});
				}
				if (bClose) {
					menu.newEntry({menuName: subMenuNameClose, entryText: 'Close another playlist:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameClose, entryText: 'sep'});
				}
				// Build submenus
				menu.newCondEntry({entryText: 'Send/Go/Close to Playlists...', condFunc: () => {
					if (defaultArgs.bProfile) {var profiler = new FbProfiler('Send/Go/Close to Playlists...');}
					const playlistsNum = plman.PlaylistCount;
					const ap = plman.ActivePlaylist;
					if (playlistsNum && ap !== -1) {
						const bTracks = plman.PlaylistItemCount(ap) !== 0;
						// Split entries in sub-menus if there are too many playlists...
						let ss = menu_properties['playlistSplitSize'][1];
						const sendGoCloseMenu = (index, menuName, obj) => {
							const playlist = {name: plman.GetPlaylistName(index), index};
							const entryText = playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : '')
							if (obj.action === 'send' && !addLock(index)){
								menu.newEntry({menuName, entryText, func: () => {
									plman.UndoBackup(playlist.index);
									plman.InsertPlaylistItems(playlist.index, plman.PlaylistItemCount(playlist.index), plman.GetPlaylistItems(ap));
								}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
							} else if (obj.action === 'go'){
								menu.newEntry({menuName, entryText, func: () => {
									plman.ActivePlaylist = playlist.index;
								}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
							} else if (obj.action === 'close' && !closeLock(index)) { 
								menu.newEntry({menuName, entryText, func: () => {
									plman.RemovePlaylist(playlist.index);
									if (plman.ActivePlaylist === -1 && plman.PlaylistCount !== 0) {plman.ActivePlaylist = plman.PlaylistCount - 1;}
								}});
							} else {return false;}
							// Add radio check on current playlist
							if (index === plman.ActivePlaylist) {menu.newCheckMenu(menuName, entryText, entryText, () => 0);}
							return true;
						};
						[
							{action: 'send', playlistsNum: playlistsNum - playlistCountLocked(['AddItems']), subMenuName: subMenuNameSend, bEnabled: bSend},
							{action: 'go', playlistsNum, subMenuName: subMenuNameGo, bEnabled: bGo},
							{action: 'close', playlistsNum: playlistsNum - playlistCountLocked(['RemovePlaylist']), subMenuName: subMenuNameClose, bEnabled: bClose}
						].forEach((obj) => {
							if (!obj.bEnabled) {return;}
							if (obj.playlistsNum === 0) {
								menu.newEntry({menuName: obj.subMenuName, entryText: 'No items.', func: null, flags: MF_GRAYED});
								return;
							}
							if (obj.action === 'send' && !bTracks) {
								menu.newEntry({menuName: obj.subMenuName, entryText: 'No tracks.', func: null, flags: MF_GRAYED});
								return;
							}
							const splitBy = obj.playlistsNum < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
							if (obj.playlistsNum > splitBy) {
								const subMenusCount = Math.ceil(obj.playlistsNum / splitBy);
								let skipped = 0;
								for (let i = 0; i < subMenusCount; i++) {
									const bottomIdx =  i * splitBy;
									const topIdx = (i + 1) * splitBy - 1;
									// Prefix ID is required to avoid collisions with same sub menu names
									// Otherwise both menus would be called 'Playlist X-Y', leading to bugs (entries duplicated on both places)
									const idx = (obj.action === 'send' 
										? '(Send all to)' 
										: obj.action === 'go'
											? '(Go to)'
											: '(Close)'
									) + ' Playlists ' + bottomIdx + ' - ' + topIdx;
									const subMenu_i = menu.newMenu(idx, obj.subMenuName);
									for (let j = bottomIdx + skipped; j <= topIdx + skipped && j < playlistsNum; j++) {
										if (!sendGoCloseMenu(j, subMenu_i, obj)) {skipped++}
									}
								}
							} else { // Or just show all
								for (let i = 0; i < playlistsNum; i++) {
									sendGoCloseMenu(i, obj.subMenuName, obj);
								}
							}
						});
					} else {
						if (bSend) {menu.newEntry({menuName: subMenuNameSend, entryText: 'No items.', func: null, flags: MF_GRAYED});}
						if (bGo) {menu.newEntry({menuName: subMenuNameGo, entryText: 'No items.', func: null, flags: MF_GRAYED});}
						if (bClose) {menu.newEntry({menuName: subMenuNameClose, entryText: 'No items.', func: null, flags: MF_GRAYED});}
					}
					if (defaultArgs.bProfile) {profiler.Print();}
				}});
				menu.newEntry({menuName, entryText: 'sep'});
			} else {
				menuDisabled.push({menuName: nameSend, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
				menuDisabled.push({menuName: nameGo, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
				menuDisabled.push({menuName: nameClose, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
			}
		}
		{	// Lock / Unlock / Swtich lock playlist
			const nameLock = 'Lock playlist...';
			const nameUnlock = 'Unlock playlist...';
			const nameSwitch = 'Switch lock playlist...';
			if (!menusEnabled.hasOwnProperty(nameLock) || !menusEnabled.hasOwnProperty(nameUnlock)|| !menusEnabled.hasOwnProperty(nameSwitch) || menusEnabled[nameLock] === true || menusEnabled[nameUnlock] === true || menusEnabled[nameSwitch] === true) {
				if (!menu_properties.hasOwnProperty('playlistSplitSize')) {
					menu_properties['playlistSplitSize'] = ['Playlist lists submenu size', 20];
					// Checks
					menu_properties['playlistSplitSize'].push({greater: 1, func: isInt}, menu_properties['playlistSplitSize'][1]);
				}
				// Bools
				const bLock = !menusEnabled.hasOwnProperty(nameLock) || menusEnabled[nameLock] === true;
				const bUnlock = !menusEnabled.hasOwnProperty(nameUnlock) || menusEnabled[nameUnlock] === true;
				const bSwitch = !menusEnabled.hasOwnProperty(nameSwitch) || menusEnabled[nameSwitch] === true;
				// Menus
				const subMenuNameLock = bLock ? menu.newMenu(nameLock, menuName) : null;
				if (!bLock) {menuDisabled.push({menuName: nameLock, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				const subMenuNameUnlock = bUnlock ? menu.newMenu(nameUnlock, menuName) : null;
				if (!bUnlock) {menuDisabled.push({menuName: nameUnlock, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				const subMenuNameSwitch = bSwitch ? menu.newMenu(nameSwitch, menuName) : null;
				if (!bSwitch) {menuDisabled.push({menuName: nameSwitch, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				if (bLock) {
					// menu.newEntry({menuName: subMenuNameLock, entryText: ' add, remove, replace and reorder', func: null, flags: MF_GRAYED});
					const lockTypesMenu = menu.newMenu('Lock playlist (by SMP):', subMenuNameLock);
					menu.newEntry({menuName: lockTypesMenu, entryText: 'With these locks:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: lockTypesMenu, entryText: 'sep'});
					['AddItems', 'RemoveItems', 'ReplaceItems', 'ReorderItems', 'RemovePlaylist'].forEach((lock) => {
						menu.newEntry({menuName: lockTypesMenu, entryText: lock.split(/(\B[A-Z]\w*)/g).join(' '), func: null, flags: MF_GRAYED | MF_CHECKED});
					});
					menu.newEntry({menuName: subMenuNameLock, entryText: 'sep'});
				}
				if (bUnlock) {
					menu.newEntry({menuName: subMenuNameUnlock, entryText: 'Unlock playlist (by SMP):', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameUnlock, entryText: 'sep'});
				}
				if (bSwitch) {
					menu.newEntry({menuName: subMenuNameSwitch, entryText: 'Switch lock playlist (by SMP):', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameSwitch, entryText: 'sep'});
				}
				// Build submenus
				menu.newCondEntry({entryText: 'Lock/Unlock/Switch lock Playlists...', condFunc: () => {
					if (defaultArgs.bProfile) {var profiler = new FbProfiler('Lock/Unlock/Switch lock  Playlists...');}
					const lockTypes = ['AddItems', 'RemoveItems', 'ReplaceItems', 'ReorderItems', 'RemovePlaylist'];
					const playlistsNum = plman.PlaylistCount;
					if (playlistsNum) {
						const lockedPlaylists = playlistCountLocked();
						const nonLockedPlaylists = playlistsNum - lockedPlaylists;
						// Split entries in sub-menus if there are too many playlists...
						let ss = menu_properties['playlistSplitSize'][1];
						const lockUnlockMenu = (index, menuName, obj) => {
							const playlist = {name: plman.GetPlaylistName(index), index};
							const playlistLockTypes = new Set(plman.GetPlaylistLockedActions(index));
							const lockName = plman.GetPlaylistLockName(index);
							const bSMPLock = lockName === 'foo_spider_monkey_panel' || !lockName;
							const bLocked = !bSMPLock || playlistLockTypes.isSuperset(new Set(lockTypes));
							const flags = bSMPLock ? MF_STRING: MF_GRAYED;
							const entryText = playlist.name + (!bSMPLock 
								? ' ' + _p(lockName) 
								: playlistLockTypes.size !== 0 
									? ' (partially locked)'
									: ''
							);
							if ((obj.action === 'lock' || obj.action === 'switch') && !bLocked){
								menu.newEntry({menuName, entryText, func: () => {
									const newLock = [...playlistLockTypes.union(new Set(lockTypes))];
									plman.SetPlaylistLockedActions(index, lockTypes);
								}, flags});
							} else if ((obj.action === 'unlock' || obj.action === 'switch') && bLocked){
								menu.newEntry({menuName, entryText, func: () => {
									const newLock = [...playlistLockTypes.difference(new Set(lockTypes))];
									plman.SetPlaylistLockedActions(index, newLock);
								}, flags});
							} else {return false;}
							// Add radio check on current playlist
							if (index === plman.ActivePlaylist) {menu.newCheckMenu(menuName, entryText, entryText, () => 0);}
							return true;
						};
						[
							{action: 'lock', playlistsNum: nonLockedPlaylists, subMenuName: subMenuNameLock, bEnabled: bLock},
							{action: 'unlock', playlistsNum: lockedPlaylists, subMenuName: subMenuNameUnlock, bEnabled: bUnlock},
							{action: 'switch', playlistsNum, subMenuName: subMenuNameSwitch, bEnabled: bSwitch}
						].forEach((obj) => {
							if (!obj.bEnabled) {return;}
							if (obj.playlistsNum === 0) {
								menu.newEntry({menuName: obj.subMenuName, entryText: 'No items.', func: null, flags: MF_GRAYED});
								return;
							}
							let bSomeEntry = false;
							const splitBy = obj.playlistsNum < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
							if (obj.playlistsNum > splitBy) {
								const subMenusCount = Math.ceil(obj.playlistsNum / splitBy);
								let skipped = 0;
								for (let i = 0; i < subMenusCount; i++) {
									const bottomIdx =  i * splitBy;
									const topIdx = (i + 1) * splitBy - 1;
									// Prefix ID is required to avoid collisions with same sub menu names
									// Otherwise both menus would be called 'Playlist X-Y', leading to bugs (entries duplicated on both places)
									const idx = (obj.action === 'lock' 
										? '(Lock)' 
										: obj.action === 'switch'
											? '(Switch)'
											: '(Unlock)'
									) + ' Playlists ' + bottomIdx + ' - ' + topIdx;
									const subMenu_i = menu.newMenu(idx, obj.subMenuName);
									for (let j = bottomIdx + skipped; j <= topIdx + skipped && j < playlistsNum; j++) {
										if (!lockUnlockMenu(j, subMenu_i, obj)) {skipped++}
										else {bSomeEntry = true;}
									}
								}
							} else { // Or just show all
								for (let i = 0; i < playlistsNum; i++) {
									if (lockUnlockMenu(i, obj.subMenuName, obj)) {bSomeEntry = true;}
								}
							}
							if (bSomeEntry) {menu.newEntry({menuName: obj.subMenuName, entryText: 'sep'});}
							{
								const playlistLockTypes = new Set(plman.GetPlaylistLockedActions(plman.ActivePlaylist));
								const lockName = plman.GetPlaylistLockName(plman.ActivePlaylist);
								const bSMPLock = lockName === 'foo_spider_monkey_panel' || !lockName;
								const bLocked = !bSMPLock || playlistLockTypes.isSuperset(new Set(lockTypes));
								const flags = obj.action === 'lock' && bLocked
									? MF_GRAYED
									: obj.action === 'unlock' && !bLocked
										? MF_GRAYED
										: MF_STRING;
								menu.newEntry({menuName: obj.subMenuName, entryText: 'Active playlist', func: () => {
									const ap = plman.ActivePlaylist;
									if (ap === -1) {return;}
									if ((obj.action === 'lock' || obj.action === 'switch') && !bLocked){
											plman.SetPlaylistLockedActions(ap, lockTypes);
									} else if ((obj.action === 'unlock' || obj.action === 'switch') && bLocked){
											const newLock = [...playlistLockTypes.difference(new Set(lockTypes))];
											plman.SetPlaylistLockedActions(ap, newLock);
									}
								}, flags});
							}
						});
					} else {
						if (bLock) {menu.newEntry({menuName: subMenuNameLock, entryText: 'No items.', func: null, flags: MF_GRAYED});}
						if (bUnlock) {menu.newEntry({menuName: subMenuNameUnlock, entryText: 'No items.', func: null, flags: MF_GRAYED});}
						if (bSwitch) {menu.newEntry({menuName: subMenuNameSwitch, entryText: 'No items.', func: null, flags: MF_GRAYED});}
					}
					if (defaultArgs.bProfile) {profiler.Print();}
				}});
			} else {
				menuDisabled.push({menuName: nameLock, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
				menuDisabled.push({menuName: nameUnlock, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
				menuDisabled.push({menuName: nameSwitch, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
			}
		}
	} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}