'use strict';
//29/11/23

// Most played tracks at year
{
	const scriptPath = folders.xxx + 'main\\search\\top_tracks_from_date.js';
	const scriptPathElse = folders.xxx + 'main\\search\\top_tracks.js';
	if (isEnhPlayCount && _isFile(scriptPath)) {
		const name = 'Most played Tracks at...';
		if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
			include(scriptPath.replace(folders.xxx  + 'main\\', '..\\'));
			readmes[name] = folders.xxx + 'helpers\\readme\\top_tracks_from_date.txt';
			forcedQueryMenusEnabled[name] = true;
			const menuName = menu.newMenu(name);
			menu.newEntry({menuName, entryText: 'Based on play counts within a period:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			{	// Static menus
				const currentYear = new Date().getFullYear();
				const selYearArr = [currentYear, currentYear - 1, currentYear - 2];
				selYearArr.forEach( (selYear) => {
					let selArgs = {year: selYear};
					menu.newEntry({menuName, entryText: 'Most played at ' + selYear, func: (args = {...defaultArgs, ...selArgs}) => {
						if (!forcedQueryMenusEnabled[name]) {args.forcedQuery = '';}
						topTracksFromDate(args);
					}});
				});
			}
			menu.newEntry({menuName, entryText: 'sep'});
			if (_isFile(scriptPathElse)){
				// All years
				include(scriptPathElse);
				menu.newEntry({menuName, entryText: 'Most played (all years)', func: (args = {...defaultArgs}) => {
					if (!forcedQueryMenusEnabled[name]) {args.forcedQuery = '';}
					topTracks(args);
				}});
				menu.newEntry({menuName, entryText: 'sep'});
			}
			{	// Input menu: x year
				menu.newEntry({menuName, entryText: 'At year...', func: () => {
					const selYear = new Date().getFullYear();
					let input;
					try {input = Number(utils.InputBox(window.ID, 'Enter year:', scriptName + ': ' + name, selYear, true));}
					catch (e) {return;}
					if (!Number.isSafeInteger(input)) {return;}
					const args = {...defaultArgs,  last: input, bUseLast: true};
					if (!forcedQueryMenusEnabled[name]) {args.forcedQuery = '';}
					topTracksFromDate(args);
					}});
			}
			{	// Input menu: last x time
				menu.newEntry({menuName, entryText: 'Since last...', func: () => {
					let input;
					try {input = utils.InputBox(window.ID, 'Enter a number and time-unit. Can be:\n' + Object.keys(timeKeys).join(', '), scriptName + ': ' + name, '4 WEEKS', true).trim();}
					catch (e) {return;}
					if (!input.length) {return;}
					const args = {...defaultArgs,  last: input, bUseLast: true};
					if (!forcedQueryMenusEnabled[name]) {args.forcedQuery = '';}
					topTracksFromDate(args);
					}});
			}
			menu.newEntry({entryText: 'sep'});
		} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++, bIsMenu: true});}
	} else if (isPlayCount && _isFile(scriptPathElse)) {
		const name = 'Most played Tracks';
		if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
			readmes[name] = folders.xxx + 'helpers\\readme\\top_tracks.txt';
			// All years
			include(scriptPathElse);
			menu.newEntry({entryText: name, func: (args = { ...defaultArgs}) => {
				if (!forcedQueryMenusEnabled[name]) {args.forcedQuery = '';}
				topTracks(args);
			}}); // Skips menu name, added to top
			menu.newEntry({entryText: 'sep'});
		} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length  + disabledCount++, bIsMenu: true});}
	}
}


