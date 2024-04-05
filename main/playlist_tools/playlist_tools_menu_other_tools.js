'use strict';
//05/04/24

/* global menusEnabled:readable, readmes:readable, menu:readable, newReadmeSep:readable, scriptName:readable, defaultArgs:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, menu_properties:writable, overwriteMenuProperties:readable, multipleSelectedFlags:readable, playlistCountFlagsAddRem:readable, focusFlags:readable, selectedFlags:readable, selectedFlags:readable */

/* global MF_GRAYED:readable, folders:readable, _isFile:readable, _isFolder:readable, globTags:readable, VK_SHIFT:readable, clone:readable, MF_STRING:readable, _b:readable, globQuery:readable, isString:readable, isJSON:readable, Input:readable, sanitizePath:readable, checkQuery:readable */

// Other tools
{
	const name = 'Other tools';
	if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name] === true) {
		readmes[newReadmeSep()] = 'sep';
		let menuName = menu.newMenu(name);
		{	// Check tags
			const scriptPath = folders.xxx + 'main\\tags\\check_library_tags.js';
			/* global checkTags_properties:readable, checkTags:readable, addTagsToExclusion:readable */
			if (_isFile(scriptPath)) {
				const name = 'Check tags';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name] === true) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\check_library_tags.txt';
					const subMenuName = menu.newMenu(name, menuName);
					// Delete unused properties
					const toDelete = ['bUseDic'];
					let toMerge = {}; // Deep copy
					Object.keys(checkTags_properties).forEach((key) => {
						if (toDelete.indexOf(key) === -1) {
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
					];
					// Menus
					menu.newEntry({ menuName: subMenuName, entryText: 'Reports tagging errors (on selection):', func: null, flags: MF_GRAYED });
					menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
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
						const subMenuSecondName = menu.newMenu('Check only...', subMenuName);
						menu.newEntry({ menuName: subMenuSecondName, entryText: 'Limits comparisons to:', func: null, flags: MF_GRAYED });
						menu.newEntry({ menuName: subMenuSecondName, entryText: 'sep' });
						tagsToCheck.forEach((obj) => {
							if (obj === 'sep') { menu.newEntry({ menuName: subMenuSecondName, entryText: 'sep' }); return; }
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
					menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
					menu.newEntry({ menuName: subMenuName, entryText: 'Reports all tags. Slow! (on selection):', func: null, flags: MF_GRAYED });
					menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
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
						const subMenuSecondName = menu.newMenu('Report all from...', subMenuName);
						menu.newEntry({ menuName: subMenuSecondName, entryText: 'Limits comparisons to:', func: null, flags: MF_GRAYED });
						menu.newEntry({ menuName: subMenuSecondName, entryText: 'sep' });
						tagsToCheck.forEach((obj) => {
							if (obj === 'sep') { menu.newEntry({ menuName: subMenuSecondName, entryText: 'sep' }); return; }
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
					menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
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
						const subMenuSecondName = menu.newMenu('Configure dictionary...', subMenuName);
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
								const input = utils.InputBox(window.ID, 'Dictionary name:\n(available: de_DE, en_GB, en_US, fr_FR)\n', scriptName + ': ' + name, menu_properties['dictName'][1]);
								if (menu_properties['dictName'][1] === input) { return; }
								if (!input.length) { return; }
								const dictPath = menu_properties['dictPath'][1] + '\\' + input;
								if (!_isFolder(dictPath)) { fb.ShowPopupMessage('Folder does not exist:\n' + dictPath, scriptName); return; }
								menu_properties['dictName'][1] = input;
								overwriteMenuProperties(); // Updates panel
							}
						});
						menu.newEntry({
							menuName: subMenuSecondName, entryText: 'Sets dictionaries folder...', func: () => {
								let input = utils.InputBox(window.ID, 'Path to all dictionaries subfolders:\n(set to empty to restore default path)', scriptName + ': ' + name, menu_properties['dictPath'][1]);
								if (menu_properties['dictPath'][1] === input) { return; }
								if (!input.length) { input = menu_properties['dictPath'][3]; }
								if (!_isFolder(input)) { fb.ShowPopupMessage('Folder does not exist:\n' + input, scriptName); return; }
								menu_properties['dictPath'][1] = input;
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
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); } // NOSONAR
			}
		}
		{	// Automate tags
			const scriptPath = folders.xxx + 'main\\tags\\tags_automation.js';
			/* global TagAutomation:readable */
			if (_isFile(scriptPath)) {
				const name = 'Write tags';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name] === true) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\tags_automation.txt';
					const tAut = new TagAutomation();
					menu_properties['toolsByKey'] = ['\'Other tools\\Write tags\' tools enabled', JSON.stringify(tAut.toolsByKey)];
					const subMenuName = menu.newMenu(name, menuName);
					const firedFlags = () => { return tAut.isRunning() ? MF_STRING : MF_GRAYED; };
					const allFlags = () => { return (!tAut.isRunning() ? selectedFlags() : MF_GRAYED); };
					menu.newEntry({ menuName: subMenuName, entryText: 'Automatize tagging:', func: null, flags: MF_GRAYED });
					menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
					menu.newEntry({
						menuName: subMenuName, entryText: () => { return 'Add tags on batch to selected tracks' + (tAut.isRunning() ? ' (running)' : ''); }, func: () => {
							tAut.run();
							// Apply animation on registered parent button...
							if (defaultArgs.parent) { defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, () => { return !tAut.isRunning(); }); }
						}, flags: allFlags
					});
					menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
					menu.newEntry({ menuName: subMenuName, entryText: () => { return 'Manually force next step' + (tAut.isRunning() ? '' : ' (not running)'); }, func: tAut.nextStepTag, flags: firedFlags });
					menu.newEntry({ menuName: subMenuName, entryText: () => { return 'Stop execution' + (tAut.isRunning() ? '' : ' (not running)'); }, func: tAut.stopStepTag, flags: firedFlags });
					menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
					const subMenuTools = menu.newMenu('Available tools...', subMenuName);
					menu.newEntry({ menuName: subMenuTools, entryText: 'Toggle (click) / Single (Shift + click):', func: null, flags: MF_GRAYED });
					menu.newEntry({ menuName: subMenuTools, entryText: 'sep' });
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
						menu.newCheckMenu(subMenuTools, tool.title, void (0), () => { return tAut.toolsByKey[key]; });
					});
					menu.newEntry({ menuName: subMenuTools, entryText: 'sep' });
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
						entryText: 'Write tags... (cond)', condFunc: (bInit = true) => {
							if (bInit) { tAut.changeTools(JSON.parse(menu_properties['toolsByKey'][1])); }
						}
					});
					menu.newEntry({ menuName, entryText: 'sep' });
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); }
			}
		}
		{	// Playlist revive
			const scriptPath = folders.xxx + 'main\\playlists\\playlist_revive.js';
			/* global findDeadItems:readable, playlistReviveAll:readable, playlistRevive:readable, selectDeadItems:readable */
			if (_isFile(scriptPath)) {
				const name = 'Playlist Revive';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name] === true) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\playlist_revive.txt';
					{	// Submenu
						const subMenuName = menu.newMenu(name, menuName);
						// Create new properties with previous args
						menu_properties['simThreshold'] = ['\'Other tools\\Playlist Revive\' similarity', 0.50];
						// Checks
						menu_properties['simThreshold'].push({ range: [[0, 1]], func: !Number.isNaN }, menu_properties['simThreshold'][1]);
						// Menus
						menu.newEntry({ menuName: subMenuName, entryText: 'Replaces dead items with ones in library:', func: null, flags: MF_GRAYED });
						menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
						menu.newEntry({ menuName: subMenuName, entryText: 'Find dead items in all playlists', func: findDeadItems });
						menu.newEntry({ menuName: subMenuName, entryText: 'Replace dead items in all playlists', func: playlistReviveAll });
						menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
						menu.newEntry({
							menuName: subMenuName, entryText: 'Replace dead items on current playlist', func: () => {
								playlistRevive({ selItems: plman.GetPlaylistItems(plman.ActivePlaylist), simThreshold: menu_properties['simThreshold'][1], bFindAlternative: true });
							}, flags: playlistCountFlagsAddRem
						});
						menu.newEntry({
							menuName: subMenuName, entryText: 'Select dead items on current playlist', func: () => {
								selectDeadItems(plman.ActivePlaylist);
							}, flags: focusFlags
						});
						menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
						menu.newEntry({
							menuName: subMenuName, entryText: 'Replace dead items on selection', func: () => {
								playlistRevive({ selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: menu_properties['simThreshold'][1], bFindAlternative: true });
							}, flags: () => focusFlags() | playlistCountFlagsAddRem() | selectedFlags()
						});
						menu.newEntry({
							menuName: subMenuName, entryText: 'Simulate on selection (see console)', func: () => {
								playlistRevive({ selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: menu_properties['simThreshold'][1], bFindAlternative: true, bSimulate: true });
							}, flags: () => focusFlags() | selectedFlags()
						});
						menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
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
			/* global importTextPlaylist:readable */
			if (_isFile(scriptPath)) {
				const name = 'Import track list';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name] === true) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\import_text_playlist.txt';
					{	// Submenu
						const subMenuName = menu.newMenu(name, menuName);
						// Create new properties with previous args
						menu_properties['importPlaylistPath'] = ['\'Other tools\\Import track list\' path', (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' : fb.ProfilePath) + folders.dataName + 'track_list_to_import.txt'];
						menu_properties['importPlaylistMask'] = ['\'Other tools\\Import track list\' pattern', JSON.stringify(['. ', '%TITLE%', ' - ', globTags.artist])];
						menu_properties['importPlaylistFilters'] = ['\'Other tools\\Import track list\' filters', JSON.stringify([globQuery.stereo, globQuery.notLowRating, globQuery.noLive, globQuery.noLiveNone])];
						// Checks
						menu_properties['importPlaylistPath'].push({ func: isString, portable: true }, menu_properties['importPlaylistPath'][1]);
						menu_properties['importPlaylistMask'].push({ func: isJSON }, menu_properties['importPlaylistMask'][1]);
						menu_properties['importPlaylistFilters'].push({ func: (x) => { return isJSON(x) && JSON.parse(x).every((query) => { return checkQuery(query, true); }); } }, menu_properties['importPlaylistFilters'][1]);
						// Presets
						const maskPresets = [
							{ name: 'Numbered Track list', val: JSON.stringify(['. ', '%TITLE%', ' - ', globTags.artist]) },
							{ name: 'Track list', val: JSON.stringify(['%TITLE%', ' - ', globTags.artist]) },
							{ name: 'M3U Extended', val: JSON.stringify(['#EXTINF:', ',', globTags.artist, ' - ', '%TITLE%']) }
						];
						// Menus
						menu.newEntry({ menuName: subMenuName, entryText: 'Find matches on library from a txt file:', func: null, flags: MF_GRAYED });
						menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
						menu.newEntry({
							menuName: subMenuName, entryText: 'Import from file \\ url...', func: () => {
								let path;
								try { path = utils.InputBox(window.ID, 'Enter path to text file with list of tracks:', scriptName + ': ' + name, folders.xxx + 'examples\\track_list_to_import.txt', true); }
								catch (e) { return; }
								if (!_isFile(path) && path.indexOf('http://') === -1 && path.indexOf('https://') === -1) {
									fb.ShowPopupMessage('File not found:\n\n' + path, window.Name + ': ' + name);
									return;
								}
								let formatMask;
								try { formatMask = utils.InputBox(window.ID, 'Enter pattern to retrieve tracks. Mask is saved for future use.\nPresets at bottom may also be loaded by their number([x]).\n\nTo discard a section, use \'\' or "".\nTo match a section, put the exact chars to match.\nStrings with \'%\' are considered tags to extract.\n\n[\'. \', \'%TITLE%\', \' - \', \'%ALBUM ARTIST%\'] matches something like:\n1. Respect - Aretha Franklin' + (maskPresets.length ? '\n\n' + maskPresets.map((preset, i) => { return '[' + i + ']' + (preset.name.length ? ' ' + preset.name : '') + ': ' + preset.val; }).join('\n') : ''), scriptName + ': ' + name, menu_properties.importPlaylistMask[1].replace(/"/g, '\''), true).replace(/'/g, '"'); }
								catch (e) { return; }
								try {
									// Load preset if possible
									if (formatMask.search(/^\[\d*\]/g) !== -1) {
										const idx = formatMask.slice(1, -1);
										formatMask = idx >= 0 && idx < maskPresets.length ? maskPresets[idx].val : null;
										if (!formatMask) { console.log('Playlist Tools: Invalid format mask preset'); return; }
									}
									// Parse mask
									formatMask = JSON.parse(formatMask);
								}
								catch (e) { console.log('Playlist Tools: Invalid format mask'); return; }
								if (!formatMask) { return; }
								const queryFilters = JSON.parse(menu_properties.importPlaylistFilters[1]);
								const idx = importTextPlaylist({ path, formatMask, queryFilters });
								if (idx !== -1) { plman.ActivePlaylist = idx; }
								menu_properties.importPlaylistMask[1] = JSON.stringify(formatMask); // Save last mask used
								overwriteMenuProperties(); // Updates panel
							}
						});
						menu.newEntry({
							menuName: subMenuName, entryText: 'Import from custom path', func: () => {
								const path = menu_properties.importPlaylistPath[1];
								if (!_isFile(path) && path.indexOf('http://') === -1 && path.indexOf('https://') === -1) {
									fb.ShowPopupMessage('File not found:\n\n' + path, window.Name + ': ' + name);
									return;
								}
								const formatMask = JSON.parse(menu_properties.importPlaylistMask[1]);
								const queryFilters = JSON.parse(menu_properties.importPlaylistFilters[1]);
								importTextPlaylist({ path, formatMask, queryFilters });
							}
						});
						menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
						menu.newEntry({
							menuName: subMenuName, entryText: 'Configure filters...', func: () => {
								let input;
								try { input = utils.InputBox(window.ID, 'Enter array of queries to apply as consecutive conditions:\n\n[\'%CHANNELS% LESS 3\', \'%RATING% GREATER 2\']\n\nThe example would try to find matches with 2 or less channels, then filter those results with rating > 2. In case the later filter does not output at least a single track, then will be skipped and only the previous filter applied (channels)... and so on (for more filters).', scriptName + ': ' + name, menu_properties.importPlaylistFilters[1].replace(/"/g, '\''), true).replace(/'/g, '"'); }
								catch (e) { return; }
								if (!input.length) { input = '[]'; }
								try { JSON.parse(input); }
								catch (e) { console.log('Playlist Tools: Invalid filter array'); return; }
								if (input !== menu_properties.importPlaylistFilters[1]) { menu_properties.importPlaylistFilters[1] = input; }
								overwriteMenuProperties(); // Updates panel
							}
						});
						menu.newEntry({
							menuName: subMenuName, entryText: 'Set custom path...', func: () => {
								const path = menu_properties.importPlaylistPath[1];
								const input = Input.string('string', menu_properties.importPlaylistPath[1], 'Enter file path:', window.Name + ': ' + name, menu_properties.importPlaylistPath[3], [(s) => path.indexOf('http://') !== -1 || path.indexOf('https://') !== -1 || sanitizePath(s) === s], true);
								if (input === null) { return; }
								menu_properties.importPlaylistPath[1] = input;
								overwriteMenuProperties(); // Updates panel
							}
						});
					}
					menu.newEntry({ menuName, entryText: 'sep' });
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); }
			}
		}
		{	// Playlist History
			const scriptPath = folders.xxx + 'helpers\\playlist_history.js';
			/* global PlsHistory:readable, getPlaylistIndexArray:readable,  */
			if (_isFile(scriptPath)) {
				const name = 'Playlist History';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name] === true) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					const plsHistory = new PlsHistory();
					const subMenuName = menu.newMenu(name, menuName);
					menu.newEntry({ menuName: subMenuName, entryText: 'Switch to previous playlists:', func: null, flags: MF_GRAYED });
					menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
					menu.newEntry({ menuName: subMenuName, entryText: 'Previous playlist', func: plsHistory.goPrevPls, flags: () => { return (plsHistory.size() >= 2 ? MF_STRING : MF_GRAYED); } });
					menu.newCondEntry({
						entryText: 'Playlist History... (cond)', condFunc: () => {
							const [, ...list] = plsHistory.getAll();
							menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
							if (!list.length) { menu.newEntry({ menuName: subMenuName, entryText: '-None-', func: null, flags: MF_GRAYED }); }
							list.forEach((pls) => {
								menu.newEntry({
									menuName: subMenuName, entryText: pls.name, func: () => {
										const idx = getPlaylistIndexArray(pls.name);
										if (idx.length) {
											if (idx.length === 1 && idx[0] !== -1) {
												plman.ActivePlaylist = idx[0];
											} else if (idx.indexOf(pls.idx) !== -1) {
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
		menu.newEntry({ entryText: 'sep' });
	} else { menuDisabled.push({ menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); }
}