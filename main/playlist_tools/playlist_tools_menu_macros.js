'use strict';
//17/06/25

/* global menusEnabled:readable, readmes:readable, menu:readable, menu_properties:readable, scriptName:readable, overwriteMenuProperties:readable, defaultArgs:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, createSubMenuEditEntries:readable, newReadmeSep:readable , presets:readable */

/* global MF_GRAYED:readable, folders:readable, _isFile:readable, isJSON:readable, MF_STRING:readable */

// Macros
{
	const name = 'Macros';
	if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name] === true) {
		const scriptPath = folders.xxx + 'helpers\\menu_xxx_macros.js';
		/* global _Macros:readable */
		if (_isFile(scriptPath)){
			let menuName = menu.newMenu(name);
			include(scriptPath.replace(folders.xxx  + 'main\\', '..\\'));
			const Macros = menu.Macros = new _Macros(menu, {prefixMenu: name});
			readmes[newReadmeSep()] = 'sep';
			readmes[name] = folders.xxx + 'helpers\\readme\\playlist_tools_menu_macros.txt';
			// Create new properties
			const thisYear = (new Date()).getFullYear() - 1;
			const macrosDefaults = [
				{name: 'Test Tools', entry: [
					'Most played Tracks at\\Most played at ' + thisYear,
					'Most played Tracks at\\Most played (all years)',
					'Top played Tracks from\\Top played from ' + thisYear,
					'Top rated Tracks from\\Top rated from ' + thisYear,
					'Select (# tracks)\\Select first track',
					'Move selection to\\To the middle',
					'Expand\\By Artist',
					'Next\\By Artist',
					'Search same by tags\\By Moods (=6)',
					'Select (# tracks)\\Select last track',
					'Dynamic Queries\\Same title (any artist)',
					'Select (# tracks)\\Select random track',
					'Select (# tracks)\\Select random track',
					'Special Playlists\\Influences from any date',
					'Duplicates and tag filtering\\Remove duplicates by title, %album artist%, year',
					'Duplicates and tag filtering\\Remove duplicates by title, artist, year',
					'Query filtering\\Filter playlist by Rating ≥3',
					'Harmonic mix\\Harmonic mix from playlist',
					'Select (# tracks)\\Select All',
					'Advanced sort\\Incremental genre/styles (DynGenre)',
					'Advanced sort\\Incremental key (Camelot Wheel)',
					'Scatter by tags\\Scatter acoustic tracks',
					'Intercalate by tags\\Intercalate same artist tracks',
					'Shuffle by tags\\Shuffle by artist',
					'Group by tags\\Group by artist',
					'Select (# tracks)\\Select random track',
					'Next\\By Date',
					'Move selection to\\To the middle',
					'Select by query\\Select by Rating ≥3',
					'Select (# tracks)\\Select random track',
					'Expand\\By Artist',
					'Select (# tracks)\\Select random track',
					'Next\\By Artist',
					'Playlist Revive\\Find dead items in all playlists',
					'Import track list\\Import from custom path',
					'Pools\\Top tracks mix',
					'Macros\\Report library tags errors',
					'Search by Distance\\Find genres/styles not on Graph',
					'Search by Distance\\Debug Graph (check console)'
				], bAsync: false},
				{name: 'Test Tools (with input)', entry: [
					'Most played Tracks at\\At year...',
					'Most played Tracks at\\Since last...',
					'Top played Tracks from\\from year...',
					'Top rated Tracks from\\From year...',
					'Search same by tags\\By... (pairs of tags)',
					'Standard Queries\\By... (query)',
					'Select (# tracks)\\Select random track',
					'Dynamic Queries\\By... (query)',
					'Duplicates and tag filtering\\Filter playlist by... (tags)',
					'Query filtering\\Filter playlist by... (query)',
					'Select (# tracks)\\Select All',
					'Sort\\By... (expression)',
					'Scatter by tags\\By... (tag-value)',
					'Intercalate by tags\\By... (tag)',
					'Shuffle by tags\\By... (tag)',
					'Group by tags\\By... (tag)',
					'Select by query\\Select by... (query)',
					'Select (# tracks)\\Select random track',
					'Expand\\By... (tags)',
					'Select (# tracks)\\Select random track',
					'Next\\By... (tags)',
					'Playlist manipulation\\Find or create playlist...',
					'Import track list\\Import from file \\ url...',
					'Pools\\Custom pool...'
				], bAsync: false},
				{name: 'sep'},
				{name: 'Report library tags errors', entry: [
					'Standard Queries\\Entire library',
					'Select (# tracks)\\Select All',
					'Check tags\\Report errors by comparison'
				], bAsync: true},
				{name: 'Report all library tags', entry: [
					'Standard Queries\\Entire library',
					'Select (# tracks)\\Select All',
					'Check tags\\Report all tags by comparison'
				], bAsync: true}
			];
			// {name, entry: []}
			menu_properties['macros'] = ['Saved macros', JSON.stringify(macrosDefaults)];
			// Checks
			menu_properties['macros'].push({func: isJSON}, menu_properties['macros'][1]);
			// Menus
			menu.newEntry({menuName, entryText: 'Save and run multiple menu entries:', flags: MF_GRAYED});
			menu.newSeparator(menuName);
			menu.newCondEntry({entryText: 'Macros', condFunc: () => {
				const propMacros = JSON.parse(menu_properties['macros'][1]);
				// List
				const entryNames = new Set();
				propMacros.forEach((macro) => {
					if (menu.isSeparator(macro)) { // Create separators
						menu.newSeparator(menuName);
					} else {
						let macroName = macro.name || '';
						macroName = macroName.length > 40 ? macroName.substring(0,40) + ' ...' : macroName;
						if (entryNames.has(macroName)) {
							fb.ShowPopupMessage('There is an entry with duplicated name:\t' + macroName + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(macro, null, '\t'), scriptName + ': ' + name);
							return;
						} else {entryNames.add(macroName);}
						const bAsync = Object.hasOwn(macro, 'bAsync') && macro.bAsync;
						menu.newEntry({menuName, entryText: macroName + (bAsync ? '\t(async)' : ''), func: () => {
							Macros.run(macro);
						}});
					}
				});
				if (!propMacros.length) {menu.newEntry({menuName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
				menu.newSeparator(menuName);
				// Save
				menu.newEntry({menuName, entryText: 'Start recording a macro' + (Macros.isRecording()  ? '\t[recording]' : ''), func: () => {
					Macros.set(propMacros); // There is no need for updating the list, but doing this ensures names are not duplicated
					const macro = Macros.record();
					if (menu.isSeparator(macro)) { // Just add a separator
						Macros.save();
						menu_properties['macros'][1] = JSON.stringify(Macros.get());
						// Presets
						if (!Object.hasOwn(presets, 'macros')) {presets.macros = [];}
						presets.macros.push(macro);
						menu_properties['presets'][1] = JSON.stringify(presets);
						overwriteMenuProperties(); // Updates panel
					} else if (defaultArgs.parent) { // Apply animation on registered parent button...
						defaultArgs.parent.switchAnimation(menuName + '\\Recording...', true, () => {return !Macros.isRecording();});
					}
				}, flags: !Macros.isRecording() ? MF_STRING : MF_GRAYED});
				menu.newEntry({menuName, entryText: 'Stop recording and Save macro', func: () => {
					const macro = Macros.save();
					if (!macro) {console.popup('No actions recorded. Macro will not be saved.', scriptName + ': ' + name); return;}
					menu_properties['macros'][1] = JSON.stringify(Macros.get());
					// Presets
					if (!Object.hasOwn(presets, 'macros')) {presets.macros = [];}
					presets.macros.push(macro);
					menu_properties['presets'][1] = JSON.stringify(presets);
					overwriteMenuProperties(); // Updates panel
				}, flags: Macros.isRecording() ? MF_STRING : MF_GRAYED});
				menu.newSeparator(menuName);
				{	// Add / Remove
					createSubMenuEditEntries(menuName, {
						name,
						list: propMacros,
						propName: 'macros',
						defaults: macrosDefaults,
						defaultPreset: null,
						input: null,
						bAdd: false,
						bImport: false,
						bClone: true
					});
				}
			}});
			menu.newSeparator();
		}
	} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++, bIsMenu: true});} // NOSONAR
}