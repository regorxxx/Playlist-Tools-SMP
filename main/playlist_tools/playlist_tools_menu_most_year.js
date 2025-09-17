'use strict';
//17/09/25

/* global menusEnabled:readable, readmes:readable, menu:readable, forcedQueryMenusEnabled:readable, scriptName:readable, defaultArgs:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable */

/* global MF_GRAYED:readable, folders:readable, _isFile:readable, isEnhPlayCount:readable, timeKeys:readable, isPlayCount:readable, _qCond:readable, globTags:readable, VK_SHIFT:readable, globQuery:readable, queryJoin:readable */

// Most played tracks at year
{
	const scriptPath = folders.xxx + 'main\\search\\top_tracks_from_date.js';
	/* global topTracksFromDate:readable */
	const scriptPathElse = folders.xxx + 'main\\search\\top_tracks.js';
	/* global topTracks:readable, topRatedTracks:readable,  */
	if (isEnhPlayCount && _isFile(scriptPath)) {
		const name = 'Most played Tracks at';
		if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
			include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
			readmes[name] = folders.xxx + 'helpers\\readme\\top_tracks_from_date.txt';
			forcedQueryMenusEnabled[name] = true;
			const menuName = menu.newMenu(name);
			menu.newEntry({ menuName, entryText: 'Based on play counts within a period:', func: null, flags: MF_GRAYED });
			menu.newSeparator(menuName);
			{	// Static menus
				const currentYear = new Date().getFullYear();
				const selYearArr = [currentYear, currentYear - 1, currentYear - 2];
				selYearArr.forEach((selYear) => {
					let selArgs = { year: selYear, bUseLast: false };
					menu.newEntry({
						menuName, entryText: 'Most played at ' + selYear, func: (args = { ...defaultArgs, ...selArgs }) => {
							if (!forcedQueryMenusEnabled[name]) { args.forcedQuery = ''; }
							topTracksFromDate(args);
						}
					});
				});
				menu.newSeparator(menuName);
				menu.newEntry({
					menuName, entryText: 'Most played today', func: (args = { ...defaultArgs }) => {
						if (!forcedQueryMenusEnabled[name]) { args.forcedQuery = ''; }
						const todayQuery = globQuery.lastPlayedFunc.replaceAll('#QUERYEXPRESSION#', 'DURING ' + new Date().toISOString().split('T')[0]);
						topTracksFromDate({
							...args,
							 bUseLast: true,
							 last: '1 DAYS',
							 forcedQuery: queryJoin([todayQuery, args.forcedQuery], 'AND'),
							 playlistName: 'Most played today'
						});
					}
				});
				menu.newEntry({
					menuName, entryText: 'Most played yesterday', func: (args = { ...defaultArgs }) => {
						if (!forcedQueryMenusEnabled[name]) { args.forcedQuery = ''; }
						const now = new Date();
						now.setDate(now.getDate() - 1);
						const todayQuery = globQuery.lastPlayedFunc.replaceAll('#QUERYEXPRESSION#', 'DURING ' + now.toISOString().split('T')[0]);
						topTracksFromDate({
							...args,
							 bUseLast: true,
							 last: '2 DAYS',
							 forcedQuery: queryJoin([todayQuery, args.forcedQuery], 'AND'),
							 playlistName: 'Most played yesterday'
						});
					}
				});
				const options = [
					{ name: 'day', arg: '1 DAYS' },
					{ name: 'week', arg: '1 WEEKS' },
					{ name: 'month', arg: '4 WEEKS' },
					{ name: 'trimester', arg: '12 WEEKS' },
					{ name: 'year', arg: '52 WEEKS' }
				];
				options.forEach((option) => {
					let selArgs = { last: option.arg, bUseLast: true };
					menu.newEntry({
						menuName, entryText: 'Most played last ' + option.name, func: (args = { ...defaultArgs, ...selArgs }) => {
							if (!forcedQueryMenusEnabled[name]) { args.forcedQuery = ''; }
							topTracksFromDate(args);
						}
					});
				});
			}
			menu.newSeparator(menuName);
			if (_isFile(scriptPathElse)) {
				// All years
				include(scriptPathElse);
				menu.newEntry({
					menuName, entryText: 'Most played (all years)', func: (args = { ...defaultArgs }) => {
						if (!forcedQueryMenusEnabled[name]) { args.forcedQuery = ''; }
						topTracks(args);
					}
				});
				menu.newSeparator(menuName);
			}
			{	// Input menu: x year
				menu.newEntry({
					menuName, entryText: 'At year...', func: () => {
						const selYear = new Date().getFullYear();
						let input;
						try { input = Number(utils.InputBox(window.ID, 'Enter year:', scriptName + ': ' + name, selYear, true)); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (!Number.isSafeInteger(input)) { return; }
						const args = { ...defaultArgs, year: input, bUseLast: false };
						if (!forcedQueryMenusEnabled[name]) { args.forcedQuery = ''; }
						topTracksFromDate(args);
					}
				});
			}
			{	// Input menu: last x time
				menu.newEntry({
					menuName, entryText: 'Since last...', func: () => {
						let input;
						try { input = utils.InputBox(window.ID, 'Enter a number and time-unit. Can be:\n' + Object.keys(timeKeys).join(', '), scriptName + ': ' + name, '4 WEEKS', true).trim(); }
						catch (e) { return; } // eslint-disable-line no-unused-vars
						if (!input.length) { return; }
						const args = { ...defaultArgs, last: input, bUseLast: true };
						if (!forcedQueryMenusEnabled[name]) { args.forcedQuery = ''; }
						topTracksFromDate(args);
					}
				});
			}
			menu.newSeparator();
		} else { menuDisabled.push({ menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); } // NOSONAR
	} else if (isPlayCount && _isFile(scriptPathElse)) {
		const name = 'Most played Tracks';
		if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
			readmes[name] = folders.xxx + 'helpers\\readme\\top_tracks.txt';
			// All years
			include(scriptPathElse);
			menu.newEntry({
				entryText: name, func: (args = { ...defaultArgs }) => {
					if (!forcedQueryMenusEnabled[name]) { args.forcedQuery = ''; }
					topTracks(args);
				}
			}); // Skips menu name, added to top
			menu.newSeparator();
		} else { menuDisabled.push({ menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
	}
}


// Top played/rated Tracks from year
{
	const namePlay = 'Top played Tracks from';
	const nameRate = 'Top rated Tracks from';
	if (isPlayCount) {
		if ((!Object.hasOwn(menusEnabled, namePlay) || menusEnabled[nameRate] === true) || (!Object.hasOwn(menusEnabled, nameRate) || menusEnabled[nameRate] === true)) {
			{	// Top played Tracks from year
				const scriptPath = folders.xxx + 'main\\search\\top_tracks.js';
				if (_isFile(scriptPath)) {
					const name = namePlay;
					if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
						include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
						readmes[name] = folders.xxx + 'helpers\\readme\\top_rated_tracks.txt';
						forcedQueryMenusEnabled[name] = true;
						const menuName = menu.newMenu(name);
						menu.newEntry({ menuName, entryText: 'Shift + Click to randomize:', func: null, flags: MF_GRAYED });
						menu.newSeparator(menuName);
						const currentYear = new Date().getFullYear();
						const fromTo = [1950, Math.ceil(currentYear / 10) * 10];
						const step = 10;
						const selYearArr = [];
						for (let i = fromTo[0]; i < fromTo[1]; i += step) {
							selYearArr.push([i, Math.min(i + step, currentYear)]);
						}
						selYearArr.push('sep', [fromTo[1] - 20, currentYear], 'sep', [currentYear - 1], [currentYear]);
						if (selYearArr.length > 20) { selYearArr.length = 20; } // Safecheck
						selYearArr.splice(0, 0, [0, selYearArr[0][0]], 'sep');
						const queryDateAndName = (selArgs, selYear) => {
							let dateQuery = '';
							if (selYear.length === 2) {
								dateQuery = _qCond(globTags.date) + ' GREATER ' + (selYear[0] - 1) + ' AND ' + _qCond(globTags.date) + ' LESS ' + (selYear[1] + 1);
							} else {
								dateQuery = _qCond(globTags.date) + ' IS ' + selYear;
							}
							if (!forcedQueryMenusEnabled[name]) { selArgs.forcedQuery = ''; }
							dateQuery = selArgs.forcedQuery.length ? '(' + dateQuery + ') AND (' + selArgs.forcedQuery + ')' : dateQuery;
							const dateName = (selYear.length === 2 && selYear[0] === 0 ? ' before ' + selYear[1] : ' from ' + selYear.join('-'));
							const plsName = 'Top ' + selArgs.playlistLength + ' Played Tracks ' + dateName;
							return [dateQuery, plsName];
						};
						selYearArr.reverse().forEach((selYear) => {
							if (menu.isSeparator(selYear)) { menu.newSeparator(menuName); return; }
							selYear.sort(); // Invariant to order
							const dateName = (selYear.length === 2 && selYear[0] === 0 ? ' before ' + selYear[1] : ' from ' + selYear.join('-'));
							menu.newEntry({
								menuName, entryText: 'Top played' + dateName, func: (args = { ...defaultArgs }) => {
									if (utils.IsKeyPressed(VK_SHIFT)) { args.sortBy = ''; } // Random on shift
									[args.forcedQuery, args.playlistName] = queryDateAndName(args, selYear);
									topTracks(args);
								}
							});
						});
						menu.newSeparator(menuName);
						{	// Input menu
							menu.newEntry({
								menuName, entryText: 'From year...', func: () => {
									let selYear = new Date().getFullYear();
									try { selYear = utils.InputBox(window.ID, 'Enter year or range of years\n(pair separated by comma)', scriptName + ': ' + name, selYear, true); }
									catch (e) { return; } // eslint-disable-line no-unused-vars
									if (!selYear.length) { return; }
									selYear = selYear.split(','); // May be a range or a number
									for (let i = 0; i < selYear.length; i++) {
										selYear[i] = Number(selYear[i]);
										if (!Number.isSafeInteger(selYear[i])) { return; }
									}
									selYear.sort(); // Invariant to order
									let selArgs = { ...defaultArgs };
									[selArgs.forcedQuery, selArgs.playlistName] = queryDateAndName(selArgs, selYear);
									topTracks(selArgs);
								}
							});
						}
					} else { menuDisabled.push({ menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
				}
			}
			{	// Top rated Tracks from year
				const scriptPath = folders.xxx + 'main\\search\\top_rated_tracks.js';
				if (_isFile(scriptPath)) {
					const name = nameRate;
					if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
						include(scriptPath.replace(folders.xxx + 'main\\', '..\\'));
						readmes[name] = folders.xxx + 'helpers\\readme\\top_rated_tracks.txt';
						forcedQueryMenusEnabled[name] = true;
						const menuName = menu.newMenu(name);
						menu.newEntry({ menuName, entryText: 'Shift + Click to randomize:', func: null, flags: MF_GRAYED });
						menu.newSeparator(menuName);
						const currentYear = new Date().getFullYear();
						const fromTo = [1950, Math.ceil(currentYear / 10) * 10];
						const step = 10;
						const selYearArr = [];
						for (let i = fromTo[0]; i < fromTo[1]; i += step) {
							selYearArr.push([i, Math.min(i + step, currentYear)]);
						}
						selYearArr.push('sep', [fromTo[1] - 20, currentYear], 'sep', [currentYear - 1], [currentYear]);
						if (selYearArr.length > 20) { selYearArr.length = 20; } // Safecheck
						selYearArr.splice(0, 0, [0, selYearArr[0][0]], 'sep');
						const queryDateAndName = (selArgs, selYear) => {
							let dateQuery = '';
							if (selYear.length === 2) {
								dateQuery = _qCond(globTags.date) + ' GREATER ' + (selYear[0] - 1) + ' AND ' + _qCond(globTags.date) + ' LESS ' + (selYear[1] + 1);
							} else {
								dateQuery = _qCond(globTags.date) + ' IS ' + selYear;
							}
							if (!forcedQueryMenusEnabled[name]) { selArgs.forcedQuery = ''; }
							dateQuery = selArgs.forcedQuery.length ? '(' + dateQuery + ') AND (' + selArgs.forcedQuery + ')' : dateQuery;
							const dateName = (selYear.length === 2 && selYear[0] === 0 ? ' before ' + selYear[1] : ' from ' + selYear.join('-'));
							const plsName = 'Top ' + selArgs.playlistLength + ' Rated Tracks ' + dateName;
							return [dateQuery, plsName];
						};
						selYearArr.reverse().forEach((selYear) => {
							if (menu.isSeparator(selYear)) { menu.newSeparator(menuName); return; }
							selYear.sort(); // Invariant to order
							const dateName = (selYear.length === 2 && selYear[0] === 0 ? ' before ' + selYear[1] : ' from ' + selYear.join('-'));
							menu.newEntry({
								menuName, entryText: 'Top rated' + dateName, func: (args = { ...defaultArgs }) => {
									if (utils.IsKeyPressed(VK_SHIFT)) { args.sortBy = ''; } // Random on shift
									[args.forcedQuery, args.playlistName] = queryDateAndName(args, selYear);
									topRatedTracks(args);
								}
							});
						});
						menu.newSeparator(menuName);
						{	// Input menu
							menu.newEntry({
								menuName, entryText: 'From year...', func: () => {
									let selYear = new Date().getFullYear();
									try { selYear = utils.InputBox(window.ID, 'Enter year or range of years\n(pair separated by comma)', scriptName + ': ' + name, selYear, true); }
									catch (e) { return; } // eslint-disable-line no-unused-vars
									if (!selYear.length) { return; }
									selYear = selYear.split(','); // May be a range or a number
									for (let i = 0; i < selYear.length; i++) {
										selYear[i] = Number(selYear[i]);
										if (!Number.isSafeInteger(selYear[i])) { return; }
									}
									selYear.sort(); // Invariant to order
									let selArgs = { ...defaultArgs };
									[selArgs.forcedQuery, selArgs.playlistName] = queryDateAndName(selArgs, selYear);
									topRatedTracks(selArgs);
								}
							});
						}
					} else { menuDisabled.push({ menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true }); }
				}
			}
			menu.newSeparator();
		} else {
			menuDisabled.push({ menuName: namePlay, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true });
			menuDisabled.push({ menuName: nameRate, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => menuAltAllowed.has(entry.subMenuFrom)).length + disabledCount++, bIsMenu: true });
		}
	}
}