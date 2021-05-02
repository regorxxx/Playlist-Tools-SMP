'use strict';

/* 
	Playlist Tools Menu v 0.3 06/04/21
	-----------------------------------
	Merges different playlist tools in one menu, called when pressing the button.
	If any script or plugin is missing, then the menu gets created without those entries.
	So the menu is created dynamically according to the foobar user's config.
	
	Currently contains pre-defined use-cases for these scripts:
	- Most played tracks from...
		.\xxx-scripts\top_tracks.js
		.\xxx-scripts\top_tracks_from_date.js
	- Top Rated tracks from..
		.\xxx-scripts\top_rated_tracks.js
	- Same by...
		.\xxx-scripts\search_same_by.js
	- Similar by... 
		.\xxx-scripts\search_bydistance.js
	- Special Playlists... (contains functionality from the other scripts)
		.\xxx-scripts\search_bydistance.js
		.\xxx-scripts\search_same_by.js
	- Tools...
		+ Remove duplicates
			.\xxx-scripts\remove_duplicates.js
		+ Query filtering
			.\xxx-scripts\filter_by_query.js
		+ Harmonic mix
			.\xxx-scripts\harmonic_mixing.js
		+ Sort by key
			.\xxx-scripts\sort_by_key.js
		+ Scatter by tags
			.\xxx-scripts\scatter_by_tags.js
		+ Check tags
			.\xxx-scripts\check_library_tags.js
		+ Write tags
			.\xxx-scripts\tags_automation.js
		+ Find track(s) in...
			.\xxx-scripts\find_remove_from_playlists.js
		+ Remove track(s) from...
			.\xxx-scripts\find_remove_from_playlists.js
		+ Playlist Revive
			.\xxx-scripts\playlist_revive.js
	
	NOTE: menus are enclosed within {} scopes, so they can be easily rearranged, added or removed
	without affecting the other menus. Only exception to this rule are the menus named 'specialMenu'
	and 'configMenu', sub-menu collecting different entries from multiple scripts; They can be moved the 
	same than the others but obviously removing other menus/scripts affect these ones too.
	
	NOTE2: menuTooltip() can be called when used along buttons or integrated with other scripts to
	show info related to the track. To initiate the menu, call 'menu.btn_up(x, y)'. For ex:
	
	function on_mouse_lbtn_up(x, y) {
		let sel = fb.GetFocusItem();
		if (!sel) {
			return;
		}
		menu.btn_up(x, y)
	}
	*/

include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\helpers_xxx.js');
include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\menu_xxx.js');

// Properties
const bNotProperties = true; // Don't load other properties
var menu_prefix = 'menu_'; // Update this variable when loading it along a button
var menu_properties = { // Properties are set at the end of the script, or must be set along the button. Menus may add new properties here
	playlistLength: ['Global Playlist length', 50],
	forcedQuery:	['Global forced query', 'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1) AND NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi) AND %channels% LESS 3 AND NOT COMMENT HAS Quad'],
	ratingLimits:	['Set ratings extremes (ex. from 1 to 10 -> 1,10)', '1,5'],
};
// Global properties set only once per panel even if there are multiple buttons of the same script
const menu_panelProperties = {firstPopup:	['Playlist Tools: Fired once', false],};

// Checks
menu_properties['playlistLength'].push({greater: 0, func: Number.isSafeInteger}, menu_properties['playlistLength'][1]);
menu_properties['forcedQuery'].push({func: (query) => {return checkQuery(query, true);}}, menu_properties['forcedQuery'][1]);
menu_properties['ratingLimits'].push({func: (str) => {return (isString(str) && str.length === 3 && str.indexOf(',') === 1);}}, menu_properties['ratingLimits'][1]);

