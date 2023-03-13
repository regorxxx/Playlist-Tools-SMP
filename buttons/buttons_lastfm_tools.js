'use strict';
//13/03/23

/* 
	Integrates Last.fm recommendations statistics within foobar2000 library.
*/

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');
{	// Load package dependencies
	const jsPackage = utils.GetPackageInfo('{152DE6E6-A5D6-4434-88D8-E9FF00130BF9}');
	if (jsPackage) {
		try {
			include(jsPackage.Directories.Root + '\\scripts\\LastList.js');
		} catch (e) {
			fb.ShowPopupMessage('foo-last-list package error.\n\nPlease re-download or report to its author:\nhttps://github.com/L3v3L/foo-last-list-smp', 'Last.fm Tools');
		}
		if (typeof LastList !== 'undefined') {
			include('..\\main\\last_list\\last_list_menu.js');
			include('..\\main\\bio\\bio_tags.js');
		}
	} else {
		fb.ShowPopupMessage('foo-last-list package is missing or outdated.\nId: {152DE6E6-A5D6-4434-88D8-E9FF00130BF9}\n\nPlease download and install it as package:\nhttps://github.com/L3v3L/foo-last-list-smp', 'Last.fm Tools');
	}
}
var prefix = 'lfm';

try {window.DefineScript('Last.fm Tools Button', {author:'xxx', features: {drag_n_drop: false}});} catch (e) {/* console.log('Last.fm Tools Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	lastURL:		['Last.fm url cache', '', {func: isStringWeak}, ''],
	lastArtist:		['Last.fm artist cache', '', {func: isStringWeak}, ''],
	lastDate:		['Last.fm date cache', '', {func: isStringWeak}, ''],
	lastTag:		['Last.fm tag cache', '', {func: isStringWeak}, ''],
	lastUser:		['Last.fm user cache', '', {func: isStringWeak}, ''],
	lastAlbum:		['Last.fm album cache', '', {func: isStringWeak}, ''],
	bBioTags:		['Use tags from Bio panel?', false, {func: isBoolean}, false],
	bIconMode:		['Icon-only mode?', false, {func: isBoolean}, false],
	bDynamicMenus:	['Expose menus at  \'File\\Spider Monkey Panel\\Script commands\'', false, {func: isBoolean}, false],
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Last.fm Tools': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Last.fm', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 30 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22}, 'Last.fm', function (mask) {
			if (this.lastList) {
				doOnce('Last.fm Tools Cache', () => { // Add url cache on internal format
					if (this.buttonsProperties.lastURL[1].length) {this.lastList.url = this.buttonsProperties.lastURL[1];}
				})();
				// Retrieve cache
				const properties = this.buttonsProperties;
				const cache = Object.fromEntries(['lastURL', 'lastArtist', 'lastDate', 'lastTag', 'lastAlbum', 'lastUser'].map((key) => [key, properties[key][1]]));
				if (mask === MK_SHIFT) {
					settingsMenu(
						this, true, ['buttons_lastfm_tools.js'],
						{
							bBioTags: {
								popup:	'Used along WilB\'s Biography Script, if selection mode on bio panel is set' +
									'\nto \'Follow selected track\', additional tags are shown on the submenus' +
									'\ndirectly provided by the Bio script (like the \'locale\' tag). Using' +
									'\n\'Prefer now playing\' mode will disable this feature unless the selected' +
									'\ntrack is also the now playing track when using the button. In any case' +
									'\n\nBio panel must be set to notify tags to other panels to make it work' +
									'\n(this setting is disabled by default). It may be found on the HTML options' +
									'\npanel or the \'biography.cfg\' file. Ask to its author for further support.'
							},
							bDynamicMenus: {
								popup: 'Remember to set different panel names to every buttons toolbar, otherwise' +
								'\nmenus will not be properly associated to a single panel.' +
								'\n\nShift + Win + R. Click -> Configure panel... (\'edit\' at top)'
							}
						},
						{bDynamicMenus: 
							(value) => {
								if (value) {
									bindDynamicMenus({
										menu: _lastListMenu.bind(this),
										parentName: 'Last.fm Tools',
										args: {bSimulate: false, bDynamicMenu: true}, // On SMP main menu, entries are not split by tag
										entryCallback: (entry) => {
											const prefix = 'Last.fm: '
											return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
										}
									});
								} else {deleteMainMenuDynamic('Last.fm Tools');}
							}
						}
					).btn_up(this.currX, this.currY + this.currH);
				} else {
					// Call menu
					const menu = _lastListMenu.bind(this)();
					menu.btn_up(this.currX, this.currY + this.currH);
					// Cache input values
					let key;
					if (/by date/i.test(menu.lastCall)) {key = 'lastDate';} 
					else if (/by tag/i.test(menu.lastCall)) {key = 'lastTag';} 
					else if (/by artist|by similar artist to/i.test(menu.lastCall)) {key = 'lastArtist';} 
					else if (/by user/i.test(menu.lastCall)) {key = 'lastUser';}
					else if (/by album/i.test(menu.lastCall)) {key = 'lastAlbum';}
					else if (/by url/i.test(menu.lastCall)) {
						const url = (this.lastList.url || '').toString();
						if (url && url.length && url !== properties.lastURL[1]) {
							properties.lastURL[1] = this.lastList.url;
							overwriteProperties(properties);
						}
					}
					if (key && Input.data.lastInput !== null && !Input.isLastEqual) {
						properties[key][1] = Input.data.lastInput.toString();
						overwriteProperties(properties);
					}
				}
			} else {
				fb.ShowPopupMessage('foo-last-list package is missing or outdated.\nId: {152DE6E6-A5D6-4434-88D8-E9FF00130BF9}\n\nPlease download and install it as package:\nhttps://github.com/L3v3L/foo-last-list-smp', 'Last.fm Tools');
			}
		}, null, void(0), (parent) => {
			const bShift = utils.IsKeyPressed(VK_SHIFT);
			const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
			const sel = fb.GetFocusItem();
			let info = '';
			if (sel) {
				let tfo = fb.TitleFormat(
						'Current track:	%ARTIST% / %TRACK% - %TITLE%' +
						'$crlf()Date:		[' + globTags.date + ']' +
						'$crlf()Genres:		[%' + globTags.genre + '%]' + 
							// ['Album Genre AllMusic', 'Artist Genre AllMusic', 'Album Genre Wikipedia', 'Artist Genre Wikipedia'].map((t) => parent.bioTags[t]).flat(Infinity).filter(Boolean).join(', ') +
						'$crlf()Styles:		[%' + globTags.style + '%]' +
						'$crlf()Moods:		[%' + globTags.mood + '%][,%THEME%][,%ALBUMMOOD%]'
							// ['Album Mood AllMusic', 'Album Theme AllMusic'].map((t) => parent.bioTags[t]).flat(Infinity).filter(Boolean).join(', ')
					);
				info += tfo.EvalWithMetadb(sel);
			} else {info += '\nNo track selected';}
			info += '\nBio tags:	' + (parent.buttonsProperties.bBioTags[1] 
				? Object.keys(parent.bioTags).length
					? 'Found' 
					: 'Not found'
				: 'Disabled');
			info += parent.bioSelectionMode === 'Prefer nowplaying' ? ' (now playing)' : ' (selection)';
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift + L. Click to open config menu)';
			}
			return info;
		}, prefix, newButtonsProperties, folders.xxx + 'images\\icons\\lastfm_64.png', null,
		{lastList: typeof LastList !== 'undefined' ? new LastList() : null, bioSelectionMode: 'Prefer nowplaying', bioTags: {}},
		typeof lastfmListeners !== 'undefined' ? lastfmListeners : null,
		(parent) => {
			// Create dynamic menus
			if (parent.buttonsProperties.bDynamicMenus[1]) {
				bindDynamicMenus({
					menu: _lastListMenu.bind(parent),
					parentName: 'Last.fm Tools',
					args: {bSimulate: false, bDynamicMenu: true}, // On SMP main menu, entries are not split by tag
					entryCallback: (entry) => {
						const prefix = 'Last.fm: '
						return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
					}
				});
			}
		}
	),
});