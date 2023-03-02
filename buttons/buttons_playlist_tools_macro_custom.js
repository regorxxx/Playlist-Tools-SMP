'use strict';
//28/02/23

/* 
	Playlist Tools Macro custom
	-------------------
	Shortcut to configurable macro from Playlist Tools
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\menu_xxx.js');

var prefix = 'mac';
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'
var newButtonsProperties = { //You can simply add new properties here
	customName: ['Name for the custom UI button', 'Customize!', {func: isStringWeak}, 'Customize!'],
	macro: 		['Macro entry', '', {func: isStringWeak}, ''],
	bIconMode:		['Icon-only mode?', false, {func: isBoolean}, false]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0); // And retrieve
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playlist Tools Macros (CUSTOM)': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) /_scale(buttonsBar.config.scale), h: 22}, newButtonsProperties.customName[1], function (mask) {
		if (isPlaylistToolsLoaded()) {
			if (mask === MK_SHIFT) {
				const configMenu = new _menu();
				const scriptDefaultArgs = {properties: [{...menu_properties}, () => {return menu_prefix;}]};
				configMenu.newCondEntry({entryText: 'Macros', condFunc: (args = {...scriptDefaultArgs, ...defaultArgs}) => {
					args.properties = getPropertiesPairs(args.properties[0], args.properties[1](), 0); // Update properties from the panel. Note () call on second arg
					let propMacros = JSON.parse(args.properties['macros'][1]);
					if (!macros.length && propMacros.length) {macros = propMacros;} // Restore macros list on first init
					configMenu.newEntry({entryText: 'Execute macros:', func: null, flags: MF_GRAYED});
					configMenu.newEntry({entryText: 'sep'});
					configMenu.newEntry({entryText: 'None', func: () => {
						this.buttonsProperties['macro'][1] = '';
						overwriteProperties(this.buttonsProperties);
					}});
					configMenu.newEntry({entryText: 'sep'});
					// List
					propMacros.forEach((macro) => {
						if (macro.name === 'sep') { // Create separators
							configMenu.newEntry({entryText: 'sep'});
						} else {
							configMenu.newEntry({entryText: macro.name, func: () => {
								this.buttonsProperties['macro'][1] = 'Macros\\' + macro.name;
								overwriteProperties(this.buttonsProperties); // Force overwriting
							}});
						}
					});
					const options = propMacros.map((item) => {return item.name;}).filter((item) => {return item !== 'sep';})
					configMenu.newCheckMenu(configMenu.getMainMenuName(), 'None', options[options.length - 1], () => {
						const name = this.buttonsProperties['macro'][1].replace('Macros\\','');
						const idx = options.indexOf(name);
						return idx !== -1 ? idx + 1 : 0;
					});
					if (!propMacros.length) {configMenu.newEntry({entryText: '(none saved yet)', func: null, flags: MF_GRAYED});}
				}});
				configMenu.btn_up(this.currX, this.currY + this.currH);
			} else {
				if (this.buttonsProperties['customName'][1] === 'Customize!') {
					const newName = utils.InputBox(window.ID, 'Enter button name. Then configure macro associated to your liking.', window.Name + ': Customizable Playlist Tools Macro Button').toString();
					if (!newName.length) {
						return;
					} else {
						this.buttonsProperties.customName[1] = newName;
						overwriteProperties(this.buttonsProperties); // Force overwriting
						this.adjustNameWidth(newName);
					}
				} else if (this.buttonsProperties['macro'][1].length) {
					menu.btn_up(void(0), void(0), void(0), this.buttonsProperties['macro'][1]); // Don't clear menu on last call
				}
			}
		} else {fb.ShowPopupMessage('WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS', 'Playlist Tools');}
	}, null, void(0), (parent) => {
		return (isPlaylistToolsLoaded() 
			? 'Executes Playlist Tools Menu assigned macros:\nEntry:\t' + (parent.buttonsProperties.macro[1] || '-None-') + (
				getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0).bTooltipInfo[1] 
					? '\n-----------------------------------------------------\n(L. Click to execute macro)\n(Shift + L. Click to configure macro)' 
					: ''
				) 
			: 'WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS');
	}, null, newButtonsProperties, chars.hourglass),
});

// Helpers
function isPlaylistToolsLoaded() {return (typeof specialMenu !== 'undefined' && typeof configMenu !== 'undefined' && typeof scriptName !== 'undefined' && typeof menu !== 'undefined');}