/* 
	Load properties and set default global Parameters
*/
const defaultArgs = {
					playlistLength: menu_properties['playlistLength'][1], 
					forcedQuery: menu_properties['forcedQuery'][1], 
					ratingLimits: menu_properties['ratingLimits'][1].split(','),
};
loadProperties();
// Menu
const specialMenu = 'Special Playlists...';
const configMenu = 'Configuration';
const scriptName = 'Playlist Tools Menu';
var readmes = {'Playlist Tools Menu': fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\playlist_tools_menu.txt'}; // {scriptName: path}
const menu = new _menu();

/* 
	Menus
*/
// Top Tracks from year
{
	const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\top_tracks_from_date.js';
	const scriptPathElse = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\top_tracks.js';
	if (utils.CheckComponent("foo_enhanced_playcount") && (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e"))) {
		include(scriptPath);
		readmes['Most Played Tracks from Date'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\top_tracks_from_date.txt';
		const menuName = menu.newMenu('Most played Tracks from...');
		menu.newEntry({menuName, entryText: 'Based on play counts within a period:', func: null, flags: MF_GRAYED});
		menu.newEntry({menuName, entryText: 'sep'});
		{	// Static menus
			const currentYear = new Date().getFullYear();
			const selYearArr = [currentYear, currentYear - 1, currentYear - 2];
			selYearArr.forEach( (selYear) => {
				let args = {year: selYear};
				menu.newEntry({menuName, entryText: 'Most played from ' + selYear, func: (args = {...defaultArgs, ...args}) => {do_top_tracks_from_date(args);}});
				});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		if (isCompatible('1.4.0') ? utils.IsFile(scriptPathElse) : utils.FileTest(scriptPathElse, "e")){
			// All years
			include(fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\top_tracks.js');
			menu.newEntry({menuName, entryText: 'Most played (all years)', func: (args = {...defaultArgs}) => {do_top_tracks(args);}});
			menu.newEntry({menuName, entryText: 'sep'});
		}
		{	// Input menu: x year
			menu.newEntry({menuName, entryText: 'From year... ', func: () => {
				const selYear = new Date().getFullYear();
				let input;
				try {input = Number(utils.InputBox(window.ID, 'Enter year', window.Name, selYear, true));}
				catch (e) {return;}
				if (!Number.isSafeInteger(input)) {return;}
				do_top_tracks_from_date({...defaultArgs,  year: input});
				}});
		}
		{	// Input menu: last x time
			menu.newEntry({menuName, entryText: 'From last... ', func: () => {
				let input;
				try {input = utils.InputBox(window.ID, 'Enter a number and time-unit. Can be:\n' + Object.keys(timeKeys).join(', '), window.Name, '4 WEEKS', true).trim();}
				catch (e) {return;}
				if (!input.length) {return;}
				do_top_tracks_from_date({...defaultArgs,  last: input, bUseLast: true});
				}});
		}
		menu.newEntry({entryText: 'sep'});
	} else if (utils.CheckComponent("foo_playcount") && (isCompatible('1.4.0') ? utils.IsFile(scriptPathElse) : utils.FileTest(scriptPathElse, "e"))) { //TODO: Deprecated
		readmes['Most Played Tracks'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\top_tracks.txt';
		{	// All years
			include(scriptPathElse);
			menu.newEntry({entryText: 'Most played Tracks', func: (args = { ...defaultArgs}) => {do_top_tracks(args);}}); // Skips menu name, added to top
		}
		menu.newEntry({entryText: 'sep'});
	}
}

// Top rated Tracks from year
{
	const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\top_rated_tracks.js';
	if (utils.CheckComponent("foo_playcount") && (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e"))) {
		include(scriptPath);
		readmes['Top Rated Tracks'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\top_rated_tracks.txt';
		const menuName = menu.newMenu('Top rated Tracks from...');
		menu.newEntry({menuName, entryText: 'Based on ratings: ' + defaultArgs.ratingLimits.join(' to '), func: null, flags: MF_GRAYED});
		menu.newEntry({menuName, entryText: 'sep'});
		const currentYear = new Date().getFullYear();
		const selYearArr = [ [currentYear], [2000, currentYear], [1990, 2000], [1980, 1990], [1970, 1980], [1960, 1970], [1950, 1940]];
		selYearArr.forEach( (selYear) => {
			let selArgs = { ...defaultArgs};
			let dateQuery = '';
			if (selYear.length === 2) {
				dateQuery = '"$year(%date%)" GREATER ' + selYear[0] + ' AND "$year(%date%)" LESS ' + selYear[1];
			} else {
				dateQuery = '"$year(%date%)" IS ' + selYear;
			}
			selArgs.forcedQuery = selArgs.forcedQuery.length ? '(' + dateQuery + ') AND (' + selArgs.forcedQuery + ')' : dateQuery;
			selArgs.playlistName = 'Top ' + selArgs.playlistLength + ' Rated Tracks ' + selYear.join('-');
			menu.newEntry({menuName, entryText: 'Top rated from ' + selYear.join('-'), func: (args = selArgs) => {do_top_rated_tracks(args);}});
		});
		menu.newEntry({menuName, entryText: 'sep'});
		{	// Input menu
			menu.newEntry({menuName, entryText: 'From year... ', func: () => {
				let selYear = new Date().getFullYear();
				try {selYear = utils.InputBox(window.ID, 'Enter year or range of years\n(pair separated by comma)', window.Name, selYear, true);}
				catch (e) {return;}
				if (!selYear.length) {return;}
				selYear = selYear.split(',').split('-'); // May be a range or a number
				for (let i = 0; i < selYear.length; i++) {
					selYear[i] = Number(selYear[i]);
					if (!Number.isSafeInteger(selYear[i])) {return;}
				}
				let selArgs = { ...defaultArgs};
				let dateQuery = '';
				if (selYear.length === 2) {
					dateQuery = '"$year(%date%)" GREATER ' + selYear[0] + ' AND "$year(%date%)" LESS ' +  selYear[1];
				} else {
					dateQuery = '"$year(%date%)" IS ' + selYear;
				}
				selArgs.forcedQuery = selArgs.forcedQuery.length ? '(' + dateQuery + ') AND (' + selArgs.forcedQuery + ')' : dateQuery;
				selArgs.playlistName = 'Top ' + selArgs.playlistLength + ' Rated Tracks ' + selYear.join('-');
				do_top_rated_tracks(selArgs);
			}});
		}
		menu.newEntry({entryText: 'sep'});
	}
}

// Same by...
{
	const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\search_same_by.js';
	if (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e")){
		include(scriptPath);
		readmes['Search Same by Tags'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\search_same_by.txt';
		const menuName = menu.newMenu('Search same by tags...');
		{	// Dynamic menu
			let queryFilter = [
				{args: {sameBy: {mood: 6}}}, {args: {sameBy: {genre: 2}}}, {args: {sameBy: {style: 2}}},
				{args: {sameBy: {composer: 2}}}, {args: {sameBy: {key: 1}}},
				{name: 'sep'},
				{args: {sameBy: {style: 2, mood: 6}}}, {args: {sameBy: {style: 2, date: 10}}},
			];
			let selArg = {args: {sameBy: {genre: 1, style: 2, mood: 5}}};
			const queryFilterDefaults = [...queryFilter];
			// Create new properties with previous args
			menu_properties['sameByQueries'] = ['\'Search same by tags...\' queries', JSON.stringify(queryFilter)];
			menu_properties['sameByCustomArg'] = ['\'Search same by tags...\' Dynamic menu custom args', convertObjectToString(selArg.args.sameBy)];
			const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
			// Menus
			menu.newEntry({menuName, entryText: 'Based on Queries matching minimum (X) tags:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			menu.newCondEntry({entryText: 'Search same by tags... (cond)', condFunc: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
				// Entry list
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
				queryFilter = JSON.parse(args.properties['sameByQueries'][1]);
				queryFilter.forEach( (queryObj) => {
					// Add separators
					if (queryObj.hasOwnProperty('name') && queryObj.name === 'sep') {
						let entryMenuName = queryObj.hasOwnProperty('menu') ? queryObj.menu : menuName;
						menu.newEntry({menuName: entryMenuName, entryText: 'sep'});
					} else { 
						// Create names for all entries
						let text = '';
						if (!queryObj.hasOwnProperty('name') || !queryObj.name.length) {
							Object.keys(queryObj.args.sameBy).forEach((key, index, array) => {
								text += (!text.length ? '' : index !== array.length - 1 ? ', ' : ' and ');
								text += capitalizeFirstLetter(key) + (queryObj.args.sameBy[key] > 1 ? 's' : '') + ' (=' + queryObj.args.sameBy[key] + ')';
								});
						} else {text = queryObj.name;}
						text = text.length > 40 ? text.substring(0,40) + ' ...' : text;
						queryObj.name = text;
						// Entries
						menu.newEntry({menuName, entryText: 'By ' + text, func: () => {do_search_same_by(queryObj.query);}, flags: focusFlags});
					}
				});
				menu.newEntry({menuName, entryText: 'sep'});
				{ // Static menu: user configurable
					menu.newEntry({menuName, entryText: 'By... (pairs of tags)', func: (args = {...scriptDefaultArgs, ...defaultArgs, ...selArg.args}) => {
						// On first execution, must update from property
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
						args.sameBy = selArg.args.sameBy = convertStringToObject(args.properties['sameByCustomArg'][1], 'number', ',');
						// Input
						let input;
						try {input = utils.InputBox(window.ID, 'Enter pairs of \'tag, number of matches\', separated by comma.\n', window.Name, convertObjectToString(args.sameBy, ','), true);}
						catch (e) {return;}
						if (!input.length) {return;}
						// For internal use original object
						selArg.args.sameBy = convertStringToObject(input, 'number', ',');
						args.properties['sameByCustomArg'][1] = convertObjectToString(selArg.args.sameBy); // And update property with new value
						overwriteProperties(args.properties); // Updates panel
						do_search_same_by(selArg.args);
					}, flags: focusFlags});
					// Menu to configure property
					menu.newEntry({menuName, entryText: 'sep'});
				}
				{	// Add / Remove
					menu.newEntry({menuName, entryText: 'Add new entry to list...' , func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
						// Input all variables
						let input;
						let name = '';
						try {name = utils.InputBox(window.ID, 'Enter name for menu entry\nWrite \'sep\' to add a line.', window.Name, '', true);}
						catch (e) {return;}
						if (name === 'sep') {input = {name};} // Add separator
						else { // or new entry
							try {input = utils.InputBox(window.ID, 'Enter pairs of \'tag, number of matches\', separated by comma.\n', window.Name, convertObjectToString(args.sameBy, ','), true);}
							catch (e) {return;}
							if (!input.length) {return;}
							if (input.indexOf(',') === -1) {return;}
							if (input.indexOf(';') !== -1) {return;}
							let logic = 'AND';
							try {logic = utils.InputBox(window.ID, 'Enter logical operator to combine queries for each different tag.\n', window.Name, logic, true);}
							catch (e) {return;}
							if (!logic.length) {return;}
							let remap;
							try {remap = utils.InputBox(window.ID, 'Remap tags to apply the same query to both.\nEnter \'mainTagA,toTag,...;mainTagB,...\'\nSeparated by \',\' and \';\'.\n', window.Name, '', true);}
							catch (e) {return;}
							let bOnlyRemap = false;
							if (remap.length) {
								let answer = WshShell.Popup('Instead of applying the same query remapped tags, the original tag may be remapped to the desired track. Forcing that Tag B should match TagA.\nFor example: Finds tracks where involved people matches artist from selection', 0, window.Name, popup.question + popup.yes_no);
								if (answer === popup.yes) {bOnlyRemap = true;}
							}
							input = {name, args: {sameBy: convertStringToObject(input, 'number', ','), logic, remapTags: convertStringToObject(remap, 'string', ',', ';'), bOnlyRemap}};
							// Final check
							try {if (!do_search_same_by({...input.args, bSendToPls: false})) {throw 'error';}}
							catch (e) {fb.ShowPopupMessage('Arguments not valid, check them and try again:\n' + JSON.stringify(input), scriptName);return;}
						}
						// Add entry
						queryFilter.push(input);
						// Save as property
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
						args.properties['sameByQueries'][1] = JSON.stringify(queryFilter); // And update property with new value
						overwriteProperties(args.properties); // Updates panel
					}});
					{
						const subMenuSecondName = menu.newMenu('Remove entry from list...' + nextId('invisible', true, false), menuName);
						queryFilter.forEach( (queryObj, index) => {
							const text = (queryObj.name === 'sep' ? '------(separator)------' : (queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name));
							menu.newEntry({menuName: subMenuSecondName, entryText: text, func: () => {
								queryFilter.splice(index, 1);
								args.properties['sameByQueries'][1] = JSON.stringify(queryFilter);
								overwriteProperties(args.properties); // Updates panel
							}});
						});
						menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
							queryFilter = [...queryFilterDefaults];
							args.properties['sameByQueries'][1] = JSON.stringify(queryFilter);
							overwriteProperties(args.properties); // Updates panel
						}});
					}
				}
			}});
		}
		{	// Static menus: Special playlist (at other menu)
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
							entryText += capitalizeFirstLetter(key) + (selArg.args.sameBy[key] > 1 ? 's' : '') + ' (=' + selArg.args.sameBy[key] + ')';
							});
					} else {entryText = selArg.title;}
					let entryMenuName = selArg.hasOwnProperty('menu') ? selArg.menu : menuName;
					menu.newEntry({menuName: entryMenuName, entryText, func: (args = {...defaultArgs, ...selArg.args}) => {do_search_same_by(args);}, flags: focusFlags});
				}
			});
		}
		menu.newEntry({entryText: 'sep'});
	}
}

