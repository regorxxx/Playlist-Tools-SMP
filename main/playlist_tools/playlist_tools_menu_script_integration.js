'use strict';
//09/03/23

// Script integration
{
	const name = 'Script integration';
	if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
		readmes[newReadmeSep()] = 'sep';
		let menuName = menu.newMenu(name);
		{	// Dynamic menus
			const scriptPath = folders.xxx + 'main\\main_menu\\main_menu_custom.js';
			if (_isFile(scriptPath)){
				const name = 'SMP Dynamic menu';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath.replace(folders.xxx  + 'main\\', '..\\'));
					include(folders.xxx + 'helpers\\helpers_xxx_controller.js');
					include(folders.xxx + 'helpers\\helpers_xxx_playlists.js');
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\main_menu_dynamic.txt';
					readmes[menuName + '\\' + name + ' custom'] = folders.xxx + 'helpers\\readme\\main_menu_dynamic_custom.txt';
					const subMenuName = menu.newMenu(name, menuName);
					const mainMenuSMPDefaults = clone([
						{name: 'Add SKIP Tag at current playback', funcName: 'skipTagFromPlayback', path: folders.xxx + 'main\\tags\\skip_tag_from_playback.js', icon: 'ui-icon ui-icon-tag'},
						{name: 'Execute menu entry by name', funcName: 'executeByName' , path: '', icon: 'ui-icon ui-icon-star'}
					]);
					var mainMenuSMP = clone([mainMenuSMPDefaults[0]]);
					menu_properties['mainMenuSMP'] = [menuName + '\\' + name + ' entries', JSON.stringify(mainMenuSMP)]; // On main_menu_custom.js
					menu_properties['mainMenuSMP'].push({func: isJSON}, menu_properties['mainMenuSMP'][1]);
					const plsListener = 'pt:listener';
					// Helpers
					function exportMenus(path) {
						const listExport = clone(mainMenuSMP).filter(Boolean).map((entry) => {return {name: entry.name, funcName: entry.funcName, icon: entry.hasOwnProperty('icon') ? entry.icon : ''};});
						return _save(path + 'smpmenus.json', JSON.stringify(listExport, null, '\t'));
					}
					var exportEntries = function exportEntries(path) {
						const mainMenu = menu.getMainMenuName();
						// Separators are not globally filtered to be able to redraw -at least partially- the tree
						const tree = {};
						let menuList = [];
						const toSkip = new Set(['Add new entry to list...', 'Remove entry from list...', 'Add new query to list...', 'Remove query from list...', 'From year...', 'By... (pairs of tags)', 'By... (query)', 'Filter playlist by... (query)', 'Configuration', 'Menu 1', 'Menu 2', 'Menu 3', 'Menu 4', 'Menu 5', 'Menu 6', 'Menu 7', 'Menu 8', 'Menu 9', 'Find track(s) in...', 'Check tags', 'Write tags', 'Playlist History', 'Custom pool...', 'Start recording a macro', 'Stop recording and Save macro', 'Playlist Names Commands', 'Include scripts', 'Search by Distance','Set Global Forced Query...', 'Readmes...', 'SMP Main menu', 'Script integration', 'Split playlist list submenus at...', 'Show locked playlist (autoplaylists, etc.)?', 'Show current playlist?', 'Selection manipulation', 'Close playlist...', 'Go to playlist...', 'Send playlist\'s tracks to...', 'Remove track(s) from...', 'Find now playing track in...','Other tools', 'Configure dictionary...', 'By halves', 'By quarters', 'By thirds' , 'Send selection to...', 'Don\'t try to find tracks if selecting more than...', 'Filter playlist by... (tags)', 'Set tags (for duplicates)...', 'Set tags (for filtering)...', 'Set number allowed (for filtering)...', 'Sets similarity threshold...', 'From year...', 'From last...','UI', 'Logging', 'Asynchronous processing', 'Tag remapping','SMP Dynamic menu','Import track list','Report all from...','Check only...','Difference with playlist...','Intersect with playlist...','Merge with playlist...','Tags...', 'By... (tags)','Available tools','Enable double pass to match more tracks','By... (expression)','Find or create playlist...','To specified position','Select next tracks...','Available tools...','Harmonic mixing','Additional pre-defined filters...','Set menus...']);
						const toSkipStarts = ['(Send sel. to)', 'Remove entry from list...', '(Close) Playlists', '(Go to) Playlists', '(Send all to) Playlists','Tag remapping...','Search by Distance...','(Lock) Playlists','(Unlock) Playlists'];
						allEntries.filter((entry) => {return entry.hasOwnProperty('entryText') && entry.hasOwnProperty('menuName');}).forEach((entry) => {
							const entryText = (isFunction(entry.entryText) ? entry.entryText() : entry.entryText).replace(/\t.*/g,'');
							const menuName = entry.menuName;
							// Skip
							if (toSkip.has(entryText) || toSkip.has(menuName)) {return;}
							if (toSkipStarts.some((title) => {return entryText.startsWith(title);}) || toSkipStarts.some((title) => {return menuName.startsWith(title);})) {return;}
							// Save
							if (!tree.hasOwnProperty(menuName)) {tree[menuName] = [];}
							// console.log(entry.flags);
							tree[menuName].push({name: (menuName !==  mainMenu ? menuName + '\\' + entryText : entryText), flags: isFinite(entry.flags) ? entry.flags : 0});
							if (menuName !== mainMenu && entryText !== (menuName + '\\sep') && entry.flags === MF_GRAYED) {
								menuList.push({name: menuName + '\\sep', flags: 1});
							}
							if (!new Set(menuList).has(menuName)) {menuList.push(menuName);}
							if (menuName === mainMenu && entryText === 'sep') {menuList.push({name: entryText, flags: 1});}
						});
						Object.keys(tree).forEach((menuKey) => {
							const idx = menuList.indexOf(menuKey);
							if (idx !== -1) {menuList = [...menuList.slice(0, idx), ...tree[menuKey], ...menuList.slice(idx + 1)];}
						});
						// Filter consecutive separators
						menuList = menuList.filter((item, idx, arr) => {return (item.name !== 'sep' && !item.name.endsWith('\\sep')) || (idx !== 0 && (arr[idx -1].name !== 'sep') && !arr[idx -1].name.endsWith('\\sep'));});
						const listExport = menuList;
						return _save(path + 'playlisttoolsentries.json', JSON.stringify(listExport, null, '\t'));
					}
					// Global scope
					var executeByName = function executeByName(path) {
						const ajQueryFile = folders.ajquerySMP + 'toexecute.json';
						const localFile = folders.data + 'toexecute.json';
						const pls = getPlaylistIndexArray(plsListener);
						const plsData = pls.length === 1 && plman.PlaylistItemCount(pls[0]) !== 0 ? plman.GetPlaylistItems(pls[0]).Convert().map((handle) => {return {name: handle.Path.split('_').pop()};}) : null;
						if (plsData) {plman.RemovePlaylistSwitch(pls[0]);}
						const data = (_isFile(ajQueryFile) 
							? _jsonParseFileCheck(ajQueryFile, 'To execute json', scriptName, utf8) 
							: (_isFile(localFile) 
								? _jsonParseFileCheck(localFile, 'To execute json', scriptName, utf8) 
								: (plsData ? plsData : null)
							)
						);
						if (data) {
							data.forEach((entry) => {
								const entryName = entry.hasOwnProperty('name') ? entry.name : '';
								if (entryName.length) {
									try {
										menu.btn_up(void(0), void(0), void(0), entryName);
									} catch (e) {console.log('executeByName: Error evaluating: ' + entryName + ' from menu.');}
								} else {console.log('executeByName: Entry has no name property: ' + entry);}
							});
						} else {console.log('executeByName: Error reading source file(s): ' + ajQueryFile);}
					};
					// Start
					deferFunc.push({name, func: (properties) => {
						mainMenuSMP = JSON.parse(properties['mainMenuSMP'][1]);
						if (folders.ajqueryCheck()) {
							if (!exportMenus(folders.ajquerySMP)) {console.log('Error saving SMP main menus for http Control integration.')}
							if (!exportEntries(folders.ajquerySMP)) {console.log('Error saving Playlist Tools entries for http Control integration.')}
							if (!exportDSP(folders.ajquerySMP)) {console.log('Error saving DSP entries for http Control integration.')}
							if (!exportDevices(folders.ajquerySMP)) {console.log('Error saving Devices entries for http Control integration.')}
							if (!exportComponents(folders.ajquerySMP, {bDynamicMenusPT: menu_panelProperties.bDynamicMenus[1]})) {console.log('Error saving Components entries for http Control integration.')}
						}
					}});
					//  Menus
					const flags = isCompatible('1.6.1', 'smp') ? MF_STRING : MF_GRAYED;
					menu.newEntry({menuName: subMenuName, entryText: 'File\\Spider Monkey Panel\\Script commands:', flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newCondEntry({entryText: name + ' (cond)', condFunc: () => {
						// Entry list
						mainMenuSMP = JSON.parse(menu_properties['mainMenuSMP'][1]);
						const entryNames = new Set();
						mainMenuSMP.forEach((entry, index) => {
							if (!entry) {return;}
							// Add separators
							if (entry.hasOwnProperty('name') && entry.name === 'sep') {
								menu.newEntry({menuName: subMenuName, entryText: 'sep'});
							} else { 
								// Create names for all entries
								let scriptName = entry.name;
								scriptName = scriptName.length > 40 ? scriptName.substring(0,40) + ' ...' : scriptName;
								if (entryNames.has(scriptName)) {
									fb.ShowPopupMessage('There is an entry with duplicated name:\t' + scriptName + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(entry, null, '\t'), scriptName + ': ' + name);
									return;
								} else {entryNames.add(scriptName);}
								// Entries
								menu.newEntry({menuName: subMenuName, entryText: scriptName + '\t (' + (index + 1) + ')', func: null, flags: MF_GRAYED});
							}
						});
						if (!mainMenuSMP.filter(Boolean).length) {menu.newEntry({menuName: subMenuName, entryText: '(none set yet)', func: null, flags: MF_GRAYED});}
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						{	// Add
							const toolName = name;
							const subMenuNameTwo = menu.newMenu('Set menus...', subMenuName);
							const options = [
								{name: 'Custom menu', func: (idx = onMainMenuEntries.length) => {
									let funcName = '';
									try {funcName = utils.InputBox(window.ID, 'Enter menu entry:\n(subMenu\\Entry)\n\nMenu names may be easily retrieved by simulating menu execution with Ctrl + L. Click, which copies entry names to clipboard.', 'Playlist Tools: ' + toolName, '', true);}
									catch (e) {return;}
									if (!funcName.length) {return;}
									let name = '';
									try {name = utils.InputBox(window.ID, 'Enter description (name)', 'Playlist Tools: ' + toolName, funcName, true);}
									catch (e) {return;}
									if (!name.length) {return;}
									let icon = '';
									// Add icons
									if (funcName.startsWith('Most played Tracks') || funcName.startsWith('Top rated Tracks from...')) {icon = 'ui-icon ui-icon-heart';}
									if (funcName.startsWith('Search same by tags...') || funcName.startsWith('Search similar by') || funcName.startsWith('Special Playlists...')) {icon = 'ui-icon ui-icon-link';}
									if (funcName.startsWith('Standard Queries...') || funcName.startsWith('Dynamic Queries...')) {icon = 'ui-icon ui-icon-search';}
									if (funcName.startsWith('Duplicates and tag filtering')) {icon = 'ui-icon ui-icon-trash';}
									if (funcName.startsWith('Query filtering')) {icon = 'ui-icon ui-icon-zoomout';}
									if (funcName.startsWith('Harmonic mix')) {icon = 'ui-icon ui-icon-person';}
									if (funcName.startsWith('Sort...') || funcName.startsWith('Advanced sort...') || funcName.startsWith('Scatter by tags')) {icon = 'ui-icon ui-icon-carat-2-n-s';}
									if (funcName.startsWith('Check tags')) {icon = 'ui-icon ui-icon-print';}
									if (funcName.startsWith('Write tags')) {icon = 'ui-icon ui-icon-pencil';}
									if (funcName.startsWith('Playlist Revive')) {icon = 'ui-icon ui-icon-battery-1';}
									if (funcName.startsWith('Pools')) {icon = 'ui-icon ui-icon-circle-zoomout';}
									if (funcName.startsWith('Macros')) {icon = 'ui-icon ui-icon-clock';}
									// Save
									onMainMenuEntries[idx] = mainMenuSMP[mainMenuSMP.length] = {name, funcName , menuName: 'menu', icon};
								;}},
								{name: 'Custom function', func: (idx = onMainMenuEntries.length) => {
									let path = '';
									try {path = utils.InputBox(window.ID, 'Enter script path', 'Playlist Tools: ' + toolName, funcName, true);}
									catch (e) {return;}
									if (!path.length) {return;}
									let funcName = '';
									try {funcName = utils.InputBox(window.ID, 'Enter function name:\n', 'Playlist Tools: ' + toolName, '', true);}
									catch (e) {return;}
									if (!funcName.length) {return;}
									let name = '';
									try {name = utils.InputBox(window.ID, 'Enter description (name)', 'Playlist Tools: ' + toolName, funcName, true);}
									catch (e) {return;}
									if (!name.length) {return;}
									onMainMenuEntries[idx] = mainMenuSMP[mainMenuSMP.length] = {name, funcName , path};
								;}},
								{name: 'sep'},
								{name: mainMenuSMPDefaults[0].name, func: (idx = onMainMenuEntries.length) => {
									fb.ShowPopupMessage('Adds a \'SKIP\' tag using current playback. Meant to be used along Skip Track (foo_skip) component.\n\nHas an intelligent switch which sets behavior according to playback time:\n	- If time > half track length -> Track will play as usually up to the \'SKIP\' time, where it jumps to next track.\n	- If time < half track length -> Track will play from \'SKIP\' time to the end.\n	- Pressing shift while calling the action will append tag to existing SKIP tags (instead of replacing them). Meant to add skipped parts at multiple points for ex.\n\nThis is a workaround for using %PLAYBACK_TIME% for tagging, since %PLAYBACK_TIME% does not work within masstagger scripts.\n\nMost common usage would be adding a button to a native buttons toolbar and assigning it this action via main menus (File\Spider Monkey Panel\Script commands\....)', scriptName + ': ' + name);
									onMainMenuEntries[idx] = mainMenuSMP[mainMenuSMP.length] = {name: 'Add skip Tag at current playback', funcName: 'skipTagFromPlayback' , path: folders.xxx + 'main\\tags\\skip_tag_from_playback.js', icon: 'ui-icon ui-icon-tag'};
								}},
								{name: mainMenuSMPDefaults[1].name, func: (idx = onMainMenuEntries.length) => {
									const ajQueryFile = folders.ajquerySMP + 'toexecute.json';
									const localFile = folders.data + 'toexecute.json';
									fb.ShowPopupMessage('This entry is meant to be used along online controllers, like ajquery-xxx, to be able to call an arbitrary number of tools by their menu names.\n\nThe entry name is read from a local json file which should be edited on demand by the server to set the menu entries that must be executed when calling this SMP main menu.\nTracked files can be found at:\n' + ajQueryFile + '\n' + localFile + ' (if previous one is not found)\n\nIn case json file(s) are not found, then it tries to read commands from a playlist named \'' + plsListener + '\'.', scriptName + ': ' + name);
									onMainMenuEntries[idx] = mainMenuSMP[mainMenuSMP.length] = {name: 'Execute menu entry by name', funcName: 'executeByName' , path: '', icon: 'ui-icon ui-icon-star'};
								}}
							];
							options.forEach((entry, index) => {
								// Add separators
								if (entry.hasOwnProperty('name') && entry.name === 'sep') {
									menu.newEntry({menuName: subMenuNameTwo, entryText: 'sep'});
								} else { 
									// Create names for all entries
									let scriptName = entry.name;
									scriptName = scriptName.length > 40 ? scriptName.substring(0,40) + ' ...' : scriptName;
									// Entries
									menu.newEntry({menuName: subMenuNameTwo, entryText: scriptName, func: () => {
										const idx = onMainMenuEntries.length;
										if (idx >= 9) {
											const answer = WshShell.Popup('Warning: more than 9 menu entries are gonna to be added to the list.\n Only the first 9 entries can be used on online controllers like ajquery-xxx.\nDo you want to continue?', 0, scriptName + ': ' + name, popup.question + popup.yes_no);
											if (answer === popup.no) {return;}
										}
										entry.func(idx);
										fb.RegisterMainMenuCommand(onMainMenuDynamicEntries.length, onMainMenuEntries[idx].name, onMainMenuEntries[idx].name);
										onMainMenuDynamicEntries.push({...onMainMenuEntries[idx], onMainMenuEntries: true, parent: scriptName});
										menu_properties['mainMenuSMP'][1] = JSON.stringify(mainMenuSMP);
										overwriteMenuProperties(); // Updates panel
										if (folders.ajqueryCheck()) {
											if (!exportMenus(folders.ajquerySMP)) {console.log('Error saving SMP main menus for http Control integration.');}
											if (!exportEntries(folders.ajquerySMP)) {console.log('Error saving Playlist Tools entries for http Control integration.');}
										}
									}});
								}
							});
						}
						{	// Remove
							const subMenuSecondName = menu.newMenu('Remove entry from list...', subMenuName);
							mainMenuSMP.forEach( (entry, index) => {
								if (!entry) {return;}
								const entryText = (entry.name === 'sep' ? '------(separator)------' : (entry.name.length > 40 ? entry.name.substring(0,40) + ' ...' : entry.name));
								menu.newEntry({menuName: subMenuSecondName, entryText: entryText  + '\t (' + (index + 1) + ')', func: () => {
									mainMenuSMP.splice(index, 1);
									delete onMainMenuEntries[index + 1];
									menu_properties['mainMenuSMP'][1] = JSON.stringify(mainMenuSMP);
									// Presets
									if (presets.hasOwnProperty('mainMenuSMP')) {
										presets.mainMenuSMP.splice(presets.mainMenuSMP.findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(entry);}), 1);
										if (!presets.mainMenuSMP.length) {delete presets.mainMenuSMP;}
										menu_properties['presets'][1] = JSON.stringify(presets);
									}
									overwriteMenuProperties(); // Updates panel
									if (folders.ajqueryCheck()) {
										if (!exportMenus(folders.ajquerySMP)) {console.log('Error saving SMP main menus for http Control integration.');}
										if (!exportEntries(folders.ajquerySMP)) {console.log('Error saving Playlist Tools entries for http Control integration.');}
									}
								}});
							});
							if (!mainMenuSMP.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
							menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
							menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
								mainMenuSMP = [...mainMenuSMPDefaults];
								menu_properties['mainMenuSMP'][1] = JSON.stringify(mainMenuSMP);
								// Presets
								if (presets.hasOwnProperty('mainMenuSMP')) {
									delete presets.mainMenuSMP;
									menu_properties['presets'][1] = JSON.stringify(presets);
								}
								overwriteMenuProperties(); // Updates panel
								if (folders.ajqueryCheck()) {
									if (!exportMenus(folders.ajquerySMP)) {console.log('Error saving SMP main menus for http Control integration.');}
									if (!exportEntries(folders.ajquerySMP)) {console.log('Error saving Playlist Tools entries for http Control integration.');}
								}
							}});
						}
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Create SMP dynamic menus', func: () => {
							menu_panelProperties.bDynamicMenus[1] = !menu_panelProperties.bDynamicMenus[1];
							overwritePanelProperties(); // Updates panel
							if (folders.ajqueryCheck()) {
								exportComponents(folders.ajquerySMP,  {bDynamicMenus: menu_panelProperties.bDynamicMenus[1]});
							}
							// Disable UI shortcuts if they can not be used
							if (!menu_panelProperties.bDynamicMenus[1] && menu_properties.bShortcuts[1]) {
								fb.ShowPopupMessage('Keyboard shortcuts are now disabled and not shown on the menu entries.', window.Name);
								menu_properties.bShortcuts[1] = false;
								overwriteMenuProperties(); // Updates panel
							}
							// And create / delete menus
							if (menu_panelProperties.bDynamicMenus[1]) {
								fb.ShowPopupMessage('Remember to set different panel names to every buttons toolbar, otherwise menus will not be properly associated to a single panel.\n\nShift + Win + R. Click -> Configure panel... (\'edit\' at top)', window.Name);
								createMainMenuDynamic();
								callbacksListener.checkPanelNames();
							} else {
								deleteMainMenuDynamic(scriptName);
								exportMainMenuDynamic();
								mainMenuSMP.forEach((entry, index) => {
									if (entry) {
										onMainMenuEntries[index + 1] = entry;
										if (!menu_panelProperties.bDynamicMenus[1]) {
											fb.RegisterMainMenuCommand(index, entry.name, entry.name);
											onMainMenuDynamicEntries.push({...entry, parent: scriptName});
										}
									}
								});
							}
						}, flags});
						menu.newCheckMenu(subMenuName, 'Create SMP dynamic menus', void(0),  () => {return menu_panelProperties.bDynamicMenus[1];});
					}});
				}
			}
		}
		{	// Playlist Names Commands
			const name = 'Playlist Names Commands';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\playlist_names_commands.txt';
				const subMenuName = menu.newMenu(name, menuName);
				//  Menus
				menu.newEntry({menuName: subMenuName, entryText: 'Switch event listener:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'Enabled Playlist Names Commands', func: () => {
					if (!menu_properties.bPlaylistNameCommands[1]) {
						const readme = 'An utility to easily execute Playlist Tools entries creating playlists with specific command names. Checks playlist names regularly for "special" names.\n\nWhen a playlist name starts with \'PT:\', the callback fires and anything after those 3 chars is treated as a special command which will be compared to a list of known commands or executed as a menu name.\n\nLook at Playlist Names Commands readme for more info. Enable it?';
						const answer = WshShell.Popup(readme, 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
						if (answer !== popup.yes) {return;}
					}
					menu_properties.bPlaylistNameCommands[1] = !menu_properties.bPlaylistNameCommands[1];
					overwriteMenuProperties(); // Updates panel
				}});
				menu.newCheckMenu(subMenuName, 'Enabled Playlist Names Commands', void(0), () => {return menu_properties.bPlaylistNameCommands[1];}); 
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{	// Include scripts
			const name = 'Include scripts';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\include_scripts.txt';
				const subMenuName = menu.newMenu(name, menuName);
				let scriptIncluded = [];
				let scriptIncludedDefaults = [];
				menu_properties['scriptIncluded'] = [menuName + '\\' + name + ' scripts', JSON.stringify(scriptIncluded)];
				menu_properties['scriptIncluded'].push({func: isJSON}, menu_properties['scriptIncluded'][1]);
				deferFunc.push({name, func: (properties) => {
					const scriptIncluded = JSON.parse(properties['scriptIncluded'][1]);
					scriptIncluded.forEach((scrObj) => {
						try {include(scrObj.path);}
						catch (e) {return;}
					});
				}});
				//  Menus
				menu.newEntry({menuName: subMenuName, entryText: 'Include headless scripts:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newCondEntry({entryText: name + ' (cond)', condFunc: () => {
					// Entry list
					scriptIncluded = JSON.parse(menu_properties['scriptIncluded'][1]);
					scriptIncluded.forEach( (scrObj) => {
						// Add separators
						if (scrObj.hasOwnProperty('name') && scrObj.name === 'sep') {
							menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						} else { 
							// Create names for all entries
							let scriptName = scrObj.name;
							scriptName = scriptName.length > 40 ? scriptName.substring(0,40) + ' ...' : scriptName;
							// Entries
							menu.newEntry({menuName: subMenuName, entryText: scriptName, func: null, flags: MF_GRAYED});
						}
					});
					if (!scriptIncluded.length) {menu.newEntry({menuName: subMenuName, entryText: '(none set yet)', func: null, flags: MF_GRAYED});}
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					{	// Add / Remove
						menu.newEntry({menuName: subMenuName, entryText: 'Add new entry to list...' , func: () => {
							const answer = WshShell.Popup('This is an utility to easily include (\'merge\') multiple SMP scripts into the same panel, thus not wasting multiple panels. Useful for those scripts that don\'t require any UI, user interaction, etc.\n\nNote you must only include simple utility scripts without UI!. Like scripts which set the main menu SPM entries (File\\Spider Monkey Panel) and do nothing more.\n\nThe use of this functionality is done at your own responsibility, it may obviously break things if you use it without thinking.\n\nIn any case, you can later remove the included script at any point or disable the functionality altogether (just disable the associated menu). If the file fails while loading, it will probably crash and will not be added for later startups... so just reload panel and done.', 0, scriptName + ': ' + name, popup.question + popup.yes_no);
							if (answer === popup.no) {return;}
							// Input all variables
							let input;
							let path = '';
							try {path = utils.InputBox(window.ID, 'Enter script path:\nIts use is done at your own responsibility.', scriptName + ': ' + name, '', true);}
							catch (e) {return;}
							if (path === 'sep') {input = {name: path};} // Add separator
							else { // or new entry
								if (_isFile(path)) {
									try {include(path);}
									catch (e) {return;}
									const arr = utils.SplitFilePath(path);
									const name = (arr[1].endsWith(arr[2])) ? arr[1] : arr[1] + arr[2]; // <1.4.0 Bug: [directory, filename + filename_extension,
									input = {name , path};
								}
							}
							// Add entry
							scriptIncluded.push(input);
							// Save as property
							menu_properties['scriptIncluded'][1] = JSON.stringify(scriptIncluded); // And update property with new value
							// Presets
							if (!presets.hasOwnProperty('scriptIncluded')) {presets.scriptIncluded = [];}
							presets.scriptIncluded.push(input);
							menu_properties['presets'][1] = JSON.stringify(presets);
							overwriteMenuProperties(); // Updates panel
						}});
						{
							const subMenuSecondName = menu.newMenu('Remove entry from list...', subMenuName);
							scriptIncluded.forEach( (queryObj, index) => {
								const entryText = (queryObj.name === 'sep' ? '------(separator)------' : (queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name));
								menu.newEntry({menuName: subMenuSecondName, entryText, func: () => {
									scriptIncluded.splice(index, 1);
									menu_properties['scriptIncluded'][1] = JSON.stringify(scriptIncluded);
									// Presets
									if (presets.hasOwnProperty('scriptIncluded')) {
										presets.scriptIncluded.splice(presets.scriptIncluded.findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(queryObj);}), 1);
										if (!presets.scriptIncluded.length) {delete presets.scriptIncluded;}
										menu_properties['presets'][1] = JSON.stringify(presets);
									}
									overwriteMenuProperties(); // Updates panel
								}});
							});
							if (!scriptIncluded.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
							menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
							menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
								scriptIncluded = [...scriptIncludedDefaults];
								menu_properties['scriptIncluded'][1] = JSON.stringify(scriptIncluded);
								// Presets
								if (presets.hasOwnProperty('scriptIncluded')) {
									delete presets.scriptIncluded;
									menu_properties['presets'][1] = JSON.stringify(presets);
								}
								overwriteMenuProperties(); // Updates panel
							}});
						}
				}
				}});
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
	} else {menuDisabled.push({menuName: name, subMenuFrom:  menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}