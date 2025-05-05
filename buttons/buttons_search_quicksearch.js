'use strict';
//07/04/25

/*
	Quicksearch for same....
	Search tracks on library matching X tag
	Expands [foo_quicksearch](https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Components/Quicksearch_UI_Element_%28foo_quicksearch%29#Context_menu) contextual menus functionality, and works with multiple selection
 */

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, globQuery:readable, globTags:readable, MF_STRING:readable, MF_GRAYED:readable, VK_CONTROL:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable  */
include('..\\helpers\\menu_xxx_extras.js');
/* global _createSubMenuEditEntries:readable  */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isString:readable, isStringWeak:readable, isJSON:readable, _qCond:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\main\\filter_and_query\\dynamic_query.js');
/* global dynamicQueryProcess:readable, dynamicQuery:readable */
include('..\\main\\main_menu\\main_menu_custom.js');
/* global bindDynamicMenus:readable, deleteMainMenuDynamic:readable */

var prefix = 'qs'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Quicksearch button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) {  /* May be loaded along other buttons */ } // eslint-disable-line no-unused-vars
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	bEvalSel: ['Evaluate multiple tracks', true, { func: isBoolean }, true],
	lastQuery: ['Last query used', '', { func: isStringWeak }, ''],
	playlistName: ['Playlist name', 'Search...', { func: isString }, 'Search...'],
	bDynamicMenus: ['Menus at  \'File\\Spider Monkey Panel\\...\'', false, { func: isBoolean }, false],
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false],
	entries: ['Quicksearch entries', JSON.stringify([
		{
			name: 'Same Date',
			query: _qCond(globTags.date) + ' IS #' + globTags.date + '#'
		},
		{
			name: 'Same Album',
			query: 'ALBUM IS #ALBUM#'
		},
		{
			name: 'Same Genre(s)',
			query: globTags.genre + ' IS #' + globTags.genre + '#'
		},
		{
			name: 'Same Style(s)',
			query: globTags.style + ' IS #' + globTags.style + '#'
		},
		{ name: 'sep' },
		{
			name: 'Same Genre(s) and Key',
			query: globTags.genre + ' IS #' + globTags.genre + '# AND ' + globTags.key + ' IS #' + globTags.key + '#'
		},
		{
			name: 'Same Genre(s) and next Key',
			query: globTags.genre + ' IS #' + globTags.genre + '# AND ' + globTags.key + ' IS #NEXTKEY#'
		},
		{
			name: 'Same Genre(s) and prev Key',
			query: globTags.genre + ' IS #' + globTags.genre + '# AND ' + globTags.key + ' IS #PREVKEY#'
		},
		{
			name: 'Same Style(s) and Key',
			query: globTags.style + ' IS #' + globTags.style + '# AND ' + globTags.key + ' IS #' + globTags.key + '#'
		},
		{
			name: 'Same Style(s) and next Key',
			query: globTags.style + ' IS #' + globTags.style + '# AND ' + globTags.key + ' IS #NEXTKEY#'
		},
		{
			name: 'Same Style(s) and prev Key',
			query: globTags.style + ' IS #' + globTags.style + '# AND ' + globTags.key + ' IS #PREVKEY#'
		},
		{ name: 'sep' },
		{
			name: 'Same Title',
			query: globQuery.compareTitle
		},
		{
			name: 'Same Artist(s)',
			query: globTags.artist + ' IS #' + globTags.artistRaw + '#'
		},
		{
			name: 'Same Title and Artist(s)',
			query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artistRaw + '#)'
		},
		{
			name: 'Same Title, Artist(s) & Date',
			query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artistRaw + '#) AND (' + _qCond(globTags.date) + ' IS #' + globTags.date + '#)'
		}
	]), { func: isJSON }],
	sortTF: ['Sorting TF expression', globTags.artist + '|%ALBUM%|%TRACK%', { func: isStringWeak }, globTags.artist + '|%ALBUM%|%TRACK%'],
	bOmitSortPls: ['Omit sorting on playlist sources', true, { func: isBoolean }, true],
};
newButtonsProperties.entries.push(newButtonsProperties.entries[1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Quicksearch': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Quicksearch', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'Quicksearch',
		func: function (mask) {
			if (mask === MK_SHIFT) {
				const menu = settingsMenu(
					this, true, ['buttons_search_quicksearch.js'],
					{
						lastQuery: { bHide: true },
						bDynamicMenus:
							{ popup: 'Remember to set different panel names to every buttons toolbar, otherwise menus will not be properly associated to a single panel.\n\nShift + Win + R. Click -> Configure panel... (\'edit\' at top)' },
						entries: { bHide: true }
					},
					{
						bDynamicMenus:
							(value) => {
								if (value) {
									bindDynamicMenus({
										menu: quickSearchMenu.bind(this),
										parentName: 'Quicksearch',
										entryCallback: (entry) => {
											const prefix = 'Quicksearch' + (/begins.*/i.test(entry.menuName)
												? ' Begins with: '
												: /partial.*/i.test(entry.menuName)
													? ' Partial: '
													: ': '
											);
											return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
										}
									});
								} else { deleteMainMenuDynamic('Quicksearch'); }
							}
					},
					(menu) => {
						menu.newSeparator();
						_createSubMenuEditEntries(menu, void (0), {
							name: 'Quicksearch',
							list: JSON.parse(this.buttonsProperties.entries[1]),
							defaults: JSON.parse(this.buttonsProperties.entries[3]),
							input: () => {
								const entry = {
									query: Input.string('string', '',
										'Enter dynamic query:\n\n#TAG# will be replaced with values from selected track(s).\nRemember TF functions -like "$year()"- need quotes.\n\n' +
										'Ex:\nTITLE IS #TITLE#\n"$year(%DATE%)" IS #$year(%DATE%)#'
										, 'Quicksearch', 'TITLE IS #TITLE#', void (0), true),
								};
								if (!entry.query) { return; }
								return entry;
							},
							bNumbered: true,
							onBtnUp: (entries) => {
								this.buttonsProperties.entries[1] = JSON.stringify(entries);
								overwriteProperties(this.buttonsProperties);
							}
						});
					}
				);
				menu.btn_up(this.currX, this.currY + this.currH);
			} else {
				quickSearchMenu.bind(this)().btn_up(this.currX, this.currY + this.currH);
			}
		},
		description: function () {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
			let info = 'Quicksearch using selection as reference:';
			info += '\nSelected\t ' + (plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count : 0) + ' items.';
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift + L. Click to open config menu)';
			}
			return info;
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.search,
		onInit: function () {
			// Create dynamic menus
			if (this.buttonsProperties.bDynamicMenus[1]) {
				bindDynamicMenus({
					menu: quickSearchMenu.bind({ buttonsProperties: this.buttonsProperties, prefix: '' }),
					parentName: 'Quicksearch',
					entryCallback: (entry) => {
						const prefix = 'Quicksearch' + (/begins.*/i.test(entry.menuName)
							? ' Begins with: '
							: /partial.*/i.test(entry.menuName)
								? ' Partial: '
								: ': '
						);
						return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
					}
				});
			}
		},
		update: { scriptName: 'Playlist-Tools-SMP', version }
	}),
});

