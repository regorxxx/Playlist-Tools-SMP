'use strict';
//08/02/23

/* 
	Playlist Tools Pools
	-------------------
	Pools submenu from Playlist Tools
 */

include('..\\helpers\\buttons_xxx.js'); 
include('..\\helpers\\menu_xxx.js');
var prefix = 'ptp';

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { //You can simply add new properties here
	bIconMode:	['Icon-only mode?', false, {func: isBoolean}, false]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playlist Tools Pools': new themedButton({x: 0, y: 0, w: 60, h: 22}, 'Pools', function () {
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
	}, null, void(0), () => {
		return (isPlaylistToolsLoaded() 
			? 'Executes Playlist Tools Menu pool' + (
				getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0).bTooltipInfo[1] 
					? '\n-----------------------------------------------------\n(L. Click to show list)' 
					: ''
				) 
			: 'WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS');
		}, prefix, newButtonsProperties, chars.music),
});

// Helpers
function isPlaylistToolsLoaded() {return (typeof specialMenu !== 'undefined' && typeof configMenu !== 'undefined' && typeof scriptName !== 'undefined' && typeof menu !== 'undefined');}