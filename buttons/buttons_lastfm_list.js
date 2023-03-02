'use strict';
//01/03/23

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
	// lastURL:	['Last.fm url cache', '', {func: isStringWeak}, ''],
	// lastArtist:	['Last.fm artist cache', '', {func: isStringWeak}, ''],
	// lastDate:	['Last.fm date cache', '', {func: isStringWeak}, ''],
	// lastTag:	['Last.fm tag cache', '', {func: isStringWeak}, ''],
};
// setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
// newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Last.fm Tools': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Last.fm', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 30 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22}, 'Last.fm', function (mask) {
			if (this.lastList) {
				if (mask === MK_SHIFT) {
					settingsMenu(this, true, ['buttons_lastfm_list.js']).btn_up(this.currX, this.currY + this.currH);
				} else {
					const menu = _lastListMenu(this.lastList);
					menu.btn_up(this.currX, this.currY + this.currH);
					const last = Input.data.lastInput;
					// if (menu.lastCall.startsWith('By date')) {
						// this.buttonProperties.lastDate[1] = last;
					// } else if (menu.lastCall.startsWith('By tag')) {
						// this.buttonProperties.lastTag[1] = last;
					// } else if (menu.lastCall.startsWith('By artist')) {
						// this.buttonProperties.lastArtist[1] = last;
					// } else if (menu.lastCall.startsWith('By URL')) {
						// this.buttonProperties.lastURL[1] = last;
					// }
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