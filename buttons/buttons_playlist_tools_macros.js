﻿'use strict';
//10/09/25

/*
	Playlist Tools Macros
	-------------------
	MaCros submenu from Playlist Tools
 */

/* global menu:readable, barProperties:readable, menu_prefix:readable, menu_properties:readable, MF_GRAYED:readable, defaultArgs:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable */

var prefix = 'ptm'; // NOSONAR[global]

prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playlist Tools Macros': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth('Macros', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 30 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: 'Macros',
		func: function () {
			if (isPlaylistToolsLoaded()) {
				const configMenu = new _menu();
				const scriptDefaultArgs = { properties: [{ ...menu_properties }, () => { return menu_prefix; }] };
				const Macros = menu.Macros;
				configMenu.newCondEntry({
					entryText: 'Macros', condFunc: (args = { ...scriptDefaultArgs, ...defaultArgs }) => {
						args.properties = getPropertiesPairs(args.properties[0], args.properties[1](), 0); // Update properties from the panel. Note () call on second arg
						let propMacros = JSON.parse(args.properties['macros'][1]);
						Macros.set(propMacros);
						configMenu.newEntry({ entryText: 'Execute macros:', func: null, flags: MF_GRAYED });
						configMenu.newSeparator();
						// List
						const entryNames = new Set();
						propMacros.forEach((macro) => {
							if (menu.isSeparator(macro)) { // Create separators
								configMenu.newSeparator();
							} else {
								const macroName = (macro.name || '').cut(30);
								if (entryNames.has(macroName)) {
									fb.ShowPopupMessage('There is an entry with duplicated name:\t' + macroName + '\nEdit the custom entries and either remove or rename it.\n\nEntry:\n' + JSON.stringify(macro, null, '\t'), 'Playlist Tools: Macros');
									return;
								} else { entryNames.add(macroName); }
								configMenu.newEntry({
									entryText: macro.name, func: () => {
										menu.btn_up(void (0), void (0), void (0), 'Macros\\' + macroName); // Don't clear menu on last call
									}
								});
							}
						});
						if (!propMacros.length) { configMenu.newEntry({ entryText: '(none saved yet)', func: null, flags: MF_GRAYED }); }
					}
				});
				configMenu.btn_up(this.currX, this.currY + this.currH);
			} else { fb.ShowPopupMessage('WARNING: CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS', 'Playlist Tools'); }
		},
		description: function () {
			return (isPlaylistToolsLoaded()
				? 'Execute Playlist Tools Menu macros' +
				(
					typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1]
						? '\n-----------------------------------------------------\n(L. Click to show list)'
						: ''
				)
				: 'WARNING: CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS');
		},
		prefix, buttonsProperties: newButtonsProperties,
		icon: chars.hourglassHalf
	}),
});

// Helpers
function isPlaylistToolsLoaded() { return (typeof specialMenu !== 'undefined' && typeof configMenu !== 'undefined' && typeof scriptName !== 'undefined' && typeof menu !== 'undefined'); }