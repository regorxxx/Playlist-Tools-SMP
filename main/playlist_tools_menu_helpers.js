﻿'use strict';
//16/10/22

/*
	Helpers
*/
function overwriteMenuProperties() {overwriteProp(menu_properties, menu_prefix); overwriteDefaultArgs();}
function overwritePanelProperties() {overwriteProp(menu_panelProperties, menu_prefix_panel); overwriteDefaultArgs();}
function overwriteProp(properties, prefix) {setProperties(properties, prefix, 0, false, true);}
function overwriteDefaultArgs() {
	for (let key in defaultArgs) {
		if (menu_properties.hasOwnProperty(key)) {
			if (key === 'styleGenreTag') {defaultArgs[key] = JSON.parse(menu_properties[key][1]);}
			else {defaultArgs[key] = menu_properties[key][1];}
		} else if (menu_panelProperties.hasOwnProperty(key)) {
			defaultArgs[key] = menu_panelProperties[key][1];
		}
	}
}

function loadProperties() {
	if (typeof buttonsBar === 'undefined' && Object.keys(menu_properties).length) { // Merge all properties when not loaded along buttons
		// With const var creating new properties is needed, instead of reassigning using A = {...A,...B}
		if (Object.keys(menu_panelProperties).length) {
			Object.entries(menu_panelProperties).forEach(([key, value]) => {menu_properties[key] = value;});
		}
		setProperties(menu_properties, menu_prefix, 0);
		updateMenuProperties(getPropertiesPairs(menu_properties, menu_prefix, 0));
	} else { // With buttons, set these properties only once per panel
		if (Object.keys(menu_panelProperties).length) {
			setProperties(menu_panelProperties, menu_prefix_panel, 0);
		}
	}
}

function updateMenuProperties(propObject, menuFunc = deferFunc) {
	// Sanity checks
	propObject['playlistLength'][1] = Number(propObject['playlistLength'][1]);
	if (!Number.isSafeInteger(propObject['playlistLength'][1]) || propObject['playlistLength'][1] <= 0) {fb.ShowPopupMessage('Playlist length must be a positive integer.\n' + propObject['playlistLength'].slice(0,2), scriptName);}
	try {fb.GetQueryItems(new FbMetadbHandleList(), propObject['forcedQuery'][1]);}
	catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + propObject['forcedQuery'], scriptName);}
	// Info Popup
	let panelPropObject = (typeof buttonsBar !== 'undefined') ? getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0) : propObject;
	if (!panelPropObject['firstPopup'][1]) {
		panelPropObject['firstPopup'][1] = true;
		overwriteProperties(panelPropObject); // Updates panel
		const readmeKeys = ['Playlist Tools Menu', 'Macros', 'Tagging requisites']; // Must read files on first execution
		readmeKeys.forEach( (key) => {
			const readmePath = readmes[key];
			const readme = _open(readmePath, utf8);
			if (readme.length) {fb.ShowPopupMessage(readme, key);}
		});
	}
	// And update
	Object.entries(panelPropObject).forEach(([key, value]) => {
		if (defaultArgs.hasOwnProperty(key)) {defaultArgs[key] = value[1];}
	});
	Object.entries(propObject).forEach(([key, value]) => {
		if (defaultArgs.hasOwnProperty(key)) {defaultArgs[key] = value[1];}
		// if (menu_properties.hasOwnProperty(key)) {menu_properties[key] = value;}
		// if (menu_panelProperties.hasOwnProperty(key)) {menu_panelProperties[key] = value;}
			// Specific
		if (key === 'ratingLimits') {defaultArgs[key] = defaultArgs[key].split(',');}
		if (key === 'styleGenreTag') {defaultArgs[key] = JSON.parse(defaultArgs[key]);}
	});
	if (propObject.hasOwnProperty('sortInputDuplic') && propObject.hasOwnProperty('sortInputFilter') && propObject.hasOwnProperty('nAllowed')) {
		updateShortcutsNames({sortInputDuplic: propObject.sortInputDuplic[1], sortInputFilter: propObject.sortInputFilter[1], nAllowed: propObject.nAllowed[1]});
	}
	// Presets
	presets = JSON.parse(propObject['presets'][1]);
	// Backup defaults
	doOnce('Backup', () => {
		menu_propertiesBack = clone(menu_properties); 
		menu_panelPropertiesBack = clone(menu_panelProperties); 
		if (menu_panelProperties.bDebug[1]) {console.log('Playlist Tools: creating default settings...');}
	})();
	doOnce('Load tags cache', debounce(() => {
		if (menu_properties.bTagsCache[1] && typeof tagsCache !== 'undefined') {tagsCache.load();}
	}, 5000))();
	// Store for internal use
	if (menu_panelProperties.bDebug[1]) {console.log('Playlist Tools: updating settings...');}
	for (let key in propObject) {
		menu_properties[key][1] = propObject[key][1];
	}
	for (let key in panelPropObject) {
		menu_panelProperties[key][1] = panelPropObject[key][1];
	}
	// Other funcs by menus
	menuFunc.forEach((obj) => {
		if (obj.hasOwnProperty('func') && isFunction(obj.func)) {
			obj.func(propObject);
		}
	});
}

