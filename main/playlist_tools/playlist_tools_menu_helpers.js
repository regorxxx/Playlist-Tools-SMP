'use strict';
//11/03/25

/* exported overwritePanelProperties, loadProperties, createSubMenuEditEntries, lastActionEntry, focusFlags, playlistCountFlags, playlistCountFlagsRem, playlistCountFlagsAddRem, multipleSelectedFlags, multipleSelectedFlagsReorder, selectedFlags, selectedFlagsReorder, selectedFlagsRem, selectedFlagsAddRem, closeLock */

/* global configMenu:readable, readmes:readable, menu:readable, menu_properties:readable, scriptName:readable, defaultArgs:readable, menu_panelProperties:readable,  shortcutsPath:readable, presets:writable, menu_prefix_panel:readable, shortcuts:writable, menu_propertiesBack:writable, menu_panelPropertiesBack:writable, menu_prefix:readable, deferFunc:readable */ // eslint-disable-line no-unused-vars

/* global MF_GRAYED:readable, folders:readable, _isFile:readable, utf8:readable, _save:readable, _explorer:readable, _jsonParseFileCheck:readable, WshShell:readable, popup:readable, MF_STRING:readable, _recycleFile:readable, _open:readable, setProperties:readable, doOnce:readable, getPropertiesPairs:readable, overwriteProperties:readable, isFunction:readable, clone:readable, _q:readable, compareObjects:readable , debounce:readable, _b:readable, tagsCache:readable */

/*
	Helpers
*/
function overwriteMenuProperties() { overwriteProp(menu_properties, menu_prefix); overwriteDefaultArgs(); }
function overwritePanelProperties() { overwriteProp(menu_panelProperties, menu_prefix_panel); overwriteDefaultArgs(); }
function overwriteProp(properties, prefix) { setProperties(properties, prefix, 0, false, true); }
function overwriteDefaultArgs() {
	for (let key in defaultArgs) {
		if (Object.hasOwn(menu_properties, key)) { // Also check updateMenuProperties()
			if (key === 'styleGenreTag' || key === 'checkDuplicatesBy') { defaultArgs[key] = JSON.parse(menu_properties[key][1]); }
			else if (key === 'keyTag') { defaultArgs[key] = JSON.parse(menu_properties[key][1])[0]; }
			else if (key === 'ratingLimits') { defaultArgs[key] = menu_properties[key][1].split(','); }
			else { defaultArgs[key] = menu_properties[key][1]; }
		} else if (Object.hasOwn(menu_panelProperties, key)) {
			defaultArgs[key] = menu_panelProperties[key][1];
		}
	}
}

function loadProperties() {
	if (typeof buttonsBar === 'undefined' && Object.keys(menu_properties).length) { // Merge all properties when not loaded along buttons
		// With const var creating new properties is needed, instead of reassigning using A = {...A,...B}
		if (Object.keys(menu_panelProperties).length) {
			Object.entries(menu_panelProperties).forEach(([key, value]) => { menu_properties[key] = value; });
		}
		setProperties(menu_properties, menu_prefix, 0);
		updateMenuProperties(getPropertiesPairs(menu_properties, menu_prefix, 0));
	} else if (Object.keys(menu_panelProperties).length) { // With buttons, set these properties only once per panel
		setProperties(menu_panelProperties, menu_prefix_panel, 0);
	}
}

