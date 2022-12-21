'use strict';
//19/12/22

/* 
	Quicksearch for same....
	Search tracks on library matching X tag
	Expands [foo_quicksearch](https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Components/Quicksearch_UI_Element_%28foo_quicksearch%29#Context_menu) contextual menus functionality, and works with multiple selection
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\buttons_xxx_menu.js');
include('..\\main\\filter_and_query\\dynamic_query.js');
var prefix = 'qs';

try {window.DefinePanel('Quicksearch button', {author:'xxx'});} catch (e) {/* console.log('Quicksearch Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	bEvalSel: 		['Evaluate multiple tracks?', true, {func: isBoolean}, true],
	lastQuery: 		['Last query used', '', {func: isStringWeak}, ''],
	playlistName:	['Playlist name', 'Search...', {func: isString}, 'Search...']
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Quicksearch': new themedButton({x: 0, y: 0, w: 98, h: 22}, 'Quicksearch', function (mask) {
		if (mask === MK_SHIFT) {
			settingsMenu(this, true, ['buttons_search_quicksearch.js']).btn_up(this.currX, this.currY + this.currH);
		} else {
			// Entry list
			let queryFilter = [
				{name: 'Same Title', 
					query: globQuery.compareTitle},
				{name: 'Same Artist',
					query: globTags.artist + ' IS #' + globTags.artist + '#'},
				{name: 'Same Date',
					query: _q(globTags.date) + ' IS #' + globTags.date + '#'},
				{name: 'Same Album',
					query: 'ALBUM IS #ALBUM#'},
				{name: 'Same Genre',
					query: 'GENRE IS #GENRE#'},
				{name: 'Same Title and Artist',
					query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artist + '#)'},
				{name: 'Same Title, Artist & Date', 
					query: globQuery.compareTitle + ' AND (' + globTags.artist + ' IS #' + globTags.artist + '#) AND (' + _q(globTags.date) + ' IS #' + globTags.date + '#)'}
			];
			// Globals
			const playlistName = this.buttonsProperties.playlistName[1];
			// Menu
			const menu = new _menu();
			menu.newEntry({entryText: 'Shift to search / Ctrl for Autoplaylist:', flags: MF_GRAYED});
			menu.newEntry({entryText: 'sep'});
			{
				queryFilter.forEach((queryObj) => {
					// Add separators
					if (queryObj.hasOwnProperty('name') && queryObj.name === 'sep') {
						let entryMenuName = queryObj.hasOwnProperty('menu') ? queryObj.menu : menuName;
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
									query = dynamicQueryProcess({query, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist)});
									if (query) {
										if (utils.IsKeyPressed(VK_SHIFT)) {fb.ShowLibrarySearchUI(query);}
										else {plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query);}
									}
								} else {
									dynamicQuery({query, sort: queryObj.sort, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), playlistName});
								}
							}else{
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
						}, flags: plman.ActivePlaylist !== -1 && plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count ? MF_STRING : MF_GRAYED});
					}
				});
			}
			menu.newEntry({entryText: 'sep'});
			{ // Static menu: user configurable
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
							query = dynamicQueryProcess({query, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist)});
						} else {
							query = dynamicQueryProcess({query});
						}
						if (query) {
							if (utils.IsKeyPressed(VK_SHIFT)) {fb.ShowLibrarySearchUI(query);}
							else {plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query);}
						}
					} else {
						const handleList = this.buttonsProperties.bEvalSel[1]
							? dynamicQuery({query, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), playlistName}) 
							: dynamicQuery({query, playlistName});
						if (!handleList) {fb.ShowPopupMessage('Query failed:\n' + query, 'Quicksearch'); return;}
					}
					this.buttonsProperties.lastQuery[1] = query;
					overwriteProperties(this.buttonsProperties);
				}, flags: plman.ActivePlaylist !== -1 && plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count ? MF_STRING : MF_GRAYED});
				// Menu to configure property
			}
			menu.newEntry({entryText: 'sep'});
			{
				const beginMenu = menu.newMenu('Begins with...');
				[{name: 'Same Title', query: 'TITLE IS #TITLE#'}].concat(queryFilter).forEach((queryObj) => {
					// Add separators
					if (queryObj.hasOwnProperty('name') && queryObj.name === 'sep') {
						let entryMenuName = queryObj.hasOwnProperty('menu') ? queryObj.menu : menuName;
						menu.newEntry({entryText: 'sep'});
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
										query = dynamicQueryProcess({query, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist)});
										if (query) {
											if (utils.IsKeyPressed(VK_SHIFT)) {fb.ShowLibrarySearchUI(query);}
											else {plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query);}
										}
									} else {
										dynamicQuery({query, sort: queryObj.sort, handleList: plman.GetPlaylistSelectedItems(plman.ActivePlaylist), playlistName});
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
							}, flags: plman.ActivePlaylist !== -1 && plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count ? MF_STRING : MF_GRAYED});
						}
					}
				});
			}
			menu.btn_up(this.currX, this.currY + this.currH);
		}
	}, null, void(0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		let info = 'Selected: ' + (plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count : 0) + ' items.';
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, chars.search),
});