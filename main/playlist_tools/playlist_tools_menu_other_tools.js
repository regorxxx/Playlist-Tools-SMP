'use strict';
//25/09/25

/* global menusEnabled:readable, readmes:readable, menu:readable, newReadmeSep:readable, scriptName:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, menu_properties:writable, overwriteMenuProperties:readable, libSearchMenu:readable */

/* global MF_GRAYED:readable, folders:readable, _isFile:readable, globTags:readable globQuery:readable, isString:readable, isJSON:readable, Input:readable, sanitizePath:readable, checkQuery:readable, _ps:readable */

// Other tools
{
	if (!Object.hasOwn(menusEnabled, libSearchMenu) || menusEnabled[libSearchMenu]) {
		const menuName = menu.findOrNewMenu(libSearchMenu);
		readmes[newReadmeSep()] = 'sep';
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
									fb.ShowPopupMessage('File not found:\n\n' + path, window.Name + _ps(window.ScriptInfo.Name) + ': ' + name);
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
										window.Name + _ps(window.ScriptInfo.Name)
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
									fb.ShowPopupMessage('File not found:\n\n' + path, window.Name + _ps(window.ScriptInfo.Name) + ': ' + name);
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
								const input = Input.string('string', menu_properties.importPlaylistPath[1], 'Enter file path:', window.Name + _ps(window.ScriptInfo.Name) + ': ' + name, menu_properties.importPlaylistPath[3], [(s) => path.includes('http://') || path.includes('https://') || sanitizePath(s) === s], true);
								if (input === null) { return; }
								menu_properties.importPlaylistPath[1] = input;
								overwriteMenuProperties(); // Updates panel
							}
						});
					}
				} else { menuDisabled.push({ menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
			}
		}
	} else { menuDisabled.push({ menuName: libSearchMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
}