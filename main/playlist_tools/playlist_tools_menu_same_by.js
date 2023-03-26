'use strict';
//25/03/23

// Same by...
{
	const scriptPath = folders.xxx + 'main\\search\\search_same_by.js';
	if (_isFile(scriptPath)){
		const name = 'Search same by tags...';
		if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
			include(scriptPath.replace(folders.xxx  + 'main\\', '..\\'));
			readmes[newReadmeSep()] = 'sep';
			readmes[name] = folders.xxx + 'helpers\\readme\\search_same_by_tags_combinations.txt';
			forcedQueryMenusEnabled[name] = true;
			const menuName = menu.newMenu(name);
			{	// Dynamic menu
				let sameByQueries = [
					{args: {sameBy: {mood: 6}}}, {args: {sameBy: {genre: 2}}}, {args: {sameBy: {style: 2}}},
					{args: {sameBy: {composer: 2}}}, {args: {sameBy: {key: 1}}},
					{name: 'sep'},
					{args: {sameBy: {style: 2, mood: 6}}}, {args: {sameBy: {style: 2, date: 10}}},
				];
				let selArg = {...sameByQueries[0]};
				const sameByQueriesDefaults = [...sameByQueries];
				// Create new properties with previous args
				menu_properties['sameByQueries'] = [name + ' queries', JSON.stringify(sameByQueries)];
				menu_properties['sameByCustomArg'] = [name + ' Dynamic menu custom args', convertObjectToString(selArg.args.sameBy)];
				// Checks
				menu_properties['sameByQueries'].push({func: isJSON}, menu_properties['sameByQueries'][1]);
				menu_properties['sameByCustomArg'].push({func: isString}, menu_properties['sameByCustomArg'][1]);
				// Helpers
				const inputSameByQuery = () => {
					let input = '';
					try {input = utils.InputBox(window.ID, 'Enter pairs of \'tag, number of matches\', separated by comma.\n', scriptName + ': ' + name, convertObjectToString(selArg.args.sameBy, ','), true);}
					catch (e) {return;}
					if (!input.length) {return;}
					if (input.indexOf(',') === -1) {return;}
					if (input.indexOf(';') !== -1) {return;}
					let logic = 'AND';
					try {logic = utils.InputBox(window.ID, 'Enter logical operator to combine queries for each different tag.\n', scriptName + ': ' + name, logic, true);}
					catch (e) {return;}
					if (!logic.length) {return;}
					let remap;
					try {remap = utils.InputBox(window.ID, 'Remap tags to apply the same query to both.\nEnter \'mainTagA,toTag,...;mainTagB,...\'\nSeparated by \',\' and \';\'.\n', scriptName + ': ' + name, '', true);}
					catch (e) {return;}
					let bOnlyRemap = false;
					if (remap.length) {
						const answer = WshShell.Popup('Instead of applying the same query remapped tags, the original tag may be remapped to the desired track. Forcing that Tag B should match TagA.\nFor example: Finds tracks where involved people matches artist from selection', 0, scriptName + ': ' + name, popup.question + popup.yes_no);
						if (answer === popup.yes) {bOnlyRemap = true;}
					}
					input = {args: {sameBy: convertStringToObject(input, 'number', ','), logic, remapTags: remap.length ? convertStringToObject(remap, 'string', ',', ';') : {}, bOnlyRemap}};
					// Final check
					const sel = fb.GetFocusItem();
					if (sel) {
						const selInfo = sel.GetFileInfo();
						if (!Object.keys(input.args.sameBy).every((key) => {return selInfo.MetaFind(key) === -1})) {
							try {if (!searchSameByCombs({...input.args, bSendToPls: false})) {throw 'error';}}
							catch (e) {fb.ShowPopupMessage('Arguments not valid, check them and try again:\n' + JSON.stringify(input), scriptName); return;}
						}
					}
					return input;
				}
				// Menus
				menu.newEntry({menuName, entryText: 'Based on Queries matching minimum (X) tags:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName, entryText: 'sep'});
				menu.newCondEntry({entryText: 'Search same by tags... (cond)', condFunc: () => {
					// Entry list
					sameByQueries = JSON.parse(menu_properties['sameByQueries'][1]);
					const entryNames = new Set();
					sameByQueries.forEach((queryObj) => {
						// Add separators
						if (queryObj.hasOwnProperty('name') && queryObj.name === 'sep') {
							let entryMenuName = queryObj.hasOwnProperty('menu') ? queryObj.menu : menuName;
							menu.newEntry({menuName: entryMenuName, entryText: 'sep'});
						} else { 
							// Create names for all entries
							let queryName = queryObj.name || '';
							if (!queryName.length) {
								Object.keys(queryObj.args.sameBy).forEach((key, index, array) => {
									queryName += (!queryName.length ? '' : index !== array.length - 1 ? ', ' : ' and ');
									queryName += capitalize(key) + (queryObj.args.sameBy[key] > 1 ? 's' : '') + ' (=' + queryObj.args.sameBy[key] + ')';
									});
							} else {queryName = queryObj.name;}
							queryName = queryName.length > 40 ? queryName.substring(0,40) + ' ...' : queryName;
							queryObj.name = queryName;
							if (entryNames.has(queryName)) {
								fb.ShowPopupMessage('There is an entry with duplicated name:\t' + queryName + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(queryObj, null, '\t'), scriptName + ': ' + name);
								return;
							} else {entryNames.add(queryName);}
							// Entries
							const sameByArgs = {...queryObj.args, playlistLength: defaultArgs.playlistLength, forcedQuery: defaultArgs.forcedQuery, checkDuplicatesBy: defaultArgs.checkDuplicatesBy, bAdvTitle: defaultArgs.bAdvTitle};
							if (!forcedQueryMenusEnabled[name]) {sameByArgs.forcedQuery = '';}
							menu.newEntry({menuName, entryText: 'By ' + queryName, func: () => {searchSameByCombs(sameByArgs);}, flags: focusFlags});
						}
					});
					menu.newEntry({menuName, entryText: 'sep'});
					{ // Static menu: user configurable
						menu.newEntry({menuName, entryText: 'By... (pairs of tags)', func: () => {
							// On first execution, must update from property
							selArg.args.sameBy = convertStringToObject(menu_properties['sameByCustomArg'][1], 'number', ',');
							// Input
							let input;
							try {input = utils.InputBox(window.ID, 'Enter pairs of \'tag, number of matches\', separated by comma.\n', scriptName + ': ' + name, convertObjectToString(selArg.args.sameBy, ','), true);}
							catch (e) {return;}
							if (!input.length) {return;}
							// For internal use original object
							selArg.args.sameBy = convertStringToObject(input, 'number', ',');
							menu_properties['sameByCustomArg'][1] = convertObjectToString(selArg.args.sameBy); // And update property with new value
							overwriteMenuProperties(); // Updates panel
							const sameByArgs = {...selArg.args, playlistLength: defaultArgs.playlistLength, forcedQuery: defaultArgs.forcedQuery, checkDuplicatesBy: defaultArgs.checkDuplicatesBy, bAdvTitle: defaultArgs.bAdvTitle};
							if (!forcedQueryMenusEnabled[name]) {sameByArgs.forcedQuery = '';}
							searchSameByCombs(sameByArgs);
						}, flags: focusFlags});
						// Menu to configure property
						menu.newEntry({menuName, entryText: 'sep'});
					}
					{	// Add / Remove
						createSubMenuEditEntries(menuName, {
							name,
							list: sameByQueries, 
							propName: 'sameByQueries', 
							defaults: sameByQueriesDefaults, 
							defaultPreset: folders.xxx + 'presets\\Playlist Tools\\same_by_queries\\artist.json',
							input: inputSameByQuery
						});
					}
				}});
			}
			{	// Static menus: Special playlist (at other menu)
				if (!menusEnabled.hasOwnProperty(specialMenu) || menusEnabled[specialMenu] === true) {
					menu.newEntry({menuName: specialMenu, entryText: 'Based on Queries:', func: null, flags: MF_GRAYED}); // Jumps just before special playlists
					const selArgs = [ 
						{title: 'sep', menu: specialMenu},
						{title: 'Same artist(s) or featured artist(s)', menu: specialMenu, args: {sameBy: {artist: 1, involvedpeople: 1}, remapTags: {artist: ['involvedpeople'], involvedpeople: ['artist']}, bOnlyRemap: false, logic: 'OR'}},  // Finds tracks where artist or involved people matches any from selection
						{title: 'Find collaborations along other artists', menu: specialMenu, args: {sameBy: {artist: 1}, remapTags: {artist: ['involvedpeople']}, bOnlyRemap: true, logic: 'OR'}},  // Finds tracks where involved people matches artist from selection (remap)
						{title: 'Music by same composer(s) as artist(s)', menu: specialMenu, args: {sameBy: {composer: 1}, remapTags: {composer: ['involvedpeople', 'artist']}, bOnlyRemap: true, logic: 'OR'}}, // Finds tracks where artist or involvedpeople matches composer from selection (remap)
						{title: 'sep', menu: specialMenu},
					];
					selArgs.forEach( (selArg) => {
						if (selArg.title === 'sep') {
							let entryMenuName = selArg.hasOwnProperty('menu') ? selArg.menu : menuName;
							menu.newEntry({menuName: entryMenuName, entryText: 'sep'});
						} else {
							let entryText = '';
							if (!selArg.hasOwnProperty('title')) {
								Object.keys(selArg.args.sameBy).forEach((key, index, array) => {
									entryText += (!entryText.length ? '' : index !== array.length - 1 ? ', ' : ' and ');
									entryText += capitalize(key) + (selArg.args.sameBy[key] > 1 ? 's' : '') + ' (=' + selArg.args.sameBy[key] + ')';
									});
							} else {entryText = selArg.title;}
							let entryMenuName = selArg.hasOwnProperty('menu') ? selArg.menu : menuName;
							menu.newEntry({menuName: entryMenuName, entryText, func: (args = {...defaultArgs, ...selArg.args}) => {searchSameByCombs(args);}, flags: focusFlags});
						}
					});
				}
				menu.newEntry({entryText: 'sep'});
			}
		} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++, bIsMenu: true});}
	}
}