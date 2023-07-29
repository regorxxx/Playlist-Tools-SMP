'use strict';
//29/07/23

/* 
	Quicksearch for same....
	Search tracks on library matching X tag
	Expands [foo_quicksearch](https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Components/Quicksearch_UI_Element_%28foo_quicksearch%29#Context_menu) contextual menus functionality, and works with multiple selection
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\buttons_xxx_menu.js');
include('..\\helpers\\menu_xxx_extras.js');
include('..\\main\\filter_and_query\\dynamic_query.js');
include('..\\main\\main_menu\\main_menu_custom.js');
var prefix = 'qs';

try {window.DefineScript('Quicksearch button', {author:'xxx', features: {drag_n_drop: false}});} catch (e) {/* console.log('Quicksearch Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	bEvalSel: 		['Evaluate multiple tracks?', true, {func: isBoolean}, true],
	lastQuery: 		['Last query used', '', {func: isStringWeak}, ''],
	playlistName:	['Playlist name', 'Search...', {func: isString}, 'Search...'],
	bDynamicMenus:	['Expose menus at  \'File\\Spider Monkey Panel\\Script commands\'', false, {func: isBoolean}, false],
	bIconMode:		['Icon-only mode?', false, {func: isBoolean}, false],
	entries:		['Quicksearch entries', JSON.stringify([
		{name: 'Same Date',
			query: _q(globTags.date) + ' IS #' + globTags.date + '#'},
		{name: 'Same Album',
			query: 'ALBUM IS #ALBUM#'},
		{name: 'Same Genre(s)',
			query: globTags.genre + ' IS #' + globTags.genre + '#'},
		{name: 'Same Style(s)',
			query: globTags.style + ' IS #' + globTags.style + '#'},
		{name: 'sep'},
		{name: 'Same Style(s) and Key',
			query: globTags.style + ' IS #' + globTags.style + '# AND ' + globTags.key + ' IS #' + globTags.key + '#'},
		{name: 'Same Style(s) and next Key',
			query: globTags.style + ' IS #' + globTags.style + '# AND ' + globTags.key + ' IS #NEXTKEY#'},
		{name: 'Same Style(s) and prev Key',
			query: globTags.style + ' IS #' + globTags.style + '# AND ' + globTags.key + ' IS #PREVKEY#'},
		{name: 'Same Genre(s) and Key',
			query: globTags.genre + ' IS #' + globTags.genre + '# AND ' + globTags.key + ' IS #' + globTags.key + '#'},
		{name: 'Same Genre(s) and next Key',
			query: globTags.genre + ' IS #' + globTags.genre + '# AND ' + globTags.key + ' IS #NEXTKEY#'},
		{name: 'Same Genre(s) and prev Key',
			query: globTags.genre + ' IS #' + globTags.genre + '# AND ' + globTags.key + ' IS #PREVKEY#'},
		{name: 'sep'},
		{name: 'Same Title', 
			query: globQuery.compareTitle},
		{name: 'Same Artist(s)',
			query: globTags.artist + ' IS #' + globTags.artistRaw + '#'},
		{name: 'Same Title and Artist(s)',
			query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artistRaw + '#)'},
		{name: 'Same Title, Artist(s) & Date', 
			query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artistRaw + '#) AND (' + _q(globTags.date) + ' IS #' + globTags.date + '#)'}
	]), {func: isJSON}],
};
newButtonsProperties.entries.push(newButtonsProperties.entries[1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);
// Create dynamic menus
if (newButtonsProperties.bDynamicMenus[1]) {
	bindDynamicMenus({
		menu: quickSearchMenu.bind({buttonsProperties: newButtonsProperties, prefix: ''}), 
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

addButton({
	'Quicksearch': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Quicksearch', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) /_scale(buttonsBar.config.scale), h: 22}, 'Quicksearch', function (mask) {
		if (mask === MK_SHIFT) {
			const menu = settingsMenu(
				this, true, ['buttons_search_quicksearch.js'],
				{bDynamicMenus: 
					{popup: 'Remember to set different panel names to every buttons toolbar, otherwise menus will not be properly associated to a single panel.\n\nShift + Win + R. Click -> Configure panel... (\'edit\' at top)'}
				},
				{bDynamicMenus: 
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
						} else {deleteMainMenuDynamic('Quicksearch');}
					}
				},
				(menu) => {
					menu.newEntry({entryText: 'sep'});
					_createSubMenuEditEntries(menu, void(0), {
						name: 'Quicksearch',
						list: JSON.parse(this.buttonsProperties.entries[1]), 
						defaults: JSON.parse(this.buttonsProperties.entries[3]), 
						input : () => {
							const entry = {
								query: Input.string('string', '',
								'Enter dynamic query:\n\n#TAG# will be replaced with values from selected track(s).\nRemember TF functions -like "$year()"- need quotes.\n\n' +
								'Ex:\nTITLE IS #TITLE#\n"$year(%DATE%)" IS #$year(%DATE%)#'
								, 'Quicksearch' , 'TITLE IS #TITLE#', void(0), true),
							};
							if (!entry.query) {return;}
							return entry;
						},
						bNumbered: true,
						onBtnUp: (entries) => {
							this.buttonsProperties.entries[1] = JSON.stringify(entries);
							overwriteProperties(this.buttonsProperties);
						}
					});
				}
			)
			menu.btn_up(this.currX, this.currY + this.currH);
		} else {
			quickSearchMenu.bind(this)().btn_up(this.currX, this.currY + this.currH);
		}
	}, null, void(0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		let info = 'Quicksearch using selection as reference:';
		info += '\nSelected\t ' + (plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count : 0) + ' items.';
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, '', newButtonsProperties, chars.search),
});

function quickSearchMenu({bSimulate = false} = {}) {
	if (bSimulate) {return quickSearchMenu.bind({selItems: {Count: 1}, buttonsProperties: this.buttonsProperties, prefix: this.prefix})(false);}
	// Safe Check
	if (!this.selItems || !this.selItems.Count) {
		this.selItems = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null;
		if (!this.selItems || !this.selItems.Count) {this.selItems = null; console.log('Quicksearch: No selected items.')}
	}
	const flags = this.selItems && this.selItems.Count ? MF_STRING : MF_GRAYED;
	// Entry list
	const queryFilter = JSON.parse(this.buttonsProperties.entries[1]);
	// Globals
	const playlistName = this.buttonsProperties.playlistName[1];
	// Menu
	const menu = new _menu({onBtnUp: () => this.selItems = null});
	menu.newEntry({entryText: 'Shift to search / Ctrl for Autoplaylist:', flags: MF_GRAYED});
	menu.newEntry({entryText: 'sep'});
	{	// Same...
		queryFilter.forEach((queryObj) => {
			// Add separators
			if (queryObj.hasOwnProperty('name') && queryObj.name === 'sep') {
				menu.newEntry({entryText: 'sep'});
			} else { 
				// Create names for all entries
				queryObj.name = queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name;
				// Entries
				menu.newEntry({entryText: queryObj.name, func: () => {
					let query = queryObj.query;
					if (query.indexOf('#') !== -1 && !fb.GetFocusItem(true)) {fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.query, 'Quicksearch'); return;}
					if (this.buttonsProperties.bEvalSel[1]) {
						if (utils.IsKeyPressed(VK_SHIFT) || utils.IsKeyPressed(VK_CONTROL)) {
							query = dynamicQueryProcess({query, handleList: this.selItems});
							if (query) {
								if (utils.IsKeyPressed(VK_SHIFT)) {fb.ShowLibrarySearchUI(query);}
								else {plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query);}
							}
						} else {
							dynamicQuery({query, sort: queryObj.sort, handleList: this.selItems, playlistName});
						}
					} else {
						if (utils.IsKeyPressed(VK_SHIFT) || utils.IsKeyPressed(VK_CONTROL)) {
							query = dynamicQueryProcess({query});
							if (query) {
								if (utils.IsKeyPressed(VK_SHIFT)) {fb.ShowLibrarySearchUI(query);}
								else {plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query);}
							}
						} else {
							dynamicQuery({query, sort: queryObj.sort, playlistName});
						}
					}
				}, flags, data: {bDynamicMenu: true}});
			}
		});
	}
	menu.newEntry({entryText: 'sep'});
	{	// Static menu: user configurable
		menu.newEntry({entryText: 'By... (query)', func: () => {
			// Input
			let query = '';
			try {query = utils.InputBox(window.ID, 'Enter query:\nAlso allowed dynamic variables, like #ARTIST#, which will be replaced with ' + (this.buttonsProperties.bEvalSel[1] ? 'selected items\' values.' : 'focused item\'s value.') + '\n\nPressing Shift while clicking on \'OK\' will open the search window.\nPressing Ctrl will create an Autoplaylist.', 'Quicksearch', this.buttonsProperties.lastQuery[1] || 'TITLE IS #TITLE#', true);}
			catch (e) {return;}
			if (query.indexOf('#') !== -1 && !fb.GetFocusItem(true)) {fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + query, 'Quicksearch'); return;}
			if (!query.length) {return;}
			// Playlist
			if (utils.IsKeyPressed(VK_SHIFT) || utils.IsKeyPressed(VK_CONTROL)) {
				if (this.buttonsProperties.bEvalSel[1]) {
					query = dynamicQueryProcess({query, handleList: this.selItems});
				} else {
					query = dynamicQueryProcess({query});
				}
				if (query) {
					if (utils.IsKeyPressed(VK_SHIFT)) {fb.ShowLibrarySearchUI(query);}
					else {plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query);}
				}
			} else {
				const handleList = this.buttonsProperties.bEvalSel[1]
					? dynamicQuery({query, handleList: this.selItems, playlistName}) 
					: dynamicQuery({query, playlistName});
				if (!handleList) {fb.ShowPopupMessage('Query failed:\n' + query, 'Quicksearch'); return;}
			}
			this.buttonsProperties.lastQuery[1] = query;
			overwriteProperties(this.buttonsProperties);
		}, flags, data: {bDynamicMenu: true}});
	}
	menu.newEntry({entryText: 'sep'});
	{	// Begin with
		const beginMenu = menu.newMenu('Begins with...');
		menu.newEntry({menuName: beginMenu, entryText: 'Simulates \'%TAG% IS VALUE*\':', flags: MF_GRAYED});
		menu.newEntry({menuName: beginMenu, entryText: 'sep'});
		[{name: 'Same Title', query: 'TITLE IS #TITLE#'}].concat(queryFilter).forEach((queryObj) => {
			// Add separators
			if (queryObj.hasOwnProperty('name') && queryObj.name === 'sep') {
				// menu.newEntry({entryText: 'sep'});
			} else { 
				// Create names for all entries
				queryObj.name = queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name;
				// Entries
				if (queryObj.query.count('#') === 2 && queryObj.query.indexOf('$') === -1) {
					menu.newEntry({menuName: beginMenu, entryText: queryObj.name, func: () => {
						let query = queryObj.query + '*';
						if (query.indexOf('#') !== -1 && !fb.GetFocusItem(true)) {fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.query, 'Quicksearch'); return;}
						if (this.buttonsProperties.bEvalSel[1]) {
							if (utils.IsKeyPressed(VK_SHIFT) || utils.IsKeyPressed(VK_CONTROL)) {
								query = dynamicQueryProcess({query, handleList: this.selItems});
								if (query) {
									if (utils.IsKeyPressed(VK_SHIFT)) {fb.ShowLibrarySearchUI(query);}
									else {plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query);}
								}
							} else {
								dynamicQuery({query, sort: queryObj.sort, handleList: this.selItems, playlistName});
							}
						} else {
							if (utils.IsKeyPressed(VK_SHIFT) || utils.IsKeyPressed(VK_CONTROL)) {
								query = dynamicQueryProcess({query});
								if (query) {
									if (utils.IsKeyPressed(VK_SHIFT)) {fb.ShowLibrarySearchUI(query);}
									else {plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query);}
								}
							} else {
								dynamicQuery({query, sort: queryObj.sort, playlistName});
							}
						}
					}, flags, data: {bDynamicMenu: true}});
				}
			}
		});
	}
	{	// Partial
		const partialMenu = menu.newMenu('Partial match...');
		menu.newEntry({menuName: partialMenu, entryText: 'Matches any value partially equal:', flags: MF_GRAYED});
		menu.newEntry({menuName: partialMenu, entryText: 'sep'});
		// Mutate original queries into partial matches
		queryFilter.map((queryObj) => {
			if (queryObj.hasOwnProperty('query') && queryObj.query.count('#') === 2) {
				const dynTF = queryObj.query.match(/#.*#/)[0];
				if (dynTF && dynTF.length) {
					const bIsFunc = dynTF.indexOf('$') !== -1;
					const statTF = bIsFunc ? dynTF.replaceAll('#','') : '%' + dynTF.replaceAll('#','') + '%';
					return {
						name: queryObj.name.replace('Same', 'By'),
						query: /DATE/i.test(queryObj.query) !== true
							? '"$puts(val,' + dynTF + ')$puts(min,$min($len($get(val)),$len(' + statTF + ')))$stricmp($left($get(val),$get(min)),$left(' + statTF + ',$get(min)))" IS 1'
							: '"$puts(val,' + dynTF + ')$puts(min,$sub($min($len($get(val)),$len(' + statTF + ')),1))$stricmp($left($get(val),$get(min)),$left(' + statTF + ',$get(min)))" IS 1' // Reduce length in 1 for dates, so it matches the same decade!
					};
				}
			}
			return void(0);
		}).filter(Boolean).forEach((queryObj) => {
			// Add separators
			if (queryObj.hasOwnProperty('name') && queryObj.name === 'sep') {
				// menu.newEntry({entryText: 'sep'});
			} else { 
				// Create names for all entries
				queryObj.name = queryObj.name.length > 40 ? queryObj.name.substring(0,40) + ' ...' : queryObj.name;
				// Entries
				menu.newEntry({menuName: partialMenu, entryText: queryObj.name, func: () => {
					let query = queryObj.query;
					if (query.indexOf('#') !== -1 && !fb.GetFocusItem(true)) {fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.query, 'Quicksearch'); return;}
					if (this.buttonsProperties.bEvalSel[1]) {
						if (utils.IsKeyPressed(VK_SHIFT) || utils.IsKeyPressed(VK_CONTROL)) {
							query = dynamicQueryProcess({query, handleList: this.selItems});
							if (query) {
								if (utils.IsKeyPressed(VK_SHIFT)) {fb.ShowLibrarySearchUI(query);}
								else {plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query);}
							}
						} else {
							dynamicQuery({query, sort: queryObj.sort, handleList: this.selItems, playlistName});
						}
					} else {
						if (utils.IsKeyPressed(VK_SHIFT) || utils.IsKeyPressed(VK_CONTROL)) {
							query = dynamicQueryProcess({query});
							if (query) {
								if (utils.IsKeyPressed(VK_SHIFT)) {fb.ShowLibrarySearchUI(query);}
								else {plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query);}
							}
						} else {
							dynamicQuery({query, sort: queryObj.sort, playlistName});
						}
					}
				}, flags, data: {bDynamicMenu: true}});
			}
		});
	}
	return menu;
}