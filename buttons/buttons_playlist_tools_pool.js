'use strict';
//17/02/22

/* 
	Playlist History
	----------------
	Switch to previous playlists.
 */

include('..\\helpers\\buttons_xxx.js'); 
try {window.DefinePanel('Playlist Tools Macros', {author:'xxx'});} catch (e) {console.log('Playlist Tools Pools Button loaded.');} //May be loaded along other buttons

buttonsBar.list.push({});

addButton({
	menuButton: new themedButton({x: 0, y: 0, w: 98, h: 22}, 'Pools', function (mask) {
		if (isPlaylistToolsLoaded()) {
			const configMenu = new _menu();
			const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
			configMenu.newCondEntry({entryText: 'Pools', condFunc: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
				args.properties = getPropertiesPairs(args.properties[0], args.properties[1](), 0); // Update properties from the panel. Note () call on second arg
				let propPools = JSON.parse(args.properties['pools'][1]);
				configMenu.newEntry({entryText: 'Playlist creation:', func: null, flags: MF_GRAYED});
				configMenu.newEntry({entryText: 'sep'});
				// List
				propPools.forEach((pool) => {
					if (pool.name === 'sep') { // Create separators
						configMenu.newEntry({entryText: 'sep'});
					} else {
						configMenu.newEntry({entryText: pool.name, func: () => {
							menu.btn_up(void(0), void(0), void(0), 'Pools\\' + pool.name); // Don't clear menu on last call
						}});
					}
				});
				if (!propPools.length) {configMenu.newEntry({entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
			}});
			configMenu.btn_up(this.currX, this.currY + this.currH);
		} else {fb.ShowPopupMessage('WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS', 'Playlist Tools');}
	}, null, void(0), () => {return isPlaylistToolsLoaded() ? 'Executes Playlist Tools Menu pool' + (getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0).bTooltipInfo[1] ? '\n-----------------------------------------------------\n(L. Click to show list)' : '') : 'WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS';}, null, null, chars.music),
});

// Helpers
function isPlaylistToolsLoaded() {return (typeof specialMenu !== 'undefined' && typeof configMenu !== 'undefined' && typeof scriptName !== 'undefined' && typeof menu !== 'undefined');}