// Top played/rated Tracks from year
{
	const namePlay = 'Top played Tracks from...';
	const nameRate = 'Top rated Tracks from...';
	if (isPlayCount) {
		if ((!menusEnabled.hasOwnProperty(namePlay) || menusEnabled[nameRate] === true) || (!menusEnabled.hasOwnProperty(nameRate) || menusEnabled[nameRate] === true)) {
			{	// Top played Tracks from year
				const scriptPath = folders.xxx + 'main\\search\\top_tracks.js';
				if (_isFile(scriptPath)) {
					const name = namePlay;
					if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
						include(scriptPath.replace(folders.xxx  + 'main\\', '..\\'));
						readmes[name] = folders.xxx + 'helpers\\readme\\top_rated_tracks.txt';
						forcedQueryMenusEnabled[name] = true;
						const menuName = menu.newMenu(name);
						menu.newEntry({menuName, entryText: 'Shift + Click to randomize:', func: null, flags: MF_GRAYED});
						menu.newEntry({menuName, entryText: 'sep'});
						const currentYear = new Date().getFullYear();
						const fromTo = [1950, Math.ceil(currentYear / 10) * 10];
						const step = 10;
						const selYearArr = [];
						for (let i = fromTo[0]; i < fromTo[1]; i += step) {
							selYearArr.push([i, Math.min(i + step, currentYear)]);
						}
						selYearArr.push('sep', [fromTo[1] - 20, currentYear], 'sep', [currentYear - 1], [currentYear]);
						if (selYearArr.length > 20) {selYearArr.length = 20;} // Safecheck
						selYearArr.splice(0, 0, [0, selYearArr[0][0]], 'sep');
						const queryDateAndName = (selArgs, selYear) => {
							let dateQuery = '';
							if (selYear.length === 2) {
								dateQuery = _q(globTags.date) + ' GREATER ' + selYear[0] + ' AND ' + _q(globTags.date) + ' LESS ' +  selYear[1];
							} else {
								dateQuery = _q(globTags.date) + ' IS ' + selYear;
							}
							if (!forcedQueryMenusEnabled[name]) {selArgs.forcedQuery = '';}
							dateQuery = selArgs.forcedQuery.length ? '(' + dateQuery + ') AND (' + selArgs.forcedQuery + ')' : dateQuery;
							const dateName = (selYear.length === 2 && selYear[0] === 0 ? ' before ' + selYear[1] : ' from ' + selYear.join('-'));
							const plsName = 'Top ' + selArgs.playlistLength + ' Played Tracks ' + dateName;
							return [dateQuery, plsName];
						};
						selYearArr.reverse().forEach( (selYear) => {
							if (selYear === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
							selYear.sort(); // Invariant to order
							const dateName = (selYear.length === 2 && selYear[0] === 0 ? ' before ' + selYear[1] : ' from ' + selYear.join('-'));
							menu.newEntry({menuName, entryText: 'Top played' + dateName, func: (args = { ...defaultArgs}) => {
								if (utils.IsKeyPressed(VK_SHIFT)) {args.sortBy = '';} // Random on shift
								[args.forcedQuery, args.playlistName] = queryDateAndName(args, selYear);
								topTracks(args);
							}});
						});
						menu.newEntry({menuName, entryText: 'sep'});
						{	// Input menu
							menu.newEntry({menuName, entryText: 'From year...', func: () => {
								let selYear = new Date().getFullYear();
								try {selYear = utils.InputBox(window.ID, 'Enter year or range of years\n(pair separated by comma)', scriptName + ': ' + name, selYear, true);}
								catch (e) {return;}
								if (!selYear.length) {return;}
								selYear = selYear.split(','); // May be a range or a number
								for (let i = 0; i < selYear.length; i++) {
									selYear[i] = Number(selYear[i]);
									if (!Number.isSafeInteger(selYear[i])) {return;}
								}
								selYear.sort(); // Invariant to order
								let selArgs = { ...defaultArgs};
								[selArgs.forcedQuery, selArgs.playlistName] = queryDateAndName(selArgs, selYear);
								topTracks(selArgs);
							}});
						}
					} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++, bIsMenu: true});}
				}
			}
			{	// Top rated Tracks from year
				const scriptPath = folders.xxx + 'main\\search\\top_rated_tracks.js';
				if (_isFile(scriptPath)) {
					const name = nameRate;
					if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
						include(scriptPath.replace(folders.xxx  + 'main\\', '..\\'));
						readmes[name] = folders.xxx + 'helpers\\readme\\top_rated_tracks.txt';
						forcedQueryMenusEnabled[name] = true;
						const menuName = menu.newMenu(name);
						menu.newEntry({menuName, entryText: 'Shift + Click to randomize:', func: null, flags: MF_GRAYED});
						menu.newEntry({menuName, entryText: 'sep'});
						const currentYear = new Date().getFullYear();
						const fromTo = [1950, Math.ceil(currentYear / 10) * 10];
						const step = 10;
						const selYearArr = [];
						for (let i = fromTo[0]; i < fromTo[1]; i += step) {
							selYearArr.push([i, Math.min(i + step, currentYear)]);
						}
						selYearArr.push('sep', [fromTo[1] - 20, currentYear], 'sep', [currentYear - 1], [currentYear]);
						if (selYearArr.length > 20) {selYearArr.length = 20;} // Safecheck
						selYearArr.splice(0, 0, [0, selYearArr[0][0]], 'sep');
						const queryDateAndName = (selArgs, selYear) => {
							let dateQuery = '';
							if (selYear.length === 2) {
								dateQuery = _q(globTags.date) + ' GREATER ' + selYear[0] + ' AND ' + _q(globTags.date) + ' LESS ' +  selYear[1];
							} else {
								dateQuery = _q(globTags.date) + ' IS ' + selYear;
							}
							if (!forcedQueryMenusEnabled[name]) {selArgs.forcedQuery = '';}
							dateQuery = selArgs.forcedQuery.length ? '(' + dateQuery + ') AND (' + selArgs.forcedQuery + ')' : dateQuery;
							const dateName = (selYear.length === 2 && selYear[0] === 0 ? ' before ' + selYear[1] : ' from ' + selYear.join('-'));
							const plsName = 'Top ' + selArgs.playlistLength + ' Rated Tracks ' + dateName;
							return [dateQuery, plsName];
						};
						selYearArr.reverse().forEach( (selYear) => {
							if (selYear === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
							selYear.sort(); // Invariant to order
							const dateName = (selYear.length === 2 && selYear[0] === 0 ? ' before ' + selYear[1] : ' from ' + selYear.join('-'));
							menu.newEntry({menuName, entryText: 'Top rated' + dateName, func: (args = { ...defaultArgs}) => {
								if (utils.IsKeyPressed(VK_SHIFT)) {args.sortBy = '';} // Random on shift
								[args.forcedQuery, args.playlistName] = queryDateAndName(args, selYear);
								topRatedTracks(args);
							}});
						});
						menu.newEntry({menuName, entryText: 'sep'});
						{	// Input menu
							menu.newEntry({menuName, entryText: 'From year...', func: () => {
								let selYear = new Date().getFullYear();
								try {selYear = utils.InputBox(window.ID, 'Enter year or range of years\n(pair separated by comma)', scriptName + ': ' + name, selYear, true);}
								catch (e) {return;}
								if (!selYear.length) {return;}
								selYear = selYear.split(','); // May be a range or a number
								for (let i = 0; i < selYear.length; i++) {
									selYear[i] = Number(selYear[i]);
									if (!Number.isSafeInteger(selYear[i])) {return;}
								}
								selYear.sort(); // Invariant to order
								let selArgs = { ...defaultArgs};
								[selArgs.forcedQuery, selArgs.playlistName] = queryDateAndName(selArgs, selYear);
								topRatedTracks(selArgs);
							}});
						}
					} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++, bIsMenu: true});}
				}
			}
			menu.newEntry({entryText: 'sep'});
		} else {
			menuDisabled.push({menuName: namePlay, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++, bIsMenu: true});
			menuDisabled.push({menuName: nameRate, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++, bIsMenu: true});
		}
	}
}