// Dynamic queries...
{
	const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\dynamic_query.js';
	if (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e")){
		include(scriptPath);
		readmes['Dynamic Queries'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\dynamic_query.txt';
		const menuName = menu.newMenu('Dynamic Queries...');
		{	// Dynamic menu
			let queryFilter = [
				{name: 'Same title (any artist)'	, args: 'TITLE IS #TITLE#'},
				{name: 'Same songs (by artist)'		, args: 'TITLE IS #TITLE# AND ARTIST IS #ARTIST#'},
				{name: 'Duplicates on library'		, args: 'TITLE IS #TITLE# AND ARTIST IS #ARTIST# AND DATE IS #$year(%date%)#'},
				{name: 'Same date (any track)'		, args: 'DATE IS #$year(%date%)#'},
				{name: 'Live versions of same song'	, args: 'TITLE IS #TITLE# AND ARTIST IS #ARTIST# AND (GENRE IS Live OR STYLE IS Live)'},
			];
			const queryFilterDefaults = [...queryFilter];
			let selArg = {args: 'TITLE IS #TITLE# AND ARTIST IS #ARTIST#'};
			// Create new properties with previous args
			menu_properties['dynamicQueries'] = ['\'Dynamic Queries...\' queries', JSON.stringify(queryFilter)];
			menu_properties['dynamicQueriesCustomArg'] = ['\'Dynamic Queries...\' Dynamic menu custom args', selArg.args];
			const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
			// Menus
			menu.newEntry({menuName, entryText: 'Based on Queries evaluated with sel:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			menu.newCondEntry({entryText: 'Dynamic Queries... (cond)', condFunc: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
				// Entry list
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
				queryFilter = JSON.parse(args.properties['dynamicQueries'][1]);
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
							if (!fb.GetFocusItem(true)) {fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.args, scriptName); return;}
							do_dynamic_query({query: queryObj.args});
						}, flags: focusFlags});
					}
				});
				menu.newEntry({menuName, entryText: 'sep'});
				{ // Static menu: user configurable
					menu.newEntry({menuName, entryText: 'By... (query)', func: (args = {...scriptDefaultArgs, ...defaultArgs, ...selArg}) => {
						// On first execution, must update from property
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
						args.args = selArg.args = args.properties['dynamicQueriesCustomArg'][1];
						// Input
						let query = '';
						try {query = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.', window.Name, args.args, true);}
						catch (e) {return;}
						if (!query.length) {return;}
						if (!fb.GetFocusItem(true)) {fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + query, scriptName); return;}
						// Playlist
						let handleList = do_dynamic_query({query});
						if (!handleList) {fb.ShowPopupMessage('Query failed:\n' + query, scriptName); return;}
						// For internal use original object
						selArg.args = query; 
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
						args.properties['dynamicQueriesCustomArg'][1] = query; // And update property with new value
						overwriteProperties(args.properties); // Updates panel
					}, flags: focusFlags});
					// Menu to configure property
					menu.newEntry({menuName, entryText: 'sep'});
				}
				{	// Add / Remove
					menu.newEntry({menuName, entryText: 'Add new entry to list...' , func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
						// Input all variables
						let input;
						let name = '';
						try {name = utils.InputBox(window.ID, 'Enter name for menu entry\nWrite \'sep\' to add a line.', window.Name, '', true);}
						catch (e) {return;}
						if (!name.length) {return;}
						if (name === 'sep') {input = {name};} // Add separator
						else { // or new entry
							let query = '';
							try {query = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.', window.Name, selArg.args, true);}
							catch (e) {return;}
							if (!query.length) {return;}
							input = {name, args: query};
							// Final check
							try {if (!do_dynamic_query({query: input.args, bPlaylist: false})) {throw 'error';}}
							catch (e) {fb.ShowPopupMessage('query not valid, check it and try again:\n' + query, scriptName);return;}
						}
						// Add entry
						queryFilter.push(input);
						// Save as property
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
						args.properties['dynamicQueries'][1] = JSON.stringify(queryFilter); // And update property with new value
						overwriteProperties(args.properties); // Updates panel
					}});
					{
						const subMenuSecondName = menu.newMenu('Remove entry from list...' + nextId('invisible', true, false), menuName);
						queryFilter.forEach( (queryObj, index) => {
							const text = (queryObj.name === 'sep' ? '------(separator)------' : (queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name));
							menu.newEntry({menuName: subMenuSecondName, entryText: text, func: () => {
								queryFilter.splice(index, 1);
								args.properties['dynamicQueries'][1] = JSON.stringify(queryFilter);
								overwriteProperties(args.properties); // Updates panel
							}});
						});
						menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
							queryFilter = [...queryFilterDefaults];
							args.properties['dynamicQueries'][1] = JSON.stringify(queryFilter);
							overwriteProperties(args.properties); // Updates panel
						}});
					}
				}
			}});
		}
		menu.newEntry({entryText: 'sep'});
	}
}

// Similar by...
{
	const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\search_bydistance.js';
	if (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e")){
		include(scriptPath);
		readmes['Search by Distance'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\search_bydistance.txt';
		// Delete unused properties
		const toDelete = ['genreWeight', 'styleWeight', 'dyngenreWeight', 'dyngenreRange', 'moodWeight', 'keyWeight', 'keyRange', 'dateWeight', 'dateRange', 'bpmWeight', 'bpmRange', 'composerWeight', 'customStrWeight', 'customNumWeight', 'customNumRange', 'forcedQuery', 'bUseAntiInfluencesFilter', 'bUseInfluencesFilter', 'scoreFilter', 'sbd_max_graph_distance', 'method', 'bNegativeWeighting', 'poolFilteringTag', 'poolFilteringN', 'bRandomPick', 'probPick', 'playlistLength', 'bSortRandom', 'bScatterInstrumentals', 'bProgressiveListOrder', 'bInKeyMixingPlaylist', 'bProgressiveListCreation', 'ProgressiveListCreationN'];
		let toMerge = {}; // Deep copy
		Object.keys(SearchByDistance_properties).forEach( (key) => {
			if (toDelete.indexOf(key) === -1) {
				toMerge[key] = [...SearchByDistance_properties[key]];
				toMerge[key][0] = '\'Search similar\' ' + toMerge[key][0];
			}
		});
		// And merge
		menu_properties = {...menu_properties, ...toMerge};
		// Set default args
		const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}], genreWeight: 0, styleWeight: 0, dyngenreWeight: 0, moodWeight: 0, keyWeight: 0, dateWeight: 0, bpmWeight: 0, composerWeight: 0, customStrWeight: 0, customNumWeight: 0, dyngenreRange: 0, keyRange: 0, dateRange: 0, bpmRange: 0, customNumRange: 0, bNegativeWeighting: true, bUseAntiInfluencesFilter: false, bUseInfluencesFilter: false, method: '', scoreFilter: 70, sbd_max_graph_distance: 100, poolFilteringTag: '', poolFilteringN: 3, bPoolFiltering: false, bRandomPick: true, probPick: 100, bSortRandom: true, bProgressiveListOrder: false, bScatterInstrumentals: true, bInKeyMixingPlaylist: false, bProgressiveListCreation: false, progressiveListCreationN: 3, bCreatePlaylist: true};
		const selArgs = [
			{title: 'sep'},
			{title: 'Nearest Tracks', args: {genreWeight: 15, styleWeight: 10, moodWeight: 5, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
				bpmRange: 25, probPick: 100, scoreFilter: 70}},
			{title: 'Similar Genre mix, within a decade', args: {genreWeight: 15, styleWeight: 10, moodWeight: 5, keyWeight: 5, dateWeight: 25, bpmWeight: 5,  dateRange: 15, bpmRange: 25, probPick: 100, scoreFilter: 60}},
			{title: 'Varied Styles/Genres mix, within a decade', args: {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, bpmRange: 25, probPick: 100, scoreFilter: 60}},
			{title: 'Random Styles/Genres mix, same Mood', args: {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 0, bpmWeight: 5, 
				bpmRange: 25, probPick: 100, scoreFilter: 50}}
			];
		{	
		// Graph
			let menuName = menu.newMenu('Search similar by Graph...');
			{	// Static menus
				menu.newEntry({menuName, entryText: 'Links similar genre/styles using complex relations:', func: null, flags: MF_GRAYED});
				const entryArgs = [
					{title: 'Nearest Tracks', args: {sbd_max_graph_distance: 50, method: 'GRAPH'}},
					{title: 'Similar Genre mix, within a decade', args: {sbd_max_graph_distance: 85, method: 'GRAPH'}},
					{title: 'Varied Styles/Genres mix, within a decade', args: {sbd_max_graph_distance: 150, method: 'GRAPH'}},
					{title: 'Random Styles/Genres mix, same Mood', args: {sbd_max_graph_distance: 400, method: 'GRAPH'}}
				];
				selArgs.forEach( (selArg) => {
					if (selArg.title === 'sep') {
						let entryMenuName = selArg.hasOwnProperty('menu') ? selArg.menu : menuName;
						menu.newEntry({menuName: entryMenuName, entryText: 'sep'});
					} else {
						const entryArg = entryArgs.find((item) => {return item.title === selArg.title;});
						let entryText = selArg.title;
						menu.newEntry({menuName, entryText, func: (args = {...scriptDefaultArgs, ...defaultArgs, ...selArg.args, ...entryArg.args}) => {
							args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
							do_searchby_distance(args);
						}, flags: focusFlags});
					}
				});
			}
		}
		{	// Dyngenre...
			let menuName = menu.newMenu('Search similar by DynGenre...');
			{	// Static menus
				menu.newEntry({menuName, entryText: 'Links similar genre/styles using simple grouping:', func: null, flags: MF_GRAYED});
				const entryArgs = [
					{title: 'Nearest Tracks', args: {dyngenreWeight: 20, dyngenreRange: 1, method: 'DYNGENRE'}},
					{title: 'Similar Genre mix, within a decade', args: {dyngenreWeight: 20, dyngenreRange: 1, method: 'DYNGENRE'}},
					{title: 'Varied Styles/Genres mix, within a decade', args: {dyngenreWeight: 20, dyngenreRange: 2, method: 'DYNGENRE'}},
					{title: 'Random Styles/Genres mix, same Mood', args: {dyngenreWeight: 20, dyngenreRange: 2, method: 'DYNGENRE'}}
				];
				selArgs.forEach( (selArg) => {
					if (selArg.title === 'sep') {
						let entryMenuName = selArg.hasOwnProperty('menu') ? selArg.menu : menuName;
						menu.newEntry({menuName: entryMenuName, entryText: 'sep'});
					} else {
						const entryArg = entryArgs.find((item) => {return item.title === selArg.title;});
						let entryText = selArg.title;
						menu.newEntry({menuName, entryText, func: (args = {...scriptDefaultArgs, ...defaultArgs, ...selArg.args, ...entryArg.args}) => {
							args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
							do_searchby_distance(args);
						}, flags: focusFlags});
					}
				});
			}
		}
		{	// Weight...
			let menuName = menu.newMenu('Search similar by Weight...');
			{	// Static menus
				menu.newEntry({menuName, entryText: 'Applies scoring according to tag similarity:', func: null, flags: MF_GRAYED});
				const entryArgs = [
					{title: 'Nearest Tracks', args: {method: 'WEIGHT'}},
					{title: 'Similar Genre mix, within a decade', args: {method: 'WEIGHT'}},
					{title: 'Varied Styles/Genres mix, within a decade', args: {method: 'WEIGHT'}},
					{title: 'Random Styles/Genres mix, same Mood', args: {method: 'WEIGHT'}}
				];
				selArgs.forEach( (selArg) => {
					if (selArg.title === 'sep') {
						let entryMenuName = selArg.hasOwnProperty('menu') ? selArg.menu : menuName;
						menu.newEntry({menuName: entryMenuName, entryText: 'sep'})
					} else {
						const entryArg = entryArgs.find((item) => {return item.title === selArg.title;});
						let entryText = selArg.title;
						menu.newEntry({menuName, entryText, func: (args = {...scriptDefaultArgs, ...defaultArgs, ...selArg.args, ...entryArg.args}) => {
							args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
							do_searchby_distance(args);
						}, flags: focusFlags});
					}
				});
			}
		}
		menu.newEntry({entryText: 'sep'});
		{	// -> Special playlists...
			// var menuName = menu.newMenu(specialMenu);
			{	// Static menus
				menu.newEntry({menuName: specialMenu, entryText: 'Based on Graph/Dyngenre/Weight:', func: null, flags: MF_GRAYED});
				const selArgs = [
					{title: 'sep'},
					{title: 'Influences from any date', args: {genreWeight: 5, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 0, bpmWeight: 10, bUseInfluencesFilter: true, probPick: 100, scoreFilter: 40, sbd_max_graph_distance: 500, method: 'GRAPH'}},
					{title: 'Influences within 20 years', args: {genreWeight: 5, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 10, dateRange: 20, bpmWeight: 10, bUseInfluencesFilter: true, probPick: 100, scoreFilter: 40, sbd_max_graph_distance: 500, method: 'GRAPH'}},
					{title: 'sep'},
					{title: 'Progressive playlist by genre/styles', args: {genreWeight: 15, styleWeight: 5, moodWeight: 30, keyWeight: 10, dateWeight: 5, dateRange: 35, bpmWeight: 10, probPick: 100, scoreFilter: 70, sbd_max_graph_distance: 200, method: 'GRAPH', bProgressiveListCreation: true, progressiveListCreationN: 3}},
					{title: 'Progressive playlist by mood', args: {genreWeight: 20, styleWeight: 20, moodWeight: 5, keyWeight: 20, dateWeight: 0, bpmWeight: 10, probPick: 100, scoreFilter: 60, sbd_max_graph_distance: 300, method: 'GRAPH', bProgressiveListCreation: true, progressiveListCreationN: 3}},
					{title: 'sep'},
					{title: 'Harmonic mix with similar genre/styles', args: {dyngenreWeight: 20, genreWeight: 15, styleWeight: 15, dyngenreRange: 2, keyWeight: 0, dateWeight: 5, dateRange: 25, scoreFilter: 70, method: 'DYNGENRE', 
						bInKeyMixingPlaylist: true}},
					{title: 'Harmonic mix with similar moods', args: {moodWeight: 35, genreWeight: 5, styleWeight: 5, dateWeight: 5, dateRange: 25, dyngenreWeight: 10, dyngenreRange: 3, keyWeight: 0, scoreFilter: 70, method: 'DYNGENRE', bInKeyMixingPlaylist: true}},
					{title: 'Harmonic mix with only instrumental tracks', args: {moodWeight: 15, genreWeight: 5, styleWeight: 5, dateWeight: 5, dateRange: 35, dyngenreWeight: 10, dyngenreRange: 3, keyWeight: 0, scoreFilter: 70, method: 'DYNGENRE', bInKeyMixingPlaylist: true, forcedQuery: 'GENRE IS Instrumental OR STYLE IS Instrumental'}}
					];
				selArgs.forEach( (selArg) => {
					if (selArg.title === 'sep') {
						menu.newEntry({menuName: specialMenu, entryText: 'sep'});
					} else {
						let entryText = selArg.title;
						menu.newEntry({menuName: specialMenu, entryText, func: (args = {...scriptDefaultArgs, ...defaultArgs, ...selArg.args}) => {
							args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
							const globQuery = args.properties['forcedQuery'][1];
							if (args.hasOwnProperty('forcedQuery') && globQuery.length && args['forcedQuery'] !== globQuery) { // Join queries if needed
								args['forcedQuery'] =  globQuery + ' AND ' + args['forcedQuery'];
							}
							do_searchby_distance(args);
						}, flags: focusFlags});
					}
				});
			}
		}
	}
}