function updateShortcutsNames(keys = {}) {
	if (_isFile(shortcutsPath)) {
		const data = _jsonParseFileCheck(shortcutsPath, 'Shortcuts json', scriptName, utf8);
		if (data) {
			if (Object.keys(keys).length) {
				const sortInputDuplic = keys.hasOwnProperty('sortInputDuplic') ? keys.sortInputDuplic.replace(/,/g, ', ') : null;
				const sortInputFilter = keys.hasOwnProperty('sortInputFilter') ? keys.sortInputFilter.replace(/,/g, ', ') : null;
				const nAllowed = keys.hasOwnProperty('nAllowed') ? '(' + keys.nAllowed + ')' : null;
				for (const key in data) {
					if (data[key].menu === 'Duplicates and tag filtering\\Remove duplicates by ' && sortInputDuplic) {data[key].menu += sortInputDuplic;}
					if (data[key].menu === 'Duplicates and tag filtering\\Filter playlist by ' && sortInputFilter && nAllowed) {data[key].menu += sortInputFilter + ' ' + nAllowed;}
				}
			}
			shortcuts = data;
		}
	} else {
		_save(shortcutsPath, JSON.stringify(shortcuts, null, '\t'));
	}
}

function createSubMenuEditEntries(menuName, options /*{name, list, propName:, defaults, defaultPreset, input, bAdd, bImport}*/) {
	const subMenuSecondName = menu.newMenu('Edit entries from list...' + nextId('invisible', true, false), menuName);
	options.list.forEach( (entry, index) => {
		const entryName = (entry.name === 'sep' ? '------(separator)------' : (entry.name.length > 40 ? entry.name.substring(0,40) + ' ...' : entry.name));
		const subMenuThirdName = menu.newMenu(entryName + nextId('invisible', true, false), subMenuSecondName);
		menu.newEntry({menuName: subMenuThirdName, entryText: 'Edit entry...', func: () => {
			const oriEntry = JSON.stringify(entry);
			let newEntry = oriEntry;
			try {newEntry = utils.InputBox(window.ID, 'Edit entry as JSON:', scriptName + ': ' + options.name, oriEntry, true);}
			catch (e) {return;}
			if (newEntry === oriEntry) {return;}
			if (!newEntry || !newEntry.length) {fb.ShowPopupMessage('Input: ' + newEntry + '\n\nNon valid entry.', 'JSON error'); return;}
			try {newEntry = JSON.parse(newEntry);} catch (e) {fb.ShowPopupMessage('Input: ' + newEntry.toString() + '\n\n' + e, 'JSON error'); return;}
			if (!newEntry) {return;}
			options.list[index] = newEntry;
			menu_properties[options.propName][1] = JSON.stringify(options.list);
			// Presets
			if (presets.hasOwnProperty(options.propName)) {
				presetIdx = presets[options.propName].findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(oriEntry);});
				if (presetIdx !== -1) {
					presets[options.propName][presetIdx] = newEntry;
					menu_properties.presets[1] = JSON.stringify(presets);
				}
			}
			overwriteMenuProperties(); // Updates panel
		}});
		menu.newEntry({menuName: subMenuThirdName, entryText: 'Move entry...', func: () => {
			let pos = 1;
			try {pos = Number(utils.InputBox(window.ID, 'Move up X indexes (negative is down):\n', scriptName + ': ' + options.name, pos, true));} 
			catch (e) {return;}
			if (pos === 0 || !Number.isSafeInteger(pos)) {return;}
			if (index - pos < 0) {pos = 0;}
			else if (index - pos >= options.list.length) {pos = options.list.length;}
			else {pos = index - pos;}
			options.list.splice(pos, 0, options.list.splice(index, 1)[0]);
			menu_properties[options.propName][1] = JSON.stringify(options.list);
			overwriteMenuProperties(); // Updates panel
		}});
		menu.newEntry({menuName: subMenuThirdName, entryText: 'sep'});
		menu.newEntry({menuName: subMenuThirdName, entryText: 'Remove entry', func: () => {
			options.list.splice(index, 1);
			menu_properties[options.propName][1] = JSON.stringify(options.list);
			// Presets
			if (presets.hasOwnProperty(options.propName)) {
				const presetIdx = presets[options.propName].findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(entry);});
				if (presetIdx !== -1) {
					presets[options.propName].splice(presetIdx, 1);
					if (!presets[options.propName].length) {delete presets[options.propName];}
					menu_properties['presets'][1] = JSON.stringify(presets);
				}
			}
			overwriteMenuProperties(); // Updates panel
		}});
	});
	if (!options.list.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
	menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
	if (!options.hasOwnProperty('bAdd') || options.bAdd) {
		menu.newEntry({menuName: subMenuSecondName, entryText: 'Add new entry to list...' , func: () => {
			// Input all variables
			let input;
			let entryName = '';
			try {entryName = utils.InputBox(window.ID, 'Enter name for menu entry\nWrite \'sep\' to add a line.', scriptName + ': ' + options.name, '', true);}
			catch (e) {return;}
			if (!entryName.length) {return;}
			if (entryName === 'sep') {input = {name: entryName};} // Add separator
			else { // or new entry
				const entry = options.input();
				if (!entry) {return;}
				input = {name: entryName, ...entry}
			}
			// Add entry
			options.list.push(input);
			// Save as property
			menu_properties[options.propName][1] = JSON.stringify(options.list); // And update property with new value
			// Presets
			if (!presets.hasOwnProperty(options.propName)) {presets[options.propName] = [];}
			presets[options.propName].push(input);
			menu_properties.presets[1] = JSON.stringify(presets);
			overwriteMenuProperties(); // Updates panel
		}});
	}
	if (!options.hasOwnProperty('bImport') || options.bImport) {
		menu.newEntry({menuName: subMenuSecondName, entryText: 'Import preset...', func: () => {
			importPreset(options.defaultPreset);
		}});
	}
	menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
		options.list = [...options.defaults];
		menu_properties[options.propName][1] = JSON.stringify(options.list);
		// Presets
		if (presets.hasOwnProperty(options.propName)) {
			delete presets[options.propName];
			menu_properties.presets[1] = JSON.stringify(presets);
		}
		overwriteMenuProperties(); // Updates panel
	}});
}

