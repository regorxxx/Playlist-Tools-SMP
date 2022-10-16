'use strict';
//16/10/22

// Dynamic queries...
{
	const scriptPath = folders.xxx + 'main\\dynamic_query.js';
	if (_isFile(scriptPath)){
		const name = 'Dynamic Queries...';
		if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
			include(scriptPath);
			readmes[name] = folders.xxx + 'helpers\\readme\\dynamic_query.txt';
			forcedQueryMenusEnabled[name] = false;
			const menuName = menu.newMenu(name);
			{	// Dynamic menu
				let queryFilter = [
					{name: 'Same title (any artist)'	, query: globQuery.compareTitle},
					{name: 'Same songs (by artist)'		, query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artist + '#)'},
					{name: 'Duplicates on library'		, query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artist + '#) AND (' + _q(globTags.date) + ' IS #' + globTags.date + '#)'},
					{name: 'sep'},
					{name: 'Same date (any track/artist)'		, query: _q(globTags.date) + ' IS #' + globTags.date + '#'},
					{name: 'sep'},
					{name: 'Acoustic versions of song'	, query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artist + '#) AND (' + globTags.genre + ' IS acoustic OR ' + globTags.style + ' IS acoustic OR ' + globTags.mood + ' IS acoustic)'},
					{name: 'Live versions of song'	, query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artist + '#) AND (' + globTags.genre + ' IS live OR ' + globTags.style + ' IS live)'},
					{name: 'Cover versions of song'	, query: globQuery.compareTitle + ' AND NOT (' + globTags.artist + ' IS #' + globTags.artist + '#)'},
					{name: 'sep'},
					{name: 'Rated >2 tracks (by artist)'	, query: globTags.rating + ' GREATER 2 AND (' + globTags.artist + ' IS #' + globTags.artist + '#)'},
				];
				const queryFilterDefaults = [...queryFilter];
				let selArg = {query: queryFilter[0].query};
				// Create new properties with previous args
				menu_properties['dynamicQueries'] = [name + ' queries', JSON.stringify(queryFilter)];
				menu_properties['dynamicQueriesCustomArg'] = [name + ' Dynamic menu custom args', selArg.query];
				// Checks
				menu_properties['dynamicQueries'].push({func: isJSON}, menu_properties['dynamicQueries'][1]);
				menu_properties['dynamicQueriesCustomArg'].push({func: (query) => {return checkQuery(query, true);}}, menu_properties['dynamicQueriesCustomArg'][1]);
				// Menus
				menu.newEntry({menuName, entryText: 'Based on queries evaluated with sel:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName, entryText: 'sep'});
				menu.newCondEntry({entryText: 'Dynamic Queries... (cond)', condFunc: () => {
					const options = JSON.parse(menu_properties.dynQueryEvalSel[1]);
					const bEvalSel = options['Dynamic queries'];
					// Entry list
					queryFilter = JSON.parse(menu_properties['dynamicQueries'][1]);
					queryFilter.forEach( (queryObj) => {
						// Add separators
						if (queryObj.hasOwnProperty('name') && queryObj.name === 'sep') {
							let entryMenuName = queryObj.hasOwnProperty('menu') ? queryObj.menu : menuName;
							menu.newEntry({menuName: entryMenuName, entryText: 'sep'});
						} else { 
							// Create names for all entries
							queryObj.name = queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name;
							// Entries
							menu.newEntry({menuName, entryText: queryObj.name, func: () => {
								let query = queryObj.query;
								if (query.indexOf('#') !== -1 && !fb.GetFocusItem(true)) {fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.query, scriptName); return;}
								if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) {  // With forced query enabled
									if (query.length && query.toUpperCase() !== 'ALL') { // ALL query never uses forced query!
										query = '(' + query + ') AND (' + defaultArgs.forcedQuery + ')';
									} else if (!query.length) {query = defaultArgs.forcedQuery;} // Empty uses forced query or ALL
								} else if (!query.length) {query = 'ALL';} // Otherwise empty is replaced with ALL
								if (bEvalSel) {dynamicQuery({query, sort: queryObj.sort, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist)})}
								else{dynamicQuery({query, sort: queryObj.sort});}
							}, flags: selectedFlags});
						}
					});
					menu.newEntry({menuName, entryText: 'sep'});
					{ // Static menu: user configurable
						menu.newEntry({menuName, entryText: 'By... (query)', func: () => {
							// On first execution, must update from property
							selArg.query = menu_properties['dynamicQueriesCustomArg'][1];
							// Input
							let input = '';
							try {input = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with ' + (bEvalSel ? 'selected items\' values.' : 'focused item\'s value.'), scriptName + ': ' + name, selArg.query, true);}
							catch (e) {return;}
							if (input.indexOf('#') !== -1 && !fb.GetFocusItem(true)) {fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + input, scriptName); return;}
							// Playlist
							const query = forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length ? (input.length && input.toUpperCase() !== 'ALL' ? '(' + input + ') AND (' + defaultArgs.forcedQuery + ')' : input) : (!input.length ? 'ALL' : input);
							const handleList = bEvalSel ? dynamicQuery({query, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist)}) : dynamicQuery({query});
							if (!handleList) {fb.ShowPopupMessage('Query failed:\n' + query, scriptName); return;}
							// For internal use original object
							selArg.query = input; 
							menu_properties['dynamicQueriesCustomArg'][1] = input; // And update property with new value
							overwriteMenuProperties(); // Updates panel
						}, flags: selectedFlags});
						// Menu to configure property
						menu.newEntry({menuName, entryText: 'sep'});
					}
					{	// Add / Remove
						menu.newEntry({menuName, entryText: 'Add new entry to list...' , func: () => {
							// Input all variables
							let input;
							let entryName = '';
							try {entryName = utils.InputBox(window.ID, 'Enter name for menu entry\nWrite \'sep\' to add a line.', scriptName + ': ' + name, '', true);}
							catch (e) {return;}
							if (!entryName.length) {return;}
							if (entryName === 'sep') {input = {name: entryName};} // Add separator
							else { // or new entry
								let query = '';
								try {query = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.', scriptName + ': ' + name, selArg.query, true);}
								catch (e) {return;}
								if (!query.length) {return;}
								let tfo = '';
								try {tfo = utils.InputBox(window.ID, 'Enter TF expression for sorting:', scriptName + ': ' + name, '', true);}
								catch (e) {return;}
								let direction = 1;
								try {direction = Number(utils.InputBox(window.ID, 'Direction:\n(-1 or 1)', scriptName + ': ' + name, 1, true));}
								catch (e) {return;}
								if (isNaN(direction)) {return;}
								direction = direction > 0 ? 1 : -1;
								input = {name: entryName, query, sort: {tfo, direction}};
								// Final check
								try {if (!dynamicQuery({query, bSendToPls: false})) {throw 'error';}}
								catch (e) {fb.ShowPopupMessage('query not valid, check it and try again:\n' + query, scriptName);return;}
							}
							// Add entry
							queryFilter.push(input);
							// Save as property
							menu_properties['dynamicQueries'][1] = JSON.stringify(queryFilter); // And update property with new value
							// Presets
							if (!presets.hasOwnProperty('dynamicQueries')) {presets.dynamicQueries = [];}
							presets.dynamicQueries.push(input);
							menu_properties['presets'][1] = JSON.stringify(presets);
							overwriteMenuProperties(); // Updates panel
						}});
						{
							const subMenuSecondName = menu.newMenu('Remove entry from list...' + nextId('invisible', true, false), menuName);
							queryFilter.forEach( (queryObj, index) => {
								const entryText = (queryObj.name === 'sep' ? '------(separator)------' : (queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name));
								menu.newEntry({menuName: subMenuSecondName, entryText, func: () => {
									queryFilter.splice(index, 1);
									menu_properties['dynamicQueries'][1] = JSON.stringify(queryFilter);
									// Presets
									if (presets.hasOwnProperty('dynamicQueries')) {
										presets.dynamicQueries.splice(presets.dynamicQueries.findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(queryObj);}), 1);
										if (!presets.dynamicQueries.length) {delete presets.dynamicQueries;}
										menu_properties['presets'][1] = JSON.stringify(presets);
									}
									overwriteMenuProperties(); // Updates panel
								}});
							});
							if (!queryFilter.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
							menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
							menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
								queryFilter = [...queryFilterDefaults];
								menu_properties['dynamicQueries'][1] = JSON.stringify(queryFilter);
								// Presets
								if (presets.hasOwnProperty('dynamicQueries')) {
									delete presets.dynamicQueries;
									menu_properties['presets'][1] = JSON.stringify(presets);
								}
								overwriteMenuProperties(); // Updates panel
							}});
						}
					}
				}});
			}
			menu.newEntry({entryText: 'sep'});
		} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
	}
}