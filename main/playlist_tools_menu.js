'use strict';
//16/10/22

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
	forcedQuery:				['Global forced query', globQuery.filter],
	forcedQueryMenusEnabled:	['Menus with forced query enabled', '{}'],
	ratingLimits:				['Set ratings extremes (ex. from 1 to 10 -> 1,10)', '1,5'],
	presets:					['Saved presets', '{}'],
	bShortcuts:					['Show keyboard shorcuts on entries?', true],
	bPlaylistNameCommands:		['Enable playlist name commands', false],
	keyTag:						['Key tag remap', globTags.key], // It may be overwritten by Search by distance property too, are equivalent!
	styleGenreTag:				['Style/Genre tags for Dyngenre translation', JSON.stringify(['$ascii(%' + globTags.genre + '%)', '$ascii(%' + globTags.style + '%)'])],
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
		if (folders.ajqueryCheck() && !exportDevices(folders.ajquerySMP)) {console.log('Error saving Devices entries for http Control integration.')}
	}
});

addEventListener('on_dsp_preset_changed', () => {
	if (typeof exportDSP !== 'undefined') {
		if (folders.ajqueryCheck() && !exportDSP(folders.ajquerySMP)) {console.log('Error saving DSP entries for http Control integration.')}
	}
});

/* 
	Menus
*/
// Most played tracks from year
// Top rated Tracks from year
include('playlist_tools_menu_most_year.js');

// Same by...
include('playlist_tools_menu_same_by.js');

// Standard Queries...
include('playlist_tools_menu_std_queries.js');

// Dynamic queries...
include('playlist_tools_menu_dyn_queries.js');

// Similar by...Graph\Dyngenre\Weight
include('playlist_tools_menu_similar_by.js');

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
include('playlist_tools_menu_pls_manipulation.js');

// Selection manipulation...
include('playlist_tools_menu_sel_manipulation.js');

// Other tools
include('playlist_tools_menu_other_tools.js');

// Pools
include('playlist_tools_menu_pools.js');

// Macros
include('playlist_tools_menu_macros.js');

// Script integration
include('playlist_tools_menu_script_integration.js');