function quickSearchMenu({ bSimulate = false } = {}) {
	if (bSimulate) { return quickSearchMenu.bind({ selItems: { Count: 1 }, buttonsProperties: this.buttonsProperties, prefix: this.prefix })(false); }
	let bPlsSel = false;
	// Safe Check
	if (!this.selItems || !this.selItems.Count) {
		this.selItems = fb.GetSelections(1);
		bPlsSel = fb.GetSelectionType() === 1;
		if (!this.selItems || !this.selItems.Count) { this.selItems = null; console.log('Quicksearch: No selected items.'); }
	}
	if (this.selItems && this.selItems.Count && this.buttonsProperties.bEvalSel[1]) {
		this.selItems.RemoveRange(1000, this.selItems.Count - 1);
	}
	const multiTags = ['artist', 'genre', 'style', globTags.artistRaw, globTags.genre, globTags.style]
		.map((t) => t.toLowerCase());
	const notMultTags = (e) => {
		if (Array.isArray(e.query)) { return e.query.every(notMultTags); }
		const query = (e.query || '').toLowerCase();
		return !query || !multiTags.some((t) => query.includes(t));
	};
	const flags = this.selItems && this.selItems.Count ? MF_STRING : MF_GRAYED;
	// Entry list
	const queryFilter = JSON.parse(this.buttonsProperties.entries[1]);
	// Globals
	const playlistName = this.buttonsProperties.playlistName[1];
	const sortTF = this.buttonsProperties.sortTF[1];
	const bOmitSortPls = this.buttonsProperties.bOmitSortPls[1];
	// Menu
	const menu = new _menu({ onBtnUp: () => this.selItems = null });
	menu.newEntry({ entryText: 'Shift to search / Ctrl for AutoPlaylist:', flags: MF_GRAYED });
	menu.newSeparator();
	{	// Same...
		queryFilter.forEach((queryObj) => {
			// Add separators
			if (menu.isSeparator(queryObj)) {
				menu.newSeparator();
			} else {
				// Create names for all entries
				queryObj.name = queryObj.name.length > 40 ? queryObj.name.substring(0, 40) + ' ...' : queryObj.name;
				// Entries
				menu.newEntry({
					entryText: queryObj.name, func: () => {
						let query = queryObj.query;
						if ((query.includes('#') || (Array.isArray(query) && query.some((q) => q.includes('#')))) && bPlsSel && !fb.GetFocusItem(true)) { fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.query, 'Quicksearch'); return; }
						const bShift = utils.IsKeyPressed(VK_SHIFT);
						const bCtrl = utils.IsKeyPressed(VK_CONTROL);
						if (this.buttonsProperties.bEvalSel[1]) {
							if (bShift || bCtrl) {
								query = dynamicQueryProcess({ query, handleList: this.selItems });
								if (query) {
									if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
									else if (!bShift && bCtrl) { plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
									else { dynamicQuery({ query, sort: (bOmitSortPls ? null : { tfo: sortTF }), handleList: this.selItems, playlistName, source: bPlsSel ? plman.GetPlaylistItems(plman.ActivePlaylist) : null }); }
								}
							} else {
								dynamicQuery({ query, sort: { tfo: sortTF }, handleList: this.selItems, playlistName });
							}
						} else {
							if (bShift || bCtrl) { // NOSONAR
								query = dynamicQueryProcess({ query });
								if (query) {
									if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
									else if (!bShift && bCtrl) { plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
									else { dynamicQuery({ query, sort: (bOmitSortPls ? null : { tfo: sortTF }), handleList: this.selItems, playlistName, source: bPlsSel ? plman.GetPlaylistItems(plman.ActivePlaylist) : null }); }
								}
							} else {
								dynamicQuery({ query, sort: queryObj.sort || { tfo: sortTF }, playlistName });
							}
						}
					}, flags, data: { bDynamicMenu: true }
				});
			}
		});
	}
	menu.newSeparator();
	{	// Static menu: user configurable
		menu.newEntry({
			entryText: 'By... (query)', func: () => {
				// Input
				let query = '';
				try { query = utils.InputBox(window.ID, 'Enter query:\n\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with ' + (this.buttonsProperties.bEvalSel[1] ? 'selected items\' values.' : 'focused item\'s value.') + '\n(see \'Dynamic queries\' readme for more info)' + '\n\nPressing Shift while clicking on \'OK\' will open the search window.\nPressing Ctrl will create an AutoPlaylist.', 'Quicksearch', this.buttonsProperties.lastQuery[1] || 'TITLE IS #TITLE#', true); }
				catch (e) { return; } // eslint-disable-line no-unused-vars
				if (query.includes('#') && bPlsSel && !fb.GetFocusItem(true)) { fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + query, 'Quicksearch'); return; }
				if (!query.length) { return; }
				// Playlist
				const bShift = utils.IsKeyPressed(VK_SHIFT);
				const bCtrl = utils.IsKeyPressed(VK_CONTROL);
				if (bShift || bCtrl) {
					if (this.buttonsProperties.bEvalSel[1]) {
						query = dynamicQueryProcess({ query, handleList: this.selItems });
					} else {
						query = dynamicQueryProcess({ query });
					}
					if (query) {
						if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
						else if (!bShift && bCtrl) { plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
						else { dynamicQuery({ query, sort: (bOmitSortPls ? null : { tfo: sortTF }), handleList: this.selItems, playlistName, source: bPlsSel ? plman.GetPlaylistItems(plman.ActivePlaylist) : null }); }
					}
				} else {
					const handleList = this.buttonsProperties.bEvalSel[1]
						? dynamicQuery({ query, handleList: this.selItems, sort: { tfo: sortTF }, playlistName })
						: dynamicQuery({ query, sort: { tfo: sortTF }, playlistName });
					if (!handleList) { fb.ShowPopupMessage('Query failed:\n' + query, 'Quicksearch'); return; }
				}
				this.buttonsProperties.lastQuery[1] = query;
				overwriteProperties(this.buttonsProperties);
			}, flags, data: { bDynamicMenu: true }
		});
	}
	menu.newSeparator();
	{	// Begin with
		const beginMenu = menu.newMenu('Begins with');
		menu.newEntry({ menuName: beginMenu, entryText: 'Simulates \'%TAG% IS VALUE*\':', flags: MF_GRAYED });
		menu.newSeparator(beginMenu);
		[
			...queryFilter,
			{ name: 'Same Title', query: 'TITLE IS #TITLE#' }
		].forEach((queryObj) => {
			// Add separators
			if (menu.isSeparator(queryObj)) {
				if (!menu.isSeparator((menu.getLastEntry() || { entryText: '' }))) {
					menu.newSeparator(beginMenu);
				}
			} else {
				// Create names for all entries
				queryObj.name = queryObj.name.length > 40 ? queryObj.name.substring(0, 40) + ' ...' : queryObj.name;
				// Entries
				if (Array.isArray(queryObj.query)) { return; }
				if (queryObj.query.count('#') === 2 && !queryObj.query.includes('$')) {
					menu.newEntry({
						menuName: beginMenu, entryText: queryObj.name, func: () => {
							let query = queryObj.query.replace(/#$/, '*#');
							if (query.includes('#') && bPlsSel && !fb.GetFocusItem(true)) { fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.query, 'Quicksearch'); return; }
							const bShift = utils.IsKeyPressed(VK_SHIFT);
							const bCtrl = utils.IsKeyPressed(VK_CONTROL);
							if (this.buttonsProperties.bEvalSel[1]) {
								if (bShift || bCtrl) {
									query = dynamicQueryProcess({ query, handleList: this.selItems, bToLowerCase: true });
									if (query) {
										if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
										else if (!bShift && bCtrl) { plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
										else { dynamicQuery({ query, sort: (bOmitSortPls ? null : queryObj.sort || { tfo: sortTF }), handleList: this.selItems, playlistName, source: bPlsSel ? plman.GetPlaylistItems(plman.ActivePlaylist) : null, bToLowerCase: true }); }
									}
								} else {
									dynamicQuery({ query, sort: queryObj.sort || { tfo: sortTF }, handleList: this.selItems, playlistName });
								}
							} else {
								if (bShift || bCtrl) { // NOSONAR
									query = dynamicQueryProcess({ query, bToLowerCase: true });
									if (query) {
										if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
										else if (!bShift && bCtrl) { plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
										else { dynamicQuery({ query, sort: (bOmitSortPls ? null : queryObj.sort || { tfo: sortTF }), handleList: this.selItems, playlistName, source: bPlsSel ? plman.GetPlaylistItems(plman.ActivePlaylist) : null, bToLowerCase: true }); }
									}
								} else {
									dynamicQuery({ query, sort: queryObj.sort || { tfo: sortTF }, playlistName, bToLowerCase: true });
								}
							}
						}, flags, data: { bDynamicMenu: true }
					});
				}
			}
		});
	}
	{	// Includes
		const beginMenu = menu.newMenu('Partially includes');
		menu.newEntry({ menuName: beginMenu, entryText: 'Simulates \'%TAG% HAS VALUE\':', flags: MF_GRAYED });
		menu.newSeparator(beginMenu);
		[
			...queryFilter,
			{ name: 'Same Title', query: 'TITLE HAS #TITLE#' }
		].forEach((queryObj) => {
			// Add separators
			if (menu.isSeparator(queryObj)) {
				if (!menu.isSeparator(menu.getLastEntry() || { entryText: '' })) {
					menu.newSeparator(beginMenu);
				}
			} else {
				// Create names for all entries
				queryObj.name = queryObj.name.length > 40 ? queryObj.name.substring(0, 40) + ' ...' : queryObj.name;
				// Entries
				if (Array.isArray(queryObj.query)) { return; }
				if (queryObj.query.count('#') === 2 && !queryObj.query.includes('$')) {
					menu.newEntry({
						menuName: beginMenu, entryText: queryObj.name, func: () => {
							let query = queryObj.query.replaceAll(' IS ', ' HAS ');
							if (query.includes('#') && bPlsSel && !fb.GetFocusItem(true)) { fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.query, 'Quicksearch'); return; }
							const bShift = utils.IsKeyPressed(VK_SHIFT);
							const bCtrl = utils.IsKeyPressed(VK_CONTROL);
							if (this.buttonsProperties.bEvalSel[1]) {
								if (bShift || bCtrl) {
									query = dynamicQueryProcess({ query, handleList: this.selItems, bToLowerCase: true });
									if (query) {
										if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
										else if (!bShift && bCtrl) { plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
										else { dynamicQuery({ query, sort: (bOmitSortPls ? null : queryObj.sort || { tfo: sortTF }), handleList: this.selItems, playlistName, source: bPlsSel ? plman.GetPlaylistItems(plman.ActivePlaylist) : null, bToLowerCase: true }); }
									}
								} else {
									dynamicQuery({ query, sort: queryObj.sort || { tfo: sortTF }, handleList: this.selItems, playlistName, bToLowerCase: true });
								}
							} else {
								if (bShift || bCtrl) { // NOSONAR
									query = dynamicQueryProcess({ query, bToLowerCase: true });
									if (query) {
										if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
										else if (!bShift && bCtrl) { plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
										else { dynamicQuery({ query, sort: (bOmitSortPls ? null : queryObj.sort || { tfo: sortTF }), handleList: this.selItems, playlistName, source: bPlsSel ? plman.GetPlaylistItems(plman.ActivePlaylist) : null, bToLowerCase: true }); }
									}
								} else {
									dynamicQuery({ query, sort: queryObj.sort || { tfo: sortTF }, playlistName, bToLowerCase: true });
								}
							}
						}, flags, data: { bDynamicMenu: true }
					});
				}
			}
		});
	}
	{	// Partial
		const partialMenu = menu.newMenu('Partial match');
		menu.newEntry({ menuName: partialMenu, entryText: 'Matches any value partially equal:', flags: MF_GRAYED });
		menu.newSeparator(partialMenu);
		// Mutate original queries into partial matches
		[
			...queryFilter,
			{ name: 'By Title and same Artist', query: globQuery.compareTitle, queryPost: ' AND (' + globTags.artist + ' IS #' + globTags.artistRaw + '#)' }
		].filter(notMultTags).map((queryObj) => {
			if (Array.isArray(queryObj.query)) { return void (0); }
			if (Object.hasOwn(queryObj, 'query') && queryObj.query.count('#') === 2) {
				const dynTF = queryObj.query.match(/#.*#/)[0];
				if (dynTF && dynTF.length) {
					const bIsFunc = dynTF.includes('$');
					const statTF = bIsFunc
						? dynTF.replaceAll('#', '')
						: '%' + dynTF.replaceAll('#', '') + '%';
					return {
						name: queryObj.name.replace('Same', 'By'),
						// Reduce length in 1 for dates, so it matches the same decade!
						query: (
							/DATE/i.test(queryObj.query)
								? '"$puts(val,' + dynTF + ')$puts(vallen,$len($get(val)))$puts(min,$sub($min($get(vallen),$len(' + statTF + ')),1))$stricmp($left($get(val),$get(min)),$left(' + statTF + ',$get(min)))" IS 1'
								: '"$puts(val,' + dynTF + ')$puts(vallen,$len($get(val)))$puts(min,$min($get(vallen),$if2($strchr($get(val),\'(\'),$get(vallen)),$if2($strchr($get(val),\'[\'),$get(vallen)),$len(' + statTF + ')))$stricmp($left($get(val),$get(min)),$left(' + statTF + ',$get(min)))" IS 1'
						) + (queryObj.queryPost || '')
					};
				}
			}
			return menu.isSeparator(queryObj)
				? queryObj
				: void (0);
		}).filter(Boolean).forEach((queryObj) => {
			// Add separators
			if (menu.isSeparator(queryObj)) {
				if (!menu.isSeparator(menu.getLastEntry() || { entryText: '' })) {
					menu.newSeparator(partialMenu);
				}
			} else {
				// Create names for all entries
				queryObj.name = queryObj.name.length > 40 ? queryObj.name.substring(0, 40) + ' ...' : queryObj.name;
				// Entries
				menu.newEntry({
					menuName: partialMenu, entryText: queryObj.name, func: () => {
						let query = queryObj.query;
						if (query.includes('#') && bPlsSel && !fb.GetFocusItem(true)) { fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.query, 'Quicksearch'); return; }
						const bShift = utils.IsKeyPressed(VK_SHIFT);
						const bCtrl = utils.IsKeyPressed(VK_CONTROL);
						if (this.buttonsProperties.bEvalSel[1]) {
							if (bShift || bCtrl) {
								query = dynamicQueryProcess({ query, handleList: this.selItems });
								if (query) {
									if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
									else if (!bShift && bCtrl) { plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
									else { dynamicQuery({ query, sort: (bOmitSortPls ? null : queryObj.sort || { tfo: sortTF }), handleList: this.selItems, playlistName, source: bPlsSel ? plman.GetPlaylistItems(plman.ActivePlaylist) : null }); }
								}
							} else {
								dynamicQuery({ query, sort: queryObj.sort || { tfo: sortTF }, handleList: this.selItems, playlistName });
							}
						} else {
							if (bShift || bCtrl) { // NOSONAR
								query = dynamicQueryProcess({ query });
								if (query) {
									if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
									else if (!bShift && bCtrl) { plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
									else { dynamicQuery({ query, sort: (bOmitSortPls ? null : queryObj.sort || { tfo: sortTF }), handleList: this.selItems, playlistName, source: bPlsSel ? plman.GetPlaylistItems(plman.ActivePlaylist) : null }); }
								}
							} else {
								dynamicQuery({ query, sort: queryObj.sort || { tfo: sortTF }, playlistName });
							}
						}
					}, flags, data: { bDynamicMenu: true }
				});
			}
		});
	}
	{	// Similar
		const partialMenu = menu.newMenu('Similar match');
		menu.newEntry({ menuName: partialMenu, entryText: 'Matches any similar value:', flags: MF_GRAYED });
		menu.newSeparator(partialMenu);
		// Mutate original queries into partial matches
		[
			...queryFilter,
			{ name: 'By Title and same Artist', query: globQuery.compareTitle, queryPost: ' AND (' + globTags.artist + ' IS #' + globTags.artistRaw + '#)' }
		].map((queryObj) => {
			if (Array.isArray(queryObj.query)) { return void (0); }
			if (Object.hasOwn(queryObj, 'query') && queryObj.query.count('#') === 2) {
				const dynTF = queryObj.query.match(/#.*#/)[0];
				if (dynTF && dynTF.length) {
					const bIsFunc = dynTF.includes('$');
					const statTF = bIsFunc
						? dynTF.replaceAll('#', '')
						: '%' + dynTF.replaceAll('#', '') + '%';
					return {
						name: queryObj.name.replace('Same', 'By'),
						// Reduce length in 1 for dates, so it matches the same decade!
						query: [
							...(notMultTags(queryObj)
								? [
									'(',
									(
										/DATE/i.test(queryObj.query)
											? '"$puts(val,' + dynTF + ')$puts(vallen,$len($get(val)))$puts(min,$sub($min($get(vallen),$len(' + statTF + ')),1))$stricmp($left($get(val),$get(min)),$left(' + statTF + ',$get(min)))" IS 1'
											: '"$puts(val,' + dynTF + ')$puts(vallen,$len($get(val)))$puts(min,$min($get(vallen),$if2($strchr($get(val),\'(\'),$get(vallen)),$if2($strchr($get(val),\'[\'),$get(vallen)),$len(' + statTF + ')))$stricmp($left($get(val),$get(min)),$left(' + statTF + ',$get(min)))" IS 1'
									) + (queryObj.queryPost || ''),
									') OR ',
								]
								: []
							),
							'(',
							queryObj.query.replace(/#$/, '*#') + (queryObj.queryPost || ''),
							') OR (',
							queryObj.query.replaceAll(' IS ', ' HAS ') + (queryObj.queryPost || ''),
							')'
						].filter(Boolean)
					};
				}
			}
			return menu.isSeparator(queryObj)
				? queryObj
				: void (0);
		}).filter(Boolean).forEach((queryObj) => {
			// Add separators
			if (menu.isSeparator(queryObj)) {
				if (!menu.isSeparator(menu.getLastEntry() || { entryText: '' })) {
					menu.newSeparator(partialMenu);
				}
			} else {
				// Create names for all entries
				queryObj.name = queryObj.name.length > 40 ? queryObj.name.substring(0, 40) + ' ...' : queryObj.name;
				// Entries
				menu.newEntry({
					menuName: partialMenu, entryText: queryObj.name, func: () => {
						let query = queryObj.query;
						if (query.includes('#') && bPlsSel && !fb.GetFocusItem(true)) { fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.query, 'Quicksearch'); return; }
						const bShift = utils.IsKeyPressed(VK_SHIFT);
						const bCtrl = utils.IsKeyPressed(VK_CONTROL);
						if (this.buttonsProperties.bEvalSel[1]) {
							if (bShift || bCtrl) {
								query = dynamicQueryProcess({ query, handleList: this.selItems });
								if (query) {
									if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
									else if (!bShift && bCtrl) { plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
									else { dynamicQuery({ query, sort: (bOmitSortPls ? null : queryObj.sort || { tfo: sortTF }), handleList: this.selItems, playlistName, source: bPlsSel ? plman.GetPlaylistItems(plman.ActivePlaylist) : null }); }
								}
							} else {
								dynamicQuery({ query, sort: queryObj.sort || { tfo: sortTF }, handleList: this.selItems, playlistName });
							}
						} else {
							if (bShift || bCtrl) { // NOSONAR
								query = dynamicQueryProcess({ query });
								if (query) {
									if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
									else if (!bShift && bCtrl) { plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
									else { dynamicQuery({ query, sort: (bOmitSortPls ? null : queryObj.sort || { tfo: sortTF }), handleList: this.selItems, playlistName, source: bPlsSel ? plman.GetPlaylistItems(plman.ActivePlaylist) : null }); }
								}
							} else {
								dynamicQuery({ query, sort: queryObj.sort || { tfo: sortTF }, playlistName });
							}
						}
					}, flags, data: { bDynamicMenu: true }
				});
			}
		});
	}
	return menu;
}