// Special Playlists...
{	// Create it if it was not already created. Contains entries from multiple scripts
	if (!menu.hasMenu(specialMenu)) {
		menu.newMenu(specialMenu);
	}
	menu.newEntry({entryText: 'sep'});
}

// Tools...
{
	let menuName = menu.newMenu('Tools');
	{	// Remove Duplicates
		const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\remove_duplicates.js';
		if (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e")){
			include(scriptPath);
			readmes['Remove Duplicates'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\remove_duplicates.txt';
			let subMenuName = menu.newMenu('Duplicates and tag filtering', menuName);
			var sortInputDuplic = ['title', 'artist', 'date'];
			var sortInputFilter = ['title', 'artist', 'date'];
			var nAllowed = 2;
			// Create new properties with previous args
			menu_properties['sortInputDuplic'] = ['\'Tools\\Duplicates & Filtering\' Tags to remove duplicates', sortInputDuplic.join(',')];
			menu_properties['sortInputFilter'] = ['\'Tools\\Duplicates & Filtering\' Tags to filter playlists', sortInputFilter.join(',')];
			menu_properties['nAllowed'] = ['\'Tools\\Duplicates & Filtering\' Number of duplicates allowed (n + 1)', nAllowed];
			// Checks
			menu_properties['nAllowed'].push({greaterEq: 0, func: Number.isSafeInteger}, menu_properties['nAllowed'][1]);
			// Merge
			const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
			// Menus
			menu.newEntry({menuName: subMenuName, entryText: 'Filter playlists using tags or TF', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			menu.newEntry({menuName: subMenuName, entryText: () => {return 'Remove duplicates by ' + sortInputDuplic.join(', ');}, func: () => {do_remove_duplicatesV2(null, null, sortInputDuplic);}, flags: playlistCountFlags});
			menu.newEntry({menuName: subMenuName, entryText: () => {return 'Filter playlist by ' + sortInputFilter.join(', ') + ' (n = ' + nAllowed + ')';}, func: () => {do_remove_duplicatesV3(null, null, sortInputFilter, nAllowed);}, flags: playlistCountFlags});
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			menu.newEntry({menuName: subMenuName, entryText: 'Filter playlist by... (tags)' , func: () => {
				let tags;
				try {tags = utils.InputBox(window.ID, 'Enter list of tags separated by comma', window.Name, sortInputDuplic.join(','), true);}
				catch (e) {return;}
				if (!tags.length) {return;}
				tags = tags.split(',').filter((val) => val);
				let n;
				try {n = Number(utils.InputBox(window.ID, 'Number of duplicates allowed (n + 1)', window.Name, nAllowed, true));}
				catch (e) {return;}
				if (!Number.isSafeInteger(n)) {return;}
				do_remove_duplicatesV3(null, null, tags, n);
			}, flags: playlistCountFlags});
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			menu.newEntry({menuName: subMenuName, entryText: 'Set tags (for duplicates)... ', func: (args = {...scriptDefaultArgs}) => {
				const input = utils.InputBox(window.ID, 'Enter list of tags separated by comma', window.Name, sortInputDuplic.join(','));
				if (sortInputDuplic.join(',') === input) {return;}
				if (!input.length) {return;}
				sortInputDuplic = input.split(',').filter((n) => n);
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
				args.properties['sortInputDuplic'][1] = sortInputFilter.join(',');
				overwriteProperties(args.properties); // Updates panel
			}});
			menu.newEntry({menuName: subMenuName, entryText: 'Set tags (for filtering)... ', func: (args = {...scriptDefaultArgs}) => {
				const input = utils.InputBox(window.ID, 'Enter list of tags separated by comma', window.Name, sortInputFilter.join(','));
				if (sortInputFilter.join(',') === input) {return;}
				if (!input.length) {return;}
				sortInputFilter = input.split(',').filter((n) => n);
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
				args.properties['sortInputFilter'][1] = sortInputFilter.join(',');
				overwriteProperties(args.properties); // Updates panel
			}});
			menu.newEntry({menuName: subMenuName, entryText: 'Set number allowed (for filtering)... ', func: (args = {...scriptDefaultArgs}) => {
				const input = Number(utils.InputBox(window.ID, 'Number of duplicates allowed (n + 1)', window.Name, nAllowed));
				if (nAllowed === input) {return;}
				if (!Number.isSafeInteger(input)) {return;}
				nAllowed = input;
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
				args.properties['nAllowed'][1] = nAllowed;
				overwriteProperties(args.properties); // Updates panel
			}});
		}
	}
	{	// Filter by Query
		const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\filter_by_query.js';
		if (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e")){
			include(scriptPath);
			readmes['Filter by Query'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\filter_by_query.txt';
			const subMenuName = menu.newMenu('Query filtering', menuName);
			let queryFilter = [
					{name: 'Rating > 2', query: 'NOT (%rating% EQUAL 2 OR %rating% EQUAL 1)'}, 
					{name: 'Not live (except Hi-Fi)', query: 'NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi)'},  
					{name: 'Not multichannel', query: '%channels% LESS 3 AND NOT COMMENT HAS Quad'}, 
					{name: 'Not SACD or DVD', query: 'NOT %_path% HAS .iso AND NOT CODEC IS MLP AND NOT CODEC IS DSD64 AND NOT CODEC IS DST64'}, 
					{name: 'Global forced query', query: defaultArgs['forcedQuery']},
					{name: 'sep'},
					{name: 'Same song than sel', query: 'ARTIST IS #ARTIST# AND TITLE IS #TITLE# AND DATE IS #DATE#'},
					{name: 'Same genre than sel', query: 'GENRE IS #GENRE#'},
					{name: 'Same key than sel', query: 'KEY IS #KEY#'},
			];
			const queryFilterDefaults = [...queryFilter];
			// Create new properties with previous args
			menu_properties['queryFilter'] = ['\'Tools\\Query filtering\' queries', JSON.stringify(queryFilter)];
			const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
			// Menus
			menu.newEntry({menuName: subMenuName, entryText: 'Filter playlists using queries', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			menu.newCondEntry({entryText: 'Filter playlists using queries... (cond)', condFunc: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
				queryFilter = JSON.parse(args.properties['queryFilter'][1]);
				queryFilter.forEach( (queryObj) => {
					if (queryObj.name === 'sep') { // Create separators
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					} else { 
						// Create names for all entries
						const text = queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name;
						menu.newEntry({menuName: subMenuName, entryText: 'Filter playlist by ' + text, func: () => {
							let query = queryObj.query;
							let focusHandle = fb.GetFocusItem(true);
							if (focusHandle && query.indexOf('#') !== -1) {query = queryReplaceWithCurrent(query, focusHandle);}
							try {fb.GetQueryItems(new FbMetadbHandleList(), query);}
							catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, scriptName); return;}
							do_filter_by_query(null, query);
						}, flags: playlistCountFlags});
					}
				});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'Filter playlist by... (query)' , func: () => {
					let query;
					try {query = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.', window.Name, '', true);}
					catch (e) {return;}
					if (!query.length) {return;}
					let focusHandle = fb.GetFocusItem(true);
					if (focusHandle && query.indexOf('#') !== -1) {query = queryReplaceWithCurrent(query, focusHandle);}
					try {fb.GetQueryItems(new FbMetadbHandleList(), query);}
					catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, scriptName); return;}
					do_filter_by_query(null, query);
				}, flags: playlistCountFlags});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'Add new query to list...' , func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					let input;
					let name;
					try {name = utils.InputBox(window.ID, 'Enter name for menu entr.\nWrite \'sep\' to add a line.', window.Name, '', true);}
					catch (e) {return;}
					if (!name.length) {return;}
					if (name === 'sep') {input = {name};} // Add separator
					else {
						let query;
						try {query = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.', window.Name, '', true);}
						catch (e) {return;}
						if (!query.length) {return;}
						if (query.indexOf('#') === -1) { // Try the query only if it is not a dynamic one
							try {fb.GetQueryItems(new FbMetadbHandleList(), query);}
							catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, scriptName); return;}
						}
						input = {name, query};
					}
					queryFilter.push(input);
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					args.properties['queryFilter'][1] = JSON.stringify(queryFilter);
					overwriteProperties(args.properties); // Updates panel
				}});
				{
					const subMenuSecondName = menu.newMenu('Remove query from list...', subMenuName);
					queryFilter.forEach( (queryObj, index) => {
						const text = (queryObj.name === 'sep' ? '------(separator)------' : (queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name));
						menu.newEntry({menuName: subMenuSecondName, entryText: text, func: () => {
							queryFilter.splice(index, 1);
							args.properties['queryFilter'][1] = JSON.stringify(queryFilter);
							overwriteProperties(args.properties); // Updates panel
						}});
					});
					menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
						queryFilter = [...queryFilterDefaults];
						args.properties['queryFilter'][1] = JSON.stringify(queryFilter);
						overwriteProperties(args.properties); // Updates panel
					}});
				}
			}});
		}
	}
	menu.newEntry({menuName, entryText: 'sep'});
	{	// Create harmonic mix from playlist
		const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\harmonic_mixing.js';
		if (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e")){
			include(scriptPath);
			readmes['Harmonic Mix'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\harmonic_mixing.txt';
			let subMenuName = menu.newMenu('Harmonic mix', menuName);
			const selArgs = [
				{title: 'Harmonic mix from playlist'	, args: {selItems: () => {return plman.GetPlaylistItems(plman.ActivePlaylist);}}, flags: playlistCountFlags},
				{title: 'Harmonic mix from selection'	, args: {selItems: () => {return plman.GetPlaylistSelectedItems(plman.ActivePlaylist);}}, flags: multipleSelectedFlags},
			];
			// Menus
			menu.newEntry({menuName: subMenuName, entryText: 'Using rule of Fifths (new playlist):', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			selArgs.forEach( (selArg) => {
				if (selArg.title === 'sep') {
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				} else {
					let entryText = selArg.title;
					menu.newEntry({menuName: subMenuName, entryText, func: (args = {...defaultArgs, ...selArg.args}) => {
						args.selItems = args.selItems();
						do_harmonic_mixing(args);
					}, flags: selArg.flags ? selArg.flags : undefined});
				}
			});
		}
	}
	{	// Sort by key
		const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\sort_by_key.js';
		if (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e")){
			include(scriptPath);
			readmes['Sort by Key'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\sort_by_key.txt';
			let subMenuName = menu.newMenu('Sort by key', menuName);
			const selArgs = [
				{title: 'Incremental key', 	args: {sortOrder: 1}},
				{title: 'Decremental key',	args: {sortOrder: -1}},
			];
			// Menus
			menu.newEntry({menuName: subMenuName, entryText: 'Using Camelot Wheel\'s notation:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			selArgs.forEach( (selArg) => {
				if (selArg.title === 'sep') {
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				} else {
					let entryText = selArg.title;
					menu.newEntry({menuName: subMenuName, entryText, func: (args = {...defaultArgs, ...selArg.args}) => {
						do_sort_by_key();
					}, flags: multipleSelectedFlags});
				}
			});
		}
	}
	menu.newEntry({menuName, entryText: 'sep'});
	{	// Scatter
		const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\scatter_by_tags.js';
		if (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e")){
			include(scriptPath);
			let subMenuName = menu.newMenu('Scatter by tags', menuName);
			const selArgs = [
				{title: 'Scatter instrumental tracks'	, 	args: {tagName: 'genre,style', tagValue: 'Instrumental,Jazz,Instrumental Rock'}},
				{title: 'Scatter acoustic tracks'		, 	args: {tagName: 'genre,style,mood', tagValue: 'Acoustic'}},
				{title: 'Scatter electronic tracks'		,	args: {tagName: 'genre,style', tagValue: 'Electronic'}},
				{title: 'Scatter female vocal tracks'	,	args: {tagName: 'genre,style', tagValue: 'Female Vocal'}},
				{title: 'sep'},
				{title: 'Scatter sad mood tracks'		,	args: {tagName: 'mood', tagValue: 'Sad'}},
				{title: 'Scatter aggressive mood tracks', 	args: {tagName: 'mood', tagValue: 'Aggressive'}},
			];
			// Menus
			menu.newEntry({menuName: subMenuName, entryText: 'Reorder selection according to tags:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			selArgs.forEach( (selArg) => {
				if (selArg.title === 'sep') {
					menu.newEntry({menuName: subMenuName, entryText: 'sep'})
				} else {
					let entryText = selArg.title;
					menu.newEntry({menuName: subMenuName, entryText, func: (args = {...defaultArgs, ...selArg.args}) => {
						do_scatter_by_tags(args);
					}, flags: multipleSelectedFlags});
				}
			});
		}
	}
	menu.newEntry({menuName, entryText: 'sep'});
	{	// Check tags
		const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\check_library_tags.js';
		if (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e")){
			include(scriptPath);
			readmes['Check Tags'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\check_library_tags.txt';
			const subMenuName = menu.newMenu('Check tags', menuName);
			// Delete unused properties
			const toDelete = ['bUseDic'];
			let toMerge = {}; // Deep copy
			Object.keys(checkTags_properties).forEach( (key) => {
				if (toDelete.indexOf(key) === -1) {
					toMerge[key] = [...checkTags_properties[key]];
					toMerge[key][0] = '\'Tools\\Check tags\' ' + toMerge[key][0];
				}
			});
			// And merge
			menu_properties = {...menu_properties, ...toMerge};
			const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}], bUseDic: false};
			// For submenus
			const tagsToCheck = [
				{tag: 'genre'						, dscrpt: 'Genre (+ dictionary)'		, bUseDic: true	}, 
				{tag: 'style'						, dscrpt: 'Style (+ dictionary)'		, bUseDic: true	},
				{tag: 'mood'						, dscrpt: 'Mood (+ dictionary)'			, bUseDic: true	},
				{tag: 'composer'					, dscrpt: 'Composer'					, bUseDic: false},
				{tag: 'title'						, dscrpt: 'Title'						, bUseDic: false},
				'sep'																						 ,
				{tag: 'genre,style'					, dscrpt: 'Genre + Style (+ dictionary)', bUseDic: true	},
				{tag: 'composer,artist,albumartist'	, dscrpt: 'Composer + Artist'			, bUseDic: false},
			];
			// Menus
			menu.newEntry({menuName: subMenuName, entryText: 'Reports tagging errors (on selection)', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			menu.newEntry({menuName: subMenuName, entryText: 'Report errors by comparison', func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); //Update properties from the panel
				checkTags(args);
			}, flags: multipleSelectedFlags});
			menu.newEntry({menuName: subMenuName, entryText: 'Report errors + dictionary', func: (args = {...scriptDefaultArgs, ...defaultArgs,  bUseDic: true}) => {
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); //Update properties from the panel
				checkTags(args);
			}, flags: multipleSelectedFlags});
			{	// Submenu
				const subMenuSecondName = menu.newMenu('Check only...', subMenuName);
				menu.newEntry({menuName: subMenuSecondName, entryText: 'Limits comparisons to:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
				tagsToCheck.forEach( (obj) => {
					if (obj === 'sep') {menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});return;}
					menu.newEntry({menuName: subMenuSecondName, entryText: obj.dscrpt, func: (args = {...scriptDefaultArgs, ...defaultArgs, bUseDic: obj.bUseDic}) => {
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); //Update properties from the panel
						args.properties['tagNamesToCheck'][1] = obj.tag;
						checkTags(args);
					}, flags: multipleSelectedFlags});
				});
			}
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			menu.newEntry({menuName: subMenuName, entryText: 'Reports all tags. Slow! (on selection)', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			menu.newEntry({menuName: subMenuName, entryText: 'Report all tags by comparison', func: (args = {...scriptDefaultArgs, ...defaultArgs, freqThreshold: 1, maxSizePerTag: Infinity}) => {
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); //Update properties from the panel
				checkTags(args);
			}, flags: multipleSelectedFlags});
			menu.newEntry({menuName: subMenuName, entryText: 'Report all tags + dictionary', func: (args = {...scriptDefaultArgs, ...defaultArgs, freqThreshold: 1, maxSizePerTag: Infinity, bUseDic: true}) => {
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); //Update properties from the panel
				checkTags(args);
			}, flags: multipleSelectedFlags});
			{	// Submenu
				const subMenuSecondName = menu.newMenu('Report all from...', subMenuName);
				menu.newEntry({menuName: subMenuSecondName, entryText: 'Limits comparisons to:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
				tagsToCheck.forEach( (obj) => {
					if (obj === 'sep') {menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});return;}
					menu.newEntry({menuName: subMenuSecondName, entryText: obj.dscrpt, func: (args = {...scriptDefaultArgs, ...defaultArgs, freqThreshold: 1, maxSizePerTag: Infinity, bUseDic: obj.bUseDic}) => {
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); //Update properties from the panel
						args.properties['tagNamesToCheck'][1] = obj.tag;
						checkTags(args);
					}, flags: multipleSelectedFlags});
				});
			}
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			menu.newEntry({menuName: subMenuName, entryText: 'Configure tags to check...', func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
				const input = utils.InputBox(window.ID, 'Tag name(s) to check\nList \'tagName,tagName,...\' separated by \',\' :', window.Name, args.properties['tagNamesToCheck'][1]);
				if (args.properties['tagNamesToCheck'][1] === input) {return;}
				if (!input.length) {return;}
				args.properties['tagNamesToCheck'][1] = [...new Set(input.split(',').filter(Boolean))].join(','); // filter holes and remove duplicates
				overwriteProperties(args.properties); // Updates panel
			}});
			menu.newEntry({menuName: subMenuName, entryText: 'Configure excluded tag values...', func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); //Update properties from the panel
				addTagsToExclusionPopup(args);
			}});
			{
				const subMenuSecondName = menu.newMenu('Configure dictionary...', subMenuName);
				menu.newEntry({menuName: subMenuSecondName, entryText: 'Configure excluded tags for dictionary...', func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					const input = utils.InputBox(window.ID, 'Tag name(s) to not check against dictionary\nList \'tagName,tagName,...\' separated by \',\' :', window.Name, args.properties['tagNamesExcludedDic'][1]);
					if (args.properties['tagNamesExcludedDic'][1] === input) {return;}
					if (!input.length) {return;}
					args.properties['tagNamesExcludedDic'][1] = [...new Set(input.split(';').filter(Boolean))].join(';'); // filter holes and remove duplicates
					overwriteProperties(args.properties); // Updates panel
				}});
				menu.newEntry({menuName: subMenuSecondName, entryText: 'Set dictionary...', func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					const input = utils.InputBox(window.ID, 'Dictionary name:\n(available: de_DE, en_GB, en_US, fr_FR)\n', window.Name, args.properties['dictName'][1]);
					if (args.properties['dictName'][1] === input) {return;}
					if (!input.length) {return;}
					const dictPath = args.properties['dictPath'][1] + '\\' + input;
					if (isCompatible('1.4.0') ? !utils.IsDirectory(dictPath) : !utils.FileTest(dictPath, "d")) {fb.ShowPopupMessage('Folder does not exist:\n' + dictPath, scriptName); return;}
					args.properties['dictName'][1] = input;
					overwriteProperties(args.properties); // Updates panel
				}});
				menu.newEntry({menuName: subMenuSecondName, entryText: 'Sets dictionaries folder...', func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					const input = utils.InputBox(window.ID, 'Path to all dictionaries subfolders:', window.Name, args.properties['dictPath'][1]);
					if (args.properties['dictPath'][1] === input) {return;}
					if (!input.length) {return;}
					if (isCompatible('1.4.0') ? !utils.IsDirectory(input) : !utils.FileTest(input, "d")) {fb.ShowPopupMessage('Folder does not exist:\n' + input, scriptName); return;}
					args.properties['dictPath'][1] = input;
					overwriteProperties(args.properties); // Updates panel
				}});
			}
		}
	}
	{	// Automate tags
		const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\tags_automation.js';
		if (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e")){
			include(scriptPath);
			const subMenuName = menu.newMenu('Write tags', menuName);
			menu.newEntry({menuName: subMenuName, entryText: getTagsAutomationDescription, func: null, flags: MF_GRAYED});
			menu.newEntry({menuName: subMenuName, entryText: 'sep'});
			menu.newEntry({menuName: subMenuName, entryText:'Add tags on batch to selected tracks', func: tagsAutomation, flags: focusFlags});
		}
	}
	menu.newEntry({menuName, entryText: 'sep'});
	{	// Remove and find in playlists
		const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\find_remove_from_playlists.js';
		if (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e")){
			include(scriptPath);
			readmes['Find in and Remove from Playlists'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\find_remove_from_playlists.txt';
			// Add properties
			menu_properties['bFindShowCurrent'] = ['\'Tools\\Find track(s) in...\' show current playlist?', true];
			menu_properties['bRemoveShowLocked'] = ['\'Tools\\Remove track(s) from...\' show autoplaylists?', true];
			menu_properties['findRemoveSplitSize'] = ['\'Tools\\Find track(s) in...\' list submenu size', 10];
			menu_properties['maxSelCount'] = ['\'Tools\\Find  & Remove track(s)...\' max. track selection', 25];
			// Checks
			menu_properties['bFindShowCurrent'].push({func: isBoolean}, menu_properties['bFindShowCurrent'][1]);
			menu_properties['bRemoveShowLocked'].push({func: isBoolean}, menu_properties['bRemoveShowLocked'][1]);
			menu_properties['findRemoveSplitSize'].push({greater: 1, func: Number.isSafeInteger}, menu_properties['findRemoveSplitSize'][1]);
			menu_properties['maxSelCount'].push({greater: 0, func: Number.isSafeInteger}, menu_properties['maxSelCount'][1]);
			// Menus
			{	// Find now playing in
				const subMenuName = menu.newMenu('Find now playing track in...', menuName);
				const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
				menu.newCondEntry({entryText: 'Find now playing track in... (cond)', condFunc: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					menu.newEntry({menuName: subMenuName, entryText: 'Set focus on playlist with now playing track', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					const nowPlay = fb.GetNowPlaying();
					if (!nowPlay) {menu.newEntry({menuName: subMenuName, entryText: 'Playback is stopped (no playing track)', func: null, flags: MF_GRAYED}); return;}
					const sel = new FbMetadbHandleList(nowPlay);
					var inPlaylist = findInPlaylists(sel);
					const bShowCurrent = args.properties['bFindShowCurrent'][1];
					if (!bShowCurrent) {inPlaylist = inPlaylist.filter((playlist) => {return plman.ActivePlaylist !== playlist.index})}
					const playlistsNum = inPlaylist.length;
					if (playlistsNum) {
						// Split entries in sub-menus if there are too many playlists...
						let ss = args.properties['findRemoveSplitSize'][1];
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
									menu.newEntry({menuName: subMenu_i, entryText: playlist.name + (plman.ActivePlaylist === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {focusInPlaylist(sel, playlist.index)}, flags: (plman.ActivePlaylist === playlist.index ? MF_GRAYED : MF_STRING)});
								}
							}
						} else { // Or just show all
							for (const playlist of inPlaylist) {
								menu.newEntry({menuName: subMenuName,  entryText: playlist.name + (plman.ActivePlaylist === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {focusInPlaylist(sel, playlist.index)}, flags: (plman.ActivePlaylist === playlist.index ? MF_GRAYED : MF_STRING)});
							}
						}
					} else {
						menu.newEntry({menuName: subMenuName, entryText: 'Not found', func: null, flags: MF_GRAYED});
					}
				}});
			}
			{	// Find in Playlists
				const subMenuName = menu.newMenu('Find track(s) in...', menuName);
				const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
				menu.newCondEntry({entryText: 'Find track(s) in... (cond)', condFunc: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					menu.newEntry({menuName: subMenuName, entryText: 'Set focus on playlist with same track(s)', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					const sel = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
					const maxSelCount = args.properties['maxSelCount'][1]; // Don't create these menus when selecting more than these # tracks! Avoids lagging when creating the menu
					if (sel.Count > maxSelCount) {menu.newEntry({menuName: subMenuName, entryText: 'Too many tracks selected: > ' + maxSelCount, func: null, flags: MF_GRAYED}); return;}
					var inPlaylist = findInPlaylists(sel);
					const bShowCurrent = args.properties['bFindShowCurrent'][1];
					if (!bShowCurrent) {inPlaylist = inPlaylist.filter((playlist) => {return plman.ActivePlaylist !== playlist.index})}
					const playlistsNum = inPlaylist.length;
					if (playlistsNum) {
						// Split entries in sub-menus if there are too many playlists...
						let ss = args.properties['findRemoveSplitSize'][1];
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
									menu.newEntry({menuName: subMenu_i, entryText: playlist.name + (plman.ActivePlaylist === playlist.index ? ' (current playlist)' : ''), func: () => {focusInPlaylist(sel, playlist.index)}, flags: (plman.ActivePlaylist === playlist.index ? MF_GRAYED : MF_STRING)});
								}
							}
						} else { // Or just show all
							for (const playlist of inPlaylist) {
								menu.newEntry({menuName: subMenuName, entryText: playlist.name + (plman.ActivePlaylist === playlist.index ? ' (current playlist)' : ''), func: () => {focusInPlaylist(sel, playlist.index)}, flags: (plman.ActivePlaylist === playlist.index ? MF_GRAYED : MF_STRING)});
							}
						}
					} else {
						menu.newEntry({menuName: subMenuName, entryText: 'Not found', func: null, flags: MF_GRAYED});
					}
				}});
			}
			{	// Remove from Playlists
				const subMenuName = menu.newMenu('Remove track(s) from...', menuName);
				const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
				menu.newCondEntry({entryText: 'Remove track(s) from... (cond)', condFunc: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					menu.newEntry({menuName: subMenuName, entryText: 'Remove track(s) from selected playlist', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					const sel = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
					const maxSelCount = args.properties['maxSelCount'][1]; // Don't create these menus when selecting more than these # tracks! Avoids lagging when creating the menu
					if (sel.Count > maxSelCount) {menu.newEntry({menuName: subMenuName, entryText: 'Too many tracks selected: > ' + maxSelCount, func: null, flags: MF_GRAYED}); return;}
					var inPlaylist = findInPlaylists(sel);
					const bShowLocked = args.properties['bRemoveShowLocked'][1];
					if (!bShowLocked) {inPlaylist = inPlaylist.filter((playlist) => {return !playlist.bLocked})}
					const playlistsNum = inPlaylist.length ;
					if (playlistsNum) {
						// Split entries in sub-menus if there are too many playlists...
						let ss = args.properties['findRemoveSplitSize'][1];
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
									const playlistName =  playlist.name + (playlist.bLocked ? ' (locked playlist)' : '') + (plman.ActivePlaylist === playlist.index ? ' (current playlist)' : '')
									menu.newEntry({menuName: subMenu_i, entryText: playlistName, func: () => {removeFromPlaylist(sel, playlist.index)}, flags: playlist.bLocked ? MF_GRAYED : MF_STRING});
								}
							}
						} else { // Or just show all
							for (const playlist of inPlaylist) {
								const playlistName =  playlist.name + (playlist.bLocked ? ' (locked playlist)' : '') + (plman.ActivePlaylist === playlist.index ? ' (current playlist)' : '')
								menu.newEntry({menuName: subMenuName, entryText: playlistName, func: () => {removeFromPlaylist(sel, playlist.index)}, flags: playlist.bLocked ? MF_GRAYED : MF_STRING});
							}
						}
					} else {
						menu.newEntry({menuName: subMenuName, entryText: 'Not found', func: null, flags: MF_GRAYED});
					}
				}});
			}
			{	// Configure properties
				const subMenuName = menu.newMenu('Tools\\Find in and Remove from...', configMenu);
				{	// bFindShowCurrent (Find in Playlists)
					const subMenuSecondName = menu.newMenu('Show current playlist?', subMenuName);
					const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
					const options = ['Yes (greyed entry)', 'No (omit it)'];	
					menu.newEntry({menuName: subMenuSecondName, entryText: 'Only on \'Find track(s) in...\':', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuSecondName, entryText: options[0], func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
						args.properties['bFindShowCurrent'][1] = true;
						overwriteProperties(args.properties); // Updates panel
					}});
					menu.newEntry({menuName: subMenuSecondName, entryText: options[1], func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
						args.properties['bFindShowCurrent'][1] = false;
						overwriteProperties(args.properties); // Updates panel
					}});
					menu.checkMenu(subMenuSecondName, options[0], options[1],  (args = {...scriptDefaultArgs, ...defaultArgs}) => {
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); //Update properties from the panel
						return (args.properties['bFindShowCurrent'][1] ? 0 : 1);
					});
				}
				{	// bRemoveShowLocked (Remove from Playlists)
					const subMenuSecondName = menu.newMenu('Show locked playlist (autoplaylists, etc.)?', subMenuName);
					const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
					const options = ['Yes (locked, greyed entries)', 'No (omit them)'];	
					menu.newEntry({menuName: subMenuSecondName, entryText: 'Only on \'Remove track(s) from...\':', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuSecondName, entryText: options[0], func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
						args.properties['bRemoveShowLocked'][1] = true;
						overwriteProperties(args.properties); // Updates panel
					}});
					menu.newEntry({menuName: subMenuSecondName, entryText: options[1], func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
						args.properties['bRemoveShowLocked'][1] = false;
						overwriteProperties(args.properties); // Updates panel
					}});
					menu.checkMenu(subMenuSecondName, options[0], options[1],  (args = {...scriptDefaultArgs, ...defaultArgs}) => {
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); //Update properties from the panel
						return (args.properties['bRemoveShowLocked'][1] ? 0 : 1);
					});
				}
				{	// findRemoveSplitSize ( Find in / Remove from Playlists)
					const subMenuSecondName = menu.newMenu('Split playlist list submenus at...', subMenuName);
					const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
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
							menu.newEntry({menuName: subMenuSecondName, entryText: idx, func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
								args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
								args.properties['findRemoveSplitSize'][1] = val;
								overwriteProperties(args.properties); // Updates panel
							}});
						} else { // Last one is user configurable
							menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
							menu.newEntry({menuName: subMenuSecondName, entryText: idx, func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
								args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
								const input = Number(utils.InputBox(window.ID, 'Enter desired Submenu max size.\n', window.Name, args.properties['findRemoveSplitSize'][1]));
								if (args.properties['findRemoveSplitSize'][1] === input) {return;}
								if (!Number.isSafeInteger(input)) {return;}
								args.properties['findRemoveSplitSize'][1] = input;
								overwriteProperties(args.properties); // Updates panel
							}});
						}
					});
					menu.checkMenu(subMenuSecondName, optionsIdx[0], optionsIdx[optionsIdx.length - 1],  (args = {...scriptDefaultArgs, ...defaultArgs}) => {
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel
						const size = options.indexOf(args.properties['findRemoveSplitSize'][1]);
						return (size !== -1 ? size : options.length - 1);
					});
				}
 				{	// maxSelCount ( Find in / Remove from Playlists)
					const subMenuSecondName = menu.newMenu('Don\'t try to find tracks if selecting more than...', subMenuName);
					const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
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
							menu.newEntry({menuName: subMenuSecondName, entryText: idx, func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
								args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
								args.properties['maxSelCount'][1] = val;
								overwriteProperties(args.properties); // Updates panel
							}});
						} else { // Last one is user configurable
							menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
							menu.newEntry({menuName: subMenuSecondName, entryText: idx, func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
								args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
								const input = Number(utils.InputBox(window.ID, 'Enter max number of tracks.\n', window.Name, args.properties['maxSelCount'][1]));
								if (args.properties['maxSelCount'][1] === input) {return;}
								if (!Number.isSafeInteger(input)) {return;}
								args.properties['maxSelCount'][1] = input;
								overwriteProperties(args.properties); // Updates panel
							}});
						}
					});
					menu.checkMenu(subMenuSecondName, optionsIdx[0], optionsIdx[optionsIdx.length - 1],  (args = {...scriptDefaultArgs, ...defaultArgs}) => {
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel
						const size = options.indexOf(args.properties['maxSelCount'][1]);
						return (size !== -1 ? size : options.length - 1);
					});
				}
				menu.newEntry({menuName: configMenu, entryText: 'sep'});
			}
		}
	}
	menu.newEntry({menuName, entryText: 'sep'});
	{	// Playlist revive
		const scriptPath = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\playlist_revive.js';
		if (isCompatible('1.4.0') ? utils.IsFile(scriptPath) : utils.FileTest(scriptPath, "e")){
			include(scriptPath);
			readmes['Playlist Revive'] = fb.ProfilePath + 'scripts\\SMP\\xxx-scripts\\helpers\\readme\\playlist_revive.txt';
			{	// Submenu
				const subMenuName = menu.newMenu('Playlist Revive', menuName);
				// Create new properties with previous args
				menu_properties['simThreshold'] = ['\'Tools\\Playlist Revive\' similarity', 0.50];
				// Checks
				menu_properties['maxSelCount'].push({range: [[0,1]], func: !Number.isNaN}, menu_properties['maxSelCount'][1]);
				// Merge
				const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
				// Menus
				let entryTextFunc = (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					return args.properties['simThreshold'][1];
				};
				menu.newEntry({menuName: subMenuName, entryText: 'Replaces dead items with ones in library', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'Find dead items in all playlists', func: findDeadItems});
				menu.newEntry({menuName: subMenuName, entryText: 'Replace dead items in all playlists', func: playlistReviveAll});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText:'Replace dead items on selection', func:(args = {...scriptDefaultArgs, ...defaultArgs}) => {
					playlistRevive({selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: 1})
				}, flags: focusFlags});
				menu.newEntry({menuName: subMenuName, entryText:() => {return 'Replace dead items on selection (' + entryTextFunc() * 100 + '% simil.)'}, func:(args = {...scriptDefaultArgs, ...defaultArgs}) => {
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					playlistRevive({selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: args.properties['simThreshold'][1]})
				}, flags: focusFlags});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText:'Replace dead items on current playlist', func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
				playlistRevive({selItems: plman.GetPlaylistItems(plman.ActivePlaylist), simThreshold: 1})
				}, flags: playlistCountFlags});
				menu.newEntry({menuName: subMenuName, entryText:() => {return 'Replace dead items on current playlist (' + entryTextFunc() * 100 + '% simil.)'}, func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					playlistRevive({selItems: plman.GetPlaylistItems(plman.ActivePlaylist), simThreshold: args.properties['simThreshold'][1]})
				}, flags: playlistCountFlags});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText:'Simulate on selection (see console)', func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					playlistRevive({selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: 1, bSimulate: true})
				}, flags: focusFlags});
				menu.newEntry({menuName: subMenuName, entryText:() => {return 'Simulate on selection (' + entryTextFunc() * 100 + '% simil.) (see console)'}, func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					playlistRevive({selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: args.properties['simThreshold'][1], bSimulate: true})
				}, flags: focusFlags});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'Sets similarity threshold...', func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
					const input = Number(utils.InputBox(window.ID, 'Float number between 0 and 1:', window.Name, args.properties['simThreshold'][1]));
					if (args.properties['simThreshold'][1] === input) {return;}
					if (!Number.isFinite(input)) {return;}
					if (input < 0 || input > 1) {return;}
					args.properties['simThreshold'][1] = input;
					overwriteProperties(args.properties); // Updates panel
				}});
			}
		}
	}
	menu.newEntry({entryText: 'sep'});
}
// Configuration...
{
	// Create it if it was not already created. Contains entries from multiple scripts
	if (!menu.hasMenu(configMenu)) {
		menu.newMenu(configMenu);
	}
	{	// Menu to configure properties: playlistLength
		const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
		menu.newEntry({menuName: configMenu, entryText: 'Set Global Playlist Length... ', func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
			args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
			const input = Number(utils.InputBox(window.ID, 'Enter desired Playlist Length for playlist creation.\n', window.Name, args.properties['playlistLength'][1]));
			if (args.properties['playlistLength'][1] === input) {return;}
			if (!Number.isSafeInteger(input)) {return;}
			args.properties['playlistLength'][1] = input;
			overwriteProperties(args.properties); // Updates panel
		}});
	}
	{	// Menu to configure properties: forcedQuery
		const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
		menu.newEntry({menuName: configMenu, entryText: 'Set Global Forced Query... ', func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
			args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
			const input = utils.InputBox(window.ID, 'Enter global query added at playlist creation.\n', window.Name, args.properties['forcedQuery'][1]);
			if (args.properties['forcedQuery'][1] === input) {return;}
			try {fb.GetQueryItems(new FbMetadbHandleList(), input);} // Sanity check
			catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, scriptName); return;}
			args.properties['forcedQuery'][1] = input;
			overwriteProperties(args.properties); // Updates panel
		}});
	}
	menu.newEntry({menuName: configMenu, entryText: 'sep'});
	{	// Menu to configure properties: reset all
		const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
		menu.newEntry({menuName: configMenu, entryText: 'Reset all configuration... ', func: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
			args.properties = getPropertiesPairs(args.properties[0], args.properties[1]()); // Update properties from the panel. Note () call on second arg
			let answer = WshShell.Popup('Are you sure you want to restore all configuration to default?\nWill delete any related property, user saved menus, etc..', 0, window.Name, popup.question + popup.yes_no);
			if (answer === popup.yes) {
				// For the current instance
				for (let key in args.properties) {
					args.properties[key][1] = menu_properties[key][1];
				}
				overwriteProperties(args.properties); // Updates panel
				// For the panel (only along buttons)
				if (typeof buttons !== 'undefined' && Object.keys(menu_properties).length) {
					let panelProperties = getPropertiesPairs(menu_panelProperties, 'menu_');
					for (let key in args.panelProperties) {
						panelProperties[key][1] = menu_panelProperties[key][1];
					}
					overwriteProperties(panelProperties); // Updates panel
				}
				loadProperties(); // Refresh
			}
		}});
	}
	menu.newEntry({menuName: configMenu, entryText: 'sep'});
	{	// Readmes
		const subMenuName = menu.newMenu('Readmes...', configMenu);
		menu.newEntry({menuName: subMenuName, entryText: 'Open popup with readme:', func: null, flags: MF_GRAYED});
		menu.newEntry({menuName: subMenuName, entryText: 'sep'});
		let iCount = 0;
		if (Object.keys(readmes).length) {
			Object.entries(readmes).forEach(([key, value]) => { // Only show non empty files
				if ((isCompatible('1.4.0') ? utils.IsFile(value) : utils.FileTest(value, "e"))) {
					const readme = utils.ReadTextFile(value, 65001);
					if (readme.length) {
						menu.newEntry({menuName: subMenuName, entryText: key, func: () => {
							if ((isCompatible('1.4.0') ? utils.IsFile(value) : utils.FileTest(value, "e"))) {
								const readme = utils.ReadTextFile(value, 65001);
								if (readme.length) {fb.ShowPopupMessage(readme, key);}
							}
						}});
						iCount++;
					}
				}
			});
		} 
		if (!iCount) {menu.newEntry({menuName: subMenuName, entryText: '- no files - ', func: null, flags: MF_GRAYED});}
	}
}

