'use strict';
//16/10/22

// Selection manipulation...
{
	const name = 'Selection manipulation';
	if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
		readmes[newReadmeSep()] = 'sep';
		let menuName = menu.newMenu(name);
		{	// Legacy Sort
			const name = 'Sort...';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				const subMenuName = menu.newMenu(name, menuName);
				{	// Legacy Sort (for use with macros!!)
					const selArgs = [
						{name: 'Randomize', func: (idx) => {plman.SortByFormat(idx, '', true);}},
						{name: 'Reverse', func: () => {fb.RunMainMenuCommand('Edit/Selection/Sort/Reverse');}},
						{name: 'sep'}
					];
					let sortLegacy = [
						{name: 'Sort by Mood', tfo: '%' + globTags.mood + '%'},
						{name: 'Sort by Date', tfo: globTags.date},
						{name: 'Sort by BPM', tfo: '%' + globTags.bpm + '%'}
					];
					let selArg = {name: 'Custom', tfo: sortLegacy[0].tfo};
					const sortLegacyDefaults = [...sortLegacy];
					// Create new properties with previous args
					menu_properties['sortLegacy'] = [menuName + '\\' + name + '  entries', JSON.stringify(sortLegacy)];
					menu_properties['sortLegacyCustomArg'] = [menuName + '\\' + name + ' Dynamic menu custom args', JSON.stringify(selArg)];
					// Check
					menu_properties['sortLegacy'].push({func: isJSON}, menu_properties['sortLegacy'][1]);
					menu_properties['sortLegacyCustomArg'].push({func: isJSON}, menu_properties['sortLegacyCustomArg'][1]);
					// Menus
					menu.newEntry({menuName: subMenuName, entryText: 'Sort selection (legacy):', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					// Static menus
					selArgs.forEach( (selArg) => {
						if (selArg.name === 'sep') {
							menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						} else {
							let entryText = selArg.name;
							menu.newEntry({menuName: subMenuName, entryText, func: () => {
								const ap = plman.ActivePlaylist;
								if (ap === -1) {return;}
								selArg.func(ap);
							}, flags: multipleSelectedFlagsReorder});
						}
					});
					menu.newCondEntry({entryText: 'Sort selection (legacy)... (cond)', condFunc: () => {
						// Entry list
						sortLegacy = JSON.parse(menu_properties['sortLegacy'][1]);
						sortLegacy.forEach( (sortObj) => {
							// Add separators
							if (sortObj.hasOwnProperty('name') && sortObj.name === 'sep') {
								menu.newEntry({menuName: subMenuName, entryText: 'sep'});
							} else { 
								// Create names for all entries
								let sortName = sortObj.name;
								sortName = sortName.length > 40 ? sortName.substring(0,40) + ' ...' : sortName;
								// Entries
								menu.newEntry({menuName: subMenuName, entryText: sortName, func: () => {
									const ap = plman.ActivePlaylist;
									if (ap === -1) {return;}
									plman.UndoBackup(ap);
									plman.SortByFormat(ap, sortObj.tfo, true);
								}, flags: multipleSelectedFlagsReorder});
							}
						});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						{ // Static menu: user configurable
							menu.newEntry({menuName: subMenuName, entryText: 'By... (expression)', func: () => {
								const ap = plman.ActivePlaylist;
								if (ap === -1) {return;}
								// On first execution, must update from property
								selArg.tfo = JSON.parse(menu_properties['sortLegacyCustomArg'][1]).tfo;
								// Input
								let tfo;
								try {tfo = utils.InputBox(window.ID, 'Enter TF expression:', scriptName + ': ' + name, selArg.tfo, true);}
								catch (e) {return;}
								if (!tfo.length) {return;}
								// Execute
								plman.UndoBackup(ap);
								plman.SortByFormat(ap, tfo, true);
								// For internal use original object
								selArg.tfo = tfo;
								menu_properties['sortLegacyCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
								overwriteMenuProperties(); // Updates panel
							}, flags: multipleSelectedFlagsReorder});
							// Menu to configure property
							menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						}
						{	// Add / Remove
							menu.newEntry({menuName: subMenuName, entryText: 'Add new entry to list...' , func: () => {
								// Input all variables
								let input;
								let entryName = '';
								try {entryName = utils.InputBox(window.ID, 'Enter name for menu entry\nWrite \'sep\' to add a line.', scriptName + ': ' + name, '', true);}
								catch (e) {return;}
								if (!entryName.length) {return;}
								if (entryName === 'sep') {input = {name: entryName};} // Add separator
								else { // or new entry
									let tfo = '';
									try {tfo = utils.InputBox(window.ID, 'Enter TF expression:', scriptName + ': ' + name, selArg.tfo, true);}
									catch (e) {return;}
									if (!tfo.length) {return;}
									input = {name: entryName, tfo};
								}
								// Add entry
								sortLegacy.push(input);
								// Save as property
								menu_properties['sortLegacy'][1] = JSON.stringify(sortLegacy); // And update property with new value
								// Presets
								if (!presets.hasOwnProperty('sortLegacy')) {presets.sortLegacy = [];}
								presets.sortLegacy.push(input);
								menu_properties['presets'][1] = JSON.stringify(presets);
								overwriteMenuProperties(); // Updates panel
							}});
							{
								const subMenuSecondName = menu.newMenu('Remove entry from list...' + nextId('invisible', true, false), subMenuName);
								sortLegacy.forEach( (sortObj, index) => {
									const entryText = (sortObj.name === 'sep' ? '------(separator)------' : (sortObj.name.length > 40 ? sortObj.name.substring(0,40) + ' ...' : sortObj.name));
									menu.newEntry({menuName: subMenuSecondName, entryText, func: () => {
										sortLegacy.splice(index, 1);
										menu_properties['sortLegacy'][1] = JSON.stringify(sortLegacy);
										// Presets
										if (presets.hasOwnProperty('sortLegacy')) {
											presets.sortLegacy.splice(presets.sortLegacy.findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(sortObj);}), 1);
											if (!presets.sortLegacy.length) {delete presets.sortLegacy;}
											menu_properties['presets'][1] = JSON.stringify(presets);
										}
										overwriteMenuProperties(); // Updates panel
									}});
								});
								if (!sortLegacy.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
								menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
								menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
									sortLegacy = [...sortLegacyDefaults];
									menu_properties['sortLegacy'][1] = JSON.stringify(sortLegacy);
									// Presets
									if (presets.hasOwnProperty('sortLegacy')) {
										delete presets.sortLegacy;
										menu_properties['presets'][1] = JSON.stringify(presets);
									}
									overwriteMenuProperties(); // Updates panel
								}});
							}
						}
					}});
				}
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
		{	// Advanced Sort
			const name = 'Advanced sort...';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				// Menus
				const subMenuName = menu.newMenu(name, menuName);
				menu.newEntry({menuName: subMenuName, entryText: 'Sort selection (algorithm):', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				const selArgs = [];
				{	// Sort by key
					const scriptPath = folders.xxx + 'main\\sort_by_key.js';
					if (_isFile(scriptPath)){
						include(scriptPath);
						readmes[name + '\\' + 'Sort by Key'] = folders.xxx + 'helpers\\readme\\sort_by_key.txt';
						if (selArgs.length) {selArgs.push({name: 'sep'});}
						[
							{name: 'Incremental key (Camelot Wheel)', 	func: sortByKey, args: {sortOrder: 1}},
							{name: 'Decremental key (Camelot Wheel)',	func: sortByKey, args: {sortOrder: -1}},
						].forEach((val) => {selArgs.push(val);});
					}
				}
				{	// Sort by DynGenre
					const scriptPath = folders.xxx + 'main\\sort_by_dyngenre.js';
					if (_isFile(scriptPath)){
						include(scriptPath);
						readmes[name + '\\' + 'Sort by DynGenre'] = folders.xxx + 'helpers\\readme\\sort_by_dyngenre.txt';
						if (selArgs.length) {selArgs.push({name: 'sep'});}
						[
							{name: 'Incremental genre/styles (DynGenre)', func: sortByDyngenre, args: {sortOrder: 1}},
							{name: 'Decremental genre/styles (DynGenre)', func: sortByDyngenre, args: {sortOrder: -1}},
						].forEach((val) => {selArgs.push(val);});
					}
				}
				// Menus
				selArgs.forEach( (selArg) => {
					if (selArg.name === 'sep') {
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					} else {
						let entryText = selArg.name;
						menu.newEntry({menuName: subMenuName, entryText, func: (args = {...defaultArgs, ...selArg.args}) => {selArg.func(args);}, flags: multipleSelectedFlagsReorder});
					}
				});
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
		{	// Scatter
			const scriptPath = folders.xxx + 'main\\scatter_by_tags.js';
			if (_isFile(scriptPath)){
				const name = 'Scatter by tags';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath);
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\scatter_by_tags.txt';
					const subMenuName = menu.newMenu(name, menuName);
					const selArgs = [
						{name: 'Scatter instrumental tracks'	, 	args: {tagName: [globTags.genre, globTags.style].join(','), tagValue: 'instrumental,jazz,instrumental rock'}},
						{name: 'Scatter acoustic tracks'		, 	args: {tagName: [globTags.genre, globTags.style, globTags.mood].join(','), tagValue: 'acoustic'}},
						{name: 'Scatter electronic tracks'		,	args: {tagName: [globTags.genre, globTags.style].join(','), tagValue: 'electronic'}},
						{name: 'Scatter female vocal tracks'	,	args: {tagName: [globTags.genre, globTags.style].join(','), tagValue: 'female vocal'}},
						{name: 'sep'},
						{name: 'Scatter sad mood tracks'		,	args: {tagName: globTags.mood, tagValue: 'sad'}},
						{name: 'Scatter aggressive mood tracks', 	args: {tagName: globTags.mood, tagValue: 'aggressive'}},
						{name: 'sep'},
						{name: 'Intercalate same artist tracks'		,	args: {tagName: globTags.artist, tagValue: null}},
						{name: 'Intercalate same genre tracks'		,	args: {tagName: globTags.genre, tagValue: null}},
						{name: 'Intercalate same style tracks'		,	args: {tagName: globTags.style, tagValue: null}}

					];
					// Menus
					menu.newEntry({menuName: subMenuName, entryText: 'Sort avoiding repeating tags:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					selArgs.forEach( (selArg) => {
						if (selArg.name === 'sep') {
							menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						} else {
							let entryText = selArg.name;
							menu.newEntry({menuName: subMenuName, entryText, func: (args = {...defaultArgs, ...selArg.args}) => {
							if (args.tagValue !== null) {scatterByTags(args);} else {intercalateByTags(args);}
							}, flags: multipleSelectedFlagsReorder});
						}
					});
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Shuffle
			const scriptPath = folders.xxx + 'main\\scatter_by_tags.js';
			if (_isFile(scriptPath)){
				const name = 'Shuffle by tags';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath);
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\shuffle_by_tags.txt';
					const subMenuName = menu.newMenu(name, menuName);
					let shuffle = [
						{name: 'Shuffle by artist'	,	args: {tagName: globTags.artist}},
						{name: 'Shuffle by genre'	,	args: {tagName: globTags.genre}},
						{name: 'Shuffle by style'	,	args: {tagName: globTags.style}}
					];
					let selArg = {name: 'Custom', args: shuffle[0].args};
					const shuffleDefaults = [...shuffle];
					// Create new properties with previous args
					menu_properties['shuffle'] = [menuName + '\\' + name + '  entries', JSON.stringify(shuffle)];
					menu_properties['shuffleCustomArg'] = [menuName + '\\' + name + ' Dynamic menu custom args', JSON.stringify(selArg)];
					// Check
					menu_properties['shuffle'].push({func: isJSON}, menu_properties['shuffle'][1]);
					menu_properties['shuffleCustomArg'].push({func: isJSON}, menu_properties['shuffleCustomArg'][1]);
					// Menus
					menu.newEntry({menuName: subMenuName, entryText: 'Smart shuffle (Spotify-like):', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newCondEntry({entryText: 'Shuffle... (cond)', condFunc: () => {
						// Entry list
						shuffle = JSON.parse(menu_properties['shuffle'][1]);
						shuffle.forEach( (shuffleObj) => {
							// Add separators
							if (shuffleObj.hasOwnProperty('name') && shuffleObj.name === 'sep') {
								menu.newEntry({menuName: subMenuName, entryText: 'sep'});
							} else { 
								// Create names for all entries
								let shuffleName = shuffleObj.name;
								shuffleName = shuffleName.length > 40 ? shuffleName.substring(0,40) + ' ...' : shuffleName;
								// Entries
								menu.newEntry({menuName: subMenuName, entryText: shuffleName, func: () => {
									shuffleByTags(shuffleObj.args);
								}, flags: multipleSelectedFlagsReorder});
							}
						});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						{	// Static menu: user configurable
							menu.newEntry({menuName: subMenuName, entryText: 'By... (tag)', func: () => {
								const ap = plman.ActivePlaylist;
								if (ap === -1) {return;}
								// On first execution, must update from property
								selArg.args.tagName = JSON.parse(menu_properties['shuffleCustomArg'][1]).args.tagName;
								// Input
								let tagName;
								try {tagName = utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(multiple values may be separated by \';\')', scriptName + ': ' + name, selArg.args.tagName, true);}
								catch (e) {return;}
								if (!tagName.length) {return;}
								// Execute
								huffleByTags({tagName});
								// For internal use original object
								selArg.args.tagName = tagName;
								menu_properties['shuffleCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
								overwriteMenuProperties(); // Updates panel
							}, flags: multipleSelectedFlagsReorder});
							menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						}
						{	// Add / Remove
							menu.newEntry({menuName: subMenuName, entryText: 'Add new entry to list...' , func: () => {
								// Input all variables
								let input;
								let entryName = '';
								try {entryName = utils.InputBox(window.ID, 'Enter name for menu entry\nWrite \'sep\' to add a line.', scriptName + ': ' + name, '', true);}
								catch (e) {return;}
								if (!entryName.length) {return;}
								if (entryName === 'sep') {input = {name: entryName};} // Add separator
								else { // or new entry
									let tagName = '';
									try {tagName = utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(multiple values may be separated by \';\')', scriptName + ': ' + name, selArg.args.tagName, true);}
									catch (e) {return;}
									if (!tagName.length) {return;}
									input = {name: entryName, args: {tagName}};
								}
								// Add entry
								shuffle.push(input);
								// Save as property
								menu_properties['shuffle'][1] = JSON.stringify(shuffle); // And update property with new value
								// Presets
								if (!presets.hasOwnProperty('shuffle')) {presets.shuffle = [];}
								presets.shuffle.push(input);
								menu_properties['presets'][1] = JSON.stringify(presets);
								overwriteMenuProperties(); // Updates panel
							}});
							{
								const subMenuSecondName = menu.newMenu('Remove entry from list...' + nextId('invisible', true, false), subMenuName);
								shuffle.forEach( (sortObj, index) => {
									const entryText = (sortObj.name === 'sep' ? '------(separator)------' : (sortObj.name.length > 40 ? sortObj.name.substring(0,40) + ' ...' : sortObj.name));
									menu.newEntry({menuName: subMenuSecondName, entryText, func: () => {
										shuffle.splice(index, 1);
										menu_properties['shuffle'][1] = JSON.stringify(shuffle);
										// Presets
										if (presets.hasOwnProperty('shuffle')) {
											presets.shuffle.splice(presets.shuffle.findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(sortObj);}), 1);
											if (!presets.shuffle.length) {delete presets.shuffle;}
											menu_properties['presets'][1] = JSON.stringify(presets);
										}
										overwriteMenuProperties(); // Updates panel
									}});
								});
								if (!shuffle.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
								menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
								menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
									shuffle = [...shuffleDefaults];
									menu_properties['shuffle'][1] = JSON.stringify(shuffle);
									// Presets
									if (presets.hasOwnProperty('shuffle')) {
										delete presets.shuffle;
										menu_properties['presets'][1] = JSON.stringify(presets);
									}
									overwriteMenuProperties(); // Updates panel
								}});
							}
						}
					}});
					menu.newEntry({menuName, entryText: 'sep'});
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Remove and find in playlists
			const scriptPath = folders.xxx + 'main\\find_remove_from_playlists.js';
			if (_isFile(scriptPath)){
				const nameNowFind = 'Find now playing track in...';
				const nameFind = 'Find track(s) in...';
				const nameRemove = 'Remove track(s) from...';
				if (!menusEnabled.hasOwnProperty(nameNowFind) || !menusEnabled.hasOwnProperty(nameFind) || !menusEnabled.hasOwnProperty(nameRemove) || menusEnabled[nameNowFind] === true || menusEnabled[nameFind] === true || menusEnabled[nameRemove] === true) {
					include(scriptPath);
					readmes[menuName + '\\' + 'Find in and Remove from'] = folders.xxx + 'helpers\\readme\\find_remove_from_playlists.txt';
					// Add properties
					menu_properties['bFindShowCurrent'] = ['\'Tools\\Find track(s) in...\' show current playlist?', true];
					menu_properties['bRemoveShowLocked'] = ['\'Tools\\Remove track(s) from...\' show autoplaylists?', true];
					menu_properties['findRemoveSplitSize'] = ['\'Tools\\Find track(s) in...\' list submenu size', 10];
					menu_properties['maxSelCount'] = ['\'Tools\\Find  & Remove track(s)...\' max. track selection', 25];
					// Checks
					menu_properties['bFindShowCurrent'].push({func: isBoolean}, menu_properties['bFindShowCurrent'][1]);
					menu_properties['bRemoveShowLocked'].push({func: isBoolean}, menu_properties['bRemoveShowLocked'][1]);
					menu_properties['findRemoveSplitSize'].push({greater: 1, func: isInt}, menu_properties['findRemoveSplitSize'][1]);
					menu_properties['maxSelCount'].push({greater: 0, func: isInt}, menu_properties['maxSelCount'][1]);
					// Menus
					{	// Find now playing in
						if (!menusEnabled.hasOwnProperty(nameNowFind) || menusEnabled[nameNowFind] === true) {
							const subMenuName = menu.newMenu(nameNowFind, menuName);
							menu.newCondEntry({entryText: 'Find now playing track in... (cond)', condFunc: () => {
								if (defaultArgs.bProfile) {var profiler = new FbProfiler('Find now playing in');}
								menu.newEntry({menuName: subMenuName, entryText: 'Set focus on playlist with now playing track:', func: null, flags: MF_GRAYED});
								menu.newEntry({menuName: subMenuName, entryText: 'sep'});
								const nowPlay = fb.GetNowPlaying();
								if (!nowPlay) {menu.newEntry({menuName: subMenuName, entryText: 'Playback is stopped (no playing track).', func: null, flags: MF_GRAYED}); return;}
								const sel = new FbMetadbHandleList(nowPlay);
								var inPlaylist = findInPlaylists(sel);
								const bShowCurrent = menu_properties['bFindShowCurrent'][1];
								const ap = plman.ActivePlaylist;
								if (!bShowCurrent) {inPlaylist = inPlaylist.filter((playlist) => {return ap !== playlist.index;});}
								const playlistsNum = inPlaylist.length;
								if (playlistsNum) {
									// Split entries in sub-menus if there are too many playlists...
									let ss = menu_properties['findRemoveSplitSize'][1];
									const splitBy = playlistsNum < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
									if (playlistsNum > splitBy) {
										const subMenusCount = Math.ceil(playlistsNum / splitBy);
										for (let i = 0; i < subMenusCount; i++) {
											const bottomIdx =  i * splitBy;
											const topIdx = (i + 1) * splitBy - 1;
											const idx = 'Playlists ' + bottomIdx + ' - ' + topIdx + nextId('invisible', true, false);
											// Invisible ID is required to avoid collisions with same sub menu name at 'Find track(s) in...'
											// Otherwise both menus would be called 'Playlist X-Y', leading to bugs (entries duplicated on both places)
											const subMenu_i = menu.newMenu(idx, subMenuName);
											for (let j = bottomIdx; j <= topIdx && j < playlistsNum; j++) {
												const playlist = inPlaylist[j];
												menu.newEntry({menuName: subMenu_i, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {focusInPlaylist(sel, playlist.index);}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
											}
										}
									} else { // Or just show all
										for (const playlist of inPlaylist) {
											menu.newEntry({menuName: subMenuName,  entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {focusInPlaylist(sel, playlist.index);}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
										}
									}
								} else {
									menu.newEntry({menuName: subMenuName, entryText: 'Not found.', func: null, flags: MF_GRAYED});
								}
								if (defaultArgs.bProfile) {profiler.Print();}
							}});
						} else {menuDisabled.push({menuName: nameNowFind, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
					}
					{	// Find in Playlists
						if (!menusEnabled.hasOwnProperty(nameFind) || menusEnabled[nameFind] === true) {
							const subMenuName = menu.newMenu(nameFind, menuName);
							menu.newCondEntry({entryText: 'Find track(s) in... (cond)', condFunc: () => {
								if (defaultArgs.bProfile) {var profiler = new FbProfiler('Find in Playlists');}
								menu.newEntry({menuName: subMenuName, entryText: 'Set focus on playlist with same track(s):', func: null, flags: MF_GRAYED});
								menu.newEntry({menuName: subMenuName, entryText: 'sep'});
								const ap = plman.ActivePlaylist;
								const sel = plman.GetPlaylistSelectedItems(ap);
								const maxSelCount = menu_properties['maxSelCount'][1]; // Don't create these menus when selecting more than these # tracks! Avoids lagging when creating the menu
								if (sel.Count > maxSelCount) {menu.newEntry({menuName: subMenuName, entryText: 'Too many tracks selected: > ' + maxSelCount, func: null, flags: MF_GRAYED}); return;}
								var inPlaylist = findInPlaylists(sel);
								const bShowCurrent = menu_properties['bFindShowCurrent'][1];
								if (!bShowCurrent) {inPlaylist = inPlaylist.filter((playlist) => {return ap !== playlist.index;});}
								const playlistsNum = inPlaylist.length;
								if (playlistsNum) {
									// Split entries in sub-menus if there are too many playlists...
									let ss = menu_properties['findRemoveSplitSize'][1];
									const splitBy = playlistsNum < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
									if (playlistsNum > splitBy) {
										const subMenusCount = Math.ceil(playlistsNum / splitBy);
										for (let i = 0; i < subMenusCount; i++) {
											const bottomIdx =  i * splitBy;
											const topIdx = (i + 1) * splitBy - 1;
											const idx = 'Playlists ' + bottomIdx + ' - ' + topIdx + nextId('invisible', true, false);
											// Invisible ID is required to avoid collisions with same sub menu name at 'Find track(s) in...'
											// Otherwise both menus would be called 'Playlist X-Y', leading to bugs (entries duplicated on both places)
											const subMenu_i = menu.newMenu(idx, subMenuName);
											for (let j = bottomIdx; j <= topIdx && j < playlistsNum; j++) {
												const playlist = inPlaylist[j];
												menu.newEntry({menuName: subMenu_i, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : ''), func: () => {focusInPlaylist(sel, playlist.index);}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
											}
										}
									} else { // Or just show all
										for (const playlist of inPlaylist) {
											menu.newEntry({menuName: subMenuName, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : ''), func: () => {focusInPlaylist(sel, playlist.index);}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
										}
									}
								} else {
									menu.newEntry({menuName: subMenuName, entryText: 'Not found.', func: null, flags: MF_GRAYED});
								}
								if (defaultArgs.bProfile) {profiler.Print();}
							}});
						} else {menuDisabled.push({menuName: nameFind, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
					}
					{	// Remove from Playlists
						if (!menusEnabled.hasOwnProperty(nameRemove) || menusEnabled[nameRemove] === true) {
							const subMenuName = menu.newMenu(nameRemove, menuName);
							menu.newCondEntry({entryText: 'Remove track(s) from... (cond)', condFunc: () => {
								if (defaultArgs.bProfile) {var profiler = new FbProfiler('Remove from Playlists');}
								menu.newEntry({menuName: subMenuName, entryText: 'Remove track(s) from selected playlist:', func: null, flags: MF_GRAYED});
								menu.newEntry({menuName: subMenuName, entryText: 'sep'});
								const ap = plman.ActivePlaylist;
								const sel = plman.GetPlaylistSelectedItems(ap);
								const maxSelCount = menu_properties['maxSelCount'][1]; // Don't create these menus when selecting more than these # tracks! Avoids lagging when creating the menu
								if (sel.Count > maxSelCount) {menu.newEntry({menuName: subMenuName, entryText: 'Too many tracks selected: > ' + maxSelCount, func: null, flags: MF_GRAYED}); return;}
								var inPlaylist = findInPlaylists(sel, ['RemoveItems']);
								const bShowLocked = menu_properties['bRemoveShowLocked'][1];
								if (!bShowLocked) {inPlaylist = inPlaylist.filter((playlist) => {return !playlist.bLocked})}
								const playlistsNum = inPlaylist.length ;
								if (playlistsNum) {
									// Split entries in sub-menus if there are too many playlists...
									let ss = menu_properties['findRemoveSplitSize'][1];
									const splitBy = playlistsNum < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
									if (playlistsNum > splitBy) {
										const subMenusCount = Math.ceil(playlistsNum / splitBy);
										for (let i = 0; i < subMenusCount; i++) {
											const bottomIdx =  i * splitBy;
											const topIdx = (i + 1) * splitBy - 1;
											const idx = 'Playlists ' + bottomIdx + ' - ' + topIdx + nextId('invisible', true, false);
											// Invisible ID is required to avoid collisions with same sub menu name at 'Find track(s) in...'
											// Otherwise both menus would be called 'Playlist X-Y', leading to bugs (entries duplicated on both places)
											const subMenu_i = menu.newMenu(idx, subMenuName);
											for (let j = bottomIdx; j <= topIdx && j < playlistsNum; j++) {
												const playlist = inPlaylist[j];
												const playlistName =  playlist.name + (playlist.bLocked ? ' (locked playlist)' : '') + (ap === playlist.index ? ' (current playlist)' : '')
												menu.newEntry({menuName: subMenu_i, entryText: playlistName, func: () => {plman.UndoBackup(playlist.index); removeFromPlaylist(sel, playlist.index);}, flags: playlist.bLocked ? MF_GRAYED : MF_STRING});
											}
										}
									} else { // Or just show all
										for (const playlist of inPlaylist) {
											const playlistName =  playlist.name + (playlist.bLocked ? ' (locked playlist)' : '') + (ap === playlist.index ? ' (current playlist)' : '')
											menu.newEntry({menuName: subMenuName, entryText: playlistName, func: () => {plman.UndoBackup(playlist.index); removeFromPlaylist(sel, playlist.index);}, flags: playlist.bLocked ? MF_GRAYED : MF_STRING});
										}
									}
								} else {
									menu.newEntry({menuName: subMenuName, entryText: 'Not found.', func: null, flags: MF_GRAYED});
								}
								if (defaultArgs.bProfile) {profiler.Print();}
							}});
						} else {menuDisabled.push({menuName: nameRemove, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
					}
					{	// Configure properties
						if (!menusEnabled.hasOwnProperty(configMenu) || menusEnabled[configMenu] === true) {
							const subMenuName = menu.newMenu('Tools\\Find in and Remove from...', configMenu);
							{	// bFindShowCurrent (Find in Playlists)
								if (!menusEnabled.hasOwnProperty(nameFind) || menusEnabled[nameFind] === true) {
									const subMenuSecondName = menu.newMenu('Show current playlist?', subMenuName);
									const options = ['Yes (greyed entry)', 'No (omit it)'];	
									menu.newEntry({menuName: subMenuSecondName, entryText: 'Only on \'Find track(s) in...\':', func: null, flags: MF_GRAYED});
									menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
									menu.newEntry({menuName: subMenuSecondName, entryText: options[0], func: () => {
										menu_properties['bFindShowCurrent'][1] = true;
										overwriteMenuProperties(); // Updates panel
									}});
									menu.newEntry({menuName: subMenuSecondName, entryText: options[1], func: () => {
										menu_propertiess['bFindShowCurrent'][1] = false;
										overwriteMenuProperties(); // Updates panel
									}});
									menu.newCheckMenu(subMenuSecondName, options[0], options[1],  () => {return (menu_properties['bFindShowCurrent'][1] ? 0 : 1);});
								}
							}
							{	// bRemoveShowLocked (Remove from Playlists)
								if (!menusEnabled.hasOwnProperty(nameRemove) || menusEnabled[nameRemove] === true) {
									const subMenuSecondName = menu.newMenu('Show locked playlist (autoplaylists, etc.)?', subMenuName);
									const options = ['Yes (locked, greyed entries)', 'No (omit them)'];	
									menu.newEntry({menuName: subMenuSecondName, entryText: 'Only on \'Remove track(s) from...\':', func: null, flags: MF_GRAYED});
									menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
									menu.newEntry({menuName: subMenuSecondName, entryText: options[0], func: () => {
										menu_properties['bRemoveShowLocked'][1] = true;
										overwriteMenuProperties(); // Updates panel
									}});
									menu.newEntry({menuName: subMenuSecondName, entryText: options[1], func: () => {
										menu_properties['bRemoveShowLocked'][1] = false;
										overwriteMenuProperties(); // Updates panel
									}});
									menu.newCheckMenu(subMenuSecondName, options[0], options[1],  () => {return (menu_properties['bRemoveShowLocked'][1] ? 0 : 1);});
								}
							}
							{	// findRemoveSplitSize ( Find in / Remove from Playlists)
								const subMenuSecondName = menu.newMenu('Split playlist list submenus at...', subMenuName);
								const options = [5, 10, 20, 30, 'Other...'];
								const optionsIdx = [...options]; // Invisible ID added later is required to avoid collisions
								options.forEach( (val, index) => { // Creates menu entries for all options
									if (index === 0) {
										menu.newEntry({menuName: subMenuSecondName, entryText: 'Number of entries:', func: null, flags: MF_GRAYED});
										menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
									}
									const idx = val + nextId('invisible', true, false); // Invisible ID is required to avoid collisions
									optionsIdx[index] = idx; // For later use
									if (index !== options.length - 1) { // Predefined sizes
										menu.newEntry({menuName: subMenuSecondName, entryText: idx, func: () => {
											menu_properties['findRemoveSplitSize'][1] = val;
											overwriteMenuProperties(); // Updates panel
										}});
									} else { // Last one is user configurable
										menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
										menu.newEntry({menuName: subMenuSecondName, entryText: idx, func: () => {
											const input = Number(utils.InputBox(window.ID, 'Enter desired Submenu max size.\n', scriptName + ': ' + subMenuName, menu_properties['findRemoveSplitSize'][1]));
											if (menu_properties['findRemoveSplitSize'][1] === input) {return;}
											if (!Number.isSafeInteger(input)) {return;}
											menu_properties['findRemoveSplitSize'][1] = input;
											overwriteMenuProperties(); // Updates panel
										}});
									}
								});
								menu.newCheckMenu(subMenuSecondName, optionsIdx[0], optionsIdx[optionsIdx.length - 1],  () => {
									const size = options.indexOf(menu_properties['findRemoveSplitSize'][1]);
									return (size !== -1 ? size : options.length - 1);
								});
							}
							{	// maxSelCount ( Find in / Remove from Playlists)
								const subMenuSecondName = menu.newMenu('Don\'t try to find tracks if selecting more than...', subMenuName);
								const options = [5, 10, 20, 25, 'Other...'];
								const optionsIdx = [...options]; // Invisible ID added later is required to avoid collisions
								options.forEach( (val, index) => { // Creates menu entries for all options
									if (index === 0) {
										menu.newEntry({menuName: subMenuSecondName, entryText: 'Number of tracks:', func: null, flags: MF_GRAYED});
										menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
									}
									const idx = val + nextId('invisible', true, false); // Invisible ID is required to avoid collisions
									optionsIdx[index] = idx; // For later use
									if (index !== options.length - 1) { // Predefined sizes
										menu.newEntry({menuName: subMenuSecondName, entryText: idx, func: () => {
											menu_properties['maxSelCount'][1] = val;
											overwriteMenuProperties(); // Updates panel
										}});
									} else { // Last one is user configurable
										menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
										menu.newEntry({menuName: subMenuSecondName, entryText: idx, func: () => {
											const input = Number(utils.InputBox(window.ID, 'Enter max number of tracks.\n', scriptName + ': ' + subMenuName, menu_properties['maxSelCount'][1]));
											if (menu_properties['maxSelCount'][1] === input) {return;}
											if (!Number.isSafeInteger(input)) {return;}
											menu_properties['maxSelCount'][1] = input;
											overwriteMenuProperties(); // Updates panel
										}});
									}
								});
								menu.newCheckMenu(subMenuSecondName, optionsIdx[0], optionsIdx[optionsIdx.length - 1],  () => {
									const size = options.indexOf(menu_properties['maxSelCount'][1]);
									return (size !== -1 ? size : options.length - 1);
								});
							}
							menu.newEntry({menuName: configMenu, entryText: 'sep'});
						} else {menuDisabled.push({menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
					}
				} else {
					menuDisabled.push({menuName: nameNowFind, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
					menuDisabled.push({menuName: nameFind, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
					menuDisabled.push({menuName: nameRemove, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
				}
			}
		}
		{	// Send Selection to Playlist
			const name = 'Send selection to...';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				include(folders.xxx + 'helpers\\helpers_xxx_playlists.js');
				// Add properties
				if (!menu_properties.hasOwnProperty('playlistSplitSize')) {
					menu_properties['playlistSplitSize'] = ['Playlist lists submenu size', 20];
					// Checks
					menu_properties['playlistSplitSize'].push({greater: 1, func: isInt}, menu_properties['playlistSplitSize'][1]);
				}
				// Menus
				const subMenuNameSend = menu.newMenu(name, menuName);
				menu.newEntry({menuName: subMenuNameSend, entryText: 'Sends selected tracks from current playlist to:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuNameSend, entryText: 'sep'});
				// Build submenus
				menu.newCondEntry({entryText: 'Send selection to...', condFunc: () => {
					if (defaultArgs.bProfile) {var profiler = new FbProfiler('Send selection to...');}
					const playlistsNum = plman.PlaylistCount;
					const playlistsNumNotLocked = playlistCountNoLocked();
					const ap = plman.ActivePlaylist;
					const handleList = plman.GetPlaylistSelectedItems(ap);
					if (playlistsNum && playlistsNumNotLocked && handleList.Count) {
						// Split entries in sub-menus if there are too many playlists...
						let ss = menu_properties['playlistSplitSize'][1];
						const splitBy = playlistsNumNotLocked < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
						if (playlistsNumNotLocked > splitBy) {
							const subMenusCount = Math.ceil(playlistsNumNotLocked / splitBy);
							let skipped = 0; // To account for locked playlists
							for (let i = 0; i < subMenusCount; i++) {
								const bottomIdx =  i * splitBy;
								const topIdx = (i + 1) * splitBy - 1;
								// Invisible ID is required to avoid collisions with same sub menu name at 'Find track(s) in...'
								// Otherwise both menus would be called 'Playlist X-Y', leading to bugs (entries duplicated on both places)
								// Send
								const idxSend = '(Send sel. to) Playlists ' + bottomIdx + ' - ' + topIdx;
								const subMenu_i_send = menu.newMenu(idxSend, subMenuNameSend);
								for (let j = bottomIdx; j <= topIdx + skipped && j < playlistsNum; j++) {
									if (!addLock(j)) {
										const playlist = {name: plman.GetPlaylistName(j), index : j};
										menu.newEntry({menuName: subMenu_i_send, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
											plman.UndoBackup(playlist.index);
											plman.InsertPlaylistItems(playlist.index, plman.PlaylistItemCount(playlist.index), handleList);
										}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
									} else {skipped++}
								}
							}
						} else { // Or just show all
							for (let i = 0; i < playlistsNum; i++) {
								if (!addLock(i)) {
									const playlist = {name: plman.GetPlaylistName(i), index : i};
									menu.newEntry({menuName: subMenuNameSend,  entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
										plman.InsertPlaylistItems(playlist.index, plman.PlaylistItemCount(playlist.index), handleList);
									}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
								}
							}
						}
					} else {
						menu.newEntry({menuName: subMenuNameSend, entryText: 'No items.', func: null, flags: MF_GRAYED});
					}
					if (defaultArgs.bProfile) {profiler.Print();}
				}});
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
		{	// Move
			const name = 'Move selection to...';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				readmes[menuName + '\\' + 'Move, expand & jump'] = folders.xxx + 'helpers\\readme\\selection_expand_jump.txt';
				const subMenuName = menu.newMenu(name, menuName);
				menu.newEntry({menuName: subMenuName, entryText: 'On current playlist:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'To specified position', func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					let pos = 0;
					try {pos = utils.InputBox(window.ID, 'Move by delta value:\n(positive or negative)', scriptName + ': ' + name, 1, true);}
					catch (e) {return;}
					if (!pos) {return;}
					const selItems = plman.GetPlaylistSelectedItems(ap);
					plman.UndoBackup(ap);
					plman.MovePlaylistSelection(ap, pos);
				}, flags: selectedFlagsReorder});
				menu.newEntry({menuName: subMenuName, entryText: 'To the middle', func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					const selItems = plman.GetPlaylistSelectedItems(ap);
					plman.UndoBackup(ap);
					plman.RemovePlaylistSelection(ap);
					const count = plman.PlaylistItemCount(ap);
					const pos = count ? Math.floor(count / 2) : 0;
					plman.InsertPlaylistItems(ap, pos, selItems, true);
					plman.SetPlaylistFocusItem(ap, pos);
				}, flags: selectedFlagsAddRem});
				menu.newEntry({menuName: subMenuName, entryText: 'After playing now track', func: () => {
					const playingItemLocation = plman.GetPlayingItemLocation();
					if (!playingItemLocation.IsValid) {return;}
					const pp = playingItemLocation.PlaylistIndex;
					if (pp === -1) {return;}
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					const selItems = plman.GetPlaylistSelectedItems(ap);
					plman.UndoBackup(ap);
					plman.RemovePlaylistSelection(ap);
					if (pp !== ap) {
						plman.ActivePlaylist = pp;
						plman.UndoBackup(pp);
					}
					const pos = playingItemLocation.PlaylistItemIndex + 1;
					plman.InsertPlaylistItems(pp, pos, selItems, true);
					plman.SetPlaylistFocusItem(pp, pos);
				}, flags: () => {return (fb.IsPlaying ? selectedFlagsAddRem() : MF_GRAYED);}});
				menu.newEntry({menuName, entryText: 'sep'});
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
		{	// Select (for use with macros!!)
			const name = 'Select...';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				const subMenuName = menu.newMenu(name, menuName);
				menu.newEntry({menuName: subMenuName, entryText: 'Sets selection on current playlist:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'Select All', func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					const start = 0;
					const end = plman.PlaylistItemCount(ap);
					plman.ClearPlaylistSelection(ap);
					plman.SetPlaylistSelection(ap, range(start, end, 1), true);
				}, flags: playlistCountFlags});
				menu.newEntry({menuName: subMenuName, entryText: 'Invert selection', func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					const toSelect = [];
					range(0, plman.PlaylistItemCount(ap) - 1, 1).forEach((idx) => {if (!plman.IsPlaylistItemSelected(ap, idx)) {toSelect.push(idx);}});
					plman.ClearPlaylistSelection(ap);
					plman.SetPlaylistSelection(ap, toSelect, true);
				}, flags: playlistCountFlags});
				menu.newEntry({menuName: subMenuName, entryText: 'Clear selection', func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					plman.ClearPlaylistSelection(ap);
				}, flags: selectedFlags});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'Select first track', func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					plman.ClearPlaylistSelection(ap);
					plman.SetPlaylistSelection(ap, [0], true);
				}, flags: playlistCountFlags});
				menu.newEntry({menuName: subMenuName, entryText: 'Select last track', func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					plman.ClearPlaylistSelection(ap);
					plman.SetPlaylistSelection(ap, [plman.PlaylistItemCount(ap) - 1], true);
				}, flags: playlistCountFlags});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'Select random track', func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					const numbers = range(0, plman.PlaylistItemCount(ap), 1).shuffle(); // Get indexes randomly sorted
					plman.ClearPlaylistSelection(ap);
					plman.SetPlaylistSelection(ap, [numbers[0]], true); // Take first one
				}, flags: playlistCountFlags});
				menu.newEntry({menuName: subMenuName, entryText: 'Select random # tracks', func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					const numbers = range(0, plman.PlaylistItemCount(ap), 1).shuffle(); // Get indexes randomly sorted
					const selLength = numbers[0] ? numbers[0] : numbers[1]; // There is only a single zero...
					plman.ClearPlaylistSelection(ap);
					plman.SetPlaylistSelection(ap, numbers.slice(0, selLength), true); // Take n first ones, where n is also the first or second value of indexes array
				}, flags: playlistCountFlags});
				menu.newEntry({menuName: subMenuName, entryText: () => {return 'Select random ' + menu_properties.playlistLength[1] + ' tracks'}, func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					const numbers = range(0, plman.PlaylistItemCount(ap), 1).shuffle(); // Get indexes randomly sorted
					const selLength = menu_properties.playlistLength[1];
					plman.ClearPlaylistSelection(ap);
					plman.SetPlaylistSelection(ap, numbers.slice(0, selLength), true); // Take n first ones, where n is also the first or second value of indexes array
				}, flags: playlistCountFlags});
				menu.newEntry({menuName: subMenuName, entryText: 'Select next tracks...', func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					let input = menu_properties.playlistLength[1];
					try {input = Number(utils.InputBox(window.ID, 'Enter num of next items to select from focused item:\n(< 0 will go backwards)\n(= 1 will only select the focused item)', scriptName + ': ' + name, input, true));}
					catch (e) {return;}
					if (!Number.isFinite(input)) {return;}
					if (!input) {return;}
					let start = plman.GetPlaylistFocusItemIndex(ap);
					if (start !== -1 && !plman.IsPlaylistItemSelected(ap, start)) {start = -1;}
					const end = plman.PlaylistItemCount(ap);
					const numbers = input < 0 ? (start !== -1 ? range(0, start, 1) : range(0, end, 1)) : range(start !== -1 ? start : 0, end, 1);
					plman.ClearPlaylistSelection(ap);
					plman.SetPlaylistSelection(ap, input < 0 ? numbers.slice(input) : numbers.slice(0, input), true); // Take n first ones
				}, flags: playlistCountFlags});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'Delete selected tracks', func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					plman.RemovePlaylistSelection(ap);
				}, flags: selectedFlagsRem});
				menu.newEntry({menuName: subMenuName, entryText: 'Delete Non selected tracks', func: () => {
					const ap = plman.ActivePlaylist;
					if (ap === -1) {return;}
					plman.RemovePlaylistSelection(ap, true);
				}, flags: playlistCountFlagsRem});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				const subMenuHalf = menu.newMenu('By halves', subMenuName);
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				const subMenuThird = menu.newMenu('By thirds', subMenuName);
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				const subMenuQuarter = menu.newMenu('By quarters', subMenuName);
				const selArgs = [
					{name: 'Select first Half',		menu: subMenuHalf,		args: {start: 0, end: 1/2}},
					{name: 'Select second Half',		menu: subMenuHalf,		args: {start: 1/2, end: 1}},
					{name: 'Select first Quarter',		menu: subMenuQuarter, 	args: {start: 0, end: 1/4}},
					{name: 'Select first Third',		menu: subMenuThird,		args: {start: 0, end: 1/3}},
					{name: 'Select second Third',		menu: subMenuThird, 	args: {start: 1/3, end: 2/3}},
					{name: 'Select third Third',		menu: subMenuThird,  	args: {start: 2/3, end: 1}},
					{name: 'Select second Quarter',	menu: subMenuQuarter,	args: {start: 1/4, end: 1/2}},
					{name: 'Select third Quarter',		menu: subMenuQuarter,	args: {start: 1/2, end: 3/4}},
					{name: 'Select fourth Quarter',	menu: subMenuQuarter,	args: {start: 3/4, end: 1}}
				];
				selArgs.forEach( (selArg) => {
					if (selArg.name === 'sep') {
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					} else {
						let entryText = selArg.name;
						menu.newEntry({menuName: selArg.menu, entryText, func: (args = selArg.args) => {
							const ap = plman.ActivePlaylist;
							if (ap === -1) {return;}
							const count = plman.PlaylistItemCount(ap);
							const start = count * args.start;
							const end = Math.floor(count * args.end);
							plman.ClearPlaylistSelection(ap);
							plman.SetPlaylistSelection(ap, range(start, end, 1), true);
						}, flags: playlistCountFlags});
					}
				});
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
		{	// Expand
			const name = 'Expand...';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				const subMenuName = menu.newMenu(name, menuName);
				menu.newEntry({menuName: subMenuName, entryText: 'Expand selection by:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				const selArgs = [
					{name: 'By Artist', args: ['%' + globTags.artist + '%']},
					{name: 'By Album', args: ['%ALBUM%']},
					{name: 'By Directory', args: ['%DIRECTORYNAME%']},
					{name: 'By Date', args: [globTags.date]},
					{name: 'By Genre', args: ['%' + globTags.genre + '%']},
					{name: 'By Style', args: ['%' + globTags.style + '%']},
					{name: 'By Key', args: ['%' + globTags.key + '%']},
					{name: 'By Mood', args: ['%' + globTags.mood + '%']},
					{name: 'sep'},
					{name: 'By... (tags)', args: () => {
						let input = '%' + globTags.artist + '%;%ALBUM%';
						try {input = utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(multiple values may be separated by \';\')', scriptName + ': ' + name, input, true);}
						catch (e) {return [];}
						if (!input.length) {return [];}
						input = input.split(';');
						if (!input.length) {return [];}
						return input;
					}},
				];
				selArgs.forEach( (selArg) => {
					if (selArg.name === 'sep') {
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					} else {
						let entryText = selArg.name;
						menu.newEntry({menuName: subMenuName, entryText, func: () => {
							const ap = plman.ActivePlaylist;
							const selItems = plman.GetPlaylistSelectedItems(ap);
							const plsItems = plman.GetPlaylistItems(ap);
							const selIdx = new Set();
							(isFunction(selArg.args) ? selArg.args() : selArg.args).forEach((tf) => {
								const tags = fb.TitleFormat(tf).EvalWithMetadbs(plsItems);
								const selTags = fb.TitleFormat(tf).EvalWithMetadbs(selItems);
								selTags.forEach((selTag) => {
									tags.forEach((tag, idx) => {
										if (tag === selTag) {selIdx.add(idx);}
									});
								});
							});
							if (selIdx.size) {
								plman.SetPlaylistSelection(ap, [...selIdx], true);
							}
						}, flags: selectedFlags});
					}
				});
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
		{	// Jump
			const name = 'Jump...';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				const subMenuName = menu.newMenu(name, menuName);
				const subMenus = [
					menu.newMenu('Next', subMenuName),
					menu.newMenu('Previous', subMenuName)
				];
				const selArgs = [
					{name: 'By Artist', args: ['%' + globTags.artist + '%']},
					{name: 'By Album', args: ['%ALBUM%']},
					{name: 'By Directory', args: ['%DIRECTORYNAME%']},
					{name: 'By Date', args: [globTags.date]},
					{name: 'By Genre', args: ['%' + globTags.genre + '%']},
					{name: 'By Style', args: ['%' + globTags.style + '%']},
					{name: 'By Key', args: [defaultArgs.keyTag]}, // Uses remapped tag. Probably missing %, fixed later.
					{name: 'By Mood', args: ['%' + globTags.mood + '%']},
					{name: 'sep'},
					{name: 'By... (tags)', args: () => {
						let input = '%' + globTags.artist + '%;%ALBUM%';
						try {input = utils.InputBox(window.ID, 'Enter tag(s) or TF expression(s):\n(multiple values may be separated by \';\')', scriptName + ': ' + name, input, true);}
						catch (e) {return [];}
						if (!input.length) {return [];}
						input = input.split(';');
						if (!input.length) {return [];}
						return input;
					}},
				];
				subMenus.forEach( (subMenu) => {
					menu.newEntry({menuName: subMenu, entryText: 'Jumps to ' + subMenu.toLowerCase() + ' item:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenu, entryText: 'sep'});
					selArgs.forEach( (selArg) => {
						if (selArg.name === 'sep') {
							menu.newEntry({menuName: subMenu, entryText: 'sep'});
						} else {
							let entryText = selArg.name;
							menu.newEntry({menuName: subMenu, entryText, func: () => {
								const ap = plman.ActivePlaylist;
								const focusIdx = plman.GetPlaylistFocusItemIndex(ap);
								const selItems = plman.GetPlaylistSelectedItems(ap);
								const plsItems = plman.GetPlaylistItems(ap);
								const count = plman.PlaylistItemCount(ap);
								let selIdx = -1;
								let bDone = false;
								(isFunction(selArg.args) ? selArg.args() : selArg.args).forEach((tf) => {
									if (bDone) {return;}
									if (tf.indexOf('$') === -1 && tf.indexOf('%') === -1) {tf = '%' + tf + '%';} // Add % to tag names if missing
									const selTags = fb.TitleFormat(tf).EvalWithMetadbs(selItems);
									for (let i = subMenu === 'Next' ? focusIdx + 1 : focusIdx - 1; i >= 0 && i < count; subMenu === 'Next' ? i++ : i--) {
										if (plman.IsPlaylistItemSelected(ap, i)) {continue;}
										const tag = fb.TitleFormat(tf).EvalWithMetadb(plsItems[i]);
										selTags.forEach((selTag) => {
											if (bDone) {return;}
											if (tag !== selTag) {selIdx = i; bDone = true; return;}
										});
										if (bDone) {break;}
									}
								});
								if (selIdx !== - 1) {
									plman.ClearPlaylistSelection(ap);
									plman.SetPlaylistSelection(ap, [selIdx], true);
									plman.SetPlaylistFocusItem(ap, selIdx);
								}
							}, flags: selectedFlags});
						}
					});
				});
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
	} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}