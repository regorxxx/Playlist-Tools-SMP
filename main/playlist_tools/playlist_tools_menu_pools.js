'use strict';
//26/09/25

/* global menusEnabled:readable, readmes:readable, menu:readable, newReadmeSep:readable, scriptName:readable, defaultArgs:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, menu_properties:writable, overwriteMenuProperties:readable, forcedQueryMenusEnabled:readable, menu_panelProperties:readable, configMenu:readable, isPlayCount:readable, createSubMenuEditEntries:readable, stripSort:readable */

/* global MF_GRAYED:readable, MF_MENUBARBREAK:readable, folders:readable, _isFile:readable, clone:readable, MF_STRING:readable, isJSON:readable, Input:readable,isBoolean:readable, isStringWeak:readable */

// Pools
{
	const scriptPath = folders.xxx + 'main\\pools\\pools.js';
	/* global _pools:readable */
	if (_isFile(scriptPath)) {
		const name = 'Pools';
		if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
			include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
			include(scriptPath.replace(folders.xxx + 'main\\', '..\\').replace('pools.js', 'pools_presets.js'));
			/* global createPoolPresets:readable */
			readmes[newReadmeSep()] = 'sep';
			readmes[name] = folders.xxx + 'helpers\\readme\\playlist_tools_menu_pools.txt';
			readmes[name + ' (allowed keys)'] = folders.xxx + '\\presets\\Playlist Tools\\pools\\allowedKeys.txt';
			// Other properties
			if (!Object.hasOwn(menu_properties, 'bSmartShuffleAdvc')) {
				menu_properties['bSmartShuffleAdvc'] = ['Smart shuffle extra conditions', true, { func: isBoolean }, true];
			}
			if (!Object.hasOwn(menu_properties, 'smartShuffleSortBias')) {
				menu_properties['smartShuffleSortBias'] = ['Smart shuffle sorting bias', 'random', { func: isStringWeak }, 'random'];
			}
			forcedQueryMenusEnabled[name] = true;
			const bEnableSearchDistance = (!Object.hasOwn(menusEnabled, name + ' (Music Map)') || menusEnabled[name + ' (Music Map)']) && typeof sbd !== 'undefined';
			const plsManHelper = folders.xxx + 'main\\playlist_manager\\playlist_manager_helpers.js';
			if (_isFile(plsManHelper)) { include(plsManHelper.replace(folders.xxx + 'main\\', '..\\')); }
			const bEnablePlsMan = typeof loadPlaylistsFromFolder !== 'undefined';
			const poolsGen = new _pools({
				sortBias: defaultArgs.sortBias,
				checkDuplicatesBy: defaultArgs.checkDuplicatesBy,
				bAdvTitle: defaultArgs.bAdvTitle,
				bMultiple: defaultArgs.bMultiple,
				bAdvancedShuffle: menu_properties.bSmartShuffleAdvc[1],
				smartShuffleSortBias: menu_properties.smartShuffleSortBias[1],
				keyTag: defaultArgs.keyTag,
				bEnableSearchDistance,
				bEnablePlsMan,
				playlistPath: bEnablePlsMan ? JSON.parse(menu_panelProperties.playlistPath[1]) : [],
				bDebug: defaultArgs.bDebug,
				bProfile: defaultArgs.bProfile,
				title: 'Playlist Tools'
			});
			{	// Pools
				const menuName = menu.newMenu(name);
				let pools = createPoolPresets({ size: defaultArgs.playlistLength });
				let selArg = { ...clone(pools[0]), name: 'Custom' };
				const poolsDefaults = [...pools];
				// Create new properties with previous args
				menu_properties['pools'] = [name + ' entries', JSON.stringify(pools)];
				menu_properties['poolsCustomArg'] = [name + '\\Custom pool args', JSON.stringify(selArg)];
				// Checks
				menu_properties['pools'].push({ func: isJSON }, menu_properties['pools'][1]);
				menu_properties['poolsCustomArg'].push({ func: isJSON }, menu_properties['poolsCustomArg'][1]);
				// Menus
				menu.newEntry({ menuName, entryText: 'Use Playlists / Queries as pools:', func: null, flags: MF_GRAYED });
				menu.newSeparator(menuName);
				menu.newCondEntry({
					entryText: 'Pools (cond)', condFunc: () => {
						// On first execution, must update from property
						selArg = JSON.parse(menu_properties['poolsCustomArg'][1]);
						// Entry list
						pools = JSON.parse(menu_properties['pools'][1]);
						const entryNames = new Set();
						const folderCount = {};
						pools.forEach((poolObj) => {
							// Add submenus
							let subMenu = Object.hasOwn(poolObj, 'folder')
								? menu.findOrNewMenu(poolObj.folder, menuName)
								: menuName;
							if (Object.hasOwn(poolObj, 'subFolder')) {
								subMenu = menu.findOrNewMenu(poolObj.subFolder, subMenu);
							}
							if (Object.hasOwn(folderCount, subMenu)) { folderCount[subMenu]++; }
							else { folderCount[subMenu] = 0; }
							// Add separators
							if (menu.isSeparator(poolObj)) {
								menu.newSeparator(subMenu);
							} else {
								// Create names for all entries
								const poolName = (poolObj.name || '').cut(30);
								if (entryNames.has(poolName)) {
									fb.ShowPopupMessage('There is an entry with duplicated name:\t' + poolName + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(poolObj, null, '\t'), scriptName + ': ' + name);
									return;
								} else { entryNames.add(poolName); }
								// Global forced query
								const pool = clone(poolObj.pool);
								if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) {
									Object.keys(pool.query).forEach((key) => { // With forced query enabled
										if (pool.query[key].length && pool.query[key].toUpperCase() !== 'ALL') { // ALL query never uses forced query!
											const queryNoSort = stripSort(pool.query[key]);
											const sortedBy = pool.query[key] === queryNoSort
												? ''
												: pool.query[key].replace(queryNoSort, ''); // Includes space at left
											pool.query[key] = '(' + queryNoSort + ') AND (' + defaultArgs.forcedQuery + ')' + sortedBy;
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
								menu.newEntry({
									menuName: subMenu, entryText: poolName, func: () => {
										poolsGen.changeConfig({
											sortBias: defaultArgs.sortBias,
											checkDuplicatesBy: defaultArgs.checkDuplicatesBy,
											bAdvTitle: defaultArgs.bAdvTitle,
											bAdvancedShuffle: menu_properties.bSmartShuffleAdvc[1],
											smartShuffleSortBias: menu_properties.smartShuffleSortBias[1],
											keyTag: defaultArgs.keyTag,
											playlistPath: JSON.parse(menu_panelProperties.playlistPath[1]),
											bDebug: defaultArgs.bDebug,
											bProfile: defaultArgs.bProfile
										}).processPool(pool, menu_properties);
									},
									flags: folderCount[subMenu] % 10 === 0 && folderCount[subMenu] !== 0 ? MF_MENUBARBREAK : MF_STRING
								});
							}
						});
						menu.newSeparator(menuName);
						{ // Static menu: user configurable
							menu.newEntry({
								menuName, entryText: 'Custom pool...', func: () => {
									// Input
									const input = poolsGen.inputPool(selArg.pool);
									if (!input) { return; }
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
									poolsGen.changeConfig({
										sortBias: defaultArgs.sortBias,
										checkDuplicatesBy: defaultArgs.checkDuplicatesBy,
										bAdvTitle: defaultArgs.bAdvTitle,
										bAdvancedShuffle: menu_properties.bSmartShuffleAdvc[1],
										smartShuffleSortBias: menu_properties.smartShuffleSortBias[1],
										keyTag: defaultArgs.keyTag,
										playlistPath: JSON.parse(menu_panelProperties.playlistPath[1]),
										bDebug: defaultArgs.bDebug,
										bProfile: defaultArgs.bProfile
									}).processPool(pool, menu_properties);
									// For internal use original object
									selArg = { name: 'Custom', ...input };
									menu_properties['poolsCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
									overwriteMenuProperties(); // Updates panel
								}
							});
							// Menu to configure property
							menu.newSeparator(menuName);
						}
						{	// Add / Remove
							createSubMenuEditEntries(menuName, {
								name,
								list: pools,
								propName: 'pools',
								defaults: poolsDefaults,
								defaultPreset: folders.xxx + 'presets\\Playlist Tools\\pools\\default.json',
								input: poolsGen.inputPool,
								bDefaultFile: true,
								bUseFolders: true
							});
						}
					}
				});
				menu.newCondEntry({
					entryText: 'Get playlist manager path (cond)', condFunc: () => {
						window.NotifyOthers('Playlist-Manager-SMP: playlistPath', null); // Ask to share paths
						poolsGen.changeConfig({ bEnablePlsMan: _isFile(plsManHelper) }); // Safety check
					}
				});
			}
			if (bEnableSearchDistance) {	// SBD Pools
				const menuName = menu.newMenu(name + ' (Music Map)');
				const musicGraphPools = [];
				const scriptPathGraph = folders.xxx + 'main\\music_graph\\music_graph_descriptors_xxx.js';
				if (_isFile(scriptPathGraph)) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\').replace('pools.js', 'pools_presets_musicgraph.js'));
					/* global createPoolMusicGraphPresets:readable, music_graph_descriptors:readable */
					createPoolMusicGraphPresets({ size: defaultArgs.playlistLength })
						.forEach((pool) => {
							delete pool.folder;
							musicGraphPools.push(pool);
						});
				}
				// Menus
				menu.newEntry({ menuName, entryText: 'Use Music Map mixes as pools:', func: null, flags: MF_GRAYED });
				menu.newSeparator(menuName);
				menu.newCondEntry({
					entryText: 'Pools (cond)', condFunc: () => {
						const entryNames = new Set();
						let bSbdSufFolders = false;
						const folderCount = {};
						musicGraphPools.forEach((poolObj) => {
							// Add submenus
							let subMenu = Object.hasOwn(poolObj, 'folder')
								? menu.findOrNewMenu(poolObj.folder, menuName)
								: menuName;
							if (Object.hasOwn(poolObj, 'subFolder')) {
								if (!bSbdSufFolders && musicGraphPools.includes(poolObj)) {
									music_graph_descriptors.style_cluster_groups.forEach((group) => menu.findOrNewMenu(group, subMenu));
									bSbdSufFolders = true;
								}
								subMenu = menu.findOrNewMenu(poolObj.subFolder, subMenu);
							}
							if (Object.hasOwn(folderCount, subMenu)) { folderCount[subMenu]++; }
							else { folderCount[subMenu] = 0; }
							// Add separators
							if (menu.isSeparator(poolObj)) {
								menu.newSeparator(subMenu);
							} else {
								// Create names for all entries
								const poolName = (poolObj.name || '').cut(30);
								if (entryNames.has(poolName)) {
									fb.ShowPopupMessage('There is an entry with duplicated name:\t' + poolName + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(poolObj, null, '\t'), scriptName + ': ' + name);
									return;
								} else { entryNames.add(poolName); }
								// Global forced query
								const pool = clone(poolObj.pool);
								if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) {
									Object.keys(pool.query).forEach((key) => { // With forced query enabled
										if (pool.query[key].length && pool.query[key].toUpperCase() !== 'ALL') { // ALL query never uses forced query!
											const queryNoSort = stripSort(pool.query[key]);
											const sortedBy = pool.query[key] === queryNoSort
												? ''
												: pool.query[key].replace(queryNoSort, ''); // Includes space at left
											pool.query[key] = '(' + queryNoSort + ') AND (' + defaultArgs.forcedQuery + ')' + sortedBy;
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
								menu.newEntry({
									menuName: subMenu, entryText: poolName, func: () => {
										poolsGen.changeConfig({
											sortBias: defaultArgs.sortBias,
											checkDuplicatesBy: defaultArgs.checkDuplicatesBy,
											bAdvTitle: defaultArgs.bAdvTitle,
											bAdvancedShuffle: menu_properties.bSmartShuffleAdvc[1],
											smartShuffleSortBias: menu_properties.smartShuffleSortBias[1],
											keyTag: defaultArgs.keyTag,
											playlistPath: JSON.parse(menu_panelProperties.playlistPath[1]),
											bDebug: defaultArgs.bDebug,
											bProfile: defaultArgs.bProfile
										}).processPool(pool, menu_properties);
									},
									flags: folderCount[subMenu] % 10 === 0 && folderCount[subMenu] !== 0 ? MF_MENUBARBREAK : MF_STRING
								});
							}
						});
					}
				});
			} else {
				menuDisabled.push({ menuName: name + ' (Music Map)', subMenuFrom: name, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true });
			}
			if (!Object.hasOwn(menusEnabled, configMenu) || menusEnabled[configMenu] === true) {
				const subMenuName = 'Smart shuffle';
				if (!menu.hasMenu(subMenuName, configMenu)) {
					menu.newMenu(subMenuName, configMenu);
					{	// bSmartShuffleAdvc
						menu.newEntry({ menuName: subMenuName, entryText: 'For any tool which uses Smart Shuffle:', func: null, flags: MF_GRAYED });
						menu.newSeparator(subMenuName);
						menu.newEntry({
							menuName: subMenuName, entryText: 'Enable extra conditions', func: () => {
								menu_properties.bSmartShuffleAdvc[1] = !menu_properties.bSmartShuffleAdvc[1];
								if (menu_properties.bSmartShuffleAdvc[1]) {
									fb.ShowPopupMessage(
										'Smart shuffle will also try to avoid consecutive tracks with these conditions:' +
										'\n\t-Instrumental tracks.' +
										'\n\t-Live tracks.' +
										'\n\t-Female/male vocals tracks.' +
										'\n\nThese rules apply in addition to the main smart shuffle, swapping tracks' +
										'\nposition whenever possible without altering the main logic.'
										, scriptName + ': ' + configMenu
									);
								}
								overwriteMenuProperties(); // Updates panel
							}
						});
						menu.newCheckMenu(subMenuName, 'Enable extra conditions', void (0), () => { return menu_properties.bSmartShuffleAdvc[1]; });
						{
							const subMenuNameSecond = menu.newMenu('Sorting bias', subMenuName);
							const options = [
								{ key: 'Random', flags: MF_STRING },
								{ key: 'Play count', flags: isPlayCount ? MF_STRING : MF_GRAYED, req: 'foo_playcount' },
								{ key: 'Rating', flags: MF_STRING },
								{ key: 'Popularity', flags: utils.GetPackageInfo('{F5E9D9EB-42AD-4A47-B8EE-C9877A8E7851}') ? MF_STRING : MF_GRAYED, req: 'Find & Play' },
								{ key: 'Last played', flags: isPlayCount ? MF_STRING : MF_GRAYED, req: 'foo_playcount' },
								{ key: 'Key', flags: MF_STRING },
								{ key: 'Key 6A centered', flags: MF_STRING },
							];
							menu.newEntry({ menuName: subMenuNameSecond, entryText: 'Prioritize tracks by:', flags: MF_GRAYED });
							menu.newSeparator(subMenuNameSecond);
							options.forEach((opt) => {
								const tf = opt.key.replace(/ /g, '').toLowerCase();
								menu.newEntry({
									menuName: subMenuNameSecond, entryText: opt.key + (opt.flags ? '\t' + opt.req : ''), func: () => {
										menu_properties.smartShuffleSortBias[1] = tf;
										overwriteMenuProperties(); // Updates panel
									}, flags: opt.flags
								});
							});
							menu.newSeparator(subMenuNameSecond);
							menu.newEntry({
								menuName: subMenuNameSecond, entryText: 'Custom TF...', func: () => {
									const input = Input.string('string', menu_properties.smartShuffleSortBias[1], 'Enter TF expression:', scriptName + ': ' + name, menu_properties.smartShuffleSortBias[3]);
									if (input === null) { return; }
									menu_properties.smartShuffleSortBias[1] = input;
									overwriteMenuProperties(); // Updates panel
								}
							});
							menu.newCheckMenu(subMenuNameSecond, options[0].key, 'Custom TF...', () => {
								const idx = options.findIndex((opt) => opt.key.replace(/ /g, '').toLowerCase() === menu_properties.smartShuffleSortBias[1]);
								return idx !== -1 ? idx : options.length;
							});
						}
					}
					menu.newSeparator(configMenu);
				}
				menu.newSeparator();
			} else { menuDisabled.push({ menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); } // NOSONAR
		} else { menuDisabled.push({ menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
	}
}