'use strict';
//21/08/22

/* 
	Playlist Tools Menu
	-----------------------------------
	Merges different playlist tools in one menu, called when pressing the button.
	If any script or plugin is missing, then the menu gets created without those entries.
	So the menu is created dynamically according to the foobar user's config.
		
	NOTE: menus are enclosed within {} scopes, so they can be easily rearranged, added or removed
	without affecting the other menus. Only exception to this rule are the menus named 'specialMenu'
	and 'configMenu', sub-menus collecting different entries from multiple scripts; They can be moved the 
	same than the others but obviously removing other menus/scripts affect these ones too.
	
	NOTE2: menuTooltip() can be called when used along buttons or integrated with other scripts to
	show info related to the track. To initiate the menu, call 'menu.btn_up(x, y)'. For ex:
	
	addEventListener('on_mouse_lbtn_up', (x, y) => {
		let sel = fb.GetFocusItem();
		if (!sel) {
			return;
		}
		menu.btn_up(x, y)
	});
	*/

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\helpers_xxx_prototypes.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\helpers_xxx_tags.js');
include('..\\helpers\\helpers_xxx_UI.js');
include('..\\helpers\\menu_xxx.js');
include('..\\helpers\\callbacks_xxx.js');

checkCompatible('1.6.1', 'smp');

if (!_isFolder(folders.data)) {_createFolder(folders.data);}

// Properties
const bNotProperties = true; // Don't load other properties
var menu_prefix = 'plto'; // Update this variable when loading it along a button
const menu_prefix_panel = menu_prefix;
var menu_properties = { // Properties are set at the end of the script, or must be set along the button. Menus may add new properties here
	playlistLength:				['Global Playlist length', 50],
	forcedQuery:				['Global forced query', 'NOT (%RATING% EQUAL 2 OR %RATING% EQUAL 1) AND NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi) AND %CHANNELS% LESS 3 AND NOT COMMENT HAS Quad'],
	forcedQueryMenusEnabled:	['Menus with forced query enabled', '{}'],
	ratingLimits:				['Set ratings extremes (ex. from 1 to 10 -> 1,10)', '1,5'],
	presets:					['Saved presets', '{}'],
	bShortcuts:					['Show keyboard shorcuts on entries?', true],
	bPlaylistNameCommands:		['Enable playlist name commands', false],
	keyTag:						['Key tag remap', 'KEY'], // It may be overwritten by Search by distance property too, are equivalent!
	styleGenreTag:				['Style/Genre tags for Dyngenre translation', JSON.stringify(['$ascii(%GENRE%)', '$ascii(%STYLE%)'])],
	async:						['Async processing',  JSON.stringify({'Check tags': true, 'Write tags': true, 'Pools': false, 'Search by distance': false, 'Remove duplicates': false, 'Import track list': false})],
	dynQueryEvalSel:			['Dynamic Queries evaluated on entire selection', JSON.stringify({'Dynamic queries': true, 'Playlist manipulation': true})]
};
// Global properties set only once per panel even if there are multiple buttons of the same script
const menu_panelProperties = {
	firstPopup:		['Playlist Tools: Fired once', false],
	menusEnabled: 	['List of menus enabled', '{}'],
	bTooltipInfo: 	['Show shortcuts on tooltip', true],
	bProfile: 		['Profiler logging', false],
	playlistPath: 	['Playlist manager tracked folders', '[]'],
	bDebug:			['Enable global debug to console', false],
	bDynamicMenus:	['Show dynamic menus?', true]
};
let menu_propertiesBack = JSON.parse(JSON.stringify(menu_properties));
let menu_panelPropertiesBack = JSON.parse(JSON.stringify(menu_panelProperties));

// Checks
menu_properties['playlistLength'].push({greater: 0, func: isInt}, menu_properties['playlistLength'][1]);
menu_properties['forcedQuery'].push({func: (query) => {return checkQuery(query, true);}}, menu_properties['forcedQuery'][1]);
menu_properties['forcedQueryMenusEnabled'].push({func: isJSON}, menu_properties['forcedQueryMenusEnabled'][1]);
menu_properties['presets'].push({func: isJSON}, menu_properties['presets'][1]);
menu_properties['keyTag'].push({func: (x) => {return (x === null || isStringWeak(x));}}, menu_properties['keyTag'][1]);
menu_properties['styleGenreTag'].push({func: isJSON}, menu_properties['styleGenreTag'][1]);
menu_properties['async'].push({func: isJSON}, menu_properties['async'][1]);
menu_properties['dynQueryEvalSel'].push({func: isJSON}, menu_properties['dynQueryEvalSel'][1]);
menu_properties['ratingLimits'].push({func: (str) => {return (isString(str) && str.length === 3 && str.indexOf(',') === 1);}}, menu_properties['ratingLimits'][1]);

/* 
	Load properties and set default global Parameters
*/
const defaultArgs = {
					playlistLength: menu_properties['playlistLength'][1], 
					forcedQuery: menu_properties['forcedQuery'][1], 
					ratingLimits: menu_properties['ratingLimits'][1].split(','),
					bHttpControl: () => {return utils.CheckComponent('foo_httpcontrol') && _isFolder(fb.ProfilePath + 'foo_httpcontrol_data\\ajquery-xxx')},
					httpControlPath: fb.ProfilePath + 'foo_httpcontrol_data\\ajquery-xxx\\smp\\',
					bDebug: menu_panelProperties['bDebug'][1],
					bProfile: menu_panelProperties['bProfile'][1],
					keyTag: menu_properties['keyTag'][1],
					styleGenreTag: JSON.parse(menu_properties['styleGenreTag'][1]),
					parent: null
};
const newReadmeSep = (() => {let i = 0; return (bFull = false) => {return (bFull ? {['sep' + ++i]: 'sep'} : ['sep' + ++i]);}})()
var readmes = { // {scriptName: path} or {arbitraryKey: 'sep'}
	'Playlist Tools Menu': folders.xxx + 'helpers\\readme\\playlist_tools_menu.txt',
	'Tagging requisites': folders.xxx + 'helpers\\readme\\tags_structure.txt',
	'Tags sources': folders.xxx + 'helpers\\readme\\tags_sources.txt',
	'Other tags notes': folders.xxx + 'helpers\\readme\\tags_notes.txt',
	...newReadmeSep(true),
};
loadProperties();
// Menu
const specialMenu = 'Special Playlists...';
const configMenu = 'Configuration';
const scriptName = 'Playlist Tools Menu';
const menu = new _menu();

// Enable/disable menu
const menuAlt = new _menu();
const menuAltAllowed = new Set([menu.getMainMenuName(), 'Playlist manipulation', 'Selection manipulation', 'Other tools', 'Pools', 'Script integration']);

// For enable/disable menus
const menusEnabled = JSON.parse(getPropertiesPairs(typeof buttonsBar === 'undefined' ? menu_properties : menu_panelProperties, menu_prefix, 0)['menusEnabled'][1]);
const menuDisabled = [];
var disabledCount = 0;

// ForcedQuery menus
var forcedQueryMenusEnabled = {};

// Presets menus
var presets = {};

// Other funcs by menus to be applied at property load
const deferFunc = [];

// Retrieve list of entries for further use after initialization
const allEntries = [];
deferFunc.push({name: 'retrieveAllEntries', func: () => {
	allEntries.splice(0, 0, ...menu.getEntriesAll(null, {pos: -1, args: false /*Skip cond entries which must run only on init*/}));
}});

// Key shortcuts
// Menu names strip anything after \t
// Adding new entries here automatically adds them to the associated menu
const shortcutsPath = folders.data + 'playlistTools_shortcuts.json';
var shortcuts = {
	'Tip': 		'Name may be arbitrary. \'Keys\' is the text to add. \'Menu\' must be set as: submenu_name + \\ + entry_name',
	example:	{keys: 'Ctrl + Shift + S',	menu: 'Submenu name\\Entry name'},
	example2:	{keys: 'Ctrl + Shift + S',	menu: 'Submenu name\\Entry name'}
}

// Other script integration
// Callbacks: append to any previously existing callback
const plmPromises = [];
addEventListener('on_notify_data', (name, info) => {
	switch (name) {
		case 'Playlist manager: playlistPath': {
			if (info && info.length) {
				const playlistPath = JSON.parse(menu_panelProperties.playlistPath[1]);
				let bDone = false;
				if (isArrayStrings(info)) {
					if (!new Set(playlistPath).isSuperset(new Set(info))) {
						playlistPath.concat([...new Set(info).difference(new Set(playlistPath))])
						bDone = true;
					}
				} else if (isStringWeak(info)) {
					if (playlistPath.indexOf(info) === -1) {
						playlistPath.push(info);
						bDone = true;
					}
				}
				if (bDone) {
					menu_panelProperties.playlistPath[1] = JSON.stringify(playlistPath);
					overwritePanelProperties(); // Updates panel
				}
			}
			break;
		}
		case 'Playlist manager: handleList': {
			if (info) {
				plmPromises.push(Promise.resolve(info));
			}
			break;
		}
	}
});

addEventListener('on_playlists_changed', () => {
	if (menu_properties.bPlaylistNameCommands[1]) {
		const playlistData = {num: plman.PlaylistCount, name: range(0, plman.PlaylistCount - 1, 1).map((idx) => {return plman.GetPlaylistName(idx);})};
		playlistData.name.forEach((name, index) => {
			const lName = name.toLowerCase();
			if (lName.startsWith('pt:')) {
				const command = name.slice(3);
				const lCommand = lName.slice(3);
				switch (lCommand) { // Short aliases
					case 'output' : {
						break; // Do nothing!
					}
					case 'duplicates': { // Meant to be used with current playlist after renaming!
						const sortInputDuplic = properties.hasOwnProperty('sortInputDuplic') ? properties.sortInputDuplic[1].replace(/,/g, ', ') : null;
						if (sortInputDuplic) {
							plman.ActivePlaylist = index;
							menu.btn_up(void(0), void(0), void(0), 'Duplicates and tag filtering\\Remove duplicates by ' + sortInputDuplic);
							plman.RenamePlaylist(plman.ActivePlaylist, 'Output');
						}
						break;
					}
					case 'harmonic': { // Meant to be used with current playlist after renaming!
						menu.btn_up(void(0), void(0), void(0), 'Harmonic mix\\Harmonic mix from playlist');
						plman.RemovePlaylist(index);
						break;
					}
					case 'graph': { // Requires a track on pls
						menu.btn_up(void(0), void(0), void(0), 'Search similar by Graph...\\Similar Genre mix, within a decade');
						plman.RemovePlaylist(index);
						break;
					}
					case 'filter': { // Meant to be used with current playlist after renaming!
						const sortInputFilter = properties.hasOwnProperty('sortInputFilter') ? properties.sortInputFilter[1].replace(/,/g, ', ') : null;
						const nAllowed = properties.hasOwnProperty('nAllowed') ? '(' + properties.nAllowed[1] + ')' : null;
						if (sortInputFilter && nAllowed) {
							plman.ActivePlaylist = index;
							menu.btn_up(void(0), void(0), void(0), ' Duplicates and tag filtering\Filter playlist by ' + sortInputFilter + ' ' + nAllowed);
							plman.RenamePlaylist(plman.ActivePlaylist, 'Output');
						}
						break;
					}
					case 'similar': { // Requires a track on pls
						menu.btn_up(void(0), void(0), void(0), 'Search same by tags...\\By Styles (=2) and Moods (=6)');
						plman.RemovePlaylist(index);
						break;
					}
					default: { // Full menus
						if (command.indexOf('\\') !== -1) {
							plman.RemovePlaylistSwitch(index);
							menu.btn_up(void(0), void(0), void(0), command);
						}
					}
				}
			}
		});
	}
});

addEventListener('on_output_device_changed', () => {
	if (typeof exportDevices !== 'undefined') {
		if (defaultArgs.bHttpControl() && !exportDevices(defaultArgs.httpControlPath)) {console.log('Error saving Devices entries for http Control integration.')}
	}
});

addEventListener('on_dsp_preset_changed', () => {
	if (typeof exportDSP !== 'undefined') {
		if (defaultArgs.bHttpControl() && !exportDSP(defaultArgs.httpControlPath)) {console.log('Error saving DSP entries for http Control integration.')}
	}
});

/* 
	Menus
*/
// Most played tracks from year
{
	const scriptPath = folders.xxx + 'main\\top_tracks_from_date.js';
	const scriptPathElse = folders.xxx + 'main\\top_tracks.js';
	if (utils.CheckComponent('foo_enhanced_playcount') && _isFile(scriptPath)) {
		const name = 'Most played Tracks from...';
		if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
			include(scriptPath);
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
				menu.newEntry({menuName, entryText: 'Most played (all years)', func: (args = {...defaultArgs}) => {do_top_tracks(args);}});
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
	} else if (utils.CheckComponent('foo_playcount') && _isFile(scriptPathElse)) {
		const name = 'Most played Tracks';
		if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
			readmes[name] = folders.xxx + 'helpers\\readme\\top_tracks.txt';
			// All years
			include(scriptPathElse);
			menu.newEntry({entryText: name, func: (args = { ...defaultArgs}) => {do_top_tracks(args);}}); // Skips menu name, added to top
			menu.newEntry({entryText: 'sep'});
		} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length  + disabledCount++});}
	}
}

// Top rated Tracks from year
{
	const scriptPath = folders.xxx + 'main\\top_rated_tracks.js';
	if (utils.CheckComponent('foo_playcount') && _isFile(scriptPath)) {
		const name = 'Top rated Tracks from...';
		if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
			include(scriptPath);
			readmes[name] = folders.xxx + 'helpers\\readme\\top_rated_tracks.txt';
			const menuName = menu.newMenu(name);
			menu.newEntry({menuName, entryText: 'Based on ratings (' + defaultArgs.ratingLimits.join(' to ') + '):', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			const currentYear = new Date().getFullYear();
			const selYearArr = [ [currentYear], [currentYear - 1], 'sep', [2000, currentYear], [1990, 2000], [1980, 1990], [1970, 1980], [1960, 1970], [1950, 1960], [1940, 1950]];
			selYearArr.forEach( (selYear) => {
				if (selYear === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
				let selArgs = { ...defaultArgs};
				let dateQuery = '';
				if (selYear.length === 2) {
					dateQuery = '"$year(%DATE%)" GREATER ' + selYear[0] + ' AND "$year(%DATE%)" LESS ' + selYear[1];
				} else {
					dateQuery = '"$year(%DATE%)" IS ' + selYear;
				}
				selArgs.forcedQuery = selArgs.forcedQuery.length ? '(' + dateQuery + ') AND (' + selArgs.forcedQuery + ')' : dateQuery;
				selArgs.playlistName = 'Top ' + selArgs.playlistLength + ' Rated Tracks ' + selYear.join('-');
				menu.newEntry({menuName, entryText: 'Top rated from ' + selYear.join('-'), func: (args = selArgs) => {do_top_rated_tracks(args);}});
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
					let selArgs = { ...defaultArgs};
					let dateQuery = '';
					if (selYear.length === 2) {
						dateQuery = '"$year(%DATE%)" GREATER ' + selYear[0] + ' AND "$year(%DATE%)" LESS ' +  selYear[1];
					} else {
						dateQuery = '"$year(%DATE%)" IS ' + selYear;
					}
					selArgs.forcedQuery = selArgs.forcedQuery.length ? '(' + dateQuery + ') AND (' + selArgs.forcedQuery + ')' : dateQuery;
					selArgs.playlistName = 'Top ' + selArgs.playlistLength + ' Rated Tracks ' + selYear.join('-');
					do_top_rated_tracks(selArgs);
				}});
			}
			menu.newEntry({entryText: 'sep'});
		} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
	}
}

// Same by...
{
	const scriptPath = folders.xxx + 'main\\search_same_by.js';
	if (_isFile(scriptPath)){
		const name = 'Search same by tags...';
		if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
			include(scriptPath);
			readmes[newReadmeSep()] = 'sep';
			readmes[name] = folders.xxx + 'helpers\\readme\\search_same_by.txt';
			forcedQueryMenusEnabled[name] = true;
			const menuName = menu.newMenu(name);
			{	// Dynamic menu
				let sameByQueries = [
					{args: {sameBy: {mood: 6}}}, {args: {sameBy: {genre: 2}}}, {args: {sameBy: {style: 2}}},
					{args: {sameBy: {composer: 2}}}, {args: {sameBy: {key: 1}}},
					{name: 'sep'},
					{args: {sameBy: {style: 2, mood: 6}}}, {args: {sameBy: {style: 2, date: 10}}},
				];
				let selArg = {...sameByQueries[0]};
				const sameByQueriesDefaults = [...sameByQueries];
				// Create new properties with previous args
				menu_properties['sameByQueries'] = [name + ' queries', JSON.stringify(sameByQueries)];
				menu_properties['sameByCustomArg'] = [name + ' Dynamic menu custom args', convertObjectToString(selArg.args.sameBy)];
				// Checks
				menu_properties['sameByQueries'].push({func: isJSON}, menu_properties['sameByQueries'][1]);
				menu_properties['sameByCustomArg'].push({func: isString}, menu_properties['sameByCustomArg'][1]);
				// Menus
				menu.newEntry({menuName, entryText: 'Based on Queries matching minimum (X) tags:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName, entryText: 'sep'});
				menu.newCondEntry({entryText: 'Search same by tags... (cond)', condFunc: () => {
					// Entry list
					sameByQueries = JSON.parse(menu_properties['sameByQueries'][1]);
					sameByQueries.forEach( (queryObj) => {
						// Add separators
						if (queryObj.hasOwnProperty('name') && queryObj.name === 'sep') {
							let entryMenuName = queryObj.hasOwnProperty('menu') ? queryObj.menu : menuName;
							menu.newEntry({menuName: entryMenuName, entryText: 'sep'});
						} else { 
							// Create names for all entries
							let queryName = '';
							if (!queryObj.hasOwnProperty('name') || !queryObj.name.length) {
								Object.keys(queryObj.args.sameBy).forEach((key, index, array) => {
									queryName += (!queryName.length ? '' : index !== array.length - 1 ? ', ' : ' and ');
									queryName += capitalize(key) + (queryObj.args.sameBy[key] > 1 ? 's' : '') + ' (=' + queryObj.args.sameBy[key] + ')';
									});
							} else {queryName = queryObj.name;}
							queryName = queryName.length > 40 ? queryName.substring(0,40) + ' ...' : queryName;
							queryObj.name = queryName;
							// Entries
							const sameByArgs = {...queryObj.args, playlistLength: defaultArgs.playlistLength, forcedQuery: defaultArgs.forcedQuery};
							if (!forcedQueryMenusEnabled[name]) {sameByArgs.forcedQuery = '';}
							menu.newEntry({menuName, entryText: 'By ' + queryName, func: () => {do_search_same_by(sameByArgs);}, flags: focusFlags});
						}
					});
					menu.newEntry({menuName, entryText: 'sep'});
					{ // Static menu: user configurable
						menu.newEntry({menuName, entryText: 'By... (pairs of tags)', func: () => {
							// On first execution, must update from property
							selArg.args.sameBy = convertStringToObject(menu_properties['sameByCustomArg'][1], 'number', ',');
							// Input
							let input;
							try {input = utils.InputBox(window.ID, 'Enter pairs of \'tag, number of matches\', separated by comma.\n', scriptName + ': ' + name, convertObjectToString(selArg.args.sameBy, ','), true);}
							catch (e) {return;}
							if (!input.length) {return;}
							// For internal use original object
							selArg.args.sameBy = convertStringToObject(input, 'number', ',');
							menu_properties['sameByCustomArg'][1] = convertObjectToString(selArg.args.sameBy); // And update property with new value
							overwriteMenuProperties(); // Updates panel
							const sameByArgs = {...selArg.args, playlistLength: defaultArgs.playlistLength, forcedQuery: defaultArgs.forcedQuery};
							if (!forcedQueryMenusEnabled[name]) {sameByArgs.forcedQuery = '';}
							do_search_same_by(sameByArgs);
						}, flags: focusFlags});
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
							if (entryName === 'sep') {input = {name: entryName};} // Add separator
							else { // or new entry
								try {input = utils.InputBox(window.ID, 'Enter pairs of \'tag, number of matches\', separated by comma.\n', scriptName + ': ' + name, convertObjectToString(selArg.args.sameBy, ','), true);}
								catch (e) {return;}
								if (!input.length) {return;}
								if (input.indexOf(',') === -1) {return;}
								if (input.indexOf(';') !== -1) {return;}
								let logic = 'AND';
								try {logic = utils.InputBox(window.ID, 'Enter logical operator to combine queries for each different tag.\n', scriptName + ': ' + name, logic, true);}
								catch (e) {return;}
								if (!logic.length) {return;}
								let remap;
								try {remap = utils.InputBox(window.ID, 'Remap tags to apply the same query to both.\nEnter \'mainTagA,toTag,...;mainTagB,...\'\nSeparated by \',\' and \';\'.\n', scriptName + ': ' + name, '', true);}
								catch (e) {return;}
								let bOnlyRemap = false;
								if (remap.length) {
									const answer = WshShell.Popup('Instead of applying the same query remapped tags, the original tag may be remapped to the desired track. Forcing that Tag B should match TagA.\nFor example: Finds tracks where involved people matches artist from selection', 0, scriptName + ': ' + name, popup.question + popup.yes_no);
									if (answer === popup.yes) {bOnlyRemap = true;}
								}
								input = {name: entryName, args: {sameBy: convertStringToObject(input, 'number', ','), logic, remapTags: remap.length ? convertStringToObject(remap, 'string', ',', ';') : {}, bOnlyRemap}};
								// Final check
								const sel = fb.GetFocusItem();
								if (sel) {
									const selInfo = sel.GetFileInfo();
									if (!Object.keys(input.args.sameBy).every((key) => {return selInfo.MetaFind(key) === -1})) {
										try {if (!do_search_same_by({...input.args, bSendToPls: false})) {throw 'error';}}
										catch (e) {fb.ShowPopupMessage('Arguments not valid, check them and try again:\n' + JSON.stringify(input), scriptName); return;}
									}
								}
							}
							// Add entry
							sameByQueries.push(input);
							// Save as property
							menu_properties['sameByQueries'][1] = JSON.stringify(sameByQueries); // And update property with new value
							// Presets
							if (!presets.hasOwnProperty('sameByQueries')) {presets.sameByQueries = [];}
							presets.sameByQueries.push(input);
							menu_properties['presets'][1] = JSON.stringify(presets);
							overwriteMenuProperties(); // Updates panel
						}});
						{
							const subMenuSecondName = menu.newMenu('Remove entry from list...' + nextId('invisible', true, false), menuName);
							sameByQueries.forEach( (queryObj, index) => {
								const entryText = (queryObj.name === 'sep' ? '------(separator)------' : (queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name));
								menu.newEntry({menuName: subMenuSecondName, entryText, func: () => {
									sameByQueries.splice(index, 1);
									menu_properties['sameByQueries'][1] = JSON.stringify(sameByQueries);
									// Presets
									if (presets.hasOwnProperty('sameByQueries')) {
										presets.sameByQueries.splice(presets.sameByQueries.findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(queryObj);}), 1);
										if (!presets.sameByQueries.length) {delete presets.sameByQueries;}
										menu_properties['presets'][1] = JSON.stringify(presets);
									}
									overwriteMenuProperties(); // Updates panel
								}});
							});
							if (!sameByQueries.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
							menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
							menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
								sameByQueries = [...sameByQueriesDefaults];
								menu_properties['sameByQueries'][1] = JSON.stringify(sameByQueries);
								// Presets
								if (presets.hasOwnProperty('sameByQueries')) {
									delete presets.sameByQueries;
									menu_properties['presets'][1] = JSON.stringify(presets);
								}
								overwriteMenuProperties(); // Updates panel
							}});
						}
					}
				}});
			}
			{	// Static menus: Special playlist (at other menu)
				if (!menusEnabled.hasOwnProperty(specialMenu) || menusEnabled[specialMenu] === true) {
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
									entryText += capitalize(key) + (selArg.args.sameBy[key] > 1 ? 's' : '') + ' (=' + selArg.args.sameBy[key] + ')';
									});
							} else {entryText = selArg.title;}
							let entryMenuName = selArg.hasOwnProperty('menu') ? selArg.menu : menuName;
							menu.newEntry({menuName: entryMenuName, entryText, func: (args = {...defaultArgs, ...selArg.args}) => {do_search_same_by(args);}, flags: focusFlags});
						}
					});
				}
				menu.newEntry({entryText: 'sep'});
			}
		} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
	}
}

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
					{name: 'Rating 4-5', query: '%RATING% EQUAL 5 OR %RATING% EQUAL 4', sort: {tfo: '%RATING%', direction: 1}},
					{name: 'sep'},
					{name: 'Recently played', query: '%last_played% DURING LAST 1 WEEK', sort: {tfo: '%last_played%', direction: -1}},
					{name: 'Recently added', query: '%added% DURING LAST 1 WEEK', sort: {tfo: '%added%', direction: -1}},
					{name: 'sep'},
					{name: 'Rock tracks', query: 'GENRE IS Rock OR GENRE IS Alt. Rock OR GENRE IS Progressive Rock OR GENRE IS Hard Rock OR GENRE IS Rock & Roll', sort: {tfo: '$rand()', direction: 1}},
					{name: 'Psychedelic tracks', query: 'GENRE IS Psychedelic Rock OR GENRE IS Psychedelic OR STYLE IS Neo-Psychedelia OR STYLE IS Psychedelic Folk', sort: {tfo: '$rand()', direction: 1}},
					{name: 'Folk \\ Country tracks', query: 'GENRE IS Folk OR GENRE IS Folk-Rock OR GENRE IS Country', sort: {tfo: '$rand()', direction: 1}},
					{name: 'Blues tracks', query: 'GENRE IS Blues', sort: {tfo: '$rand()', direction: 1}},
					{name: 'Jazz tracks', query: 'GENRE IS Jazz OR GENRE IS Jazz Vocal', sort: {tfo: '$rand()', direction: 1}},
					{name: 'Soul \\ RnB tracks', query: 'GENRE IS Soul OR STYLE IS R&B', sort: {tfo: '$rand()', direction: 1}},
					{name: 'Hip-Hop tracks', query: 'GENRE IS Hip-Hop', sort: {tfo: '$rand()', direction: 1}}
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
								do_dynamic_query({query, sort: queryObj.sort}); 
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
							let handleList = do_dynamic_query({query: forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length ? (query.length && query.toUpperCase() !== 'ALL' ? '(' + query + ') AND (' + defaultArgs.forcedQuery + ')' : query) : (!query.length ? 'ALL' : query)});
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
					{name: 'Same title (any artist)'	, query: '"$stricmp($ascii(%TITLE%),$ascii(#TITLE#))" IS 1'},
					{name: 'Same songs (by artist)'		, query: '"$stricmp($ascii(%TITLE%),$ascii(#TITLE#))" IS 1 AND ARTIST IS #ARTIST#'},
					{name: 'Duplicates on library'		, query: '"$stricmp($ascii(%TITLE%),$ascii(#TITLE#))" IS 1 AND ARTIST IS #ARTIST# AND DATE IS #$year(%DATE%)#'},
					{name: 'sep'},
					{name: 'Same date (any track/artist)'		, query: 'DATE IS #$year(%DATE%)#'},
					{name: 'sep'},
					{name: 'Acoustic versions of song'	, query: '"$stricmp($ascii(%TITLE%),$ascii(#TITLE#))" IS 1 AND ARTIST IS #ARTIST# AND (GENRE IS Acoustic OR STYLE IS Acoustic OR MOOD IS Acoustic)'},
					{name: 'Live versions of song'	, query: '"$stricmp($ascii(%TITLE%),$ascii(#TITLE#))" IS 1 AND ARTIST IS #ARTIST# AND (GENRE IS Live OR STYLE IS Live)'},
					{name: 'Cover versions of song'	, query: '"$stricmp($ascii(%TITLE%),$ascii(#TITLE#))" IS 1 AND NOT ARTIST IS #ARTIST#'},
					{name: 'sep'},
					{name: 'Rated >2 tracks (by artist)'	, query: '%RATING% GREATER 2 AND ARTIST IS #ARTIST#'},
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
								if (bEvalSel) {do_dynamic_query({query, sort: queryObj.sort, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist)})}
								else{do_dynamic_query({query, sort: queryObj.sort});}
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
							const handleList = bEvalSel ? do_dynamic_query({query, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist)}) : do_dynamic_query({query});
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
								try {if (!do_dynamic_query({query, bSendToPls: false})) {throw 'error';}}
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

