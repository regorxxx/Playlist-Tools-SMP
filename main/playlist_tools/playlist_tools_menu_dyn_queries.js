'use strict';
//25/08/25

/* global menusEnabled:readable, readmes:readable, menu:readable, menu_properties:readable, scriptName:readable, overwriteMenuProperties:readable, forcedQueryMenusEnabled:writable, defaultArgs:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, selectedFlags:readable, createSubMenuEditEntries:readable */

/* global MF_GRAYED:readable, MF_STRING:readable, folders:readable, _isFile:readable, globQuery:readable, globTags:readable, _qCond:readable, checkQuery:readable, isJSON:readable, WshShell:readable, popup:readable, queryJoin:readable */

// Dynamic queries
{
	const scriptPath = folders.xxx + 'main\\filter_and_query\\dynamic_query.js';
	/* global dynamicQuery:readable */
	if (_isFile(scriptPath)) {
		const name = 'Dynamic Queries';
		if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
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
						query: queryJoin([globQuery.compareTitle, globTags.artist + ' IS #' + globTags.artistRaw + '#'])
					},
					{
						name: 'Duplicates on library',
						query: queryJoin([globQuery.compareTitle, globTags.artist + ' IS #' + globTags.artistRaw + '#', _qCond(globTags.date) + ' IS #' + globTags.date + '#'])
					},
					{ name: 'sep' },
					{
						name: 'Same date (any track/artist)',
						query: _qCond(globTags.date) + ' IS #' + globTags.date + '#'
					},
					{
						name: 'Same artist(s)',
						query: globTags.artist + ' IS #' + globTags.artistRaw + '#'
					},
					{ name: 'sep' },
					{
						name: 'Acoustic versions of song',
						query: queryJoin([globQuery.compareTitle, globTags.artist + ' IS #' + globTags.artistRaw + '#', globQuery.acoustic])
					},
					{
						name: 'Live versions of song',
						query: queryJoin([globQuery.compareTitle, globTags.artist + ' IS #' + globTags.artistRaw + '#', globQuery.live])
					},
					{
						name: 'Cover versions of song',
						query: queryJoin([globQuery.compareTitle, globTags.artist + ' IS #' + globTags.artistRaw + '#'], 'AND NOT')
					},
					{ name: 'sep' },
					{
						name: 'Rated ≥3 tracks (by artist)',
						query: queryJoin([globQuery.ratingGr2, globTags.artist + ' IS #' + globTags.artistRaw + '#'])
					},
					{
						name: 'Fav tracks (by artist)',
						query: queryJoin([globQuery.fav, globTags.artist + ' IS #' + globTags.artistRaw + '#'])
					},
					{
						name: 'Loved tracks (by artist)',
						query: queryJoin([globQuery.loved, globTags.artist + ' IS #' + globTags.artistRaw + '#'])
					},
					{ name: 'sep' },
					{
						name: 'Last played today',
						query: globQuery.lastPlayedFunc.replaceAll('#QUERYEXPRESSION#', 'DURING #NOW#'),
						sort: { tfo: globTags.playCountRateGlobalDay, direction: -1 },
						bStatic: true
					},
					{
						name: 'Last played yesterday',
						query: globQuery.lastPlayedFunc.replaceAll('#QUERYEXPRESSION#', 'DURING #YESTERDAY#'),
						sort: { tfo: globTags.playCountRateGlobalDay, direction: -1 },
						bStatic: true
					},
					{ name: 'sep' },
					{
						name: 'Daily listen rate ≥1',
						query: 'NOT ' + _qCond(globTags.playCountRateGlobalDay) + ' LESS 1',
						sort: { tfo: globTags.playCountRateGlobalDay, direction: -1 },
						bStatic: true
					},
					{
						name: 'Weekly listen rate ≥1',
						query: 'NOT ' + _qCond(globTags.playCountRateGlobalWeek) + ' LESS 1',
						sort: { tfo: globTags.playCountRateGlobalWeek, direction: -1 },
						bStatic: true
					},
					{
						name: 'Monthly listen rate ≥1',
						query: 'NOT ' + _qCond(globTags.playCountRateGlobalMonth) + ' LESS 1',
						sort: { tfo: globTags.playCountRateGlobalMonth, direction: -1 },
						bStatic: true
					},
					{
						name: 'Yearly listen rate ≥1',
						query: 'NOT ' + _qCond(globTags.playCountRateGlobalYear) + ' LESS 1',
						sort: { tfo: globTags.playCountRateGlobalYear, direction: -1 },
						bStatic: true
					}
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
				const inputDynQuery = (bCopyCurrent = false) => {
					if (bCopyCurrent) { // NOSONAR
						return { query: selArg.query };
					} else {
						let query = '';
						try { query = utils.InputBox(window.ID, 'Enter query:\n\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.\n(see \'Dynamic queries\' readme for more info)', scriptName + ': ' + name, selArg.query, true); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (!query.length) { return; }
						let tfo = '';
						try { tfo = utils.InputBox(window.ID, 'Enter TF expression for sorting:', scriptName + ': ' + name, '', true); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						let direction = 1;
						try { direction = Number(utils.InputBox(window.ID, 'Direction:\n(-1 or 1)', scriptName + ': ' + name, 1, true)); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (isNaN(direction)) { return; }
						direction = direction > 0 ? 1 : -1;
						const bStatic = WshShell.Popup('Force evaluation even when no selection is available?', 0, window.Name, popup.question + popup.yes_no) === popup.yes;
						// Final check
						try { if (!dynamicQuery({ query, bSendToPls: false, bForceStatic: bStatic })) { throw new Error(); } }
						catch (e) { fb.ShowPopupMessage('query not valid, check it and try again:\n' + query, scriptName); return; } // eslint-disable-line no-unused-vars
						return { query, sort: { tfo, direction }, bStatic };
					}
				};
				// Menus
				menu.newEntry({ menuName, entryText: 'Based on queries evaluated with sel:', func: null, flags: MF_GRAYED });
				menu.newSeparator(menuName);
				menu.newCondEntry({
					entryText: 'Dynamic Queries (cond)', condFunc: () => {
						const options = JSON.parse(menu_properties.dynQueryEvalSel[1]);
						const bEvalSel = options['Dynamic queries'];
						// Entry list
						queryFilter = JSON.parse(menu_properties['dynamicQueries'][1]);
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
										if (!queryObj.bStatic && query.includes('#') && !fb.GetFocusItem(true)) { fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.query, scriptName); return; }
										if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) {  // With forced query enabled
											if (query.length && query.toUpperCase() !== 'ALL') { // ALL query never uses forced query!
												query = '(' + query + ') AND (' + defaultArgs.forcedQuery + ')';
											} else if (!query.length) { query = defaultArgs.forcedQuery; } // Empty uses forced query or ALL
										} else if (!query.length) { query = 'ALL'; } // Otherwise empty is replaced with ALL
										if (!queryObj.bStatic && bEvalSel) {
											dynamicQuery({ query, sort: queryObj.sort, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist) });
										} else {
											dynamicQuery({ query, sort: queryObj.sort, bForceStatic: queryObj.bStatic });
										}
									}, flags: queryObj.bStatic ? MF_STRING : selectedFlags
								});
							}
						});
						menu.newSeparator(menuName);
						{ // Static menu: user configurable
							menu.newEntry({
								menuName, entryText: 'By... (query)', func: () => {
									let input = '';
									if (selectedFlags() === MF_STRING) {
										// On first execution, must update from property
										selArg.query = menu_properties['dynamicQueriesCustomArg'][1];
										// Input
										try { input = utils.InputBox(window.ID, 'Enter query:\n\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with ' + (bEvalSel ? 'selected items\' values.' : 'focused item\'s value.') + '\n(see \'Dynamic queries\' readme for more info)', scriptName + ': ' + name, selArg.query, true); }
										catch (e) { return; } // eslint-disable-line no-unused-vars
										if (input.includes('#') && !fb.GetFocusItem(true)) { fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + input, scriptName); return; }
										// Playlist
										const query = forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length ? (input.length && input.toUpperCase() !== 'ALL' ? '(' + input + ') AND (' + defaultArgs.forcedQuery + ')' : input) : (!input.length ? 'ALL' : input);
										const handleList = bEvalSel ? dynamicQuery({ query, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist) }) : dynamicQuery({ query });
										if (!handleList) { fb.ShowPopupMessage('Query failed:\n' + query, scriptName); return; }
										// For internal use original object
										selArg.query = input;
										menu_properties['dynamicQueriesCustomArg'][1] = input; // And update property with new value
										overwriteMenuProperties(); // Updates panel
									} else { // Skip using cached value without selection
										try { input = utils.InputBox(window.ID, 'Enter query:\n\nAlso allowed dynamic variables (which don\'t require a selection), like #NOW#, which will be replaced before execution.\n(see \'Dynamic queries\' readme for more info)', scriptName + ': ' + name, '"$year(%DATE%)" IS #YEAR#', true); }
										catch (e) { return; } // eslint-disable-line no-unused-vars
										// Playlist
										const query = forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length ? (input.length && input.toUpperCase() !== 'ALL' ? '(' + input + ') AND (' + defaultArgs.forcedQuery + ')' : input) : (!input.length ? 'ALL' : input);
										const handleList = dynamicQuery({ query, bForceStatic: true });
										if (!handleList) { fb.ShowPopupMessage('Query failed:\n' + query, scriptName); return; }
									}
								}
							});
							// Menu to configure property
							menu.newSeparator(menuName);
						}
						{	// Add / Remove
							createSubMenuEditEntries(menuName, {
								name,
								list: queryFilter,
								propName: 'dynamicQueries',
								defaults: queryFilterDefaults,
								defaultPreset: folders.xxx + 'presets\\Playlist Tools\\dyn_query_filter\\default.json',
								input: inputDynQuery,
								bDefaultFile: true,
								bCopyCurrent: true
							});
						}
					}
				});
			}
			menu.newSeparator();
		} else { menuDisabled.push({ menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => { return menuAltAllowed.has(entry.subMenuFrom); }).length + disabledCount++, bIsMenu: true }); } // NOSONAR
	}
}