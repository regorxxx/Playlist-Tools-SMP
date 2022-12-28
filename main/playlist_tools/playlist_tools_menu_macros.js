﻿'use strict';
//28/12/22

// Macros
{
	const name = 'Macros';
	if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
		let menuName = menu.newMenu(name);
		const scriptPath = folders.xxx + 'helpers\\menu_xxx_macros.js';
		if (_isFile(scriptPath)){
			include(scriptPath.replace(folders.xxx  + 'main\\', '..\\'));
			readmes[newReadmeSep()] = 'sep';
			readmes[name] = folders.xxx + 'helpers\\readme\\playlist_tools_menu_macros.txt';
			// Create new properties
			const macrosDefaults = [
				{name: 'Test Tools', entry: [
					'Most played Tracks\\Most played from 2021',
					'Most played Tracks\\Most played from (all years)',
					'Top rated Tracks from...\\Top rated from 2021',
					'Select...\\Select first track',
					'Move selection to...\\To the middle',
					'Expand...\\By Artist',
					'Next\\By Artist',
					'Search same by tags...\\By Moods (=6)',
					'Select...\\Select last track',
					'Dynamic Queries...\\Same title (any artist)',
					'Select...\\Select random track',
					'Search similar by Graph...\\Random Styles/Genres mix, same Mood',
					'Select...\\Select random track',
					'Special Playlists...\\Influences from any date',
					'Duplicates and tag filtering\\Remove duplicates by title, artist, date',
					'Harmonic mix\\Harmonic mix from playlist',
					'Select...\\Select All',
					'Advanced sort...\\Incremental genre/styles (DynGenre)',
					'Advanced sort...\\Incremental key (Camelot Wheel)',
					'Scatter by tags\\Scatter acoustic tracks',
					'Playlist Revive\\Find dead items in all playlists',
					'Import track list\\Import from file (path at properties)',
					'Pools\\Top tracks mix',
					'Macros\\Report library tags errors',
					'Search by Distance\\Find genres/styles not on Graph',
					'Search by Distance\\Debug Graph (check console)'
				], bAsync: false},
				{name: 'Test Tools (with input)', entry: [
					'Top rated Tracks from...\\From year...',
					'Search same by tags...\\By... (pairs of tags)',
					'Standard Queries...\\By... (query)',
					'Select...\\Select random track',
					'Dynamic Queries...\\By... (query)',
					// 'Duplicates and tag filtering\\Filter playlist by... (tags)',
					// 'Query filtering\\Filter playlist by... (query)',
					// 'Select...\\Select All',
					// 'Sort...\\By... (expression)',
					// 'Playlist manipulation\\Find or create playlist...',
					// 'Import track list\\Import from file \\ url...',
					// 'Pools\\Custom pool...'
				], bAsync: false},
				{name: 'sep'},
				{name: 'Report library tags errors', entry: [
					'Standard Queries...\\Entire library',
					'Select...\\Select All',
					'Check tags\\Report errors by comparison'
				], bAsync: true},
				{name: 'Report all library tags', entry: [
					'Standard Queries...\\Entire library',
					'Select...\\Select All',
					'Check tags\\Report all tags by comparison'
				], bAsync: true}
			];
			// {name, entry: []}
			menu_properties['macros'] = ['Saved macros', JSON.stringify(macrosDefaults)];
			// Checks
			menu_properties['macros'].push({func: isJSON}, menu_properties['macros'][1]);
			// Menus
			menu.newEntry({menuName, entryText: 'Save and run multiple menu entries:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			menu.newCondEntry({entryText: 'Macros', condFunc: () => {
				let propMacros = JSON.parse(menu_properties['macros'][1]);
				if (!macros.length && propMacros.length) {macros = propMacros;} // Restore macros list on first init
				// List
				propMacros.forEach((macro) => {
					if (macro.name === 'sep') { // Create separators
						menu.newEntry({menuName, entryText: 'sep'});
					} else {
						const bAsync = macro.hasOwnProperty('bAsync') && macro.bAsync ? true : false;
						menu.newEntry({menuName, entryText: macro.name + (bAsync ? '\t(async)' : ''), func: () => {
							macro.entry.forEach( (entry, idx, arr) => {
								menu.btn_up(void(0), void(0), void(0), entry, void(0), void(0), void(0), {pos: 1, args: bAsync}); // Don't clear menu on last call
							});
						}});
					}
				});
				if (!propMacros.length) {menu.newEntry({menuName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
				menu.newEntry({menuName, entryText: 'sep'});
				// Save
				menu.newEntry({menuName, entryText: 'Start recording a macro' + (currListener !== null ? '\t[recording]' : ''), func: () => {
					const macro = initMacro(menu);
					if (macro && macro.name === 'sep') { // Just add a separator
						saveMacro();
						menu_properties['macros'][1] = JSON.stringify(macros);
						// Presets
						if (!presets.hasOwnProperty('macros')) {presets.macros = [];}
						presets.macros.push(macro);
						menu_properties['presets'][1] = JSON.stringify(presets);
						overwriteProperties(menu_properties); // Updates panel
					} else if (defaultArgs.parent) { // Apply animation on registered parent button...
						defaultArgs.parent.switchAnimation(menuName + '\\Recording...', true, () => {return currListener === null;});
					}
				}, flags: currListener === null ? MF_STRING : MF_GRAYED});
				menu.newEntry({menuName, entryText: 'Stop recording and Save macro', func: () => {
					const macro = saveMacro();
					if (!macro.entry.length) {
						console.popup('No actions recorded. Macro will not be saved.', scriptName + ': ' + name);
						macros.pop();
						return;
					}
					menu_properties['macros'][1] = JSON.stringify(macros);
					// Presets
					if (!presets.hasOwnProperty('macros')) {presets.macros = [];}
					presets.macros.push(macro);
					menu_properties['presets'][1] = JSON.stringify(presets);
					overwriteProperties(menu_properties); // Updates panel
				}, flags: currListener !== null ? MF_STRING : MF_GRAYED});
				menu.newEntry({menuName, entryText: 'sep'});
				{	// Add / Remove
					createSubMenuEditEntries(menuName, {
						name,
						list: propMacros, 
						propName: 'macros', 
						defaults: macrosDefaults, 
						defaultPreset: null,
						input: null,
						bAdd: false,
						bImport: false
					});
				}
			}});
		}
		menu.newEntry({entryText: 'sep'});
	} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}