'use strict';
//15/11/24

/* global menusEnabled:readable, readmes:readable, menu:readable, newReadmeSep:readable, scriptName:readable, defaultArgs:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, menu_properties:writable, overwriteMenuProperties:readable, configMenu:readable, specialMenu:readable, deferFunc:readable, menu_propertiesBack:readable */

/* global MF_GRAYED:readable, folders:readable, _isFile:readable,  isStringWeak:readable, isBoolean:readable, MF_STRING:readable, isPlayCount:readable, Input:readable, doOnce:readable, debounce:readable, globQuery:readable, globQuery:readable, _deleteFile:readable, capitalize:readable, capitalizeAll:readable, focusFlags:readable, popup:readable, WshShell:readable, isFoobarV2:readable, isArrayEqual:readable, _explorer:readable, _run:readable, _copyFile:readable, _open:readable, utf8:readable, _p:readable */

// Similar by...Graph\Dyngenre\Weight
{
	const scriptPath = folders.xxx + 'main\\search_by_distance\\search_by_distance.js';
	/* global SearchByDistance_properties:readable, updateCache:readable, sbd:readable, findStyleGenresMissingGraphCheck:readable, searchByDistance:readable, findStyleGenresMissingGraph:readable, music_graph_descriptors_culture:readable, graphDebug:readable, testGraphNodes:readable, testGraphNodeSets:readable, cacheLink:writable, cacheLinkSet:writable, tagsCache:readable */ // eslint-disable-line no-unused-vars
	if (_isFile(scriptPath)) {
		if (!Object.hasOwn(menusEnabled, specialMenu) || menusEnabled[specialMenu] === true) {
			include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
			readmes[newReadmeSep()] = 'sep';
			readmes['Search similar by... (main)'] = folders.xxx + 'helpers\\readme\\search_by_distance.txt';
			readmes['Search similar by... (recipes\\themes)'] = folders.xxx + 'helpers\\readme\\search_by_distance_recipes_themes.txt';
			readmes['Search similar by... (similar artists)'] = folders.xxx + 'helpers\\readme\\search_by_distance_similar_artists.txt';
			readmes['Search similar by... (user descriptors)'] = folders.xxx + 'helpers\\readme\\search_by_distance_user_descriptors.txt';
			readmes['Search similar by Graph'] = folders.xxx + 'helpers\\readme\\search_by_distance_graph.txt';
			readmes['Search similar by Dyngenre'] = folders.xxx + 'helpers\\readme\\search_by_distance_dyngenre.txt';
			readmes['Search similar by Weight'] = folders.xxx + 'helpers\\readme\\search_by_distance_weight.txt';
			// Delete unused properties
			const toDelete = ['forcedQuery', 'bUseAntiInfluencesFilter', 'bUseInfluencesFilter', 'scoreFilter', 'graphDistance', 'method', 'bNegativeWeighting', 'poolFilteringTag', 'poolFilteringN', 'bRandomPick', 'bInversePick', 'probPick', 'playlistLength', 'bSortRandom', 'bScatterInstrumentals', 'bProgressiveListOrder', 'bInverseListOrder', 'bInKeyMixingPlaylist', 'bProgressiveListCreation', 'ProgressiveListCreationN', 'bAdvTitle', 'checkDuplicatesByTag', 'bSmartShuffle', 'bSmartShuffleAdvc', 'smartShuffleSortBias', 'artistRegionFilter', 'genreStyleRegionFilter'];
			let toMerge = {}; // Deep copy
			Object.keys(SearchByDistance_properties).forEach((key) => {
				if (toDelete.indexOf(key) === -1) {
					toMerge[key] = [...SearchByDistance_properties[key]];
					toMerge[key][0] = '\'Search similar\' ' + toMerge[key][0];
				}
			});
			// Run once at startup
			deferFunc.push({
				name: 'Search by Distance initialization', func: () => {
					// Update cache with user set tags and genre/style check
					doOnce('Update SBD cache', debounce(updateCache, 3000))({ properties: menu_properties });
					if (!sbd.panelProperties.firstPopup[1]) {
						doOnce('findStyleGenresMissingGraphCheck', debounce(findStyleGenresMissingGraphCheck, 500))(menu_properties);
					}
				}
			});
			// And merge
			menu_properties = { ...menu_properties, ...toMerge }; // NOSONAR [global]
			// Other properties
			if (!Object.hasOwn(menu_properties, 'bSmartShuffleAdvc')) {
				menu_properties['bSmartShuffleAdvc'] = ['Smart shuffle extra conditions', true, { func: isBoolean }, true];
			}
			if (!Object.hasOwn(menu_properties, 'smartShuffleSortBias')) {
				menu_properties['smartShuffleSortBias'] = ['Smart shuffle sorting bias', 'random', { func: isStringWeak }, 'random'];
			}
			// Set default args
			const scriptDefaultArgs = { properties: menu_properties, bNegativeWeighting: true, bUseAntiInfluencesFilter: false, bUseInfluencesFilter: false, method: '', scoreFilter: 70, graphDistance: 100, poolFilteringTag: [], poolFilteringN: -1, bPoolFiltering: false, bRandomPick: true, bInversePick: false, probPick: 100, bSortRandom: false, bProgressiveListOrder: false, bInverseListOrder: false, bScatterInstrumentals: false, bSmartShuffle: true, bSmartShuffleAdvc: menu_properties.bSmartShuffleAdvc[1], smartShuffleSortBias: menu_properties.smartShuffleSortBias[1], artistRegionFilter: -1, bInKeyMixingPlaylist: false, bProgressiveListCreation: false, progressiveListCreationN: 1, bCreatePlaylist: true };
			// Menus
			const loadMenus = (menuName, selArgs, entryArgs = []) => {
				selArgs.forEach((selArg) => {
					if (menu.isSeparator(selArg)) {
						let entryMenuName = Object.hasOwn(selArg, 'menu') ? selArg.menu : menuName;
						menu.newSeparator(entryMenuName);
					} else {
						const entryArg = entryArgs.find((item) => { return item.name === selArg.name; }) || {};
						let entryText = selArg.name;
						menu.newEntry({
							menuName, entryText, func: (args = { ...scriptDefaultArgs, ...defaultArgs, ...selArg.args, ...entryArg.args }) => {
								const globQuery = args.properties['forcedQuery'][1];
								if (Object.hasOwn(args, 'forcedQuery') && globQuery.length && args['forcedQuery'] !== globQuery) { // Join queries if needed
									args['forcedQuery'] = globQuery + ' AND ' + args['forcedQuery'];
								}
								// Set default values for tags
								const tags = JSON.parse(menu_properties.tags[1]);
								for (let key in tags) { tags[key].weight = 0; }
								for (let key in tags) {
									args.tags[key] = { ...tags[key], ...args.tags[key] };
								}
								searchByDistance(args);
							}, flags: focusFlags
						});
					}
				});
			};
			{	// -> Special playlists
				menu.newEntry({ menuName: specialMenu, entryText: 'Based on Search by Distance:', func: null, flags: MF_GRAYED });
				const selArgs = [
					{ name: 'sep' },
					{
						name: 'Influences from any date',
						args: {
							tags: { genre: { weight: 5 }, style: { weight: 5 }, mood: { weight: 15 }, key: { weight: 10 }, date: { weight: 0 }, bpm: { weight: 10 } },
							bUseInfluencesFilter: true, probPick: 100, scoreFilter: 40, graphDistance: 500, method: 'GRAPH'
						}
					},
					{
						name: 'Influences within 20 years',
						args: {
							tags: { genre: { weight: 5 }, style: { weight: 5 }, mood: { weight: 15 }, key: { weight: 10 }, date: { weight: 10, range: 20 }, bpm: { weight: 10 } },
							bUseInfluencesFilter: true, probPick: 100, scoreFilter: 40, graphDistance: 500, method: 'GRAPH'
						}
					},
					{ name: 'sep' },
					{
						name: 'Progressive playlist by genre/styles',
						args: {
							tags: { genre: { weight: 15 }, style: { weight: 5 }, mood: { weight: 30 }, key: { weight: 10 }, date: { weight: 5, range: 35 }, bpm: { weight: 10 } },
							probPick: 100, scoreFilter: 70, graphDistance: 200, method: 'GRAPH', bProgressiveListCreation: true, progressiveListCreationN: 3
						}
					},
					{
						name: 'Progressive playlist by mood',
						args: {
							tags: { genre: { weight: 20 }, style: { weight: 20 }, mood: { weight: 5 }, key: { weight: 20 }, date: { weight: 0 }, bpm: { weight: 0 } },
							probPick: 100, scoreFilter: 60, graphDistance: 300, method: 'GRAPH', bProgressiveListCreation: true, progressiveListCreationN: 3
						}
					},
					{ name: 'sep' },
					{
						name: 'Harmonic mix with similar genre/styles',
						args: {
							tags: { dynGenre: { weight: 20, range: 2 }, genre: { weight: 15 }, style: { weight: 15 }, mood: { weight: 0 }, key: { weight: 0 }, date: { weight: 5, range: 25 }, bpm: { weight: 0 } },
							probPick: 100, scoreFilter: 70, method: 'DYNGENRE', bInKeyMixingPlaylist: true
						}
					},
					{
						name: 'Harmonic mix with similar moods',
						args: {
							tags: { dynGenre: { weight: 10, range: 3 }, genre: { weight: 5 }, style: { weight: 5 }, mood: { weight: 35 }, key: { weight: 0 }, date: { weight: 5, range: 35 }, bpm: { weight: 0 } },
							probPick: 100, scoreFilter: 70, method: 'DYNGENRE', bInKeyMixingPlaylist: true
						}
					},
					{
						name: 'Harmonic mix with similar instrumental tracks',
						args: {
							tags: { dynGenre: { weight: 10, range: 3 }, genre: { weight: 5 }, style: { weight: 5 }, mood: { weight: 15 }, key: { weight: 0 }, date: { weight: 5, range: 35 }, bpm: { weight: 0 } },
							probPick: 100, scoreFilter: 70, method: 'DYNGENRE', bInKeyMixingPlaylist: true, forcedQuery: globQuery.instrumental
						}
					}
				];
				// Menus
				loadMenus(specialMenu, selArgs);
			}
			{	// -> Config menu
				if (!Object.hasOwn(menusEnabled, configMenu) || menusEnabled[configMenu] === true) {
					{
						const subMenu = menu.newMenu('Search by Distance', configMenu);
						{ 	// Find genre/styles not on graph
							menu.newEntry({
								menuName: subMenu, entryText: 'Find genres/styles not on Graph', func: () => {
									const tags = JSON.parse(menu_properties.tags[1]);
									findStyleGenresMissingGraph({
										genreStyleFilter: JSON.parse(menu_properties.genreStyleFilterTag[1]).filter(Boolean),
										genreStyleTag: Object.values(tags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity),
										bAscii: menu_properties.bAscii[1],
										bPopup: true
									});
								}
							});
							// Graph debug
							menu.newEntry({
								menuName: subMenu, entryText: 'Debug Graph (check console)', func: () => {
									const profiler = defaultArgs.bProfile ? new FbProfiler('graphDebug') : null;
									graphDebug(sbd.allMusicGraph, true); // Show popup on pass
									music_graph_descriptors_culture.debug(sbd.allMusicGraph);
									if (defaultArgs.bProfile) { profiler.Print(); }
								}
							});
							// Graph test
							menu.newEntry({
								menuName: subMenu, entryText: 'Run distance tests (check console)', func: () => {
									const profiler = defaultArgs.bProfile ? new FbProfiler('testGraph') : null;
									[testGraphNodes, testGraphNodeSets, music_graph_descriptors_culture.distanceDebug].forEach((f, i) => {
										console.log('-'.repeat(60) + '-> Test ' + _p(i + 1));
										f(sbd.allMusicGraph);
									});
									if (defaultArgs.bProfile) { profiler.Print(); }
								}
							});
							menu.newSeparator(subMenu);
							// Graph cache reset Async
							menu.newEntry({
								menuName: subMenu, entryText: () => 'Reset link cache' + (sbd.isCalculatingCache ? '\t -processing-' : ''), func: () => {
									if (sbd.isCalculatingCache) {
										fb.ShowPopupMessage('There is a calculation currently on process.\nTry again after it finishes. Check console (or animation).', 'Graph cache');
										return;
									}
									_deleteFile(folders.data + 'searchByDistance_cacheLink.json');
									_deleteFile(folders.data + 'searchByDistance_cacheLinkSet.json');
									cacheLink = void (0); // NOSONAR [global]
									cacheLinkSet = void (0); // NOSONAR [global]
									updateCache({ bForce: true, properties: menu_properties }); // Creates new one and also notifies other panels to discard their cache
								}, flags: () => !sbd.isCalculatingCache ? MF_STRING : MF_GRAYED
							});
						}
						menu.newSeparator(subMenu);
						{
							const submenuTwo = menu.newMenu('Tag remapping', subMenu);
							{	// Menu to configure tags
								menu.newEntry({ menuName: submenuTwo, entryText: 'Tag remapping (only this tool):', func: null, flags: MF_GRAYED });
								menu.newSeparator(submenuTwo);
								menu.newCondEntry({
									entryText: 'Tags (cond)', condFunc: () => {
										const tags = JSON.parse(menu_properties.tags[1]);
										const options = [...Object.keys(tags)];
										// Create menu on 2 places: tool config submenu and global tag submenu
										const configMenuTag = menu.findOrNewMenu('Tag remapping', configMenu);
										menu.newSeparator(configMenuTag);
										const configSubmenu = menu.newMenu(subMenu + '...', configMenuTag);
										options.forEach((key) => {
											const tag = tags[key];
											const value = tag.tf.join(',');
											const keyFormat = new Set(['dynGenre']).has(key)
												? capitalize(key)
												: capitalizeAll(key.replace(/(Genre|Style)/g, '/$1').replace(/(Region)/g, ' $1'), [' ', '/', '\\']);
											const entryText = keyFormat + '\t[' + (
												typeof value === 'string' && value.length > 10
													? value.slice(0, 10) + '...'
													: value
											) + ']';
											[configSubmenu, submenuTwo].forEach((sm) => {
												if (!tag.type.includes('virtual') || tag.type.includes('tfRemap')) {
													menu.newEntry({
														menuName: sm, entryText, func: () => {
															const example = '["GENRE","LASTFM_GENRE","GENRE2"]';
															const input = Input.json('array strings', tag.tf, 'Enter tag(s) or TF expression(s): (JSON)\n\nFor example:\n' + example, 'Search by distance', example, void (0), true);
															if (input === null) { return; }
															if (Object.hasOwn(defaultArgs, key)) { defaultArgs[key] = input; }
															tag.tf = input;
															menu_properties.tags[1] = JSON.stringify(tags);
															overwriteMenuProperties(); // Updates panel
															if (tag.type.includes('graph')) {
																const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
																if (answer === popup.yes) {
																	menu.btn_up(void (0), void (0), void (0), 'Search by Distance\\Reset link cache');
																}
															}
														}
													});
												} else {
													menu.newEntry({ menuName: sm, entryText: keyFormat + '\t[virtual]', flags: MF_GRAYED });
												}
											});
										});
										[configSubmenu, submenuTwo].forEach((sm) => {
											menu.newSeparator(sm);
											{	// Cache
												const options = ['bAscii', 'bTagsCache'];
												options.forEach((key) => {
													const propObj = key === 'bTagsCache' ? sbd.panelProperties : menu_properties;
													const keyText = propObj[key][0];
													const entryText = (keyText.substring(keyText.indexOf('.') + 1) + (key === 'bTagsCache' && !isFoobarV2 ? '\t-only Fb >= 2.0-' : '')).replace('\'Search similar\' ', '');
													menu.newEntry({
														menuName: sm, entryText, func: () => {
															propObj[key][1] = !propObj[key][1];
															overwriteMenuProperties(); // Updates panel
															if (key === 'bAscii') {
																const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
																if (answer === popup.yes) {
																	menu.btn_up(void (0), void (0), void (0), 'Search by Distance\\Reset link cache');
																}
															} else if (key === 'bTagsCache') {
																if (propObj.bTagsCache[1]) {
																	fb.ShowPopupMessage(
																		'This feature should only be enabled on Foobar2000 versions >= 2.0 32 bit.' +
																		'\n\nPrevious versions already cached tags values, thus not requiring it. Only enable it in case low memory mode is used, if better performance is desired. See:\n' +
																		'https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Version_2.0_Beta_Change_Log#Beta_20' +
																		'\n\nWarning: it may behave badly on really big libraries (+100K tracks) or if thousands of tracks are tagged/edited at the same time.\nIf you experience crashes or RAM allocation failures, disable it.'
																		, 'Tags cache');
																	tagsCache.load();
																	const answer = WshShell.Popup('Reset tags cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
																	if (answer === popup.yes) {
																		menu.btn_up(void (0), void (0), void (0), 'Search by Distance\\Reset tags cache');
																	}
																} else {
																	tagsCache.unload();
																}
															}
														}, flags: key === 'bTagsCache' && !isFoobarV2 ? MF_GRAYED : MF_STRING
													});
													menu.newCheckMenu(sm, entryText, void (0), () => { return propObj[key][1]; });
												});
											}
										});
										[configSubmenu, submenuTwo].forEach((sm) => {
											menu.newSeparator(sm);
											menu.newEntry({
												menuName: sm, entryText: 'Restore defaults...', func: () => {
													menu_properties.tags[1] = menu_propertiesBack.tags[1];
													menu_properties.genreStyleFilterTag[1] = menu_propertiesBack.genreStyleFilterTag[1];
													overwriteMenuProperties(); // Force overwriting
													const newTags = JSON.parse(menu_properties.tags[1]);
													const newGraphTags = Object.values(newTags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity);
													const oldGraphTags = Object.values(tags).filter((t) => t.type.includes('graph') && !t.type.includes('virtual')).map((t) => t.tf).flat(Infinity);
													if (!isArrayEqual(newGraphTags, oldGraphTags)) {
														const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
														if (answer === popup.yes) {
															menu.btn_up(void (0), void (0), void (0), 'Search by Distance\\Reset link cache');
														}
													}
												}
											});
										});
									}
								});
							}
						}
						menu.newSeparator(subMenu);
						{ // Open descriptors
							menu.newEntry({
								menuName: subMenu, entryText: 'Open main descriptor', func: () => {
									const file = folders.xxx + 'main\\music_graph\\music_graph_descriptors_xxx.js';
									if (_isFile(file)) { _explorer(file); _run('notepad.exe', file); }
								}
							});
							menu.newEntry({
								menuName: subMenu, entryText: 'Open user descriptor', func: () => {
									const file = folders.userHelpers + 'music_graph_descriptors_xxx_user.js';
									if (!_isFile(file)) {
										_copyFile(folders.xxx + 'main\\music_graph\\music_graph_descriptors_xxx_user.js', file);
										const readme = _open(folders.xxx + 'helpers\\readme\\search_by_distance_user_descriptors.txt', utf8);
										if (readme.length) { fb.ShowPopupMessage(readme, 'User descriptors'); }
									}
									if (_isFile(file)) { _explorer(file); _run('notepad.exe', file); }
								}
							});
						}
						menu.newSeparator(subMenu);
						{ // Open graph html file
							menu.newEntry({
								menuName: subMenu, entryText: 'Show Music Graph on Browser', func: () => {
									const file = folders.xxx + 'Draw Graph.html';
									if (_isFile(file)) { _run(file); }
								}
							});
						}
					}
					menu.newSeparator(configMenu);
					{
						const subMenuName = 'Harmonic mixing';
						if (!menu.hasMenu(subMenuName, configMenu)) {
							menu.newMenu(subMenuName, configMenu);
							{	// bHarmonicMixDoublePass
								menu.newEntry({ menuName: subMenuName, entryText: 'For any tool which uses harmonic mixing:', func: null, flags: MF_GRAYED });
								menu.newSeparator(subMenuName);
								menu.newEntry({
									menuName: subMenuName, entryText: 'Enable double pass to match more tracks', func: () => {
										menu_properties['bHarmonicMixDoublePass'][1] = !menu_properties['bHarmonicMixDoublePass'][1];
										overwriteMenuProperties(); // Updates panel
									}
								});
								menu.newCheckMenu(subMenuName, 'Enable double pass to match more tracks', void (0), () => { return menu_properties['bHarmonicMixDoublePass'][1]; });
							}
						}
					}
					{
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
											const input = Input.string('string', menu_properties.smartShuffleSortBias[1], 'Enter TF expression:', 'Search by distance', menu_properties.smartShuffleSortBias[3]);
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
					}
				} else { menuDisabled.push({ menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); } // NOSONAR [global]
			}
		}
	} else {
		menu.newEntry({ menuName: specialMenu, entryText: 'Based on Search by Distance:', func: null, flags: MF_GRAYED });
		menu.newSeparator(specialMenu);
		menu.newEntry({ menuName: specialMenu, entryText: '-Not installed-', func: null, flags: MF_GRAYED });
	}
}