/* 
	Properties after menu creation
*/ 
loadProperties();

/*
	Helpers
*/
function loadProperties() {
	if (typeof buttons === 'undefined' && Object.keys(menu_properties).length) { // Merge all properties when not loaded along buttons
		// With const var creating new properties is needed, instead of reassigning using A = {...A,...B}
		if (Object.keys(menu_panelProperties).length) {
			Object.entries(menu_panelProperties).forEach(([key, value]) => {menu_properties[key] = value;});
		}
		setProperties(menu_properties, menu_prefix);
		updateMenuProperties(getPropertiesPairs(menu_properties, menu_prefix));
	} else { // With buttons, set these properties only once per panel
		if (Object.keys(menu_panelProperties).length) {
			setProperties(menu_panelProperties, 'menu_');
		}
	}
}

function updateMenuProperties(propObject) {
	// Sanity checks
	propObject['playlistLength'][1] = Number(propObject['playlistLength'][1]);
	if (!Number.isSafeInteger(propObject['playlistLength'][1]) || propObject['playlistLength'][1] <= 0) {fb.ShowPopupMessage('Playlist length must be a positive integer.\n' + propObject['playlistLength'].slice(0,2), scriptName);}
	try {fb.GetQueryItems(new FbMetadbHandleList(), propObject['forcedQuery'][1]);}
	catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + propObject['forcedQuery'], scriptName);}
	// Info Popup
	let panelPropObject = (typeof buttons !== 'undefined') ? getPropertiesPairs(menu_panelProperties, 'menu_') : propObject;
	if (!panelPropObject['firstPopup'][1]) {
		panelPropObject['firstPopup'][1] = true;
		overwriteProperties(panelPropObject); // Updates panel
		const readmePath = readmes['Playlist Tools Menu'];
		if ((isCompatible('1.4.0') ? utils.IsFile(readmePath) : utils.FileTest(readmePath, "e"))) {
			const readme = utils.ReadTextFile(readmePath, 65001);
			if (readme.length) {fb.ShowPopupMessage(readme, 'Playlist Tools Menu');}
		}
	}
	// And update
	Object.entries(propObject).forEach(([key, value]) => {
		if (defaultArgs.hasOwnProperty(key)) {defaultArgs[key] = value[1];}
		// if (menu_properties.hasOwnProperty(key)) {menu_properties[key] = value;}
		// if (menu_panelProperties.hasOwnProperty(key)) {menu_panelProperties[key] = value;}
			// Specific
		if (key === 'ratingLimits') {defaultArgs[key] = defaultArgs[key].split(',');}
	});
}

function focusFlags() {return (fb.GetFocusItem(true) ? MF_STRING : MF_GRAYED);}
function playlistCountFlags() {return (plman.PlaylistItemCount(plman.ActivePlaylist) ? MF_STRING : MF_GRAYED);}
function multipleSelectedFlags() {return (plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count >= 3 ? MF_STRING : MF_GRAYED);}

/* 
	Tooltip
*/
// Show tooltip with current track info
function menuTooltip() {
	const selMul = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
	let infoMul = '';
	if (selMul.Count > 1) {
		infoMul = ' (multiple tracks selected: ' + selMul.Count + ')';
	}
	const sel = fb.GetFocusItem();
	let info = 'No track selected\nSome menus disabled';
	if (sel) {
		let tfo = fb.TitleFormat(
				'Current track:	%artist% / %track% - %title%' +
				'$crlf()Date:		[%date%]' +
				'$crlf()Genres:		[%genre%]' +
				'$crlf()Styles:		[%style%]' +
				'$crlf()Moods:		[%mood%]'
			);
		info = 'Playlist:		' + plman.GetPlaylistName(plman.ActivePlaylist) + infoMul + '\n';
		info += tfo.EvalWithMetadb(sel);
	}
	return info;
}