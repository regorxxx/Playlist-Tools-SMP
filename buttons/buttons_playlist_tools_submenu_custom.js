'use strict';
//03/01/24

/*
	Playlist Tools Submenu Custom
	-------------------
	Calls a configurable submenu from Playlist Tools
 */

/* global menu:readable, menu_panelProperties:readable, menu_prefix_panel:readable, menuTooltip:readable, _setClipboardData:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, MK_CONTROL:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isStringWeak:readable, isFunction:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable  */

var prefix = 'ptc_'; // NOSONAR[global]
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'
var newButtonsProperties = { // NOSONAR[global]
	customName: ['Name for the custom UI button', 'Customize!', { func: isStringWeak }, 'Customize!'],
	menu: ['Menu entry', '', { func: isStringWeak }, ''],
	bIconMode: ['Icon-only mode?', false, { func: isBoolean }, false]
};
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix); // And retrieve
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playlist Tools SubMenu (CUSTOM)': new ThemedButton({ x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 }, newButtonsProperties.customName[1], function (mask) {
		if (isPlaylistToolsLoaded()) {
			const buttonMenu = new _menu();
			const mainMenu = menu.getMenus()[0];
			if (mask === MK_SHIFT || this.buttonsProperties['customName'][1] === 'Customize!' || !this.buttonsProperties['menu'][1].length) {
				const menuList = menu.getMenus().slice(1).filter((menuObj) => { return menuObj.subMenuFrom === mainMenu.menuName; });
				menuList.forEach((menuObj) => {
					const subMenuList = [menuObj, 'sep'].concat(menu.getMenus().slice(1).filter((newMenuObj) => { return newMenuObj.subMenuFrom === menuObj.menuName; }));
					if (subMenuList.length === 2) {
						buttonMenu.newEntry({
							entryText: menuObj.menuName + '\t (main)', func: () => {
								this.buttonsProperties['menu'][1] = menuObj.menuName;
								this.buttonsProperties.customName[1] = menuObj.menuName;
								overwriteProperties(this.buttonsProperties); // Force overwriting
								this.setIcon(menuObj.menuName);
								this.adjustNameWidth(menuObj.menuName);
							}
						});
					} else {
						const menuName = buttonMenu.newMenu(menuObj.menuName);
						subMenuList.forEach((subMenuObj, i) => {
							if (subMenuObj === 'sep') {
								buttonMenu.newEntry({ menuName, entryText: 'separator' });
							} else {
								buttonMenu.newEntry({
									menuName, entryText: subMenuObj.menuName + (i === 0 ? '\t (main)' : ''), func: () => {
										this.buttonsProperties['menu'][1] = subMenuObj.menuName;
										this.buttonsProperties.customName[1] = subMenuObj.menuName;
										overwriteProperties(this.buttonsProperties); // Force overwriting
										this.setIcon(subMenuObj.menuName);
										this.adjustNameWidth(subMenuObj.menuName);
									}
								});
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
						if (Object.hasOwn(entryObj, 'subMenuFrom')) {
							if (entryObj.subMenuFrom === currentMenu || tree.has(entryObj.subMenuFrom)) {
								tree.add(entryObj.menuName);
								return true;
							} else {
								return false;
							}
						}
						else { return entryObj.menuName === currentMenu || tree.has(entryObj.menuName); }
					});
					const mainMenu = buttonMenu.getMenus()[0];
					entries.forEach((entryObj) => {
						if (Object.hasOwn(entryObj, 'subMenuFrom')) {
							buttonMenu.newMenu(entryObj.menuName, entryObj.subMenuFrom === currentMenu ? mainMenu.menuName : entryObj.subMenuFrom);
						} else {
							const menuName = entryObj.menuName === currentMenu ? mainMenu.menuName : entryObj.menuName;
							buttonMenu.newEntry({
								entryText: entryObj.entryText, menuName, func: () => {
									menu.btn_up(void (0), void (0), void (0), entryObj.menuName + '\\' + (isFunction(entryObj.entryText) ? entryObj.entryText() : entryObj.entryText)); // Don't clear menu on last call
								}, flags: entryObj.flags
							});
						}
					});
					if (mask === MK_CONTROL) { // Simulate menus to get names
						buttonMenu.btn_up(this.currX, this.currY + this.currH, void (0), void (0), false, (val) => { console.log('Called: ' + val); _setClipboardData(val); });
					} else {
						buttonMenu.btn_up(this.currX, this.currY + this.currH);
					}
				}
			}
		} else { fb.ShowPopupMessage('WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS', 'Playlist Tools'); }
	}, null, void (0), (parent) => {
		return (isPlaylistToolsLoaded()
			? (parent.buttonsProperties.menu[1].length
				? menuTooltip()
				: 'Executes Playlist Tools assigned sub-menu' + (
					getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0).bTooltipInfo[1]
						? '\n-----------------------------------------------------\n(L. Click to configure sub-menu)'
						: ''
				)
			) : 'WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS');
	}, null, newButtonsProperties, chars.wrench, void (0),
	{
		setIcon: (parent, name) => {
			let icon;
			switch (name.toLowerCase()) { // NOSONAR
				case 'most played tracks at...': icon = chars.calendar; break;
				case 'top played tracks from...': icon = chars.calendarPlus; break;
				case 'top rated tracks from...': icon = chars.heartOff; break;
				case 'search same by tags...': icon = chars.searchPlus; break;
				case 'standard queries...':
				case 'dynamic queries...': icon = chars.filter; break;
				case 'special playlists...': icon = chars.wand; break;
				case 'playlist manipulation': icon = chars.fileWhite; break;
				case 'duplicates and tag filtering': icon = chars.duplicates; break;
				case 'query filtering': icon = chars.filter; break;
				case 'harmonic mix': icon = chars.sortBarsAsc; break;
				case 'cut playlist length to...': icon = chars.cut; break;
				case 'merge with playlist...':
				case 'intersect with playlist...':
				case 'difference with playlist...': icon = chars.sitemap; break;
				case 'send playlist\'s tracks to...': icon = chars.send; break;
				case 'go to playlist...': icon = chars.fileWhite; break;
				case 'close playlist...': icon = chars.close; break;
				case 'lock playlist...': icon = chars.lock; break;
				case 'unlock playlist...': icon = chars.unlock; break;
				case 'switch lock playlist...': icon = chars.unlockAlt; break;
				case 'selection manipulation': icon = chars.checkSquareAlt; break;
				case 'sort...':
				case 'advanced sort...': icon = chars.sortBarsAsc; break;
				case 'scatter by tags':
				case 'intercalate by tags': icon = chars.exchange; break;
				case 'shuffle by tags': icon = chars.shuffle; break;
				case 'group by tags': icon = chars.link; break;
				case 'find now playing track in...':
				case 'find track(s) in...': icon = chars.search; break;
				case 'remove track(s) from...': icon = chars.searchMinus; break;
				case 'send selection to...':
				case 'move selection to...': icon = chars.send; break;
				case 'select by query...':
				case 'select...': icon = chars.checkSquareAlt; break;
				case 'expand...': icon = chars.expand; break;
				case 'jump...': icon = chars.nextCircle; break;
				case 'other tools': icon = chars.wrench; break;
				case 'check tags':
				case 'write tags': icon = chars.tags; break;
				case 'playlist revive': icon = chars.recycle; break;
				case 'import track list': icon = chars.fileSound; break;
				case 'playlist history': icon = chars.history; break;
				case 'pools': icon = chars.music; break;
				case 'macros': icon = chars.hourglassHalf; break;
				case 'script integration':
				case 'configuration': icon = chars.cogs; break;
				case 'readmes...': icon = chars.question; break;
				default: icon = chars.wrench; break;
			}
			if (icon !== parent.icon) {
				parent.icon = icon;
				parent.iconWidth = _gr.CalcTextWidth(parent.icon, parent.gFontIcon);
			}
		}
	}, void (0),
	(parent) => {
		parent.setIcon(parent.text);
	}
	),
});

// Helpers
function isPlaylistToolsLoaded() { return (typeof specialMenu !== 'undefined' && typeof configMenu !== 'undefined' && typeof scriptName !== 'undefined' && typeof menu !== 'undefined'); }