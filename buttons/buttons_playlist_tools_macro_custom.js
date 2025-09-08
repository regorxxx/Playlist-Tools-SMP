﻿'use strict';
//06/08/25

/*
	Playlist Tools Macro custom
	-------------------
	Shortcut to configurable macro from Playlist Tools
 */

/* global menu:readable, barProperties:readable, menu_prefix:readable, menu_properties:readable, MF_GRAYED:readable, defaultArgs:readable, MK_SHIFT:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isStringWeak:readable,  */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable */

var prefix = 'mac'; // NOSONAR[global]
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	customName: ['Name for the custom UI button', 'Customize!', { func: isStringWeak }, 'Customize!'],
	macro: ['Macro entry', '', { func: isStringWeak }, ''],
	bIconMode: ['Icon-only mode', false, { func: isBoolean }, false]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0); // And retrieve
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playlist Tools Macros (CUSTOM)': new ThemedButton({
		coordinates: { x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 },
		text: newButtonsProperties.customName[1],
		func: function (mask) {
			if (isPlaylistToolsLoaded()) {
				if (mask === MK_SHIFT) {
					const configMenu = new _menu();
					const scriptDefaultArgs = { properties: [{ ...menu_properties }, () => { return menu_prefix; }] };
					const Macros = menu.Macros;
					configMenu.newCondEntry({
						entryText: 'Macros', condFunc: (args = { ...scriptDefaultArgs, ...defaultArgs }) => {
							args.properties = getPropertiesPairs(args.properties[0], args.properties[1](), 0); // Update properties from the panel. Note () call on second arg
							let propMacros = JSON.parse(args.properties['macros'][1]);
							Macros.set(propMacros); // Restore macros list on first init
							configMenu.newEntry({ entryText: 'Execute macros:', func: null, flags: MF_GRAYED });
							configMenu.newSeparator();
							configMenu.newEntry({
								entryText: 'None', func: () => {
									this.buttonsProperties['macro'][1] = '';
									overwriteProperties(this.buttonsProperties);
								}
							});
							configMenu.newSeparator();
							// List
							propMacros.forEach((macro) => {
								if (menu.isSeparator(macro)) { // Create separators
									configMenu.newSeparator();
								} else {
									configMenu.newEntry({
										entryText: macro.name, func: () => {
											this.buttonsProperties['macro'][1] = 'Macros\\' + macro.name;
											overwriteProperties(this.buttonsProperties); // Force overwriting
										}
									});
								}
							});
							configMenu.newCheckMenuLast((o) => {
								const name = this.buttonsProperties['macro'][1].replace('Macros\\', '');
								const idx = o.findIndex((macro) => macro.name === name);
								return idx !== -1 ? idx + 1 : 0;
							}, propMacros);
							if (!propMacros.length) { configMenu.newEntry({ entryText: '(none saved yet)', func: null, flags: MF_GRAYED }); }
							configMenu.newSeparator();
							configMenu.newEntry({
								entryText: 'Button name...', func: () => {
									const newName = utils.InputBox(window.ID, 'Enter button name:', window.Name + ': Customizable Playlist Tools Macro Button', this.buttonsProperties.customName[1]).toString();
									if (!newName.length) {
										return;
									} else {
										this.buttonsProperties.customName[1] = newName;
										overwriteProperties(this.buttonsProperties); // Force overwriting
										this.adjustNameWidth(newName);
									}
								}
							});
						}
					});
					configMenu.btn_up(this.currX, this.currY + this.currH);
				} else {
					if (this.buttonsProperties['customName'][1] === 'Customize!') { // NOSONAR
						const newName = utils.InputBox(window.ID, 'Enter button name. Then configure macro associated to your liking.', window.Name + ': Customizable Playlist Tools Macro Button').toString();
						if (!newName.length) {
							return;
						} else {
							this.buttonsProperties.customName[1] = newName;
							overwriteProperties(this.buttonsProperties); // Force overwriting
							this.adjustNameWidth(newName);
						}
					} else if (this.buttonsProperties['macro'][1].length) {
						menu.btn_up(void (0), void (0), void (0), this.buttonsProperties['macro'][1]); // Don't clear menu on last call
					}
				}
			} else { fb.ShowPopupMessage('WARNING: CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS', 'Playlist Tools'); }
		},
		description: function () {
			return (isPlaylistToolsLoaded()
				? 'Execute Playlist Tools Menu assigned macros:\nEntry:\t' + (this.buttonsProperties.macro[1] || '-None-') +
				(
					typeof barProperties === 'undefined' || barProperties.bTooltipInfo[1]
						? '\n-----------------------------------------------------\n(L. Click to execute macro)\n(Shift + L. Click to configure macro)'
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