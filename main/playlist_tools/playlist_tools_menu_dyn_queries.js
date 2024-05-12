'use strict';
//09/05/24

/* global menusEnabled:readable, readmes:readable, menu:readable, menu_properties:readable, scriptName:readable, overwriteMenuProperties:readable, forcedQueryMenusEnabled:writable, defaultArgs:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, selectedFlags:readable, createSubMenuEditEntries:readable */

/* global MF_GRAYED:readable, folders:readable, _isFile:readable, globQuery:readable, globTags:readable, _q:readable, checkQuery:readable, isJSON:readable*/

// Dynamic queries
{
	const scriptPath = folders.xxx + 'main\\filter_and_query\\dynamic_query.js';
	/* global dynamicQuery:readable */
	if (_isFile(scriptPath)) {
		const name = 'Dynamic Queries';
		if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name] === true) {
			include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
			readmes[name] = folders.xxx + 'helpers\\readme\\dynamic_query.txt';
			forcedQueryMenusEnabled[name] = false;
			const menuName = menu.newMenu(name);
			{	// Dynamic menu
				let queryFilter = [
					{
						name: 'Same title (any artist)',
						query: globQuery.compareTitle
					},
					{
						name: 'Same songs (by artist)',
						query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artistRaw + '#)'
					},
					{
						name: 'Duplicates on library',
						query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artistRaw + '#) AND (' + _q(globTags.date) + ' IS #' + globTags.date + '#)'
					},
					{ name: 'sep' },
					{
						name: 'Same date (any track/artist)',
						query: _q(globTags.date) + ' IS #' + globTags.date + '#'
					},
					{
						name: 'Same artist(s)',
						query: globTags.artist + ' IS #' + globTags.artistRaw + '#'
					},
					{ name: 'sep' },
					{
						name: 'Acoustic versions of song',
						query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artistRaw + '#) AND (' + globTags.genre + ' IS acoustic OR ' + globTags.style + ' IS acoustic OR ' + globTags.mood + ' IS acoustic)'
					},
					{
						name: 'Live versions of song',
						query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artistRaw + '#) AND (' + globTags.genre + ' IS live OR ' + globTags.style + ' IS live)'
					},
					{
						name: 'Cover versions of song',
						query: globQuery.compareTitle + ' AND NOT (' + globTags.artist + ' IS #' + globTags.artistRaw + '#)'
					},
					{ name: 'sep' },
					{
						name: 'Rated >2 tracks (by artist)',
						query: globTags.rating + ' GREATER 2 AND (' + globTags.artist + ' IS #' + globTags.artistRaw + '#)'
					},
				];
				const queryFilterDefaults = [...queryFilter];
				let selArg = { query: queryFilter[0].query };
				// Create new properties with previous args
				menu_properties['dynamicQueries'] = [name + ' queries', JSON.stringify(queryFilter)];
				menu_properties['dynamicQueriesCustomArg'] = [name + ' Dynamic menu custom args', selArg.query];
				// Checks
				menu_properties['dynamicQueries'].push({ func: isJSON }, menu_properties['dynamicQueries'][1]);
				menu_properties['dynamicQueriesCustomArg'].push({ func: (query) => { return checkQuery(query, true); } }, menu_properties['dynamicQueriesCustomArg'][1]);
				// Helper
				const inputDynQuery = () => {
					let query = '';
					try { query = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.', scriptName + ': ' + name, selArg.query, true); }
					catch (e) { return; }
					if (!query.length) { return; }
					let tfo = '';
					try { tfo = utils.InputBox(window.ID, 'Enter TF expression for sorting:', scriptName + ': ' + name, '', true); }
					catch (e) { return; }
					let direction = 1;
					try { direction = Number(utils.InputBox(window.ID, 'Direction:\n(-1 or 1)', scriptName + ': ' + name, 1, true)); }
					catch (e) { return; }
					if (isNaN(direction)) { return; }
					direction = direction > 0 ? 1 : -1;
					// Final check
					try { if (!dynamicQuery({ query, bSendToPls: false })) { throw new Error(); } }
					catch (e) { fb.ShowPopupMessage('query not valid, check it and try again:\n' + query, scriptName); return; }
					return { query, sort: { tfo, direction } };
				};
				// Menus
				menu.newEntry({ menuName, entryText: 'Based on queries evaluated with sel:', func: null, flags: MF_GRAYED });
				menu.newEntry({ menuName, entryText: 'sep' });
				menu.newCondEntry({
					entryText: 'Dynamic Queries (cond)', condFunc: () => {
						const options = JSON.parse(menu_properties.dynQueryEvalSel[1]);
						const bEvalSel = options['Dynamic queries'];
						// Entry list
						queryFilter = JSON.parse(menu_properties['dynamicQueries'][1]);
						const entryNames = new Set();
						queryFilter.forEach((queryObj) => {
							// Add separators
							if (Object.hasOwn(queryObj, 'name') && queryObj.name === 'sep') {
								let entryMenuName = Object.hasOwn(queryObj, 'menu') ? queryObj.menu : menuName;
								menu.newEntry({ menuName: entryMenuName, entryText: 'sep' });
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
										if (query.indexOf('#') !== -1 && !fb.GetFocusItem(true)) { fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.query, scriptName); return; }
										if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) {  // With forced query enabled
											if (query.length && query.toUpperCase() !== 'ALL') { // ALL query never uses forced query!
												query = '(' + query + ') AND (' + defaultArgs.forcedQuery + ')';
											} else if (!query.length) { query = defaultArgs.forcedQuery; } // Empty uses forced query or ALL
										} else if (!query.length) { query = 'ALL'; } // Otherwise empty is replaced with ALL
										if (bEvalSel) { dynamicQuery({ query, sort: queryObj.sort, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist) }) } // eslint-disable-line semi
										else { dynamicQuery({ query, sort: queryObj.sort }); }
									}, flags: selectedFlags
								});
							}
						});
						menu.newEntry({ menuName, entryText: 'sep' });
						{ // Static menu: user configurable
							menu.newEntry({
								menuName, entryText: 'By... (query)', func: () => {
									// On first execution, must update from property
									selArg.query = menu_properties['dynamicQueriesCustomArg'][1];
									// Input
									let input = '';
									try { input = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with ' + (bEvalSel ? 'selected items\' values.' : 'focused item\'s value.'), scriptName + ': ' + name, selArg.query, true); }
									catch (e) { return; }
									if (input.indexOf('#') !== -1 && !fb.GetFocusItem(true)) { fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + input, scriptName); return; }
									// Playlist
									const query = forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length ? (input.length && input.toUpperCase() !== 'ALL' ? '(' + input + ') AND (' + defaultArgs.forcedQuery + ')' : input) : (!input.length ? 'ALL' : input);
									const handleList = bEvalSel ? dynamicQuery({ query, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist) }) : dynamicQuery({ query });
									if (!handleList) { fb.ShowPopupMessage('Query failed:\n' + query, scriptName); return; }
									// For internal use original object
									selArg.query = input;
									menu_properties['dynamicQueriesCustomArg'][1] = input; // And update property with new value
									overwriteMenuProperties(); // Updates panel
								}, flags: selectedFlags
							});
							// Menu to configure property
							menu.newEntry({ menuName, entryText: 'sep' });
						}
						{	// Add / Remove
							createSubMenuEditEntries(menuName, {
								name,
								list: queryFilter,
								propName: 'dynamicQueries',
								defaults: queryFilterDefaults,
								defaultPreset: folders.xxx + 'presets\\Playlist Tools\\dyn_query_filter\\default.json',
								input: inputDynQuery,
								bDefaultFile: true
							});
						}
					}
				});
			}
			menu.newEntry({ entryText: 'sep' });
		} else { menuDisabled.push({ menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); } // NOSONAR
	}
}