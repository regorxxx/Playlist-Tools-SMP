'use strict';
//09/12/24

/*
	Playlist Tools Pools
	-------------------
	Pools submenu from Playlist Tools
 */

/* global menu:readable, menu_panelProperties:readable, menu_prefix_panel:readable, menu_properties:readable, defaultArgs:readable, menu_prefix:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MF_GRAYED:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable  */

var prefix = 'ptp'; // NOSONAR[global]

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playlist Tools Pools': new ThemedButton({ x: 0, y: 0, w: _gr.CalcTextWidth('Pools', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 30 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 }, 'Pools', function () {
		if (isPlaylistToolsLoaded()) {
			const configMenu = new _menu();
			const scriptDefaultArgs = { properties: [{ ...menu_properties }, () => { return menu_prefix; }] };
			configMenu.newCondEntry({
				entryText: 'Pools', condFunc: (args = { ...scriptDefaultArgs, ...defaultArgs }) => {
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1](), 0); // Update properties from the panel. Note () call on second arg
					let propPools = JSON.parse(args.properties['pools'][1]);
					configMenu.newEntry({ entryText: 'Playlist creation:', func: null, flags: MF_GRAYED });
					configMenu.newSeparator();
					// List
					propPools.forEach((pool) => {
						if (menu.isSeparator(pool)) { // Create separators
							configMenu.newSeparator();
						} else {
							configMenu.newEntry({
								entryText: pool.name, func: () => {
									menu.btn_up(void (0), void (0), void (0), 'Pools\\' + pool.name); // Don't clear menu on last call
								}
							});
						}
					});
					if (!propPools.length) { configMenu.newEntry({ entryText: '(none saved yet)', func: null, flags: MF_GRAYED }); }
				}
			});
			configMenu.btn_up(this.currX, this.currY + this.currH);
		} else { fb.ShowPopupMessage('WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS', 'Playlist Tools'); }
	}, null, void (0), () => {
		return (isPlaylistToolsLoaded()
			? 'Executes Playlist Tools Menu pool' +
			(
				getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0).bTooltipInfo[1]
					? '\n-----------------------------------------------------\n(L. Click to show list)'
					: ''
			)
			: 'WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS');
	}, prefix, newButtonsProperties, chars.music),
});

// Helpers
function isPlaylistToolsLoaded() { return (typeof specialMenu !== 'undefined' && typeof configMenu !== 'undefined' && typeof scriptName !== 'undefined' && typeof menu !== 'undefined'); }