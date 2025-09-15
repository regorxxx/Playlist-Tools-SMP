'use strict';
//15/09/25

/* global menusEnabled:readable, readmes:readable, menu:readable, newReadmeSep:readable, scriptName:readable, defaultArgs:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, menu_properties:writable, overwriteMenuProperties:readable, multipleSelectedFlags:readable, playlistCountFlagsAddRem:readable, focusFlags:readable, selectedFlags:readable, selectedFlags:readable, configMenu:readable */

/* global MF_GRAYED:readable, folders:readable, _isFile:readable, _isFolder:readable, globTags:readable, VK_SHIFT:readable, clone:readable, MF_STRING:readable, _b:readable, globQuery:readable, isString:readable, isJSON:readable, Input:readable, sanitizePath:readable, checkQuery:readable, findRecursiveDirs:readable, _resolvePath:readable, capitalize:readable,_t:readable, isBoolean:readable, soFeat:readable */

// Other tools
{
	const name = 'Other tools';
	if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
		readmes[newReadmeSep()] = 'sep';
		let menuName = menu.newMenu(name);
		{	// Check tags
			const scriptPath = folders.xxx + 'main\\tags\\check_library_tags.js';
			/* global checkTags_properties:readable, checkTags:readable, addTagsToExclusion:readable, dictSettings:readable */
			if (_isFile(scriptPath)) {
				const name = 'Check tags';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\check_library_tags.txt';
					const subMenuName = menu.newMenu(name, menuName);
					// Delete unused properties
					const toDelete = ['bUseDic'];
					let toMerge = {}; // Deep copy
					Object.keys(checkTags_properties).forEach((key) => {
						if (!toDelete.includes(key)) {
							toMerge[key] = [...checkTags_properties[key]];
							toMerge[key][0] = '\'Other tools\\Check tags\' ' + toMerge[key][0];
						}
					});
					// And merge
					menu_properties = { ...menu_properties, ...toMerge }; // NOSONAR
					// For submenus
					const tagsToCheck = [
						{ tag: globTags.genre, name: 'Genre (+ dictionary)', bUseDic: true },
						{ tag: globTags.style, name: 'Style (+ dictionary)', bUseDic: true },
						{ tag: globTags.mood, name: 'Mood (+ dictionary)', bUseDic: true },
						{ tag: globTags.composer, name: 'Composer', bUseDic: false },
						{ tag: globTags.titleRaw, name: 'Title', bUseDic: false },
						'sep',
						{ tag: [globTags.genre, globTags.style].join(','), name: 'Genre + Style (+ dictionary)', bUseDic: true },
						{ tag: [...new Set([globTags.composer, globTags.artistRaw, 'ARTIST', 'ALBUM ARTIST'])].join(','), name: 'Composer + Artist', bUseDic: false },
						'sep',
						{ tag: ['FRONT'].join(','), name: 'Front artwork', bUseDic: false },
						{ tag: ['BACK'].join(','), name: 'Back artwork', bUseDic: false },
						{ tag: ['DISC'].join(','), name: 'Disc artwork', bUseDic: false },
						{ tag: ['ICON'].join(','), name: 'Icon artwork', bUseDic: false },
						{ tag: ['ARTIST'].join(','), name: 'Artist artwork', bUseDic: false },
						'sep',
						{ tag: ['FRONT', 'BACK', 'DISC', 'ICON', 'ARTIST'].join(','), name: 'All artwork', bUseDic: false },
					];
					// Menus
					menu.newEntry({ menuName: subMenuName, entryText: 'Reports tagging errors (on selection):', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
					menu.newEntry({
						menuName: subMenuName, entryText: 'Report errors by comparison', func: (_, bAsync) => {
							if (typeof bAsync === 'undefined') { bAsync = JSON.parse(menu_properties.async[1])['Check tags']; }
							const endPromise = checkTags({ properties: menu_properties, bUseDic: false, bAsync });
							if (defaultArgs.parent && bAsync) { defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, endPromise); } // Apply animation on registered parent button...
						}, flags: multipleSelectedFlags
					});
					menu.newEntry({
						menuName: subMenuName, entryText: 'Report errors + dictionary', func: (_, bAsync) => {
							if (typeof bAsync === 'undefined') { bAsync = JSON.parse(menu_properties.async[1])['Check tags']; }
							const endPromise = checkTags({ properties: menu_properties, bUseDic: true, bAsync });
							if (defaultArgs.parent && bAsync) { defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, endPromise); } // Apply animation on registered parent button...
						}, flags: multipleSelectedFlags
					});
					{	// Submenu
						const subMenuSecondName = menu.newMenu('Check only', subMenuName);
						menu.newEntry({ menuName: subMenuSecondName, entryText: 'Limits comparisons to:', func: null, flags: MF_GRAYED });
						menu.newSeparator(subMenuSecondName);
						tagsToCheck.forEach((obj) => {
							if (menu.isSeparator(obj)) { menu.newSeparator(subMenuSecondName); return; }
							menu.newEntry({
								menuName: subMenuSecondName, entryText: obj.name, func: (_, bAsync) => {
									const properties = clone(menu_properties);
									properties['tagNamesToCheck'][1] = obj.tag;
									if (typeof bAsync === 'undefined') { bAsync = JSON.parse(menu_properties.async[1])['Check tags']; }
									const endPromise = checkTags({ properties, bUseDic: obj.bUseDic, bAsync });
									if (defaultArgs.parent && bAsync) { defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, endPromise); } // Apply animation on registered parent button...
								}, flags: multipleSelectedFlags
							});
						});
					}
					menu.newSeparator(subMenuName);
					menu.newEntry({ menuName: subMenuName, entryText: 'Reports all tags. Slow! (on selection):', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
					menu.newEntry({
						menuName: subMenuName, entryText: 'Report all tags by comparison', func: (_, bAsync) => {
							if (typeof bAsync === 'undefined') { bAsync = JSON.parse(menu_properties.async[1])['Check tags']; }
							const endPromise = checkTags({ properties: menu_properties, freqThreshold: 1, maxSizePerTag: Infinity, bUseDic: false, bAsync });
							if (defaultArgs.parent && bAsync) { defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, endPromise); } // Apply animation on registered parent button...
						}, flags: multipleSelectedFlags
					});
					menu.newEntry({
						menuName: subMenuName, entryText: 'Report all tags + dictionary', func: (_, bAsync) => {
							if (typeof bAsync === 'undefined') { bAsync = JSON.parse(menu_properties.async[1])['Check tags']; }
							const endPromise = checkTags({ properties: menu_properties, freqThreshold: 1, maxSizePerTag: Infinity, bUseDic: true, bAsync });
							if (defaultArgs.parent && bAsync) { defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, endPromise); } // Apply animation on registered parent button...
						}, flags: multipleSelectedFlags
					});
					{	// Submenu
						const subMenuSecondName = menu.newMenu('Report all from', subMenuName);
						menu.newEntry({ menuName: subMenuSecondName, entryText: 'Limits comparisons to:', func: null, flags: MF_GRAYED });
						menu.newSeparator(subMenuSecondName);
						tagsToCheck.forEach((obj) => {
							if (menu.isSeparator(obj)) { menu.newSeparator(subMenuSecondName); return; }
							menu.newEntry({
								menuName: subMenuSecondName, entryText: obj.name, func: (_, bAsync) => {
									const properties = clone(menu_properties);
									properties['tagNamesToCheck'][1] = obj.tag;
									if (typeof bAsync === 'undefined') { bAsync = JSON.parse(menu_properties.async[1])['Check tags']; }
									const endPromise = checkTags({ properties, freqThreshold: 1, maxSizePerTag: Infinity, bUseDic: obj.bUseDic, bAsync });
									if (defaultArgs.parent && bAsync) { defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, endPromise); } // Apply animation on registered parent button...
								}, flags: multipleSelectedFlags
							});
						});
					}
					menu.newSeparator(subMenuName);
					menu.newEntry({
						menuName: subMenuName, entryText: 'Configure tags to check...', func: () => {
							const input = utils.InputBox(window.ID, 'Tag name(s) to check\nList \'tagName,tagName,...\' separated by \',\' :', scriptName + ': ' + name, menu_properties['tagNamesToCheck'][1]);
							if (menu_properties['tagNamesToCheck'][1] === input) { return; }
							if (!input.length) { return; }
							menu_properties['tagNamesToCheck'][1] = [...new Set(input.split(',').filter(Boolean))].join(','); // filter holes and remove duplicates
							overwriteMenuProperties(); // Updates panel
						}
					});
					menu.newEntry({
						menuName: subMenuName, entryText: 'Configure excluded tag values...', func: () => {
							addTagsToExclusion({ properties: menu_properties });
						}
					});
					{
						const subMenuSecondName = menu.newMenu('Configure dictionary', subMenuName);
						menu.newEntry({
							menuName: subMenuSecondName, entryText: 'Configure excluded tags for dictionary...', func: () => {
								const input = utils.InputBox(window.ID, 'Tag name(s) to not check against dictionary\nList \'tagName,tagName,...\' separated by \',\' :', scriptName + ': ' + name, menu_properties['tagNamesExcludedDic'][1]);
								if (menu_properties['tagNamesExcludedDic'][1] === input) { return; }
								if (!input.length) { return; }
								menu_properties['tagNamesExcludedDic'][1] = [...new Set(input.split(';').filter(Boolean))].join(';'); // filter holes and remove duplicates
								overwriteMenuProperties(); // Updates panel
							}
						});
						menu.newEntry({
							menuName: subMenuSecondName, entryText: 'Set dictionary...', func: () => {
								let input = utils.InputBox(window.ID, 'Set dictionary name:\n' + (findRecursiveDirs(dictSettings.dictPath).sort((a, b) => a.localeCompare(b, void (0), { sensitivity: 'base', numeric: true })).join(', ') || 'None found.') + '\n', scriptName + ': ' + name, menu_properties.dictName[1]);
								if (menu_properties.dictName[1] === input) { return; }
								if (!input.length) { input = menu_properties.dictName[3]; }
								dictSettings.dictName = input;
								if (!_isFolder(dictSettings.getLangPath())) {
									fb.ShowPopupMessage('Folder does not exist:\n' + dictSettings.getLangPath(), scriptName);
									dictSettings.dictName = menu_properties.dictName[1];
									return;
								}
								menu_properties.dictName[1] = dictSettings.dictName;
								overwriteMenuProperties(); // Updates panel
							}
						});
						menu.newEntry({
							menuName: subMenuSecondName, entryText: 'Sets dictionaries folder...', func: () => {
								let input = utils.InputBox(window.ID, 'Path to all dictionaries subfolders:\n(leave it empty to restore default path)\n\nPaths starting with \'.\\profile\\\' are relative to foobar profile folder.\nPaths starting with \'' + folders.xxxRootName + '\' are relative to this script\'s folder.', scriptName + ': ' + name, menu_properties.dictPath[1]);
								if (input.length && !input.endsWith('\\')) { input += '\\'; }
								if (menu_properties.dictPath[1] === input) { return; }
								if (!input.length) { input = menu_properties.dictPath[3]; }
								dictSettings.dictPath = input;
								if (!_isFolder(dictSettings.dictPath)) {
									fb.ShowPopupMessage('Folder does not exist:\n' + _resolvePath(dictSettings.dictPath), scriptName);
									dictSettings.dictPath = menu_properties.dictPath[1] + (menu_properties.dictPath[1].endsWith('\\') ? '' : '\\');
									return;
								}
								menu_properties.dictPath[1] = dictSettings.dictPath;
								overwriteMenuProperties(); // Updates panel
							}
						});
					}
					menu.newEntry({
						menuName: subMenuName, entryText: 'Check genre/styles at Music Graph', func: () => {
							menu_properties['bUseGraphGenres'][1] = !menu_properties['bUseGraphGenres'][1];
							overwriteMenuProperties(); // Updates panel
						}
						, flags: typeof music_graph_descriptors === 'undefined' ? MF_GRAYED : MF_STRING
					});
					menu.newCheckMenuLast(() => menu_properties['bUseGraphGenres'][1]);
					menu.newSeparator(menuName);
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); } // NOSONAR
			}
		}
		{	// Automate tags
			const scriptPath = folders.xxx + 'main\\tags\\tagger.js';
			/* global Tagger:readable */
			if (_isFile(scriptPath)) {
				const name = 'Batch Tagger';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\tagger.txt';
					const tAut = new Tagger();
					menu_properties.toolsByKey = ['\'Other tools\\Tagger\' Tools enabled', JSON.stringify(new Tagger({ bOutputDefTools: true }))];
					menu_properties.quietByKey = ['\'Other tools\\Tagger\' Quiet mode', JSON.stringify({})];
					menu_properties.menuByKey = ['\'Other tools\\Tagger\' Tools tagging menu entries', JSON.stringify({})];
					menu_properties.menuRemoveByKey = ['\'Other tools\\Tagger\' Tools remove tags menu entries', JSON.stringify({})];
					menu_properties.tagsByKey = ['\'Other tools\\Tagger\' Tags per tool', JSON.stringify({})];
					menu_properties.bWineBug = ['\'Other tools\\Tagger\' Wine ffmpeg bug workaround', !soFeat.x64 && !soFeat.popup, { func: isBoolean }, !soFeat.x64 && !soFeat.popup];
					menu_properties.bFormatPopups = ['\'Other tools\\Tagger\' Show format warning popups', true, { func: isBoolean }, true];
					menu_properties.bToolPopups = ['\'Other tools\\Tagger\' Show tool warning popups', true, { func: isBoolean }, true];
					menu_properties.bRunPopup = ['\'Other tools\\Tagger\' Ask confirmation before running', true, { func: isBoolean }, true];
					const subMenuName = menu.newMenu(name, menuName);
					const firedFlags = () => { return tAut.isRunning() ? MF_STRING : MF_GRAYED; };
					const allFlags = () => { return (!tAut.isRunning() ? selectedFlags() : MF_GRAYED); };
					menu.newEntry({ menuName: subMenuName, entryText: 'Automatize tagging:', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
					menu.newEntry({
						menuName: subMenuName, entryText: () => { return 'Add tags on batch to selected tracks' + (tAut.isRunning() ? ' (running)' : ''); }, func: () => {
							tAut.run();
							// Apply animation on registered parent button...
							if (defaultArgs.parent) { defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, () => { return !tAut.isRunning(); }); }
						}, flags: allFlags
					});
					menu.newSeparator(subMenuName);
					menu.newEntry({ menuName: subMenuName, entryText: () => { return 'Manually force next step' + (tAut.isRunning() ? '' : ' (not running)'); }, func: tAut.nextStepTag, flags: firedFlags });
					menu.newEntry({ menuName: subMenuName, entryText: () => { return 'Stop execution' + (tAut.isRunning() ? '' : ' (not running)'); }, func: tAut.stopStepTag, flags: firedFlags });
					menu.newSeparator(subMenuName);
					const subMenuTools = menu.newMenu('Available tools', subMenuName);
					menu.newEntry({ menuName: subMenuTools, entryText: 'Toggle (click) / Single (Shift + click):', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuTools);
					tAut.tools.forEach((tool) => {
						const key = tool.key;
						const flags = tool.bAvailable ? MF_STRING : MF_GRAYED;
						menu.newEntry({
							menuName: subMenuTools, entryText: tool.title, func: () => {
								// Disable all other tools when pressing shift
								if (utils.IsKeyPressed(VK_SHIFT)) {
									tAut.tools.filter((_) => { return _.key !== key; }).forEach((_) => { tAut.toolsByKey[_.key] = false; });
									tAut.toolsByKey[key] = true;
								} else {
									tAut.toolsByKey[key] = !tAut.toolsByKey[key];
									// Warn about incompatible tools
									if (tAut.toolsByKey[key]) {
										if (tAut.incompatibleTools.has(key)) {
											const toDisable = tAut.incompatibleTools.get(key);
											if (tAut.toolsByKey[toDisable]) {
												tAut.toolsByKey[toDisable] = false;
												console.popup(tAut.titlesByKey[toDisable] + ' has been disabled.', 'Tags Automation');
											}
										}
									}
								}
								menu_properties['toolsByKey'][1] = JSON.stringify(tAut.toolsByKey);
								overwriteMenuProperties(); // Updates panel
								tAut.loadDependencies();
							}, flags
						});
						menu.newCheckMenu(subMenuTools, tool.title, void (0), () => !!tAut.toolsByKey[key]);
					});
					menu.newSeparator(subMenuTools);
					['Enable all', 'Disable all'].forEach((entryText, i) => {
						menu.newEntry({
							menuName: subMenuTools, entryText: entryText, func: () => {
								tAut.tools.forEach((tool) => { tAut.toolsByKey[tool.key] = i ? false : tool.bAvailable; });
								tAut.incompatibleTools.uniValues().forEach((tool) => { tAut.toolsByKey[tool] = false; });
								menu_properties['toolsByKey'][1] = JSON.stringify(tAut.toolsByKey);
								overwriteMenuProperties(); // Updates panel
								tAut.loadDependencies();
							}
						});
					});
					menu.newEntry({
						menuName: subMenuTools, entryText: 'Invert selected tools', func: () => {
							tAut.tools.forEach((tool) => { tAut.toolsByKey[tool.key] = tool.bAvailable ? !tAut.toolsByKey[tool.key] : false; });
							tAut.incompatibleTools.uniValues().forEach((tool) => { tAut.toolsByKey[tool] = false; });
							menu_properties['toolsByKey'][1] = JSON.stringify(tAut.toolsByKey);
							overwriteMenuProperties(); // Updates panel
							tAut.loadDependencies();
						}
					});
					// Refresh settings on startup
					menu.newCondEntry({
						entryText: 'Tagger (cond)', condFunc: (bInit = true) => {
							if (bInit) { tAut.changeTools(JSON.parse(menu_properties['toolsByKey'][1])); }
						}
					});
					// -> Config menu
					if (!Object.hasOwn(menusEnabled, configMenu) || menusEnabled[configMenu] === true) {
						const subMenu = menu.newMenu('Batch tagger', configMenu, !tAut.isRunning() ? MF_STRING : MF_GRAYED);
						{
							const subMenuTwo = menu.newMenu('Quiet mode', subMenu);
							menu.newEntry({ menuName: subMenuTwo, entryText: 'Disable user input and reports:', flags: MF_GRAYED });
							menu.newSeparator(subMenuTwo);
							Object.keys(tAut.quietByKey).forEach((key) => {
								menu.newEntry({
									menuName: subMenuTwo, entryText: tAut.titlesByKey[key], func: () => {
										const quietByKey = JSON.parse(menu_properties.quietByKey[1]);
										tAut.quietByKey[key] = quietByKey[key] = !tAut.quietByKey[key];
										menu_properties.quietByKey[1] = JSON.stringify(quietByKey);
										overwriteMenuProperties();
									}, flags: ['biometric', 'masstagger'].includes(key) || !tAut.availableByKey[key] ? MF_GRAYED : MF_STRING
								});
								menu.newCheckMenuLast(() => tAut.quietByKey[key]);
							});
							menu.newSeparator(subMenuTwo);
							menu.newEntry({
								menuName: subMenuTwo, entryText: 'Switch all', func: () => {
									const quietByKey = JSON.parse(menu_properties.quietByKey[1]);
									const keys = Object.keys(tAut.quietByKey);
									const current = keys.every((key) => tAut.quietByKey[key] || !tAut.availableByKey[key]);
									keys.forEach((key) => {
										if (['biometric', 'masstagger'].includes(key) || !tAut.availableByKey[key]) { return; }
										tAut.quietByKey[key] = quietByKey[key] = !current;
									});
									menu_properties.quietByKey[1] = JSON.stringify(quietByKey);
									overwriteMenuProperties();
								}, flags: MF_STRING
							});
						}
						[
							{ menu: 'Tagging menu entries', key: 'menuByKey', tip: 'Contextual menu entries called:' },
							{ menu: 'Remove tags menu entries', key: 'menuRemoveByKey', tip: 'Contextual menu entries called:' },
							{ menu: 'Tags per tool', key: 'tagsByKey', tip: 'Associated tags:' },

						].forEach((opt) => {
							const subMenuTwo = menu.newMenu(opt.menu, subMenu);
							menu.newEntry({ menuName: subMenuTwo, entryText: opt.tip, flags: MF_GRAYED });
							menu.newSeparator(subMenuTwo);
							for (const key in tAut[opt.key]) {
								if (tAut[opt.key][key]) {
									menu.newEntry({
										menuName: subMenuTwo, entryText: tAut.titlesByKey[key] + '...', func: () => {
											const input = Input.json(
												'array strings', tAut[opt.key][key],
												key === 'tagsByKey'
													? 'Enter associated tag(s):\n(JSON array of strings)\n\nThe script will check if these tags are successfully removed/added.'
													: 'Enter menu entry(s):\n(JSON array of strings)\n\nThe script will try to run all until any of them is successful.',
												tAut.titlesByKey[key],
												key === 'tagsByKey'
													? '["REPLAYGAIN_ALBUM_GAIN", "REPLAYGAIN_ALBUM_PEAK", "REPLAYGAIN_TRACK_GAIN", "REPLAYGAIN_TRACK_PEAK"]'
													: '["Utilities/Create Audio MD5 checksum"]',
												void (0), true
											);
											if (input === null) { return; }
											const prop = JSON.parse(menu_properties[opt.key][1]);
											prop[key] = tAut[opt.key][key] = input;
											menu_properties[opt.key][1] = JSON.stringify(prop);
											overwriteMenuProperties();
										}
									});
								}
							};
						});
						menu.newSeparator(subMenu);
						menu.newEntry({
							menuName: subMenu, entryText: 'Wine ffmpeg bug workaround', func: () => {
								menu_properties.bWineBug[1] = !menu_properties.bWineBug[1];
								tAut.bWineBug = menu_properties.bWineBug[1];
								overwriteMenuProperties();
							}
						});
						menu.newCheckMenu(subMenu, 'Wine ffmpeg bug workaround', void (0), () => { return menu_properties.bWineBug[1]; });
						menu.newEntry({
							menuName: subMenu, entryText: 'Show format warning popups', func: () => {
								menu_properties.bFormatPopups[1] = !menu_properties.bFormatPopups[1];
								tAut.bFormatPopups = menu_properties.bFormatPopups[1];
								overwriteMenuProperties();
							}
						});
						menu.newCheckMenu(subMenu, 'Show format warning popups', void (0), () => menu_properties.bFormatPopups[1]);
						menu.newEntry({
							menuName: subMenu, entryText: 'Show tool info popups', func: () => {
								menu_properties.bToolPopups[1] = !menu_properties.bToolPopups[1];
								tAut.bToolPopups = menu_properties.bToolPopups[1];
								overwriteMenuProperties();
							}
						});
						menu.newCheckMenu(subMenu, 'Show tool info popups', void (0), () => menu_properties.bToolPopups[1]);
						menu.newEntry({
							menuName: subMenu, entryText: 'Ask confirmation before running', func: () => {
								menu_properties.bRunPopup[1] = !menu_properties.bRunPopup[1];
								tAut.bRunPopup = menu_properties.bRunPopup[1];
								overwriteMenuProperties();
							}
						});
						menu.newCheckMenu(subMenu, 'Ask confirmation before running', void (0), () => menu_properties.bRunPopup[1]);
					}
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); }
			}
		}
		{	// Average tags
			const scriptPath = folders.xxx + 'main\\tags\\aggregate_tagger.js';
			/* global aggregateTagger:readable */
			if (_isFile(scriptPath)) {
				const name = 'Group Tagger';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\group_tagger.txt';
					const subMenuName = menu.newMenu(name, menuName);
					menu.newEntry({ menuName: subMenuName, entryText: 'Group tagging:', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
					['average', 'sum', 'count', 'median', 'mode'].forEach((mode) => {
						const subMenuNameTwo = menu.newMenu(capitalize(mode), subMenuName);
						[
							{ entryText: 'By Album', group: '%ALBUM%|%DATE%|%COMMENT%', destEx: 'ALBUMRATING', destModeEx: 'ALBUMGENRE' },
							{ entryText: 'sep' },
							{ entryText: 'By Artist', group: '%ARTIST%', destEx: 'ARTISTRATING', destModeEx: 'ARTISTGENRE' },
							{ entryText: 'By Album Artist', group: '%ALBUM ARTIST%', destEx: 'ALBUMARTISTRATING', destModeEx: 'ALBUMARTISTGENRE' },
							{ entryText: 'By 1st Artist', group: '$if2($meta(ALBUM ARTIST,0),$meta(ARTIST,0))', destEx: 'ARTISTRATING', destModeEx: 'ARTISTGENRE' },
							{ entryText: 'sep' },
							{ entryText: 'By Date', group: globTags.date, destEx: 'DATERATING', destModeEx: 'DATEGENRE' },
							{ entryText: 'By Decade', group: '$div(' + _t(globTags.date) + ',10)0s', destEx: 'DECADERATING', destModeEx: 'DECADEGENRE' },
							{ entryText: 'sep' },
							{ entryText: 'Custom group...' },
						].forEach((entry) => {
							if (menu.isSeparator(entry)) { menu.newSeparator(subMenuNameTwo); }
							else {
								menu.newEntry({
									menuName: subMenuNameTwo, entryText: entry.entryText, func: () => {
										const handleList = fb.GetSelections(1);
										if (handleList && handleList.Count) {
											const source = mode === 'mode'
												? Input.string('string', 'GENRE|STYLE', 'Tag(s) to check:\n\nMultiple tags are allowed, separated by \'|\'.\nDon\'t enclose them with \'%\', i.e. TAG not %TAG%.', 'Group tagging: source', 'GENRE|STYLE') || (Input.isLastEqual ? Input.lastInput : null)
												: Input.string('string', '[%RATING%]', 'Tag to aggregate:\n\nTF expressions are also allowed as long as the output is a single number. Beware of missing tags not enclosed on \'[]\' since they will output \'?\' instead of nothing.', 'Group tagging: source', '[%RATING%]') || (Input.isLastEqual ? Input.lastInput : null);
											if (source === null) { return null; }
											const destination = mode === 'mode'
												? Input.string('string', entry.destModeEx || 'ALBUMGENRE', 'Destination tag:\n\nDon\'t enclose it with \'%\', i.e. TAG not %TAG%.', 'Group tagging: destination', entry.destModeEx || 'ALBUMGENRE') || (Input.isLastEqual ? Input.lastInput : null)
												: Input.string('string', entry.destEx || 'ALBUMRATING', 'Destination tag:\n\nDon\'t enclose it with \'%\', i.e. TAG not %TAG%.', 'Group tagging: destination', entry.destEx || 'ALBUMRATING') || (Input.isLastEqual ? Input.lastInput : null);
											if (destination === null) { return null; }
											const group = entry.group || Input.string('string', '%ALBUM ARTIST%|%ALBUM%|%DATE%|%COMMENT%', 'TF expression for track groups:', 'Group tagging: group TF', '%ALBUM ARTIST%|%ALBUM%|%DATE%|%COMMENT%') || (Input.isLastEqual ? Input.lastInput : null);
											if (group === null) { return null; }
											const count = mode === 'average' || mode === 'count'
												? entry.count || Input.string('string', '1', 'TF expression for track count:\n\nNote in most cases it should be 1, unless you want to weight averages by duration, etc.', 'Group tagging: count TF', '1') || (Input.isLastEqual ? Input.lastInput : null)
												: 1;
											if (count === null) { return null; }
											const defaultVal = mode === 'mode'
												? null
												: Input.number('real', 0, 'Default value for missing tags:\n\nClicking on cancel will skip any track without source tag.', 'Group tagging: default value', 0) || (Input.isLastEqual ? Input.lastInput : null);
											const modeVal = mode === 'mode'
												? Input.number('real', 1, 'How many values do you want to retrieve by frequency?\n\nBy default it outputs only the most frequent value.', 'Group tagging: mode values', 1) || (Input.isLastEqual ? Input.lastInput : null)
												: 1;
											aggregateTagger(handleList, source, destination, group, count, { round: 2, bAsk: true, mode, defaultVal, modeVal });
										}
									}
								});
							}
						});
					});
					menu.newSeparator(menuName);
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); }
			}
		}
		{	// Playlist revive
			const scriptPath = folders.xxx + 'main\\playlists\\playlist_revive.js';
			/* global findDeadItems:readable, playlistReviveAll:readable, playlistRevive:readable, selectDeadItems:readable */
			if (_isFile(scriptPath)) {
				const name = 'Playlist Revive';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\playlist_revive.txt';
					{	// Submenu
						const subMenuName = menu.newMenu(name, menuName);
						// Create new properties with previous args
						menu_properties['simThreshold'] = ['\'Other tools\\Playlist Revive\' similarity', 0.50];
						// Checks
						menu_properties['simThreshold'].push({ range: [[0, 1]], func: !Number.isNaN }, menu_properties['simThreshold'][1]);
						// Menus
						menu.newEntry({ menuName: subMenuName, entryText: 'Replaces dead items with tracks from library:', func: null, flags: MF_GRAYED });
						menu.newSeparator(subMenuName);
						menu.newEntry({ menuName: subMenuName, entryText: 'Find dead items (all playlists)', func: findDeadItems });
						menu.newEntry({ menuName: subMenuName, entryText: 'Revive dead items (all playlists)', func: playlistReviveAll });
						menu.newSeparator(subMenuName);
						menu.newEntry({
							menuName: subMenuName, entryText: 'Revive dead items (active playlist)', func: () => {
								playlistRevive({ selItems: plman.GetPlaylistItems(plman.ActivePlaylist), simThreshold: menu_properties['simThreshold'][1], bFindAlternative: true });
							}, flags: playlistCountFlagsAddRem
						});
						menu.newEntry({
							menuName: subMenuName, entryText: 'Select dead items (active playlist)', func: () => {
								selectDeadItems(plman.ActivePlaylist);
							}, flags: focusFlags
						});
						menu.newSeparator(subMenuName);
						menu.newEntry({
							menuName: subMenuName, entryText: 'Revive dead items (on selection)', func: () => {
								playlistRevive({ selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: menu_properties['simThreshold'][1], bFindAlternative: true });
							}, flags: () => focusFlags() | playlistCountFlagsAddRem() | selectedFlags()
						});
						menu.newEntry({
							menuName: subMenuName, entryText: 'Simulate (on selection)', func: () => {
								playlistRevive({ selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: menu_properties['simThreshold'][1], bFindAlternative: true, bSimulate: true });
							}, flags: () => focusFlags() | selectedFlags()
						});
						menu.newSeparator(subMenuName);
						menu.newEntry({
							menuName: subMenuName, entryText: () => 'Sets similarity threshold...' + '\t' + _b(menu_properties['simThreshold'][1]), func: () => {
								const input = Number(utils.InputBox(window.ID, 'Float number between 0 and 1:', scriptName + ': ' + name, menu_properties['simThreshold'][1]));
								if (menu_properties['simThreshold'][1] === input) { return; }
								if (!Number.isFinite(input)) { return; }
								if (input < 0 || input > 1) { return; }
								menu_properties['simThreshold'][1] = input;
								overwriteMenuProperties(); // Updates panel
							}
						});
					}

				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); }
			}
		}
		{	// Import track list
			const scriptPath = folders.xxx + 'main\\playlists\\import_text_playlist.js';
			/* global ImportTextPlaylist:readable */
			if (_isFile(scriptPath)) {
				const name = 'Import track list';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\import_text_playlist.txt';
					{	// Submenu
						const subMenuName = menu.newMenu(name, menuName);
						// Create new properties with previous args
						menu_properties['importPlaylistPath'] = ['\'Other tools\\Import track list\' path', '.\\profile\\' + folders.dataName + 'track_list_to_import.txt'];
						menu_properties['importPlaylistMask'] = ['\'Other tools\\Import track list\' pattern', JSON.stringify(['. ', '%TITLE%', ' - ', globTags.artist])];
						menu_properties['importPlaylistFilters'] = ['\'Other tools\\Import track list\' filters', JSON.stringify([globQuery.stereo, globQuery.notLowRating, globQuery.noLive, globQuery.noLiveNone])];
						// Checks
						menu_properties['importPlaylistPath'].push({ func: isString, portable: true }, menu_properties['importPlaylistPath'][1]);
						menu_properties['importPlaylistMask'].push({ func: isJSON }, menu_properties['importPlaylistMask'][1]);
						menu_properties['importPlaylistFilters'].push({ func: (x) => { return isJSON(x) && JSON.parse(x).every((query) => { return checkQuery(query, true); }); } }, menu_properties['importPlaylistFilters'][1]);
						// Presets
						const maskPresets = [
							{ name: 'Numbered Track list', val: JSON.stringify(['. ', '%TITLE%', ' - ', globTags.artist]), discard: '#' },
							{ name: 'Track list', val: JSON.stringify(['%TITLE%', ' - ', globTags.artist]), discard: '#' },
							{ name: 'M3U Extended', val: JSON.stringify(['#EXTINF:', ',', globTags.artist, ' - ', '%TITLE%']), discard: '' }
						];
						// Menus
						menu.newEntry({ menuName: subMenuName, entryText: 'Find matches on library from a txt file:', func: null, flags: MF_GRAYED });
						menu.newSeparator(subMenuName);
						menu.newEntry({
							menuName: subMenuName, entryText: 'Import from file \\ url...', func: () => {
								let bPresetUsed = false;
								let discardMask = '';
								let path;
								try { path = utils.InputBox(window.ID, 'Enter path to text file with list of tracks:', scriptName + ': ' + name, folders.xxx + 'examples\\track_list_to_import.txt', true); }
								catch (e) { return; } // eslint-disable-line no-unused-vars
								if (!_isFile(path) && !path.includes('http://') && !path.includes('https://')) {
									fb.ShowPopupMessage('File not found:\n\n' + path, window.Name + ': ' + name);
									return;
								}
								let formatMask = Input.string(
									'string',
									menu_properties.importPlaylistMask[1].replace(/"/g, '\''),
									'Enter pattern to retrieve tracks. Mask is saved for future use.\nPresets at bottom may also be loaded by their number ([x]).\n\nTo discard a section, use \'\' or "".\nTo match a section, put the exact chars to match.\nStrings with \'%\' are considered tags to extract.\n\n[\'. \', \'%TITLE%\', \' - \', \'%ALBUM ARTIST%\'] matches something like:\n1. Respect - Aretha Franklin' + (maskPresets.length ? '\n\n' + maskPresets.map((preset, i) => { return '[' + i + ']' + (preset.name.length ? ' ' + preset.name : '') + ': ' + preset.val; }).join('\n') : ''),
									scriptName + ': ' + name,
									maskPresets[0].val, void (0), true
								) || Input.lastInput;
								if (formatMask === null) { return; }
								try {
									formatMask = formatMask.replace(/'/g, '"');
									// Load preset if possible
									if (formatMask.search(/^\[\d*\]/g) !== -1) {
										const idx = formatMask.slice(1, -1);
										formatMask = idx >= 0 && idx < maskPresets.length ? maskPresets[idx].val : null;
										discardMask = idx >= 0 && idx < maskPresets.length ? maskPresets[idx].discard : null;
										bPresetUsed = true;
										if (!formatMask) { console.log('Playlist Tools: Invalid format mask preset'); return; }
									}
									// Parse mask
									formatMask = JSON.parse(formatMask);
								}
								catch (e) { console.log('Playlist Tools: Invalid format mask'); return; } // eslint-disable-line no-unused-vars
								if (!formatMask) { return; }
								if (!bPresetUsed) {
									discardMask = Input.string(
										'string',
										'',
										'Any line starting with the following string will be skipped:\n(For ex. to skip lines starting with \'#BLABLABLA...\', write \'#\')',
										window.Name
									) || Input.lastInput;
									if (discardMask === null) { return; }
								}
								const queryFilters = JSON.parse(menu_properties.importPlaylistFilters[1]);
								ImportTextPlaylist.getPlaylist({ path, formatMask, discardMask, queryFilters })
									.then((data) => {
										if (data.idx !== -1) { plman.ActivePlaylist = data.idx; }
										menu_properties.importPlaylistMask[1] = JSON.stringify(formatMask); // Save last mask used
										overwriteMenuProperties(); // Updates panel
									});
							}
						});
						menu.newEntry({
							menuName: subMenuName, entryText: 'Import from custom path', func: () => {
								const path = menu_properties.importPlaylistPath[1];
								if (!_isFile(path) && !path.includes('http://') && !path.includes('https://')) {
									fb.ShowPopupMessage('File not found:\n\n' + path, window.Name + ': ' + name);
									return;
								}
								const formatMask = JSON.parse(menu_properties.importPlaylistMask[1]);
								const queryFilters = JSON.parse(menu_properties.importPlaylistFilters[1]);
								ImportTextPlaylist.getPlaylist({ path, formatMask, queryFilters })
									.then((data) => {
										if (data.idx !== -1) { plman.ActivePlaylist = data.idx; }
									});
							}
						});
						menu.newSeparator(subMenuName);
						menu.newEntry({
							menuName: subMenuName, entryText: 'Configure filters...', func: () => {
								let input;
								try { input = utils.InputBox(window.ID, 'Enter array of queries to apply as consecutive conditions:\n\n[\'%CHANNELS% LESS 3\', \'' + globTags.rating + ' GREATER 2\']\n\nThe example would try to find matches with 2 or less channels, then filter those results with rating > 2. In case the later filter does not output at least a single track, then will be skipped and only the previous filter applied (channels)... and so on (for more filters).', scriptName + ': ' + name, menu_properties.importPlaylistFilters[1].replace(/"/g, '\''), true).replace(/'/g, '"'); }
								catch (e) { return; } // eslint-disable-line no-unused-vars
								if (!input.length) { input = '[]'; }
								try { JSON.parse(input); }
								catch (e) { console.log('Playlist Tools: Invalid filter array'); return; } // eslint-disable-line no-unused-vars
								if (input !== menu_properties.importPlaylistFilters[1]) { menu_properties.importPlaylistFilters[1] = input; }
								overwriteMenuProperties(); // Updates panel
							}
						});
						menu.newEntry({
							menuName: subMenuName, entryText: 'Set custom path...', func: () => {
								const path = menu_properties.importPlaylistPath[1];
								const input = Input.string('string', menu_properties.importPlaylistPath[1], 'Enter file path:', window.Name + ': ' + name, menu_properties.importPlaylistPath[3], [(s) => path.includes('http://') || path.includes('https://') || sanitizePath(s) === s], true);
								if (input === null) { return; }
								menu_properties.importPlaylistPath[1] = input;
								overwriteMenuProperties(); // Updates panel
							}
						});
					}
					menu.newSeparator(menuName);
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); }
			}
		}
		{	// Playlist History
			const scriptPath = folders.xxx + 'helpers\\playlist_history.js';
			/* global PlsHistory:readable, getPlaylistIndexArray:readable,  */
			if (_isFile(scriptPath)) {
				const name = 'Playlist History';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					const plsHistory = new PlsHistory();
					const subMenuName = menu.newMenu(name, menuName);
					menu.newEntry({ menuName: subMenuName, entryText: 'Switch to previous playlists:', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
					menu.newEntry({ menuName: subMenuName, entryText: 'Previous playlist', func: plsHistory.goPrevPls, flags: () => { return (plsHistory.size() >= 2 ? MF_STRING : MF_GRAYED); } });
					menu.newCondEntry({
						entryText: 'Playlist History (cond)', condFunc: () => {
							const [, ...list] = plsHistory.getAll();
							menu.newSeparator(subMenuName);
							if (!list.length) { menu.newEntry({ menuName: subMenuName, entryText: '-None-', func: null, flags: MF_GRAYED }); }
							list.forEach((pls) => {
								menu.newEntry({
									menuName: subMenuName, entryText: pls.name, func: () => {
										const idx = getPlaylistIndexArray(pls.name);
										if (idx.length) {
											if (idx.length === 1 && idx[0] !== -1) {
												plman.ActivePlaylist = idx[0];
											} else if (idx.includes(pls.idx)) {
												plman.ActivePlaylist = pls.idx;
											}
										}
									}
								});
							});
						}, flags: () => { return (plsHistory.size >= 2 ? MF_STRING : MF_GRAYED); }
					});
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); }
			}
		}
		menu.newSeparator();
	} else { menuDisabled.push({ menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); }
}