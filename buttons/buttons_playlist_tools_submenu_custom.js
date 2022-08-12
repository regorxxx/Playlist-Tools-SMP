'use strict';
//12/08/22

/* 
	Playlist Tools Submenu Custom
	-------------------
	Calls a configurable submenu from Playlist Tools
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');
try {window.DefinePanel('Playlist Tools Macros', {author:'xxx'});} catch (e) {console.log('Playlist Tools SubMenu (CUSTOM) Button loaded.');} //May be loaded along other buttons

var prefix = 'ptc_';
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'
var newButtonsProperties = { //You can simply add new properties here
	customName: ['Name for the custom UI button', 'Customize!'],
	menu: 		['Menu entry', ''],
};
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
buttonsBar.list.push(getPropertiesPairs(newButtonsProperties, prefix));
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix); // And retrieve
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playlist Tools SubMenu (CUSTOM)': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont('Segoe UI', 12)) + 50, h: 22}, newButtonsProperties.customName[1], function (mask) {
		if (isPlaylistToolsLoaded()) {
			const buttonMenu = new _menu();
			const mainMenu = menu.getMenus()[0];
			if (mask === MK_SHIFT || this.buttonsProperties['customName'][1] === 'Customize!' || !this.buttonsProperties['menu'][1].length) {
				const menuList = menu.getMenus().slice(1).filter((menuObj) => {return menuObj.subMenuFrom === mainMenu.menuName;});
				menuList.forEach((menuObj) => {
					const subMenuList = [menuObj, 'sep'].concat(menu.getMenus().slice(1).filter((newMenuObj) => {return newMenuObj.subMenuFrom === menuObj.menuName;}));
					if (subMenuList.length === 2) {
						buttonMenu.newEntry({entryText: menuObj.menuName + '\t (main)', func: () => {
							this.buttonsProperties['menu'][1] = menuObj.menuName;
							this.buttonsProperties.customName[1] = menuObj.menuName;
							this.text = menuObj.menuName;
							overwriteProperties(this.buttonsProperties); // Force overwriting
							window.Reload();
						}});
					} else {
						const menuName = buttonMenu.newMenu(menuObj.menuName);
						subMenuList.forEach((subMenuObj, i) => {
							if (subMenuObj === 'sep') {
								buttonMenu.newEntry({menuName, entryText: 'separator'});
							} else {
								buttonMenu.newEntry({menuName, entryText: subMenuObj.menuName + (i === 0 ? '\t (main)' : ''), func: () => {
									this.buttonsProperties['menu'][1] = subMenuObj.menuName;
									this.buttonsProperties.customName[1] = subMenuObj.menuName;
									this.text = subMenuObj.menuName;
									overwriteProperties(this.buttonsProperties); // Force overwriting
									window.Reload();
								}});
							}
						});
					}
				});
				buttonMenu.btn_up(this.currX, this.currY + this.currH);
			} else {
				const currentMenu = this.buttonsProperties['menu'][1];
				if (currentMenu.length) {
					const oriEntries = menu.getEntriesAll();
					const tree = new Set();
					const entries = oriEntries.filter((entryObj) => {
						if (entryObj.hasOwnProperty('subMenuFrom')) {
							if (entryObj.subMenuFrom === currentMenu || tree.has(entryObj.subMenuFrom)) {
								tree.add(entryObj.menuName);
								return true;
							} else {
								return false;
							}
						}
						else {return entryObj.menuName === currentMenu || tree.has(entryObj.menuName);}
					});
					const mainMenu = buttonMenu.getMenus()[0];
					entries.forEach((entryObj) => {
						if (entryObj.hasOwnProperty('subMenuFrom')) {
							buttonMenu.newMenu(entryObj.menuName, entryObj.subMenuFrom === currentMenu ? mainMenu.menuName : entryObj.subMenuFrom);
						} else {
							const menuName = entryObj.menuName === currentMenu ? mainMenu.menuName : entryObj.menuName;
							buttonMenu.newEntry({entryText: entryObj.entryText, menuName, func: () => {
								menu.btn_up(void(0), void(0), void(0), entryObj.menuName + '\\' + (isFunction(entryObj.entryText) ? entryObj.entryText() : entryObj.entryText)); // Don't clear menu on last call
							}, flags: entryObj.flags});
						}
					});
					if (mask === MK_CONTROL) { // Simulate menus to get names
						buttonMenu.btn_up(this.currX, this.currY + this.currH, void(0), void(0), false, _setClipboardData);
					} else {
						buttonMenu.btn_up(this.currX, this.currY + this.currH);
					}
				}
			}
		} else {fb.ShowPopupMessage('WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS', 'Playlist Tools');}
	}, null, void(0), (parent) => {
		return (isPlaylistToolsLoaded() ? (
			parent.buttonsProperties.menu[1].length ? menuTooltip() : 'Executes Playlist Tools assigned sub-menu' + 
				(getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0).bTooltipInfo[1] ? '\n-----------------------------------------------------\n(L. Click to configure sub-menu)' : '')
			) : 'WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS');
	}, null, newButtonsProperties, chars.wrench),
});

// Helpers
function isPlaylistToolsLoaded() {return (typeof specialMenu !== 'undefined' && typeof configMenu !== 'undefined' && typeof scriptName !== 'undefined' && typeof menu !== 'undefined');}