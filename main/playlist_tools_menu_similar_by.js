'use strict';
//26/10/22

// Similar by...Graph\Dyngenre\Weight
{
	const scriptPath = folders.xxx + 'main\\search_bydistance.js';
	if (_isFile(scriptPath)){
		const nameGraph = 'Search similar by Graph...';
		const nameDynGenre = 'Search similar by DynGenre...';
		const nameWeight = 'Search similar by Weight...';
		if (!menusEnabled.hasOwnProperty(nameGraph) || !menusEnabled.hasOwnProperty(nameDynGenre) || !menusEnabled.hasOwnProperty(nameWeight) || !menusEnabled.hasOwnProperty(specialMenu) || menusEnabled[nameGraph] === true || menusEnabled[nameDynGenre] === true || menusEnabled[nameWeight] === true || menusEnabled[specialMenu] === true) {
			include(scriptPath);
			readmes[newReadmeSep()] = 'sep';
			readmes['Search similar by... (main)'] = folders.xxx + 'helpers\\readme\\search_bydistance.txt';
			readmes['Search similar by... (recipes\\themes)'] = folders.xxx + 'helpers\\readme\\search_bydistance_recipes_themes.txt';
			readmes['Search similar by... (similar artists)'] = folders.xxx + 'helpers\\readme\\search_bydistance_similar_artists.txt';
			readmes['Search similar by... (user descriptors)'] = folders.xxx + 'helpers\\readme\\search_bydistance_user_descriptors.txt';
			readmes['Search similar by Graph'] = folders.xxx + 'helpers\\readme\\search_bydistance_graph.txt';
			readmes['Search similar by Dyngenre'] = folders.xxx + 'helpers\\readme\\search_bydistance_dyngenre.txt';
			readmes['Search similar by Weight'] = folders.xxx + 'helpers\\readme\\search_bydistance_weight.txt';
			const selArgs = [
				{name: 'sep'},
				{name: 'Nearest Tracks', args: {genreWeight: 15, styleWeight: 10, moodWeight: 5, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 70}},
				{name: 'Similar Genre mix, within a decade', args: {genreWeight: 15, styleWeight: 10, moodWeight: 5, keyWeight: 5, dateWeight: 25, bpmWeight: 5,  dateRange: 15, bpmRange: 25, probPick: 100, scoreFilter: 70}},
				{name: 'Varied Styles/Genres mix, within a decade', args: {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, bpmRange: 25, probPick: 100, scoreFilter: 60}},
				{name: 'Random Styles/Genres mix, same Mood', args: {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 0, bpmWeight: 5, 
					bpmRange: 25, probPick: 100, scoreFilter: 50}}
				];
			let similarBy = [
				];
			// Delete unused properties
			const toDelete = ['genreWeight', 'styleWeight', 'dyngenreWeight', 'dyngenreRange', 'moodWeight', 'keyWeight', 'keyRange', 'dateWeight', 'dateRange', 'bpmWeight', 'bpmRange', 'composerWeight', 'customStrWeight', 'customNumWeight', 'customNumRange', 'forcedQuery', 'bUseAntiInfluencesFilter', 'bUseInfluencesFilter', 'scoreFilter', 'sbd_max_graph_distance', 'method', 'bNegativeWeighting', 'poolFilteringTag', 'poolFilteringN', 'bRandomPick', 'probPick', 'playlistLength', 'bSortRandom', 'bScatterInstrumentals', 'bProgressiveListOrder', 'bInKeyMixingPlaylist', 'bProgressiveListCreation', 'ProgressiveListCreationN', 'bAdvTitle', 'checkDuplicatesByTag', 'bSmartShuffle'];
			let toMerge = {}; // Deep copy
			Object.keys(SearchByDistance_properties).forEach((key) => {
				if (toDelete.indexOf(key) === -1) {
					toMerge[key] = [...SearchByDistance_properties[key]];
					toMerge[key][0] = '\'Search similar\' ' + toMerge[key][0];
				}
			});
			// And merge
			menu_properties = {...menu_properties, ...toMerge};
			menu_properties['similarBy'] = ['Search similar by Graph\\Dyngenre\\Weight... args', JSON.stringify(similarBy)];
			// Check
			menu_properties['similarBy'].push({func: isJSON}, menu_properties['similarBy'][1]);
			// Set default args
			const scriptDefaultArgs = {properties: menu_properties, genreWeight: 0, styleWeight: 0, dyngenreWeight: 0, moodWeight: 0, keyWeight: 0, dateWeight: 0, bpmWeight: 0, composerWeight: 0, customStrWeight: 0, customNumWeight: 0, dyngenreRange: 0, keyRange: 0, dateRange: 0, bpmRange: 0, customNumRange: 0, bNegativeWeighting: true, bUseAntiInfluencesFilter: false, bUseInfluencesFilter: false, method: '', scoreFilter: 70, sbd_max_graph_distance: 100, poolFilteringTag: [], poolFilteringN: -1, bPoolFiltering: false, bRandomPick: true, probPick: 100, bSortRandom: false, bProgressiveListOrder: false, bScatterInstrumentals: false, bSmartShuffle: true, bInKeyMixingPlaylist: false, bProgressiveListCreation: false, progressiveListCreationN:1, bCreatePlaylist: true};
			// Menus
			function loadMenus(menuName, selArgs, entryArgs = []){
				selArgs.forEach( (selArg) => {
					if (selArg.name === 'sep') {
						let entryMenuName = selArg.hasOwnProperty('menu') ? selArg.menu : menuName;
						menu.newEntry({menuName: entryMenuName, entryText: 'sep'});
					} else {
						const entryArg = entryArgs.find((item) => {return item.name === selArg.name;}) || {};
						let entryText = selArg.name;
						menu.newEntry({menuName, entryText, func: (args = {...scriptDefaultArgs, ...defaultArgs, ...selArg.args, ...entryArg.args}) => {
							const globQuery = args.properties['forcedQuery'][1];
							if (args.hasOwnProperty('forcedQuery') && globQuery.length && args['forcedQuery'] !== globQuery) { // Join queries if needed
								args['forcedQuery'] =  globQuery + ' AND ' + args['forcedQuery'];
							}
							do_searchby_distance(args);
						}, flags: focusFlags});
					}
				});
			}
			function loadMenusCond(menuName, method){
				menu.newCondEntry({entryText: 'Search similar by Graph\\Dyngenre\\Weight... (cond)', condFunc: () => {
					similarBy = JSON.parse(menu_properties.similarBy[1]);
					const entries = similarBy.map((item) => {
						if (!item.hasOwnProperty('method')) {
							item.method = method;
							if (item.hasOwnProperty('args')) {item.args.method = method;}
						}
						return item;
					}).filter((item) => {return item.method === method;});
					loadMenus(menuName, entries);
				}});
			}
			{	// Graph
				if (!menusEnabled.hasOwnProperty(nameGraph) || menusEnabled[nameGraph] === true) {
					let menuName = menu.newMenu(nameGraph);
					{	// Static menus
						menu.newEntry({menuName, entryText: 'Similar tracks by genre/style complex relations:', func: null, flags: MF_GRAYED});
						const distanceUnit = music_graph_descriptors.intra_supergenre; // 100
						const entryArgs = [
							{name: 'Nearest Tracks', args: {sbd_max_graph_distance: distanceUnit / 2, method: 'GRAPH'}}, // 50
							{name: 'Similar Genre mix, within a decade', args: {scoreFilter: 70, sbd_max_graph_distance: music_graph_descriptors.cluster, method: 'GRAPH'}}, // 85
							{name: 'Varied Styles/Genres mix, within a decade', args: {sbd_max_graph_distance: distanceUnit * 3/2, method: 'GRAPH'}}, //150
							{name: 'Random Styles/Genres mix, same Mood', args: {sbd_max_graph_distance: distanceUnit * 4, method: 'GRAPH'}} //400
						];
						loadMenus(menuName, selArgs, entryArgs);
						loadMenusCond(menuName, 'GRAPH');
					}
				} else {menuDisabled.push({menuName: nameGraph, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
			{	// Dyngenre...
				if (!menusEnabled.hasOwnProperty(nameDynGenre) || menusEnabled[nameDynGenre] === true) {
					let menuName = menu.newMenu(nameDynGenre);
					{	// Static menus
						menu.newEntry({menuName, entryText: 'Similar tracks by genre/style simple grouping:', func: null, flags: MF_GRAYED});
						const distanceUnit = 1;
						const entryArgs = [
							{name: 'Nearest Tracks', args: {dyngenreWeight: 25, dyngenreRange: distanceUnit, method: 'DYNGENRE'}},
							{name: 'Similar Genre mix, within a decade', args: {dyngenreWeight: 10, dyngenreRange: distanceUnit, method: 'DYNGENRE'}},
							{name: 'Varied Styles/Genres mix, within a decade', args: {dyngenreWeight: 10, dyngenreRange: distanceUnit * 2, method: 'DYNGENRE'}},
							{name: 'Random Styles/Genres mix, same Mood', args: {dyngenreWeight: 5, dyngenreRange: distanceUnit * 4, method: 'DYNGENRE'}}
						];
						loadMenus(menuName, selArgs, entryArgs);
						loadMenusCond(menuName, 'DYNGENRE');
					}
				} else {menuDisabled.push({menuName: nameDynGenre, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
			{	// Weight...
				if (!menusEnabled.hasOwnProperty(nameWeight) || menusEnabled[nameWeight] === true) {
					let menuName = menu.newMenu(nameWeight);
					{	// Static menus
						menu.newEntry({menuName, entryText: 'Similar tracks by tag matching scoring:', func: null, flags: MF_GRAYED});
						const entryArgs = [
							{name: 'Nearest Tracks', args: {method: 'WEIGHT'}},
							{name: 'Similar Genre mix, within a decade', args: {method: 'WEIGHT'}},
							{name: 'Varied Styles/Genres mix, within a decade', args: {method: 'WEIGHT'}},
							{name: 'Random Styles/Genres mix, same Mood', args: {method: 'WEIGHT'}}
						];
						loadMenus(menuName, selArgs, entryArgs);
						loadMenusCond(menuName, 'WEIGHT');
					}
				} else {menuDisabled.push({menuName: nameWeight, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
			menu.newEntry({entryText: 'sep'});
			{	// -> Special playlists...
				if (!menusEnabled.hasOwnProperty(specialMenu) || menusEnabled[specialMenu] === true) {
					menu.newEntry({menuName: specialMenu, entryText: 'Based on Graph/Dyngenre/Weight:', func: null, flags: MF_GRAYED});
					const selArgs = [
						{name: 'sep'},
						{name: 'Influences from any date', args: {genreWeight: 5, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 0, bpmWeight: 10, bUseInfluencesFilter: true, probPick: 100, scoreFilter: 40, sbd_max_graph_distance: 500, method: 'GRAPH'}},
						{name: 'Influences within 20 years', args: {genreWeight: 5, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 10, dateRange: 20, bpmWeight: 10, bUseInfluencesFilter: true, probPick: 100, scoreFilter: 40, sbd_max_graph_distance: 500, method: 'GRAPH'}},
						{name: 'sep'},
						{name: 'Progressive playlist by genre/styles', args: {genreWeight: 15, styleWeight: 5, moodWeight: 30, keyWeight: 10, dateWeight: 5, dateRange: 35, bpmWeight: 10, probPick: 100, scoreFilter: 70, sbd_max_graph_distance: 200, method: 'GRAPH', bProgressiveListCreation: true, progressiveListCreationN: 3}},
						{name: 'Progressive playlist by mood', args: {genreWeight: 20, styleWeight: 20, moodWeight: 5, keyWeight: 20, dateWeight: 0, bpmWeight: 10, probPick: 100, scoreFilter: 60, sbd_max_graph_distance: 300, method: 'GRAPH', bProgressiveListCreation: true, progressiveListCreationN: 3}},
						{name: 'sep'},
						{name: 'Harmonic mix with similar genre/styles', args: {dyngenreWeight: 20, genreWeight: 15, styleWeight: 15, dyngenreRange: 2, keyWeight: 0, dateWeight: 5, dateRange: 25, scoreFilter: 70, method: 'DYNGENRE', 
							bInKeyMixingPlaylist: true}},
						{name: 'Harmonic mix with similar moods', args: {moodWeight: 35, genreWeight: 5, styleWeight: 5, dateWeight: 5, dateRange: 25, dyngenreWeight: 10, dyngenreRange: 3, keyWeight: 0, scoreFilter: 70, method: 'DYNGENRE', bInKeyMixingPlaylist: true}},
						{name: 'Harmonic mix with only instrumental tracks', args: {moodWeight: 15, genreWeight: 5, styleWeight: 5, dateWeight: 5, dateRange: 35, dyngenreWeight: 10, dyngenreRange: 3, keyWeight: 0, scoreFilter: 70, method: 'DYNGENRE', bInKeyMixingPlaylist: true, forcedQuery: globQuery.instrumental}}
						];
					// Menus
					function loadMenusCond(method){
						menu.newCondEntry({entryText: 'Special playlists... (cond)', condFunc: () => {
							similarBy = JSON.parse(menu_properties.similarBy[1]);
							const entries = similarBy.filter((item) => {return item.method === method;});
							loadMenus(specialMenu, entries);
						}});
					}
					loadMenus(specialMenu, selArgs);
					loadMenusCond('SPECIAL');
				}
			}
			{	// -> Config menu
				if (!menusEnabled.hasOwnProperty(configMenu) || menusEnabled[configMenu] === true) {
					{
						const submenu = menu.newMenu('Search by Distance', configMenu);
						{ 	// Find genre/styles not on graph
							menu.newEntry({menuName: submenu, entryText: 'Find genres/styles not on Graph', func: () => {
								findStyleGenresMissingGraph({
									genreStyleFilterTag: JSON.parse(menu_properties.genreStyleFilterTag[1]).filter(Boolean),
									genretag: JSON.parse(menu_properties.genreTag[1]),
									styleTag: JSON.parse(menu_properties.styleTag[1]), 
									bAscii: menu_properties.bAscii[1],
									bPopup: true
								});
							}});
							// Graph debug
							menu.newEntry({menuName: submenu, entryText: 'Debug Graph (check console)', func: () => {
								if (defaultArgs.bProfile) {var profiler = new FbProfiler('graphDebug');}
								graphDebug(sbd.allMusicGraph, true); // Show popup on pass
								if (defaultArgs.bProfile) {profiler.Print();}
							}});
							// Graph test
							menu.newEntry({menuName: submenu, entryText: 'Run distance tests (check console)', func: () => {
								if (defaultArgs.bProfile) {var profiler = new FbProfiler('testGraph');}
								testGraph(sbd.allMusicGraph);
								testGraphV2(sbd.allMusicGraph);
								if (defaultArgs.bProfile) {profiler.Print();}
							}});
							menu.newEntry({menuName: submenu, entryText: 'sep'});
							// Graph cache reset Async
							menu.newEntry({menuName: submenu, entryText: () => 'Reset link cache' + (sbd.isCalculatingCache ? '\t -processing-' : ''), func: () => {
								if (sbd.isCalculatingCache) {
									fb.ShowPopupMessage('There is a calculation currently on process.\nTry again after it finishes. Check console (or animation).', 'Graph cache');
									return;
								}
								_deleteFile(folders.data + 'searchByDistance_cacheLink.json');
								_deleteFile(folders.data + 'searchByDistance_cacheLinkSet.json');
								cacheLink = void(0);
								cacheLinkSet = void(0);
								updateCache({bForce: true, properties: menu_properties}); // Creates new one and also notifies other panels to discard their cache
							}, flags: () => !sbd.isCalculatingCache ? MF_STRING : MF_GRAYED});
							// Tags cache reset Async
							menu.newEntry({menuName: submenu, entryText: 'Reset tags cache' + (!isCompatible('2.0', 'fb') ? '\t-only Fb >= 2.0-' : (sbd.panelProperties.bTagsCache[1] ?  '' : '\t -disabled-')), func: () => {
								const keys = ['genreTag', 'styleTag', 'moodTag', 'dateTag', 'keyTag', 'bpmTag', 'composerTag', 'customStrTag', 'customNumTag'].map((key) => {return JSON.pasrse(menu_properties[key][1]).filter(Boolean);});
								const tags = keys.concat([['TITLE']])
									.map((tagName) => {return tagName.map((subTagName) => {return (subTagName.indexOf('$') === -1 ? '%' + subTagName + '%' : subTagName);});})
									.map((tagName) => {return tagName.join(', ');}).filter(Boolean)
									.filter((tagName) => {return tagsCache.cache.has(tagName);});
								tagsCache.clear(tags);
								tagsCache.save();
								tagsCache.cacheTags(tags, iStepsLibrary, iDelayLibrary, fb.GetLibraryItems().Convert(), true);
							}, flags: sbd.panelProperties.bTagsCache[1] ? MF_STRING : MF_GRAYED});
						}
						menu.newEntry({menuName: submenu, entryText: 'sep'});
						{
							const submenuTwo = menu.newMenu('Tag remapping...' + nextId('invisible', true, false), submenu);
							{	// Menu to configure tags
								const options = ['genre', 'style', 'mood', 'bpm', 'key', 'composer', 'date', 'customStr', 'customNum'];
								menu.newEntry({menuName: submenuTwo, entryText: 'Tag remapping (only this tool):', func: null, flags: MF_GRAYED})
								menu.newEntry({menuName: submenuTwo, entryText: 'sep'})
								menu.newCondEntry({entryText: 'Tags... (cond)', condFunc: () => {
									// Create menu on 2 places: tool config submenu and global tag submenu
									const configMmenu = 'Tag remapping...';
									menu.newEntry({menuName: configMmenu, entryText: 'sep'});
									const configSubmenu = menu.newMenu(submenu + '...' + nextId('invisible', true, false), configMmenu);
									options.forEach((tagName) => {
										const key = tagName + 'Tag';
										const value = JSON.parse(menu_properties[key][1]).join(',');
										const entryText = capitalize(tagName) + '\t[' + (
												typeof value === 'string' && value.length > 10 
												? value.slice(0,10) + '...' 
												: value
											) + ']';
										[configSubmenu, submenuTwo].forEach((sm) => {
											menu.newEntry({menuName: sm, entryText, func: () => {
												let input;
												try {input = JSON.parse(utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(In some cases merging multiple tags is allowed, check the readme)\n(JSON)', scriptName + ': ' + configMenu, menu_properties[key][1], true));}
												catch (e) {return;}
												if (input) {input = input.filter((n) => n);}
												if (isArrayEqual(JSON.parse(menu_properties[key][1]), input)) {return;}
												if (defaultArgs.hasOwnProperty(key)) {defaultArgs[key] = input;}
												menu_properties[key][1] = JSON.stringify(input);
												overwriteMenuProperties(); // Updates panel
												if (tagName === 'genre' || tagName === 'style') {
													const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
													if (answer === popup.yes) {
														menu.btn_up(void(0), void(0), void(0), 'Search by Distance\\Reset link cache');
													}
												}
											}});
										});
									});
									[configSubmenu, submenuTwo].forEach((sm) => {
										menu.newEntry({menuName: sm, entryText: 'sep'});
										{	// Cache
											const options = ['bAscii', 'bTagsCache'];
											options.forEach((key, i) => {
												const propObj = key === 'bTagsCache' ? sbd.panelProperties : menu_properties;
												const keyText = propObj[key][0];
												const entryText = (keyText.substr(keyText.indexOf('.') + 1) + (key === 'bTagsCache' && !isCompatible('2.0', 'fb') ? '\t-only Fb >= 2.0-' : '')).replace('\'Search similar\' ','');
												menu.newEntry({menuName: sm, entryText, func: () => {
													propObj[key][1] = !propObj[key][1];
													overwriteMenuProperties(); // Updates panel
													if (key === 'bAscii') {
														const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
														if (answer === popup.yes) {
															menu.btn_up(void(0), void(0), void(0), 'Search by Distance\\Reset link cache');
														}
													} else if (key === 'bTagsCache') {
														if (propObj.bTagsCache[1]) {
															fb.ShowPopupMessage('This feature should only be enabled on Foobar2000 versions >= 2.0.\nPrevious versions already cached tags values, thus not requiring it.', 'Tags cache');
															tagsCache.load();
															const answer = WshShell.Popup('Reset tags cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
															if (answer === popup.yes) {
																menu.btn_up(void(0), void(0), void(0), 'Search by Distance\\Reset tags cache');
															}
														} else {
															tagsCache.unload();
														}
													}
												}, flags: key === 'bTagsCache' && !isCompatible('2.0', 'fb') ? MF_GRAYED : MF_STRING});
												menu.newCheckMenu(sm, entryText, void(0), () => {return propObj[key][1];});
											});
										}
									});
									[configSubmenu, submenuTwo].forEach((sm) => {
										menu.newEntry({menuName: sm, entryText: 'sep'});
										menu.newEntry({menuName: sm, entryText: 'Reset to default...', func: () => {
											options.forEach((key) => {
												const tagName = key + 'Tag';
												if (menu_properties.hasOwnProperty(tagName) && menu_propertiesBack.hasOwnProperty(tagName)) {
													menu_properties[tagName][1] = menu_propertiesBack[tagName][1];
												}
											});
											overwriteMenuProperties(); // Force overwriting
											const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
											if (answer === popup.yes) {
												menu.btn_up(void(0), void(0), void(0), 'Search by Distance\\Reset link cache');
											}
										}});
									});
								}});
							}
						}
						menu.newEntry({menuName: submenu, entryText: 'sep'});
						{ // Create theme
							menu.newEntry({menuName: submenu, entryText: 'Create theme file with selected track', func: () => {
								// Tag names
								const genreTag = JSON.parse(menu_properties.genreTag[1]).filter(Boolean);
								const styleTag = JSON.parse(menu_properties.styleTag[1]).filter(Boolean);
								const moodTag = JSON.parse(menu_properties.moodTag[1]).filter(Boolean);
								const dateTag = JSON.parse(menu_properties.dateTag[1]).filter(Boolean); // only allows 1 value, but put it into an array
								const keyTag = JSON.parse(menu_properties.keyTag[1]).filter(Boolean); // only allows 1 value, but put it into an array
								const bpmTag = JSON.parse(menu_properties.bpmTag[1]).filter(Boolean); // only allows 1 value, but put it into an array
								const composerTag = JSON.parse(menu_properties.composerTag[1]).filter(Boolean);
								const customStrTag = JSON.parse(menu_properties.customStrTag[1]).filter(Boolean);
								const customNumTag = JSON.parse(menu_properties.customNumTag[1]).filter(Boolean); // only allows 1 value, but put it into an array
								// Tag Values
								const selHandleList = new FbMetadbHandleList(fb.GetFocusItem());
								const genre = genreTag.length ? getTagsValuesV3(selHandleList, genreTag, true).flat().filter(Boolean) : [];
								const style = styleTag.length ? getTagsValuesV3(selHandleList, styleTag, true).flat().filter(Boolean) : [];
								const mood = moodTag.length ? getTagsValuesV3(selHandleList, moodTag, true).flat().filter(Boolean) : [];
								const composer = composerTag.length ? getTagsValuesV3(selHandleList, composerTag, true).flat().filter(Boolean) : [];
								const customStr = customStrTag.length ? getTagsValuesV3(selHandleList, customStrTag, true).flat().filter(Boolean) : [];
								const restTagNames = [keyTag.length ? keyTag[0] : 'skip', dateTag.length ? dateTag[0] : 'skip', bpmTag.length ? bpmTag[0] : 'skip', customNumTag.length ? customNumTag[0] : 'skip']; // 'skip' returns empty arrays...
								const [keyArr, dateArr, bpmArr, customNumArr] = getTagsValuesV4(selHandleList, restTagNames).flat();
								const key = keyArr;
								const date = dateTag.length ? [Number(dateArr[0])] : [];
								const bpm = bpmArr.length ? [Number(bpmArr[0])] : [];
								const customNum = customNumTag.length ? [Number(customNumArr[0])] : [];
								// Theme obj
								let input = '';
								try {input = utils.InputBox(window.ID, 'Enter theme name', scriptName + ': ' + configMenu, 'my theme', true);}
								catch (e) {return;}
								if (!input.length) {return;}
								const theme = {name: input, tags: []};
								theme.tags.push({genre, style, mood, key, date, bpm, composer, customStr, customNum});
								const filePath = folders.xxx + 'presets\\Search by\\themes\\' + input + '.json';
								const bDone = _save(filePath, JSON.stringify(theme, null, '\t'));
								if (!bDone) {fb.ShowPopupMessage('Error saving theme file:' + filePath, scriptName + ': ' + name); return;}
							}, flags: focusFlags});
						}
						menu.newEntry({menuName: submenu, entryText: 'sep'});
						{ // Open descriptors
							menu.newEntry({menuName: submenu, entryText: 'Open main descriptor', func: () => {
								const file = folders.xxx + 'helpers\\music_graph_descriptors_xxx.js';
								if (_isFile(file)){_explorer(file); _run('notepad.exe', file);}
							}});
							menu.newEntry({menuName: submenu, entryText: 'Open user descriptor', func: () => {
								const file = folders.userHelpers + 'music_graph_descriptors_xxx_user.js';
								if (!_isFile(file)){
									_copyFile(folders.xxx + 'helpers\\music_graph_descriptors_xxx_user.js', file);
									const readme = _open(folders.xxx + 'helpers\\readme\\search_bydistance_user_descriptors.txt', utf8);
									if (readme.length) {fb.ShowPopupMessage(readme, 'User descriptors');}
								}
								if (_isFile(file)){_explorer(file); _run('notepad.exe', file);}
							}});
						}
						menu.newEntry({menuName: submenu, entryText: 'sep'});
						{ // Open graph html file
							menu.newEntry({menuName: submenu, entryText: 'Show Music Graph on Browser', func: () => {
								const file = folders.xxx + 'Draw Graph.html';
								if (_isFile(file)){_run(file);}
							}});
						}
					}
					menu.newEntry({menuName: configMenu, entryText: 'sep'});
					{
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
					}
				} else {menuDisabled.push({menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		} else {
			menuDisabled.push({menuName: nameGraph, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
			menuDisabled.push({menuName: nameDynGenre, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
			menuDisabled.push({menuName: nameWeight, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
		}
	}
}