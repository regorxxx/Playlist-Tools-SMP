'use strict';
//19/12/22

// Most played tracks from year
{
	const scriptPath = folders.xxx + 'main\\search\\top_tracks_from_date.js';
	const scriptPathElse = folders.xxx + 'main\\search\\top_tracks.js';
	if (utils.CheckComponent('foo_enhanced_playcount') && _isFile(scriptPath)) {
		const name = 'Most played Tracks from...';
		if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
			include(scriptPath.replace(folders.xxx  + 'main\\', '..\\'));
			readmes[name] = folders.xxx + 'helpers\\readme\\top_tracks_from_date.txt';
			const menuName = menu.newMenu(name);
			menu.newEntry({menuName, entryText: 'Based on play counts within a period:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			{	// Static menus
				const currentYear = new Date().getFullYear();
				const selYearArr = [currentYear, currentYear - 1, currentYear - 2];
				selYearArr.forEach( (selYear) => {
					let selArgs = {year: selYear};
					menu.newEntry({menuName, entryText: 'Most played from ' + selYear, func: (args = {...defaultArgs, ...selArgs}) => {topTracksFromDate(args);}});
				});
			}
			menu.newEntry({menuName, entryText: 'sep'});
			if (_isFile(scriptPathElse)){
				// All years
				include(scriptPathElse);
				menu.newEntry({menuName, entryText: 'Most played (all years)', func: (args = {...defaultArgs}) => {topTracks(args);}});
				menu.newEntry({menuName, entryText: 'sep'});
			}
			{	// Input menu: x year
				menu.newEntry({menuName, entryText: 'From year...', func: () => {
					const selYear = new Date().getFullYear();
					let input;
					try {input = Number(utils.InputBox(window.ID, 'Enter year:', scriptName + ': ' + name, selYear, true));}
					catch (e) {return;}
					if (!Number.isSafeInteger(input)) {return;}
					topTracksFromDate({...defaultArgs,  year: input});
					}});
			}
			{	// Input menu: last x time
				menu.newEntry({menuName, entryText: 'From last...', func: () => {
					let input;
					try {input = utils.InputBox(window.ID, 'Enter a number and time-unit. Can be:\n' + Object.keys(timeKeys).join(', '), scriptName + ': ' + name, '4 WEEKS', true).trim();}
					catch (e) {return;}
					if (!input.length) {return;}
					topTracksFromDate({...defaultArgs,  last: input, bUseLast: true});
					}});
			}
			menu.newEntry({entryText: 'sep'});
		} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
	} else if ((isFoobarV2 || utils.CheckComponent('foo_playcount')) && _isFile(scriptPathElse)) {
		const name = 'Most played Tracks';
		if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
			readmes[name] = folders.xxx + 'helpers\\readme\\top_tracks.txt';
			// All years
			include(scriptPathElse);
			menu.newEntry({entryText: name, func: (args = { ...defaultArgs}) => {topTracks(args);}}); // Skips menu name, added to top
			menu.newEntry({entryText: 'sep'});
		} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length  + disabledCount++});}
	}
}

// Top rated Tracks from year
{
	const scriptPath = folders.xxx + 'main\\search\\top_rated_tracks.js';
	if ((isFoobarV2 || utils.CheckComponent('foo_playcount')) && _isFile(scriptPath)) {
		const name = 'Top rated Tracks from...';
		if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
			include(scriptPath.replace(folders.xxx  + 'main\\', '..\\'));
			readmes[name] = folders.xxx + 'helpers\\readme\\top_rated_tracks.txt';
			const menuName = menu.newMenu(name);
			menu.newEntry({menuName, entryText: 'Based on ratings (' + defaultArgs.ratingLimits.join(' to ') + '):', func: null, flags: MF_GRAYED});
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
				dateQuery = selArgs.forcedQuery.length ? '(' + dateQuery + ') AND (' + selArgs.forcedQuery + ')' : dateQuery;
				const dateName = (selYear.length === 2 && selYear[0] === 0 ? ' before ' + selYear[1] : ' from ' + selYear.join('-'));
				const plsName = 'Top ' + selArgs.playlistLength + ' Rated Tracks ' + dateName;
				return [dateQuery, plsName];
			};
			selYearArr.reverse().forEach( (selYear) => {
				if (selYear === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
				selYear.sort(); // Invariant to order
				let selArgs = { ...defaultArgs};
				[selArgs.forcedQuery, selArgs.playlistName] = queryDateAndName(selArgs, selYear);
				const dateName = (selYear.length === 2 && selYear[0] === 0 ? ' before ' + selYear[1] : ' from ' + selYear.join('-'));
				menu.newEntry({menuName, entryText: 'Top rated' + dateName, func: (args = selArgs) => {topRatedTracks(args);}});
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
			menu.newEntry({entryText: 'sep'});
		} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
	}
}