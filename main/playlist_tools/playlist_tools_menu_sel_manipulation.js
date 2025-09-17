﻿'use strict';
//17/09/25

/* global menusEnabled:readable, readmes:readable, menu:readable, newReadmeSep:readable, scriptName:readable, defaultArgs:readable, defaultArgsClean:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, menu_properties:writable, overwriteMenuProperties:readable, forcedQueryMenusEnabled:readable, createSubMenuEditEntries:readable, configMenu:readable */

/* global MF_GRAYED:readable, folders:readable, _isFile:readable, isJSON:readable, globTags:readable, multipleSelectedFlagsReorder:readable, isStringWeak:readable, isBoolean:readable, MF_STRING:readable, isPlayCount:readable, Input:readable, playlistCountFlags:readable, selectedFlagsAddRem:readable, _p:readable, _qCond:readable, range:readable, focusInPlaylist:readable, isInt:readable, addLock:readable, selectedFlagsReorder:readable, playlistCountFlagsAddRem:readable, VK_CONTROL:readable, selectedFlags:readable, playlistCountFlagsRem:readable, isFunction:readable, selectedFlagsRem:readable, _t:readable, getHandleListTagsTyped:readable */

// Selection manipulation
{
	const name = 'Selection manipulation';
	if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
		readmes[newReadmeSep()] = 'sep';
		const menuName = menu.newMenu(name);
		{	// Legacy Sort
			const name = 'Sort';
			if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
				const subMenuName = menu.newMenu(name, menuName);
				{	// Legacy Sort (for use with macros!!)
					const selArgs = [
						{ name: 'Randomize', func: (idx) => { plman.SortByFormat(idx, '', true); } },
						{ name: 'Reverse', func: () => { fb.RunMainMenuCommand('Edit/Selection/Sort/Reverse'); } },
						{ name: 'sep' }
					];
					let sortLegacy = [
						{ name: 'Sort by Mood', tfo: '%' + globTags.mood + '%' },
						{ name: 'Sort by Date', tfo: globTags.date },
						{ name: 'Sort by BPM', tfo: '%' + globTags.bpm + '%' },
						{ name: 'sep' },
						{ name: 'Sort by Listen Rate (daily)', tfo: globTags.playCountRateGlobalDay },
						{ name: 'Sort by Listen Rate (weekly)', tfo: globTags.playCountRateGlobalWeek },
						{ name: 'Sort by Listen Rate (monthly)', tfo: globTags.playCountRateGlobalMonth },
						{ name: 'Sort by Listen Rate (yearly)', tfo: globTags.playCountRateGlobalYear },
						{ name: 'sep' },
						{ name: 'Sort by Listen Rate (added)', tfo: globTags.playCountRateSinceAdded },
						{ name: 'Sort by Listen Rate (played)', tfo: globTags.playCountRateSincePlayed },
						{ name: 'Sort by Overdue listens (added)', tfo: globTags.playCountExpectedSinceAdded },
						{ name: 'Sort by Overdue listens (played)', tfo: globTags.playCountExpectedSincePlayed }
					];
					let selArg = { name: 'Custom', tfo: sortLegacy[0].tfo };
					const sortLegacyDefaults = [...sortLegacy];
					// Create new properties with previous args
					menu_properties['sortLegacy'] = [menuName + '\\' + name + '  entries', JSON.stringify(sortLegacy)];
					menu_properties['sortLegacyCustomArg'] = [menuName + '\\' + name + ' Dynamic menu custom args', JSON.stringify(selArg)];
					// Check
					menu_properties['sortLegacy'].push({ func: isJSON }, menu_properties['sortLegacy'][1]);
					menu_properties['sortLegacyCustomArg'].push({ func: isJSON }, menu_properties['sortLegacyCustomArg'][1]);
					// Menus
					menu.newEntry({ menuName: subMenuName, entryText: 'Sort selection (legacy):', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
					// Helper
					const inputSort = (bCopyCurrent = false) => {
						let tfo = '';
						if (bCopyCurrent) {
							tfo = selArg.tfo;
						} else {
							try { tfo = utils.InputBox(window.ID, 'Enter TF expression:\n\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.\n(see \'Dynamic queries\' readme for more info)', scriptName + ': ' + name, selArg.tfo, true); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
						}
						if (!tfo.length) { return; }
						return { tfo };
					};
					// Static menus
					selArgs.forEach((selArg) => {
						menu.newEntry({
							menuName: subMenuName, entryText: selArg.name, func: () => {
								const ap = plman.ActivePlaylist;
								if (ap === -1) { return; }
								selArg.func(ap);
							}, flags: multipleSelectedFlagsReorder
						});
					});
					menu.newCondEntry({
						entryText: 'Sort selection (legacy) (cond)', condFunc: () => {
							// Entry list
							sortLegacy = JSON.parse(menu_properties['sortLegacy'][1]);
							const entryNames = new Set();
							sortLegacy.forEach((sortObj) => {
								// Add separators
								if (menu.isSeparator(sortObj)) {
									menu.newSeparator(subMenuName);
								} else {
									// Create names for all entries
									const sortName = sortObj.name.cut(30);
									if (entryNames.has(sortName)) {
										fb.ShowPopupMessage('There is an entry with duplicated name:\t' + sortName + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(sortObj, null, '\t'), scriptName + ': ' + name);
										return;
									} else { entryNames.add(sortName); }
									// Entries
									menu.newEntry({
										menuName: subMenuName, entryText: sortName, func: () => {
											const ap = plman.ActivePlaylist;
											if (ap === -1) { return; }
											plman.UndoBackup(ap);
											const focusHandle = fb.GetFocusItem(false);
											const tfo = focusHandle && sortObj.tfo.includes('#')
												? queryReplaceWithCurrent(sortObj.tfo, focusHandle)
												: sortObj.tfo;
											console.log('Playlist Tools: sorted selection by\n\t ' + tfo);
											plman.SortByFormat(ap, tfo, true);
										}, flags: multipleSelectedFlagsReorder
									});
								}
							});
							menu.newSeparator(subMenuName);
							{ // Static menu: user configurable
								menu.newEntry({
									menuName: subMenuName, entryText: 'By... (expression)', func: () => {
										const ap = plman.ActivePlaylist;
										if (ap === -1) { return; }
										// On first execution, must update from property
										selArg.tfo = JSON.parse(menu_properties['sortLegacyCustomArg'][1]).tfo;
										// Input
										const input = inputSort();
										if (!input) { return; }
										// Execute
										plman.UndoBackup(ap);
										const focusHandle = fb.GetFocusItem(false);
										const tfo = focusHandle && input.tfo.includes('#')
											? queryReplaceWithCurrent(input.tfo, focusHandle)
											: input.tfo;
										console.log('Playlist Tools: sorted selection by\n\t ' + tfo);
										plman.SortByFormat(ap, tfo, true);
										// For internal use original object
										selArg.tfo = tfo;
										menu_properties['sortLegacyCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
										overwriteMenuProperties(); // Updates panel
									}, flags: multipleSelectedFlagsReorder
								});
								// Menu to configure property
								menu.newSeparator(subMenuName);
							}
							{	// Add / Remove
								createSubMenuEditEntries(subMenuName, {
									name,
									list: sortLegacy,
									propName: 'sortLegacy',
									defaults: sortLegacyDefaults,
									defaultPreset: folders.xxx + 'presets\\Playlist Tools\\sort\\default.json',
									input: inputSort,
									bDefaultFile: true,
									bCopyCurrent: true
								});
							}
						}
					});
				}
			} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); } // NOSONAR
		}
		{	// Advanced Sort
			const name = 'Advanced sort';
			if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
				// Menus
				const subMenuName = menu.newMenu(name, menuName);
				menu.newEntry({ menuName: subMenuName, entryText: 'Sort selection (algorithm):', func: null, flags: MF_GRAYED });
				menu.newSeparator(subMenuName);
				const selArgs = [];
				{	// Sort by key
					const scriptPath = folders.xxx + 'main\\sort\\sort_by_key.js';
					/* global sortByKey:readable */
					if (_isFile(scriptPath)) {
						include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
						readmes[name + '\\' + 'Sort by Key'] = folders.xxx + 'helpers\\readme\\sort_by_key.txt';
						if (selArgs.length) { selArgs.push({ name: 'sep' }); }
						[
							{ name: 'Incremental key (Camelot Wheel)', func: sortByKey, args: { sortOrder: 1 } },
							{ name: 'Decremental key (Camelot Wheel)', func: sortByKey, args: { sortOrder: -1 } },
						].forEach((val) => { selArgs.push(val); });
					}
				}
				{
					const scriptPath = folders.xxx + 'main\\sort\\harmonic_mixing.js';
					/* global harmonicMixing:readable, harmonicMixingCycle:readable */
					if (_isFile(scriptPath)) {
						if (!Object.hasOwn(menu_properties, 'bHarmonicMixDoublePass')) { menu_properties['bHarmonicMixDoublePass'] = ['Harmonic mixing double pass to match more tracks', true]; }
						include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
						readmes[name + '\\' + 'Harmonic mix'] = folders.xxx + 'helpers\\readme\\harmonic_mixing.txt';
						const applyHarmonicMix = (args) => {
							const ap = plman.ActivePlaylist;
							args.selItems = plman.GetPlaylistSelectedItems(ap);
							args.bDoublePass = menu_properties.bHarmonicMixDoublePass[1];
							args.bDebug = defaultArgs.bDebug;
							// Apply harmonic mix on selection
							const profiler = defaultArgs.bProfile ? new FbProfiler('harmonicMixing') : null;
							const handleList = args.isCycle ? harmonicMixingCycle(args) : harmonicMixing(args);
							if (!handleList) { return; }
							// Find items which were not mixed
							const plsList = plman.GetPlaylistItems(ap).Convert();
							const total = plsList.length;
							const restList = [];
							args.selItems.Convert().forEach((handle) => {
								if (handleList.Find(handle) === -1) {
									restList.push(handle);
								}
							});
							restList.shuffle(); // To avoid non-random clusters
							// Insert back at selected indexes (in case it's not a contiguous selection)
							let i = 0;
							const selectionIdx = [];
							(handleList.Convert().concat(restList)).forEach((handle) => {
								while (i < total) {
									if (plman.IsPlaylistItemSelected(ap, i)) {
										selectionIdx.push(i);
										plsList[i] = handle;
										i++;
										break;
									}
									i++;
								}
							});
							// Rebuilt the entire playlist with the changes
							plman.UndoBackup(ap);
							plman.ClearPlaylist(ap);
							plman.InsertPlaylistItems(ap, 0, new FbMetadbHandleList(plsList));
							plman.SetPlaylistSelection(ap, selectionIdx, true);
							if (defaultArgs.bProfile) { profiler.Print(); }
						};
						if (selArgs.length) { selArgs.push({ name: 'sep' }); }
						selArgs.push({
							name: 'Harmonic mix (Camelot Wheel)', func: applyHarmonicMix, args: { bSendToPls: false }
						});
						selArgs.push({
							name: 'Random mix (Camelot Wheel)', func: applyHarmonicMix, args: {
								bSendToPls: false,
								patternOptions: {
									bRandomize: true,
									bFillPerfectMatch: true
								}
							}
						});
						selArgs.push({
							name: 'Harmonic cycle (Camelot Wheel)', func: applyHarmonicMix, args: {
								bSendToPls: false,
								isCycle: true,
								patternOptions: {
									movements: { // Values are percentages of the total sum
										perfectMatch: 30, // perfectMatch (=)
										energyBoost: 15, // energyBoost (+1)
										energyDrop: 15, // energyDrop (-1)
										energySwitch: 10, // energySwitch (B/A)
										moodBoost: 5, // moodBoost (+3)
										moodDrop: 5, // moodDrop (-3)
										energyRaise: 0, // energyRaise (+7)
										domKey: 10, // domKey (+1 & B/A) = energyBoost & energySwitch
										subDomKey: 10, // subDomKey (-1 & B/A) = energyDrop & energySwitch
									},
									bFillPerfectMatch: true
								}
							}
						});
						selArgs.push({
							name: 'Random cycle (Camelot Wheel)', func: applyHarmonicMix, args: {
								bSendToPls: false,
								isCycle: true,
								patternOptions: {
									movements: { // Values are percentages of the total sum
										perfectMatch: 40, // perfectMatch (=)
										energyBoost: 9, // energyBoost (+1)
										energyDrop: 9, // energyDrop (-1)
										energySwitch: 10, // energySwitch (B/A)
										moodBoost: 5, // moodBoost (+3)
										moodDrop: 4, // moodDrop (-3)
										energyRaise: 3, // energyRaise (+7)
										domKey: 10, // domKey (+1 & B/A) = energyBoost & energySwitch
										subDomKey: 10, // subDomKey (-1 & B/A) = energyDrop & energySwitch
									},
									bRandomize: true,
									bFillPerfectMatch: true
								}
							}
						});
						if (!Object.hasOwn(menusEnabled, configMenu) || menusEnabled[configMenu] === true) {
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
								menu.newSeparator(configMenu);
							}
						} else { menuDisabled.push({ menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
					}
				}
				{	// Sort by DynGenre
					const scriptPath = folders.xxx + 'main\\sort\\sort_by_dyngenre.js';
					/* global sortByDyngenre:readable */
					if (_isFile(scriptPath)) {
						include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
						readmes[name + '\\' + 'Sort by DynGenre'] = folders.xxx + 'helpers\\readme\\sort_by_dyngenre.txt';
						if (selArgs.length) { selArgs.push({ name: 'sep' }); }
						[
							{ name: 'Incremental genre/styles (DynGenre)', func: sortByDyngenre, args: { sortOrder: 1 } },
							{ name: 'Decremental genre/styles (DynGenre)', func: sortByDyngenre, args: { sortOrder: -1 } },
						].forEach((val) => { selArgs.push(val); });
					}
				}
				// Menus
				selArgs.forEach((selArg) => {
					menu.newEntry({ menuName: subMenuName, entryText: selArg.name, func: (args = { ...defaultArgsClean(), ...selArg.args }) => { selArg.func(args); }, flags: multipleSelectedFlagsReorder });
				});
			} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
		}
		{	// Scatter
			const scriptPath = folders.xxx + 'main\\sort\\scatter_by_tags.js';
			/* global scatterByTags:readable, intercalateByTags:readable */
			if (_isFile(scriptPath)) {
				const name = 'Scatter by tags';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\scatter_by_tags.txt';
					const subMenuName = menu.newMenu(name, menuName);
					let scatter = [
						{ name: 'Scatter instrumental tracks', args: { tagName: [globTags.genre, globTags.style].join(','), tagValue: 'instrumental,jazz,instrumental rock' } },
						{ name: 'Scatter acoustic tracks', args: { tagName: [globTags.genre, globTags.style, globTags.mood].join(','), tagValue: 'acoustic' } },
						{ name: 'Scatter electronic tracks', args: { tagName: [globTags.genre, globTags.style].join(','), tagValue: 'electronic' } },
						{ name: 'Scatter female vocal tracks', args: { tagName: [globTags.genre, globTags.style].join(','), tagValue: 'female vocal' } },
						{ name: 'sep' },
						{ name: 'Scatter sad mood tracks', args: { tagName: globTags.mood, tagValue: 'sad' } },
						{ name: 'Scatter aggressive mood tracks', args: { tagName: globTags.mood, tagValue: 'aggressive' } },

					];
					let selArg = { name: 'Custom', args: scatter[0].args };
					const scatterDefaults = [...scatter];
					// Create new properties with previous args
					menu_properties['scatter'] = [menuName + '\\' + name + '  entries', JSON.stringify(scatter)];
					menu_properties['scatterCustomArg'] = [menuName + '\\' + name + ' Dynamic menu custom args', JSON.stringify(selArg)];
					// Check
					menu_properties['scatter'].push({ func: isJSON }, menu_properties['scatter'][1]);
					menu_properties['scatterCustomArg'].push({ func: isJSON }, menu_properties['scatterCustomArg'][1]);
					// Helpers
					const inputScatter = (bCopyCurrent = false) => {
						let tagName = '';
						let tagValue = '';
						if (bCopyCurrent) {
							tagName = selArg.args.tagName;
							tagValue = selArg.args.tagValue;
							if (!tagValue.length || !tagName.length) { return; }
						} else {
							try { tagName = utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(multiple values may be separated by \';\')', scriptName + ': ' + name, selArg.args.tagName, true); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
							if (!tagName.length) { return; }
							try { tagValue = utils.InputBox(window.ID, 'Enter tag values to match:\n(multiple values may be separated by \',\')', scriptName + ': ' + name, selArg.args.tagValue, true); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
							if (!tagValue.length) { return; }
						}
						return { args: { tagName, tagValue } };
					};
					// Menus
					menu.newEntry({ menuName: subMenuName, entryText: 'Sort dispersing specific value(s):', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
					menu.newCondEntry({
						entryText: 'Scatter (cond)', condFunc: () => {
							// Entry list
							scatter = JSON.parse(menu_properties['scatter'][1]);
							const entryNames = new Set();
							scatter.forEach((obj) => {
								// Add separators
								if (menu.isSeparator(obj)) {
									menu.newSeparator(subMenuName);
								} else {
									// Create names for all entries
									const entryText = obj.name.cut(30);
									if (entryNames.has(entryText)) {
										fb.ShowPopupMessage('There is an entry with duplicated name:\t' + entryText + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(obj, null, '\t'), scriptName + ': ' + name);
										return;
									} else { entryNames.add(entryText); }
									// Entries
									menu.newEntry({
										menuName: subMenuName, entryText, func: (args = { ...defaultArgs, ...obj.args }) => {
											if (args.tagValue !== null) { scatterByTags(args); } else { intercalateByTags(args); }
										}, flags: multipleSelectedFlagsReorder
									});
								}
							});
							menu.newSeparator(subMenuName);
							{	// Static menu: user configurable
								menu.newEntry({
									menuName: subMenuName, entryText: 'By... (tag-value)', func: () => {
										const ap = plman.ActivePlaylist;
										if (ap === -1) { return; }
										// On first execution, must update from property
										selArg.args.tagName = JSON.parse(menu_properties['scatterCustomArg'][1]).args.tagName;
										// Input
										const input = inputScatter();
										if (!input) { return; }
										// Execute
										if (input.args.tagValue !== null) {
											scatterByTags({
												...defaultArgs,
												...input.args
											});
										} else {
											intercalateByTags({
												...defaultArgs,
												...input.args
											});
										}
										// For internal use original object
										selArg.args = input.args;
										menu_properties['scatterCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
										overwriteMenuProperties(); // Updates panel
									}, flags: multipleSelectedFlagsReorder
								});
								menu.newSeparator(subMenuName);
							}
							{	// Add / Remove
								createSubMenuEditEntries(subMenuName, {
									name,
									list: scatter,
									propName: 'scatter',
									defaults: scatterDefaults,
									defaultPreset: folders.xxx + 'presets\\Playlist Tools\\scatter\\default.json',
									input: inputScatter,
									bDefaultFile: true,
									bCopyCurrent: true
								});
							}
						}
					});
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
			}
		}
		{	// Intercalate
			const scriptPath = folders.xxx + 'main\\sort\\scatter_by_tags.js';
			if (_isFile(scriptPath)) {
				const name = 'Intercalate by tags';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\scatter_by_tags.txt';
					const subMenuName = menu.newMenu(name, menuName);
					let intercalate = [
						{ name: 'Intercalate same artist tracks', args: { tagName: globTags.artist, tagValue: null } },
						{ name: 'Intercalate same genre tracks', args: { tagName: globTags.genre, tagValue: null } },
						{ name: 'Intercalate same date tracks', args: { tagName: globTags.date, tagValue: null } },
						{ name: 'Intercalate same album tracks', args: { tagName: '%ALBUM%', tagValue: null } }
					];
					let selArg = { name: 'Custom', args: intercalate[0].args };
					const intercalateDefaults = [...intercalate];
					// Create new properties with previous args
					menu_properties['intercalate'] = [menuName + '\\' + name + '  entries', JSON.stringify(intercalate)];
					menu_properties['intercalateCustomArg'] = [menuName + '\\' + name + ' Dynamic menu custom args', JSON.stringify(selArg)];
					// Check
					menu_properties['intercalate'].push({ func: isJSON }, menu_properties['intercalate'][1]);
					menu_properties['intercalateCustomArg'].push({ func: isJSON }, menu_properties['intercalateCustomArg'][1]);
					// Helpers
					const inputIntercalate = (bCopyCurrent = false) => {
						let tagName = '';
						if (bCopyCurrent) {
							tagName = selArg.args.tagName;
						} else {
							try { tagName = utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(multiple values may be separated by \';\')', scriptName + ': ' + name, selArg.args.tagName, true); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
						}
						if (!tagName.length) { return; }
						return { args: { tagName, tagValue: null } };
					};
					// Menus
					menu.newEntry({ menuName: subMenuName, entryText: 'Sort without repeating same tag:', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
					menu.newCondEntry({
						entryText: 'Intercalate (cond)', condFunc: () => {
							// Entry list
							intercalate = JSON.parse(menu_properties['intercalate'][1]);
							const entryNames = new Set();
							intercalate.forEach((obj) => {
								// Add separators
								if (menu.isSeparator(obj)) {
									menu.newSeparator(subMenuName);
								} else {
									// Create names for all entries
									const entryText = obj.name.cut(30);
									if (entryNames.has(entryText)) {
										fb.ShowPopupMessage('There is an entry with duplicated name:\t' + entryText + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(obj, null, '\t'), scriptName + ': ' + name);
										return;
									} else { entryNames.add(entryText); }
									// Entries
									menu.newEntry({
										menuName: subMenuName, entryText, func: (args = { ...defaultArgs, ...obj.args }) => {
											if (args.tagValue !== null) { scatterByTags(args); } else { intercalateByTags(args); }
										}, flags: multipleSelectedFlagsReorder
									});
								}
							});
							menu.newSeparator(subMenuName);
							{	// Static menu: user configurable
								menu.newEntry({
									menuName: subMenuName, entryText: 'By... (tag)', func: () => {
										const ap = plman.ActivePlaylist;
										if (ap === -1) { return; }
										// On first execution, must update from property
										selArg.args.tagName = JSON.parse(menu_properties['intercalateCustomArg'][1]).args.tagName;
										// Input
										const input = inputIntercalate();
										if (!input) { return; }
										// Execute
										if (input.args.tagValue !== null) {
											scatterByTags({
												...defaultArgs,
												...input.args
											});
										} else {
											intercalateByTags({
												...defaultArgs,
												...input.args
											});
										}
										// For internal use original object
										selArg.args = input.args;
										menu_properties['intercalateCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
										overwriteMenuProperties(); // Updates panel
									}, flags: multipleSelectedFlagsReorder
								});
								menu.newSeparator(subMenuName);
							}
							{	// Add / Remove
								createSubMenuEditEntries(subMenuName, {
									name,
									list: intercalate,
									propName: 'intercalate',
									defaults: intercalateDefaults,
									defaultPreset: folders.xxx + 'presets\\Playlist Tools\\intercalate\\default.json',
									input: inputIntercalate,
									bDefaultFile: true,
									bCopyCurrent: true
								});
							}
						}
					});
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
			}
		}
		{	// Shuffle
			const scriptPath = folders.xxx + 'main\\sort\\scatter_by_tags.js';
			/* global shuffleByTags:readable */
			if (_isFile(scriptPath)) {
				const name = 'Shuffle by tags';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\shuffle_by_tags.txt';
					const subMenuName = menu.newMenu(name, menuName);
					let shuffle = [
						{ name: 'Shuffle by artist', args: { tagName: [globTags.artist] } },
						{ name: 'Shuffle by genre', args: { tagName: [globTags.genre] } },
						{ name: 'Shuffle by style', args: { tagName: [globTags.style] } }
					];
					let selArg = { name: 'Custom', args: shuffle[0].args };
					const shuffleDefaults = [...shuffle];
					// Create new properties with previous args
					menu_properties['shuffle'] = [menuName + '\\' + name + '  entries', JSON.stringify(shuffle)];
					menu_properties['shuffleCustomArg'] = [menuName + '\\' + name + ' Dynamic menu custom args', JSON.stringify(selArg)];
					// Check
					menu_properties['shuffle'].push({ func: isJSON }, menu_properties['shuffle'][1]);
					menu_properties['shuffleCustomArg'].push({ func: isJSON }, menu_properties['shuffleCustomArg'][1]);
					// Other properties
					if (!Object.hasOwn(menu_properties, 'bSmartShuffleAdvc')) {
						menu_properties['bSmartShuffleAdvc'] = ['Smart shuffle extra conditions', true, { func: isBoolean }, true];
					}
					if (!Object.hasOwn(menu_properties, 'smartShuffleSortBias')) {
						menu_properties['smartShuffleSortBias'] = ['Smart shuffle sorting bias', 'random', { func: isStringWeak }, 'random'];
					}
					// Helpers
					const inputShuffle = (bCopyCurrent = false) => {
						let tagName = '';
						if (bCopyCurrent) {
							tagName = selArg.args.tagName;
							if (!tagName.length) { return; }
						} else {
							try { tagName = utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(multiple values may be separated by \';\')', scriptName + ': ' + name, selArg.args.tagName, true); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
							if (!tagName.length) { return; }
							tagName = tagName.split(/[;,]/g);
						}
						return { args: { tagName } };
					};
					// Menus
					menu.newEntry({ menuName: subMenuName, entryText: 'Smart Shuffle (Spotify-like):', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
					menu.newCondEntry({
						entryText: 'Shuffle (cond)', condFunc: () => {
							// Entry list
							shuffle = JSON.parse(menu_properties['shuffle'][1]);
							const entryNames = new Set();
							shuffle.forEach((shuffleObj) => {
								// Add separators
								if (menu.isSeparator(shuffleObj)) {
									menu.newSeparator(subMenuName);
								} else {
									// Create names for all entries
									const shuffleName = shuffleObj.name.cut(30);
									if (entryNames.has(shuffleName)) {
										fb.ShowPopupMessage('There is an entry with duplicated name:\t' + shuffleName + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(shuffleObj, null, '\t'), scriptName + ': ' + name);
										return;
									} else { entryNames.add(shuffleName); }
									// Entries
									menu.newEntry({
										menuName: subMenuName, entryText: shuffleName, func: () => {
											shuffleByTags({
												...defaultArgs,
												...shuffleObj.args,
												bAdvancedShuffle: menu_properties.bSmartShuffleAdvc[1],
												sortBias: menu_properties.smartShuffleSortBias[1]
											});
										}, flags: multipleSelectedFlagsReorder
									});
								}
							});
							menu.newSeparator(subMenuName);
							{	// Static menu: user configurable
								menu.newEntry({
									menuName: subMenuName, entryText: 'By... (tag)', func: () => {
										const ap = plman.ActivePlaylist;
										if (ap === -1) { return; }
										// On first execution, must update from property
										selArg.args.tagName = JSON.parse(menu_properties['shuffleCustomArg'][1]).args.tagName;
										// Input
										const input = inputShuffle();
										if (!input) { return; }
										// Execute
										shuffleByTags({
											...defaultArgs,
											...input.args,
											bAdvancedShuffle: menu_properties.bSmartShuffleAdvc[1],
											sortBias: menu_properties.smartShuffleSortBias[1]
										});
										// For internal use original object
										selArg.args = input.args;
										menu_properties['shuffleCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
										overwriteMenuProperties(); // Updates panel
									}, flags: multipleSelectedFlagsReorder
								});
								menu.newSeparator(subMenuName);
							}
							{	// Add / Remove
								createSubMenuEditEntries(subMenuName, {
									name,
									list: shuffle,
									propName: 'shuffle',
									defaults: shuffleDefaults,
									defaultPreset: folders.xxx + 'presets\\Playlist Tools\\shuffle\\default.json',
									input: inputShuffle,
									bDefaultFile: true
								});
							}
						}
					});
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
					} else { menuDisabled.push({ menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
			}
		}
		{	// Group
			const scriptPath = folders.xxx + 'main\\sort\\group_by_tags.js';
			/* global groupByTags:readable */
			if (_isFile(scriptPath)) {
				const name = 'Group by tags';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\group_by_tags.txt';
					const subMenuName = menu.newMenu(name, menuName);
					let group = [
						{ name: 'Group by artist', args: { tagName: [globTags.artist] } },
						{ name: 'Group by genre', args: { tagName: [globTags.genre] } },
						{ name: 'Group by style', args: { tagName: [globTags.style] } },
						{ name: 'Group by album', args: { tagName: ['ALBUM'] } }
					];
					let selArg = { name: 'Custom', args: group[0].args };
					const groupDefaults = [...group];
					// Create new properties with previous args
					menu_properties['group'] = [menuName + '\\' + name + '  entries', JSON.stringify(group)];
					menu_properties['groupCustomArg'] = [menuName + '\\' + name + ' Dynamic menu custom args', JSON.stringify(selArg)];
					// Check
					menu_properties['group'].push({ func: isJSON }, menu_properties['group'][1]);
					menu_properties['groupCustomArg'].push({ func: isJSON }, menu_properties['groupCustomArg'][1]);
					// Helpers
					const inputGroup = (bCopyCurrent = false) => {
						let tagName = '';
						if (bCopyCurrent) {
							tagName = selArg.args.tagName;
							if (!tagName.length) { return; }
						} else {
							try { tagName = utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(multiple values may be separated by \';\')', scriptName + ': ' + name, selArg.args.tagName, true); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
							if (!tagName.length) { return; }
							tagName = tagName.split(/[;,]/g);
						}
						return { args: { tagName } };
					};
					// Menus
					menu.newEntry({ menuName: subMenuName, entryText: 'Group by TF (without sorting):', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
					menu.newCondEntry({
						entryText: 'Group (cond)', condFunc: () => {
							// Entry list
							group = JSON.parse(menu_properties['group'][1]);
							const entryNames = new Set();
							group.forEach((groupObj) => {
								// Add separators
								if (menu.isSeparator(groupObj)) {
									menu.newSeparator(subMenuName);
								} else {
									// Create names for all entries
									const groupName = groupObj.name.cut(30);
									if (entryNames.has(groupName)) {
										fb.ShowPopupMessage('There is an entry with duplicated name:\t' + groupName + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(groupObj, null, '\t'), scriptName + ': ' + name);
										return;
									} else { entryNames.add(groupName); }
									// Entries
									menu.newEntry({
										menuName: subMenuName, entryText: groupName, func: () => {
											groupByTags({
												...groupObj.args,
												bDebug: defaultArgs.bDebug
											});
										}, flags: multipleSelectedFlagsReorder
									});
								}
							});
							menu.newSeparator(subMenuName);
							{	// Static menu: user configurable
								menu.newEntry({
									menuName: subMenuName, entryText: 'By... (tag)', func: () => {
										const ap = plman.ActivePlaylist;
										if (ap === -1) { return; }
										// On first execution, must update from property
										selArg.args.tagName = JSON.parse(menu_properties['groupCustomArg'][1]).args.tagName;
										// Input
										const input = inputGroup();
										if (!input) { return; }
										// Execute
										groupByTags({ ...input.args, bDebug: defaultArgs.bDebug });
										// For internal use original object
										selArg.args = input.args;
										menu_properties['groupCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
										overwriteMenuProperties(); // Updates panel
									}, flags: multipleSelectedFlagsReorder
								});
								menu.newSeparator(subMenuName);
							}
							{	// Add / Remove
								createSubMenuEditEntries(subMenuName, {
									name,
									list: group,
									propName: 'group',
									defaults: groupDefaults,
									defaultPreset: folders.xxx + 'presets\\Playlist Tools\\group\\default.json',
									input: inputGroup,
									bDefaultFile: true,
									bCopyCurrent: true
								});
							}
						}
					});
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
			}
		}
		['Sort', 'Advanced sort', 'Scatter by tags', 'Intercalate by tags', 'Shuffle by tags', 'Group by tags']
			.some((n) => !Object.hasOwn(menusEnabled, n) || menusEnabled[n] === true) && menu.newSeparator(menuName);
		{	// Remove and find in playlists
			const scriptPath = folders.xxx + 'main\\playlists\\find_remove_from_playlists.js';
			/* global findInPlaylists:readable, removeFromPlaylist:readable,  */
			if (_isFile(scriptPath)) {
				const nameNowFind = 'Find now playing track in';
				const nameFind = 'Find track(s) in';
				const nameRemove = 'Remove track(s) from';
				if (!Object.hasOwn(menusEnabled, nameNowFind) || !Object.hasOwn(menusEnabled, nameFind) || !Object.hasOwn(menusEnabled, nameRemove) || menusEnabled[nameNowFind] === true || menusEnabled[nameFind] === true || menusEnabled[nameRemove] === true) {
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + 'Find in and Remove from'] = folders.xxx + 'helpers\\readme\\find_remove_from_playlists.txt';
					// Add properties
					menu_properties['bFindShowCurrent'] = ['\'Tools\\Find track(s) in\' show current playlist?', true];
					menu_properties['bRemoveShowLocked'] = ['\'Tools\\Remove track(s) from\' show autoplaylists?', true];
					menu_properties['findRemoveSplitSize'] = ['\'Tools\\Find track(s) in\' list submenu size', 10];
					menu_properties['maxSelCount'] = ['\'Tools\\Find  & Remove track(s)\' max. track selection', 500];
					// Checks
					menu_properties['bFindShowCurrent'].push({ func: isBoolean }, menu_properties['bFindShowCurrent'][1]);
					menu_properties['bRemoveShowLocked'].push({ func: isBoolean }, menu_properties['bRemoveShowLocked'][1]);
					menu_properties['findRemoveSplitSize'].push({ greater: 1, func: isInt }, menu_properties['findRemoveSplitSize'][1]);
					menu_properties['maxSelCount'].push({ greater: 0, func: isInt }, menu_properties['maxSelCount'][1]);
					// Menus
					{	// Find now playing in
						if (!Object.hasOwn(menusEnabled, nameNowFind) || menusEnabled[nameNowFind] === true) {
							const subMenuName = menu.newMenu(nameNowFind, menuName);
							menu.newCondEntry({
								entryText: 'Find now playing track in (cond)', condFunc: () => {
									const profiler = defaultArgs.bProfile ? new FbProfiler('Find now playing in') : null;
									menu.newEntry({ menuName: subMenuName, entryText: 'Set focus on playlist with now playing track:', func: null, flags: MF_GRAYED });
									menu.newSeparator(subMenuName);
									const nowPlay = fb.GetNowPlaying();
									if (!nowPlay) { menu.newEntry({ menuName: subMenuName, entryText: 'Playback is stopped (no playing track).', func: null, flags: MF_GRAYED }); return; }
									const sel = new FbMetadbHandleList(nowPlay);
									let inPlaylist = findInPlaylists(sel);
									const bShowCurrent = menu_properties['bFindShowCurrent'][1];
									const ap = plman.ActivePlaylist;
									if (!bShowCurrent) { inPlaylist = inPlaylist.filter((playlist) => { return ap !== playlist.index; }); }
									const playlistsNum = inPlaylist.length;
									if (playlistsNum) {
										// Split entries in sub-menus if there are too many playlists...
										let ss = menu_properties['findRemoveSplitSize'][1];
										const splitBy = playlistsNum < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
										if (playlistsNum > splitBy) {
											const subMenusCount = Math.ceil(playlistsNum / splitBy);
											for (let i = 0; i < subMenusCount; i++) {
												const bottomIdx = i * splitBy;
												const topIdx = (i + 1) * splitBy - 1;
												const idx = 'Playlists ' + bottomIdx + ' - ' + topIdx;
												const subMenu_i = menu.newMenu(idx, subMenuName);
												for (let j = bottomIdx; j <= topIdx && j < playlistsNum; j++) {
													const playlist = inPlaylist[j];
													const entryText = playlist.name.cut(30) +
														(plman.PlayingPlaylist === playlist.index && ap === playlist.index
															? ' (current | playing)'
															: ap === playlist.index
																? ' (current)'
																: plman.PlayingPlaylist === playlist.index
																	? ' (playing)'
																	: '');
													menu.newEntry({ menuName: subMenu_i, entryText, func: () => { focusInPlaylist(sel, playlist.index); }, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING) });
													// Add radio check on current playlist
													if (playlist.index === ap) { menu.newCheckMenu(subMenu_i, entryText, entryText, () => 0); }
												}
											}
										} else { // Or just show all
											for (const playlist of inPlaylist) {
												const entryText = playlist.name.cut(30) +
													(plman.PlayingPlaylist === playlist.index && ap === playlist.index
														? ' (current | playing)'
														: ap === playlist.index
															? ' (current)'
															: plman.PlayingPlaylist === playlist.index
																? ' (playing)'
																: '');
												menu.newEntry({ menuName: subMenuName, entryText, func: () => { focusInPlaylist(sel, playlist.index); }, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING) });
												// Add radio check on current playlist
												if (playlist.index === ap) { menu.newCheckMenu(subMenuName, entryText, entryText, () => 0); }
											}
										}
									} else {
										menu.newEntry({ menuName: subMenuName, entryText: 'Not found.', func: null, flags: MF_GRAYED });
									}
									if (defaultArgs.bProfile) { profiler.Print(); }
								}
							});
						} else { menuDisabled.push({ menuName: nameNowFind, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
					}
					{	// Find in Playlists
						if (!Object.hasOwn(menusEnabled, nameFind) || menusEnabled[nameFind] === true) {
							const subMenuName = menu.newMenu(nameFind, menuName);
							menu.newCondEntry({
								entryText: 'Find track(s) in (cond)', condFunc: () => {
									const profiler = defaultArgs.bProfile ? new FbProfiler('Find in Playlists') : null;
									menu.newEntry({ menuName: subMenuName, entryText: 'Set focus on playlist with same track(s):', func: null, flags: MF_GRAYED });
									menu.newSeparator(subMenuName);
									const ap = plman.ActivePlaylist;
									const sel = plman.GetPlaylistSelectedItems(ap);
									const maxSelCount = menu_properties['maxSelCount'][1]; // Don't create these menus when selecting more than these # tracks! Avoids lagging when creating the menu
									if (sel.Count > maxSelCount) { menu.newEntry({ menuName: subMenuName, entryText: 'Too many tracks selected: > ' + maxSelCount, func: null, flags: MF_GRAYED }); return; }
									let inPlaylist = findInPlaylists(sel);
									const bShowCurrent = menu_properties['bFindShowCurrent'][1];
									if (!bShowCurrent) { inPlaylist = inPlaylist.filter((playlist) => { return ap !== playlist.index; }); }
									const playlistsNum = inPlaylist.length;
									if (playlistsNum) {
										// Split entries in sub-menus if there are too many playlists...
										let ss = menu_properties['findRemoveSplitSize'][1];
										const splitBy = playlistsNum < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
										if (playlistsNum > splitBy) {
											const subMenusCount = Math.ceil(playlistsNum / splitBy);
											for (let i = 0; i < subMenusCount; i++) {
												const bottomIdx = i * splitBy;
												const topIdx = (i + 1) * splitBy - 1;
												const idx = 'Playlists ' + bottomIdx + ' - ' + topIdx;
												const subMenu_i = menu.newMenu(idx, subMenuName);
												for (let j = bottomIdx; j <= topIdx && j < playlistsNum; j++) {
													const playlist = inPlaylist[j];
													const entryText = playlist.name.cut(30) +
														(plman.PlayingPlaylist === playlist.index && ap === playlist.index
															? ' (current | playing)'
															: ap === playlist.index
																? ' (current)'
																: plman.PlayingPlaylist === playlist.index
																	? ' (playing)'
																	: '');
													menu.newEntry({ menuName: subMenu_i, entryText, func: () => { focusInPlaylist(sel, playlist.index); }, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING) });
													// Add radio check on current playlist
													if (playlist.index === ap) { menu.newCheckMenu(subMenu_i, entryText, entryText, () => 0); }
												}
											}
										} else { // Or just show all
											for (const playlist of inPlaylist) {
												const entryText = playlist.name.cut(30) +
													(plman.PlayingPlaylist === playlist.index && ap === playlist.index
														? ' (current | playing)'
														: ap === playlist.index
															? ' (current)'
															: plman.PlayingPlaylist === playlist.index
																? ' (playing)'
																: '');
												menu.newEntry({ menuName: subMenuName, entryText, func: () => { focusInPlaylist(sel, playlist.index); }, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING) });
												// Add radio check on current playlist
												if (playlist.index === ap) { menu.newCheckMenu(subMenuName, entryText, entryText, () => 0); }
											}
										}
									} else {
										menu.newEntry({ menuName: subMenuName, entryText: 'Not found.', func: null, flags: MF_GRAYED });
									}
									if (defaultArgs.bProfile) { profiler.Print(); }
								}
							});
						} else { menuDisabled.push({ menuName: nameFind, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
					}
					{	// Remove from Playlists
						if (!Object.hasOwn(menusEnabled, nameRemove) || menusEnabled[nameRemove] === true) {
							const subMenuName = menu.newMenu(nameRemove, menuName);
							menu.newCondEntry({
								entryText: 'Remove track(s) from (cond)', condFunc: () => {
									const profiler = defaultArgs.bProfile ? new FbProfiler('Remove from Playlists') : null;
									menu.newEntry({ menuName: subMenuName, entryText: 'Remove track(s) from selected playlist:', func: null, flags: MF_GRAYED });
									menu.newSeparator(subMenuName);
									const ap = plman.ActivePlaylist;
									const sel = plman.GetPlaylistSelectedItems(ap);
									const maxSelCount = menu_properties['maxSelCount'][1]; // Don't create these menus when selecting more than these # tracks! Avoids lagging when creating the menu
									if (sel.Count > maxSelCount) { menu.newEntry({ menuName: subMenuName, entryText: 'Too many tracks selected: > ' + maxSelCount, func: null, flags: MF_GRAYED }); return; }
									let inPlaylist = findInPlaylists(sel, ['RemoveItems']);
									const bShowLocked = menu_properties['bRemoveShowLocked'][1];
									if (!bShowLocked) { inPlaylist = inPlaylist.filter((playlist) => { return !playlist.bLocked; }); }
									const playlistsNum = inPlaylist.length;
									if (playlistsNum) {
										// Split entries in sub-menus if there are too many playlists...
										let ss = menu_properties['findRemoveSplitSize'][1];
										const splitBy = playlistsNum < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
										if (playlistsNum > splitBy) {
											const subMenusCount = Math.ceil(playlistsNum / splitBy);
											for (let i = 0; i < subMenusCount; i++) {
												const bottomIdx = i * splitBy;
												const topIdx = (i + 1) * splitBy - 1;
												const idx = 'Playlists ' + bottomIdx + ' - ' + topIdx;
												const subMenu_i = menu.newMenu(idx, subMenuName);
												for (let j = bottomIdx; j <= topIdx && j < playlistsNum; j++) {
													const playlist = inPlaylist[j];
													const entryText = playlist.name.cut(30) +
														(playlist.bLocked && ap === playlist.index
															? ' (current | locked)'
															: ap === playlist.index
																? ' (current)'
																: playlist.bLocked
																	? ' (locked)'
																	: '');
													menu.newEntry({ menuName: subMenu_i, entryText, func: () => { plman.UndoBackup(playlist.index); removeFromPlaylist(sel, playlist.index); }, flags: playlist.bLocked ? MF_GRAYED : MF_STRING });
													// Add radio check on current playlist
													if (playlist.index === ap) { menu.newCheckMenu(subMenu_i, entryText, entryText, () => 0); }
												}
											}
										} else { // Or just show all
											for (const playlist of inPlaylist) {
												const entryText = playlist.name.cut(30) +
													(playlist.bLocked && ap === playlist.index
														? ' (current | locked)'
														: ap === playlist.index
															? ' (current)'
															: playlist.bLocked
																? ' (locked)'
																: '');
												menu.newEntry({ menuName: subMenuName, entryText, func: () => { plman.UndoBackup(playlist.index); removeFromPlaylist(sel, playlist.index); }, flags: playlist.bLocked ? MF_GRAYED : MF_STRING });
												// Add radio check on current playlist
												if (playlist.index === ap) { menu.newCheckMenu(subMenuName, entryText, entryText, () => 0); }
											}
										}
									} else {
										menu.newEntry({ menuName: subMenuName, entryText: 'Not found.', func: null, flags: MF_GRAYED });
									}
									if (defaultArgs.bProfile) { profiler.Print(); }
								}
							});
						} else { menuDisabled.push({ menuName: nameRemove, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
					}
					{	// Configure properties
						if (!Object.hasOwn(menusEnabled, configMenu) || menusEnabled[configMenu] === true) {
							const subMenuName = menu.newMenu('Tools\\Find in and Remove from', configMenu);
							{	// bFindShowCurrent (Find in Playlists)
								if (!Object.hasOwn(menusEnabled, nameFind) || menusEnabled[nameFind] === true) {
									const subMenuSecondName = menu.newMenu('Show current playlist?', subMenuName);
									const options = ['Yes (greyed entry)', 'No (omit it)'];
									menu.newEntry({ menuName: subMenuSecondName, entryText: 'Only on \'Find track(s) in\':', func: null, flags: MF_GRAYED });
									menu.newSeparator(subMenuSecondName);
									menu.newEntry({
										menuName: subMenuSecondName, entryText: options[0], func: () => {
											menu_properties['bFindShowCurrent'][1] = true;
											overwriteMenuProperties(); // Updates panel
										}
									});
									menu.newEntry({
										menuName: subMenuSecondName, entryText: options[1], func: () => {
											menu_properties['bFindShowCurrent'][1] = false;
											overwriteMenuProperties(); // Updates panel
										}
									});
									menu.newCheckMenu(subMenuSecondName, options[0], options[1], () => { return (menu_properties['bFindShowCurrent'][1] ? 0 : 1); });
								}
							}
							{	// bRemoveShowLocked (Remove from Playlists)
								if (!Object.hasOwn(menusEnabled, nameRemove) || menusEnabled[nameRemove] === true) {
									const subMenuSecondName = menu.newMenu('Show locked playlist (autoplaylists, etc.)?', subMenuName);
									const options = ['Yes (locked, greyed entries)', 'No (omit them)'];
									menu.newEntry({ menuName: subMenuSecondName, entryText: 'Only on \'Remove track(s) from\':', func: null, flags: MF_GRAYED });
									menu.newSeparator(subMenuSecondName);
									menu.newEntry({
										menuName: subMenuSecondName, entryText: options[0], func: () => {
											menu_properties['bRemoveShowLocked'][1] = true;
											overwriteMenuProperties(); // Updates panel
										}
									});
									menu.newEntry({
										menuName: subMenuSecondName, entryText: options[1], func: () => {
											menu_properties['bRemoveShowLocked'][1] = false;
											overwriteMenuProperties(); // Updates panel
										}
									});
									menu.newCheckMenu(subMenuSecondName, options[0], options[1], () => { return (menu_properties['bRemoveShowLocked'][1] ? 0 : 1); });
								}
							}
							{	// findRemoveSplitSize ( Find in / Remove from Playlists)
								const subMenuSecondName = menu.newMenu('Split playlist list submenus at', subMenuName);
								const options = [5, 10, 20, 30, 'Other...'];
								const optionsIdx = [...options];
								options.forEach((val, index) => { // Creates menu entries for all options
									if (index === 0) {
										menu.newEntry({ menuName: subMenuSecondName, entryText: 'Number of entries:', func: null, flags: MF_GRAYED });
										menu.newSeparator(subMenuSecondName);
									}
									optionsIdx[index] = val; // For later use
									if (index !== options.length - 1) { // Predefined sizes
										menu.newEntry({
											menuName: subMenuSecondName, entryText: val, func: () => {
												menu_properties['findRemoveSplitSize'][1] = val;
												overwriteMenuProperties(); // Updates panel
											}
										});
									} else { // Last one is user configurable
										menu.newSeparator(subMenuSecondName);
										menu.newEntry({
											menuName: subMenuSecondName, entryText: val, func: () => {
												const input = Number(utils.InputBox(window.ID, 'Enter desired Submenu max size.\n', scriptName + ': ' + subMenuName, menu_properties['findRemoveSplitSize'][1]));
												if (menu_properties['findRemoveSplitSize'][1] === input) { return; }
												if (!Number.isSafeInteger(input)) { return; }
												menu_properties['findRemoveSplitSize'][1] = input;
												overwriteMenuProperties(); // Updates panel
											}
										});
									}
								});
								menu.newCheckMenu(subMenuSecondName, optionsIdx[0], optionsIdx[optionsIdx.length - 1], () => {
									const size = options.indexOf(menu_properties['findRemoveSplitSize'][1]);
									return (size !== -1 ? size : options.length - 1);
								});
							}
							{	// maxSelCount ( Find in / Remove from Playlists)
								const subMenuSecondName = menu.newMenu('Don\'t try to find tracks if selecting more than', subMenuName);
								const options = [100, 250, 500, 1000, 5000, 'Other...'];
								const optionsIdx = [...options];
								options.forEach((val, index) => { // Creates menu entries for all options
									if (index === 0) {
										menu.newEntry({ menuName: subMenuSecondName, entryText: 'Number of tracks:', func: null, flags: MF_GRAYED });
										menu.newSeparator(subMenuSecondName);
									}
									optionsIdx[index] = val; // For later use
									if (index !== options.length - 1) { // Predefined sizes
										menu.newEntry({
											menuName: subMenuSecondName, entryText: val, func: () => {
												menu_properties['maxSelCount'][1] = val;
												overwriteMenuProperties(); // Updates panel
											}
										});
									} else { // Last one is user configurable
										menu.newSeparator(subMenuSecondName);
										menu.newEntry({
											menuName: subMenuSecondName, entryText: val, func: () => {
												const input = Number(utils.InputBox(window.ID, 'Enter max number of tracks.\n', scriptName + ': ' + subMenuName, menu_properties['maxSelCount'][1]));
												if (menu_properties['maxSelCount'][1] === input) { return; }
												if (!Number.isSafeInteger(input)) { return; }
												menu_properties['maxSelCount'][1] = input;
												overwriteMenuProperties(); // Updates panel
											}
										});
									}
								});
								menu.newCheckMenu(subMenuSecondName, optionsIdx[0], optionsIdx[optionsIdx.length - 1], () => {
									const size = options.indexOf(menu_properties['maxSelCount'][1]);
									return (size !== -1 ? size : options.length - 1);
								});
							}
							menu.newSeparator(configMenu);
						} else { menuDisabled.push({ menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
					}
				} else {
					menuDisabled.push({ menuName: nameNowFind, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true });
					menuDisabled.push({ menuName: nameFind, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true });
					menuDisabled.push({ menuName: nameRemove, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true });
				}
			}
		}
		{	// Send Selection to Playlist
			const name = 'Send selection to';
			if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
				include(folders.xxx + 'helpers\\helpers_xxx_playlists.js');
				/* global playlistCountLocked:readable */
				// Add properties
				if (!Object.hasOwn(menu_properties, 'playlistSplitSize')) {
					menu_properties['playlistSplitSize'] = ['Playlist lists submenu size', 20];
					// Checks
					menu_properties['playlistSplitSize'].push({ greater: 1, func: isInt }, menu_properties['playlistSplitSize'][1]);
				}
				// Menus
				const subMenuNameSend = menu.newMenu(name, menuName);
				menu.newEntry({ menuName: subMenuNameSend, entryText: 'Sends selected tracks from current playlist to:', func: null, flags: MF_GRAYED });
				menu.newSeparator(subMenuNameSend);
				// Build submenus
				menu.newCondEntry({
					entryText: 'Send selection to', condFunc: () => {
						const profiler = defaultArgs.bProfile ? new FbProfiler('Send selection to') : null;
						const playlistsNum = plman.PlaylistCount;
						const playlistsNumNotLocked = playlistsNum - playlistCountLocked(['AddItems']);
						const ap = plman.ActivePlaylist;
						const handleList = plman.GetPlaylistSelectedItems(ap);
						if (playlistsNum && playlistsNumNotLocked && handleList.Count) {
							// Split entries in sub-menus if there are too many playlists...
							let ss = menu_properties['playlistSplitSize'][1];
							const splitBy = playlistsNumNotLocked < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
							if (playlistsNumNotLocked > splitBy) {
								const subMenusCount = Math.ceil(playlistsNumNotLocked / splitBy);
								let skipped = 0; // To account for locked playlists
								for (let i = 0; i < subMenusCount; i++) {
									const bottomIdx = i * splitBy;
									const topIdx = (i + 1) * splitBy - 1;
									// Send
									const idxSend = '(Send sel. to) Playlists ' + bottomIdx + ' - ' + topIdx;
									const subMenu_i_send = menu.newMenu(idxSend, subMenuNameSend);
									for (let j = bottomIdx + skipped; j <= topIdx + skipped && j < playlistsNum; j++) {
										if (!addLock(j)) {
											const playlist = { name: plman.GetPlaylistName(j), index: j };
											const entryText = playlist.name.cut(30) +
												(plman.PlayingPlaylist === playlist.index && ap === playlist.index
													? ' (current | playing)'
													: ap === playlist.index
														? ' (current)'
														: plman.PlayingPlaylist === playlist.index
															? ' (playing)'
															: '');
											menu.newEntry({
												menuName: subMenu_i_send, entryText, func: () => {
													plman.UndoBackup(playlist.index);
													plman.InsertPlaylistItems(playlist.index, plman.PlaylistItemCount(playlist.index), handleList);
												}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)
											});
											// Add radio check on current playlist
											if (playlist.index === ap) { menu.newCheckMenu(subMenu_i_send, entryText, entryText, () => 0); }
										} else { skipped++; }
									}
								}
							} else { // Or just show all
								for (let i = 0; i < playlistsNum; i++) {
									if (!addLock(i)) {
										const playlist = { name: plman.GetPlaylistName(i), index: i };
										const entryText = playlist.name.cut(30) +
											(plman.PlayingPlaylist === playlist.index && ap === playlist.index
												? ' (current | playing)'
												: ap === playlist.index
													? ' (current)'
													: plman.PlayingPlaylist === playlist.index
														? ' (playing)'
														: '');
										menu.newEntry({
											menuName: subMenuNameSend, entryText, func: () => {
												plman.InsertPlaylistItems(playlist.index, plman.PlaylistItemCount(playlist.index), handleList);
											}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)
										});
										// Add radio check on current playlist
										if (playlist.index === ap) { menu.newCheckMenu(subMenuNameSend, entryText, entryText, () => 0); }
									}
								}
							}
						} else {
							menu.newEntry({ menuName: subMenuNameSend, entryText: 'No items.', func: null, flags: MF_GRAYED });
						}
						if (defaultArgs.bProfile) { profiler.Print(); }
					}
				});
			} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
		}
		{	// Move
			const name = 'Move selection to';
			if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
				include(folders.xxx + 'helpers\\helpers_xxx_playlists.js');
				/* global getPlaylistSelectedIndexFirst:readable, getPlaylistSelectedIndexLast:readable */
				readmes[menuName + '\\' + 'Move, expand & jump'] = folders.xxx + 'helpers\\readme\\selection_expand_jump.txt';
				const subMenuName = menu.newMenu(name, menuName);
				menu.newEntry({ menuName: subMenuName, entryText: 'On current playlist:', func: null, flags: MF_GRAYED });
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName, entryText: 'To the top', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						plman.UndoBackup(ap);
						plman.MovePlaylistSelection(ap, -plman.PlaylistItemCount(ap));
					}, flags: selectedFlagsAddRem
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'To the middle', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						const selItems = plman.GetPlaylistSelectedItems(ap);
						plman.UndoBackup(ap);
						plman.RemovePlaylistSelection(ap);
						const count = plman.PlaylistItemCount(ap);
						const pos = count ? Math.floor(count / 2) : 0;
						plman.InsertPlaylistItems(ap, pos, selItems, true);
						plman.SetPlaylistFocusItem(ap, pos);
					}, flags: selectedFlagsAddRem
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'To the bottom', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						plman.UndoBackup(ap);
						plman.MovePlaylistSelection(ap, plman.PlaylistItemCount(ap));
					}, flags: selectedFlagsAddRem
				});
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName, entryText: 'After playing now track', func: () => {
						const playingItemLocation = plman.GetPlayingItemLocation();
						if (!playingItemLocation.IsValid) { return; }
						const pp = playingItemLocation.PlaylistIndex;
						if (pp === -1) { return; }
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						const selItems = plman.GetPlaylistSelectedItems(ap);
						plman.UndoBackup(ap);
						plman.RemovePlaylistSelection(ap);
						if (pp !== ap) {
							plman.ActivePlaylist = pp;
							plman.UndoBackup(pp);
						}
						const pos = playingItemLocation.PlaylistItemIndex + 1;
						plman.InsertPlaylistItems(pp, pos, selItems, true);
						plman.SetPlaylistFocusItem(pp, pos);
					}, flags: () => { return (fb.IsPlaying ? selectedFlagsAddRem() : MF_GRAYED); }
				});
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName, entryText: 'By delta...', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						let pos = 0;
						try { pos = utils.InputBox(window.ID, 'Move by delta value:\n(positive or negative)\n\nNon-contiguous selection is kept unless extremes can not move.', scriptName + ': ' + name, 1, true); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (!pos) { return; }
						plman.UndoBackup(ap);
						plman.MovePlaylistSelection(ap, pos);
					}, flags: selectedFlagsReorder
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'To specified position...', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						let pos = 0;
						let bReverse = false;
						const total = plman.PlaylistItemCount(ap);
						try { pos = Number(utils.InputBox(window.ID, 'Move to position:\n(from 1 [beginning] to ' + total + ' [end] or -1 [end] to -' + total + ' [beginning]))\n\nNon-contiguous selection is kept unless extremes can not move (use negative values to send from end without compacting it).', scriptName + ': ' + name, 1, true)); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (pos === 0) { return; }
						if (pos < 0) { bReverse = true; pos = -pos; }
						const first = bReverse
							? getPlaylistSelectedIndexLast(ap)
							: getPlaylistSelectedIndexFirst(ap);
						if (first === -1) { return; }
						plman.UndoBackup(ap);
						if (bReverse) { fb.RunMainMenuCommand('Edit/Sort/Reverse'); }
						plman.MovePlaylistSelection(ap, (pos - 1) - first);
						if (bReverse) { fb.RunMainMenuCommand('Edit/Sort/Reverse'); }
					}, flags: selectedFlagsReorder
				});
				menu.newSeparator(menuName);
			} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
		}
		{	// Select by query
			const scriptPath = folders.xxx + 'main\\filter_and_query\\filter_by_query.js';
			/* global queryReplaceWithCurrent:readable, globQuery:readable, checkQuery:readable, queryJoin:readable, selectByQuery:readable */
			if (_isFile(scriptPath)) {
				const name = 'Select by query';
				if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
					const subMenuName = menu.newMenu(name, menuName);
					include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\filter_by_query.txt';
					forcedQueryMenusEnabled[name] = false;
					let selQueryFilter = [
						{ name: 'Rated ≥3 tracks', query: globQuery.notLowRating },
						{ name: 'Rated ≥4 tracks', query: globQuery.ratingGr3 },
						{ name: 'Fav tracks', query: globQuery.fav },
						{ name: 'Loved tracks', query: globQuery.loved },
						{ name: 'sep' },
						{ name: 'Not recently listened', query: 'NOT ' + globQuery.recent },
						{ name: 'Daily listen rate ≥1', query: 'NOT ' + _qCond(globTags.playCountRateGlobalDay) + ' LESS 1' },
						{ name: 'Weekly listen rate ≥1', query: 'NOT ' + _qCond(globTags.playCountRateGlobalWeek) + ' LESS 1' },
						{ name: 'Monthly listen rate ≥1', query: 'NOT ' + _qCond(globTags.playCountRateGlobalMonth) + ' LESS 1' },
						{ name: 'Yearly listen rate ≥1', query: 'NOT ' + _qCond(globTags.playCountRateGlobalYear) + ' LESS 1' },
						{ name: 'sep' },
						{ name: 'Instrumental', query: globQuery.instrumental },
						{ name: 'Live (all)', query: globQuery.live },
						{ name: 'Live (Hi-Fi)', query: globQuery.liveHifi },
						{ name: 'Multichannel', query: 'NOT ' + _p(globQuery.stereo) },
						{ name: 'SACD or DVD', query: globQuery.SACD },
						{ name: 'Links', query: 'NOT ("$strstr(%_PATH_RAW%,file:)" PRESENT OR "$strstr(%_PATH_RAW%,file-relative:)" PRESENT)' },
						{ name: 'sep' },
						{ name: 'Global forced query', query: defaultArgs['forcedQuery'] },
						{ name: 'sep' },
						{ name: 'Same title than sel', query: globQuery.compareTitle },
						{ name: 'Same song than sel', query: globTags.artist + ' IS #' + globTags.artistRaw + '# AND ' + globQuery.compareTitle + ' AND ' + _qCond(globTags.date) + ' IS #' + globTags.date + '#' },
						{ name: 'Same artist(s) than sel', query: globTags.artist + ' IS #' + globTags.artistRaw + '#' },
						{ name: 'Same genre than sel', query: globTags.genre + ' IS #' + globTags.genre + '#' },
						{ name: 'Same key than sel', query: globTags.key + ' IS #' + globTags.key + '#' },
						{ name: 'Same decade than sel', query: '"$div(' + _t(globTags.date) + ',10)0s" IS #$div(' + _t(globTags.date) + ',10)0s#' },
						{ name: 'sep' },
						{ name: 'Different genre than sel', query: 'NOT ' + globTags.genre + ' IS #' + globTags.genre + '#' },
						{ name: 'Different style than sel', query: 'NOT ' + globTags.style + ' IS #' + globTags.style + '#' }
					];
					let selArg = { name: 'Custom', query: selQueryFilter[0].query };
					const selQueryFilterDefaults = [...selQueryFilter];
					// Create new properties with previous args
					menu_properties['selQueryFilter'] = [menuName + '\\' + name + ' queries', JSON.stringify(selQueryFilter)];
					menu_properties['selQueryFilterCustomArg'] = [menuName + '\\' + name + ' Dynamic menu custom args', selArg.query];
					// Check
					menu_properties['selQueryFilter'].push({ func: isJSON }, menu_properties['selQueryFilter'][1]);
					menu_properties['selQueryFilter'].push({ func: (query) => { return checkQuery(query, true); } }, menu_properties['selQueryFilter'][1]);
					// Helpers
					const inputPlsQuery = (bCopyCurrent = false) => {
						let query = '';
						if (bCopyCurrent) {
							query = selArg.query;
						} else {
							try { query = utils.InputBox(window.ID, 'Enter query:\n\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.\n(see \'Dynamic queries\' readme for more info)', scriptName + ': ' + name, '', true); }
							catch (e) { return; } // eslint-disable-line no-unused-vars
							if (!query.includes('#')) { // Try the query only if it is not a dynamic one
								try { fb.GetQueryItems(new FbMetadbHandleList(), query); }
								catch (e) { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, scriptName + ': ' + name); return; } // eslint-disable-line no-unused-vars
							}
						}
						if (!query.length) { return; }
						return { query };
					};
					// Menus
					menu.newEntry({ menuName: subMenuName, entryText: 'Select from active playlist: (Ctrl + click to invert)', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
					menu.newCondEntry({
						entryText: 'Selection using queries (cond)', condFunc: () => {
							const options = JSON.parse(menu_properties.dynQueryEvalSel[1]);
							const bEvalSel = options['Dynamic queries'];
							selQueryFilter = JSON.parse(menu_properties['selQueryFilter'][1]);
							const entryNames = new Set();
							selQueryFilter.forEach((queryObj) => {
								if (menu.isSeparator(queryObj)) { // Create separators
									menu.newSeparator(subMenuName);
								} else {
									// Create names for all entries
									const queryName = (queryObj.name || '').cut(30);
									if (entryNames.has(queryName)) {
										fb.ShowPopupMessage('There is an entry with duplicated name:\t' + queryName + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(queryObj, null, '\t'), scriptName + ': ' + name);
										return;
									} else { entryNames.add(queryName); }
									menu.newEntry({
										menuName: subMenuName, entryText: 'Select by ' + queryName, func: () => {
											let query = queryObj.query;
											// Test
											let focusHandle = fb.GetFocusItem(true);
											if (focusHandle && query.includes('#')) {
												if (bEvalSel) {
													const queries = [...new Set(plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Convert().map((handle) => { return queryReplaceWithCurrent(query, handle); }))];
													query = queryJoin(queries, 'OR');
												} else {
													query = queryReplaceWithCurrent(query, focusHandle);
												}
											}
											// Invert query when pressing Control
											if (utils.IsKeyPressed(VK_CONTROL) && query.length) {
												query = 'NOT ' + _p(query);
											}
											// Forced query
											if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) { // With forced query enabled
												if (query.length && query.toUpperCase() !== 'ALL') { // ALL query never uses forced query!
													query = _p(query) + ' AND ' + _p(defaultArgs.forcedQuery);
												} else if (!query.length) { query = defaultArgs.forcedQuery; } // Empty uses forced query or ALL
											} else if (!query.length) { query = 'ALL'; } // Otherwise empty is replaced with ALL
											try { fb.GetQueryItems(new FbMetadbHandleList(), query); }
											catch (e) { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, scriptName); return; } // eslint-disable-line no-unused-vars
											// Execute
											selectByQuery(null, query);
										}, flags: playlistCountFlagsAddRem
									});
								}
							});
							menu.newSeparator(subMenuName);
							menu.newEntry({
								menuName: subMenuName, entryText: 'Select by... (query)', func: () => {
									selArg.query = menu_properties['selQueryFilterCustomArg'][1];
									let input;
									try { input = utils.InputBox(window.ID, 'Enter query:\n\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.\n(see \'Dynamic queries\' readme for more info)', scriptName + ': ' + name, selArg.query, true); }
									catch (e) { return; } // eslint-disable-line no-unused-vars
									// Forced query
									let query = input;
									if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) { // With forced query enabled
										if (query.length && query.toUpperCase() !== 'ALL') { // ALL query never uses forced query!
											query = '(' + query + ') AND (' + defaultArgs.forcedQuery + ')';
										} else if (!query.length) { query = defaultArgs.forcedQuery; } // Empty uses forced query or ALL
									} else if (!query.length) { query = 'ALL'; } // Otherwise empty is replaced with ALL
									// Test
									let focusHandle = fb.GetFocusItem(true);
									if (focusHandle && query.includes('#')) {
										if (bEvalSel) {
											const queries = [...new Set(plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Convert().map((handle) => { return queryReplaceWithCurrent(query, handle); }))];
											query = queryJoin(queries, 'OR');
										} else {
											query = queryReplaceWithCurrent(query, focusHandle);
										}
									}
									try { fb.GetQueryItems(new FbMetadbHandleList(), query); }
									catch (e) { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, scriptName); return; } // eslint-disable-line no-unused-vars
									// Execute
									selectByQuery(null, query);
									// For internal use original object
									selArg.query = input;
									menu_properties['selQueryFilterCustomArg'][1] = input; // And update property with new value
									overwriteMenuProperties(); // Updates panel
								}, flags: playlistCountFlagsAddRem
							});
							menu.newSeparator(subMenuName);
							createSubMenuEditEntries(subMenuName, {
								name,
								list: selQueryFilter,
								propName: 'selQueryFilter',
								defaults: selQueryFilterDefaults,
								defaultPreset: folders.xxx + 'presets\\Playlist Tools\\pls_sel_filter\\default.json',
								input: inputPlsQuery,
								bDefaultFile: true,
								bCopyCurrent: true
							});
						}
					});
					menu.newSeparator(menuName);
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
			}
		}
		{	// Select (for use with macros!!)
			const name = 'Select (# tracks)';
			if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
				const subMenuName = menu.newMenu(name, menuName);
				menu.newEntry({ menuName: subMenuName, entryText: 'Sets selection on current playlist:', func: null, flags: MF_GRAYED });
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName, entryText: 'Select All', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						const start = 0;
						const end = plman.PlaylistItemCount(ap);
						plman.ClearPlaylistSelection(ap);
						plman.SetPlaylistSelection(ap, range(start, end, 1), true);
					}, flags: playlistCountFlags
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Invert selection', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						const toSelect = [];
						range(0, plman.PlaylistItemCount(ap) - 1, 1).forEach((idx) => { if (!plman.IsPlaylistItemSelected(ap, idx)) { toSelect.push(idx); } });
						plman.ClearPlaylistSelection(ap);
						plman.SetPlaylistSelection(ap, toSelect, true);
					}, flags: playlistCountFlags
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Clear selection', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						plman.ClearPlaylistSelection(ap);
					}, flags: selectedFlags
				});
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName, entryText: 'Select first track', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						plman.ClearPlaylistSelection(ap);
						plman.SetPlaylistSelection(ap, [0], true);
					}, flags: playlistCountFlags
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Select last track', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						plman.ClearPlaylistSelection(ap);
						plman.SetPlaylistSelection(ap, [plman.PlaylistItemCount(ap) - 1], true);
					}, flags: playlistCountFlags
				});
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName, entryText: 'Select random track', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						const numbers = range(0, plman.PlaylistItemCount(ap), 1).shuffle(); // Get indexes randomly sorted
						plman.ClearPlaylistSelection(ap);
						plman.SetPlaylistSelection(ap, [numbers[0]], true); // Take first one
					}, flags: playlistCountFlags
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Select random tracks', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						const numbers = range(0, plman.PlaylistItemCount(ap), 1).shuffle(); // Get indexes randomly sorted
						const selLength = numbers[0] ? numbers[0] : numbers[1]; // There is only a single zero...
						plman.ClearPlaylistSelection(ap);
						plman.SetPlaylistSelection(ap, numbers.slice(0, selLength), true); // Take n first ones, where n is also the first or second value of indexes array
					}, flags: playlistCountFlags
				});
				menu.newEntry({
					menuName: subMenuName, entryText: () => { return 'Select random ' + menu_properties.playlistLength[1] + ' tracks'; }, func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						const numbers = range(0, plman.PlaylistItemCount(ap), 1).shuffle(); // Get indexes randomly sorted
						const selLength = menu_properties.playlistLength[1];
						plman.ClearPlaylistSelection(ap);
						plman.SetPlaylistSelection(ap, numbers.slice(0, selLength), true); // Take n first ones, where n is also the first or second value of indexes array
					}, flags: playlistCountFlags
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Select next X tracks...', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						let input = menu_properties.playlistLength[1];
						try { input = Number(utils.InputBox(window.ID, 'Enter num of next items to select from focused item:\n(< 0 will go backwards)\n(= 1 will only select the focused item)', scriptName + ': ' + name, input, true)); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (!Number.isFinite(input)) { return; }
						if (!input) { return; }
						let start = plman.GetPlaylistFocusItemIndex(ap);
						if (start !== -1 && !plman.IsPlaylistItemSelected(ap, start)) { start = -1; }
						const end = plman.PlaylistItemCount(ap);
						const numbers = input < 0 ? (start !== -1 ? range(0, start, 1) : range(0, end, 1)) : range(start !== -1 ? start : 0, end, 1);
						plman.ClearPlaylistSelection(ap);
						plman.SetPlaylistSelection(ap, input < 0 ? numbers.slice(input) : numbers.slice(0, input), true); // Take n first ones
					}, flags: playlistCountFlags
				});
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName, entryText: 'Delete selected tracks', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						plman.UndoBackup(ap);
						plman.RemovePlaylistSelection(ap);
					}, flags: selectedFlagsRem
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Delete non-selected tracks', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						plman.UndoBackup(ap);
						plman.RemovePlaylistSelection(ap, true);
					}, flags: playlistCountFlagsRem
				});
				menu.newSeparator(subMenuName);
				const subMenuHalf = menu.newMenu('By halves', subMenuName);
				menu.newSeparator(subMenuName);
				const subMenuThird = menu.newMenu('By thirds', subMenuName);
				menu.newSeparator(subMenuName);
				const subMenuQuarter = menu.newMenu('By quarters', subMenuName);
				const selArgs = [
					{ name: 'Select first Half', menu: subMenuHalf, args: { start: 0, end: 1 / 2 } },
					{ name: 'Select second Half', menu: subMenuHalf, args: { start: 1 / 2, end: 1 } },
					{ name: 'Select first Quarter', menu: subMenuQuarter, args: { start: 0, end: 1 / 4 } },
					{ name: 'Select first Third', menu: subMenuThird, args: { start: 0, end: 1 / 3 } },
					{ name: 'Select second Third', menu: subMenuThird, args: { start: 1 / 3, end: 2 / 3 } },
					{ name: 'Select third Third', menu: subMenuThird, args: { start: 2 / 3, end: 1 } },
					{ name: 'Select second Quarter', menu: subMenuQuarter, args: { start: 1 / 4, end: 1 / 2 } },
					{ name: 'Select third Quarter', menu: subMenuQuarter, args: { start: 1 / 2, end: 3 / 4 } },
					{ name: 'Select fourth Quarter', menu: subMenuQuarter, args: { start: 3 / 4, end: 1 } }
				];
				selArgs.forEach((selArg) => {
					menu.newEntry({
						menuName: selArg.menu, entryText: selArg.name, func: (args = selArg.args) => {
							const ap = plman.ActivePlaylist;
							if (ap === -1) { return; }
							const count = plman.PlaylistItemCount(ap);
							const start = count * args.start;
							const end = Math.floor(count * args.end);
							plman.ClearPlaylistSelection(ap);
							plman.SetPlaylistSelection(ap, range(start, end, 1), true);
						}, flags: playlistCountFlags
					});
				});
			} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
		}
		{	// Select (for use with macros!!)
			const name = 'Select (by time)';
			if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
				readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\selection_time.txt';
				const subMenuName = menu.newMenu(name, menuName);
				menu.newEntry({ menuName: subMenuName, entryText: 'Sets selection on current playlist:', func: null, flags: MF_GRAYED });
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName, entryText: () => { return 'Select rand ' + Math.round(menu_properties.playlistLength[1] * 3) + ' minutes'; }, func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						const [handleArr, idxArr] = Array.shuffle(plman.GetPlaylistItems(ap).Convert(), range(0, plman.PlaylistItemCount(ap) - 1));
						const timeArr = getHandleListTagsTyped(
							new FbMetadbHandleList(handleArr),
							[{ name: 'LENGTH_SECONDS', type: 'number' }],
							{ bMerged: true }
						).flat();
						const time = Math.round(menu_properties.playlistLength[1] * 3 * 60);
						const sel = [];
						let acc = 0;
						timeArr.forEach((trackTime, i) => {
							if (acc === time) { return; }
							if (acc + trackTime <= time) { acc += trackTime; sel.push((idxArr[i])); }
						});
						plman.ClearPlaylistSelection(ap);
						plman.SetPlaylistSelection(ap, sel.sort(), true); // NOSONAR
					}, flags: playlistCountFlags
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Select rand X minutes (crossfade)...', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						const input = Input.number('int positive', Math.round(menu_properties.playlistLength[1] * 3), 'Enter num of minutes to select from current playlist:\n(int number > 0)', scriptName + ': ' + name, 60) || Input.lastInput;
						if (!input) { return; }
						const crossfade = Input.number('real positive', 0, 'Enter crossfade duration in s: (real number > 0)\n\n(0 to ignore it)', scriptName + ': ' + name, 3) || Input.lastInput;
						if (crossfade === null) { return; }
						const time = Math.abs(input) * 60;
						const [handleArr, idxArr] = Array.shuffle(plman.GetPlaylistItems(ap).Convert(), range(0, plman.PlaylistItemCount(ap) - 1));
						const timeArr = getHandleListTagsTyped(
							new FbMetadbHandleList(handleArr),
							[{ name: 'LENGTH_SECONDS', type: 'number' }],
							{ bMerged: true }
						).flat();
						const sel = [];
						let acc = 0;
						timeArr.forEach((trackTime, i) => {
							if (acc === time) { return; }
							const newTime = trackTime - (i !== 0 ? crossfade : 0);
							if (acc + newTime <= time) { acc += newTime; sel.push((idxArr[i])); }
						});
						console.log('Playlist Tools: Selected time ' + utils.FormatDuration(acc) + ' (+' + crossfade * Math.max(sel.length - 1, 0) + 's crossfade)');
						plman.ClearPlaylistSelection(ap);
						plman.SetPlaylistSelection(ap, sel.sort(), true); // NOSONAR
					}, flags: playlistCountFlags
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Select next X minutes (crossfade)...', func: () => {
						const ap = plman.ActivePlaylist;
						if (ap === -1) { return; }
						const input = Input.number('int', Math.round(menu_properties.playlistLength[1] * 3), 'Enter num of next minutes to select from focused item:\n(int number)\n\n(< 0 will go backwards)', scriptName + ': ' + name, 60) || Input.lastInput;
						if (!input) { return; }
						const crossfade = Input.number('real positive', 0, 'Enter crossfade duration in s: (real number > 0)\n\n(0 to ignore it)', scriptName + ': ' + name, 3) || Input.lastInput;
						if (crossfade === null) { return; }
						const endTime = Math.abs(input) * 60;
						const handleList = plman.GetPlaylistItems(ap);
						const timeArr = getHandleListTagsTyped(
							handleList,
							[{ name: 'LENGTH_SECONDS', type: 'number' }],
							{ bMerged: true }
						).flat();
						const start = plman.GetPlaylistFocusItemIndex(ap);
						let acc = 0;
						const idx = (input > 0
							? timeArr.slice(start)
							: timeArr.slice(0, start).reverse()
						).findIndex((trackTime, i) => {
							const newTime = trackTime - (i !== 0 ? crossfade : 0);
							acc += newTime;
							if (acc > endTime) {
								console.log('Playlist Tools: Selected time ' + utils.FormatDuration(acc - newTime) + ' (+' + crossfade * Math.max((i - 1), 0) + 's crossfade)');
								return true;
							} else {
								return false;
							}
						});
						const end = input > 0
							? Math.max(
								idx === -1
									? handleList.Count - 1
									: (idx - 1) + start,
								0
							)
							: Math.min(
								idx === -1
									? 0
									: start - (idx - 1),
								start
							);
						plman.ClearPlaylistSelection(ap);
						plman.SetPlaylistSelection(ap, input > 0 ? range(start, end) : range(end, start), true);
					}, flags: playlistCountFlags
				});
				menu.newSeparator(subMenuName);
				const subMenuHalf = menu.newMenu('By halves', subMenuName);
				menu.newSeparator(subMenuName);
				const subMenuThird = menu.newMenu('By thirds', subMenuName);
				menu.newSeparator(subMenuName);
				const subMenuQuarter = menu.newMenu('By quarters', subMenuName);
				const selArgs = [
					{ name: 'Select first Half', menu: subMenuHalf, args: { n: 0, group: 2 } },
					{ name: 'Select second Half', menu: subMenuHalf, args: { n: 1, group: 2 } },
					{ name: 'Select first Third', menu: subMenuThird, args: { n: 0, group: 3 } },
					{ name: 'Select second Third', menu: subMenuThird, args: { n: 1, group: 3 } },
					{ name: 'Select third Third', menu: subMenuThird, args: { n: 2, group: 3 } },
					{ name: 'Select first Quarter', menu: subMenuQuarter, args: { n: 0, group: 4 } },
					{ name: 'Select second Quarter', menu: subMenuQuarter, args: { n: 1, group: 4 } },
					{ name: 'Select third Quarter', menu: subMenuQuarter, args: { n: 2, group: 4 } },
					{ name: 'Select fourth Quarter', menu: subMenuQuarter, args: { n: 3, group: 4 } }
				];
				selArgs.forEach((selArg) => {
					menu.newEntry({
						menuName: selArg.menu, entryText: selArg.name, func: (args = selArg.args) => {
							const ap = plman.ActivePlaylist;
							if (ap === -1) { return; }
							const handleList = plman.GetPlaylistItems(ap);
							const timeArr = getHandleListTagsTyped(
								handleList,
								[{ name: 'LENGTH_SECONDS', type: 'number' }],
								{ bMerged: true }
							).flat();
							timeArr.forEach((curr, i) => timeArr[i] += (i !== 0 ? timeArr[i - 1] : 0));
							const limits = range(0, args.group)
								.map((() => {
									const left = timeArr[0];
									const range = timeArr.slice(-1)[0] - left;
									return (i) => {
										const time = i === 0
											? timeArr[0]
											: range / args.group * i + left;
										const idx = timeArr.indexOf(time);
										return { idx, time };
									};
								})());
							limits.forEach((limit, i) => {
								if (limit.idx !== -1) { return; }
								let diff = Infinity;
								let j = i !== 0 ? limits[i - 1].idx + 1 : 0;
								for (let time of timeArr.slice(j)) {
									if (!diff) { break; }
									const newDiff = Math.abs(time - limit.time);
									if (newDiff < diff) {
										diff = newDiff;
										limit.idx = j;
										j++;
									} else { break; }
								}
								limit.time = timeArr[limit.idx];
							});
							const start = limits[args.n].idx + (args.n !== 0 ? 1 : 0);
							const end = limits[args.n + 1].idx;
							plman.ClearPlaylistSelection(ap);
							plman.SetPlaylistSelection(ap, range(start, end, 1), true);
						}, flags: playlistCountFlags
					});
				});
			} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
		}
		{	// Expand
			const name = 'Expand';
			if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
				const subMenuName = menu.newMenu(name, menuName);
				menu.newEntry({ menuName: subMenuName, entryText: 'Expand selection by:', func: null, flags: MF_GRAYED });
				menu.newSeparator(subMenuName);
				const selArgs = [
					{ name: 'By Artist', args: ['%ARTIST%'] },
					{ name: 'By Album Artist', args: ['%ALBUM ARTIST%'] },
					{ name: 'By Album', args: ['%ALBUM%'] },
					{ name: 'sep' },
					{ name: 'By Date', args: [globTags.date] },
					{ name: 'By Decade', args: ['$div(' + _t(globTags.date) + ',10)0s'] },
					{ name: 'By Genre', args: ['%' + globTags.genre + '%'] },
					{ name: 'By Style', args: ['%' + globTags.style + '%'] },
					{ name: 'By Key', args: [defaultArgs.keyTag] },
					{ name: 'By Mood', args: ['%' + globTags.mood + '%'] },
					{ name: 'By Rating', args: [globTags.rating] },
					{ name: 'sep' },
					{ name: 'By Directory', args: ['%DIRECTORYNAME%'] },
					{ name: 'By Protocol', args: ['$left(%_PATH_RAW%,$strstr(%_PATH_RAW%,://))'] },
					{ name: 'By File/Url', args: ['$if3($strstr(%_PATH_RAW%,file:),$strstr(%_PATH_RAW%,file-relative:),0)'] },
					{ name: 'sep' },
					{
						name: 'By... (tags)', args: () => {
							let input = globTags.artist + ';%ALBUM%';
							try { input = utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(multiple values may be separated by \';\')', scriptName + ': ' + name, input, true); }
							catch (e) { return []; } // eslint-disable-line no-unused-vars
							return input.length ? input.split(';') : [];
						}
					},
				];
				selArgs.forEach((selArg) => {
					menu.newEntry({
						menuName: subMenuName, entryText: selArg.name, func: () => {
							const ap = plman.ActivePlaylist;
							const selItems = plman.GetPlaylistSelectedItems(ap);
							const plsItems = plman.GetPlaylistItems(ap);
							const selIdx = new Set();
							(isFunction(selArg.args) ? selArg.args() : selArg.args).forEach((tf) => {
								tf = _t(tf); // Add % to tag names if missing
								const tags = fb.TitleFormat(tf).EvalWithMetadbs(plsItems);
								const selTags = fb.TitleFormat(tf).EvalWithMetadbs(selItems);
								new Set(selTags).forEach((selTag) => {
									tags.forEach((tag, idx) => {
										if (tag === selTag) { selIdx.add(idx); }
									});
								});
							});
							if (selIdx.size) {
								plman.SetPlaylistSelection(ap, [...selIdx], true);
							}
						}, flags: selectedFlags
					});
				});
			} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
		}
		{	// Jump
			const name = 'Jump';
			if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
				const subMenuName = menu.newMenu(name, menuName);
				const subMenus = [
					menu.newMenu('Next', subMenuName),
					menu.newMenu('Previous', subMenuName)
				];
				const selArgs = [
					{ name: 'By Artist', args: ['%ARTIST%'] },
					{ name: 'By Album Artist', args: ['%ALBUM ARTIST%'] },
					{ name: 'By Album', args: ['%ALBUM%'] },
					{ name: 'sep' },
					{ name: 'By Date', args: [globTags.date] },
					{ name: 'By Decade', args: ['$div(' + _t(globTags.date) + ',10)0s'] },
					{ name: 'By Genre', args: ['%' + globTags.genre + '%'] },
					{ name: 'By Style', args: ['%' + globTags.style + '%'] },
					{ name: 'By Key', args: [defaultArgs.keyTag] }, // Uses remapped tag. Probably missing %, fixed later.
					{ name: 'By Mood', args: ['%' + globTags.mood + '%'] },
					{ name: 'By Rating', args: [globTags.rating] },
					{ name: 'sep' },
					{ name: 'By Directory', args: ['%DIRECTORYNAME%'] },
					{ name: 'By Protocol', args: ['$left(%_PATH_RAW%,$strstr(%_PATH_RAW%,://))'] },
					{ name: 'By File/Url', args: ['$if3($strstr(%_PATH_RAW%,file:),$strstr(%_PATH_RAW%,file-relative:),0)'] },
					{ name: 'sep' },
					{
						name: 'By... (tags)', args: () => {
							let input = globTags.artist + ';%ALBUM%';
							try { input = utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(multiple values may be separated by \';\')', scriptName + ': ' + name, input, true); }
							catch (e) { return []; } // eslint-disable-line no-unused-vars
							return input.length ? input.split(';') : [];
						}
					},
				];
				subMenus.forEach((subMenu) => {
					menu.newEntry({ menuName: subMenu, entryText: 'Jumps to ' + subMenu.toLowerCase() + ' item:', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenu);
					selArgs.forEach((selArg) => {
						menu.newEntry({
							menuName: subMenu, entryText: selArg.name, func: () => {
								const ap = plman.ActivePlaylist;
								const focusIdx = plman.GetPlaylistFocusItemIndex(ap);
								const selItems = plman.GetPlaylistSelectedItems(ap);
								const plsItems = plman.GetPlaylistItems(ap);
								const count = plman.PlaylistItemCount(ap);
								let selIdx = -1;
								let bDone = false;
								(isFunction(selArg.args) ? selArg.args() : selArg.args).forEach((tf) => {
									if (bDone) { return; }
									tf = _t(tf); // Add % to tag names if missing
									const selTags = fb.TitleFormat(tf).EvalWithMetadbs(selItems);
									for (let i = subMenu === 'Next' ? focusIdx + 1 : focusIdx - 1; i >= 0 && i < count; subMenu === 'Next' ? i++ : i--) {
										if (plman.IsPlaylistItemSelected(ap, i)) { continue; }
										const tag = fb.TitleFormat(tf).EvalWithMetadb(plsItems[i]);
										new Set(selTags).forEach((selTag) => {
											if (bDone) { return; }
											if (tag !== selTag) { selIdx = i; bDone = true; }
										});
										if (bDone) { break; }
									}
								});
								if (selIdx !== - 1) {
									plman.ClearPlaylistSelection(ap);
									plman.SetPlaylistSelection(ap, [selIdx], true);
									plman.SetPlaylistFocusItem(ap, selIdx);
								}
							}, flags: selectedFlags
						});
					});
				});
			} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
		}
		menu.newSeparator();
	} else { menuDisabled.push({ menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
}