function updateMenuProperties(propObject, menuFunc = deferFunc) {
	// Sanity checks
	propObject['playlistLength'][1] = Number(propObject['playlistLength'][1]);
	if (!Number.isSafeInteger(propObject['playlistLength'][1]) || propObject['playlistLength'][1] <= 0) { fb.ShowPopupMessage('Playlist length must be a positive integer.\n' + propObject['playlistLength'].slice(0, 2), scriptName); }
	try { fb.GetQueryItems(new FbMetadbHandleList(), propObject['forcedQuery'][1]); }
	catch (e) { fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + propObject['forcedQuery'], scriptName); } // eslint-disable-line no-unused-vars
	// Info Popup
	let panelPropObject = (typeof buttonsBar !== 'undefined') ? getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0) : propObject;
	if (!panelPropObject['firstPopup'][1]) {
		panelPropObject['firstPopup'][1] = true;
		overwriteProperties(panelPropObject); // Updates panel
		const readmeKeys = ['Playlist Tools Menu', 'Macros', 'Tagging requisites']; // Must read files on first execution
		readmeKeys.forEach((key) => {
			const readmePath = readmes[key];
			const readme = _open(readmePath, utf8);
			if (readme.length) { fb.ShowPopupMessage(readme, key); }
		});
	}
	// And update
	Object.entries(panelPropObject).forEach(([key, value]) => {
		if (Object.hasOwn(defaultArgs, key)) { defaultArgs[key] = value[1]; }
	});
	Object.entries(propObject).forEach(([key, value]) => {
		if (Object.hasOwn(defaultArgs, key)) { defaultArgs[key] = value[1]; }
		// Specific
		if (key === 'ratingLimits') { defaultArgs[key] = defaultArgs[key].split(','); }
		if (key === 'styleGenreTag' || key === 'checkDuplicatesBy') { defaultArgs[key] = JSON.parse(defaultArgs[key]); }
		if (key === 'keyTag') { defaultArgs[key] = JSON.parse(defaultArgs[key])[0]; }
	});
	if (Object.hasOwn(propObject, 'sortInputDuplic') && Object.hasOwn(propObject, 'sortInputFilter') && Object.hasOwn(propObject, 'nAllowed')) {
		updateShortcutsNames({ sortInputDuplic: propObject.sortInputDuplic[1], sortInputFilter: propObject.sortInputFilter[1], nAllowed: propObject.nAllowed[1] });
	}
	// Presets
	presets = JSON.parse(propObject['presets'][1]); // NOSONAR
	// Backup defaults
	doOnce('Backup', () => {
		menu_propertiesBack = clone(menu_properties); // NOSONAR
		menu_panelPropertiesBack = clone(menu_panelProperties); // NOSONAR
		if (menu_panelProperties.bDebug[1]) { console.log('Playlist Tools: creating default settings...'); }
	})();
	doOnce('Load tags cache', debounce(() => {
		if (menu_properties.bTagsCache && menu_properties.bTagsCache[1]) {
			if (typeof tagsCache !== 'undefined') { tagsCache.load(); }
		}
	}, 5000))();
	// Store for internal use
	if (menu_panelProperties.bDebug[1]) { console.log('Playlist Tools: updating settings...'); }
	for (let key in propObject) {
		if (Object.hasOwn(menu_properties, key)) {
			menu_properties[key][1] = propObject[key][1];
		}
	}
	for (let key in panelPropObject) {
		menu_panelProperties[key][1] = panelPropObject[key][1];
	}
	// Other funcs by menus
	menuFunc.forEach((obj) => {
		if (Object.hasOwn(obj, 'func') && isFunction(obj.func)) {
			obj.func(propObject);
		}
	});
}

function updateShortcutsNames(keys = {}) {
	if (_isFile(shortcutsPath)) {
		const data = _jsonParseFileCheck(shortcutsPath, 'Shortcuts json', scriptName, utf8);
		if (data) {
			if (Object.keys(keys).length) {
				const sortInputDuplic = Object.hasOwn(keys, 'sortInputDuplic') ? keys.sortInputDuplic.replace(/,/g, ', ') : null;
				const sortInputFilter = Object.hasOwn(keys, 'sortInputFilter') ? keys.sortInputFilter.replace(/,/g, ', ') : null;
				const nAllowed = Object.hasOwn(keys, 'nAllowed') ? '(' + keys.nAllowed + ')' : null;
				for (const key in data) {
					if (data[key].menu === 'Duplicates and tag filtering\\Remove duplicates by ' && sortInputDuplic) { data[key].menu += sortInputDuplic; }
					if (data[key].menu === 'Duplicates and tag filtering\\Filter playlist by ' && sortInputFilter && nAllowed) { data[key].menu += sortInputFilter + ' ' + nAllowed; }
				}
			}
			shortcuts = data; // NOSONAR
		}
	} else {
		_save(shortcutsPath, JSON.stringify(shortcuts, null, '\t').replace(/\n/g, '\r\n'));
	}
}

function createDefaultPreset(options /* name, propName, defaultPreset, defaults*/) {
	let bSave = false;
	const defaults = {
		readme: 'Default entries for ' + _q(options.name) + '.',
		[options.propName]: options.defaults
	};
	if (_isFile(options.defaultPreset)) {
		const data = _jsonParseFileCheck(options.defaultPreset, 'Shortcuts json', scriptName, utf8);
		if (data) {
			if (!compareObjects(data, defaults)) { bSave = true; }
		} else { bSave = true; }
	} else { bSave = true; }
	if (bSave) { _save(options.defaultPreset, JSON.stringify(defaults, null, '\t').replace(/\n/g, '\r\n')); }
}