// Configuration...
include('playlist_tools_menu_configuration.js');

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
function overwriteMenuProperties() {overwriteProp(menu_properties, menu_prefix); overwriteDefaultArgs();}
function overwritePanelProperties() {overwriteProp(menu_panelProperties, menu_prefix_panel); overwriteDefaultArgs();}
function overwriteProp(properties, prefix) {setProperties(properties, prefix, 0, false, true);}
function overwriteDefaultArgs() {
	for (let key in defaultArgs) {
		if (menu_properties.hasOwnProperty(key)) {
			if (key === 'styleGenreTag') {defaultArgs[key] = JSON.parse(menu_properties[key][1]);}
			else {defaultArgs[key] = menu_properties[key][1];}
		} else if (menu_panelProperties.hasOwnProperty(key)) {
			defaultArgs[key] = menu_panelProperties[key][1];
		}
	}
}

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
	doOnce('Load tags cache', debounce(() => {
		if (menu_properties.bTagsCache[1] && typeof tagsCache !== 'undefined') {tagsCache.load();}
	}, 5000))();
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
				'$crlf()Date:		[' + globTags.date + ']' +
				'$crlf()Genres:		[%' + globTags.genre + '%]' +
				'$crlf()Styles:		[%' + globTags.style + '%]' +
				'$crlf()Moods:		[%' + globTags.mood + '%]'
			);
		info = 'Playlist:		' + (plman.ActivePlaylist !== -1 ? plman.GetPlaylistName(plman.ActivePlaylist) : '-none-') + infoMul + '\n';
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
function createMainMenuDynamic() {
	deleteMainMenuDynamic();
	if (!menu_panelProperties.bDynamicMenus[1]) {return false;}
	try {
		if (menu_panelProperties.bDebug[1]) {console.log('Playlist Tools: registering dynamic menus...');}
		// List menus
		const mainMenu = menu.getMainMenuName();
		const tree = {};
		const dynamicTree = {};
		let menuList = [];
		let dynamicMenuList = [];
		mainMenuSMP.forEach((entry) => {
			if (entry) {
				dynamicMenuList.push({...entry, onMainMenuEntries: true});
				if (entry.hasOwnProperty('path') && entry.path.length) {
					try {include(entry.path);}
					catch (e) {console.log(e);}
				}
			}
		});
		const toSkip = new Set(['Add new entry to list...', 'Remove entry from list...', 'Add new query to list...', 'Remove query from list...', 'Configuration', 'Find track(s) in...', 'Check tags', 'Write tags', 'Playlist History', 'Custom pool...', 'Start recording a macro', 'Stop recording and Save macro', 'Playlist Names Commands', 'Include scripts', 'Search by Distance','Set Global Forced Query...', 'Readmes...', 'SMP Main menu', 'Script integration', 'Split playlist list submenus at...', 'Show locked playlist (autoplaylists, etc.)?', 'Show current playlist?', 'Selection manipulation', 'Close playlist...', 'Go to playlist...', 'Send playlist\'s tracks to...', 'Remove track(s) from...', 'Find now playing track in...','Other tools', 'Configure dictionary...', 'By halves', 'By quarters', 'By thirds' , 'Send selection to...', 'Don\'t try to find tracks if selecting more than...', 'Set tags (for duplicates)...', 'Set tags (for filtering)...', 'Set number allowed (for filtering)...', 'Sets similarity threshold...', 'UI', 'Logging', 'Asynchronous processing','SMP Dynamic menu','Report all from...','Check only...','Difference with playlist...','Intersect with playlist...','Merge with playlist...','Tags...', 'Available tools','Enable double pass to match more tracks','Available tools...','Harmonic mixing','Dynamic queries evaluation','Global Forced Query','Configure filters...','Additional pre-defined filters...','Set menus...']);
		const toSkipStarts = ['(Send sel. to)', 'Remove entry from list...', '(Close) Playlists', '(Go to) Playlists', '(Send all to) Playlists', 'Global pls. length','Tag remapping...','Search by Distance...','(Merge with)', '(Difference with)', '(Intersect with)'];
		const toRegEx = [/(Switch lock playlist\.\.\.\\)(?!Active playlist$)/, /(Lock playlist\.\.\.\\)(?!Active playlist$)/, /(Unlock playlist\.\.\.\\)(?!Active playlist$)/];
		const toSkipExport = new Set(['By... (pairs of tags)', 'By... (query)', 'Filter playlist by... (query)', 'Filter playlist by... (tags)', 'From year...', 'From last...','By... (tags)','By... (expression)','Find or create playlist...','To specified position','Select next tracks...']);
		const toSkipDynamic = new Set([]);
		allEntries.filter((entry) => {return entry.hasOwnProperty('entryText') && entry.hasOwnProperty('menuName');}).forEach((entry) => {
			const entryText = (isFunction(entry.entryText) ? entry.entryText() : entry.entryText).replace(/\t.*/g,'');
			const menuName = entry.menuName;
			// Skip
			if (toSkip.has(entryText) || toSkip.has(menuName)) {return;}
			if (toSkipStarts.some((title) => {return entryText.startsWith(title);}) || toSkipStarts.some((title) => {return menuName.startsWith(title);})) {return;}
			if (toRegEx.some((regex) => {return (regex.test(menuName + '\\' + entryText));})) {return;}
			// Save
			if (!toSkipExport.has(entryText) && !toSkipExport.has(menuName)) {
				if (!tree.hasOwnProperty(menuName)) {tree[menuName] = [];}
				tree[menuName].push({name: (menuName !==  mainMenu ? menuName + '\\' + entryText : entryText), flags: isFinite(entry.flags) ? entry.flags : 0});
				if (menuName !== mainMenu && entryText !== (menuName + '\\sep') && entry.flags === MF_GRAYED) {
					menuList.push({name: menuName + '\\sep', flags: 1});
				}
				if (!new Set(menuList).has(menuName)) {menuList.push(menuName);}
				if (menuName === mainMenu && entryText === 'sep') {menuList.push({name: entryText, flags: 1});}
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
		// Export if needed
		return exportMainMenuDynamic({menuList});
	} catch (e) {console.log('createMainMenuDynamic: unknown error'); console.log(e.message);}
	return false;
}
function exportMainMenuDynamic({file = folders.ajquerySMP + 'playlisttoolsentriescmd.json', menuList = []} = {}) {
	let bReturn = false;
	try {
		const bToFile = file && file.length;
		const data = bToFile ? _jsonParseFile(file, utf8) || {} : {};
		data[window.Name] = menuList;
		if (bToFile && file.indexOf('ajquery-xxx') !== -1 && !folders.ajqueryCheck()) {return true;}
		bReturn = bToFile ? _save(file, JSON.stringify(data, null, '\t')) : true;
	} catch (e) {console.log('exportMainMenuDynamic: unknown error'); console.log(e.message);}
	return bReturn;
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