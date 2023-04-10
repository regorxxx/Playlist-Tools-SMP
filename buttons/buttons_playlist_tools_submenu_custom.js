'use strict';
//10/04/23

/* 
	Playlist Tools Submenu Custom
	-------------------
	Calls a configurable submenu from Playlist Tools
 */

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\menu_xxx.js');
try {window.DefineScript('Playlist Tools Macros', {author:'xxx', features: {drag_n_drop: false}});} catch (e) {console.log('Playlist Tools SubMenu (CUSTOM) Button loaded.');} //May be loaded along other buttons

var prefix = 'ptc_';
prefix = getUniquePrefix(prefix, '_'); // Puts new ID before '_'
var newButtonsProperties = { //You can simply add new properties here
	customName: ['Name for the custom UI button', 'Customize!', {func: isStringWeak}, 'Customize!'],
	menu: 		['Menu entry', '', {func: isStringWeak}, ''],
	bIconMode:	['Icon-only mode?', false, {func: isBoolean}, false]
};
setProperties(newButtonsProperties, prefix); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix); // And retrieve
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Playlist Tools SubMenu (CUSTOM)': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth(newButtonsProperties.customName[1], _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) /_scale(buttonsBar.config.scale), h: 22}, newButtonsProperties.customName[1], function (mask) {
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
							overwriteProperties(this.buttonsProperties); // Force overwriting
							this.setIcon(menuObj.menuName);
							this.adjustNameWidth(menuObj.menuName);
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
									overwriteProperties(this.buttonsProperties); // Force overwriting
									this.setIcon(subMenuObj.menuName);
									this.adjustNameWidth(subMenuObj.menuName);
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
						buttonMenu.btn_up(this.currX, this.currY + this.currH, void(0), void(0), false, (val) => {console.log('Called: ' + val); _setClipboardData(val);});
					} else {
						buttonMenu.btn_up(this.currX, this.currY + this.currH);
					}
				}
			}
		} else {fb.ShowPopupMessage('WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS', 'Playlist Tools');}
	}, null, void(0), (parent) => {
		return (isPlaylistToolsLoaded() 
			? (	parent.buttonsProperties.menu[1].length 
				? menuTooltip() 
				: 'Executes Playlist Tools assigned sub-menu' + (
					getPropertiesPairs(menu_panelProperties, menu_prefix_panel, 0).bTooltipInfo[1] 
						? '\n-----------------------------------------------------\n(L. Click to configure sub-menu)' 
						: ''
					)
			) : 'WARNING! CAN\'T USE THIS BUTTON WITHOUT PLAYLIST TOOLS');
	}, null, newButtonsProperties, chars.wrench, void(0), 
	{
		setIcon: (parent, name) => {
			let icon;
			switch (name.toLowerCase()) {
				case 'most played tracks from...': icon = chars.calendar; break;
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
					case 'find now playing track in...':
					case 'find track(s) in...': icon = chars.search; break;
					case 'find now playing track in...': icon = chars.search; break;
					case 'remove track(s) from...': icon = chars.searchMinus; break;
					case 'send selection to...':
					case 'move selection to...': icon = chars.send; break;
					case 'select...': icon = chars.checkSquareAlt; break;
					case 'expand...': icon = chars.expand; break;
					case 'jump...': icon = chars.nextCircle; break;
				case 'other tools': icon = chars.wrench; break;
					case 'check tags':
					case 'write tags': icon = chars.tags; break;
					case 'playlist revive': icon = chars.recycle; break;
					case 'import track list': icon = chars.fileSound; break;
					case 'iplaylist history': icon = chars.history; break;
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
	}, void(0),
	(parent) => {
		parent.setIcon(parent.text);
	}
	),
});

// Helpers
function isPlaylistToolsLoaded() {return (typeof specialMenu !== 'undefined' && typeof configMenu !== 'undefined' && typeof scriptName !== 'undefined' && typeof menu !== 'undefined');}