function createSubMenuEditEntries(menuName, options /*{name, list, propName, defaults, defaultPreset, input, bAdd, bClone, bCopyCurrent, bImport, bDefaultFile, bUseFolders }*/) { // NOSONAR
	const subMenuSecondName = menu.newMenu('Edit entries from list', menuName);
	const optionsNames = new Set();
	const folders = {};
	const bAdd = !Object.hasOwn(options, 'bAdd') || options.bAdd;
	const bClone = bAdd && !Object.hasOwn(options, 'bClone') || options.bClone;
	const bImport = !Object.hasOwn(options, 'bImport') || options.bImport;
	options.list.forEach((entry, index) => {
		let parentMenu = subMenuSecondName;
		if (options.bUseFolders && Object.hasOwn(entry, 'folder') && entry.folder.length) {
			if (!Object.hasOwn(folders, entry.folder)) { folders[entry.folder] = menu.findOrNewMenu(entry.folder, parentMenu); }
			parentMenu = folders[entry.folder];
		}
		const id = menu.isNotSeparator(entry) && optionsNames.has(entry.name)
			? '\t' + _b('duplicated: ' + index)
			: optionsNames.add(entry.name) && ''; // Allow duplicates and mark them
		const entryName = (menu.isSeparator(entry)
			? '------(separator)------'
			: (entry.name.length > 40 ? entry.name.substring(0, 40) + ' ...' : entry.name)) + id;
		const subMenuThirdName = menu.newMenu(entryName, parentMenu);
		menu.newEntry({
			menuName: subMenuThirdName, entryText: 'Edit entry...', func: () => {
				const oriEntry = JSON.stringify(entry);
				let newEntry = oriEntry;
				try { newEntry = utils.InputBox(window.ID, 'Edit entry as JSON:', scriptName + ': ' + options.name, oriEntry, true); }
				catch (e) { return; } // eslint-disable-line no-unused-vars
				if (newEntry === oriEntry) { return; }
				if (!newEntry || !newEntry.length) { fb.ShowPopupMessage('Input: ' + newEntry + '\n\nNon valid entry.', 'JSON error'); return; }
				try { newEntry = JSON.parse(newEntry); } catch (e) { fb.ShowPopupMessage('Input: ' + newEntry.toString() + '\n\n' + e, 'JSON error'); return; }
				if (!newEntry) { return; }
				if (options.list.filter((otherEntry) => otherEntry !== entry).findIndex((otherEntry) => otherEntry.name === newEntry.name) !== -1) {
					fb.ShowPopupMessage('There is another entry with same name.\nRetry with another name.', scriptName);
					return;
				}
				options.list[index] = newEntry;
				menu_properties[options.propName][1] = JSON.stringify(options.list);
				// Presets
				if (Object.hasOwn(presets, options.propName)) {
					const presetIdxJSON = presets[options.propName].findIndex((obj) => JSON.stringify(obj) === oriEntry);
					const presetIdxName = presetIdxJSON === -1
						? presets[options.propName].findIndex((obj) => obj.name === entry.name)
						: -1;
					const presetIdx = presetIdxJSON !== -1 // Harden against manual changes since name is unique
						? presetIdxJSON
						: presetIdxName;
					if (presetIdx !== -1) {
						presets[options.propName][presetIdx] = newEntry;
						menu_properties.presets[1] = JSON.stringify(presets);
					}
				}
				overwriteMenuProperties(); // Updates panel
			}, flags: menu.isSeparator(entry) ? MF_GRAYED : MF_STRING
		});
		menu.newEntry({
			menuName: subMenuThirdName, entryText: 'Move entry...', func: () => {
				let pos = 1;
				try { pos = Number(utils.InputBox(window.ID, 'Move up X indexes (negative is down):\n', scriptName + ': ' + options.name, pos, true)); }
				catch (e) { return; } // eslint-disable-line no-unused-vars
				if (pos === 0 || !Number.isSafeInteger(pos)) { return; }
				if (index - pos < 0) { pos = 0; }
				else if (index - pos >= options.list.length) { pos = options.list.length; }
				else { pos = index - pos; }
				options.list.splice(pos, 0, options.list.splice(index, 1)[0]);
				menu_properties[options.propName][1] = JSON.stringify(options.list);
				overwriteMenuProperties(); // Updates panel
			}
		});
		if (bClone) {
			menu.newSeparator(subMenuThirdName);
			menu.newEntry({
				menuName: subMenuThirdName, entryText: 'Clone entry...', func: () => {
					// Input all variables
					let input;
					let entryName = '';
					if (menu.isNotSeparator(entry)) {
						try { entryName = utils.InputBox(window.ID, 'Enter new name for cloned menu entry:', scriptName + ': ' + options.name, '', true); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (!entryName.length) { return; }
						if (menu.isSeparator({ name: entryName })) { return; } // Add separator
						else { // or new entry
							if (options.list.findIndex((entry) => entry.name === entryName) !== -1) {
								fb.ShowPopupMessage('There is another entry with same name.\nRetry with another name.', scriptName);
								return;
							}
							input = { ...entry };
							input.name = entryName;
						}
					} else {
						input = { ...entry };
					}
					// Add entry
					options.list.push(input);
					// Save as property
					menu_properties[options.propName][1] = JSON.stringify(options.list); // And update property with new value
					// Presets
					if (!Object.hasOwn(presets, options.propName)) { presets[options.propName] = []; }
					presets[options.propName].push(input);
					menu_properties.presets[1] = JSON.stringify(presets);
					overwriteMenuProperties(); // Updates panel
				}
			});
		}
		if (bAdd && options.bCopyCurrent && menu.isNotSeparator(entry)) {
			menu.newSeparator(subMenuThirdName);
			menu.newEntry({
				menuName: subMenuThirdName, entryText: 'Update with current settings', func: () => {
					const oriEntry = JSON.stringify(entry);
					const current = options.input(true);
					if (!current) { return; }
					for (let key in current) { options.list[index][key] = current[key]; }
					menu_properties[options.propName][1] = JSON.stringify(options.list);
					// Presets
					if (Object.hasOwn(presets, options.propName)) {
						const presetIdxJSON = presets[options.propName].findIndex((obj) => JSON.stringify(obj) === oriEntry);
						const presetIdxName = presetIdxJSON === -1
							? presets[options.propName].findIndex((obj) => obj.name === entry.name)
							: -1;
						const presetIdx = presetIdxJSON !== -1 // Harden against manual changes since name is unique
							? presetIdxJSON
							: presetIdxName;
						if (presetIdx !== -1) {
							presets[options.propName][presetIdx] = options.list[index];
							menu_properties.presets[1] = JSON.stringify(presets);
						}
					}
					menu_properties.presets[1] = JSON.stringify(presets);
					overwriteMenuProperties(); // Updates panel
				}
			});
		}
		menu.newSeparator(subMenuThirdName);
		menu.newEntry({
			menuName: subMenuThirdName, entryText: 'Remove entry', func: () => {
				options.list.splice(index, 1);
				menu_properties[options.propName][1] = JSON.stringify(options.list);
				// Presets
				if (Object.hasOwn(presets, options.propName)) {
					const presetIdx = presets[options.propName].findIndex((obj) => { return JSON.stringify(obj) === JSON.stringify(entry); });
					if (presetIdx !== -1) {
						presets[options.propName].splice(presetIdx, 1);
						if (!presets[options.propName].length) { delete presets[options.propName]; }
						menu_properties['presets'][1] = JSON.stringify(presets);
					}
				}
				overwriteMenuProperties(); // Updates panel
			}
		});
	});
	if (!options.list.length) { menu.newEntry({ menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED }); }
	if (bImport || bAdd) { menu.newSeparator(subMenuSecondName); }
	if (bAdd) {
		menu.newEntry({
			menuName: subMenuSecondName, entryText: 'Add new entry to list...', func: () => {
				// Input all variables
				let input;
				let entryName = '';
				try { entryName = utils.InputBox(window.ID, 'Enter name for menu entry\nWrite \'sep\' to add a line.', scriptName + ': ' + options.name, '', true); }
				catch (e) { return; } // eslint-disable-line no-unused-vars
				if (!entryName.length) { return; }
				if (menu.isSeparator({ name: entryName })) { input = { name: entryName }; } // Add separator
				else { // or new entry
					if (options.list.findIndex((entry) => entry.name === entryName) !== -1) {
						fb.ShowPopupMessage('There is another entry with same name.\nRetry with another name.', scriptName);
						return;
					}
					const entry = options.input();
					if (!entry) { return; }
					input = { name: entryName, ...entry };
				}
				// Add entry
				options.list.push(input);
				// Save as property
				menu_properties[options.propName][1] = JSON.stringify(options.list); // And update property with new value
				// Presets
				if (!Object.hasOwn(presets, options.propName)) { presets[options.propName] = []; }
				presets[options.propName].push(input);
				menu_properties.presets[1] = JSON.stringify(presets);
				overwriteMenuProperties(); // Updates panel
			}
		});
	}
	if (bImport) {
		menu.newSeparator(subMenuSecondName);
		menu.newEntry({
			menuName: subMenuSecondName, entryText: 'Import preset...', func: () => {
				importPreset(options.defaultPreset);
			}
		});
		menu.newEntry({
			menuName: subMenuSecondName, entryText: 'Export preset...', func: () => {
				const answer = WshShell.Popup('This will export all user presets (but not the default ones) as a json file, which can be imported later in any Playlist Tools panel.\nThat file can be easily edited with a text editor to add, tune or remove entries.', 0, scriptName + ': ' + options.name, popup.question + popup.yes_no);
				if (answer === popup.yes) {
					const path = folders.data + options.propName + '_presets.json';
					_recycleFile(path, true);
					const readme = 'Backup ' + new Date().toString();
					if (_save(path, JSON.stringify({ readme, [options.propName]: presets[options.propName] }, null, '\t').replace(/\n/g, '\r\n'))) {
						_explorer(path);
						console.log('Playlist tools: presets backup saved at ' + path);
					}
				}
			}, flags: Object.hasOwn(presets, options.propName) && presets[options.propName].length > 0 ? MF_STRING : MF_GRAYED
		});
	}
	menu.newSeparator(subMenuSecondName);
	menu.newEntry({
		menuName: subMenuSecondName, entryText: 'Restore defaults...', func: () => {
			options.list = [...options.defaults];
			menu_properties[options.propName][1] = JSON.stringify(options.list);
			// Presets
			if (Object.hasOwn(presets, options.propName)) {
				delete presets[options.propName];
				menu_properties.presets[1] = JSON.stringify(presets);
			}
			overwriteMenuProperties(); // Updates panel
		}
	});
	if (options.bDefaultFile) { createDefaultPreset(options); } // Write default file
}

function importPreset(path = folders.data + 'playlistTools_presets.json') {
	let file;
	try { file = utils.InputBox(window.ID, 'Do you want to import a presets file?\nWill not overwrite current ones.\n(input path to file)', scriptName + ': ' + configMenu, path, true); }
	catch (e) { return false; } // eslint-disable-line no-unused-vars
	if (!file.length) { return false; }
	const newPresets = _jsonParseFileCheck(file, 'Presets', scriptName, utf8);
	if (!newPresets) { return false; }
	// Load description
	let readme = '';
	if (Object.hasOwn(newPresets, 'readme')) {
		readme = newPresets.readme;
		delete newPresets.readme;
	}
	// Check
	const keys = Object.keys(newPresets);
	if (keys.some((key) => !Object.hasOwn(menu_properties, key))) {
		readme += (readme.length ? '\n\n' : '');
		fb.ShowPopupMessage(
			readme +
			'Some keys are not recognized:\n\n' +
			keys.map((key) => !Object.hasOwn(menu_properties, key) ? key : null).filter(Boolean).join('\n'),
			scriptName + ': Presets (' + file.split('\\').pop() + ')'
		);
		return false;
	}
	// List entries
	const presetList = keys.map((key) =>
		'+ ' + key + ' -> ' + menu_properties[key][0] + '\n\t- ' + newPresets[key].map((preset) =>
			preset.name + (Object.hasOwn(preset, 'method') ? ' (' + preset.method + ')' : '')
		).join('\n\t- ')
	);
	readme += (readme.length ? '\n\n' : '') + 'List of presets:\n' + presetList;
	fb.ShowPopupMessage(readme, scriptName + ': Presets (' + file.split('\\').pop() + ')');
	// Accept?
	const answer = WshShell.Popup('Check the popup for description. Do you want to import it?', 0, scriptName + ': Presets (' + file.split('\\').pop() + ')', popup.question + popup.yes_no);
	if (answer === popup.no) { return false; }
	// Import
	keys.forEach((key) => {
		// Merge with current presets
		let currentMenu = JSON.parse(menu_properties[key][1]);
		if (Object.hasOwn(presets, key)) { presets[key] = [...presets[key], ...newPresets[key]]; }
		else { presets[key] = newPresets[key]; }
		currentMenu = currentMenu.concat(newPresets[key]);
		menu_properties[key][1] = JSON.stringify(currentMenu);
	});
	// Save all
	menu_properties.presets[1] = JSON.stringify(presets);
	overwriteMenuProperties(); // Updates panel
	return true;
}

function lastActionEntry() {
	const fullName = menu.lastCall.length ? menu.lastCall : null;
	let entryText = fullName ? fullName.replace(/.*\\/, '') : null;
	let flags = MF_STRING;
	if (entryText !== null) {
		// Reuse original flags
		const entry = menu.getEntries().find((entry) => entry.entryText === entryText.replace(/.*\\/, ''));
		if (entry) { flags = entry.flags; }
		// Prefer the full name if entry name is not clear enough
		if (/^by/i.test(entryText)) { entryText = fullName; }
		entryText = 'Last: ' + entryText;
	} else {
		entryText = '- No last action -';
		flags = MF_GRAYED;
	}
	return { entryText, fullName, flags };
}

/*
	Flags
*/
const flagsCache = {};
flagsCache.focus = null;
flagsCache.plsItemCount = {};
flagsCache.selItems = {};
flagsCache.getFocus = () => {
	return flagsCache.focus || (flagsCache.focus = fb.GetFocusItem(true));
}; flagsCache.getPlsItemCount = (idx) => {
	return flagsCache.plsItemCount[idx] || (flagsCache.plsItemCount[idx] = plman.PlaylistItemCount(idx));
};
flagsCache.getSelItemsCount = (idx) => {
	return flagsCache.selItems[idx] || (flagsCache.selItems[idx] = plman.GetPlaylistSelectedItems(idx).Count);
};
function focusFlags() { return (flagsCache.getFocus() ? MF_STRING : MF_GRAYED); }

function playlistCountFlags(idx = plman.ActivePlaylist) { return (flagsCache.getPlsItemCount(idx) ? MF_STRING : MF_GRAYED); }
function playlistCountFlagsRem(idx = plman.ActivePlaylist) { return (flagsCache.getPlsItemCount(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED); }
function playlistCountFlagsAddRem(idx = plman.ActivePlaylist) { return (flagsCache.getPlsItemCount(idx) && !addLock(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED); }

function multipleSelectedFlags(idx = plman.ActivePlaylist) { return (flagsCache.getSelItemsCount(idx) >= 3 ? MF_STRING : MF_GRAYED); }
function multipleSelectedFlagsReorder(idx = plman.ActivePlaylist) { return (flagsCache.getSelItemsCount(idx) >= 3 && !reorderLock(idx) ? MF_STRING : MF_GRAYED); }

function selectedFlags(idx = plman.ActivePlaylist) { return (flagsCache.getSelItemsCount(idx) ? MF_STRING : MF_GRAYED); }
function selectedFlagsReorder(idx = plman.ActivePlaylist) { return (flagsCache.getSelItemsCount(idx) && !reorderLock(idx) ? MF_STRING : MF_GRAYED); }
function selectedFlagsRem(idx = plman.ActivePlaylist) { return (flagsCache.getSelItemsCount(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED); }
function selectedFlagsAddRem(idx = plman.ActivePlaylist) { return (flagsCache.getSelItemsCount(idx) && !addLock(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED); }

// plman.ActivePlaylist must be !== -1 to avoid crashes!
flagsCache.lock = {};
flagsCache.getLock = (idx) => {
	return flagsCache.lock[idx] || (flagsCache.lock[idx] = new Set(plman.GetPlaylistLockedActions(idx) || []));
};
function reorderLock(idx = plman.ActivePlaylist) {
	return flagsCache.getLock(idx).has('ReorderItems');
}
function addLock(idx = plman.ActivePlaylist) {
	return flagsCache.getLock(idx).has('AddItems');
}
function removeLock(idx = plman.ActivePlaylist) {
	return flagsCache.getLock(idx).has('RemoveItems');
}
function closeLock(idx = plman.ActivePlaylist) {
	return flagsCache.getLock(idx).has('RemovePlaylist');
}