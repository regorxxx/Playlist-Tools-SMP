'use strict';
//16/10/22

// Configuration...
{
	if (!menusEnabled.hasOwnProperty(configMenu) || menusEnabled[configMenu] === true) {
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
					menu.newEntry({menuName: subMenuNameTwo, entryText: 'Evaluate on entire selection:', func: null, flags: MF_GRAYED})
					menu.newEntry({menuName: subMenuNameTwo, entryText: 'sep'})
					menu.newCondEntry({entryText: 'dynQueryEvalSel', condFunc: () => {
						const options = JSON.parse(menu_properties.dynQueryEvalSel[1]);
						Object.keys(options).forEach((key) => {
							menu.newEntry({menuName: subMenuNameTwo, entryText: key, func: () => {
								fb.ShowPopupMessage('Controls wether dynamic queries are evaluated only on the focused item (single item) or the entire selection.\n\nWhen evaluated  on multiple selected tracks, a query evaluated on 3 items would look like this:\n\nTITLE IS #TITLE#\n(TITLE IS O Dromos To Gramma) OR (TITLE IS Gyal Bad) OR (TITLE IS Say Me)', scriptName + ': ' + configMenu);
								options[key] = !options[key];
								menu_properties.dynQueryEvalSel[1] = JSON.stringify(options);
								overwriteMenuProperties(); // Updates panelmenu_properties, menu_prefix, 0, false, true);
							}});
							menu.newCheckMenu(subMenuNameTwo, key, void(0), () => {return options[key];});
						});
					}});
				}
			}
			{
				const subMenuNameTwo = menu.newMenu('Global Forced Query', subMenuName);
				{	// Menu to configure properties: forcedQuery
					menu.newEntry({menuName: subMenuNameTwo, entryText: 'Switch forced query functionality:', func: null, flags: MF_GRAYED})
					menu.newEntry({menuName: subMenuNameTwo, entryText: 'sep'})
					menu.newCondEntry({entryText: 'forcedQueryMenusEnabled', condFunc: () => {
						forcedQueryMenusEnabled = {...forcedQueryMenusEnabled, ...JSON.parse(menu_properties.forcedQueryMenusEnabled[1])}; // Merge with properties
						menu_properties.forcedQueryMenusEnabled[1] = JSON.stringify(forcedQueryMenusEnabled);
						overwriteProp({forcedQueryMenusEnabled: menu_properties.forcedQueryMenusEnabled}, menu_prefix);
						Object.keys(forcedQueryMenusEnabled).forEach((key) => {
							menu.newEntry({menuName: subMenuNameTwo, entryText: key, func: () => {
								forcedQueryMenusEnabled[key] = !forcedQueryMenusEnabled[key];
								menu_properties.forcedQueryMenusEnabled[1] = JSON.stringify(forcedQueryMenusEnabled);
								overwriteMenuProperties(); // Updates panel
							}});
							menu.newCheckMenu(subMenuNameTwo, key, void(0), () => {return forcedQueryMenusEnabled[key];});
						});
						menu.newEntry({menuName: subMenuNameTwo, entryText: 'sep'})
						menu.newEntry({menuName: subMenuNameTwo, entryText: 'Set Global Forced Query...', func: () => {
							const input = utils.InputBox(window.ID, 'Enter global query added at playlist creation.\n', scriptName + ': ' + configMenu, menu_properties['forcedQuery'][1]);
							if (menu_properties['forcedQuery'][1] === input) {return;}
							try {fb.GetQueryItems(new FbMetadbHandleList(), input);} // Sanity check
							catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, scriptName); return;}
							defaultArgs.forcedQuery = input;
							menu_properties['forcedQuery'][1] = input;
							overwriteMenuProperties(); // Updates panel
						}});
						{ // Menu to configure properties: additional filters
							const subMenuNameThree = menu.newMenu('Additional pre-defined filters...', subMenuNameTwo);
							let options = [];
							const file = folders.xxx + 'presets\\Playlist Tools\\filters\\playlist_tools_filters.json';
							const bFile = _isFile(file);
							if (bFile) {
								options = _jsonParseFileCheck(file, 'Query filters json', 'Playlist Tools', utf8) || [];
							} else {
								options = [
									{title: 'Female vocals',			query: globQuery.female}, 
									{title: 'Instrumentals',			query: globQuery.instrumental},
									{title: 'Acoustic tracks',			query: globQuery.acoustic},
									{title: 'Rating > 2',				query: globQuery.ratingGr2},
									{title: 'Rating > 3',				query: globQuery.ratingGr3},
									{title: 'Length < 6 min',			query: globQuery.shortLength},
									{title: 'Only Stereo',				query: globQuery.stereo},
									{title: 'sep'},		
									{title: 'No Female vocals',			query: globQuery.noFemale}, 
									{title: 'No Instrumentals', 		query: globQuery.noInstrumental},
									{title: 'No Acoustic tracks',		query: globQuery.noAcoustic},
									{title: 'Not rated',				query: globQuery.noRating},
									{title: 'Not Live (unless Hi-Fi)',	query: globQuery.noLive}
								];
							}
							menu.newEntry({menuName: subMenuNameThree, entryText: 'Appended to Global Forced Query:', flags: MF_GRAYED});
							menu.newEntry({menuName: subMenuNameThree, entryText: 'sep', flags: MF_GRAYED});
							options.forEach((obj) => {
								if (obj.title === 'sep') {menu.newEntry({menuName: subMenuNameThree, entryText: 'sep', flags: MF_GRAYED}); return;}
								const entryText = obj.title;
								let input = menu_properties['forcedQuery'][1].length ? ' AND ' + _p(obj.query) : obj.query;
								menu.newEntry({menuName: subMenuNameThree, entryText, func: () => {
									if (menu_properties['forcedQuery'][1].indexOf(input) !== -1) {
										input = menu_properties['forcedQuery'][1].replace(input, ''); // Query
										input = input.slice(1, -1); // Remove parentheses
									} else {
										input = menu_properties['forcedQuery'][1].length ? _p(menu_properties['forcedQuery'][1]) + input : input;
									}
									try {fb.GetQueryItems(new FbMetadbHandleList(), input);} // Sanity check
									catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'Search by distance'); return;}
									menu_properties['forcedQuery'][1] = input;
									overwriteMenuProperties(); // Updates panel
								}});
								menu.newCheckMenu(subMenuNameThree, entryText, void(0), () => {return menu_properties['forcedQuery'][1].indexOf(input) !== -1;});
							});
							menu.newEntry({menuName: subMenuNameThree, entryText: 'sep', flags: MF_GRAYED});
							menu.newEntry({menuName: subMenuNameThree, entryText: 'Edit entries...' + (bFile ? '' : '\t(new file)'), func: () => {
								if (!bFile) {_save(file, JSON.stringify(options, null, '\t'));}
								_explorer(file);
							}});
						}
					}});
				}
			}
		}
		menu.newEntry({menuName: configMenu, entryText: 'sep'});
		{	// Menu to configure properties: playlistLength
			menu.newEntry({menuName: configMenu, entryText: () => 'Set Global Playlist Length...' + '\t[' + menu_properties['playlistLength'][1] + ']', func: () => {
				const input = Number(utils.InputBox(window.ID, 'Enter desired Playlist Length for playlist creation.\n', scriptName + ': ' + configMenu, menu_properties['playlistLength'][1]));
				if (menu_properties['playlistLength'][1] === input) {return;}
				if (!Number.isSafeInteger(input)) {return;}
				defaultArgs.playlistLength = input;
				menu_properties['playlistLength'][1] = input;
				overwriteMenuProperties(); // Updates panel
			}});
		}
		{	// Menu to configure properties: tags
			const subMenuName = menu.newMenu('Tag remapping...', configMenu);
			{
				const options = ['key', 'styleGenre'];
				menu.newEntry({menuName: subMenuName, entryText: 'Set the tags used by tools:', func: null, flags: MF_GRAYED})
				menu.newEntry({menuName: subMenuName, entryText: 'sep'})
				options.forEach((tagName) => {
					const key = tagName + 'Tag';
					menu.newEntry({menuName: subMenuName, entryText: () => capitalize(tagName) + '\t[' + menu_properties[key][1] + ']', func: () => {
						fb.ShowPopupMessage('Note this will NOT work on entries which apply queries like\n\'Search same by tags...\' since those queries are saved as text.\n\nIf you want to change tags at those tools, use the apropiate menus\nto remove/add your own entries.\n\nOtherwise, for a global change, edit the default tags and queries,\nwhich are used internally. Don\'t forget to reload the\npanels or restart foobar and \'Restore defaults\' on all relevant buttons\nand menus to use the new values. Files may be found at:\nFOOBAR PROFILE FOLDER]\\js_data\\presets\\global\n\n\nAlternatively, you may look at the properties panel to directly edit\nthe menus and tags associated to queries.\n\nIt would not make any sense to remap tags at those places since the tags\n(and entries) are already directly configurable...', scriptName + ': ' + configMenu);
						const input = utils.InputBox(window.ID, 'Enter desired tag name:', scriptName + ': ' + configMenu, menu_properties[key][1]);
						if (!input.length) {return;}
						if (menu_properties[tagName + 'Tag'][1] === input) {return;}
						defaultArgs[key] = input;
						menu_properties[key][1] = input;
						overwriteMenuProperties(); // Updates panel
					}});
				});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'Reset to default...', func: () => {
					options.forEach((key) => {
						const tagName = key + 'Tag';
						if (menu_properties.hasOwnProperty(tagName) && menu_propertiesBack.hasOwnProperty(tagName)) {
							menu_properties[tagName][1] = menu_propertiesBack[tagName][1];
						}
					});
					overwriteMenuProperties(); // Force overwriting
				}});
			}
		}
		menu.newEntry({menuName: configMenu, entryText: 'sep'});
		{	// Async processing
			const subMenuName = menu.newMenu('Asynchronous processing', configMenu);
			menu.newEntry({menuName: subMenuName, entryText: 'Switch async functionality:', func: null, flags: MF_GRAYED})
			menu.newEntry({menuName: subMenuName, entryText: 'sep'})
 			{	// Enable
				readmes[configMenu + '\\Async processing'] = folders.xxx + 'helpers\\readme\\async_processing.txt';
				menu.newCondEntry({entryText: 'async', condFunc: () => {
					const async = JSON.parse(menu_properties.async[1]);
					const options = Object.keys(async);
					const notAvailable = ['Write tags', 'Pools', 'Search by distance', 'Remove duplicates', 'Import track list'];
					options.forEach((key) => {
						const bNotAvailable = notAvailable.indexOf(key) !== -1;
						menu.newEntry({menuName: subMenuName, entryText: key + (bNotAvailable ? '\t not available' : ''), func: () => {
							if (!async[key]) {
								const answer = WshShell.Popup('Enables asynchronous processing for the selected tool:\nUI will not be blocked while executing it, allowing to continue using Foobar2000 without interruptions, but as a side-effect it will also take more time to finish.\n\nFeature is only noticeable when processing a high number of tracks or computationally heavy tasks.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
								if (answer !== popup.yes) {return;}
							}
							async[key] = !async[key];
							menu_properties.async[1] = JSON.stringify(async);
							overwriteMenuProperties(); // Updates panel
						}, flags: bNotAvailable ? MF_GRAYED : MF_STRING});
						menu.newCheckMenu(subMenuName, key, void(0), () => {return async[key];});
					});
				}});
			}
		}
		menu.newEntry({menuName: configMenu, entryText: 'sep'});
		{	// Logging
			const subMenuName = menu.newMenu('Logging', configMenu);
			menu.newEntry({menuName: subMenuName, entryText: 'Switch logging functionality:', func: null, flags: MF_GRAYED})
			menu.newEntry({menuName: subMenuName, entryText: 'sep'})
			{	// bDebug
				menu.newEntry({menuName: subMenuName, entryText: 'Enabled extended console debug', func: () => {
					menu_panelProperties.bDebug[1] = !menu_panelProperties.bDebug[1];
					defaultArgs.bDebug = menu_panelProperties.bDebug[1];
					overwritePanelProperties(); // Updates panel
				}});
				menu.newCheckMenu(subMenuName, 'Enabled extended console debug', void(0), () => {return menu_panelProperties.bDebug[1];});
				// bProfile
				menu.newEntry({menuName: subMenuName, entryText: 'Enabled profiler console log', func: () => {
					menu_panelProperties.bProfile[1] = !menu_panelProperties.bProfile[1];
					defaultArgs.bProfile = menu_panelProperties.bProfile[1];
					overwritePanelProperties(); // Updates panel
				}});
				menu.newCheckMenu(subMenuName, 'Enabled profiler console log', void(0), () => {return menu_panelProperties.bProfile[1];});
			}
		}
		{	// UI
			const subMenuName = menu.newMenu('UI', configMenu);
			menu.newEntry({menuName: subMenuName, entryText: 'Switch UI functionality:', func: null, flags: MF_GRAYED})
			menu.newEntry({menuName: subMenuName, entryText: 'sep'})
			{	// bTooltipInfo
				menu.newEntry({menuName: subMenuName, entryText: 'Show mouse shortcuts on tooltip', func: () => {
					menu_panelProperties.bTooltipInfo[1] = !menu_panelProperties.bTooltipInfo[1];
					overwritePanelProperties(); // Updates panel
				}});
				menu.newCheckMenu(subMenuName, 'Show mouse shortcuts on tooltip', void(0), () => {return menu_panelProperties.bTooltipInfo[1];});
			}
			menu.newEntry({menuName: subMenuName, entryText: 'sep'})
			{	// Shortcuts
				readmes[configMenu + '\\Keyboard Shortcuts'] = folders.xxx + 'helpers\\readme\\keyboard_shortcuts.txt';
				menu.newEntry({menuName: subMenuName, entryText: 'Show keyboard shortcuts on entries', func: () => {
					if (!menu_properties.bShortcuts[1]) {
						const popupText = _open(readmes[configMenu + '\\Keyboard Shortcuts']);
						popupText && fb.ShowPopupMessage(popupText, scriptName);
					}
					menu_properties.bShortcuts[1] = !menu_properties.bShortcuts[1];
					overwriteMenuProperties(); // Updates panel
				}, flags: () => {return menu_panelProperties.bDynamicMenus[1] ? MF_STRING : MF_GRAYED;}});
				menu.newCheckMenu(subMenuName, 'Show keyboard shortcuts on entries', void(0), () => {return menu_panelProperties.bDynamicMenus[1]&& menu_properties.bShortcuts[1];});
				menu.newEntry({menuName: subMenuName, entryText: 'Open shortcuts file...', func: () => {_explorer(shortcutsPath);}});
			}
		}
		menu.newEntry({menuName: configMenu, entryText: 'sep'});
		{	// Import presets
			menu.newEntry({menuName: configMenu, entryText: 'Import user presets... ', func: () => {
				let file;
				try {file = utils.InputBox(window.ID, 'Do you want to import a presets file?\nWill not overwrite current ones.\n(input path to file)', scriptName + ': ' + configMenu, folders.data + 'playlistTools_presets.json', true);}
				catch (e) {return;}
				if (!file.length) {return;}
				const newPresets = _jsonParseFileCheck(file, 'Presets', scriptName, utf8);
				if (!newPresets) {return;}
				// Load description
				let readme = '';
				if (newPresets.hasOwnProperty('readme')) {
					readme = newPresets.readme;
					delete newPresets.readme;
				}
				// List entries
				const presetList = Object.keys(newPresets).map((key) => {return '+ ' + key + ' -> ' + menu_properties[key][0] + '\n\t- ' + newPresets[key].map((preset) => {return preset.name + (preset.hasOwnProperty('method') ? ' (' + preset.method + ')': '');}).join('\n\t- ');});
				readme += (readme.length ? '\n\n' : '') + 'List of presets:\n' + presetList;
				fb.ShowPopupMessage(readme, scriptName + ': Presets (' + file.split('\\').pop() + ')')
				// Accept?
				const answer = WshShell.Popup('Check the popup for description. Do you want to import it?', 0, scriptName + ': Presets (' + file.split('\\').pop() + ')', popup.question + popup.yes_no);
				if (answer === popup.no) {return;}
				// Import
				Object.keys(newPresets).forEach((key) => {
					// Merge with current presets
					let currentMenu = JSON.parse(menu_properties[key][1]);
					if (presets.hasOwnProperty(key)) {presets[key] = [...presets[key], ...newPresets[key]];} 
					else {presets[key] = newPresets[key];}
					currentMenu = currentMenu.concat(newPresets[key]);
					menu_properties[key][1] = JSON.stringify(currentMenu);
				});
				// Save all
				menu_properties['presets'][1] = JSON.stringify(presets);
				overwriteMenuProperties(); // Updates panel
			}});
		}
		{	// Export all presets
			menu.newEntry({menuName: configMenu, entryText: 'Export all user presets... ', func: () => {
				const answer = WshShell.Popup('This will export all user presets (but not the default ones) as a json file, which can be imported later in any Playlist Tools panel.\nThat file can be easily edited with a text editor to add, tune or remove entries. Presets can also be manually deleted in their associated menu.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
				if (answer === popup.yes) {
					const path = folders.data + 'playlistTools_presets.json'
					_recycleFile(path);
					const readme = 'Backup ' + new Date().toString();
					if (_save(path, JSON.stringify({readme, ...presets}, null, '\t'))) {
						_explorer(path);
						console.log('Playlist tools: presets backup saved at ' + path);
					}
				}
			}});
		}
		menu.newEntry({menuName: configMenu, entryText: 'sep'});
		{	// Reset all config
			menu.newEntry({menuName: configMenu, entryText: 'Reset all configuration... ', func: () => {
				const path = folders.data + 'playlistTools_presets.json';
				const answer = WshShell.Popup('Are you sure you want to restore all configuration to default?\nWill delete any related property, user saved menus, etc..', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
				if (answer === popup.yes) {
					const answerPresets = WshShell.Popup('Do you want to maintain your own presets?\n(\'No\' will create a backup file in ' + path + ')', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
					let copy;
					if (answerPresets === popup.yes) {
						copy = {...presets};
					} else {
						_recycleFile(path);
						const readme = 'Backup ' + new Date().toString();
						if (_save(path, JSON.stringify({readme, ...presets}, null, '\t'))) {console.log('Playlist tools: presets backup saved at ' + path);}
						else {console.log('Playlist tools: failed to create backup of presets at ' + path);}
						presets = {};
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
			}});
		}
		menu.newEntry({menuName: configMenu, entryText: 'sep'});
		{	// Readmes
			const subMenuName = menu.newMenu('Readmes...', configMenu);
			menu.newEntry({menuName: subMenuName, entryText: 'Open popup with readme:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			let iCount = 0;
			if (Object.keys(readmes).length) {
				const rgex = /^sep$|^separator$/i;
				Object.entries(readmes).forEach(([key, value]) => { // Only show non empty files
					if (rgex.test(value)) {menu.newEntry({menuName: subMenuName, entryText: 'sep'}); return;}
					else if (_isFile(value)) { 
						const readme = _open(value, utf8); // Executed on script load
						const flags = iCount < 8 ? MF_STRING : iCount == 8 ? MF_MENUBREAK : (iCount - 8) % 10 ? MF_STRING : MF_MENUBREAK; // Span horizontally
						if (readme.length) {
							menu.newEntry({menuName: subMenuName, entryText: key, func: () => { // Executed on menu click
								if (_isFile(value)) {
									const readme = _open(value, utf8);
									if (readme.length) {fb.ShowPopupMessage(readme, key);}
								} else {console.log('Readme not found: ' + value);}
							}, flags});
							iCount++;
						}
					} else {console.log('Readme not found: ' + value);}
				});
				// Entry to open all readmes
				menu.newCondEntry({entryText: 'Readme test', condFunc: (bInit = true) => { // Runs the first time the menu is clicked
					if (bInit && menu_panelProperties.bDebug[1]) {
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Open all readmes', func: () => { // Executed on menu click
							Object.entries(readmes).forEach(([key, value]) => { // Only show non empty files
								if (rgex.test(value)) {return;}
								else if (_isFile(value)) {
									const readme = _open(value, utf8);
									if (readme.length) {fb.ShowPopupMessage(readme, key);}
								} else {console.log('Readme not found: ' + value);}
							});
						}});
					}
				}});
			} 
			if (!iCount) {menu.newEntry({menuName: subMenuName, entryText: '- no files - ', func: null, flags: MF_GRAYED});}
		}
	} else {menuDisabled.push({menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}