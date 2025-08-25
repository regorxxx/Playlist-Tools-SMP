'use strict';
//25/08/25

/* global menusEnabled:readable, readmes:readable, menu:readable, newReadmeSep:readable, scriptName:readable, defaultArgs:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, menu_properties:writable, overwriteMenuProperties:readable, forcedQueryMenusEnabled:readable, createSubMenuEditEntries:readable, globQuery:readable */

/* global MF_GRAYED:readable, folders:readable, _isFile:readable, isJSON:readable, globTags:readable, checkQuery:readable */

// Standard Queries
{
	const scriptPath = folders.xxx + 'main\\filter_and_query\\dynamic_query.js';
	/* global dynamicQuery:readable */
	if (_isFile(scriptPath)) {
		const name = 'Standard Queries';
		if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
			include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
			readmes[newReadmeSep()] = 'sep';
			readmes[name] = folders.xxx + 'helpers\\readme\\dynamic_query.txt';
			forcedQueryMenusEnabled[name] = true;
			const menuName = menu.newMenu(name);
			{	// Dynamic menu
				let queryFilter = [
					{ name: 'Media library', query: 'ALL', sort: { tfo: '', direction: -1 } },
					{ name: 'Media library (forced query)', query: '', sort: { tfo: '', direction: -1 } },
					{ name: 'sep' },
					{ name: 'Rated ≥4 tracks', query: globQuery.ratingGr3 , sort: { tfo: globTags.rating, direction: 1 } },
					{ name: 'Rated 5 tracks', query: globQuery.ratingTop , sort: { tfo: globTags.rating, direction: 1 } },
					{ name: 'Fav tracks', query: globQuery.fav , sort: { tfo: globTags.rating, direction: 1 } },
					{ name: 'Loved tracks', query: globQuery.loved , sort: { tfo: globTags.rating, direction: 1 } },
					{ name: 'sep' },
					{ name: 'Recently listened', query: globQuery.recent, sort: { tfo: globTags.sortLastPlayed , direction: -1 } },
					{ name: 'Recently added', query: globQuery.added, sort: { tfo: globTags.sortAdded, direction: -1 } },
					{ name: 'Not recently listened', query: 'NOT ' + globQuery.recent, sort: { tfo: globTags.sortLastPlayed , direction: -1 } },
					{ name: 'Not recently added', query: 'NOT ' + globQuery.added, sort: { tfo: globTags.sortAdded, direction: -1 } },
					{ name: 'sep' },
					{ name: 'Rock tracks', query: globTags.genre + ' IS rock OR ' + globTags.genre + ' IS alt. rock OR ' + globTags.genre + ' IS progressive rock OR ' + globTags.genre + ' IS hard rock OR ' + globTags.genre + ' IS rock & roll', sort: { tfo: '$rand()', direction: 1 } },
					{ name: 'Psychedelic tracks', query: globTags.genre + ' IS psychedelic rock OR ' + globTags.genre + ' IS psychedelic OR ' + globTags.style + ' IS neo-psychedelia OR ' + globTags.style + ' IS psychedelic Folk', sort: { tfo: '$rand()', direction: 1 } },
					{ name: 'Folk \\ Country tracks', query: globTags.genre + ' IS folk OR ' + globTags.genre + ' IS folk-rock OR ' + globTags.genre + ' IS country', sort: { tfo: '$rand()', direction: 1 } },
					{ name: 'Blues tracks', query: globTags.genre + ' IS blues', sort: { tfo: '$rand()', direction: 1 } },
					{ name: 'Jazz tracks', query: globTags.genre + ' IS jazz OR ' + globTags.genre + ' IS jazz vocal', sort: { tfo: '$rand()', direction: 1 } },
					{ name: 'Soul \\ RnB tracks', query: globTags.genre + ' IS soul OR ' + globTags.style + ' IS r&b', sort: { tfo: '$rand()', direction: 1 } },
					{ name: 'Hip-Hop tracks', query: globTags.genre + ' IS hip-hop', sort: { tfo: '$rand()', direction: 1 } }
				];
				let selArg = { name: 'Custom', query: queryFilter[0].query };
				const queryFilterDefaults = [...queryFilter];
				// Create new properties with previous args
				menu_properties['searchQueries'] = [name + ' queries', JSON.stringify(queryFilter)];
				menu_properties['searchCustomArg'] = [name + ' Dynamic menu custom args', JSON.stringify(selArg)];
				// Checks
				menu_properties['searchQueries'].push({ func: isJSON }, menu_properties['searchCustomArg'][1]);
				menu_properties['searchCustomArg'].push({ func: isJSON }, menu_properties['searchCustomArg'][1]);
				// Helpers
				const inputStdQuery = (bCopyCurrent = false) => {
					if (bCopyCurrent) { // NOSONAR
						return { query: selArg.query };
					} else {
						let query = '';
						try { query = utils.InputBox(window.ID, 'Enter query:', scriptName + ': ' + name, selArg.query, true); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (!query.length) { return; }
						if (!checkQuery(query, true)) { fb.ShowPopupMessage('query not valid, check it and try again:\n' + query, scriptName); return; }
						let tfo = '';
						try { tfo = utils.InputBox(window.ID, 'Enter TF expression for sorting:', scriptName + ': ' + name, '', true); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						let direction = 1;
						try { direction = Number(utils.InputBox(window.ID, 'Direction:\n(-1 or 1)', scriptName + ': ' + name, 1, true)); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (isNaN(direction)) { return; }
						direction = direction > 0 ? 1 : -1;
						return { query, sort: { tfo, direction } };
					}
				};
				// Menus
				menu.newEntry({ menuName, entryText: 'Standard search with queries:', func: null, flags: MF_GRAYED });
				menu.newSeparator(menuName);
				menu.newCondEntry({
					entryText: 'Search library (cond)', condFunc: () => {
						// Entry list
						queryFilter = JSON.parse(menu_properties['searchQueries'][1]);
						const entryNames = new Set();
						queryFilter.forEach((queryObj) => {
							// Add separators
							if (menu.isSeparator(queryObj)) {
								let entryMenuName = Object.hasOwn(queryObj, 'menu') ? queryObj.menu : menuName;
								menu.newSeparator(entryMenuName);
							} else {
								// Create names for all entries
								let queryName = queryObj.name || '';
								queryName = queryName.length > 40 ? queryName.substring(0, 40) + ' ...' : queryName;
								if (entryNames.has(queryName)) {
									fb.ShowPopupMessage('There is an entry with duplicated name:\t' + queryName + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(queryObj, null, '\t'), scriptName + ': ' + name);
									return;
								} else { entryNames.add(queryName); }
								// Entries
								menu.newEntry({
									menuName, entryText: queryName, func: () => {
										let query = queryObj.query;
										if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) { // With forced query enabled
											if (query.length && query.toUpperCase() !== 'ALL') { // ALL query never uses forced query!
												query = '(' + query + ') AND (' + defaultArgs.forcedQuery + ')';
											} else if (!query.length) { query = defaultArgs.forcedQuery; } // Empty uses forced query or ALL
										} else if (!query.length) { query = 'ALL'; } // Otherwise empty is replaced with ALL
										dynamicQuery({ query, sort: queryObj.sort });
									}
								});
							}
						});
						menu.newSeparator(menuName);
						{ // Static menu: user configurable
							menu.newEntry({
								menuName, entryText: 'By... (query)', func: () => {
									// On first execution, must update from property
									selArg.query = JSON.parse(menu_properties['searchCustomArg'][1]).query;
									// Input
									let query;
									try { query = utils.InputBox(window.ID, 'Enter query:', scriptName + ': ' + name, selArg.query, true); }
									catch (e) { return; } // eslint-disable-line no-unused-vars
									// Playlist
									let handleList = dynamicQuery({
										query: forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length
											? (query.length && query.toUpperCase() !== 'ALL'
												? '(' + query + ') AND (' + defaultArgs.forcedQuery + ')'
												: query	)
											: (!query.length ? 'ALL' : query)
									});
									if (!handleList) { fb.ShowPopupMessage('Query failed:\n' + query, scriptName); return; }
									// For internal use original object
									selArg.query = query;
									menu_properties['searchCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
									overwriteMenuProperties(); // Updates panel
								}
							});
							// Menu to configure property
							menu.newSeparator(menuName);
						}
						{	// Add / Remove
							createSubMenuEditEntries(menuName, {
								name,
								list: queryFilter,
								propName: 'searchQueries',
								defaults: queryFilterDefaults,
								defaultPreset: folders.xxx + 'presets\\Playlist Tools\\std_query_filter\\default.json',
								input: inputStdQuery,
								bDefaultFile: true,
								bCopyCurrent: true
							});
						}
					}
				});
			}
		} else { menuDisabled.push({ menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); } // NOSONAR
	}
}