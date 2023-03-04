'use strict';
//04/03/23

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
			include(jsPackage.Directories.Root + '\\scripts\\last_list.js');
		} catch (e) {
			fb.ShowPopupMessage('foo-last-list package error.\n\nPlease re-download or report to its author:\nhttps://github.com/L3v3L/foo-last-list-smp', 'Last.fm Tools');
		}
		if (typeof _lastList !== 'undefined') {include('..\\main\\last_list\\last_list_menu.js');}
	} else {
	fb.ShowPopupMessage('foo-last-list package is missing. Id:\n{152DE6E6-A5D6-4434-88D8-E9FF00130BF9}\n\nPlease download and install it as package:\nhttps://github.com/L3v3L/foo-last-list-smp', 'Last.fm Tools');
	}
}
var prefix = 'lfm';

try {window.DefineScript('Last.fm Tools Button', {author:'xxx', features: {drag_n_drop: false}});} catch (e) {/* console.log('Last.fm Tools Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	lastURL:	['Last.fm url cache', '', {func: isStringWeak}, ''],
	lastArtist:	['Last.fm artist cache', '', {func: isStringWeak}, ''],
	lastDate:	['Last.fm date cache', '', {func: isStringWeak}, ''],
	lastTag:	['Last.fm tag cache', '', {func: isStringWeak}, ''],
	lastUser:	['Last.fm user cache', '', {func: isStringWeak}, ''],
	lastAlbum:	['Last.fm album cache', '', {func: isStringWeak}, ''],
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Last.fm Tools': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Last.fm', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 30 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22}, 'Last.fm', function (mask) {
			if (this.lastList) {
				doOnce('Last.fm Tools Cache', () => { // Add url cache on internal format
					if (this.buttonsProperties.lastURL[1].length) {this.lastList.cachedUrls.push(this.buttonsProperties.lastURL[1]);}
				})();
				if (mask === MK_SHIFT) {
					settingsMenu(this, true, ['buttons_lastfm_tools.js']).btn_up(this.currX, this.currY + this.currH);
				} else {
					// Retrieve cache
					const properties = this.buttonsProperties;
					const cache = Object.fromEntries(['lastURL', 'lastArtist', 'lastDate', 'lastTag', 'lastAlbum', 'lastUser'].map((key) => [key, properties[key][1]]));
					// Call menu
					const menu = _lastListMenu(this.lastList, cache);
					menu.btn_up(this.currX, this.currY + this.currH);
					// Cache input values
					let key;
					if (/by date/i.test(menu.lastCall)) {key = 'lastDate';} 
					else if (/by tag/i.test(menu.lastCall)) {key = 'lastTag';} 
					else if (/by artist|by similar artist/i.test(menu.lastCall)) {key = 'lastArtist';} 
					else if (/by user/i.test(menu.lastCall)) {key = 'lastUser';}
					else if (/by album/i.test(menu.lastCall)) {key = 'lastAlbum';}
					else if (/by url/i.test(menu.lastCall)) {
						const url = (this.lastList.cachedUrls[0] || '').toString();
						if (url && url.length && url !== properties.lastURL[1]) {
							properties.lastURL[1] = this.lastList.cachedUrls[0];
							overwriteProperties(properties);
						}
					}
					if (key && Input.data.lastInput !== null && !Input.isLastEqual) {
						properties[key][1] = Input.data.lastInput.toString();
						overwriteProperties(properties);
					}
				}
			} else {
				fb.ShowPopupMessage('foo-last-list package is missing. Id:\n{152DE6E6-A5D6-4434-88D8-E9FF00130BF9}\n\nPlease download and install it as package:\nhttps://github.com/L3v3L/foo-last-list-smp', 'Last.fm Tools');
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
						'$crlf()Styles:		[%' + globTags.style + '%]' +
						'$crlf()Moods:		[%' + globTags.mood + '%]'
					);
				info += tfo.EvalWithMetadb(sel);
			} else {info += '\nNo track selected';}
			if (bShift || bInfo) {
				info += '\n-----------------------------------------------------';
				info += '\n(Shift + L. Click to open config menu)';
			}
			return info;
		}, prefix, newButtonsProperties, folders.xxx + 'images\\icons\\lastfm_64.png', null,
		{lastList: typeof _lastList !== 'undefined' ? new _lastList() : null}
	),
});