function importPreset(path = folders.data + 'playlistTools_presets.json') {
	let file;
	try {file = utils.InputBox(window.ID, 'Do you want to import a presets file?\nWill not overwrite current ones.\n(input path to file)', scriptName + ': ' + configMenu, path, true);}
	catch (e) {return false;}
	if (!file.length) {return false;}
	const newPresets = _jsonParseFileCheck(file, 'Presets', scriptName, utf8);
	if (!newPresets) {return false;}
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
	if (answer === popup.no) {return false;}
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
	menu_properties.presets[1] = JSON.stringify(presets);
	overwriteMenuProperties(); // Updates panel
	return true;
}

/* 
	Flags
*/

function focusFlags() {return (fb.GetFocusItem(true) ? MF_STRING : MF_GRAYED);}

function playlistCountFlags(idx = plman.ActivePlaylist) {return (plman.PlaylistItemCount(idx) ? MF_STRING : MF_GRAYED);}
function playlistCountFlagsRem(idx = plman.ActivePlaylist) {return (plman.PlaylistItemCount(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED);}
function playlistCountFlagsAddRem(idx = plman.ActivePlaylist) {return (plman.PlaylistItemCount(idx) && !addLock(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED);}

function multipleSelectedFlags(idx = plman.ActivePlaylist) {return (plman.GetPlaylistSelectedItems(idx).Count >= 3 ? MF_STRING : MF_GRAYED);}
function multipleSelectedFlagsReorder(idx = plman.ActivePlaylist) {return (plman.GetPlaylistSelectedItems(idx).Count >= 3 && !reorderLock(idx) ? MF_STRING : MF_GRAYED);}

function selectedFlags(idx = plman.ActivePlaylist) {return (plman.GetPlaylistSelectedItems(idx).Count ? MF_STRING : MF_GRAYED);}
function selectedFlagsReorder(idx = plman.ActivePlaylist) {return (plman.GetPlaylistSelectedItems(idx).Count  && !reorderLock(idx) ? MF_STRING : MF_GRAYED);}
function selectedFlagsRem(idx = plman.ActivePlaylist) {return (plman.GetPlaylistSelectedItems(idx).Count && !removeLock(idx) ? MF_STRING : MF_GRAYED);}
function selectedFlagsAddRem(idx = plman.ActivePlaylist) {return (plman.GetPlaylistSelectedItems(idx).Count  && !addLock(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED);}

// plman.ActivePlaylist must be !== -1 to avoid crashes!
function reorderLock(idx = plman.ActivePlaylist) {return plman.GetPlaylistLockedActions(idx).indexOf('ReorderItems') !== -1;}
function addLock(idx = plman.ActivePlaylist) {return plman.GetPlaylistLockedActions(idx).indexOf('AddItems') !== -1;}
function removeLock(idx = plman.ActivePlaylist) {return plman.GetPlaylistLockedActions(idx).indexOf('RemoveItems') !== -1;}