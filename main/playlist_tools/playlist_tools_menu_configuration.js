'use strict';
//25/11/24

/* global menusEnabled:readable, configMenu:readable, readmes:readable, menu:readable, newReadmeSep:readable, menu_properties:readable, scriptName:readable, overwriteMenuProperties:readable, forcedQueryMenusEnabled:writable, defaultArgs:readable, menu_propertiesBack:readable, menu_panelProperties:readable, overwritePanelProperties:readable, shortcutsPath:readable, importPreset:readable, presets:writable, menu_panelPropertiesBack:readable, loadProperties:readable, overwriteDefaultArgs:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable */

/* global MF_GRAYED:readable, folders:readable, _isFile:readable, utf8:readable, globQuery:readable, _p:readable, _save:readable, _explorer:readable, isArrayEqual:readable, _jsonParseFileCheck:readable, Input:readable, globRegExp:readable, capitalize:readable, WshShell:readable, popup:readable, MF_STRING:readable, _recycleFile:readable, _open:readable, MF_MENUBREAK:readable */

// Configuration
{
	if (!Object.hasOwn(menusEnabled, configMenu) || menusEnabled[configMenu] === true) {
		readmes[newReadmeSep()] = 'sep';
		readmes[configMenu + '\\Presets'] = folders.xxx + 'helpers\\readme\\playlist_tools_menu_presets.txt';
		// Create it if it was not already created. Contains entries from multiple scripts
		if (!menu.hasMenu(configMenu)) {
			menu.newMenu(configMenu);
		}
		{	// Menu to configure queries behavior
			const subMenuName = menu.newMenu('Queries and Dynamic queries', configMenu);
			{
				const subMenuNameTwo = menu.newMenu('Dynamic queries evaluation', subMenuName);
				{	// Menu to configure properties: dynQueryEvalSel
					menu.newEntry({ menuName: subMenuNameTwo, entryText: 'Evaluate on entire selection:', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuNameTwo);
					menu.newCondEntry({
						entryText: 'dynQueryEvalSel', condFunc: () => {
							const options = JSON.parse(menu_properties.dynQueryEvalSel[1]);
							Object.keys(options).forEach((key) => {
								menu.newEntry({
									menuName: subMenuNameTwo, entryText: key, func: () => {
										fb.ShowPopupMessage('Controls wether dynamic queries are evaluated only on the focused item (single item) or the entire selection.\n\nWhen evaluated  on multiple selected tracks, a query evaluated on 3 items would look like this:\n\nTITLE IS #TITLE#\n(TITLE IS O Dromos To Gramma) OR (TITLE IS Gyal Bad) OR (TITLE IS Say Me)', scriptName + ': ' + configMenu);
										options[key] = !options[key];
										menu_properties.dynQueryEvalSel[1] = JSON.stringify(options);
										overwriteMenuProperties();
									}
								});
								menu.newCheckMenuLast(() => options[key]);
							});
						}
					});
				}
			}
			{
				const subMenuNameTwo = menu.newMenu('Global Forced Query', subMenuName);
				{	// Menu to configure properties: forcedQuery
					menu.newEntry({ menuName: subMenuNameTwo, entryText: 'Switch forced query functionality:', func: null, flags: MF_GRAYED });
					menu.newSeparator(subMenuNameTwo);
					menu.newCondEntry({
						entryText: 'forcedQueryMenusEnabled', condFunc: () => {
							// Merge with properties
							forcedQueryMenusEnabled = { ...forcedQueryMenusEnabled, ...JSON.parse(menu_properties.forcedQueryMenusEnabled[1]) }; // NOSONAR
							menu_properties.forcedQueryMenusEnabled[1] = JSON.stringify(forcedQueryMenusEnabled);
							overwriteMenuProperties();
							Object.keys(forcedQueryMenusEnabled).forEach((key) => {
								menu.newEntry({
									menuName: subMenuNameTwo, entryText: key, func: () => {
										forcedQueryMenusEnabled[key] = !forcedQueryMenusEnabled[key];
										menu_properties.forcedQueryMenusEnabled[1] = JSON.stringify(forcedQueryMenusEnabled);
										overwriteMenuProperties(); // Updates panel
									}
								});
								menu.newCheckMenuLast(() => forcedQueryMenusEnabled[key]);
							});
							menu.newSeparator(subMenuNameTwo);
							menu.newEntry({
								menuName: subMenuNameTwo, entryText: 'Set Global Forced Query...', func: () => {
									const input = utils.InputBox(window.ID, 'Enter global query added at playlist creation.\n', scriptName + ': ' + configMenu, menu_properties['forcedQuery'][1]);
									if (menu_properties['forcedQuery'][1] === input) { return; }
									try { fb.GetQueryItems(new FbMetadbHandleList(), input); } // Sanity check
									catch (e) { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, scriptName); return; }
									defaultArgs.forcedQuery = input;
									menu_properties['forcedQuery'][1] = input;
									overwriteMenuProperties(); // Updates panel
								}
							});
							{ // Menu to configure properties: additional filters
								const subMenuNameThree = menu.newMenu('Additional pre-defined filters', subMenuNameTwo);
								let options = [];
								const file = folders.xxx + 'presets\\Playlist Tools\\filters\\playlist_tools_filters.json';
								const bFile = _isFile(file);
								if (bFile) {
									options = _jsonParseFileCheck(file, 'Query filters json', 'Playlist Tools', utf8) || [];
									let bSave;
									options.forEach((o) => {
										if (!Object.hasOwn(o, 'name')) { o.name = o.title; delete o.title; bSave = true; }
									});
									if (bSave) { _save(file, JSON.stringify(options, null, '\t').replace(/\n/g, '\r\n')); }
								} else {
									options = [
										{ name: 'Female vocals', query: globQuery.female },
										{ name: 'Instrumentals', query: globQuery.instrumental },
										{ name: 'Acoustic tracks', query: globQuery.acoustic },
										{ name: 'Rating > 2', query: globQuery.ratingGr2 },
										{ name: 'Rating > 3', query: globQuery.ratingGr3 },
										{ name: 'Length < 6 min', query: globQuery.shortLength },
										{ name: 'Only Stereo', query: globQuery.stereo },
										{ name: 'sep' },
										{ name: 'No Female vocals', query: globQuery.noFemale },
										{ name: 'No Instrumentals', query: globQuery.noInstrumental },
										{ name: 'No Acoustic tracks', query: globQuery.noAcoustic },
										{ name: 'Not rated', query: globQuery.noRating },
										{ name: 'Not Live (unless Hi-Fi)', query: globQuery.noLive }
									];
								}
								menu.newEntry({ menuName: subMenuNameThree, entryText: 'Appended to Global Forced Query:', flags: MF_GRAYED });
								menu.newSeparator(subMenuNameThree);
								options.forEach((obj) => {
									if (menu.isSeparator(obj)) { menu.newSeparator(subMenuNameThree); return; }
									const entryText = obj.name;
									let input = menu_properties['forcedQuery'][1].length ? ' AND ' + _p(obj.query) : obj.query;
									menu.newEntry({
										menuName: subMenuNameThree, entryText, func: () => {
											if (menu_properties['forcedQuery'][1].includes(input)) {
												input = menu_properties['forcedQuery'][1].replace(input, ''); // Query
												input = input.slice(1, -1); // Remove parentheses
											} else {
												input = menu_properties['forcedQuery'][1].length ? _p(menu_properties['forcedQuery'][1]) + input : input;
											}
											try { fb.GetQueryItems(new FbMetadbHandleList(), input); } // Sanity check
											catch (e) { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'Search by distance'); return; }
											menu_properties['forcedQuery'][1] = input;
											overwriteMenuProperties(); // Updates panel
										}
									});
									menu.newCheckMenuLast(() => menu_properties['forcedQuery'][1].includes(input));
								});
								menu.newSeparator(subMenuNameThree);
								menu.newEntry({
									menuName: subMenuNameThree, entryText: 'Edit entries...' + (bFile ? '' : '\t(new file)'), func: () => {
										if (!bFile) { _save(file, JSON.stringify(options, null, '\t').replace(/\n/g, '\r\n')); }
										_explorer(file);
									}
								});
							}
						}
					});
				}
			}
		}
		menu.newSeparator(configMenu);
		{	// Menu to configure properties: playlistLength
			menu.newEntry({
				menuName: configMenu, entryText: () => 'Set Global Playlist Length...' + '\t[' + menu_properties['playlistLength'][1] + ']', func: () => {
					const input = Number(utils.InputBox(window.ID, 'Enter desired Playlist Length for playlist creation.\n', scriptName + ': ' + configMenu, menu_properties['playlistLength'][1]));
					if (menu_properties['playlistLength'][1] === input) { return; }
					if (!Number.isSafeInteger(input)) { return; }
					defaultArgs.playlistLength = input;
					menu_properties['playlistLength'][1] = input;
					overwriteMenuProperties(); // Updates panel
				}
			});
		}
		{	// Menu to configure properties: tags
			const subMenuName = menu.newMenu('Duplicates handling', configMenu);
			{
				menu.newEntry({ menuName: subMenuName, entryText: 'Remove duplicates on playlist creation:', func: null, flags: MF_GRAYED });
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName, entryText: 'Configure Tags or TF expression...', func: () => {
						let input = [];
						try { input = JSON.parse(utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(sep by comma)', scriptName + ': ' + configMenu, JSON.stringify(defaultArgs.checkDuplicatesBy), true)); }
						catch (e) { return; }
						if (input) { input = input.filter((n) => n); }
						if (isArrayEqual(defaultArgs.checkDuplicatesBy, input)) { return; }
						defaultArgs.checkDuplicatesBy = input;
						menu_properties.checkDuplicatesBy[1] = JSON.stringify(input);
						overwriteMenuProperties();
					}
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Track selection bias...', func: () => {
						const input = Input.string('string', menu_properties.sortBias[1], 'Enter TF expression for track selection when finding duplicates:\n\nHigher valued tracks will be preferred.', 'Search by distance', globQuery.remDuplBias, void (0), false);
						if (input === null) { return; }
						menu_properties.sortBias[1] = input;
						overwriteMenuProperties(); // Updates panel
					}
				});
				menu.newEntry({
					menuName: subMenuName, entryText: 'Use RegExp for title matching', func: () => {
						defaultArgs.bAdvTitle = !defaultArgs.bAdvTitle;
						menu_properties.bAdvTitle[1] = defaultArgs.bAdvTitle;
						fb.ShowPopupMessage(globRegExp.title.desc, scriptName + ': ' + configMenu);
						overwriteMenuProperties();
					}
				});
				menu.newCheckMenuLast(() => menu_properties.bAdvTitle[1]);
				menu.newEntry({
					menuName: subMenuName, entryText: 'Partial Multi-value tag matching', func: () => {
						defaultArgs.bMultiple = !defaultArgs.bMultiple;
						menu_properties.bMultiple[1] = defaultArgs.bMultiple;
						fb.ShowPopupMessage(
							'When this option is enabled, multi-value tags are parsed independently and a track may be considered a duplicate if at least one of those values match (instead of requiring all to match in the same order).\n\nSo for \'[ARTIST, DATE, TITLE]\' tags, these are duplicates with this option enabled:\n' +
							'\nJimi Hendrix - 1969 - Blabla' +
							'\nJimi Hendrix experience, Jimi Hendrix - 1969 - Blabla' +
							'\nBand of Gypys, Jimi Hendrix - 1969 - Blabla' +
							'\n\nWith multi-value parsing disabled, these are considered non-duplicated tracks since not all artists match.',
							scriptName + ': ' + configMenu
						);
						overwriteMenuProperties();
					}
				});
				menu.newCheckMenuLast(() => menu_properties.bMultiple[1]);
			}
		}
		{	// Menu to configure properties: tags
			const subMenuName = menu.newMenu('Tag remapping', configMenu);
			{
				const options = ['key', 'styleGenre'];
				menu.newEntry({ menuName: subMenuName, entryText: 'Set the tags used by tools:', func: null, flags: MF_GRAYED });
				menu.newSeparator(subMenuName);
				options.forEach((tagName) => {
					const key = tagName + 'Tag';
					const entryText = () => {
						const value = JSON.parse(menu_properties[key][1]).join(',');
						return capitalize(tagName) + '\t[' + (
							typeof value === 'string' && value.length > 10
								? value.slice(0, 10) + '...'
								: value
						) + ']';
					};
					menu.newEntry({
						menuName: subMenuName, entryText, func: () => {
							fb.ShowPopupMessage('Note this will NOT work on entries which apply queries like\n\'Search same by tags...\' since those queries are saved as text.\n\nIf you want to change tags at those tools, use the appropriate menus\nto remove/add your own entries.\n\nOtherwise, for a global change, edit the default tags and queries,\nwhich are used internally. Don\'t forget to reload the\npanels or restart foobar2000 and \'Restore defaults\' on all relevant buttons\nand menus to use the new values. Files may be found at:\nFOOBAR PROFILE FOLDER]\\js_data\\presets\\global\n\n\nAlternatively, you may look at the properties panel to directly edit\nthe menus and tags associated to queries.\n\nIt would not make any sense to remap tags at those places since the tags\n(and entries) are already directly configurable...', scriptName + ': ' + configMenu);
							let input;
							try { input = JSON.parse(utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(In some cases merging multiple tags is allowed, check the readme)\n(JSON)', scriptName + ': ' + configMenu, menu_properties[key][1], true)); }
							catch (e) { return; }
							if (input) { input = input.filter((n) => n); }
							if (isArrayEqual(JSON.parse(menu_properties[key][1]), input)) { return; }
							menu_properties[key][1] = JSON.stringify(input);
							overwriteMenuProperties(); // Updates panel
						}
					});
				});
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName, entryText: 'Restore defaults...', func: () => {
						options.forEach((key) => {
							const tagName = key + 'Tag';
							if (Object.hasOwn(menu_properties, tagName) && Object.hasOwn(menu_propertiesBack, tagName)) {
								menu_properties[tagName][1] = menu_propertiesBack[tagName][1];
							}
						});
						overwriteMenuProperties(); // Force overwriting
					}
				});
			}
		}
		menu.newSeparator(configMenu);
		{	// Async processing
			const subMenuName = menu.newMenu('Asynchronous processing', configMenu);
			menu.newEntry({ menuName: subMenuName, entryText: 'Switch async functionality:', func: null, flags: MF_GRAYED });
			menu.newSeparator(subMenuName);
			{	// Enable
				readmes[configMenu + '\\Async processing'] = folders.xxx + 'helpers\\readme\\async_processing.txt';
				menu.newCondEntry({
					entryText: 'async', condFunc: () => {
						const async = JSON.parse(menu_properties.async[1]);
						const options = Object.keys(async);
						const notAvailable = ['Tagger', 'Pools', 'Search by distance', 'Remove duplicates', 'Import track list'];
						options.forEach((key) => {
							const bNotAvailable = notAvailable.includes(key);
							menu.newEntry({
								menuName: subMenuName, entryText: key + (bNotAvailable ? '\t not available' : ''), func: () => {
									if (!async[key]) {
										const answer = WshShell.Popup('Enables asynchronous processing for the selected tool:\nUI will not be blocked while executing it, allowing to continue using Foobar2000 without interruptions, but as a side-effect it will also take more time to finish.\n\nFeature is only noticeable when processing a high number of tracks or computationally heavy tasks.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
										if (answer !== popup.yes) { return; }
									}
									async[key] = !async[key];
									menu_properties.async[1] = JSON.stringify(async);
									overwriteMenuProperties(); // Updates panel
								}, flags: bNotAvailable ? MF_GRAYED : MF_STRING
							});
							menu.newCheckMenuLast(() => async[key]);
						});
					}
				});
			}
		}
		menu.newSeparator(configMenu);
		{	// Logging
			const subMenuName = menu.newMenu('Logging', configMenu);
			menu.newEntry({ menuName: subMenuName, entryText: 'Switch logging functionality:', func: null, flags: MF_GRAYED });
			menu.newSeparator(subMenuName);
			{	// bDebug
				menu.newEntry({
					menuName: subMenuName, entryText: 'Enabled extended console debug', func: () => {
						menu_panelProperties.bDebug[1] = !menu_panelProperties.bDebug[1];
						defaultArgs.bDebug = menu_panelProperties.bDebug[1];
						overwritePanelProperties(); // Updates panel
					}
				});
				menu.newCheckMenuLast(() => menu_panelProperties.bDebug[1]);
				// bProfile
				menu.newEntry({
					menuName: subMenuName, entryText: 'Enabled profiler console log', func: () => {
						menu_panelProperties.bProfile[1] = !menu_panelProperties.bProfile[1];
						defaultArgs.bProfile = menu_panelProperties.bProfile[1];
						overwritePanelProperties(); // Updates panel
					}
				});
				menu.newCheckMenuLast(() => menu_panelProperties.bProfile[1]);
			}
		}
		{	// UI
			const subMenuName = menu.newMenu('UI', configMenu);
			menu.newEntry({ menuName: subMenuName, entryText: 'Switch UI functionality:', func: null, flags: MF_GRAYED });
			menu.newSeparator(subMenuName);
			{	// bTooltipInfo
				menu.newEntry({
					menuName: subMenuName, entryText: 'Show mouse shortcuts on tooltip', func: () => {
						menu_panelProperties.bTooltipInfo[1] = !menu_panelProperties.bTooltipInfo[1];
						overwritePanelProperties(); // Updates panel
					}
				});
				menu.newCheckMenuLast(() => menu_panelProperties.bTooltipInfo[1]);
			}
			menu.newSeparator(subMenuName);
			{	// Shortcuts
				readmes[configMenu + '\\Keyboard Shortcuts'] = folders.xxx + 'helpers\\readme\\keyboard_shortcuts.txt';
				menu.newEntry({
					menuName: subMenuName, entryText: 'Show keyboard shortcuts on entries', func: () => {
						if (!menu_properties.bShortcuts[1]) {
							const popupText = _open(readmes[configMenu + '\\Keyboard Shortcuts']);
							popupText && fb.ShowPopupMessage(popupText, scriptName);
						}
						menu_properties.bShortcuts[1] = !menu_properties.bShortcuts[1];
						overwriteMenuProperties(); // Updates panel
					}, flags: () => { return menu_panelProperties.bDynamicMenus[1] ? MF_STRING : MF_GRAYED; }
				});
				menu.newCheckMenuLast(() => menu_panelProperties.bDynamicMenus[1] && menu_properties.bShortcuts[1]);
				menu.newEntry({ menuName: subMenuName, entryText: 'Open shortcuts file...', func: () => { _explorer(shortcutsPath); } });
			}
		}
		menu.newSeparator(configMenu);
		{	// Import presets
			menu.newEntry({ menuName: configMenu, entryText: 'Import user presets... ', func: importPreset });
		}
		{	// Export all presets
			menu.newEntry({
				menuName: configMenu, entryText: 'Export all user presets... ', func: () => {
					const answer = WshShell.Popup('This will export all user presets (but not the default ones) as a json file, which can be imported later in any Playlist Tools panel.\nThat file can be easily edited with a text editor to add, tune or remove entries. Presets can also be manually deleted in their associated menu.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
					if (answer === popup.yes) {
						const path = folders.data + 'playlistTools_presets.json';
						_recycleFile(path, true);
						const readme = 'Backup ' + new Date().toString();
						if (_save(path, JSON.stringify({ readme, ...presets }, null, '\t').replace(/\n/g, '\r\n'))) {
							_explorer(path);
							console.log('Playlist tools: presets backup saved at ' + path);
						}
					}
				}
			});
		}
		menu.newSeparator(configMenu);
		{	// Reset all config
			menu.newEntry({
				menuName: configMenu, entryText: 'Reset all configuration... ', func: () => {
					const path = folders.data + 'playlistTools_presets.json';
					const answer = WshShell.Popup('Are you sure you want to restore all configuration to default?\nWill delete any related property, user saved menus, etc..', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
					if (answer === popup.yes) {
						const answerPresets = WshShell.Popup('Do you want to maintain your own presets?\n(\'No\' will create a backup file in ' + path + ')', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
						let copy;
						if (answerPresets === popup.yes) {
							copy = { ...presets };
						} else {
							_recycleFile(path, true);
							const readme = 'Backup ' + new Date().toString();
							if (_save(path, JSON.stringify({ readme, ...presets }, null, '\t').replace(/\n/g, '\r\n'))) {
								console.log('Playlist tools: presets backup saved at ' + path);
							} else { console.log('Playlist tools: failed to create backup of presets at ' + path); }
							presets = {}; // NOSONAR
						}
						// For the current instance
						for (let key in menu_properties) {
							menu_properties[key][1] = menu_propertiesBack[key][1];
						}
						overwriteMenuProperties(); // Updates panel
						// For the panel (only along buttons)
						if (typeof buttonsBar !== 'undefined' && Object.keys(menu_properties).length) {
							for (let key in menu_panelProperties) {
								menu_panelProperties[key][1] = menu_panelPropertiesBack[key][1];
							}
							menu_panelProperties.firstPopup[1] = true; // Don't show the popup again...
							overwritePanelProperties(); // Updates panel
						}
						loadProperties(); // Refresh
						// Restore presets
						if (answerPresets === popup.yes) {
							presets = copy;
							Object.keys(presets).forEach((key) => {
								// Add menus
								let currentMenu = JSON.parse(menu_properties[key][1]);
								currentMenu = currentMenu.concat(presets[key]);
								menu_properties[key][1] = JSON.stringify(currentMenu);
							});
							// Save all
							menu_properties['presets'][1] = JSON.stringify(presets);
							overwriteMenuProperties(); // Updates panel
						}
						overwriteDefaultArgs();
					}
				}
			});
		}
		menu.newSeparator(configMenu);
		{	// Readmes
			const subMenuName = menu.newMenu('Readmes', configMenu);
			if (window.ScriptInfo.Name === 'Playlist Tools: Buttons Bar') {
				readmes[newReadmeSep()] = 'sep';
				readmes['Toolbar'] = folders.xxx + 'helpers\\readme\\toolbar.txt';
			}
			menu.newEntry({ menuName: subMenuName, entryText: 'Open popup with readme:', func: null, flags: MF_GRAYED });
			menu.newSeparator(subMenuName);
			let iCount = 0;
			const breakOn = 20;
			if (Object.keys(readmes).length) {
				const sepRegEx = /(^sep$)|(^separator$)/i;
				Object.entries(readmes).forEach(([key, value]) => { // Only show non empty files
					if (sepRegEx.test(value)) { menu.newSeparator(subMenuName); }
					else if (_isFile(value)) {
						const readme = _open(value, utf8); // Executed on script load
						const flags = iCount < breakOn ? MF_STRING : iCount === breakOn ? MF_MENUBREAK : (iCount - breakOn) % (breakOn + 1) ? MF_STRING : MF_MENUBREAK; // Span horizontally
						if (readme.length) {
							menu.newEntry({
								menuName: subMenuName, entryText: key, func: () => { // Executed on menu click
									if (_isFile(value)) {
										const readme = _open(value, utf8);
										if (readme.length) { fb.ShowPopupMessage(readme, key); }
									} else { console.log('Readme not found: ' + value); }
								}, flags
							});
							iCount++;
						}
					} else { console.log('Readme not found: ' + value); }
				});
				// Entry to open all readmes
				menu.newCondEntry({
					entryText: 'Readme test', condFunc: (bInit = true) => { // Runs the first time the menu is clicked
						if (bInit && menu_panelProperties.bDebug[1]) {
							menu.newSeparator(subMenuName);
							menu.newEntry({
								menuName: subMenuName, entryText: 'Open all readmes', func: () => { // Executed on menu click
									Object.entries(readmes).forEach(([key, value]) => { // Only show non empty files
										if (sepRegEx.test(value)) { return; }
										else if (_isFile(value)) {
											const readme = _open(value, utf8);
											if (readme.length) { fb.ShowPopupMessage(readme, key); }
										} else { console.log('Readme not found: ' + value); }
									});
								}
							});
						}
					}
				});
			}
			if (!iCount) { menu.newEntry({ menuName: subMenuName, entryText: '- no files - ', func: null, flags: MF_GRAYED }); }
		}
	} else { menuDisabled.push({ menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); } // NOSONAR
}