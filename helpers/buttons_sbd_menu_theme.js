﻿'use strict';
//06/10/22

include('menu_xxx.js');
include('helpers_xxx.js');
include('helpers_xxx_file.js');
include('helpers_xxx_tags.js');

const themeMenu = new _menu();

function createThemeMenu(parent) {
	themeMenu.clear(true); // Reset on every call
	const files = findRecursivefile('*.json', [folders.xxx + 'presets\\Search by\\themes']);
	const properties = parent.buttonsProperties;
	const data = JSON.parse(properties.data[1]);
	const testRegex = /test_.*|int_.*/i;
	// Recipe forced theme?
	let bHasForcedTheme = false;
	let forcedTheme = null;
	let forcedThemePath = '';
	if (properties.recipe[1].length) {
		const recipe = _isFile(properties.recipe[1]) ? _jsonParseFileCheck(properties.recipe[1], 'Recipe json', 'Search by distance', utf8) : _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\recipes\\' + properties.recipe[1], 'Recipe json', 'Search by distance', utf8);
		bHasForcedTheme = recipe && recipe.hasOwnProperty('theme');
		if (bHasForcedTheme) {
			if (_isFile(recipe.theme)) {forcedTheme = _jsonParseFileCheck(recipe.theme, 'Theme json', 'Search by distance', utf8); forcedThemePath = recipe.theme;}
			else if (_isFile(folders.xxx + 'presets\\Search by\\themes\\' + recipe.theme)) {
				forcedThemePath = folders.xxx + 'presets\\Search by\\themes\\' + recipe.theme;
				forcedTheme = _jsonParseFileCheck(forcedThemePath, 'Theme json', 'Search by distance', utf8);
			} else {console.log('Forced theme json file (by recipe) not found: ' + recipe.theme); fb.ShowPopupMessage('Forced theme json file (by recipe) not found:\n' + recipe.theme, 'Search by distance');}
		}
	}
	// Header
	themeMenu.newEntry({entryText: 'Set theme file: (Shift + Click to hide)', func: null, flags: MF_GRAYED});
	themeMenu.newEntry({entryText: 'sep'});
	// Create theme
	themeMenu.newEntry({entryText: 'Create theme file with selected track', func: () => {
		// Tag names
		const genreTag = properties.genreTag[1].split(',').filter(Boolean);
		const styleTag = properties.styleTag[1].split(',').filter(Boolean);
		const moodTag = properties.moodTag[1].split(',').filter(Boolean);
		const dateTag = properties.dateTag[1].split(',').filter(Boolean); // only allows 1 value, but put it into an array
		const keyTag = properties.keyTag[1].split(',').filter(Boolean); // only allows 1 value, but put it into an array
		const bpmTag = properties.bpmTag[1].split(',').filter(Boolean); // only allows 1 value, but put it into an array
		const composerTag = properties.composerTag[1].split(',').filter(Boolean);
		const customStrTag = properties.customStrTag[1].split(',').filter(Boolean);
		const customNumTag = properties.customNumTag[1].split(',').filter(Boolean); // only allows 1 value, but put it into an array
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
		try {input = utils.InputBox(window.ID, 'Enter theme name', 'Search by distance', 'my theme', true);}
		catch (e) {return;}
		if (!input.length) {return;}
		const theme = {name: input, tags: []};
		theme.tags.push({genre, style, mood, key, date, bpm, composer, customStr, customNum});
		const filePath = folders.xxx + 'presets\\Search by\\themes\\' + input + '.json';
		if (_isFile(filePath) && WshShell.Popup('Already exists a file with such name, overwrite?', 0, window.Name, popup.question + popup.yes_no) === popup.no) {return;}
		const bDone = _save(filePath, JSON.stringify(theme, null, '\t'));
		if (!bDone) {fb.ShowPopupMessage('Error saving theme file:' + filePath, 'Search by distance'); return;}
		else {_explorer(filePath);}
	}, flags: fb.GetFocusItem(true) ? MF_STRING : MF_GRAYED});
	{	// Theme tools
		const menuName = themeMenu.newMenu('More options...');
		{	// Readme
			const readmePath = folders.xxx + 'helpers\\readme\\search_bydistance_recipes_themes.txt';
			themeMenu.newEntry({menuName, entryText: 'Open readme...', func: () => {
				const readme = _open(readmePath, utf8); // Executed on script load
				if (readme.length) {fb.ShowPopupMessage(readme, window.Name);}
				else {console.log('Readme not found: ' + value);}
			}});
		}
		themeMenu.newEntry({menuName, entryText: 'Open themes folder', func: () => {
			if (_isFile(properties.theme[1])) {_explorer(properties.theme[1]);} // Open current file
			else {_explorer(folders.xxx + 'presets\\Search by\\themes');} // or folder
		}});
		const hiddenFilesNum = files.reduce((total, file) => {const attr = _parseAttrFile(file); return attr && attr.Hidden ? total + 1 : total;}, 0);
		themeMenu.newEntry({menuName, entryText: 'Unhide all themes\t' + _b(hiddenFilesNum + ' files'), func: () => {
			const hiddenFiles = files.filter((file) => {const attr = _parseAttrFile(file); return attr && attr.Hidden;});
			hiddenFiles.forEach((file) => {
				if (!testRegex.test(file.split('\\').pop())) {
					if (_runCmd('attrib -H ' + _q(file), false)) {console.log('Unhide: '+ file);}
				}
			});
		}, flags: hiddenFilesNum ? MF_STRING : MF_GRAYED});
	}
	themeMenu.newEntry({entryText: 'sep'});
	themeMenu.newEntry({entryText: 'None', func: () => {
		properties.theme[1] = '';
		data.theme = 'None';
		properties.data[1] = JSON.stringify(data);
		overwriteProperties(properties);
	}, flags: !bHasForcedTheme ? MF_STRING : MF_GRAYED});
	themeMenu.newEntry({entryText: 'sep'});
	// All entries
	const tagsToCheck = ['genre', 'style', 'mood', 'key', 'date', 'bpm', 'composer', 'customStr', 'customNum'];
	// List
	const options = [];
	files.forEach((file) => {
		// Omit hidden files
		const attr = _parseAttrFile(file);
		if (attr && attr.Hidden) {return;}
		const theme = _jsonParseFileCheck(file, 'Theme json', 'Search by distance', utf8);
		if (!theme) {return;}
		// Check
		const tagCheck = theme.hasOwnProperty('tags') ? theme.tags.findIndex((tagArr) => {return !isArrayEqual(Object.keys(tagArr), tagsToCheck);}) : 0;
		const bCheck = theme.hasOwnProperty('name') && tagCheck === -1;
		if (!bCheck) {
			console.log('File is not a valid theme: ' + (theme.hasOwnProperty('tags') && tagCheck !== -1 ? [...new Set(tagsToCheck).difference(new Set(Object.keys(theme.tags[tagCheck])))] : file));
			return;
		}
		// List files, with full path or relative path (portable)
		options.push(_isFile(fb.FoobarPath + 'portable_mode_enabled') && file.indexOf(fb.ProfilePath) !== -1 ? (fb.ProfilePath.indexOf('profile') !== -1 ? file.replace(fb.ProfilePath,'.\\profile\\') : file.replace(fb.ProfilePath,'.\\')): file);
	});
	const menus = [];
	options.forEach((file) => {
		const theme = _jsonParseFileCheck(file, 'Theme json', 'Search by distance', utf8);
		if (!theme) {return;}
		const bIsForcedTheme = forcedTheme && forcedThemePath === file;
		const name = theme.name + (bIsForcedTheme ? ' (forced by recipe)' : ''); // Recipe may overwrite theme
		let i = 1;
		const duplIdx = menus.indexOf(theme.name);
		const entryText = name + (duplIdx === -1 ? '' : ' (' + ++i + ')');
		menus.push(entryText);
		themeMenu.newEntry({entryText, func: () => {
			if (utils.IsKeyPressed(VK_SHIFT)) {
				_runCmd('attrib +H ' + _q(file), false);
				if (properties.theme[1] === file) { // Set to none when hiding current recipe
					properties.theme[1] = '';
					data.theme = 'None';
					properties.data[1] = JSON.stringify(data);
					overwriteProperties(properties);
				}
			} else {
				properties.theme[1] = file;
				data.theme = theme.name;
				properties.data[1] = JSON.stringify(data);
				overwriteProperties(properties);
			}
		}, flags: !bHasForcedTheme ? MF_STRING : MF_GRAYED});
	});
	themeMenu.newCheckMenu(themeMenu.getMainMenuName(), 'None', menus.length ? menus[menus.length - 1] : 'None', () => {
		const idx = options.indexOf(forcedTheme ? forcedThemePath : properties.theme[1]);
		return idx !== -1 ? idx + 1 : 0;
	});
	return themeMenu;
}