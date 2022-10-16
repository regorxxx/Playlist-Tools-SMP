﻿'use strict';
//16/10/22

// Standard Queries...
{
	const scriptPath = folders.xxx + 'main\\dynamic_query.js';
	if (_isFile(scriptPath)){
		const name = 'Standard Queries...';
		if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
			include(scriptPath);
			readmes[newReadmeSep()] = 'sep';
			readmes[name] = folders.xxx + 'helpers\\readme\\dynamic_query.txt';
			forcedQueryMenusEnabled[name] = true;
			const menuName = menu.newMenu(name);
			{	// Dynamic menu
				let queryFilter = [
					{name: 'Entire library', query: 'ALL', sort: {tfo: '', direction: -1}},
					{name: 'Entire library (forced query)', query: '', sort: {tfo: '', direction: -1}},
					{name: 'sep'},
					{name: 'Rating 4-5', query: globTags.rating + ' EQUAL 5 OR ' + globTags.rating + ' EQUAL 4', sort: {tfo: globTags.rating, direction: 1}},
					{name: 'sep'},
					{name: 'Recently played', query: '%LAST_PLAYED% DURING LAST 1 WEEK', sort: {tfo: '%LAST_PLAYED%', direction: -1}},
					{name: 'Recently added', query: '%ADDED% DURING LAST 1 WEEK', sort: {tfo: '%ADDED%', direction: -1}},
					{name: 'sep'},
					{name: 'Rock tracks', query: globTags.genre + ' IS rock OR ' + globTags.genre + ' IS alt. rock OR ' + globTags.genre + ' IS progressive rock OR ' + globTags.genre + ' IS hard rock OR ' + globTags.genre + ' IS rock & roll', sort: {tfo: '$rand()', direction: 1}},
					{name: 'Psychedelic tracks', query: globTags.genre + ' IS psychedelic rock OR ' + globTags.genre + ' IS psychedelic OR ' + globTags.style + ' IS neo-psychedelia OR ' + globTags.style + ' IS psychedelic Folk', sort: {tfo: '$rand()', direction: 1}},
					{name: 'Folk \\ Country tracks', query: globTags.genre + ' IS folk OR ' + globTags.genre + ' IS folk-rock OR ' + globTags.genre + ' IS country', sort: {tfo: '$rand()', direction: 1}},
					{name: 'Blues tracks', query: globTags.genre + ' IS blues', sort: {tfo: '$rand()', direction: 1}},
					{name: 'Jazz tracks', query: globTags.genre + ' IS jazz OR ' + globTags.genre + ' IS jazz vocal', sort: {tfo: '$rand()', direction: 1}},
					{name: 'Soul \\ RnB tracks', query: globTags.genre + ' IS soul OR ' + globTags.style + ' IS r&b', sort: {tfo: '$rand()', direction: 1}},
					{name: 'Hip-Hop tracks', query: globTags.genre + ' IS hip-hop', sort: {tfo: '$rand()', direction: 1}}
				];
				let selArg = {name: 'Custom', query: queryFilter[0].query};
				const queryFilterDefaults = [...queryFilter];
				// Create new properties with previous args
				menu_properties['searchQueries'] = [name + ' queries', JSON.stringify(queryFilter)];
				menu_properties['searchCustomArg'] = [name + ' Dynamic menu custom args', JSON.stringify(selArg)];
				// Checks
				menu_properties['searchQueries'].push({func: isJSON}, menu_properties['searchCustomArg'][1]);
				menu_properties['searchCustomArg'].push({func: isJSON}, menu_properties['searchCustomArg'][1]);
				// Menus
				menu.newEntry({menuName, entryText: 'Standard search with queries:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName, entryText: 'sep'});
				menu.newCondEntry({entryText: 'Search library... (cond)', condFunc: () => {
					// Entry list
					queryFilter = JSON.parse(menu_properties['searchQueries'][1]);
					queryFilter.forEach( (queryObj) => {
						// Add separators
						if (queryObj.hasOwnProperty('name') && queryObj.name === 'sep') {
							let entryMenuName = queryObj.hasOwnProperty('menu') ? queryObj.menu : menuName;
							menu.newEntry({menuName: entryMenuName, entryText: 'sep'});
						} else { 
							// Create names for all entries
							let queryName = queryObj.name;
							queryName = queryName.length > 40 ? queryName.substring(0,40) + ' ...' : queryName;
							// Entries
							menu.newEntry({menuName, entryText: queryName, func: () => {
								let query = queryObj.query;
								if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) { // With forced query enabled
									if (query.length && query.toUpperCase() !== 'ALL') { // ALL query never uses forced query!
										query = '(' + query + ') AND (' + defaultArgs.forcedQuery + ')';
									} else if (!query.length) {query =  defaultArgs.forcedQuery;} // Empty uses forced query or ALL
								} else if (!query.length) {query = 'ALL';} // Otherwise empty is replaced with ALL
								dynamicQuery({query, sort: queryObj.sort}); 
							}});
						}
					});
					menu.newEntry({menuName, entryText: 'sep'});
					{ // Static menu: user configurable
						menu.newEntry({menuName, entryText: 'By... (query)', func: () => {
							// On first execution, must update from property
							selArg.query = JSON.parse(menu_properties['searchCustomArg'][1]).query;
							// Input
							let query;
							try {query = utils.InputBox(window.ID, 'Enter query:', scriptName + ': ' + name, selArg.query, true);}
							catch (e) {return;}
							// Playlist
							let handleList = dynamicQuery({query: forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length ? (query.length && query.toUpperCase() !== 'ALL' ? '(' + query + ') AND (' + defaultArgs.forcedQuery + ')' : query) : (!query.length ? 'ALL' : query)});
							if (!handleList) {fb.ShowPopupMessage('Query failed:\n' + query, scriptName); return;}
							// For internal use original object
							selArg.query = query;
							menu_properties['searchCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
							overwriteMenuProperties(); // Updates panel
						}});
						// Menu to configure property
						menu.newEntry({menuName, entryText: 'sep'});
					}
					{	// Add / Remove
						menu.newEntry({menuName, entryText: 'Add new entry to list...' , func: () => {
							// Input all variables
							let input;
							let entryName = '';
							try {entryName = utils.InputBox(window.ID, 'Enter name for menu entry\nWrite \'sep\' to add a line.', scriptName, '', true);}
							catch (e) {return;}
							if (!entryName.length) {return;}
							if (entryName === 'sep') {input = {name: entryName};} // Add separator
							else { // or new entry
								let query = '';
								try {query = utils.InputBox(window.ID, 'Enter query:', scriptName + ': ' + name, selArg.query, true);}
								catch (e) {return;}
								if (!query.length) {return;}
								if (!checkQuery(query, true)) {fb.ShowPopupMessage('query not valid, check it and try again:\n' + query, scriptName);return}
								let tfo = '';
								try {tfo = utils.InputBox(window.ID, 'Enter TF expression for sorting:', scriptName + ': ' + name, '', true);}
								catch (e) {return;}
								let direction = 1;
								try {direction = Number(utils.InputBox(window.ID, 'Direction:\n(-1 or 1)', scriptName + ': ' + name, 1, true));}
								catch (e) {return;}
								if (isNaN(direction)) {return;}
								direction = direction > 0 ? 1 : -1;
								input = {name: entryName, query, sort: {tfo, direction}};
							}
							// Add entry
							queryFilter.push(input);
							// Save as property
							menu_properties['searchQueries'][1] = JSON.stringify(queryFilter); // And update property with new value
							// Presets
							if (!presets.hasOwnProperty('searchQueries')) {presets.searchQueries = [];}
							presets.searchQueries.push(input);
							menu_properties['presets'][1] = JSON.stringify(presets);
							overwriteMenuProperties(); // Updates panel
						}});
						{
							const subMenuSecondName = menu.newMenu('Remove entry from list...' + nextId('invisible', true, false), menuName);
							queryFilter.forEach( (queryObj, index) => {
								const entryText = (queryObj.name === 'sep' ? '------(separator)------' : (queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name));
								menu.newEntry({menuName: subMenuSecondName, entryText, func: () => {
									queryFilter.splice(index, 1);
									menu_properties['searchQueries'][1] = JSON.stringify(queryFilter);
									// Presets
									if (presets.hasOwnProperty('searchQueries')) {
										presets.searchQueries.splice(presets.searchQueries.findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(queryObj);}), 1);
										if (!presets.searchQueries.length) {delete presets.searchQueries;}
										menu_properties['presets'][1] = JSON.stringify(presets);
									}
									overwriteMenuProperties(); // Updates panel
								}});
							});
							if (!queryFilter.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
							menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
							menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
								queryFilter = [...queryFilterDefaults];
								menu_properties['searchQueries'][1] = JSON.stringify(queryFilter);
								// Presets
								if (presets.hasOwnProperty('searchQueries')) {
									delete presets.searchQueries;
									menu_properties['presets'][1] = JSON.stringify(presets);
								}
								overwriteMenuProperties(); // Updates panel
							}});
						}
					}
				}});
			}
		} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
	}
}