// Similar by...Graph\Dyngenre\Weight
{
	const scriptPath = folders.xxx + 'main\\search_bydistance.js';
	if (_isFile(scriptPath)){
		const nameGraph = 'Search similar by Graph...';
		const nameDynGenre = 'Search similar by DynGenre...';
		const nameWeight = 'Search similar by Weight...';
		if (!menusEnabled.hasOwnProperty(nameGraph) || !menusEnabled.hasOwnProperty(nameDynGenre) || !menusEnabled.hasOwnProperty(nameWeight) || !menusEnabled.hasOwnProperty(specialMenu) || menusEnabled[nameGraph] === true || menusEnabled[nameDynGenre] === true || menusEnabled[nameWeight] === true || menusEnabled[specialMenu] === true) {
			include(scriptPath);
			readmes[newReadmeSep()] = 'sep';
			readmes['Search similar by... (main)'] = folders.xxx + 'helpers\\readme\\search_bydistance.txt';
			readmes['Search similar by... (recipes\\themes)'] = folders.xxx + 'helpers\\readme\\search_bydistance_recipes_themes.txt';
			readmes['Search similar by... (similar artists)'] = folders.xxx + 'helpers\\readme\\search_bydistance_similar_artists.txt';
			readmes['Search similar by... (user descriptors)'] = folders.xxx + 'helpers\\readme\\search_bydistance_user_descriptors.txt';
			readmes['Search similar by Graph'] = folders.xxx + 'helpers\\readme\\search_bydistance_graph.txt';
			readmes['Search similar by Dyngenre'] = folders.xxx + 'helpers\\readme\\search_bydistance_dyngenre.txt';
			readmes['Search similar by Weight'] = folders.xxx + 'helpers\\readme\\search_bydistance_weight.txt';
			const selArgs = [
				{name: 'sep'},
				{name: 'Nearest Tracks', args: {genreWeight: 15, styleWeight: 10, moodWeight: 5, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, 
					bpmRange: 25, probPick: 100, scoreFilter: 70}},
				{name: 'Similar Genre mix, within a decade', args: {genreWeight: 15, styleWeight: 10, moodWeight: 5, keyWeight: 5, dateWeight: 25, bpmWeight: 5,  dateRange: 15, bpmRange: 25, probPick: 100, scoreFilter: 70}},
				{name: 'Varied Styles/Genres mix, within a decade', args: {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 25, bpmWeight: 5,  dateRange: 15, bpmRange: 25, probPick: 100, scoreFilter: 60}},
				{name: 'Random Styles/Genres mix, same Mood', args: {genreWeight: 0, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 0, bpmWeight: 5, 
					bpmRange: 25, probPick: 100, scoreFilter: 50}}
				];
			let similarBy = [
				];
			// Delete unused properties
			const toDelete = ['genreWeight', 'styleWeight', 'dyngenreWeight', 'dyngenreRange', 'moodWeight', 'keyWeight', 'keyRange', 'dateWeight', 'dateRange', 'bpmWeight', 'bpmRange', 'composerWeight', 'customStrWeight', 'customNumWeight', 'customNumRange', 'forcedQuery', 'bUseAntiInfluencesFilter', 'bUseInfluencesFilter', 'scoreFilter', 'sbd_max_graph_distance', 'method', 'bNegativeWeighting', 'poolFilteringTag', 'poolFilteringN', 'bRandomPick', 'probPick', 'playlistLength', 'bSortRandom', 'bScatterInstrumentals', 'bProgressiveListOrder', 'bInKeyMixingPlaylist', 'bProgressiveListCreation', 'ProgressiveListCreationN'];
			let toMerge = {}; // Deep copy
			Object.keys(SearchByDistance_properties).forEach((key) => {
				if (toDelete.indexOf(key) === -1) {
					toMerge[key] = [...SearchByDistance_properties[key]];
					toMerge[key][0] = '\'Search similar\' ' + toMerge[key][0];
				}
			});
			// And merge
			menu_properties = {...menu_properties, ...toMerge};
			menu_properties['similarBy'] = ['Search similar by Graph\\Dyngenre\\Weight... args', JSON.stringify(similarBy)];
			// Check
			menu_properties['similarBy'].push({func: isJSON}, menu_properties['similarBy'][1]);
			// Set default args
			const scriptDefaultArgs = {properties: menu_properties, genreWeight: 0, styleWeight: 0, dyngenreWeight: 0, moodWeight: 0, keyWeight: 0, dateWeight: 0, bpmWeight: 0, composerWeight: 0, customStrWeight: 0, customNumWeight: 0, dyngenreRange: 0, keyRange: 0, dateRange: 0, bpmRange: 0, customNumRange: 0, bNegativeWeighting: true, bUseAntiInfluencesFilter: false, bUseInfluencesFilter: false, method: '', scoreFilter: 70, sbd_max_graph_distance: 100, poolFilteringTag: [], poolFilteringN: -1, bPoolFiltering: false, bRandomPick: true, probPick: 100, bSortRandom: true, bProgressiveListOrder: false, bScatterInstrumentals: true, bInKeyMixingPlaylist: false, bProgressiveListCreation: false, progressiveListCreationN:1, bCreatePlaylist: true};
			// Menus
			function loadMenus(menuName, selArgs, entryArgs = []){
				selArgs.forEach( (selArg) => {
					if (selArg.name === 'sep') {
						let entryMenuName = selArg.hasOwnProperty('menu') ? selArg.menu : menuName;
						menu.newEntry({menuName: entryMenuName, entryText: 'sep'});
					} else {
						const entryArg = entryArgs.find((item) => {return item.name === selArg.name;}) || {};
						let entryText = selArg.name;
						menu.newEntry({menuName, entryText, func: (args = {...scriptDefaultArgs, ...defaultArgs, ...selArg.args, ...entryArg.args}) => {
							const globQuery = args.properties['forcedQuery'][1];
							if (args.hasOwnProperty('forcedQuery') && globQuery.length && args['forcedQuery'] !== globQuery) { // Join queries if needed
								args['forcedQuery'] =  globQuery + ' AND ' + args['forcedQuery'];
							}
							do_searchby_distance(args);
						}, flags: focusFlags});
					}
				});
			}
			function loadMenusCond(menuName, method){
				menu.newCondEntry({entryText: 'Search similar by Graph\\Dyngenre\\Weight... (cond)', condFunc: () => {
					similarBy = JSON.parse(menu_properties.similarBy[1]);
					const entries = similarBy.map((item) => {
						if (!item.hasOwnProperty('method')) {
							item.method = method;
							if (item.hasOwnProperty('args')) {item.args.method = method;}
						}
						return item;
					}).filter((item) => {return item.method === method;});
					loadMenus(menuName, entries);
				}});
			}
			{	// Graph
				if (!menusEnabled.hasOwnProperty(nameGraph) || menusEnabled[nameGraph] === true) {
					let menuName = menu.newMenu(nameGraph);
					{	// Static menus
						menu.newEntry({menuName, entryText: 'Similar tracks by genre/style complex relations:', func: null, flags: MF_GRAYED});
						const distanceUnit = music_graph_descriptors.intra_supergenre; // 100
						const entryArgs = [
							{name: 'Nearest Tracks', args: {sbd_max_graph_distance: distanceUnit / 2, method: 'GRAPH'}}, // 50
							{name: 'Similar Genre mix, within a decade', args: {scoreFilter: 70, sbd_max_graph_distance: music_graph_descriptors.cluster, method: 'GRAPH'}}, // 85
							{name: 'Varied Styles/Genres mix, within a decade', args: {sbd_max_graph_distance: distanceUnit * 3/2, method: 'GRAPH'}}, //150
							{name: 'Random Styles/Genres mix, same Mood', args: {sbd_max_graph_distance: distanceUnit * 4, method: 'GRAPH'}} //400
						];
						loadMenus(menuName, selArgs, entryArgs);
						loadMenusCond(menuName, 'GRAPH');
					}
				} else {menuDisabled.push({menuName: nameGraph, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
			{	// Dyngenre...
				if (!menusEnabled.hasOwnProperty(nameDynGenre) || menusEnabled[nameDynGenre] === true) {
					let menuName = menu.newMenu(nameDynGenre);
					{	// Static menus
						menu.newEntry({menuName, entryText: 'Similar tracks by genre/style simple grouping:', func: null, flags: MF_GRAYED});
						const distanceUnit = 1;
						const entryArgs = [
							{name: 'Nearest Tracks', args: {dyngenreWeight: 25, dyngenreRange: distanceUnit, method: 'DYNGENRE'}},
							{name: 'Similar Genre mix, within a decade', args: {dyngenreWeight: 10, dyngenreRange: distanceUnit, method: 'DYNGENRE'}},
							{name: 'Varied Styles/Genres mix, within a decade', args: {dyngenreWeight: 10, dyngenreRange: distanceUnit * 2, method: 'DYNGENRE'}},
							{name: 'Random Styles/Genres mix, same Mood', args: {dyngenreWeight: 5, dyngenreRange: distanceUnit * 4, method: 'DYNGENRE'}}
						];
						loadMenus(menuName, selArgs, entryArgs);
						loadMenusCond(menuName, 'DYNGENRE');
					}
				} else {menuDisabled.push({menuName: nameDynGenre, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
			{	// Weight...
				if (!menusEnabled.hasOwnProperty(nameWeight) || menusEnabled[nameWeight] === true) {
					let menuName = menu.newMenu(nameWeight);
					{	// Static menus
						menu.newEntry({menuName, entryText: 'Similar tracks by tag matching scoring:', func: null, flags: MF_GRAYED});
						const entryArgs = [
							{name: 'Nearest Tracks', args: {method: 'WEIGHT'}},
							{name: 'Similar Genre mix, within a decade', args: {method: 'WEIGHT'}},
							{name: 'Varied Styles/Genres mix, within a decade', args: {method: 'WEIGHT'}},
							{name: 'Random Styles/Genres mix, same Mood', args: {method: 'WEIGHT'}}
						];
						loadMenus(menuName, selArgs, entryArgs);
						loadMenusCond(menuName, 'WEIGHT');
					}
				} else {menuDisabled.push({menuName: nameWeight, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
			menu.newEntry({entryText: 'sep'});
			{	// -> Special playlists...
				if (!menusEnabled.hasOwnProperty(specialMenu) || menusEnabled[specialMenu] === true) {
					menu.newEntry({menuName: specialMenu, entryText: 'Based on Graph/Dyngenre/Weight:', func: null, flags: MF_GRAYED});
					const selArgs = [
						{name: 'sep'},
						{name: 'Influences from any date', args: {genreWeight: 5, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 0, bpmWeight: 10, bUseInfluencesFilter: true, probPick: 100, scoreFilter: 40, sbd_max_graph_distance: 500, method: 'GRAPH'}},
						{name: 'Influences within 20 years', args: {genreWeight: 5, styleWeight: 5, moodWeight: 15, keyWeight: 10, dateWeight: 10, dateRange: 20, bpmWeight: 10, bUseInfluencesFilter: true, probPick: 100, scoreFilter: 40, sbd_max_graph_distance: 500, method: 'GRAPH'}},
						{name: 'sep'},
						{name: 'Progressive playlist by genre/styles', args: {genreWeight: 15, styleWeight: 5, moodWeight: 30, keyWeight: 10, dateWeight: 5, dateRange: 35, bpmWeight: 10, probPick: 100, scoreFilter: 70, sbd_max_graph_distance: 200, method: 'GRAPH', bProgressiveListCreation: true, progressiveListCreationN: 3}},
						{name: 'Progressive playlist by mood', args: {genreWeight: 20, styleWeight: 20, moodWeight: 5, keyWeight: 20, dateWeight: 0, bpmWeight: 10, probPick: 100, scoreFilter: 60, sbd_max_graph_distance: 300, method: 'GRAPH', bProgressiveListCreation: true, progressiveListCreationN: 3}},
						{name: 'sep'},
						{name: 'Harmonic mix with similar genre/styles', args: {dyngenreWeight: 20, genreWeight: 15, styleWeight: 15, dyngenreRange: 2, keyWeight: 0, dateWeight: 5, dateRange: 25, scoreFilter: 70, method: 'DYNGENRE', 
							bInKeyMixingPlaylist: true}},
						{name: 'Harmonic mix with similar moods', args: {moodWeight: 35, genreWeight: 5, styleWeight: 5, dateWeight: 5, dateRange: 25, dyngenreWeight: 10, dyngenreRange: 3, keyWeight: 0, scoreFilter: 70, method: 'DYNGENRE', bInKeyMixingPlaylist: true}},
						{name: 'Harmonic mix with only instrumental tracks', args: {moodWeight: 15, genreWeight: 5, styleWeight: 5, dateWeight: 5, dateRange: 35, dyngenreWeight: 10, dyngenreRange: 3, keyWeight: 0, scoreFilter: 70, method: 'DYNGENRE', bInKeyMixingPlaylist: true, forcedQuery: 'GENRE IS Instrumental OR STYLE IS Instrumental'}}
						];
					// Menus
					function loadMenusCond(method){
						menu.newCondEntry({entryText: 'Special playlists... (cond)', condFunc: () => {
							similarBy = JSON.parse(menu_properties.similarBy[1]);
							const entries = similarBy.filter((item) => {return item.method === method;});
							loadMenus(specialMenu, entries);
						}});
					}
					loadMenus(specialMenu, selArgs);
					loadMenusCond('SPECIAL');
				}
			}
			{	// -> Config menu
				if (!menusEnabled.hasOwnProperty(configMenu) || menusEnabled[configMenu] === true) {
					{
						const submenu = menu.newMenu('Search by Distance', configMenu);
						{ 	// Find genre/styles not on graph
							menu.newEntry({menuName: submenu, entryText: 'Find genres/styles not on Graph', func: () => {
								// Skipped values at pre-filter
								const tagValuesExcluded = new Set(menu_properties['genreStyleFilter'][1].split(',').filter(Boolean)); // Filter holes and remove duplicates
								// Get all tags and their frequency
								const tagsToCheck = [...new Set(menu_properties['genreTag'][1].concat(',', menu_properties['styleTag'][1]).split(',').filter(Boolean))]; // Merge and filter
								if (!tagsToCheck.length) {
									fb.ShowPopupMessage('There are no tags to check set at properties panel:\n' + menu_properties['genreTag'][0], scriptName);
									return;
								}
								// Get tags
								const tags = new Set(getTagsValuesV4(fb.GetLibraryItems(), tagsToCheck, false, true).flat(Infinity));
								// Get node list (+ weak substitutions + substitutions + style cluster)
								const nodeList = new Set(music_graph_descriptors.style_supergenre.flat(Infinity)).union(new Set(music_graph_descriptors.style_weak_substitutions.flat(Infinity))).union(new Set(music_graph_descriptors.style_substitutions.flat(Infinity))).union(new Set(music_graph_descriptors.style_cluster.flat(Infinity)));
								// Compare (- user exclusions - graph exclusions)
								const missing = tags.difference(nodeList).difference(tagValuesExcluded).difference(music_graph_descriptors.map_distance_exclusions);
								// Report
								const userFile = folders.userHelpers + 'music_graph_descriptors_xxx_user.js';
								const userFileFound = _isFile(userFile) ? '' : ' (not found)';
								const userFileEmpty = !userFileFound.length && Object.keys(music_graph_descriptors_user).length ? '' : ' (empty)';
								const report = 'Graph descriptors:\n' +
												'(scripts folder) .\\helpers\\music_graph_descriptors_xxx.js\n' +
												'(profile folder) .\\js_data\\helpers\\music_graph_descriptors_xxx_user.js' + userFileFound + userFileEmpty + '\n\n' +
												'List of tags not present on the graph descriptors:\n' +
												[...missing].sort().join(', ');
								fb.ShowPopupMessage(report, scriptName);
							}});
							// Graph debug
							menu.newEntry({menuName: submenu, entryText: 'Debug Graph (check console)', func: () => {
								if (defaultArgs.bProfile) {var profiler = new FbProfiler('graphDebug');}
								graphDebug(all_music_graph, true); // Show popup on pass
								if (defaultArgs.bProfile) {profiler.Print();}
							}});
							// Graph test
							menu.newEntry({menuName: submenu, entryText: 'Run distance tests (check console)', func: () => {
								if (defaultArgs.bProfile) {var profiler = new FbProfiler('testGraph');}
								testGraph(all_music_graph);
								testGraphV2(all_music_graph);
								if (defaultArgs.bProfile) {profiler.Print();}
							}});
							// Graph cache reset Async
							menu.newEntry({menuName: submenu, entryText: 'Reset link cache', func: () => {
								_deleteFile(folders.data + 'searchByDistance_cacheLink.json');
								_deleteFile(folders.data + 'searchByDistance_cacheLinkSet.json');
								cacheLink = void(0);
								cacheLinkSet = void(0);
								updateCache({bForce: true, properties: menu_properties}); // Creates new one and also notifies other panels to discard their cache
							}});
						}
						menu.newEntry({menuName: submenu, entryText: 'sep'});
						{
							const submenuTwo = menu.newMenu('Tag remapping...' + nextId('invisible', true, false), submenu);
							{	// Menu to configure tags
								const options = ['genre', 'style', 'mood', 'bpm', 'key', 'composer', 'date', 'customStr', 'customNum'];
								menu.newEntry({menuName: submenuTwo, entryText: 'Tag remapping (only this tool):', func: null, flags: MF_GRAYED})
								menu.newEntry({menuName: submenuTwo, entryText: 'sep'})
								menu.newCondEntry({entryText: 'Tags... (cond)', condFunc: () => {
									// Create menu on 2 places: tool config submenu and global tag submenu
									const configMmenu = 'Tag remapping...';
									menu.newEntry({menuName: configMmenu, entryText: 'sep'});
									const configSubmenu = menu.newMenu(submenu + '...' + nextId('invisible', true, false), configMmenu);
									options.forEach((tagName) => {
										const key = tagName + 'Tag';
										[configSubmenu, submenuTwo].forEach((sm) => {
											menu.newEntry({menuName: sm, entryText: capitalize(tagName) + '\t[' + menu_properties[key][1] + ']', func: () => {
												const input = utils.InputBox(window.ID, 'Enter desired tag name(s):\n(In some cases merging multiple tags is allowed, check the readme)', scriptName + ': ' + configMenu, menu_properties[key][1]);
												if (!input.length) {return;}
												if (menu_properties[tagName + 'Tag'][1] === input) {return;}
												if (defaultArgs.hasOwnProperty(key)) {defaultArgs[key] = input;}
												menu_properties[key][1] = input;
												overwriteMenuProperties(); // Updates panel
												if (tagName === 'genre' || tagName === 'style') {
													const answer = WshShell.Popup('Reset link cache now?\nOtherwise do it manually after all tag changes.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
													if (answer === popup.yes) {
														menu.btn_up(void(0), void(0), void(0), 'Search by Distance\\Reset link cache');
													}
												}
											}});
										});
									});
								}});
							}
						}
						menu.newEntry({menuName: submenu, entryText: 'sep'});
						{ // Create theme
							menu.newEntry({menuName: submenu, entryText: 'Create theme file with selected track', func: () => {
								// Tag names
								const genreTag = menu_properties['genreTag'][1].split(',').filter(Boolean);
								const styleTag = menu_properties['styleTag'][1].split(',').filter(Boolean);
								const moodTag = menu_properties['moodTag'][1].split(',').filter(Boolean);
								const dateTag = menu_properties['dateTag'][1].split(',').filter(Boolean); // only allows 1 value, but put it into an array
								const composerTag = menu_properties['composerTag'][1].split(',').filter(Boolean);
								const customStrTag = menu_properties['customStrTag'][1].split(',').filter(Boolean);
								const customNumTag = menu_properties['customNumTag'][1].split(',').filter(Boolean); // only allows 1 value, but put it into an array
								// Tag Values
								const selHandleList = new FbMetadbHandleList(fb.GetFocusItem());
								const genre = genreTag.length ? getTagsValuesV3(selHandleList, genreTag, true).flat().filter(Boolean) : [];
								const style = styleTag.length ? getTagsValuesV3(selHandleList, styleTag, true).flat().filter(Boolean) : [];
								const mood = moodTag.length ? getTagsValuesV3(selHandleList, moodTag, true).flat().filter(Boolean) : [];
								const composer = composerTag.length ? getTagsValuesV3(selHandleList, composerTag, true).flat().filter(Boolean) : [];
								const customStr = customStrTag.length ? getTagsValuesV3(selHandleList, customStrTag, true).flat().filter(Boolean) : [];
								const restTagNames = ['key', dateTag.length ? dateTag[0] : 'skip', 'bpm', customNumTag.length ? customNumTag[0] : 'skip']; // 'skip' returns empty arrays...
								const [keyArr, dateArr, bpmArr, customNumArr] = getTagsValuesV4(selHandleList, restTagNames).flat();
								const key = keyArr;
								const date = dateTag.length ? [Number(dateArr[0])] : [];
								const bpm = bpmArr.length ? [Number(bpmArr[0])] : [];
								const customNum = customNumTag.length ? [Number(customNumArr[0])] : [];
								// Theme obj
								let input = '';
								try {input = utils.InputBox(window.ID, 'Enter theme name', scriptName + ': ' + configMenu, 'my theme', true);}
								catch (e) {return;}
								if (!input.length) {return;}
								const theme = {name: input, tags: []};
								theme.tags.push({genre, style, mood, key, date, bpm, composer, customStr, customNum});
								const filePath = folders.xxx + 'presets\\Search by\\themes\\' + input + '.json';
								const bDone = _save(filePath, JSON.stringify(theme, null, '\t'));
								if (!bDone) {fb.ShowPopupMessage('Error saving theme file:' + filePath, scriptName + ': ' + name); return;}
							}, flags: focusFlags});
						}
						menu.newEntry({menuName: submenu, entryText: 'sep'});
						{ // Open descriptors
							menu.newEntry({menuName: submenu, entryText: 'Open main descriptor', func: () => {
								const file = folders.xxx + 'helpers\\music_graph_descriptors_xxx.js';
								if (_isFile(file)){_explorer(file); _run('notepad.exe', file);}
							}});
							menu.newEntry({menuName: submenu, entryText: 'Open user descriptor', func: () => {
								const file = folders.userHelpers + 'music_graph_descriptors_xxx_user.js';
								if (!_isFile(file)){
									_copyFile(folders.xxx + 'helpers\\music_graph_descriptors_xxx_user.js', file);
									const readme = _open(folders.xxx + 'helpers\\readme\\search_bydistance_user_descriptors.txt', utf8);
									if (readme.length) {fb.ShowPopupMessage(readme, 'User descriptors');}
								}
								if (_isFile(file)){_explorer(file); _run('notepad.exe', file);}
							}});
						}
						menu.newEntry({menuName: submenu, entryText: 'sep'});
						{ // Open graph html file
							menu.newEntry({menuName: submenu, entryText: 'Show Music Graph on Browser', func: () => {
								const file = folders.xxx + 'Draw Graph.html';
								if (_isFile(file)){_run(file);}
							}});
						}
					}
					menu.newEntry({menuName: configMenu, entryText: 'sep'});
					{
						const subMenuName = 'Harmonic mixing';
						if (!menu.hasMenu(subMenuName, configMenu)) {
							menu.newMenu(subMenuName, configMenu);
							{	// bHarmonicMixDoublePass
								menu.newEntry({menuName: subMenuName, entryText: 'For any tool which uses harmonic mixing:', func: null, flags: MF_GRAYED});
								menu.newEntry({menuName: subMenuName, entryText: 'sep'});
								menu.newEntry({menuName: subMenuName, entryText: 'Enable double pass to match more tracks', func: () => {
									menu_properties['bHarmonicMixDoublePass'][1] = !menu_properties['bHarmonicMixDoublePass'][1];
									overwriteMenuProperties(); // Updates panel
								}});
								menu.newCheckMenu(subMenuName, 'Enable double pass to match more tracks', void(0), () => {return menu_properties['bHarmonicMixDoublePass'][1];});
							}
							menu.newEntry({menuName: configMenu, entryText: 'sep'});
						}
					}
				} else {menuDisabled.push({menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		} else {
			menuDisabled.push({menuName: nameGraph, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
			menuDisabled.push({menuName: nameDynGenre, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
			menuDisabled.push({menuName: nameWeight, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
		}
	}
}

// Special Playlists...
{	// Create it if it was not already created. Contains entries from multiple scripts
	if (!menusEnabled.hasOwnProperty(specialMenu) || menusEnabled[specialMenu] === true) {
		if (!menu.hasMenu(specialMenu)) {
			menu.newMenu(specialMenu);
		}
		menu.newEntry({entryText: 'sep'});
	} else if (menuDisabled.findIndex((menu) => {return menu.menuName === specialMenu}) === -1) {menuDisabled.push({menuName: specialMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}

// Playlist manipulation...
{
	const name = 'Playlist manipulation';
	if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
		readmes[newReadmeSep()] = 'sep';
		let menuName = menu.newMenu(name);
		{	// Remove Duplicates / Show Duplicates
			const scriptPath = folders.xxx + 'main\\remove_duplicates.js';
			if (_isFile(scriptPath)){
				const name = 'Duplicates and tag filtering';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath);
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\remove_duplicates.txt';
					let subMenuName = menu.newMenu(name, menuName);
					let sortInputDuplic = ['title', 'artist', 'date'];
					let sortInputFilter = ['title', 'artist', 'date'];
					let nAllowed = 2;
					// Create new properties with previous args
					menu_properties['sortInputDuplic'] = [menuName + '\\' + name + ' Tags to remove duplicates', sortInputDuplic.join(',')];
					menu_properties['sortInputFilter'] = [menuName + '\\' + name + ' Tags to filter playlists', sortInputFilter.join(',')];
					menu_properties['nAllowed'] = [menuName + '\\' + name + ' Filtering number allowed (n + 1)', nAllowed];
					// Checks
					menu_properties['sortInputDuplic'].push({func: isString}, menu_properties['sortInputDuplic'][1]);
					menu_properties['sortInputFilter'].push({func: isString}, menu_properties['sortInputFilter'][1]);
					menu_properties['nAllowed'].push({greaterEq: 0, func: isInt}, menu_properties['nAllowed'][1]);
					// Menus
					menu.newEntry({menuName: subMenuName, entryText: 'Filter playlists using tags or TF:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newCondEntry({entryText: 'Remove Duplicates... (cond)', condFunc: () => {
						// Update args
						sortInputDuplic = menu_properties.sortInputDuplic[1].split(',');
						sortInputFilter = menu_properties.sortInputFilter[1].split(',');
						nAllowed = menu_properties.nAllowed[1];
						// Menus		
						menu.newEntry({menuName: subMenuName, entryText: 'Remove duplicates by ' + sortInputDuplic.join(', '), func: () => {removeDuplicatesV2({checkKeys: sortInputDuplic});}, flags: playlistCountFlagsAddRem});
						menu.newEntry({menuName: subMenuName, entryText: 'Show duplicates by ' + sortInputDuplic.join(', '), func: () => {showDuplicates({checkKeys: sortInputDuplic});}, flags: playlistCountFlagsAddRem});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Filter playlist by ' + sortInputFilter.join(', ') + ' (n = ' + nAllowed + ')', func: () => {removeDuplicates({checkKeys: sortInputFilter, nAllowed});}, flags: playlistCountFlagsAddRem});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Filter playlist by... (tags)' , func: () => {
							let tags;
							try {tags = utils.InputBox(window.ID, 'Enter list of tags separated by comma', scriptName + ': ' + name, sortInputDuplic.join(','), true);}
							catch (e) {return;}
							if (!tags.length) {return;}
							tags = tags.split(',').filter((val) => val);
							let n;
							try {n = Number(utils.InputBox(window.ID, 'Number of duplicates allowed (n + 1)', scriptName + ': ' + name, nAllowed, true));}
							catch (e) {return;}
							if (!Number.isSafeInteger(n)) {return;}
							removeDuplicates({checkKeys: tags, nAllowed: n});
						}, flags: playlistCountFlagsAddRem});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Set tags (for duplicates)...', func: () => {
							const input = utils.InputBox(window.ID, 'Enter list of tags separated by comma', scriptName + ': ' + name, sortInputDuplic.join(','));
							if (sortInputDuplic.join(',') === input) {return;}
							if (!input.length) {return;}
							sortInputDuplic = input.split(',').filter((n) => n);
							menu_properties['sortInputDuplic'][1] = sortInputDuplic.join(',');
							overwriteMenuProperties(); // Updates panel
							updateShortcutsNames({sortInputDuplic: menu_properties['sortInputDuplic'][1]});
						}});
						menu.newEntry({menuName: subMenuName, entryText: 'Set tags (for filtering)...', func: () => {
							const input = utils.InputBox(window.ID, 'Enter list of tags separated by comma', scriptName + ': ' + name, sortInputFilter.join(','));
							if (sortInputFilter.join(',') === input) {return;}
							if (!input.length) {return;}
							sortInputFilter = input.split(',').filter((n) => n);
							menu_properties['sortInputFilter'][1] = sortInputFilter.join(',');
							overwriteMenuProperties(); // Updates panel
							updateShortcutsNames({sortInputFilter: menu_properties['sortInputFilter'][1], nAllowed});
						}});
						menu.newEntry({menuName: subMenuName, entryText: 'Set number allowed (for filtering)...', func: () => {
							const input = Number(utils.InputBox(window.ID, 'Number of duplicates allowed (n + 1)', scriptName + ': ' + name, nAllowed));
							if (nAllowed === input) {return;}
							if (!Number.isSafeInteger(input)) {return;}
							nAllowed = input;
							menu_properties['nAllowed'][1] = nAllowed;
							overwriteMenuProperties(); // Updates panel
							updateShortcutsNames({sortInputFilter: menu_properties['sortInputFilter'][1], nAllowed});
						}});
					}});
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Filter by Query
			const scriptPath = folders.xxx + 'main\\filter_by_query.js';
			if (_isFile(scriptPath)){
				const name = 'Query filtering';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath);
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\filter_by_query.txt';
					forcedQueryMenusEnabled[name] = false;
					const subMenuName = menu.newMenu(name, menuName);
					let queryFilter = [
							{name: 'Rating > 2', query: 'NOT (%RATING% EQUAL 2 OR %RATING% EQUAL 1)'}, 
							{name: 'Not live (none)', query: 'NOT STYLE IS Live'},  
							{name: 'Not live (except Hi-Fi)', query: 'NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi)'},  
							{name: 'Not multichannel', query: '%CHANNELS% LESS 3 AND NOT COMMENT HAS Quad'}, 
							{name: 'Not SACD or DVD', query: 'NOT %_PATH% HAS .iso AND NOT CODEC IS MLP AND NOT CODEC IS DSD64 AND NOT CODEC IS DST64'}, 
							{name: 'Global forced query', query: defaultArgs['forcedQuery']},
							{name: 'sep'},
							{name: 'Same title than sel', query: '"$stricmp($ascii(%TITLE%),$ascii(#TITLE#))" IS 1'},
							{name: 'Same song than sel', query: 'ARTIST IS #ARTIST# AND "$stricmp($ascii(%TITLE%),$ascii(#TITLE#))" IS 1 AND DATE IS #DATE#'},
							{name: 'Same genre than sel', query: 'GENRE IS #GENRE#'},
							{name: 'Same key than sel', query: 'KEY IS #KEY#'},
							{name: 'sep'},
							{name: 'Different genre than sel', query: 'NOT GENRE IS #GENRE#'},
							{name: 'Different style than sel', query: 'NOT STYLE IS #STYLE#'}
					];
					let selArg = {name: 'Custom', query: queryFilter[0].query};
					const queryFilterDefaults = [...queryFilter];
					// Create new properties with previous args
					menu_properties['queryFilter'] = [menuName + '\\' + name + ' queries', JSON.stringify(queryFilter)];
					menu_properties['queryFilterCustomArg'] = [menuName + '\\' + name + ' Dynamic menu custom args', selArg.query];
					// Check
					menu_properties['queryFilter'].push({func: isJSON}, menu_properties['queryFilter'][1]);
					menu_properties['queryFilter'].push({func: (query) => {return checkQuery(query, true);}}, menu_properties['queryFilter'][1]);
					// Menus
					menu.newEntry({menuName: subMenuName, entryText: 'Filter active playlist: (Ctrl + click to invert)', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newCondEntry({entryText: 'Filter playlists using queries... (cond)', condFunc: () => {
						const options = JSON.parse(menu_properties.dynQueryEvalSel[1]);
						const bEvalSel = options['Dynamic queries'];
						queryFilter = JSON.parse(menu_properties['queryFilter'][1]);
						queryFilter.forEach( (queryObj) => {
							if (queryObj.name === 'sep') { // Create separators
								menu.newEntry({menuName: subMenuName, entryText: 'sep'});
							} else { 
								// Create names for all entries
								const queryName = queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name;
								menu.newEntry({menuName: subMenuName, entryText: 'Filter playlist by ' + queryName, func: () => {
									let query = queryObj.query;
									// Invert query when pressing Control
									if (utils.IsKeyPressed(VK_CONTROL) && query.length) {
										query = 'NOT ' + _p(query);
									}
									// Forced query
									if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) { // With forced query enabled
										if (query.length && query.toUpperCase() !== 'ALL') { // ALL query never uses forced query!
											query = _p(query) + ' AND ' + _p(defaultArgs.forcedQuery);
										} else if (!query.length) {query = defaultArgs.forcedQuery;} // Empty uses forced query or ALL
									} else if (!query.length) {query = 'ALL';} // Otherwise empty is replaced with ALL
									// Test
									let focusHandle = fb.GetFocusItem(true);
									if (focusHandle && query.indexOf('#') !== -1) {
										if (bEvalSel) {
											query = query_join(plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Convert().map((handle) => {return queryReplaceWithCurrent(query, handle);}), 'OR')
										} else {
											query = queryReplaceWithCurrent(query, focusHandle);
										}
									}
									try {fb.GetQueryItems(new FbMetadbHandleList(), query);}
									catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, scriptName); return;}
									// Execute
									do_filter_by_query(null, query);
								}, flags: playlistCountFlagsAddRem});
							}
						});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Filter playlist by... (query)' , func: () => {
							selArg.query = menu_properties['queryFilterCustomArg'][1];
							let input;
							try {input = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.', scriptName + ': ' + name, selArg.query, true);}
							catch (e) {return;}
							// Forced query
							let query = input;
							if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) { // With forced query enabled
								if (query.length && query.toUpperCase() !== 'ALL') { // ALL query never uses forced query!
									query = '(' + query + ') AND (' + defaultArgs.forcedQuery + ')';
								} else if (!query.length) {query = defaultArgs.forcedQuery;} // Empty uses forced query or ALL
							} else if (!query.length) {query = 'ALL';} // Otherwise empty is replaced with ALL
							// Test
							let focusHandle = fb.GetFocusItem(true);
							if (focusHandle && query.indexOf('#') !== -1) {
								if (bEvalSel) {
									query = query_join(plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Convert().map((handle) => {return queryReplaceWithCurrent(query, handle);}), 'OR')
								} else {
									query = queryReplaceWithCurrent(query, focusHandle);
								}
							}
							try {fb.GetQueryItems(new FbMetadbHandleList(), query);}
							catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, scriptName); return;}
							// Execute
							do_filter_by_query(null, query);
							// For internal use original object
							selArg.query = input; 
							menu_properties['queryFilterCustomArg'][1] = input; // And update property with new value
							overwriteMenuProperties(); // Updates panel
						}, flags: playlistCountFlagsAddRem});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Add new query to list...' , func: () => {
							let input;
							let entryName;
							try {entryName = utils.InputBox(window.ID, 'Enter name for menu entr.\nWrite \'sep\' to add a line.', scriptName + ': ' + name, '', true);}
							catch (e) {return;}
							if (!entryName.length) {return;}
							if (entryName === 'sep') {input = {name: entryName};} // Add separator
							else {
								let query;
								try {query = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with focused item\'s value.', scriptName + ': ' + name, '', true);}
								catch (e) {return;}
								if (query.indexOf('#') === -1) { // Try the query only if it is not a dynamic one
									try {fb.GetQueryItems(new FbMetadbHandleList(), query);}
									catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query, scriptName); return;}
								}
								input = {name: entryName, query};
							}
							queryFilter.push(input);
							menu_properties['queryFilter'][1] = JSON.stringify(queryFilter);
							// Presets
							if (!presets.hasOwnProperty('queryFilter')) {presets.queryFilter = [];}
							presets.queryFilter.push(input);
							menu_properties['presets'][1] = JSON.stringify(presets);
							overwriteMenuProperties(); // Updates panel
						}});
						{
							const subMenuSecondName = menu.newMenu('Remove query from list...', subMenuName);
							queryFilter.forEach( (queryObj, index) => {
								const entryText = (queryObj.name === 'sep' ? '------(separator)------' : (queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name));
								menu.newEntry({menuName: subMenuSecondName, entryText, func: () => {
									queryFilter.splice(index, 1);
									menu_properties['queryFilter'][1] = JSON.stringify(queryFilter);
									// Presets
									if (presets.hasOwnProperty('queryFilter')) {
										presets.queryFilter.splice(presets.queryFilter.findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(queryObj);}), 1);
										if (!presets.queryFilter.length) {delete presets.queryFilter;}
										menu_properties['presets'][1] = JSON.stringify(presets);
									}
									overwriteMenuProperties(); // Updates panel
								}});
							});
							if (!queryFilter.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
							menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
							menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
								queryFilter = [...queryFilterDefaults];
								menu_properties['queryFilter'][1] = JSON.stringify(queryFilter);
								// Presets
								if (presets.hasOwnProperty('queryFilter')) {
									delete presets.queryFilter;
									menu_properties['presets'][1] = JSON.stringify(presets);
								}
								overwriteMenuProperties(); // Updates panel
							}});
						}
					}});
					menu.newEntry({menuName, entryText: 'sep'});
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Create harmonic mix from playlist
			const scriptPath = folders.xxx + 'main\\harmonic_mixing.js';
			if (_isFile(scriptPath)){
				const name = 'Harmonic mix';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath);
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\harmonic_mixing.txt';
					const subMenuName = menu.newMenu(name, menuName);
					const selArgs = [
						{name: 'Harmonic mix from playlist'	, args: {selItems: () => {return plman.GetPlaylistItems(plman.ActivePlaylist);}}, flags: playlistCountFlags},
						{name: 'Harmonic mix from selection'	, args: {selItems: () => {return plman.GetPlaylistSelectedItems(plman.ActivePlaylist);}}, flags: multipleSelectedFlags},
					];
					if (!menu_properties.hasOwnProperty('bHarmonicMixDoublePass')) {menu_properties['bHarmonicMixDoublePass'] = ['Harmonic mixing double pass to match more tracks', true];}
					// Menus
					menu.newEntry({menuName: subMenuName, entryText: 'Using rule of Fifths (new playlist):', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					selArgs.forEach( (selArg) => {
						if (selArg.name === 'sep') {
							menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						} else {
							let entryText = selArg.name;
							menu.newEntry({menuName: subMenuName, entryText, func: (args = {...defaultArgs, ...selArg.args}) => {
								args.selItems = args.selItems();
								args.playlistLength = args.selItems.Count; // Max allowed
								args.bDoublePass = menu_properties.bHarmonicMixDoublePass[1]; // Max allowed
								if (defaultArgs.bProfile) {var profiler = new FbProfiler('do_harmonic_mixing');}
								do_harmonic_mixing(args);
								if (defaultArgs.bProfile) {profiler.Print();}
							}, flags: selArg.flags ? selArg.flags : undefined});
						}
					});
					menu.newEntry({menuName, entryText: 'sep'});
					if (!menusEnabled.hasOwnProperty(configMenu) || menusEnabled[configMenu] === true) {
						const subMenuName = 'Harmonic mixing';
						if (!menu.hasMenu(subMenuName, configMenu)) {
							menu.newMenu(subMenuName, configMenu);
							{	// bHarmonicMixDoublePass
								menu.newEntry({menuName: subMenuName, entryText: 'For any tool which uses harmonic mixing:', func: null, flags: MF_GRAYED});
								menu.newEntry({menuName: subMenuName, entryText: 'sep'});
								menu.newEntry({menuName: subMenuName, entryText: 'Enable double pass to match more tracks', func: () => {
									menu_properties['bHarmonicMixDoublePass'][1] = !menu_properties['bHarmonicMixDoublePass'][1];
									overwriteMenuProperties(); // Updates panel
								}});
								menu.newCheckMenu(subMenuName, 'Enable double pass to match more tracks', void(0), () => {return menu_properties['bHarmonicMixDoublePass'][1];});
							}
							menu.newEntry({menuName: configMenu, entryText: 'sep'});
						}
					} else {menuDisabled.push({menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Find / New Playlist
			const name = 'Find or create playlist...';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				menu.newEntry({menuName, entryText: name, func: () => {
					let input;
					try {input = utils.InputBox(window.ID, 'Enter name:', scriptName + ': ' + name, 'New playlist', true);}
					catch (e) {return;}
					if (!input.length) {return;}
					plman.ActivePlaylist = plman.FindOrCreatePlaylist(input, false);
				}});
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
		{	// Crop playlist length (for use with macros!!)
			const name = 'Cut playlist length to...';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				const subMenuName = menu.newMenu(name, menuName);
				const selArgs = [
					{name: '25 tracks', func: (idx) => {removeNotSelectedTracks(idx, 25);}},
					{name: '50 tracks', func: (idx) => {removeNotSelectedTracks(idx, 50);}},
					{name: '75 tracks', func: (idx) => {removeNotSelectedTracks(idx, 75);}},
					{name: '100 tracks', func: (idx) => {removeNotSelectedTracks(idx, 100);}},
					{name: 'sep'},
					{name: '25 tracks from end', func: (idx) => {removeNotSelectedTracks(idx, -25);}},
					{name: '50 tracks from end', func: (idx) => {removeNotSelectedTracks(idx, -50);}},
					{name: '75 tracks from end', func: (idx) => {removeNotSelectedTracks(idx, -75);}},
					{name: '100 tracks from end', func: (idx) => {removeNotSelectedTracks(idx, -100);}},
					{name: 'sep'},
					{name: () => {return 'Global pls. length: ' + menu_properties.playlistLength[1]}, func: (idx) => {removeNotSelectedTracks(idx, menu_properties.playlistLength[1]);}},
					{name: () => {return 'Global pls. length (end): ' + menu_properties.playlistLength[1]}, func: (idx) => {removeNotSelectedTracks(idx, menu_properties.playlistLength[1]);}},
				];
				menu.newEntry({menuName: subMenuName, entryText: 'Set playlist length to desired #:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				// Menus
				selArgs.forEach( (selArg) => {
					if (selArg.name === 'sep') {
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					} else {
						let entryText = selArg.name;
						menu.newEntry({menuName: subMenuName, entryText, func: () => {
							const ap = plman.ActivePlaylist;
							if (ap === -1) {return;}
							plman.UndoBackup(ap);
							selArg.func(ap)
						}, flags: playlistCountFlagsRem});
					}
				});
				menu.newEntry({menuName, entryText: 'sep'});
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
		{	// Merge / Intersect / Difference
			const nameMerge = 'Merge with playlist...';
			const nameInter = 'Intersect with playlist...';
			const nameDiff = 'Difference with playlist...';
			if (!menusEnabled.hasOwnProperty(nameMerge) || !menusEnabled.hasOwnProperty(nameInter) || !menusEnabled.hasOwnProperty(nameDiff) || menusEnabled[nameMerge] === true || menusEnabled[nameInter] === true || menusEnabled[nameDiff] === true) {
				if (!menu_properties.hasOwnProperty('playlistSplitSize')) {
					menu_properties['playlistSplitSize'] = ['Playlist lists submenu size', 20];
					// Checks
					menu_properties['playlistSplitSize'].push({greater: 1, func: isInt}, menu_properties['playlistSplitSize'][1]);
				}
				// Bools
				const bMerge = !menusEnabled.hasOwnProperty(nameMerge) || menusEnabled[nameMerge] === true;
				const bInter = !menusEnabled.hasOwnProperty(nameInter) || menusEnabled[nameInter] === true;
				const bDiff = !menusEnabled.hasOwnProperty(nameDiff) || menusEnabled[nameDiff] === true;
				// Menus
				const subMenuNameMerge = bMerge ? menu.newMenu(nameMerge, menuName) : null;
				if (!bMerge) {menuDisabled.push({menuName: nameMerge, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				const subMenuNameInter = bInter ? menu.newMenu(nameInter, menuName) : null;
				if (!bInter) {menuDisabled.push({menuName: nameInter, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				const subMenuNameDiff = bDiff ? menu.newMenu(nameDiff, menuName) : null;
				if (!bDiff) {menuDisabled.push({menuName: nameDiff, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				if (bMerge) {
					menu.newEntry({menuName: subMenuNameMerge, entryText: 'Merge current playlist\'s tracks with:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameMerge, entryText: 'sep'});
				}
				if (bInter) {
					menu.newEntry({menuName: subMenuNameInter, entryText: 'Output current playlist\'s tracks present on:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameInter, entryText: 'sep'});
				}
				if (bDiff) {
					menu.newEntry({menuName: subMenuNameDiff, entryText: 'Remove current playlist\'s tracks present on:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameDiff, entryText: 'sep'});
				}
				menu.newEntry({menuName, entryText: 'sep'});
				// Build submenus
				menu.newCondEntry({entryText: 'Merge/Intersect/Difference to Playlists...', condFunc: () => {
					if (defaultArgs.bProfile) {var profiler = new FbProfiler('Merge/Intersect/Difference to Playlists...');}
					const ap = plman.ActivePlaylist;
					const bPlaylist = ap !== -1;
					const playlistsNum = plman.PlaylistCount;
					const bTracks = bPlaylist ? plman.PlaylistItemCount(ap) !== 0 : false;
					const bAddLock =  bPlaylist ? addLock() : false;
					const bAddRemLock = bAddLock || (bPlaylist ? removeLock() : false);
					if (playlistsNum && bTracks && ((bMerge && !bAddLock) || ((bInter || bDiff) && !bAddRemLock))) {
						// Split entries in sub-menus if there are too many playlists...
						let ss = menu_properties['playlistSplitSize'][1];
						const splitBy =  playlistsNum < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
						if (playlistsNum > splitBy) {
							const subMenusCount =  Math.ceil(playlistsNum / splitBy);
							let skipped = 0; // Only used on bMerge, to account for locked playlists
							for (let i = 0; i < subMenusCount; i++) {
								const bottomIdx =  i * splitBy;
								const topIdx = (i + 1) * splitBy - 1;
								// Prefix ID is required to avoid collisions with same sub menu names
								// Otherwise both menus would be called 'Playlist X-Y', leading to bugs (entries duplicated on both places)
								// Send
								const idxMerge = bMerge ? '(Merge with) Playlists ' + bottomIdx + ' - ' + topIdx : null;
								const subMenu_i_merge = bMerge ? menu.newMenu(idxMerge, subMenuNameMerge) : null;
								// Go to
								const idxInter = bInter ? '(Intersect with) Playlists ' + bottomIdx + ' - ' + topIdx : null;
								const subMenu_i_inter = bInter ? menu.newMenu(idxInter, subMenuNameInter) : null;
								// Close
								const idxDiff = bDiff ? '(Difference with) Playlists ' + bottomIdx + ' - ' + topIdx : null;
								const subMenu_i_diff = bDiff ? menu.newMenu(idxDiff, subMenuNameDiff) : null;
								for (let j = bottomIdx; j <= topIdx + skipped && j < playlistsNum; j++) {
									const playlist = {name: plman.GetPlaylistName(j), index : j};
									if (bMerge && !bAddLock) {
										menu.newEntry({menuName: subMenu_i_merge, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
											plman.UndoBackup(ap);
											const handleListA = plman.GetPlaylistItems(ap);
											const handleListB = plman.GetPlaylistItems(playlist.index).Convert();
											handleListA.Sort();
											const toAdd = new FbMetadbHandleList();
											handleListB.forEach((handle) => {if (handleListA.BSearch(handle) === -1) {toAdd.Add(handle);}});
											if (toAdd.Count) {
												plman.InsertPlaylistItems(ap, plman.PlaylistItemCount(ap), toAdd);
												console.log('Added ' + toAdd.Count + ' items.');
											} else {console.log('No items were added.');}
										}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
									}
									if (bInter && !bAddRemLock) {
										menu.newEntry({menuName: subMenu_i_inter, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
											plman.UndoBackup(ap);
											const handleListA = plman.GetPlaylistItems(ap);
											const handleListAOri = handleListA.Clone().Convert();
											const handleListB = plman.GetPlaylistItems(playlist.index);
											handleListA.Sort();
											handleListB.Sort();
											const intersect = handleListA.Clone();
											intersect.MakeIntersection(handleListB);
											const toAdd = new FbMetadbHandleList();
											handleListAOri.forEach((handle, i) => {if (intersect.BSearch(handle) !== -1) {toAdd.Add(handle);}});
											plman.ClearPlaylist(ap);
											const toAddCount = toAdd.Count;
											const remCount = handleListAOri.Count - toAddCount;
											if (toAddCount) {plman.InsertPlaylistItems(ap, 0, toAdd);}
											if (remCount) {console.log('Removed ' + remCount + ' items.');} else {console.log('No items were removed.');}
										}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
									}
									if (bDiff && !bAddRemLock) {
										menu.newEntry({menuName: subMenu_i_diff, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
											plman.UndoBackup(ap);
											const handleListA = plman.GetPlaylistItems(ap)
											const handleListAOri = handleListA.Clone().Convert();
											const handleListB = plman.GetPlaylistItems(playlist.index);
											handleListA.Sort();
											handleListB.Sort();
											const difference = handleListA.Clone();
											difference.MakeDifference(handleListB);
											const toAdd = new FbMetadbHandleList();
											handleListAOri.forEach((handle, i) => {if (difference.BSearch(handle) !== -1) {toAdd.Add(handle);}});
											plman.ClearPlaylist(ap);
											const toAddCount = toAdd.Count;
											const remCount = handleListAOri.Count - toAddCount;
											if (toAddCount) {plman.InsertPlaylistItems(ap, 0, toAdd);}
											if (remCount) {console.log('Removed ' + remCount + ' items.');} else {console.log('No items were removed.');}
										}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
									}
								}
							}
						} else { // Or just show all
							for (let i = 0; i < playlistsNum; i++) {
								const playlist = {name: plman.GetPlaylistName(i), index : i};
								if (bMerge && !bAddLock) {
									menu.newEntry({menuName: subMenuNameMerge,  entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
										plman.UndoBackup(ap);
										const handleListA = plman.GetPlaylistItems(ap);
										const handleListB = plman.GetPlaylistItems(playlist.index).Convert();
										handleListA.Sort();
										const toAdd = new FbMetadbHandleList();
										handleListB.forEach((handle) => {if (handleListA.BSearch(handle) === -1) {toAdd.Add(handle);}});
										if (toAdd.Count) {
											plman.InsertPlaylistItems(ap, plman.PlaylistItemCount(ap), toAdd);
											console.log('Added ' + toAdd.Count + ' items.');
										} else {console.log('No items were added.');}
									}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
								}
								if (bInter && !bAddRemLock) {
									menu.newEntry({menuName: subMenuNameInter, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
										plman.UndoBackup(ap);
										const handleListA = plman.GetPlaylistItems(ap);
										const handleListAOri = handleListA.Clone().Convert();
										const handleListB = plman.GetPlaylistItems(playlist.index);
										handleListA.Sort();
										handleListB.Sort();
										const intersect = handleListA.Clone();
										intersect.MakeIntersection(handleListB);
										const toAdd = new FbMetadbHandleList();
										handleListAOri.forEach((handle, i) => {if (intersect.BSearch(handle) !== -1) {toAdd.Add(handle);}});
										plman.ClearPlaylist(ap);
										const toAddCount = toAdd.Count;
										const remCount = handleListAOri.Count - toAddCount;
										if (toAddCount) {plman.InsertPlaylistItems(ap, 0, toAdd);}
										if (remCount) {console.log('Removed ' + remCount + ' items.');} else {console.log('No items were removed.');}
									}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
								}
								if (bDiff && !bAddRemLock) {
									menu.newEntry({menuName: subMenuNameDiff, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
										plman.UndoBackup(ap);
										const handleListA = plman.GetPlaylistItems(ap)
										const handleListAOri = handleListA.Clone().Convert();
										const handleListB = plman.GetPlaylistItems(playlist.index);
										handleListA.Sort();
										handleListB.Sort();
										const difference = handleListA.Clone();
										difference.MakeDifference(handleListB);
										const toAdd = new FbMetadbHandleList();
										handleListAOri.forEach((handle, i) => {if (difference.BSearch(handle) !== -1) {toAdd.Add(handle);}});
										plman.ClearPlaylist(ap);
										const toAddCount = toAdd.Count;
										const remCount = handleListAOri.Count - toAddCount;
										if (toAddCount) {plman.InsertPlaylistItems(ap, 0, toAdd);}
										if (remCount) {console.log('Removed ' + remCount + ' items.');} else {console.log('No items were removed.');}
									}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
								}
							}
						}
					} else {
						if (bMerge) {menu.newEntry({menuName: subMenuNameMerge, entryText: !bAddLock ? 'No items.' : 'Playlist is locked for adding items.', func: null, flags: MF_GRAYED});}
						if (bInter) {menu.newEntry({menuName: subMenuNameInter, entryText: !bAddRemLock ? 'No items.' : 'Playlist is locked for adding\\removing items.', func: null, flags: MF_GRAYED});}
						if (bDiff) {menu.newEntry({menuName: subMenuNameDiff, entryText: !bAddRemLock ? 'No items.' : 'Playlist is locked for adding\\removing items.', func: null, flags: MF_GRAYED});}
					}
					if (defaultArgs.bProfile) {profiler.Print();}
				}});
			} else {
				menuDisabled.push({menuName: nameMerge, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
				menuDisabled.push({menuName: nameInter, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
				menuDisabled.push({menuName: nameDiff, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
			}
		}
		{	// Send Playlist to Playlist / Close playlist / Go to Playlist
			const nameSend = 'Send playlist\'s tracks to...';
			const nameGo = 'Go to playlist...';
			const nameClose = 'Close playlist...';
			if (!menusEnabled.hasOwnProperty(nameSend) || !menusEnabled.hasOwnProperty(nameGo) || !menusEnabled.hasOwnProperty(nameClose) || menusEnabled[nameSend] === true || menusEnabled[nameGo] === true || menusEnabled[nameClose] === true) {
				if (!menu_properties.hasOwnProperty('playlistSplitSize')) {
					menu_properties['playlistSplitSize'] = ['Playlist lists submenu size', 20];
					// Checks
					menu_properties['playlistSplitSize'].push({greater: 1, func: isInt}, menu_properties['playlistSplitSize'][1]);
				}
				// Bools
				const bSend = !menusEnabled.hasOwnProperty(nameSend) || menusEnabled[nameSend] === true;
				const bGo = !menusEnabled.hasOwnProperty(nameGo) || menusEnabled[nameGo] === true;
				const bClose = !menusEnabled.hasOwnProperty(nameClose) || menusEnabled[nameClose] === true; 
				// Menus
				const subMenuNameSend = bSend ? menu.newMenu(nameSend, menuName) : null;
				if (!bSend) {menuDisabled.push({menuName: nameSend, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				const subMenuNameGo = bGo ? menu.newMenu(nameGo, menuName) : null;
				if (!bGo) {menuDisabled.push({menuName: nameGo, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				const subMenuNameClose = bClose ? menu.newMenu(nameClose, menuName) : null;
				if (!bClose) {menuDisabled.push({menuName: nameClose, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				if (bSend) {
					menu.newEntry({menuName: subMenuNameSend, entryText: 'Sends all tracks from current playlist to:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameSend, entryText: 'sep'});
				}
				if (bGo) {
					menu.newEntry({menuName: subMenuNameGo, entryText: 'Switch to another playlist:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameGo, entryText: 'sep'});
				}
				if (bClose) {
					menu.newEntry({menuName: subMenuNameClose, entryText: 'Close another playlist:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameClose, entryText: 'sep'});
				}
				// Build submenus
				menu.newCondEntry({entryText: 'Send/Go/Close to Playlists...', condFunc: () => {
					if (defaultArgs.bProfile) {var profiler = new FbProfiler('Send/Go/Close to Playlists...');}
					const playlistsNum = plman.PlaylistCount;
					const ap = plman.ActivePlaylist;
					if (playlistsNum && ap !== -1) {
						const playlistsNumNotLocked = playlistCountNoLocked();
						const bTracks = plman.PlaylistItemCount(ap) !== 0;
						// Split entries in sub-menus if there are too many playlists...
						let ss = menu_properties['playlistSplitSize'][1];
						const splitBy =  bSend ? playlistsNumNotLocked < ss * 5 ? ss : ss * 2 : playlistsNum < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
						if (playlistsNum > splitBy) {
							const subMenusCount = bSend ? Math.ceil(playlistsNumNotLocked / splitBy) : Math.ceil(playlistsNum / splitBy);
							let skipped = 0; // Only used on bSend, to account for locked playlists
							for (let i = 0; i < subMenusCount; i++) {
								const bottomIdx =  i * splitBy;
								const topIdx = (i + 1) * splitBy - 1;
								// Prefix ID is required to avoid collisions with same sub menu names
								// Otherwise both menus would be called 'Playlist X-Y', leading to bugs (entries duplicated on both places)
								// Send
								const idxSend = bSend ? '(Send all to) Playlists ' + bottomIdx + ' - ' + topIdx : null;
								const subMenu_i_send = bSend ? menu.newMenu(idxSend, subMenuNameSend) : null;
								// Go to
								const idxGo = bGo ? '(Go to) Playlists ' + bottomIdx + ' - ' + topIdx : null;
								const subMenu_i_go = bGo ? menu.newMenu(idxGo, subMenuNameGo) : null;
								// Close
								const idxClose = bClose ? '(Close) Playlists ' + bottomIdx + ' - ' + topIdx : null;
								const subMenu_i_close = bClose ? menu.newMenu(idxClose, subMenuNameClose) : null;
								for (let j = bottomIdx; j <= topIdx + skipped && j < playlistsNum; j++) {
									const playlist = {name: plman.GetPlaylistName(j), index : j};
									if (bSend && bTracks) {
										if (!addLock(j)) {
											menu.newEntry({menuName: subMenu_i_send, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
												plman.UndoBackup(playlist.index);
												plman.InsertPlaylistItems(playlist.index, plman.PlaylistItemCount(playlist.index), plman.GetPlaylistItems(ap));
											}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
										} else {skipped++}
									}
									if (bGo) {
										menu.newEntry({menuName: subMenu_i_go, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
											ap = playlist.index;
										}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
									}
									if (bClose) {
										menu.newEntry({menuName: subMenu_i_close, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
											plman.RemovePlaylist(playlist.index);
										}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
									}
								}
							}
						} else { // Or just show all
							for (let i = 0; i < playlistsNum; i++) {
								const playlist = {name: plman.GetPlaylistName(i), index : i};
								if (bSend && bTracks) {
									if (!addLock(i)) {
										menu.newEntry({menuName: subMenuNameSend,  entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
											plman.InsertPlaylistItems(playlist.index, plman.PlaylistItemCount(playlist.index), plman.GetPlaylistItems(ap));
										}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
									}
								}
								if (bGo) {
									menu.newEntry({menuName: subMenuNameGo, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
										ap = playlist.index;
									}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
								}
								if (bClose) {
									menu.newEntry({menuName: subMenuNameClose, entryText: playlist.name + (ap === playlist.index ? ' (current playlist)' : '') +  (plman.PlayingPlaylist === playlist.index ? ' (playing playlist)' : ''), func: () => {
										plman.RemovePlaylist(playlist.index);
									}, flags: (ap === playlist.index ? MF_GRAYED : MF_STRING)});
								}
							}
						}
						if (!bTracks && bSend) {menu.newEntry({menuName: subMenuNameSend, entryText: 'No tracks.', func: null, flags: MF_GRAYED});}
					} else {
						if (bSend) {menu.newEntry({menuName: subMenuNameSend, entryText: 'No items.', func: null, flags: MF_GRAYED});}
						if (bGo) {menu.newEntry({menuName: subMenuNameGo, entryText: 'No items.', func: null, flags: MF_GRAYED});}
						if (bClose) {menu.newEntry({menuName: subMenuNameClose, entryText: 'No items.', func: null, flags: MF_GRAYED});}
					}
					if (defaultArgs.bProfile) {profiler.Print();}
				}});
				menu.newEntry({menuName, entryText: 'sep'});
			} else {
				menuDisabled.push({menuName: nameSend, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
				menuDisabled.push({menuName: nameGo, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
				menuDisabled.push({menuName: nameClose, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
			}
		}
		{	// Lock / Unlock playlist
			const nameLock = 'Lock playlist...';
			const nameUnlock = 'Unlock playlist...';
			if (!menusEnabled.hasOwnProperty(nameLock) || !menusEnabled.hasOwnProperty(nameUnlock) || menusEnabled[nameLock] === true || menusEnabled[nameUnlock] === true) {
				if (!menu_properties.hasOwnProperty('playlistSplitSize')) {
					menu_properties['playlistSplitSize'] = ['Playlist lists submenu size', 20];
					// Checks
					menu_properties['playlistSplitSize'].push({greater: 1, func: isInt}, menu_properties['playlistSplitSize'][1]);
				}
				// Bools
				const bLock = !menusEnabled.hasOwnProperty(nameLock) || menusEnabled[nameLock] === true;
				const bUnlock = !menusEnabled.hasOwnProperty(nameUnlock) || menusEnabled[nameUnlock] === true;
				// Menus
				const subMenuNameLock = bLock ? menu.newMenu(nameLock, menuName) : null;
				if (!bLock) {menuDisabled.push({menuName: nameLock, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				const subMenuNameUnlock = bUnlock ? menu.newMenu(nameUnlock, menuName) : null;
				if (!bUnlock) {menuDisabled.push({menuName: nameUnlock, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
				if (bLock) {
					menu.newEntry({menuName: subMenuNameLock, entryText: 'Lock playlist: add, remove, replace and reorder', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameLock, entryText: 'sep'});
				}
				if (bUnlock) {
					menu.newEntry({menuName: subMenuNameUnlock, entryText: 'Unlock playlist (by SMP):', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuNameUnlock, entryText: 'sep'});
				}
				// Build submenus
				menu.newCondEntry({entryText: 'Lock/Unlock Playlists...', condFunc: () => {
					if (defaultArgs.bProfile) {var profiler = new FbProfiler('Lock/Unlock Playlists...');}
					const lockTypes = ['AddItems', 'RemoveItems', 'ReplaceItems', 'ReorderItems'];
					const playlistsNum = plman.PlaylistCount;
					if (playlistsNum) {
						const lockedPlaylists = playlistCountNoLocked(lockTypes);
						const nonLockedPlaylists = playlistsNum - lockedPlaylists;
						// Split entries in sub-menus if there are too many playlists...
						let ss = menu_properties['playlistSplitSize'][1];
						const lockUnlockMenu = (index, menuName, obj) => {
							const playlist = {name: plman.GetPlaylistName(index), index};
							const playlistLockTypes = new Set(plman.GetPlaylistLockedActions(index));
							const lockName = plman.GetPlaylistLockName(index);
							const bSMPLock = lockName === 'foo_spider_monkey_panel' || !lockName;
							const bLocked = !bSMPLock || playlistLockTypes.isSuperset(new Set(lockTypes));
							const flags = bSMPLock ? MF_STRING: MF_GRAYED;
							const entryText = playlist.name + (!bSMPLock ? ' ' + _p(lockName) : '');
							if (obj.action === 'lock' && !bLocked){
								menu.newEntry({menuName, entryText, func: () => {
									plman.SetPlaylistLockedActions(index, lockTypes);
								}, flags});
								return true;
							} else if (obj.action === 'unlock' && bLocked){
								menu.newEntry({menuName, entryText, func: () => {
									const newLock = [...playlistLockTypes.difference(new Set(lockTypes))];
									plman.SetPlaylistLockedActions(index, newLock);
								}, flags});
								return true;
							}
							return false;
						};
						[
							{action: 'lock', playlistsNum: nonLockedPlaylists, subMenuName: subMenuNameLock},
							{action: 'unlock', playlistsNum: lockedPlaylists, subMenuName: subMenuNameUnlock}
						].forEach((obj) => {
							if (obj.playlistsNum === 0) {
								menu.newEntry({menuName: obj.subMenuName, entryText: 'No items.', func: null, flags: MF_GRAYED});
								return;
							}
							const splitBy = obj.playlistsNum < ss * 5 ? ss : ss * 2; // Double split size when total exceeds 5 times the value (good enough for really high # of playlists)
							if (obj.playlistsNum > splitBy) {
								const subMenusCount = Math.ceil(obj.playlistsNum / splitBy);
								for (let i = 0; i < subMenusCount; i++) {
									const bottomIdx =  i * splitBy;
									const topIdx = (i + 1) * splitBy - 1;
									// Prefix ID is required to avoid collisions with same sub menu names
									// Otherwise both menus would be called 'Playlist X-Y', leading to bugs (entries duplicated on both places)
									const idx = (obj.action === 'lock' ? '(Lock)' : '(Unlock)') + ' Playlists ' + bottomIdx + ' - ' + topIdx;
									const subMenu_i = menu.newMenu(idx, obj.subMenuName);
									let skipped = 0;
									for (let j = bottomIdx; j <= topIdx + skipped && j < playlistsNum; j++) {
										if (!lockUnlockMenu(j, subMenu_i, obj)) {skipped++}
									}
								}
							} else { // Or just show all
								for (let i = 0; i < playlistsNum; i++) {lockUnlockMenu(i, obj.subMenuName, obj);}
							}
						});
					} else {
						if (bLock) {menu.newEntry({menuName: subMenuNameLock, entryText: 'No items.', func: null, flags: MF_GRAYED});}
						if (bUnlock) {menu.newEntry({menuName: subMenuNameUnlock, entryText: 'No items.', func: null, flags: MF_GRAYED});}
					}
					if (defaultArgs.bProfile) {profiler.Print();}
				}});
			} else {
				menuDisabled.push({menuName: nameLock, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
				menuDisabled.push({menuName: nameUnlock, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});
			}
		}
	} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}

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
						{name: 'Sort by Mood', tfo: '%MOOD%'},
						{name: 'Sort by Date', tfo: '%DATE%'},
						{name: 'Sort by BPM', tfo: '%BPM%'}
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
							{name: 'Incremental key (Camelot Wheel)', 	func: do_sort_by_key, args: {sortOrder: 1}},
							{name: 'Decremental key (Camelot Wheel)',	func: do_sort_by_key, args: {sortOrder: -1}},
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
							{name: 'Incremental genre/styles (DynGenre)', func: do_sort_by_dyngenre, args: {sortOrder: 1}},
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
						{name: 'Scatter instrumental tracks'	, 	args: {tagName: 'genre,style', tagValue: 'Instrumental,Jazz,Instrumental Rock'}},
						{name: 'Scatter acoustic tracks'		, 	args: {tagName: 'genre,style,mood', tagValue: 'Acoustic'}},
						{name: 'Scatter electronic tracks'		,	args: {tagName: 'genre,style', tagValue: 'Electronic'}},
						{name: 'Scatter female vocal tracks'	,	args: {tagName: 'genre,style', tagValue: 'Female Vocal'}},
						{name: 'sep'},
						{name: 'Scatter sad mood tracks'		,	args: {tagName: 'mood', tagValue: 'Sad'}},
						{name: 'Scatter aggressive mood tracks', 	args: {tagName: 'mood', tagValue: 'Aggressive'}},
						{name: 'sep'},
						{name: 'Intercalate same artist tracks'		,	args: {tagName: 'artist', tagValue: null}},
						{name: 'Intercalate same genre tracks'		,	args: {tagName: 'genre', tagValue: null}},
						{name: 'Intercalate same style tracks'		,	args: {tagName: 'style', tagValue: null}}
					];
					// Menus
					menu.newEntry({menuName: subMenuName, entryText: 'Reorder selection according to tags:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					selArgs.forEach( (selArg) => {
						if (selArg.name === 'sep') {
							menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						} else {
							let entryText = selArg.name;
							menu.newEntry({menuName: subMenuName, entryText, func: (args = {...defaultArgs, ...selArg.args}) => {
							if (args.tagValue !== null) {do_scatter_by_tags(args);} else {do_intercalate_by_tags(args);}
							}, flags: multipleSelectedFlagsReorder});
						}
					});
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
					{name: 'By Artist', args: ['%ARTIST%']},
					{name: 'By Album', args: ['%ALBUM%']},
					{name: 'By Directory', args: ['%DIRECTORYNAME%']},
					{name: 'By Date', args: ['%DATE%']},
					{name: 'By Genre', args: ['%GENRE%']},
					{name: 'By Style', args: ['%STYLE%']},
					{name: 'By Key', args: ['%KEY%']},
					{name: 'By Mood', args: ['%MOOD%']},
					{name: 'sep'},
					{name: 'By... (tags)', args: () => {
						let input = '%ARTIST%;%ALBUM%';
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
					{name: 'By Artist', args: ['%ARTIST%']},
					{name: 'By Album', args: ['%ALBUM%']},
					{name: 'By Directory', args: ['%DIRECTORYNAME%']},
					{name: 'By Date', args: ['%DATE%']},
					{name: 'By Genre', args: ['%GENRE%']},
					{name: 'By Style', args: ['%STYLE%']},
					{name: 'By Key', args: [defaultArgs.keyTag]}, // Uses remapped tag. Probably missing %, fixed later.
					{name: 'By Mood', args: ['%MOOD%']},
					{name: 'sep'},
					{name: 'By... (tags)', args: () => {
						let input = '%ARTIST%;%ALBUM%';
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

// Other tools
{
	const name = 'Other tools';
	if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
		readmes[newReadmeSep()] = 'sep';
		let menuName = menu.newMenu(name);
		{	// Check tags
			const scriptPath = folders.xxx + 'main\\check_library_tags.js';
			if (_isFile(scriptPath)){
				const name = 'Check tags';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath);
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\check_library_tags.txt';
					const subMenuName = menu.newMenu(name, menuName);
					// Delete unused properties
					const toDelete = ['bUseDic'];
					let toMerge = {}; // Deep copy
					Object.keys(checkTags_properties).forEach( (key) => {
						if (toDelete.indexOf(key) === -1) {
							toMerge[key] = [...checkTags_properties[key]];
							toMerge[key][0] = '\'Other tools\\Check tags\' ' + toMerge[key][0];
						}
					});
					// And merge
					menu_properties = {...menu_properties, ...toMerge};
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
					menu.newEntry({menuName: subMenuName, entryText: 'Reports tagging errors (on selection):', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuName, entryText: 'Report errors by comparison', func: () => {
						const bAsync = JSON.parse(menu_properties.async[1])['Check tags'];
						const endPromise = checkTags({properties: menu_properties, bUseDic: false, bAsync});
						if (defaultArgs.parent && bAsync) {defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, endPromise);} // Apply animation on registered parent button...
					}, flags: multipleSelectedFlags});
					menu.newEntry({menuName: subMenuName, entryText: 'Report errors + dictionary', func: () => {
						const bAsync = JSON.parse(menu_properties.async[1])['Check tags'];
						const endPromise = checkTags({properties: menu_properties, bUseDic: true, bAsync});
						if (defaultArgs.parent && bAsync) {defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, endPromise);} // Apply animation on registered parent button...
					}, flags: multipleSelectedFlags});
					{	// Submenu
						const subMenuSecondName = menu.newMenu('Check only...', subMenuName);
						menu.newEntry({menuName: subMenuSecondName, entryText: 'Limits comparisons to:', func: null, flags: MF_GRAYED});
						menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
						tagsToCheck.forEach( (obj) => {
							if (obj === 'sep') {menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});return;}
							menu.newEntry({menuName: subMenuSecondName, entryText: obj.dscrpt, func: () => {
								const properties = clone(menu_properties);
								properties['tagNamesToCheck'][1] = obj.tag;
								const bAsync = JSON.parse(menu_properties.async[1])['Check tags'];
								const endPromise = checkTags({properties, bUseDic: obj.bUseDic, bAsync});
								if (defaultArgs.parent && bAsync) {defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, endPromise);} // Apply animation on registered parent button...
							}, flags: multipleSelectedFlags});
						});
					}
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuName, entryText: 'Reports all tags. Slow! (on selection):', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuName, entryText: 'Report all tags by comparison', func: () => {
						const bAsync = JSON.parse(menu_properties.async[1])['Check tags'];
						const endPromise = checkTags({properties: menu_properties, freqThreshold: 1, maxSizePerTag: Infinity, bUseDic: false, bAsync});
						if (defaultArgs.parent && bAsync) {defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, endPromise);} // Apply animation on registered parent button...
					}, flags: multipleSelectedFlags});
					menu.newEntry({menuName: subMenuName, entryText: 'Report all tags + dictionary', func: () => {
						const bAsync = JSON.parse(menu_properties.async[1])['Check tags'];
						const endPromise = checkTags({properties: menu_properties, freqThreshold: 1, maxSizePerTag: Infinity, bUseDic: true, bAsync});
						if (defaultArgs.parent && bAsync) {defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, endPromise);} // Apply animation on registered parent button...
					}, flags: multipleSelectedFlags});
					{	// Submenu
						const subMenuSecondName = menu.newMenu('Report all from...', subMenuName);
						menu.newEntry({menuName: subMenuSecondName, entryText: 'Limits comparisons to:', func: null, flags: MF_GRAYED});
						menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
						tagsToCheck.forEach( (obj) => {
							if (obj === 'sep') {menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});return;}
							menu.newEntry({menuName: subMenuSecondName, entryText: obj.dscrpt, func: () => {
								const properties = clone(menu_properties);
								properties['tagNamesToCheck'][1] = obj.tag;
								const bAsync = JSON.parse(menu_properties.async[1])['Check tags'];
								const endPromise = checkTags({properties, freqThreshold: 1, maxSizePerTag: Infinity, bUseDic: obj.bUseDic, bAsync});
								if (defaultArgs.parent && bAsync) {defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, endPromise);} // Apply animation on registered parent button...
							}, flags: multipleSelectedFlags});
						});
					}
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuName, entryText: 'Configure tags to check...', func: () => {
						const input = utils.InputBox(window.ID, 'Tag name(s) to check\nList \'tagName,tagName,...\' separated by \',\' :', scriptName + ': ' + name, menu_properties['tagNamesToCheck'][1]);
						if (menu_properties['tagNamesToCheck'][1] === input) {return;}
						if (!input.length) {return;}
						menu_properties['tagNamesToCheck'][1] = [...new Set(input.split(',').filter(Boolean))].join(','); // filter holes and remove duplicates
						overwriteMenuProperties(); // Updates panel
					}});
					menu.newEntry({menuName: subMenuName, entryText: 'Configure excluded tag values...', func: () => {
						addTagsToExclusionPopup({properties: menu_properties});
					}});
					{
						const subMenuSecondName = menu.newMenu('Configure dictionary...', subMenuName);
						menu.newEntry({menuName: subMenuSecondName, entryText: 'Configure excluded tags for dictionary...', func: () => {
							const input = utils.InputBox(window.ID, 'Tag name(s) to not check against dictionary\nList \'tagName,tagName,...\' separated by \',\' :', scriptName + ': ' + name, menu_properties['tagNamesExcludedDic'][1]);
							if (menu_properties['tagNamesExcludedDic'][1] === input) {return;}
							if (!input.length) {return;}
							menu_properties['tagNamesExcludedDic'][1] = [...new Set(input.split(';').filter(Boolean))].join(';'); // filter holes and remove duplicates
							overwriteMenuProperties(); // Updates panel
						}});
						menu.newEntry({menuName: subMenuSecondName, entryText: 'Set dictionary...', func: () => {
							const input = utils.InputBox(window.ID, 'Dictionary name:\n(available: de_DE, en_GB, en_US, fr_FR)\n', scriptName + ': ' + name, menu_properties['dictName'][1]);
							if (menu_properties['dictName'][1] === input) {return;}
							if (!input.length) {return;}
							const dictPath = menu_properties['dictPath'][1] + '\\' + input;
							if (!_isFolder(dictPath)) {fb.ShowPopupMessage('Folder does not exist:\n' + dictPath, scriptName); return;}
							menu_properties['dictName'][1] = input;
							overwriteMenuProperties(); // Updates panel
						}});
						menu.newEntry({menuName: subMenuSecondName, entryText: 'Sets dictionaries folder...', func: () => {
							let input = utils.InputBox(window.ID, 'Path to all dictionaries subfolders:\n(set to empty to restore default path)', scriptName + ': ' + name, menu_properties['dictPath'][1]);
							if (menu_properties['dictPath'][1] === input) {return;}
							if (!input.length) {input = menu_properties['dictPath'][3];}
							if (!_isFolder(input)) {fb.ShowPopupMessage('Folder does not exist:\n' + input, scriptName); return;}
							menu_properties['dictPath'][1] = input;
							overwriteMenuProperties(); // Updates panel
						}});
					}
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Automate tags
			const scriptPath = folders.xxx + 'main\\tags_automation.js';
			if (_isFile(scriptPath)){
				const name = 'Write tags';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath);
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\tags_automation.txt';
					const tAut = new tagAutomation();
					menu_properties['toolsByKey'] = ['\'Other tools\\Write tags\' tools enabled', JSON.stringify(tAut.toolsByKey)];
					const subMenuName = menu.newMenu(name, menuName);
					const firedFlags = () => {return tAut.isRunning() ? MF_STRING : MF_GRAYED;}
					const allFlags = () => {return (!tAut.isRunning() ? selectedFlags() : MF_GRAYED);}
					menu.newEntry({menuName: subMenuName, entryText: 'Automatize tagging:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuName, entryText: () => {return 'Add tags on batch to selected tracks' + (tAut.isRunning() ? ' (running)' : '');}, func: () => {
						tAut.run();
						if (defaultArgs.parent) {defaultArgs.parent.switchAnimation(menuName + '\\' + name, true, () => {return !tAut.isRunning();});} // Apply animation on registered parent button...
					}, flags: allFlags});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuName, entryText: () => {return 'Manually force next step' + (tAut.isRunning() ? '' : ' (not running)');}, func: tAut.nextStepTag, flags: firedFlags});
					menu.newEntry({menuName: subMenuName, entryText: () => {return 'Stop execution' + (tAut.isRunning() ? '' : ' (not running)');}, func: tAut.stopStepTag, flags: firedFlags});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					const subMenuTools = menu.newMenu('Available tools...', subMenuName);
					menu.newEntry({menuName: subMenuTools, entryText: 'Toogle (click) / Single (Shift + click):', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuTools, entryText: 'sep'});
					tAut.tools.forEach((tool) => {
						const key = tool.key;
						const flags = tool.bAvailable ? MF_STRING : MF_GRAYED;
						menu.newEntry({menuName: subMenuTools, entryText: tool.title, func: () => {
							// Disable all other tools when pressing shift
							if (utils.IsKeyPressed(VK_SHIFT)) {
								tAut.tools.filter((_) => {return _.key !== key}).forEach((_) => {tAut.toolsByKey[_.key] = false;});
								tAut.toolsByKey[key] = true;
							} else {
								tAut.toolsByKey[key] = !tAut.toolsByKey[key];
								// Warn about incompatible tools
								if (tAut.toolsByKey[key]) {
									if (tAut.incompatibleTools.has(key)) {
										const toDisable = tAut.incompatibleTools.get(key);
										if (tAut.toolsByKey[toDisable]) {
											tAut.toolsByKey[toDisable] = false; 
											console.popup(tAut.titlesByKey[toDisable] + ' has been disabled.', 'Tags Automation');
										}
									}
								}
							}
							menu_properties['toolsByKey'][1] = JSON.stringify(tAut.toolsByKey);
							overwriteMenuProperties(); // Updates panel
							tAut.loadDependencies();
						}, flags});
						menu.newCheckMenu(subMenuTools, tool.title, void(0), () => {return tAut.toolsByKey[key];});
					});
					menu.newEntry({menuName: subMenuTools, entryText: 'sep'});
					['Enable all', 'Disable all'].forEach((entryText, i) => {
						menu.newEntry({menuName: subMenuTools, entryText: entryText, func: () => {
							tAut.tools.forEach((tool) => {tAut.toolsByKey[tool.key] = i ? false : tool.bAvailable ? true : false;});
							tAut.incompatibleTools.uniValues().forEach((tool) => {tAut.toolsByKey[tool] = false;});
							menu_properties['toolsByKey'][1] = JSON.stringify(tAut.toolsByKey);
							overwriteMenuProperties(); // Updates panel
							tAut.loadDependencies();
						}});
					});
					menu.newEntry({menuName: subMenuTools, entryText: 'Invert selected tools', func: () => {
						tAut.tools.forEach((tool) => {tAut.toolsByKey[tool.key] = tool.bAvailable ? !tAut.toolsByKey[tool.key] : false;});
						tAut.incompatibleTools.uniValues().forEach((tool) => {tAut.toolsByKey[tool] = false;});
						menu_properties['toolsByKey'][1] = JSON.stringify(tAut.toolsByKey);
						overwriteMenuProperties(); // Updates panel
						tAut.loadDependencies();
					}});
					// Refresh settings on startup
					menu.newCondEntry({entryText: 'Write tags... (cond)', condFunc: (bInit = true) => {
						if (bInit) {tAut.changeTools(JSON.parse(menu_properties['toolsByKey'][1]));}
					}});
					menu.newEntry({menuName, entryText: 'sep'});
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Playlist revive
			const scriptPath = folders.xxx + 'main\\playlist_revive.js';
			if (_isFile(scriptPath)){
				const name = 'Playlist Revive';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath);
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\playlist_revive.txt';
					{	// Submenu
						const subMenuName = menu.newMenu(name, menuName);
						// Create new properties with previous args
						menu_properties['simThreshold'] = ['\'Other tools\\Playlist Revive\' similarity', 0.50];
						// Checks
						menu_properties['simThreshold'].push({range: [[0,1]], func: !Number.isNaN}, menu_properties['simThreshold'][1]);
						// Menus
						let entryTextFunc = () => {return menu_properties['simThreshold'][1];};
						menu.newEntry({menuName: subMenuName, entryText: 'Replaces dead items with ones in library:', func: null, flags: MF_GRAYED});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Find dead items in all playlists', func: findDeadItems});
						menu.newEntry({menuName: subMenuName, entryText: 'Replace dead items in all playlists', func: playlistReviveAll});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText:'Replace dead items on selection', func:() => {
							playlistRevive({selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: 1})
						}, flags: focusFlags});
						menu.newEntry({menuName: subMenuName, entryText:() => {return 'Replace dead items on selection (' + entryTextFunc() * 100 + '% simil.)'}, func:() => {
							playlistRevive({selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: menu_properties['simThreshold'][1]})
						}, flags: focusFlags});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText:'Replace dead items on current playlist', func: () => {
							playlistRevive({selItems: plman.GetPlaylistItems(plman.ActivePlaylist), simThreshold: 1})
						}, flags: playlistCountFlagsAddRem});
						menu.newEntry({menuName: subMenuName, entryText:() => {return 'Replace dead items on current playlist (' + entryTextFunc() * 100 + '% simil.)'}, func: () => {
							playlistRevive({selItems: plman.GetPlaylistItems(plman.ActivePlaylist), simThreshold: menu_properties['simThreshold'][1]})
						}, flags: playlistCountFlagsAddRem});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText:() => {return 'Find alternative items on selection (' + entryTextFunc() * 100 + '% simil.)'}, func:() => {
							playlistRevive({selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: menu_properties['simThreshold'][1], bFindAlternative: true})
						}, flags: focusFlags});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText:'Simulate on selection (see console)', func: () => {
							playlistRevive({selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: 1, bSimulate: true})
						}, flags: focusFlags});
						menu.newEntry({menuName: subMenuName, entryText: () => {return 'Simulate on selection (' + entryTextFunc() * 100 + '% simil.) (see console)'}, func: () => {
							playlistRevive({selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: menu_properties['simThreshold'][1], bSimulate: true})
						}, flags: focusFlags});
						menu.newEntry({menuName: subMenuName, entryText: 'Simulate on selection (find alternative) (see console)', func:() => {
							playlistRevive({selItems: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), simThreshold: menu_properties['simThreshold'][1], bFindAlternative: true, bSimulate: true})
						}, flags: focusFlags});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Sets similarity threshold...', func: () => {
							const input = Number(utils.InputBox(window.ID, 'Float number between 0 and 1:', scriptName + ': ' + name, menu_properties['simThreshold'][1]));
							if (menu_properties['simThreshold'][1] === input) {return;}
							if (!Number.isFinite(input)) {return;}
							if (input < 0 || input > 1) {return;}
							menu_properties['simThreshold'][1] = input;
							overwriteMenuProperties(); // Updates panel
						}});
					}

				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Import track list
			const scriptPath = folders.xxx + 'main\\import_text_playlist.js';
			if (_isFile(scriptPath)){
				const name = 'Import track list';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath);
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\import_text_playlist.txt';
					{	// Submenu
						const subMenuName = menu.newMenu(name, menuName);
						// Create new properties with previous args
						menu_properties['importPlaylistPath'] = ['\'Other tools\\Import track list\' path', (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' : fb.ProfilePath) + folders.dataName + 'track_list_to_import.txt'];
						menu_properties['importPlaylistMask'] = ['\'Other tools\\Import track list\' pattern', JSON.stringify(['. ', '%TITLE%', ' - ', '%ARTIST%'])];
						menu_properties['importPlaylistFilters'] = ['\'Other tools\\Import track list\' filters', JSON.stringify(['%CHANNELS% LESS 3 AND NOT COMMENT HAS Quad', 'NOT (%RATING% EQUAL 2 OR %RATING% EQUAL 1)', '(NOT GENRE IS live AND NOT STYLE IS live) OR ((GENRE IS live OR STYLE IS live) AND style IS hi-fi)', 'NOT GENRE IS live AND NOT STYLE IS live'])];
						// Checks
						menu_properties['importPlaylistPath'].push({func: isString, portable: true}, menu_properties['importPlaylistPath'][1]);
						menu_properties['importPlaylistMask'].push({func: isJSON}, menu_properties['importPlaylistMask'][1]);
						menu_properties['importPlaylistFilters'].push({func: (x) => {return isJSON(x) && JSON.parse(x).every((query) => {return checkQuery(query, true);});}}, menu_properties['importPlaylistFilters'][1]);
						// Presets
						const maskPresets = [
							{name: 'Numbered Track list', val: JSON.stringify(['. ','%TITLE%',' - ','%ARTIST%'])},
							{name: 'Track list', val: JSON.stringify(['%TITLE%',' - ','%ARTIST%'])},
							{name: 'M3U Extended', val: JSON.stringify(['#EXTINF:',',','%ARTIST%',' - ','%TITLE%'])}
						];
						// Menus
						menu.newEntry({menuName: subMenuName, entryText: 'Find matches on library from a txt file:', func: null, flags: MF_GRAYED});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
							menu.newEntry({menuName: subMenuName, entryText: 'Import from file \\ url...', func: () => {
							let path;
							try {path = utils.InputBox(window.ID, 'Enter path to text file with list of tracks:', scriptName + ': ' + name, folders.xxx + 'examples\\track_list_to_import.txt', true);}
							catch (e) {return;}
							if (!_isFile(path) && path.indexOf('http://') === -1 && path.indexOf('https://') === -1) {console.log('File does not exist.'); return ;}
							let formatMask;
							try {formatMask = utils.InputBox(window.ID, 'Enter pattern to retrieve tracks. Mask is saved for future use.\nPresets at bottom may also be loaded by their number([x]).\n\nTo discard a section, use \'\' or "".\nTo match a section, put the exact chars to match.\nStrings with \'%\' are considered tags to extract.\n\n[\'. \', \'%TITLE%\', \' - \', \'%ARTIST%\'] matches something like:\n1. Respect - Aretha Franklin' + (maskPresets.length ? '\n\n' + maskPresets.map((preset, i) => {return '[' + i + ']' + (preset.name.length ? ' ' + preset.name : '') + ': ' + preset.val;}).join('\n') : '') , scriptName + ': ' + name, menu_properties.importPlaylistMask[1].replace(/"/g,'\''), true).replace(/'/g,'"');}
							catch (e) {return;}
							try { 
								// Load preset if possible
								if (formatMask.search(/^\[[0-9]*\]/g) !== -1) {
									const idx = formatMask.slice(1, -1);
									formatMask = idx >= 0 && idx < maskPresets.length ? maskPresets[idx].val : null;
									if (!formatMask) {console.log('Playlist Tools: Invalid format mask preset'); return;}
								} 
								// Parse mask
								formatMask = JSON.parse(formatMask);
							}
							catch (e) {console.log('Playlist Tools: Invalid format mask'); return;}
							if (!formatMask) {return;}
							const queryFilters = JSON.parse(menu_properties.importPlaylistFilters[1]);
							const idx = importTextPlaylist({path, formatMask, queryFilters})
							if (idx !== -1) {plman.ActivePlaylist = idx;}
							menu_properties.importPlaylistMask[1] = JSON.stringify(formatMask); // Save last mask used
							overwriteMenuProperties(); // Updates panel
						}});
						menu.newEntry({menuName: subMenuName, entryText: 'Import from file (path at properties)', func: () => {
							const path = menu_properties.importPlaylistPath[1];
							const formatMask = JSON.parse(menu_properties.importPlaylistMask[1]);
							const queryFilters = JSON.parse(menu_properties.importPlaylistFilters[1]);
							importTextPlaylist({path, formatMask, queryFilters})
						}});
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Configure filters...', func: () => {
							let input;
							try {input = utils.InputBox(window.ID, 'Enter array of queries to apply as consecutive conditions:\n\n [\'%CHANNELS% LESS 3\', \'%RATING% GREATER 2\']', scriptName + ': ' + name, menu_properties.importPlaylistFilters[1].replace(/"/g,'\''), true).replace(/'/g,'"');}
							catch (e) {return;}
							if (!input.length) {input = '[]';}
							try {JSON.parse(input);}
							catch (e) {console.log('Playlist Tools: Invalid filter array'); return;}
							if (input !== menu_properties.importPlaylistFilters[1]) {menu_properties.importPlaylistFilters[1] = input;}
							overwriteMenuProperties(); // Updates panel	
						}});
					}
					menu.newEntry({menuName, entryText: 'sep'});
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Playlist History
			const scriptPath = folders.xxx + 'helpers\\playlist_history.js';
			if (_isFile(scriptPath)){
				const name = 'Playlist History';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath);
					const subMenuName = menu.newMenu(name, menuName);
					menu.newEntry({menuName: subMenuName, entryText: 'Switch to previous playlists:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuName, entryText: 'Previous playlist', func: goPrevPls, flags: () => {return (plsHistory.length >= 2 ? MF_STRING : MF_GRAYED);}});
					menu.newCondEntry({entryText: 'Playlist History... (cond)', condFunc: () => {
						const [, ...list] = plsHistory;
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						if (!list.length) {menu.newEntry({menuName: subMenuName, entryText: '-None-', func: null, flags: MF_GRAYED});}
						list.forEach( (pls, idx) => {
							menu.newEntry({menuName: subMenuName, entryText: pls.name, func: () => {
								const idx = getPlaylistIndexArray(pls.name);
								if (idx.length) {
									if (idx.length === 1 && idx[0] !== -1) {
										plman.ActivePlaylist = idx[0];
									} else if (idx.indexOf(pls.idx) !== -1) {
										plman.ActivePlaylist = pls.idx;
									}
								}
							}});
						});
					}, flags: () => {return (plsHistory.length >= 2 ? MF_STRING : MF_GRAYED);}});
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		menu.newEntry({entryText: 'sep'});
	} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}

// Pool
{
	const name = 'Pools';
	if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
		include(folders.xxx + 'helpers\\helpers_xxx_playlists.js');
		include(folders.xxx + 'helpers\\helpers_xxx_playlists_files.js');
		const plsManHelper = folders.xxx + 'helpers\\playlist_manager_helpers.js';
		let isPlsMan = false;
		if (_isFile(plsManHelper)) {
			include(plsManHelper);
			isPlsMan = true;
		}
		readmes[newReadmeSep()] = 'sep';
		readmes[name] = folders.xxx + 'helpers\\readme\\playlist_tools_menu_pools.txt';
		forcedQueryMenusEnabled[name] = true;
		let menuName = menu.newMenu(name);
		{	// Automate tags
			const staticPools = [
			];
			const plLen = defaultArgs.playlistLength;
			const plLenHalf = Math.ceil(plLen / 2);
			const plLenQuart = Math.ceil(plLen / 4);
			let pools = [
				{name: 'Top tracks mix', pool: {
					fromPls: {_LIBRARY_0: plLenQuart, _LIBRARY_1: plLenQuart, _LIBRARY_2: plLenHalf}, 
					query: {_LIBRARY_0: '%RATING% EQUAL 3', _LIBRARY_1: '%RATING% EQUAL 4', _LIBRARY_2: '%RATING% EQUAL 5'}, 
					pickMethod: {_LIBRARY_0: 'random', _LIBRARY_1: 'random', _LIBRARY_2: 'random'},
					toPls: 'Top tracks mix', 
					sort: '',
					}},
				{name: 'Top tracks mix (intercalate)', pool: {
					fromPls: {_LIBRARY_0: plLenQuart, _LIBRARY_1: plLenQuart, _LIBRARY_2: plLenHalf}, 
					query: {_LIBRARY_0: '%RATING% EQUAL 3', _LIBRARY_1: '%RATING% EQUAL 4', _LIBRARY_2: '%RATING% EQUAL 5'}, 
					pickMethod: {_LIBRARY_0: 'random', _LIBRARY_1: 'random', _LIBRARY_2: 'random'},
					insertMethod: 'intercalate',
					toPls: 'Top tracks mix', 
					sort: '%playlist_index%',
					}},
				{name: 'sep'},
				{name: 'Current genre/style and top tracks', pool: {
					fromPls: {_LIBRARY_0: plLenQuart, _LIBRARY_1: plLenQuart, _LIBRARY_2: plLenHalf}, 
					query: {_LIBRARY_0: 'GENRE IS #GENRE# AND NOT (%RATING% EQUAL 2 OR %RATING% EQUAL 1)', _LIBRARY_1: 'STYLE IS #STYLE# AND NOT (%RATING% EQUAL 2 OR %RATING% EQUAL 1)', _LIBRARY_2: '%RATING% EQUAL 5'}, 
					pickMethod: {_LIBRARY_0: 'random', _LIBRARY_1: 'random', _LIBRARY_2: 'random'},
					toPls: 'Current genre/style and top tracks', 
					sort: '',
					}},
				{name: 'Current genre/style and instrumentals', pool: {
					fromPls: {_LIBRARY_0: plLenHalf, _LIBRARY_1: plLenQuart, _LIBRARY_2: plLenQuart}, 
					query: {_LIBRARY_0: '((GENRE IS #GENRE#) OR (STYLE IS #STYLE#)) AND NOT (%RATING% EQUAL 2 OR %RATING% EQUAL 1)', _LIBRARY_1: '((GENRE IS #GENRE#) OR (STYLE IS #STYLE#)) AND %RATING% EQUAL 5)', _LIBRARY_2: '((GENRE IS #GENRE#) OR (STYLE IS #STYLE#)) AND GENRE IS Instrumental AND NOT (%RATING% EQUAL 2 OR %RATING% EQUAL 1)'}, 
					pickMethod: {_LIBRARY_0: 'random', _LIBRARY_1: 'random', _LIBRARY_2: 'random'},
					toPls: 'Current genre/style and instrumentals', 
					sort: '',
					}},
				{name: 'Classic Pools (50 artists current genre)', pool: {
					fromPls: {_GROUP_0: 50},
					group: {_GROUP_0: 'ARTIST'},
					limit: {_GROUP_0: 3},
					query: {_GROUP_0: 'GENRE IS #GENRE#'}, 
					toPls: 'Classic Pools (50 artists current genre)', 
					sort: '',
					}},
				{name: 'sep'},
				{name: 'Classic Pools (50 artists)', pool: {
					fromPls: {_GROUP_0: 50},
					group: {_GROUP_0: 'ARTIST'},
					limit: {_GROUP_0: 3},
					query: {_GROUP_0: ''}, 
					toPls: 'Classic Pools (50 artists)', 
					sort: '',
					}},
				{name: 'Classic Pools (all dates)', pool: {
					fromPls: {_GROUP_0: Infinity}, 
					group: {_GROUP_0: 'DATE'},
					limit: {_GROUP_0: 2},
					query: {_GROUP_0: ''}, 
					toPls: 'Classic Pools (all dates)', 
					sort: '%DATE%',
					}},
				{name: 'Classic Pools (3 tracks per artist letter)', pool: {
					fromPls: {_GROUP_0: Infinity}, 
					group: {_GROUP_0: '$left($ascii(%ARTIST%),1)'},
					limit: {_GROUP_0: 3},
					query: {_GROUP_0: ''}, 
					toPls: 'Classic Pools (3 tracks per letter)', 
					sort: '',
					}},
				{name: 'Classic Pools (3 tracks per genre)', pool: {
					fromPls: {_GROUP_0: Infinity}, 
					group: {_GROUP_0: 'GENRE'},
					limit: {_GROUP_0: 3},
					query: {_GROUP_0: ''}, 
					toPls: 'Classic Pools (3 tracks per genre)', 
					sort: '',
					}},
			];
			
			let selArg = {...pools[0]};
			const poolsDefaults = [...pools];
			// Create new properties with previous args
			menu_properties['pools'] = [name + ' entries', JSON.stringify(pools)];
			menu_properties['poolsCustomArg'] = [name + '\\Custom pool args', JSON.stringify(selArg)];
			// Checks
			menu_properties['pools'].push({func: isJSON}, menu_properties['pools'][1]);
			menu_properties['poolsCustomArg'].push({func: isJSON}, menu_properties['poolsCustomArg'][1]);
			// Functions
			const pickMethods = {
				random: (handleListFrom, num, count) => {
						const numbers = range(0, count - 1, 1).shuffle().slice(0, count > num ? num : count); // n randomly sorted. sort + random, highly biased!!
						const handleListFromClone = handleListFrom.Clone().Convert();
						return new FbMetadbHandleList(numbers.flatMap((i) => {return handleListFromClone.slice(i, i + 1)}));
					},
				start: (handleListFrom, num, count) => {if (count > num) {handleListFrom.RemoveRange(num - 1, count);} return handleListFrom;},
				end: (handleListFrom, num, count) => {if (count > num) {handleListFrom.RemoveRange(0, count - num);} return handleListFrom;},
			};
			const insertMethods = {
				standard: (handleListFrom, handleListTo) => {handleListTo.InsertRange(handleListTo.Count, handleListFrom);},
				intercalate: (handleListFrom, handleListTo, n) => { // Source 1 Track 1, Source 2  Track 2, Source 3  Track 3, Source 1 Track 2, ...
					if (!handleListTo.Count || !n) {insertMethods.standard(handleListFrom, handleListTo);}
					else {
						handleListFrom.Convert().forEach((handle, idx) => {
							const pos = (idx + 1)* (n + 1) - 1;
							handleListTo.Insert(pos, handle);
						});
					}
				},
			};
			const do_pool = (pool, properties) => {
				if (defaultArgs.bProfile) {var profiler = new FbProfiler('do_pool');}
				let handleListTo = new FbMetadbHandleList();
				let bAbort = false;
				Object.keys(pool.fromPls).forEach((plsName, n) => {
					if (bAbort) {return;}
					let handleListFrom;
					// Select source
					switch (true) {
						case plsName.startsWith('_LIBRARY_'): { // Library Source
							handleListFrom = fb.GetLibraryItems();
							console.log('Playlist tools Pools: source -> Library');
							break;
						}
						case plsName.startsWith('_GROUP_'): { // Library Source grouping by TF
							console.log('Playlist tools Pools: source -> TF Group');
							// Pre-Filter with query
							handleListFrom = fb.GetLibraryItems();
							const query = typeof pool.query  !== 'undefined' ? pool.query[plsName] : '';
							if (query.length && query.toUpperCase() !== 'ALL') {
								const processedQuery = queryReplaceWithCurrent(query, fb.GetFocusItem(true));
								if (checkQuery(processedQuery, true)) {
									console.log('Playlist tools Pools: filter -> ' + processedQuery);
									handleListFrom = fb.GetQueryItems(handleListFrom, processedQuery);
								} else {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query + '\n' + processedQuery, scriptName); bAbort = true; return;}
							}
							// Retrieve all possible groups
							const group = typeof pool.group !== 'undefined' ? pool.group[plsName] : '';
							const tagSet = [...new Set(getTagsValuesV4(handleListFrom, [group]).flat(Infinity))].filter(Boolean).shuffle();
							// Retrieve n random groups
							const num = Math.min(pool.fromPls[plsName] || Infinity, tagSet.length) - 1;
							const limit = typeof pool.limit !== 'undefined' ? pool.limit[plsName] : Infinity;
							const handleListsGroups = [];
							for (let i = 0; i <= num; i++) {
								const groupTF = group.indexOf('$') !== -1 ? _q(group) : group;
								const query = groupTF + ' IS ' + _q(sanitizeTagTfo(tagSet[i]));
								if (!checkQuery(query, true)) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + groupTF + '\n' + query, scriptName); bAbort = true; return;}
								handleListsGroups[i] = new FbMetadbHandleList(fb.GetQueryItems(handleListFrom, query).Convert().shuffle().slice(0, limit));
							}
							// Join all tracks
							handleListFrom = new FbMetadbHandleList();
							handleListsGroups.forEach((handleList) => {handleListFrom.AddRange(handleList);});
							console.log('Playlist tools Pools: group -> ' + limit + ' tracks per ' + (group.length ? group : 'entire library'));
							break;
						}
						case plsName.startsWith('_SEARCHBYGRAPH_'): { // Search by GRAPH
							const nameGraph = 'Search similar by Graph...';
							const nameDynGenre = 'Search similar by DynGenre...';
							const nameWeight = 'Search similar by Weight...';
							const bScriptLoaded = !menusEnabled.hasOwnProperty(nameGraph) || !menusEnabled.hasOwnProperty(nameDynGenre) || !menusEnabled.hasOwnProperty(nameWeight) || !menusEnabled.hasOwnProperty(specialMenu) || menusEnabled[nameGraph] === true || menusEnabled[nameDynGenre] === true || menusEnabled[nameWeight] === true || menusEnabled[specialMenu] === true;
							if (typeof do_searchby_distance !== 'undefined' && bScriptLoaded) {
								// Get arguments
								const recipe = isString(pool.recipe[plsName]) ? _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\recipes\\' + pool.recipe[plsName], 'Recipe json', scriptName, utf8) : pool.recipe[plsName];
								// Check
								if (!recipe) {bAbort = true; return;}
								// Get reference (instead of selection)
								const theme = recipe.hasOwnProperty('theme') ? '' : pool.theme[plsName];
								const checks = ['sbd_max_graph_distance'];
								let bDone = true;
								checks.forEach((key) => {
									if (!recipe.hasOwnProperty(key)) {
										console.log('Playlist tools Pools: source recipe is missing ' + key + ' (' + folders.xxx + 'main\\search_bydistance.js' + ')');
										bDone = false;
									}
								});
								if (!bDone) {bAbort = true; return;}
								// Force arguments
								recipe.bCreatePlaylist = false; 
								recipe.playlistLength = Infinity; // use all possible tracks
								recipe.method = 'GRAPH';
								recipe.bShowFinalSelection = false;
								recipe.bBasicLogging = false;
								// Apply
								const [selectedHandlesArray, ...rest] = do_searchby_distance({properties, theme, recipe});
								handleListFrom = new FbMetadbHandleList(selectedHandlesArray);
								console.log('Playlist tools Pools: source -> Search by GRAPH');
							} else {
								console.log('Playlist tools Pools: source requires a script not lodaded or disabled (' + folders.xxx + 'main\\search_bydistance.js' + ')');
								bAbort = true;
								return;
							}
							break;
						}
						case plsName.startsWith('_SEARCHBYWEIGHT_'): { // Search by WEIGHT
							if (typeof do_searchby_distance !== 'undefined') {
								// Get arguments
								const recipe = isString(pool.recipe[plsName]) ? _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\recipes\\' + pool.recipe[plsName], 'Recipe json', scriptName, utf8) : pool.recipe[plsName];
								// Check
								if (!recipe) {bAbort = true; return;}
								// Get reference (instead of selection)
								const theme = recipe.hasOwnProperty('theme') ? '' : pool.theme[plsName];
								const checks = [];
								let bDone = true;
								checks.forEach((key) => {
									if (!recipe.hasOwnProperty(key)) {
										console.log('Playlist tools Pools: source recipe is missing ' + key + ' (' + folders.xxx + 'main\\search_bydistance.js' + ')');
										bDone = false;
									}
								});
								if (!bDone) {bAbort = true; return;}
								// Force arguments
								recipe.bCreatePlaylist = false; 
								recipe.playlistLength = Infinity; // use all possible tracks
								recipe.method = 'WEIGHT';
								recipe.bShowFinalSelection = false;
								recipe.bBasicLogging = false;
								// Apply
								const [selectedHandlesArray, ...rest] = do_searchby_distance({properties, theme, recipe});
								handleListFrom = new FbMetadbHandleList(selectedHandlesArray);
								console.log('Playlist tools Pools: source -> Search by WEIGHT');
							} else {
								console.log('Playlist tools Pools: source requires a script not lodaded or disabled (' + folders.xxx + 'main\\search_bydistance.js' + ')');
								bAbort = true;
								return;
							}
							break;
						}
						case plsName.startsWith('_SEARCHBYDYNGENRE_'): { // Search by DYNGENRE
							if (typeof do_searchby_distance !== 'undefined') {
								// Get arguments
								const recipe = isString(pool.recipe[plsName]) ? _jsonParseFileCheck(folders.xxx + 'presets\\Search by\\recipes\\' + pool.recipe[plsName], 'Recipe json', scriptName, utf8) : pool.recipe[plsName];
								// Check
								if (!recipe) {bAbort = true; return;}
								// Get reference (instead of selection)
								const theme = recipe.hasOwnProperty('theme') ? '' : pool.theme[plsName];
								const checks = ['dyngenreWeight'];
								let bDone = true;
								checks.forEach((key) => {
									if (!recipe.hasOwnProperty(key)) {
										console.log('Playlist tools Pools: source recipe is missing ' + key + ' (' + folders.xxx + 'main\\search_bydistance.js' + ')');
										bDone = false;
									}
								});
								if (!bDone) {bAbort = true; return;}
								// Force arguments
								recipe.bCreatePlaylist = false; 
								recipe.playlistLength = Infinity; // use all possible tracks
								recipe.method = 'DYNGENRE';
								recipe.bShowFinalSelection = false;
								recipe.bBasicLogging = false;
								// Apply
								const [selectedHandlesArray, ...rest] = do_searchby_distance({properties, theme, recipe});
								handleListFrom = new FbMetadbHandleList(selectedHandlesArray);
								console.log('Playlist tools Pools: source -> Search by DYNGENRE');
							} else {
								console.log('Playlist tools Pools: source requires a script not lodaded or disabled (' + folders.xxx + 'main\\search_bydistance.js' + ')');
								bAbort = true;
								return;
							}
							break;
						}
						default : { // Playlist Source
							const idxFrom = plman.FindPlaylist(plsName);
							// Try loaded playlist first, then matching pls name (within file) and then by filename
							if (idxFrom === -1) { // Playlist file
								let bDone = false;
								let plsMatch = {};
								// window.NotifyOthers('Playlist manager: get handleList', plsName); // Ask to share handle lists
								// if (plmPromises.length) {
									// handleListFrom = new FbMetadbHandleList();
									// Promise.all(plmPromises).then((handleList) => {
											// handleListFrom.AddRange(new FbMetadbHandleList(...handleList));
										// }).finally(() => {bDone = true; plmPromises.length = 0; console.log(handleListFrom);});
								// } 
								if (isPlsMan) {
									const playlistPath = JSON.parse(menu_panelProperties.playlistPath[1]); // This is retrieved everytime the menu is called
									playlistPath.forEach((path) => { // Find first exact match
										if (bDone) {return;}
										const plsArr = loadPlaylistsFromFolder(path);
										plsArr.forEach((plsObj) => {
											if (bDone) {return;}
											if (plsObj.name === plsName) {
												handleListFrom = getHandlesFromPlaylist(plsObj.path, path, true); // Load found handles, omit the rest instead of nothing
												plsMatch = plsObj;
												bDone = true;
											}
										});
										if (bDone) {return;}
										plsArr.forEach((plsObj) => {
											if (bDone) {return;}
											if (plsObj.path.replace(path,'').startsWith(plsName)) {
												handleListFrom = getHandlesFromPlaylist(plsObj.path, path, true); // Load found handles, omit the rest instead of nothing
												plsMatch = plsObj;
												bDone = true;
											}
										});
									});
								}
								if (!bDone) {console.log('Playlist tools Pools: source -> Not found - ' + plsName);}
								else {console.log('Playlist tools Pools: source -> ' + plsName + ' (' + plsMatch.path + ')');}
							} else { // Loaded playlist
								console.log('Playlist tools Pools: source -> ' + plsName);
								handleListFrom = plman.GetPlaylistItems(idxFrom);
							}
						}
					}
					if (!handleListFrom || !handleListFrom.Count) {return;}
					// Only apply to non-classic pool
					if (!plsName.startsWith('_GROUP_')) {
						// Filter
						const query = typeof pool.query  !== 'undefined' ? pool.query[plsName] : '';
						if (query.length && query.toUpperCase() !== 'ALL') {
							const processedQuery = queryReplaceWithCurrent(query, fb.GetFocusItem(true));
							if (checkQuery(processedQuery, true)) {
								console.log('Playlist tools Pools: filter -> ' + processedQuery);
								handleListFrom = fb.GetQueryItems(handleListFrom, processedQuery);
							} else {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + query + '\n' + processedQuery, scriptName); bAbort = true; return;}
						}
						// Remove duplicates
						handleListFrom = removeDuplicatesV2({handleList: handleListFrom, checkKeys: ['title', 'artist', 'date']});
					}
					// Remove tracks on destination list
					handleListTo.Clone().Convert().forEach((handle) => {handleListFrom.Remove(handle)});
					// Pick
					const num = pool.fromPls[plsName] || Infinity;
					if (!plsName.startsWith('_GROUP_')) {
						const count = handleListFrom.Count;
						if (count !== 1) {
							handleListFrom = pickMethods[pool.pickMethod[plsName]](handleListFrom, num, count);
						}
						console.log('Playlist tools Pools: pool size -> ' + handleListFrom.Count + ' (' + count +') tracks');
					} else {console.log('Playlist tools Pools: pool size -> ' + handleListFrom.Count + ' tracks from ' + num + ' groups');}
					// Insert
					if (pool.hasOwnProperty('insertMethod')) {
						insertMethods[pool.insertMethod](handleListFrom, handleListTo, n)
					} else {insertMethods['standard'](handleListFrom, handleListTo)}
				});
				if (bAbort) {fb.ShowPopupMessage('Check console. Pools failed with major errors.', scriptName); return;}
				const idxTo = plman.FindOrCreatePlaylist(pool.toPls, true);
				if (addLock(idxTo) || removeLock(idxTo)) {Console.log('Output playlist is locked for adding\\removing items: ' + pool.toPls); return;}
				plman.UndoBackup(idxTo);
				plman.ClearPlaylist(idxTo);
				plman.InsertPlaylistItems(idxTo, 0, handleListTo, true);
				if (typeof pool.sort !== 'undefined') {
					plman.SortByFormat(idxTo, pool.sort);
				}
				plman.ActivePlaylist = idxTo;
				if (defaultArgs.bProfile) {profiler.Print();}
			}
			const inputPool = () => {
				// Sources
				let fromPls;
				try {fromPls = utils.InputBox(window.ID, 'Enter playlist source(s) (pairs):\nNo playlist name equals to _LIBRARY_#.\n(playlist,# tracks;playlist,# tracks)', scriptName + ': ' + name, Object.keys(pools[0].pool.fromPls).reduce((total, key) => {return total + (total.length ? ';' : '') + key + ',' + pools[0].pool.fromPls[key];}, ''), true);}
				catch (e) {return;}
				if (!fromPls.length) {console.log('Input was empty'); return;}
				if (fromPls.indexOf(',') === -1) {console.log('Input was not a pair separated by \',\''); return;}
				fromPls = fromPls.split(';');
				fromPls = fromPls.map((pair, index) => {
					pair = pair.split(',');
					if (!pair[0].length) {pair[0] = '_LIBRARY_' + index}
					pair[1] = Number(pair[1]);
					return pair;
				});
				if (fromPls.some((pair) => {return pair.length % 2 !== 0})) {console.log('Input was not a list of pairs separated \';\''); return;}
				if (fromPls.some((pair) => {return isNaN(pair[1])})) {console.log('# tracks was not a number'); return;}
				fromPls = Object.fromEntries(fromPls);
				// Queries
				let query;
				try {query = utils.InputBox(window.ID, 'Enter queries to filter the sources (pairs):\nEmpty or ALL are equivalent, but empty applies global forced query too if enabled.\n(playlist,query;playlist,query)', scriptName + ': ' + name, Object.keys(fromPls).reduce((total, key) => {return total + (total.length ? ';' : '') + key + ',' + 'ALL';}, ''), true);}
				catch (e) {return;}
				if (!query.length) {console.log('Input was empty'); return;}
				if (query.indexOf(',') === -1) {console.log('Input was not a pair separated by \',\''); return;}
				query = query.split(';');
				query = query.map((pair) => {
					pair = pair.split(',');
					// if (!pair[1].length) {pair[1] = 'ALL'}
					return pair;
				});
				// TODO Check queries
				if (query.some((pair) => {return pair.length % 2 !== 0})) {console.log('Input was not a list of pairs separated \';\''); return;}
				if (query.some((pair) => {return !fromPls.hasOwnProperty(pair[0])})) {console.log('Playlist named did not match with sources'); return;}
				query = Object.fromEntries(query);
				// Picking Method
				let pickMethod;
				const pickMethodsKeys = Object.keys(pickMethods);
				try {pickMethod = utils.InputBox(window.ID, 'How tracks should be picked? (pairs)\nMethods: ' + pickMethodsKeys.join(', ') + '\n(playlist,method;playlist,method)', scriptName + ': ' + name, Object.keys(fromPls).reduce((total, key) => {return total + (total.length ? ';' : '') + key + ',' + pickMethodsKeys[0]}, ''), true);}
				catch (e) {return;}
				if (!pickMethod.length) {console.log('Input was empty'); return;}
				if (pickMethod.indexOf(',') === -1) {console.log('Input was not a pair separated by \',\''); return;}
				pickMethod = pickMethod.split(';');
				pickMethod = pickMethod.map((pair) => {
					pair = pair.split(',');
					pair[1] = pair[1].toLowerCase();
					return pair;
				});
				if (pickMethod.some((pair) => {return pair.length % 2 !== 0})) {console.log('Input was not a list of pairs separated \';\''); return;}
				if (pickMethod.some((pair) => {return pickMethodsKeys.indexOf(pair[1]) === -1})) {console.log('Picking method not recognized'); return;}
				pickMethod = Object.fromEntries(pickMethod);
				// Destination
				let toPls;
				try {toPls = utils.InputBox(window.ID, 'Enter playlist destination:', scriptName + ': ' + name, 'Playlist C', true);}
				catch (e) {return;}
				if (!toPls.length) {console.log('Input was empty'); return;}
				// Sort
				let sort = '';
				try {sort = utils.InputBox(window.ID, 'Enter final sorting:\n(empty to randomize)', scriptName + ': ' + name, '%PLAYLIST_INDEX%', true);}
				catch (e) {return;}
				// TODO: Test sorting
				// Object
				return {fromPls, query, toPls, sort, pickMethod};
			}
			// Menus
			menu.newEntry({menuName, entryText: 'Use Playlists / Queries as pools:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			// Static menus
			staticPools.forEach( (poolObj) => {
				if (poolObj.name === 'sep') {
					menu.newEntry({menuName, entryText: 'sep'});
				} else {
					let entryText = poolObj.name;
					// Global forced query
					const pool = clone(poolObj.pool);
					if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) { // With forced query enabled
						Object.keys(pool.query).forEach((key) => {
							if (pool.query[key].length && pool.query[key].toUpperCase() !== 'ALL') { // ALL query never uses forced query!
								pool.query[key] = '(' + pool.query[key] + ') AND (' + defaultArgs.forcedQuery + ')';
							} else if (!pool.query[key].length) { // Empty uses forced query or ALL
								pool.query[key] = defaultArgs.forcedQuery;
							}
						});
					} else {
						Object.keys(pool.query).forEach((key) => { // Otherwise empty is replaced with ALL
							if (!pool.query[key].length) {
								pool.query[key] = 'ALL';
							}
						});
					}
					menu.newEntry({menuName, entryText, func: () => {do_pool(pool);}});
				}
			});
			menu.newCondEntry({entryText: 'Pools... (cond)', condFunc: () => {
				// Entry list
				pools = JSON.parse(menu_properties['pools'][1]);
				pools.forEach( (poolObj) => {
					// Add separators
					if (poolObj.hasOwnProperty('name') && poolObj.name === 'sep') {
						menu.newEntry({menuName, entryText: 'sep'});
					} else { 
						// Create names for all entries
						let poolName = poolObj.name;
						poolName = poolName.length > 40 ? poolName.substring(0,40) + ' ...' : poolName;
						// Global forced query
						const pool = clone(poolObj.pool);
						if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) {
							Object.keys(pool.query).forEach((key) => { // With forced query enabled
								if (pool.query[key].length && pool.query[key].toUpperCase() !== 'ALL') { // ALL query never uses forced query!
									pool.query[key] = '(' + pool.query[key] + ') AND (' + defaultArgs.forcedQuery + ')';
								} else if (!pool.query[key].length) { // Empty uses forced query or ALL
									pool.query[key] = defaultArgs.forcedQuery;
								}
							});
						} else {
							Object.keys(pool.query).forEach((key) => { // Otherwise empty is replaced with ALL
								if (!pool.query[key].length) {
									pool.query[key] = 'ALL';
								}
							});
						}
						menu.newEntry({menuName, entryText: poolName, func: () => {do_pool(pool, menu_properties);}});
					}
				});
				menu.newEntry({menuName, entryText: 'sep'});
				{ // Static menu: user configurable
					menu.newEntry({menuName, entryText: 'Custom pool...', func: () => {
						// On first execution, must update from property
						selArg.tfo = JSON.parse(menu_properties['poolsCustomArg'][1]).tfo;
						// Input
						const input = inputPool();
						if (!input) {return;}
						const pool = clone(input);
						if (forcedQueryMenusEnabled[name] && defaultArgs.forcedQuery.length) {
							Object.keys(pool.query).forEach((key) => { // With forced query enabled
								if (pool.query[key].length && pool.query[key].toUpperCase() !== 'ALL') { // ALL query never uses forced query!
									pool.query[key] = '(' + pool.query[key] + ') AND (' + defaultArgs.forcedQuery + ')';
								} else if (!pool.query[key].length) { // Empty uses forced query or ALL
									pool.query[key] = defaultArgs.forcedQuery;
								}
							});
						} else {
							Object.keys(pool.query).forEach((key) => { // Otherwise empty is replaced with ALL
								if (!pool.query[key].length) {
									pool.query[key] = 'ALL';
								}
							});
						}
						// Execute
						do_pool(pool, menu_properties);
						// For internal use original object
						selArg.pool = input;
						menu_properties['poolsCustomArg'][1] = JSON.stringify(selArg); // And update property with new value
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
						try {entryName = utils.InputBox(window.ID, 'Enter name for menu entry\nWrite \'sep\' to add a line.', scriptName + ': ' + name, '', true);}
						catch (e) {return;}
						if (!entryName.length) {return;}
						if (entryName === 'sep') {input = {name: entryName};} // Add separator
						else { // or new entry
							const pool = inputPool();
							if (!pool) {return;}
							input = {name: entryName, pool}
						}
						// Add entry
						pools.push(input);
						// Save as property
						menu_properties['pools'][1] = JSON.stringify(pools); // And update property with new value
						// Presets
						if (!presets.hasOwnProperty('pools')) {presets.pools = [];}
						presets.pools.push(input);
						menu_properties['presets'][1] = JSON.stringify(presets);
						overwriteMenuProperties(); // Updates panel
					}});
					{
						const subMenuSecondName = menu.newMenu('Remove entry from list...' + nextId('invisible', true, false), menuName);
						pools.forEach( (pool, index) => {
							const entryText = (pool.name === 'sep' ? '------(separator)------' : (pool.name.length > 40 ? pool.name.substring(0,40) + ' ...' : pool.name));
							menu.newEntry({menuName: subMenuSecondName, entryText, func: () => {
								pools.splice(index, 1);
								menu_properties['pools'][1] = JSON.stringify(pools);
								// Presets
								if (presets.hasOwnProperty('pools')) {
									presets.pools.splice(presets.pools.findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(pool);}), 1);
									if (!presets.pools.length) {delete presets.pools;}
									menu_properties['presets'][1] = JSON.stringify(presets);
								}
								overwriteMenuProperties(); // Updates panel
							}});
						});
						if (!pools.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
						menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
							pools = [...poolsDefaults];
							menu_properties['pools'][1] = JSON.stringify(pools);
							// Presets
							if (presets.hasOwnProperty('pools')) {
								delete presets.pools;
								menu_properties['presets'][1] = JSON.stringify(presets);
							}
							overwriteMenuProperties(); // Updates panel
						}});
					}
				}
			}});
			menu.newCondEntry({entryText: 'Get playlist manager path (cond)', condFunc: () => {
				window.NotifyOthers('Playlist manager: playlistPath', null); // Ask to share paths
				isPlsMan = _isFile(plsManHelper); // Safety check
			}});
		}
	} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}

// Macros
{
	const name = 'Macros';
	if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
		let menuName = menu.newMenu(name);
		const scriptPath = folders.xxx + 'helpers\\playlist_tools_menu_macros.js';
		if (_isFile(scriptPath)){
			include(scriptPath);
			readmes[newReadmeSep()] = 'sep';
			readmes[name] = folders.xxx + 'helpers\\readme\\playlist_tools_menu_macros.txt';
			// Create new properties
			const macrosDefaults = [
				{name: 'Test Tools', entry: [
					'Most played Tracks\\Most played from 2021',
					'Most played Tracks\\Most played from (all years)',
					'Top rated Tracks from...\\Top rated from 2021',
					'Select...\\Select first track',
					'Move selection to...\\To the middle',
					'Expand...\\By Artist',
					'Next\\By Artist',
					'Search same by tags...\\By Moods (=6)',
					'Select...\\Select last track',
					'Dynamic Queries...\\Same title (any artist)',
					'Select...\\Select random track',
					'Search similar by Graph...\\Random Styles/Genres mix, same Mood',
					'Select...\\Select random track',
					'Special Playlists...\\Influences from any date',
					'Duplicates and tag filtering\\Remove duplicates by title, artist, date',
					'Harmonic mix\\Harmonic mix from playlist',
					'Select...\\Select All',
					'Advanced sort...\\Incremental genre/styles (DynGenre)',
					'Advanced sort...\\Incremental key (Camelot Wheel)',
					'Scatter by tags\\Scatter acoustic tracks',
					'Playlist Revive\\Find dead items in all playlists',
					'Import track list\\Import from file (path at properties)',
					'Pools\\Top tracks mix',
					'Macros\\Report library tags errors',
					'Search by Distance\\Find genres/styles not on Graph',
					'Search by Distance\\Debug Graph (check console)'
				], bAsync: false},
				{name: 'Test Tools (with input)', entry: [
					'Top rated Tracks from...\\From year...',
					'Search same by tags...\\By... (pairs of tags)',
					'Standard Queries...\\By... (query)',
					'Dynamic Queries...\\By... (query)',
					'Duplicates and tag filtering\\Filter playlist by... (tags)',
					'Query filtering\\Filter playlist by... (query)',
					'Select...\\Select All',
					'Sort...\\By... (expression)',
					'Playlist manipulation\\Find or create playlist...',
					'Import track list\\Import from file \\ url...',
					'Pools\\Custom pool...'
				], bAsync: false},
				{name: 'sep'},
				{name: 'Report library tags errors', entry: [
					'Standard Queries...\\Entire library',
					'Select...\\Select All',
					'Check tags\\Report errors by comparison'
				], bAsync: true},
				{name: 'Report all library tags', entry: [
					'Standard Queries...\\Entire library',
					'Select...\\Select All',
					'Check tags\\Report all tags by comparison'
				], bAsync: true}
			];
			// {name, entry: []}
			menu_properties['macros'] = ['Saved macros', JSON.stringify(macrosDefaults)];
			// Checks
			menu_properties['macros'].push({func: isJSON}, menu_properties['macros'][1]);
			// Menus
			menu.newEntry({menuName, entryText: 'Save and run multiple menu entries:', func: null, flags: MF_GRAYED});
			menu.newEntry({menuName, entryText: 'sep'});
			menu.newCondEntry({entryText: 'Macros', condFunc: () => {
				let propMacros = JSON.parse(menu_properties['macros'][1]);
				if (!macros.length && propMacros.length) {macros = propMacros;} // Restore macros list on first init
				// List
				propMacros.forEach((macro) => {
					if (macro.name === 'sep') { // Create separators
						menu.newEntry({menuName, entryText: 'sep'});
					} else {
						const bAsync = macro.hasOwnProperty('bAsync') && macro.bAsync ? true : false;
						menu.newEntry({menuName, entryText: macro.name + (bAsync ? '\t(async)' : ''), func: () => {
							macro.entry.forEach( (entry, idx, arr) => {
								menu.btn_up(void(0), void(0), void(0), entry, void(0), void(0), void(0), {pos: 1, args: bAsync}); // Don't clear menu on last call
							});
						}});
					}
				});
				if (!propMacros.length) {menu.newEntry({menuName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
				menu.newEntry({menuName, entryText: 'sep'});
				// Save
				menu.newEntry({menuName, entryText: 'Start recording a macro', func: () => {
					const macro = initMacro(menu);
					if (macro && macro.name === 'sep') { // Just add a separator
						saveMacro();
						menu_properties['macros'][1] = JSON.stringify(macros);
						// Presets
						if (!presets.hasOwnProperty('macros')) {presets.macros = [];}
						presets.macros.push(macro);
						menu_properties['presets'][1] = JSON.stringify(presets);
						overwriteProperties(menu_properties); // Updates panel
					}
				}});
				menu.newEntry({menuName, entryText: 'Stop recording and Save macro', func: () => {
					const macro = saveMacro();
					menu_properties['macros'][1] = JSON.stringify(macros);
					// Presets
					if (!presets.hasOwnProperty('macros')) {presets.macros = [];}
					presets.macros.push(macro);
					menu_properties['presets'][1] = JSON.stringify(presets);
					overwriteProperties(menu_properties); // Updates panel
				}});
				// Delete
				{
					const subMenuSecondName = menu.newMenu('Remove entry from list...' + nextId('invisible', true, false), menuName);
					propMacros.forEach( (macro, index) => {
						const entryText = (macro.name === 'sep' ? '------(separator)------' : (macro.name.length > 40 ? macro.name.substring(0,40) + ' ...' : macro.name));
						menu.newEntry({menuName: subMenuSecondName, entryText, func: () => {
							propMacros.splice(index, 1);
							menu_properties['macros'][1] = JSON.stringify(propMacros);
							// Presets
							if (presets.hasOwnProperty('macros')) {
								presets.macros.splice(presets.macros.findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(macro);}), 1);
								if (!presets.macros.length) {delete presets.macros;}
								menu_properties['presets'][1] = JSON.stringify(presets);
							}
							overwriteProperties(menu_properties); // Updates panel
							macros = propMacros; // Discards any non saved macro
						}});
					});
					if (!macros.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
					menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
					menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
						propMacros = [...macrosDefaults];
						menu_properties['macros'][1] = JSON.stringify(propMacros);
						if (presets.hasOwnProperty('macros')) {
							delete presets.macros;
							menu_properties['presets'][1] = JSON.stringify(presets);
						}
						overwriteMenuProperties(); // Updates panel
						macros = []; // Discards any non saved macro
					}});
				}
			}});
		}
		menu.newEntry({entryText: 'sep'});
	} else {menuDisabled.push({menuName: name, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}

// Script integration
{
	const name = 'Script integration';
	if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
		readmes[newReadmeSep()] = 'sep';
		let menuName = menu.newMenu(name);
		{	// Main menu editor
			const scriptPath = folders.xxx + 'main\\main_menu_custom.js';
			if (_isFile(scriptPath)){
				const name = 'SMP Main menu';
				if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
					include(scriptPath);
					include(folders.xxx + 'helpers\\helpers_xxx_playlists.js');
					readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\main_menu_custom.txt';
					const subMenuName = menu.newMenu(name, menuName);
					var mainMenuSMP = Object.values(onMainMenuEntries);
					const mainMenuSMPDefaults = Object.values(onMainMenuEntries);
					menu_properties['mainMenuSMP'] = [menuName + '\\' + name + ' entries', JSON.stringify(mainMenuSMP)]; // On main_menu_custom.js
					menu_properties['mainMenuSMP'].push({func: isJSON}, menu_properties['mainMenuSMP'][1]);
					const plsListener = 'pt:listener';
					// Helpers
					function exportMenus(path) {
						const listExport = clone(mainMenuSMP).filter(Boolean).map((entry) => {return {name: entry.name, funcName: entry.funcName, icon: entry.hasOwnProperty('icon') ? entry.icon : ''};});
						return _save(path + 'smpmenus.json', JSON.stringify(listExport, null, '\t'));
					}
					var exportEntries = function exportEntries(path) {
						const mainMenu = menu.getMainMenuName();
						// Separators are not globally filtered to be able to redraw -at least partially- the tree
						const tree = {};
						let menuList = [];
						const toSkip = new Set(['Add new entry to list...', 'Remove entry from list...', 'Add new query to list...', 'Remove query from list...', 'From year...', 'By... (pairs of tags)', 'By... (query)', 'Filter playlist by... (query)', 'Configuration', 'Menu 1', 'Menu 2', 'Menu 3', 'Menu 4', 'Menu 5', 'Menu 6', 'Menu 7', 'Menu 8', 'Menu 9', 'Find track(s) in...', 'Check tags', 'Write tags', 'Playlist History', 'Custom pool...', 'Start recording a macro', 'Stop recording and Save macro', 'Playlist Names Commands', 'Include scripts', 'Search by Distance','Set Global Forced Query...', 'Readmes...', 'SMP Main menu', 'Script integration', 'Split playlist list submenus at...', 'Show locked playlist (autoplaylists, etc.)?', 'Show current playlist?', 'Selection manipulation', 'Close playlist...', 'Go to playlist...', 'Send playlist\'s tracks to...', 'Remove track(s) from...', 'Find now playing track in...','Other tools', 'Configure dictionary...', 'By halves', 'By quarters', 'By thirds' , 'Send selection to...', 'Don\'t try to find tracks if selecting more than...', 'Filter playlist by... (tags)', 'Set tags (for duplicates)...', 'Set tags (for filtering)...', 'Set number allowed (for filtering)...', 'Sets similarity threshold...', 'From year...', 'From last...','UI', 'Logging', 'Asynchronous processing', 'Tag remapping','SMP Dynamic menu','Import track list','Report all from...','Check only...','Difference with playlist...','Intersect with playlist...','Merge with playlist...','Tags...', 'By... (tags)','Available tools','Enable double pass to match more tracks','By... (expression)','Find or create playlist...','To specified position','Select next tracks...','Available tools...','Harmonic mixing']);
						const toSkipStarts = ['(Send sel. to)', 'Remove entry from list...', '(Close) Playlists', '(Go to) Playlists', '(Send all to) Playlists'];
						allEntries.filter((entry) => {return entry.hasOwnProperty('entryText') && entry.hasOwnProperty('menuName');}).forEach((entry) => {
							const entryText = (isFunction(entry.entryText) ? entry.entryText() : entry.entryText).replace(/\t.*/g,'');
							const menuName = entry.menuName;
							// Skip
							if (toSkip.has(entryText) || toSkip.has(menuName)) {return;}
							if (toSkipStarts.some((title) => {return entryText.startsWith(title);}) || toSkipStarts.some((title) => {return menuName.startsWith(title);})) {return;}
							// Save
							if (!tree.hasOwnProperty(menuName)) {tree[menuName] = [];}
							tree[menuName].push({name: (menuName !==  mainMenu ? menuName + '\\' + entryText : entryText)});
							if (menuName !== mainMenu && entryText !== (menuName + '\\sep') && entry.flags === MF_GRAYED) {
								menuList.push({name: menuName + '\\sep'});
							}
							if (!new Set(menuList).has(menuName)) {menuList.push(menuName);}
							if (menuName === mainMenu && entryText === 'sep') {menuList.push({name: entryText});}
						});
						Object.keys(tree).forEach((menuKey) => {
							const idx = menuList.indexOf(menuKey);
							if (idx !== -1) {menuList = [...menuList.slice(0, idx), ...tree[menuKey], ...menuList.slice(idx + 1)];}
						});
						// Filter consecutive separators
						menuList = menuList.filter((item, idx, arr) => {return (item.name !== 'sep' && !item.name.endsWith('\\sep')) || (idx !== 0 && (arr[idx -1].name !== 'sep') && !arr[idx -1].name.endsWith('\\sep'));});
						const listExport = menuList;
						return _save(path + 'playlisttoolsentries.json', JSON.stringify(listExport, null, '\t'));
					}
					// Global scope
					var exportDSP = function exportDSP(path) {
						const listExport = JSON.parse(fb.GetDSPPresets()); // Reformat with tabs
						return _save(path + 'dsp.json', JSON.stringify(listExport, null, '\t'));
					}
					var exportDevices = function exportDevices(path) {
						const listExport = JSON.parse(fb.GetOutputDevices()); // Reformat with tabs
						return _save(path + 'devices.json', JSON.stringify(listExport, null, '\t'));
					}
					var exportComponents = function exportComponents(path) {
						const listExport = {
							foo_run_main: utils.CheckComponent('foo_run_main', true),
							foo_runcmd: utils.CheckComponent('foo_runcmd', true),
							foo_quicksearch: utils.CheckComponent('foo_quicksearch', true),
							foo_youtube: utils.CheckComponent('foo_youtube', true)
						};
						return _save(path + 'components.json', JSON.stringify(listExport, null, '\t'));
					}
					var executeByName = function executeByName(path) {
						const ajQueryFile = fb.ProfilePath + 'foo_httpcontrol_data\\ajquery-xxx\\smp\\toexecute.json';
						const localFile = folders.data + 'toexecute.json';
						const pls = getPlaylistIndexArray(plsListener);
						const plsData = pls.length === 1 && plman.PlaylistItemCount(pls[0]) !== 0 ? plman.GetPlaylistItems(pls[0]).Convert().map((handle) => {return {name: handle.Path.split('_').pop()};}) : null;
						if (plsData) {plman.RemovePlaylistSwitch(pls[0]);}
						const data = (_isFile(ajQueryFile) ? _jsonParseFileCheck(ajQueryFile, 'To execute json', scriptName, utf8) : (_isFile(localFile) ? _jsonParseFileCheck(localFile, 'To execute json', scriptName, utf8) : (plsData ? plsData : null)));
						if (data) {
							data.forEach((entry) => {
								const entryName = entry.hasOwnProperty('name') ? entry.name : '';
								if (entryName.length) {
									try {
										menu.btn_up(void(0), void(0), void(0), entryName);
									} catch (e) {console.log('executeByName: Error evaluating: ' + entryName + ' from menu.');}
								} else {console.log('executeByName: Entry has no name property: ' + entry);}
							});
						} else {console.log('executeByName: Error reading source file(s): ' + ajQueryFile);}
					};
					var setDSP = function setDSP(path) {
						const ajQueryFile = fb.ProfilePath + 'foo_httpcontrol_data\\ajquery-xxx\\smp\\toexecute.json';
						const localFile = folders.data + 'toexecute.json';
						const pls = getPlaylistIndexArray(plsListener);
						const plsData = pls.length === 1 && plman.PlaylistItemCount(pls[0]) === 1 ? plman.GetPlaylistItems(pls[0])[0].Path.split('_').pop() : null;
						if (plsData) {plman.RemovePlaylistSwitch(pls[0]);}
						const data = (_isFile(ajQueryFile) ? _jsonParseFileCheck(ajQueryFile, 'DSP json', scriptName, utf8) : (_isFile(localFile) ? _jsonParseFileCheck(localFile, 'DSP json', scriptName, utf8) : (plsData ? {name: plsData} : null)));
						if (data) {
							const entryName = data.hasOwnProperty('name') ? data.name : '';
							if (entryName.length) {
								const presets = JSON.parse(fb.GetDSPPresets());
								const idx = presets.findIndex((preset) => {return preset.name === entryName;});
								if (idx !== -1) {fb.SetDSPPreset(idx);}
								else {console.log('setDSP: Error setting dsp: ' + entryName);}
							} else {console.log('setDSP: Entry has no name property: ' + entry);}
						} else {console.log('setDSP: Error reading source file(s): ' + ajQueryFile);}
					};
					var setDevice = function setDevice(path) { 
						const ajQueryFile = fb.ProfilePath + 'foo_httpcontrol_data\\ajquery-xxx\\smp\\toexecute.json';
						const localFile = folders.data + 'toexecute.json';
						const pls = getPlaylistIndexArray(plsListener);
						const plsData = pls.length === 1 && plman.PlaylistItemCount(pls[0]) === 1 ? plman.GetPlaylistItems(pls[0])[0].Path.split('_').pop() : null;
						if (plsData) {plman.RemovePlaylistSwitch(pls[0]);}
						const data = (_isFile(ajQueryFile) ? _jsonParseFileCheck(ajQueryFile, 'Device json', scriptName, utf8) : (_isFile(localFile) ? _jsonParseFileCheck(localFile, 'Device json', scriptName, utf8) : (plsData ? {name: plsData, device_id: plsData} : null))); 
						if (data) {
							const entryName = data.hasOwnProperty('name') ? data.name : '';
							const entryId = data.hasOwnProperty('name') ? data.device_id : '';
							if (entryName.length) {
								const devices = JSON.parse(fb.GetOutputDevices());
								const idx = devices.findIndex((device) => {return device.name === entryName;});
								if (idx !== -1) {fb.SetOutputDevice(devices[idx].output_id, devices[idx].device_id);}
								else {console.log('setDevice: Error setting device: ' + entryName);}
							} else if (entryId.length) {
								const devices = JSON.parse(fb.GetOutputDevices());
								const idx = devices.findIndex((device) => {return device.device_id === entryId;});
								if (idx !== -1) {fb.SetOutputDevice(devices[idx].output_id, devices[idx].device_id);}
								else {console.log('setDevice: Error setting device: ' + entryId);}
							} else {console.log('setDevice: Entry has no name or device_id property: ' + entry);}
						} else {console.log('setDevice: Error reading source file(s): ' + ajQueryFile);}
					};
					// Start
					deferFunc.push({name, func: (properties) => {
						mainMenuSMP = JSON.parse(properties['mainMenuSMP'][1]);
						mainMenuSMP.forEach((entry, index) => {
							if (entry) {
								onMainMenuEntries[index + 1] = entry;
								if (entry.hasOwnProperty('path') && entry.path.length) {
									try {include(entry.path);}
									catch (e) {console.log(e);}
								}
							}
						});
						if (defaultArgs.bHttpControl()) {
							if (!exportMenus(defaultArgs.httpControlPath)) {console.log('Error saving SMP main menus for http Control integration.')}
							if (!exportEntries(defaultArgs.httpControlPath)) {console.log('Error saving Playlist Tools entries for http Control integration.')}
							if (!exportDSP(defaultArgs.httpControlPath)) {console.log('Error saving DSP entries for http Control integration.')}
							if (!exportDevices(defaultArgs.httpControlPath)) {console.log('Error saving Devices entries for http Control integration.')}
							if (!exportComponents(defaultArgs.httpControlPath)) {console.log('Error saving Components entries for http Control integration.')}
						}
					}});
					//  Menus
					menu.newEntry({menuName: subMenuName, entryText: 'Config SMP menus:', func: null, flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					menu.newCondEntry({entryText: name + ' (cond)', condFunc: () => {
						// Entry list
						mainMenuSMP = JSON.parse(menu_properties['mainMenuSMP'][1]);
						mainMenuSMP.forEach( (entry, index) => {
							if (!entry) {return;}
							// Add separators
							if (entry.hasOwnProperty('name') && entry.name === 'sep') {
								menu.newEntry({menuName: subMenuName, entryText: 'sep'});
							} else { 
								// Create names for all entries
								let scriptName = entry.name;
								scriptName = scriptName.length > 40 ? scriptName.substring(0,40) + ' ...' : scriptName;
								// Entries
								menu.newEntry({menuName: subMenuName, entryText: scriptName + '\t (' + (index + 1) + ')', func: null, flags: MF_GRAYED});
							}
						});
						if (!mainMenuSMP.filter(Boolean).length) {menu.newEntry({menuName: subMenuName, entryText: '(none set yet)', func: null, flags: MF_GRAYED});}
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						{
							const toolName = name;
							const subMenuNameTwo = menu.newMenu('Set menus...', subMenuName);
							const subMenuNameThree = [];
							const options = [
								{name: 'None', func: (idx) => {mainMenuSMP[idx - 1] = null; delete onMainMenuEntries[idx];}},
								{name: 'sep'},
								{name: 'Custom menu', func: (idx) => {
									let funcName = '';
									try {funcName = utils.InputBox(window.ID, 'Enter menu entry:\n(subMenu\\Entry)\n\nMenu names may be easily retrieved by simulating menu execution with Ctrl + L. Click, which copies entry names to clipboard.', 'Playlist Tools: ' + toolName, '', true);}
									catch (e) {return;}
									if (!funcName.length) {return;}
									let name = '';
									try {name = utils.InputBox(window.ID, 'Enter description (name)', 'Playlist Tools: ' + toolName, funcName, true);}
									catch (e) {return;}
									if (!name.length) {return;}
									let icon = '';
									// Add icons
									if (funcName.startsWith('Most played Tracks') || funcName.startsWith('Top rated Tracks from...')) {icon = 'ui-icon ui-icon-heart';}
									if (funcName.startsWith('Search same by tags...') || funcName.startsWith('Search similar by') || funcName.startsWith('Special Playlists...')) {icon = 'ui-icon ui-icon-link';}
									if (funcName.startsWith('Standard Queries...') || funcName.startsWith('Dynamic Queries...')) {icon = 'ui-icon ui-icon-search';}
									if (funcName.startsWith('Duplicates and tag filtering')) {icon = 'ui-icon ui-icon-trash';}
									if (funcName.startsWith('Query filtering')) {icon = 'ui-icon ui-icon-zoomout';}
									if (funcName.startsWith('Harmonic mix')) {icon = 'ui-icon ui-icon-person';}
									if (funcName.startsWith('Sort...') || funcName.startsWith('Advanced sort...') || funcName.startsWith('Scatter by tags')) {icon = 'ui-icon ui-icon-carat-2-n-s';}
									if (funcName.startsWith('Check tags')) {icon = 'ui-icon ui-icon-print';}
									if (funcName.startsWith('Write tags')) {icon = 'ui-icon ui-icon-pencil';}
									if (funcName.startsWith('Playlist Revive')) {icon = 'ui-icon ui-icon-battery-1';}
									if (funcName.startsWith('Pools')) {icon = 'ui-icon ui-icon-circle-zoomout';}
									if (funcName.startsWith('Macros')) {icon = 'ui-icon ui-icon-clock';}
									// Save
									onMainMenuEntries[idx] = mainMenuSMP[idx - 1] = {name, funcName , menuName: 'menu', icon};
								;}},
								{name: 'Custom function', func: (idx) => {
									let funcName = '';
									try {funcName = utils.InputBox(window.ID, 'Enter function name:\n', 'Playlist Tools: ' + toolName, '', true);}
									catch (e) {return;}
									if (!funcName.length) {return;}
									let path = '';
									try {path = utils.InputBox(window.ID, 'Enter script path', 'Playlist Tools: ' + toolName, funcName, true);}
									catch (e) {return;}
									if (!path.length) {return;}
									let name = '';
									try {name = utils.InputBox(window.ID, 'Enter description (name)', 'Playlist Tools: ' + toolName, funcName, true);}
									catch (e) {return;}
									if (!name.length) {return;}
									onMainMenuEntries[idx] = mainMenuSMP[idx - 1] = {name, funcName , path};
								;}},
								{name: 'sep'},
								{name: 'Add skip Tag at current playback', func: (idx) => {
									fb.ShowPopupMessage('Adds a \'SKIP\' tag using current playback. Meant to be used along Skip Track (foo_skip) component.\nHas an intelligent switch which sets behavior according to playback time:\n	- If time > half track length -> Track will play as usually up to the \'SKIP\' time, where it jumps to next track.\n	- If time < half track length -> Track will play from \'SKIP\' time to the end.\nThis is a workaround for using %PLAYBACK_TIME% for tagging, since %PLAYBACK_TIME% does not work within masstagger scripts.', scriptName + ': ' + name);
									onMainMenuEntries[idx] = mainMenuSMP[idx - 1] = {name: 'Add skip Tag at current playback', funcName: 'skipTagFromPlayback' , path: folders.xxx + 'main\\skip_tag_from_playback.js', icon: 'ui-icon ui-icon-tag'};
								}},
								{name: 'Execute menu entry by name', func: (idx) => {
									const ajQueryFile = fb.ProfilePath + 'foo_httpcontrol_data\\ajquery-xxx\\smp\\toexecute.json';
									const localFile = folders.data + 'toexecute.json';
									fb.ShowPopupMessage('This entry is meant to be used along online controllers, like ajquery-xxx, to be able to call an arbitrary number of tools by their menu names.\nThe entry name is read from a local json file which should be edited on demand by the server to set the menu entries that must be executed when calling this SMP main menu.\nTracked files can be found at:\n' + ajQueryFile + '\n' + localFile + ' (if previous one is not found)', scriptName + ': ' + name);
									onMainMenuEntries[idx] = mainMenuSMP[idx - 1] = {name: 'Execute menu entry by name', funcName: 'executeByName' , path: '', icon: 'ui-icon ui-icon-star'};
								}},
								{name: 'Set output device', func: (idx) => {
									const ajQueryFile = fb.ProfilePath + 'foo_httpcontrol_data\\ajquery-xxx\\smp\\toexecute.json';
									const localFile = folders.data + 'toexecute.json';
									fb.ShowPopupMessage('This entry is meant to be used along online controllers, like ajquery-xxx, to set ouput device by name.\nThe device name is read from a local json file which should be edited on demand by the server to set the desired device when calling this SMP main menu.\nTracked files can be found at:\n' + ajQueryFile + '\n' + localFile + ' (if previous one is not found)', scriptName + ': ' + name);
									onMainMenuEntries[idx] = mainMenuSMP[idx - 1] = {name: 'Set output device', funcName: 'setDevice' , path: '', icon: 'ui-icon ui-icon-volume-on'};
								}},
								{name: 'Set DSP preset', func: (idx) => {
									const ajQueryFile = fb.ProfilePath + 'foo_httpcontrol_data\\ajquery-xxx\\smp\\toexecute.json';
									const localFile = folders.data + 'toexecute.json';
									fb.ShowPopupMessage('This entry is meant to be used along online controllers, like ajquery-xxx, to set DSP entry by name.\nThe DSP name is read from a local json file which should be edited on demand by the server to set the desired DSP when calling this SMP main menu.\nTracked files can be found at:\n' + ajQueryFile + '\n' + localFile + ' (if previous one is not found)', scriptName + ': ' + name);
									onMainMenuEntries[idx] = mainMenuSMP[idx - 1] = {name: 'Set DSP preset', funcName: 'setDSP' , path: '', icon: 'ui-icon ui-icon-script'};
								}}
							];
							range(1, 9, 1).forEach((idx) => {
								subMenuNameThree.push(menu.newMenu('Menu ' + idx, subMenuNameTwo));
								options.forEach( (entry, index) => {
									const currMenu = subMenuNameThree[idx - 1];
									// Add separators
									if (entry.hasOwnProperty('name') && entry.name === 'sep') {
										menu.newEntry({menuName: currMenu, entryText: 'sep'});
									} else { 
										// Create names for all entries
										let scriptName = entry.name;
										scriptName = scriptName.length > 40 ? scriptName.substring(0,40) + ' ...' : scriptName;
										// Entries
										menu.newEntry({menuName: currMenu, entryText: scriptName, func: () => {
											entry.func(idx);
											menu_properties['mainMenuSMP'][1] = JSON.stringify(mainMenuSMP);
											overwriteMenuProperties(); // Updates panel
											if (!exportMenus(defaultArgs.httpControlPath)) {console.log('Error saving SMP main menus for http Control integration.')}
											if (!exportEntries(defaultArgs.httpControlPath)) {console.log('Error saving Playlist Tools entries for http Control integration.')}
										}});
									}
									menu.newCheckMenu(currMenu, options[0].name, options[options.length - 1].name,  () => {
										const currOption = mainMenuSMP[idx - 1];
										const id = currOption ? options.findIndex((item) => {return item.name === currOption.name}) : 0;
										return (id !== -1 ? (id !== 0 ? id - 2 : 0) : (currOption.hasOwnProperty('menuName') ? 1 : 2)); // Skip sep
									});
								});
							});
						}
						{	// Remove
							const subMenuSecondName = menu.newMenu('Remove entry from list...' + nextId('invisible', true, false), subMenuName);
							mainMenuSMP.forEach( (entry, index) => {
								if (!entry) {return;}
								const entryText = (entry.name === 'sep' ? '------(separator)------' : (entry.name.length > 40 ? entry.name.substring(0,40) + ' ...' : entry.name));
								menu.newEntry({menuName: subMenuSecondName, entryText: entryText  + '\t (' + (index + 1) + ')', func: () => {
									mainMenuSMP.splice(index, 1);
									delete onMainMenuEntries[index + 1];
									menu_properties['mainMenuSMP'][1] = JSON.stringify(mainMenuSMP);
									// Presets
									if (presets.hasOwnProperty('mainMenuSMP')) {
										presets.mainMenuSMP.splice(presets.mainMenuSMP.findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(entry);}), 1);
										if (!presets.mainMenuSMP.length) {delete presets.mainMenuSMP;}
										menu_properties['presets'][1] = JSON.stringify(presets);
									}
									overwriteMenuProperties(); // Updates panel
									if (!exportMenus(defaultArgs.httpControlPath)) {console.log('Error saving SMP main menus for http Control integration.')}
									if (!exportEntries(defaultArgs.httpControlPath)) {console.log('Error saving Playlist Tools entries for http Control integration.')}
								}});
							});
							if (!mainMenuSMP.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
							menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
							menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
								mainMenuSMP = [...mainMenuSMPDefaults];
								menu_properties['mainMenuSMP'][1] = JSON.stringify(mainMenuSMP);
								// Presets
								if (presets.hasOwnProperty('mainMenuSMP')) {
									delete presets.mainMenuSMP;
									menu_properties['presets'][1] = JSON.stringify(presets);
								}
								overwriteMenuProperties(); // Updates panel
								if (!exportMenus(defaultArgs.httpControlPath)) {console.log('Error saving SMP main menus for http Control integration.')}
								if (!exportEntries(defaultArgs.httpControlPath)) {console.log('Error saving Playlist Tools entries for http Control integration.')}
							}});
						}
					}});
				} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
			}
		}
		{	// Dynamic menus
			const name = 'SMP Dynamic menu';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\main_menu_dynamic.txt';
				const subMenuName = menu.newMenu(name, menuName);
				//  Menus
				const flags = isCompatible('1.6.1', 'smp') ? MF_STRING : MF_GRAYED;
				menu.newEntry({menuName: subMenuName, entryText: 'File\\Spider Monkey Panel\\Script commands:', flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'Enabled SMP dynamic menus', func: () => {
					menu_panelProperties.bDynamicMenus[1] = !menu_panelProperties.bDynamicMenus[1];
					overwritePanelProperties(); // Updates panel
					// Disable UI shortcuts if they can not be used
					if (!menu_panelProperties.bDynamicMenus[1] && menu_properties.bShortcuts[1]) {
						fb.ShowPopupMessage('Keyboard shortcuts are now disabled and not shown on the menu entries.', window.Name);
						menu_properties.bShortcuts[1] = false;
						overwriteMenuProperties(); // Updates panel
					}
					// And create / delete menus
					if (menu_panelProperties.bDynamicMenus[1]) {
						fb.ShowPopupMessage('Remember to set different panel names to every buttons toolbar, otherwise menus will not be properly associated to a single panel.\n\nShift + Win + R. Click -> Configure panel... (\'edit\' at top)', window.Name);
						createMainMenuDynamic(); 
					} else {deleteMainMenuDynamic();}
				}, flags});
				menu.newCheckMenu(subMenuName, 'Enabled SMP dynamic menus', void(0),  () => {return menu_panelProperties.bDynamicMenus[1];});
			}
		}
		{	// Playlist Names Commands
			const name = 'Playlist Names Commands';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\playlist_names_commands.txt';
				const subMenuName = menu.newMenu(name, menuName);
				//  Menus
				menu.newEntry({menuName: subMenuName, entryText: 'Switch event listener:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newEntry({menuName: subMenuName, entryText: 'Enabled Playlist Names Commands', func: () => {
					if (!menu_properties.bPlaylistNameCommands[1]) {
						if (_isFile(readmes[menuName + '\\' + name])) {
							const readme = _open(readmes[menuName + '\\' + name], utf8);
							if (readme.length) {
								const answer = WshShell.Popup(readme, 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
								if (answer !== popup.yes) {return;}
							}
						}
					}
					menu_properties.bPlaylistNameCommands[1] = !menu_properties.bPlaylistNameCommands[1];
					overwriteMenuProperties(); // Updates panel
				}});
				menu.newCheckMenu(subMenuName, 'Enabled Playlist Names Commands', void(0), () => {return menu_properties.bPlaylistNameCommands[1];}); 
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
		menu.newEntry({menuName, entryText: 'sep'});
		{	// Include scripts
			const name = 'Include scripts';
			if (!menusEnabled.hasOwnProperty(name) || menusEnabled[name] === true) {
				readmes[menuName + '\\' + name] = folders.xxx + 'helpers\\readme\\include_scripts.txt';
				const subMenuName = menu.newMenu(name, menuName);
				let scriptIncluded = [];
				let scriptIncludedDefaults = [];
				menu_properties['scriptIncluded'] = [menuName + '\\' + name + ' scripts', JSON.stringify(scriptIncluded)];
				menu_properties['scriptIncluded'].push({func: isJSON}, menu_properties['scriptIncluded'][1]);
				deferFunc.push({name, func: (properties) => {
					const scriptIncluded = JSON.parse(properties['scriptIncluded'][1]);
					scriptIncluded.forEach((scrObj) => {
						try {include(scrObj.path);}
						catch (e) {return;}
					});
				}});
				//  Menus
				menu.newEntry({menuName: subMenuName, entryText: 'Include headless scripts:', func: null, flags: MF_GRAYED});
				menu.newEntry({menuName: subMenuName, entryText: 'sep'});
				menu.newCondEntry({entryText: name + ' (cond)', condFunc: () => {
					// Entry list
					scriptIncluded = JSON.parse(menu_properties['scriptIncluded'][1]);
					scriptIncluded.forEach( (scrObj) => {
						// Add separators
						if (scrObj.hasOwnProperty('name') && scrObj.name === 'sep') {
							menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						} else { 
							// Create names for all entries
							let scriptName = scrObj.name;
							scriptName = scriptName.length > 40 ? scriptName.substring(0,40) + ' ...' : scriptName;
							// Entries
							menu.newEntry({menuName: subMenuName, entryText: scriptName, func: null, flags: MF_GRAYED});
						}
					});
					if (!scriptIncluded.length) {menu.newEntry({menuName: subMenuName, entryText: '(none set yet)', func: null, flags: MF_GRAYED});}
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					{	// Add / Remove
					menu.newEntry({menuName: subMenuName, entryText: 'Add new entry to list...' , func: () => {
						const answer = WshShell.Popup('This is an utility to easily include (\'merge\') multiple SMP scripts into the same panel, thus not wasting multiple panels. Useful for those scripts that don\'t require any UI, user interaction, etc.\n\nNote you must only include simple utility scripts without UI!. Like scripts which set the main menu SPM entries (File\\Spider Monkey Panel) and do nothing more.\n\nThe use of this functionality is done at your own responsibility, it may obviously break things if you use it without thinking.\n\nIn any case, you can later remove the included script at any point or disable the functionality altogether (just disable the associated menu). If the file fails while loading, it will probably crash and will not be added for later startups... so just reload panel and done.', 0, scriptName + ': ' + name, popup.question + popup.yes_no);
						if (answer === popup.no) {return;}
						// Input all variables
						let input;
						let path = '';
						try {path = utils.InputBox(window.ID, 'Enter script path:\nIts use is done at your own responsibility.', scriptName + ': ' + name, '', true);}
						catch (e) {return;}
						if (path === 'sep') {input = {name: path};} // Add separator
						else { // or new entry
							if (_isFile(path)) {
								try {include(path);}
								catch (e) {return;}
								const arr = utils.SplitFilePath(path);
								const name = (arr[1].endsWith(arr[2])) ? arr[1] : arr[1] + arr[2]; // <1.4.0 Bug: [directory, filename + filename_extension,
								input = {name , path};
							}
						}
						// Add entry
						scriptIncluded.push(input);
						// Save as property
						menu_properties['scriptIncluded'][1] = JSON.stringify(scriptIncluded); // And update property with new value
						// Presets
						if (!presets.hasOwnProperty('scriptIncluded')) {presets.scriptIncluded = [];}
						presets.scriptIncluded.push(input);
						menu_properties['presets'][1] = JSON.stringify(presets);
						overwriteMenuProperties(); // Updates panel
					}});
					{
						const subMenuSecondName = menu.newMenu('Remove entry from list...' + nextId('invisible', true, false), subMenuName);
						scriptIncluded.forEach( (queryObj, index) => {
							const entryText = (queryObj.name === 'sep' ? '------(separator)------' : (queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name));
							menu.newEntry({menuName: subMenuSecondName, entryText, func: () => {
								scriptIncluded.splice(index, 1);
								menu_properties['scriptIncluded'][1] = JSON.stringify(scriptIncluded);
								// Presets
								if (presets.hasOwnProperty('scriptIncluded')) {
									presets.scriptIncluded.splice(presets.scriptIncluded.findIndex((obj) => {return JSON.stringify(obj) === JSON.stringify(queryObj);}), 1);
									if (!presets.scriptIncluded.length) {delete presets.scriptIncluded;}
									menu_properties['presets'][1] = JSON.stringify(presets);
								}
								overwriteMenuProperties(); // Updates panel
							}});
						});
						if (!scriptIncluded.length) {menu.newEntry({menuName: subMenuSecondName, entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
						menu.newEntry({menuName: subMenuSecondName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuSecondName, entryText: 'Restore defaults', func: () => {
							scriptIncluded = [...scriptIncludedDefaults];
							menu_properties['scriptIncluded'][1] = JSON.stringify(scriptIncluded);
							// Presets
							if (presets.hasOwnProperty('scriptIncluded')) {
								delete presets.scriptIncluded;
								menu_properties['presets'][1] = JSON.stringify(presets);
							}
							overwriteMenuProperties(); // Updates panel
						}});
					}
				}
				}});
			} else {menuDisabled.push({menuName: name, subMenuFrom: menuName, index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
		}
	} else {menuDisabled.push({menuName: name, subMenuFrom:  menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}

// Configuration...
{
	if (!menusEnabled.hasOwnProperty(configMenu) || menusEnabled[configMenu] === true) {
		readmes[newReadmeSep()] = 'sep';
		readmes[configMenu + '\\Presets'] = folders.xxx + 'helpers\\readme\\playlist_tools_menu_presets.txt';
		// Create it if it was not already created. Contains entries from multiple scripts
		if (!menu.hasMenu(configMenu)) {
			menu.newMenu(configMenu);
		}
		{	// Menu to configure queries behavior
			const subMenuName = menu.newMenu('Queries and Dynamic queries', configMenu);
			{
				const subMenuNameTwo = menu.newMenu('Dynamic queries evaluation', subMenuName);
				{	// Menu to configure properties: dynQueryEvalSel
					menu.newEntry({menuName: subMenuNameTwo, entryText: 'Evaluate on entire selection:', func: null, flags: MF_GRAYED})
					menu.newEntry({menuName: subMenuNameTwo, entryText: 'sep'})
					menu.newCondEntry({entryText: 'dynQueryEvalSel', condFunc: () => {
						const options = JSON.parse(menu_properties.dynQueryEvalSel[1]);
						Object.keys(options).forEach((key) => {
							menu.newEntry({menuName: subMenuNameTwo, entryText: key, func: () => {
								fb.ShowPopupMessage('Controls wether dynamic queries are evaluated only on the focused item (single item) or the entire selection.\n\nWhen evaluated  on multiple selected tracks, a query evaluated on 3 items would look like this:\n\nTITLE IS #TITLE#\n(TITLE IS O Dromos To Gramma) OR (TITLE IS Gyal Bad) OR (TITLE IS Say Me)', scriptName + ': ' + configMenu);
								options[key] = !options[key];
								menu_properties.dynQueryEvalSel[1] = JSON.stringify(options);
								overwriteMenuProperties(); // Updates panelmenu_properties, menu_prefix, 0, false, true);
							}});
							menu.newCheckMenu(subMenuNameTwo, key, void(0), () => {return options[key];});
						});
					}});
				}
			}
			{
				const subMenuNameTwo = menu.newMenu('Global Forced Query', subMenuName);
				{	// Menu to configure properties: forcedQuery
					menu.newEntry({menuName: subMenuNameTwo, entryText: 'Switch forced query functionality:', func: null, flags: MF_GRAYED})
					menu.newEntry({menuName: subMenuNameTwo, entryText: 'sep'})
					menu.newCondEntry({entryText: 'forcedQueryMenusEnabled', condFunc: () => {
						forcedQueryMenusEnabled = {...forcedQueryMenusEnabled, ...JSON.parse(menu_properties.forcedQueryMenusEnabled[1])}; // Merge with properties
						menu_properties.forcedQueryMenusEnabled[1] = JSON.stringify(forcedQueryMenusEnabled);
						overwriteProp({forcedQueryMenusEnabled: menu_properties.forcedQueryMenusEnabled}, menu_prefix);
						Object.keys(forcedQueryMenusEnabled).forEach((key) => {
							menu.newEntry({menuName: subMenuNameTwo, entryText: key, func: () => {
								forcedQueryMenusEnabled[key] = !forcedQueryMenusEnabled[key];
								menu_properties.forcedQueryMenusEnabled[1] = JSON.stringify(forcedQueryMenusEnabled);
								overwriteMenuProperties(); // Updates panel
							}});
							menu.newCheckMenu(subMenuNameTwo, key, void(0), () => {return forcedQueryMenusEnabled[key];});
						});
						menu.newEntry({menuName: subMenuNameTwo, entryText: 'sep'})
						menu.newEntry({menuName: subMenuNameTwo, entryText: 'Set Global Forced Query...', func: () => {
							const input = utils.InputBox(window.ID, 'Enter global query added at playlist creation.\n', scriptName + ': ' + configMenu, menu_properties['forcedQuery'][1]);
							if (menu_properties['forcedQuery'][1] === input) {return;}
							try {fb.GetQueryItems(new FbMetadbHandleList(), input);} // Sanity check
							catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, scriptName); return;}
							defaultArgs.forcedQuery = input;
							menu_properties['forcedQuery'][1] = input;
							overwriteMenuProperties(); // Updates panel
						}});
						{ // Menu to configure properties: additional filters
							const subMenuNameThree = menu.newMenu('Additional pre-defined filters...', subMenuNameTwo);
							let options = [];
							const file = folders.xxx + 'presets\\Playlist Tools\\filters\\playlist_tools_filters.json';
							const bFile = _isFile(file);
							if (bFile) {
								options = _jsonParseFileCheck(file, 'Query filters json', 'Playlist Tools', utf8) || [];
							} else {
								options = [
									{title: 'Female vocals',			query: 'STYLE IS Female Vocal OR STYLE IS Female OR GENRE IS Female Vocal OR GENRE IS Female OR GENDER IS Female'}, 
									{title: 'Instrumentals',			query: 'STYLE IS Instrumental OR GENRE IS Instrumental OR SPEECHINESS EQUAL 0'},
									{title: 'Acoustic tracks',			query: 'STYLE IS Acoustic OR GENRE IS Acoustic OR ACOUSTICNESS GREATER 75'},
									{title: 'Rating > 2',				query: '%RATING% GREATER 2'},
									{title: 'Rating > 3',				query: '%RATING% GREATER 3'},
									{title: 'Length < 6 min',			query: '%LENGTH_SECONDS% LESS 360'},
									{title: 'Only Stereo',				query: '%CHANNELS% LESS 3 AND NOT COMMENT HAS Quad'},
									{title: 'sep'},		
									{title: 'No Female vocals',			query: 'NOT (STYLE IS Female Vocal OR STYLE IS Female OR GENRE IS Female Vocal OR GENRE IS Female OR GENDER IS Female)'}, 
									{title: 'No Instrumentals', 		query: 'NOT (STYLE IS Instrumental OR GENRE IS Instrumental OR SPEECHINESS EQUAL 0)'},
									{title: 'No Acoustic tracks',		query: 'NOT (STYLE IS Acoustic OR GENRE IS Acoustic OR ACOUSTICNESS GREATER 75)' },
									{title: 'Not rated',				query: '%RATING% MISSING'},
									{title: 'Not Live (unless Hi-Fi)',	query: 'NOT (STYLE IS Live AND NOT STYLE IS Hi-Fi)'}
								];
							}
							menu.newEntry({menuName: subMenuNameThree, entryText: 'Appended to Global Forced Query:', flags: MF_GRAYED});
							menu.newEntry({menuName: subMenuNameThree, entryText: 'sep', flags: MF_GRAYED});
							options.forEach((obj) => {
								if (obj.title === 'sep') {menu.newEntry({menuName: subMenuNameThree, entryText: 'sep', flags: MF_GRAYED}); return;}
								const entryText = obj.title;
								let input = menu_properties['forcedQuery'][1].length ? ' AND ' + _p(obj.query) : obj.query;
								menu.newEntry({menuName: subMenuNameThree, entryText, func: () => {
									if (menu_properties['forcedQuery'][1].indexOf(input) !== -1) {
										input = menu_properties['forcedQuery'][1].replace(input, ''); // Query
										input = input.slice(1, -1); // Remove parentheses
									} else {
										input = menu_properties['forcedQuery'][1].length ? _p(menu_properties['forcedQuery'][1]) + input : input;
									}
									try {fb.GetQueryItems(new FbMetadbHandleList(), input);} // Sanity check
									catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + input, 'Search by distance'); return;}
									menu_properties['forcedQuery'][1] = input;
									overwriteMenuProperties(); // Updates panel
								}});
								menu.newCheckMenu(subMenuNameThree, entryText, void(0), () => {return menu_properties['forcedQuery'][1].indexOf(input) !== -1;});
							});
							menu.newEntry({menuName: subMenuNameThree, entryText: 'sep', flags: MF_GRAYED});
							menu.newEntry({menuName: subMenuNameThree, entryText: 'Edit entries...' + (bFile ? '' : '\t(new file)'), func: () => {
								if (!bFile) {_save(file, JSON.stringify(options, null, '\t'));}
								_explorer(file);
							}});
						}
					}});
				}
			}
		}
		menu.newEntry({menuName: configMenu, entryText: 'sep'});
		{	// Menu to configure properties: playlistLength
			menu.newEntry({menuName: configMenu, entryText: () => 'Set Global Playlist Length...' + '\t[' + menu_properties['playlistLength'][1] + ']', func: () => {
				const input = Number(utils.InputBox(window.ID, 'Enter desired Playlist Length for playlist creation.\n', scriptName + ': ' + configMenu, menu_properties['playlistLength'][1]));
				if (menu_properties['playlistLength'][1] === input) {return;}
				if (!Number.isSafeInteger(input)) {return;}
				defaultArgs.playlistLength = input;
				menu_properties['playlistLength'][1] = input;
				overwriteMenuProperties(); // Updates panel
			}});
		}
		{	// Menu to configure properties: tags
			const subMenuName = menu.newMenu('Tag remapping...', configMenu);
			{
				const options = ['key', 'styleGenre'];
				menu.newEntry({menuName: subMenuName, entryText: 'Set the tags used by tools:', func: null, flags: MF_GRAYED})
				menu.newEntry({menuName: subMenuName, entryText: 'sep'})
				options.forEach((tagName) => {
					const key = tagName + 'Tag';
					menu.newEntry({menuName: subMenuName, entryText: () => capitalize(tagName) + '\t[' + menu_properties[key][1] + ']', func: () => {
						fb.ShowPopupMessage('Note this will NOT work on entries which apply queries like \'Search same by tags...\' since those queries are saved as text.\nIf you want to change tags at those tools, use the apropiate menus to remove/add your own entries.\nAlternatively, you may look at the properties panel to directly edit the menus and tags associated to queries.\n\nIt would not make any sense to remap tags at those places since the tags (and entries) are already configurable...', scriptName + ': ' + configMenu);
						const input = utils.InputBox(window.ID, 'Enter desired tag name:', scriptName + ': ' + configMenu, menu_properties[key][1]);
						if (!input.length) {return;}
						if (menu_properties[tagName + 'Tag'][1] === input) {return;}
						defaultArgs[key] = input;
						menu_properties[key][1] = input;
						overwriteMenuProperties(); // Updates panel
					}});
				});
			}
		}
		menu.newEntry({menuName: configMenu, entryText: 'sep'});
		{	// Async processing
			const subMenuName = menu.newMenu('Asynchronous processing', configMenu);
			menu.newEntry({menuName: subMenuName, entryText: 'Switch async functionality:', func: null, flags: MF_GRAYED})
			menu.newEntry({menuName: subMenuName, entryText: 'sep'})
 			{	// Enable
				readmes[configMenu + '\\Async processing'] = folders.xxx + 'helpers\\readme\\async_processing.txt';
				menu.newCondEntry({entryText: 'async', condFunc: () => {
					const async = JSON.parse(menu_properties.async[1]);
					const options = Object.keys(async);
					const notAvailable = ['Write tags', 'Pools', 'Search by distance', 'Remove duplicates', 'Import track list'];
					options.forEach((key) => {
						const bNotAvailable = notAvailable.indexOf(key) !== -1;
						menu.newEntry({menuName: subMenuName, entryText: key + (bNotAvailable ? '\t not available' : ''), func: () => {
							if (!async[key]) {
								const answer = WshShell.Popup('Enables asynchronous processing for the selected tool:\nUI will not be blocked while executing it, allowing to continue using Foobar2000 without interruptions, but as a side-effect it will also take more time to finish.\n\nFeature is only noticeable when processing a high number of tracks or computationally heavy tasks.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
								if (answer !== popup.yes) {return;}
							}
							async[key] = !async[key];
							menu_properties.async[1] = JSON.stringify(async);
							overwriteMenuProperties(); // Updates panel
						}, flags: bNotAvailable ? MF_GRAYED : MF_STRING});
						menu.newCheckMenu(subMenuName, key, void(0), () => {return async[key];});
					});
				}});
			}
		}
		menu.newEntry({menuName: configMenu, entryText: 'sep'});
		{	// Logging
			const subMenuName = menu.newMenu('Logging', configMenu);
			menu.newEntry({menuName: subMenuName, entryText: 'Switch logging functionality:', func: null, flags: MF_GRAYED})
			menu.newEntry({menuName: subMenuName, entryText: 'sep'})
			{	// bDebug
				menu.newEntry({menuName: subMenuName, entryText: 'Enabled extended console debug', func: () => {
					menu_panelProperties.bDebug[1] = !menu_panelProperties.bDebug[1];
					defaultArgs.bDebug = menu_panelProperties.bDebug[1];
					overwritePanelProperties(); // Updates panel
				}});
				menu.newCheckMenu(subMenuName, 'Enabled extended console debug', void(0), () => {return menu_panelProperties.bDebug[1];});
				// bProfile
				menu.newEntry({menuName: subMenuName, entryText: 'Enabled profiler console log', func: () => {
					menu_panelProperties.bProfile[1] = !menu_panelProperties.bProfile[1];
					defaultArgs.bProfile = menu_panelProperties.bProfile[1];
					overwritePanelProperties(); // Updates panel
				}});
				menu.newCheckMenu(subMenuName, 'Enabled profiler console log', void(0), () => {return menu_panelProperties.bProfile[1];});
			}
		}
		{	// UI
			const subMenuName = menu.newMenu('UI', configMenu);
			menu.newEntry({menuName: subMenuName, entryText: 'Switch UI functionality:', func: null, flags: MF_GRAYED})
			menu.newEntry({menuName: subMenuName, entryText: 'sep'})
			{	// bTooltipInfo
				menu.newEntry({menuName: subMenuName, entryText: 'Show mouse shortcuts on tooltip', func: () => {
					menu_panelProperties.bTooltipInfo[1] = !menu_panelProperties.bTooltipInfo[1];
					overwritePanelProperties(); // Updates panel
				}});
				menu.newCheckMenu(subMenuName, 'Show mouse shortcuts on tooltip', void(0), () => {return menu_panelProperties.bTooltipInfo[1];});
			}
			menu.newEntry({menuName: subMenuName, entryText: 'sep'})
			{	// Shortcuts
				readmes[configMenu + '\\Keyboard Shortcuts'] = folders.xxx + 'helpers\\readme\\keyboard_shortcuts.txt';
				menu.newEntry({menuName: subMenuName, entryText: 'Show keyboard shortcuts on entries', func: () => {
					if (!menu_properties.bShortcuts[1]) {
						const popupText = _open(readmes[configMenu + '\\Keyboard Shortcuts']);
						popupText && fb.ShowPopupMessage(popupText, scriptName);
					}
					menu_properties.bShortcuts[1] = !menu_properties.bShortcuts[1];
					overwriteMenuProperties(); // Updates panel
				}, flags: () => {return menu_panelProperties.bDynamicMenus[1] ? MF_STRING : MF_GRAYED;}});
				menu.newCheckMenu(subMenuName, 'Show keyboard shortcuts on entries', void(0), () => {return menu_panelProperties.bDynamicMenus[1]&& menu_properties.bShortcuts[1];});
				menu.newEntry({menuName: subMenuName, entryText: 'Open shortcuts file...', func: () => {_explorer(shortcutsPath);}});
			}
		}
		menu.newEntry({menuName: configMenu, entryText: 'sep'});
		{	// Import presets
			menu.newEntry({menuName: configMenu, entryText: 'Import user presets... ', func: () => {
				let file;
				try {file = utils.InputBox(window.ID, 'Do you want to import a presets file?\nWill not overwrite current ones.\n(input path to file)', scriptName + ': ' + configMenu, folders.data + 'playlistTools_presets.json', true);}
				catch (e) {return;}
				if (!file.length) {return;}
				const newPresets = _jsonParseFileCheck(file, 'Presets', scriptName, utf8);
				if (!newPresets) {return;}
				// Load description
				let readme = '';
				if (newPresets.hasOwnProperty('readme')) {
					readme = newPresets.readme;
					delete newPresets.readme;
				}
				// List entries
				const presetList = Object.keys(newPresets).map((key) => {return '+ ' + key + ' -> ' + menu_properties[key][0] + '\n\t- ' + newPresets[key].map((preset) => {return preset.name + (preset.hasOwnProperty('method') ? ' (' + preset.method + ')': '');}).join('\n\t- ');});
				readme += (readme.length ? '\n\n' : '') + 'List of presets:\n' + presetList;
				fb.ShowPopupMessage(readme, scriptName + ': Presets (' + file.split('\\').pop() + ')')
				// Accept?
				const answer = WshShell.Popup('Check the popup for description. Do you want to import it?', 0, scriptName + ': Presets (' + file.split('\\').pop() + ')', popup.question + popup.yes_no);
				if (answer === popup.no) {return;}
				// Import
				Object.keys(newPresets).forEach((key) => {
					// Merge with current presets
					let currentMenu = JSON.parse(menu_properties[key][1]);
					if (presets.hasOwnProperty(key)) {presets[key] = [...presets[key], ...newPresets[key]];} 
					else {presets[key] = newPresets[key];}
					currentMenu = currentMenu.concat(newPresets[key]);
					menu_properties[key][1] = JSON.stringify(currentMenu);
				});
				// Save all
				menu_properties['presets'][1] = JSON.stringify(presets);
				overwriteMenuProperties(); // Updates panel
			}});
		}
		{	// Export all presets
			menu.newEntry({menuName: configMenu, entryText: 'Export all user presets... ', func: () => {
				const answer = WshShell.Popup('This will export all user presets (but not the default ones) as a json file, which can be imported later in any Playlist Tools panel.\nThat file can be easily edited with a text editor to add, tune or remove entries. Presets can also be manually deleted in their associated menu.', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
				if (answer === popup.yes) {
					const path = folders.data + 'playlistTools_presets.json'
					_recycleFile(path);
					const readme = 'Backup ' + new Date().toString();
					if (_save(path, JSON.stringify({readme, ...presets}, null, '\t'))) {
						_explorer(path);
						console.log('Playlist tools: presets backup saved at ' + path);
					}
				}
			}});
		}
		menu.newEntry({menuName: configMenu, entryText: 'sep'});
		{	// Reset all config
			menu.newEntry({menuName: configMenu, entryText: 'Reset all configuration... ', func: () => {
				const path = folders.data + 'playlistTools_presets.json';
				const answer = WshShell.Popup('Are you sure you want to restore all configuration to default?\nWill delete any related property, user saved menus, etc..', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
				if (answer === popup.yes) {
					const answerPresets = WshShell.Popup('Do you want to maintain your own presets?\n(\'No\' will create a backup file in ' + path + ')', 0, scriptName + ': ' + configMenu, popup.question + popup.yes_no);
					let copy;
					if (answerPresets === popup.yes) {
						copy = {...presets};
					} else {
						_recycleFile(path);
						const readme = 'Backup ' + new Date().toString();
						if (_save(path, JSON.stringify({readme, ...presets}, null, '\t'))) {console.log('Playlist tools: presets backup saved at ' + path);}
						else {console.log('Playlist tools: failed to create backup of presets at ' + path);}
						presets = {};
					}
					// For the current instance
					for (let key in menu_properties) {
						menu_properties[key][1] = menu_propertiesBack[key][1];
					}
					overwriteMenuProperties(); // Updates panel
					// For the panel (only along buttons)
					if (typeof buttonsBar !== 'undefined' && Object.keys(menu_properties).length) {
						for (let key in menu_panelProperties) {
							menu_panelProperties[key][1] = menu_panelPropertiesBack[key][1];
						}
						menu_panelProperties.firstPopup[1] = true; // Don't show the popup again...
						overwritePanelProperties(); // Updates panel
					}
					loadProperties(); // Refresh
					// Restore presets
					if (answerPresets === popup.yes) {
						presets = copy;
						Object.keys(presets).forEach((key) => {
							// Add menus
							let currentMenu = JSON.parse(menu_properties[key][1]);
							currentMenu = currentMenu.concat(presets[key]);
							menu_properties[key][1] = JSON.stringify(currentMenu);
						});
						// Save all
						menu_properties['presets'][1] = JSON.stringify(presets);
						overwriteMenuProperties(); // Updates panel
					}
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
				const rgex = /sep\b|separator\b/gi;
				Object.entries(readmes).forEach(([key, value]) => { // Only show non empty files
					if (rgex.test(value)) {menu.newEntry({menuName: subMenuName, entryText: 'sep'}); return;}
					else if (_isFile(value)) { 
						const readme = _open(value, utf8); // Executed on script load
						const flags = iCount < 8 ? MF_STRING : iCount == 8 ? MF_MENUBREAK : (iCount - 8) % 10 ? MF_STRING : MF_MENUBREAK; // Span horizontally
						if (readme.length) {
							menu.newEntry({menuName: subMenuName, entryText: key, func: () => { // Executed on menu click
								if (_isFile(value)) {
									const readme = _open(value, utf8);
									if (readme.length) {fb.ShowPopupMessage(readme, key);}
								} else {console.log('Readme not found: ' + value);}
							}, flags});
							iCount++;
						}
					} else {console.log('Readme not found: ' + value);}
				});
				// Entry to open all readmes
				menu.newCondEntry({entryText: 'Readme test', condFunc: (bInit = true) => { // Runs the first time the menu is clicked
					if (bInit && menu_panelProperties.bDebug[1]) {
						menu.newEntry({menuName: subMenuName, entryText: 'sep'});
						menu.newEntry({menuName: subMenuName, entryText: 'Open all readmes', func: () => { // Executed on menu click
							Object.entries(readmes).forEach(([key, value]) => { // Only show non empty files
								if (rgex.test(value)) {return;}
								else if (_isFile(value)) {
									const readme = _open(value, utf8);
									if (readme.length) {fb.ShowPopupMessage(readme, key);}
								} else {console.log('Readme not found: ' + value);}
							});
						}});
					}
				}});
			} 
			if (!iCount) {menu.newEntry({menuName: subMenuName, entryText: '- no files - ', func: null, flags: MF_GRAYED});}
		}
	} else {menuDisabled.push({menuName: configMenu, subMenuFrom: menu.getMainMenuName(), index: menu.getMenus().filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);}).length + disabledCount++});}
}


/*
	Enable menu
*/
{
	const menuList = menu.getMenus().slice(1).filter((entry) => {return menuAltAllowed.has(entry.subMenuFrom);});
	menuDisabled.forEach((obj) => {obj.disabled = true;});
	menuDisabled.forEach((obj) => {menuList.splice(obj.index, 0, obj);});
	// Header
	menuAlt.newEntry({entryText: 'Switch menus functionality:', func: null, flags: MF_GRAYED});
	menuAlt.newEntry({entryText: 'sep'});
	// All entries
	menuAlt.newEntry({entryText: 'Restore all', func: () => {
		menuList.forEach( (menuEntry) => {
			const menuName = menuEntry.menuName
			menusEnabled[menuName] = true;
		});
		Object.keys(menusEnabled).forEach((key) => {menusEnabled[key] = true;});
		menu_panelProperties['menusEnabled'][1] = JSON.stringify(menusEnabled);
		overwritePanelProperties(); // Updates panel
		window.Reload();
	}});
	menuAlt.newEntry({entryText: 'sep'});
	// Individual entries
	let i = 0;
	let bLastSep = false;
	const menuListLength = menuList.length;
	const mainMenuName = menu.getMainMenuName();
	menuList.forEach( (menuEntry, idx) => {
		const menuName = menuEntry.menuName
		const entryName = menuEntry.subMenuFrom === mainMenuName ? menuName : '--- ' + menuName;
		const bDisabled = menuEntry.hasOwnProperty('disabled') && menuEntry.disabled;
		let flags = MF_STRING;
		let bSep = false;
		if (menuEntry.subMenuFrom === mainMenuName) {
			if (idx && i >= 16) {i = 0; flags = MF_MENUBARBREAK;}
			if (!bLastSep && i && menuList[idx + 1] && menuList[idx + 1].subMenuFrom !== mainMenuName) {bLastSep = true; menuAlt.newEntry({entryText: 'sep'});}
			else {bLastSep = false;}
			i++;
		} else {
			i++;
			if (!bLastSep && menuList[idx + 1] && menuList[idx + 1].subMenuFrom === mainMenuName && i < 16) {bLastSep = true; bSep = true;}
			else {bLastSep = false;}
		}
		if (!menusEnabled.hasOwnProperty(menuName)) {menusEnabled[menuName] = true;}
		menuAlt.newEntry({entryText: entryName, func: () => {
			menusEnabled[menuName] = !menusEnabled[menuName];
			menu_panelProperties['menusEnabled'][1] = JSON.stringify(menusEnabled);
			overwritePanelProperties(); // Updates panel
			window.Reload();
		}, flags});
		menuAlt.newCheckMenu(menuAlt.getMainMenuName(), entryName, void(0), () => {return menusEnabled[menuName];});
		if (bSep) {menuAlt.newEntry({entryText: 'sep'});}
	});
	menu_panelProperties['menusEnabled'][1] = JSON.stringify(menusEnabled);
}
/* 
	Properties after menu creation
*/ 
loadProperties();

/*
	Helpers
*/
function overwriteMenuProperties() {overwriteProp(menu_properties, menu_prefix);}
function overwritePanelProperties() {overwriteProp(menu_panelProperties, menu_prefix_panel);}
function overwriteProp(properties, prefix) {setProperties(properties, prefix, 0, false, true);}

function loadProperties() {
	if (typeof buttonsBar === 'undefined' && Object.keys(menu_properties).length) { // Merge all properties when not loaded along buttons
		// With const var creating new properties is needed, instead of reassigning using A = {...A,...B}
		if (Object.keys(menu_panelProperties).length) {
			Object.entries(menu_panelProperties).forEach(([key, value]) => {menu_properties[key] = value;});
		}
		setProperties(menu_properties, menu_prefix, 0);
		updateMenuProperties(getPropertiesPairs(menu_properties, menu_prefix, 0));
	} else { // With buttons, set these properties only once per panel
		if (Object.keys(menu_panelProperties).length) {
			setProperties(menu_panelProperties, menu_prefix_panel, 0);
		}
	}
}

function updateMenuProperties(propObject, menuFunc = deferFunc) {
	// Sanity checks
	propObject['playlistLength'][1] = Number(propObject['playlistLength'][1]);
	if (!Number.isSafeInteger(propObject['playlistLength'][1]) || propObject['playlistLength'][1] <= 0) {fb.ShowPopupMessage('Playlist length must be a positive integer.\n' + propObject['playlistLength'].slice(0,2), scriptName);}
	try {fb.GetQueryItems(new FbMetadbHandleList(), propObject['forcedQuery'][1]);}
	catch (e) {fb.ShowPopupMessage('Query not valid. Check it and add it again:\n' + propObject['forcedQuery'], scriptName);}
	// Info Popup
	let panelPropObject = (typeof buttonsBar !== 'undefined') ? getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0) : propObject;
	if (!panelPropObject['firstPopup'][1]) {
		panelPropObject['firstPopup'][1] = true;
		overwriteProperties(panelPropObject); // Updates panel
		const readmeKeys = ['Playlist Tools Menu', 'Macros', 'Tagging requisites']; // Must read files on first execution
		readmeKeys.forEach( (key) => {
			const readmePath = readmes[key];
			const readme = _open(readmePath, utf8);
			if (readme.length) {fb.ShowPopupMessage(readme, key);}
		});
	}
	// And update
	Object.entries(panelPropObject).forEach(([key, value]) => {
		if (defaultArgs.hasOwnProperty(key)) {defaultArgs[key] = value[1];}
	});
	Object.entries(propObject).forEach(([key, value]) => {
		if (defaultArgs.hasOwnProperty(key)) {defaultArgs[key] = value[1];}
		// if (menu_properties.hasOwnProperty(key)) {menu_properties[key] = value;}
		// if (menu_panelProperties.hasOwnProperty(key)) {menu_panelProperties[key] = value;}
			// Specific
		if (key === 'ratingLimits') {defaultArgs[key] = defaultArgs[key].split(',');}
		if (key === 'styleGenreTag') {defaultArgs[key] = JSON.parse(defaultArgs[key]);}
	});
	if (propObject.hasOwnProperty('sortInputDuplic') && propObject.hasOwnProperty('sortInputFilter') && propObject.hasOwnProperty('nAllowed')) {
		updateShortcutsNames({sortInputDuplic: propObject.sortInputDuplic[1], sortInputFilter: propObject.sortInputFilter[1], nAllowed: propObject.nAllowed[1]});
	}
	// Presets
	presets = JSON.parse(propObject['presets'][1]);
	// Backup defaults
	doOnce('Backup', () => {
		menu_propertiesBack = clone(menu_properties); 
		menu_panelPropertiesBack = clone(menu_panelProperties); 
		if (menu_panelProperties.bDebug[1]) {console.log('Playlist Tools: creating default settings...');}
	})();
	// Store for internal use
	if (menu_panelProperties.bDebug[1]) {console.log('Playlist Tools: updating settings...');}
	for (let key in propObject) {
		menu_properties[key][1] = propObject[key][1];
	}
	for (let key in panelPropObject) {
		menu_panelProperties[key][1] = panelPropObject[key][1];
	}
	// Other funcs by menus
	menuFunc.forEach((obj) => {
		if (obj.hasOwnProperty('func') && isFunction(obj.func)) {
			obj.func(propObject);
		}
	});
}

function updateShortcutsNames(keys = {}) {
	if (_isFile(shortcutsPath)) {
		const data = _jsonParseFileCheck(shortcutsPath, 'Shortcuts json', scriptName, utf8);
		if (data) {
			if (Object.keys(keys).length) {
				const sortInputDuplic = keys.hasOwnProperty('sortInputDuplic') ? keys.sortInputDuplic.replace(/,/g, ', ') : null;
				const sortInputFilter = keys.hasOwnProperty('sortInputFilter') ? keys.sortInputFilter.replace(/,/g, ', ') : null;
				const nAllowed = keys.hasOwnProperty('nAllowed') ? '(' + keys.nAllowed + ')' : null;
				for (const key in data) {
					if (data[key].menu === 'Duplicates and tag filtering\\Remove duplicates by ' && sortInputDuplic) {data[key].menu += sortInputDuplic;}
					if (data[key].menu === 'Duplicates and tag filtering\\Filter playlist by ' && sortInputFilter && nAllowed) {data[key].menu += sortInputFilter + ' ' + nAllowed;}
				}
			}
			shortcuts = data;
		}
	} else {
		_save(shortcutsPath, JSON.stringify(shortcuts, null, '\t'));
	}
}

/* 
	Flags
*/

function focusFlags() {return (fb.GetFocusItem(true) ? MF_STRING : MF_GRAYED);}

function playlistCountFlags(idx = plman.ActivePlaylist) {return (plman.PlaylistItemCount(idx) ? MF_STRING : MF_GRAYED);}
function playlistCountFlagsRem(idx = plman.ActivePlaylist) {return (plman.PlaylistItemCount(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED);}
function playlistCountFlagsAddRem(idx = plman.ActivePlaylist) {return (plman.PlaylistItemCount(idx) && !addLock(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED);}

function multipleSelectedFlags(idx = plman.ActivePlaylist) {return (plman.GetPlaylistSelectedItems(idx).Count >= 3 ? MF_STRING : MF_GRAYED);}
function multipleSelectedFlagsReorder(idx = plman.ActivePlaylist) {return (plman.GetPlaylistSelectedItems(idx).Count >= 3 && !reorderLock(idx) ? MF_STRING : MF_GRAYED);}

function selectedFlags(idx = plman.ActivePlaylist) {return (plman.GetPlaylistSelectedItems(idx).Count ? MF_STRING : MF_GRAYED);}
function selectedFlagsReorder(idx = plman.ActivePlaylist) {return (plman.GetPlaylistSelectedItems(idx).Count  && !reorderLock(idx) ? MF_STRING : MF_GRAYED);}
function selectedFlagsRem(idx = plman.ActivePlaylist) {return (plman.GetPlaylistSelectedItems(idx).Count && !removeLock(idx) ? MF_STRING : MF_GRAYED);}
function selectedFlagsAddRem(idx = plman.ActivePlaylist) {return (plman.GetPlaylistSelectedItems(idx).Count  && !addLock(idx) && !removeLock(idx) ? MF_STRING : MF_GRAYED);}

// plman.ActivePlaylist must be !== -1 to avoid crashes!
function reorderLock(idx = plman.ActivePlaylist) {return plman.GetPlaylistLockedActions(idx).indexOf('ReorderItems') !== -1;}
function addLock(idx = plman.ActivePlaylist) {return plman.GetPlaylistLockedActions(idx).indexOf('AddItems') !== -1;}
function removeLock(idx = plman.ActivePlaylist) {return plman.GetPlaylistLockedActions(idx).indexOf('RemoveItems') !== -1;}

/* 
	Tooltip
*/
// Show tooltip with current track info
function menuTooltip() {
	const selMul = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null;
	let infoMul = '';
	if (selMul && selMul.Count > 1) {
		infoMul = ' (multiple tracks selected: ' + selMul.Count + ')';
	}
	const sel = fb.GetFocusItem();
	let info = 'No track selected\nSome menus disabled';
	if (sel) {
		let tfo = fb.TitleFormat(
				'Current track:	%ARTIST% / %TRACK% - %TITLE%' +
				'$crlf()Date:		[%DATE%]' +
				'$crlf()Genres:		[%GENRE%]' +
				'$crlf()Styles:		[%STYLE%]' +
				'$crlf()Moods:		[%MOOD%]'
			);
		info = 'Playlist:		' + plman.GetPlaylistName(plman.ActivePlaylist) + infoMul + '\n';
		info += tfo.EvalWithMetadb(sel);
	}
	// Modifiers
	const bShift = utils.IsKeyPressed(VK_SHIFT);
	const bControl = utils.IsKeyPressed(VK_CONTROL);
	const bShiftNoControl = bShift && !bControl;
	const bNoShiftControl = !bShift && bControl;
	const bInfo = menu_panelProperties.bTooltipInfo[1];
	if (bShiftNoControl || bNoShiftControl || bInfo) {info += '\n-----------------------------------------------------';}
	if (bInfo) {info += '\n(L. Click for tools menu)';}
	if (bNoShiftControl || bInfo) {info += '\n(Ctrl + L. Click to copy menu names to clipboard)';}
	if (bShiftNoControl || bInfo) {info += '\n(Shift + L. Click to switch enabled menus)';}
	return info;
}

/* 
	Debug
*/

menu.newCondEntry({entryText: 'Macros test', condFunc: (bInit = true) => { // Runs the first time the menu is clicked
	if (bInit && menu_panelProperties.bDebug[1]) {
		const mainMenu = menu.getMainMenuName();
		const tree = {};
		let menuList = [];
		const toSkip = new Set(['By... (pairs of tags)', 'By... (query)', 'Filter playlist by... (query)', 'Filter playlist by... (tags)', 'By... (tags)', 'sep']);
		const toSkipMenuMatch = new Set(['Configuration']);
		const toInclude = new Set(['Most played Tracks', 'Top rated Tracks from...', 'Select...','Expand...', 'Next', 'Search same by tags...','Dynamic Queries...', 'Search similar by Graph...', 'Search similar by DynGenre...', 'Search similar by Weight...', 'Special Playlists...', 'Duplicates and tag filtering', 'Harmonic mix', 'Advanced sort...', 'Scatter by tags','Pools'].map((entry) => {return entry.toLowerCase();}));
		menu.getEntries().filter((entry) => {return entry.hasOwnProperty('entryText') && entry.hasOwnProperty('menuName');}).forEach((entry) => {
			const entryText = isFunction(entry.entryText) ? entry.entryText() : entry.entryText;
			const menuName = entry.menuName;
			const flag = entry.flags;
			// Skip
			if (!toInclude.has(menuName.toLowerCase())) {return;}
			if (entryText === 'sep') {return;}
			if (flag === MF_GRAYED) {return;}
			if (toSkip.has(entryText) || toSkip.has(menuName)) {return;}
			if (entryText.endsWith('...')) {return;}
			// Save
			if (!tree.hasOwnProperty(menuName)) {tree[menuName] = [];}
			tree[menuName].push((menuName !==  mainMenu ? menuName + '\\' + entryText : entryText));
			if (!new Set(menuList).has(menuName)) {menuList.push(menuName);};
			if (menuName === mainMenu && entryText === 'sep') {menuList.push(entryText);};
		});
		Object.keys(tree).forEach((menuKey) => {
			const idx = menuList.indexOf(menuKey);
			if (idx !== -1) {menuList = [...menuList.slice(0, idx), ...tree[menuKey], ...menuList.slice(idx + 1)];}
		});	
		const newMacro = {name: 'Test Tools (generated)', entry: [...menuList], bAsync: false};
		let menuName = 'Macros';
		menu.newEntry({menuName, entryText: 'sep'});
		menu.newEntry({menuName, entryText: newMacro.name + (newMacro.bAsync ? '\t(async)' : ''), func: () => {
			newMacro.entry.forEach( (entry, idx, arr) => {
				menu.btn_up(void(0), void(0), void(0), entry, void(0), void(0), void(0), {pos: 1, args: newMacro.bAsync}); // Don't clear menu on last call
			});
		}});
	}
}});

/* 
	Dynamic menus
*/
function createMainMenuDynamic({file = fb.ProfilePath + 'foo_httpcontrol_data\\ajquery-xxx\\smp\\playlisttoolsentriescmd.json'} = {}) {
	deleteMainMenuDynamic();
	if (!menu_panelProperties.bDynamicMenus[1]) {return false;}
	const bToFile = file && file.length;
	try {
		if (menu_panelProperties.bDebug[1]) {console.log('Playlist Tools: registering dynamic menus...');}
		const data = bToFile ? _jsonParseFile(file, utf8) || {} : {};
		// List menus
		const mainMenu = menu.getMainMenuName();
		const tree = {};
		const dynamicTree = {};
		let menuList = [];
		let dynamicMenuList = [];
		const toSkip = new Set(['Add new entry to list...', 'Remove entry from list...', 'Add new query to list...', 'Remove query from list...', 'Configuration', 'Menu 1', 'Menu 2', 'Menu 3', 'Menu 4', 'Menu 5', 'Menu 6', 'Menu 7', 'Menu 8', 'Menu 9', 'Find track(s) in...', 'Check tags', 'Write tags', 'Playlist History', 'Custom pool...', 'Start recording a macro', 'Stop recording and Save macro', 'Playlist Names Commands', 'Include scripts', 'Search by Distance','Set Global Forced Query...', 'Readmes...', 'SMP Main menu', 'Script integration', 'Split playlist list submenus at...', 'Show locked playlist (autoplaylists, etc.)?', 'Show current playlist?', 'Selection manipulation', 'Close playlist...', 'Go to playlist...', 'Send playlist\'s tracks to...', 'Remove track(s) from...', 'Find now playing track in...','Other tools', 'Configure dictionary...', 'By halves', 'By quarters', 'By thirds' , 'Send selection to...', 'Don\'t try to find tracks if selecting more than...', 'Set tags (for duplicates)...', 'Set tags (for filtering)...', 'Set number allowed (for filtering)...', 'Sets similarity threshold...', 'UI', 'Logging', 'Asynchronous processing', 'Tag remapping...','SMP Dynamic menu','Report all from...','Check only...','Difference with playlist...','Intersect with playlist...','Merge with playlist...','Tags...', 'Available tools','Enable double pass to match more tracks','Available tools...','Harmonic mixing','Dynamic queries evaluation','Global Forced Query','Configure filters...']);
		const toSkipStarts = ['(Send sel. to)', 'Remove entry from list...', '(Close) Playlists', '(Go to) Playlists', '(Send all to) Playlists', 'Global pls. length'];
		const toSkipExport = new Set(['By... (pairs of tags)', 'By... (query)', 'Filter playlist by... (query)', 'Filter playlist by... (tags)', 'From year...', 'From last...','By... (tags)','By... (expression)','Find or create playlist...','To specified position','Select next tracks...']);
		const toSkipDynamic = new Set([]);
		allEntries.filter((entry) => {return entry.hasOwnProperty('entryText') && entry.hasOwnProperty('menuName');}).forEach((entry) => {
			const entryText = (isFunction(entry.entryText) ? entry.entryText() : entry.entryText).replace(/\t.*/g,'');
			const menuName = entry.menuName;
			// Skip
			if (toSkip.has(entryText) || toSkip.has(menuName)) {return;}
			if (toSkipStarts.some((title) => {return entryText.startsWith(title);}) || toSkipStarts.some((title) => {return menuName.startsWith(title);})) {return;}
			// Save
			if (!toSkipExport.has(entryText) && !toSkipExport.has(menuName)) {
				if (!tree.hasOwnProperty(menuName)) {tree[menuName] = [];}
				tree[menuName].push({name: (menuName !==  mainMenu ? menuName + '\\' + entryText : entryText)});
				if (menuName !== mainMenu && entryText !== (menuName + '\\sep') && entry.flags === MF_GRAYED) {
					menuList.push({name: menuName + '\\sep'});
				}
				if (!new Set(menuList).has(menuName)) {menuList.push(menuName);}
				if (menuName === mainMenu && entryText === 'sep') {menuList.push({name: entryText});}
			}
			if (!toSkipDynamic.has(entryText) && !toSkipDynamic.has(menuName)) {
				if (!dynamicTree.hasOwnProperty(menuName)) {dynamicTree[menuName] = [];}
				if (entry.flags !== MF_GRAYED && entryText !== 'sep') {
					dynamicTree[menuName].push({name: (menuName !==  mainMenu ? menuName + '\\' + entryText : entryText)});
					if (!new Set(dynamicMenuList).has(menuName)) {dynamicMenuList.push(menuName);}
				}
			}
		});
		Object.keys(tree).forEach((menuKey) => {
			const idx = menuList.indexOf(menuKey);
			if (idx !== -1) {menuList = [...menuList.slice(0, idx), ...tree[menuKey], ...menuList.slice(idx + 1)];}
		});
		Object.keys(dynamicTree).forEach((menuKey) => {
			const idx = dynamicMenuList.indexOf(menuKey);
			if (idx !== -1) {dynamicMenuList = [...dynamicMenuList.slice(0, idx), ...dynamicTree[menuKey], ...dynamicMenuList.slice(idx + 1)];}
		});
		// Filter consecutive separators
		menuList = menuList.filter((item, idx, arr) => {return (item.name !== 'sep' && !item.name.endsWith('\\sep')) || (idx !== 0 && (arr[idx -1].name !== 'sep') && !arr[idx -1].name.endsWith('\\sep'));});
		// Create dynamic menus
		dynamicMenuList.forEach((menu, i) => {
			fb.RegisterMainMenuCommand(i, menu.name, menu.name);
			onMainMenuDynamicEntries.push(menu);
		});
		// Add to list
		data[window.Name] = menuList;
		// Don try to export for ajquery-xxx integration when it isn't installed
		if (bToFile && file.indexOf('ajquery-xxx') !== -1 && !_isFolder(file.split('\\').slice(0, -1).join('\\'))) {return true;}
		return (bToFile ? _save(file, JSON.stringify(data, null, '\t')) : true);
	} catch (e) {console.log('createMainMenuDynamic: unknown error'); console.log(e.message);}
	return false;
}
// Run once at startup
deferFunc.push({name: 'createMainMenuDynamic', func: () => {
	if (menu_panelProperties.bDynamicMenus[1]) {createMainMenuDynamic();}
}});

/* 
	Shortcuts
*/
menu.newCondEntry({entryText: 'Shortcuts addition', condFunc: () => {
	if (menu_properties.bShortcuts[1]) {
		const entryList = menu.getEntries();
		Object.keys(shortcuts).forEach((key) => {
			const shortcut = shortcuts[key];
			if (!shortcut.hasOwnProperty('keys')) {return;}
			const idx = entryList.findIndex((entry) => {
				if (entry.entryText) {
					if (isFunction(entry.entryText)) {
						if (entry.entryText().indexOf(shortcut.keys) !== -1) {return false;}
						if (isFunction(entry.menuName)) {
							return (entry.menuName() + '\\' + entry.entryText()).indexOf(shortcut.menu) !== -1;
						} else {
							return (entry.menuName + '\\' + entry.entryText()).indexOf(shortcut.menu) !== -1;
						}
					} else {
						if (entry.entryText.indexOf(shortcut.keys) !== -1) {return false;}
						if (isFunction(entry.menuName)) {
							return (entry.menuName() + '\\' + entry.entryText).indexOf(shortcut.menu) !== -1;
						} else {
							return (entry.menuName + '\\' + entry.entryText).indexOf(shortcut.menu) !== -1;
						}
					}
				}
			});
			if (idx !== -1) {
				if (isFunction(entryList[idx].entryText)) {
					const copyFunc = entryList[idx].entryText;
					entryList[idx].entryText = () => {return copyFunc() + '\t' + shortcut.keys;}
				} else {
					entryList[idx].entryText += '\t' + shortcut.keys;
				}
			}
		});
		menu.entryArr = entryList;
		menu.entryArrTemp = entryList;
	}
}});