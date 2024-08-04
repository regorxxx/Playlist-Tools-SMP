'use strict';
//04/08/24

/*
	Integrates Last.fm recommendations statistics within foobar2000 library.
*/

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, globTags:readable, globQuery:readable, doOnce:readable, MF_GRAYED:readable, VK_CONTROL:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isStringWeak:readable, _t:readable, _b:readable, isInt:readable, isJSON:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_tags.js');
/* global checkQuery:readable */
include('..\\main\\main_menu\\main_menu_custom.js'); // Dynamic SMP menu
/* global deleteMainMenuDynamic:readable, bindDynamicMenus:readable */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\main\\last_list\\last_list.js');
/* global LastList:readable */
include('..\\main\\last_list\\last_list_menu.js');
/* global _lastListMenu:readable */
include('..\\main\\bio\\bio_tags.js');
/* global lastfmListeners:readable */
var prefix = 'lfm'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try {window.DefineScript('Last.fm Tools Button', {author:'regorxxx', version, features: {drag_n_drop: false}});} catch (e) { /* May be loaded along other buttons */ }
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	lastURL:		['Url custom input', '', {func: isStringWeak}, ''],
	lastArtist:		['Artist custom input', '', {func: isStringWeak}, ''],
	lastDate:		['Date custom input', '', {func: isStringWeak}, ''],
	lastTag:		['Tag custom input', '', {func: isStringWeak}, ''],
	lastUser:		['User custom input', '', {func: isStringWeak}, ''],
	lastAlbum:		['Album custom input', '', {func: isStringWeak}, ''],
	bBioTags:		['Use tags from Bio panel', true, {func: isBoolean}, true],
	bIconMode:		['Icon-only mode?', false, {func: isBoolean}, false],
	bDynamicMenus:	['Expose menus at  \'File\\Spider Monkey Panel\\Script commands\'', false, {func: isBoolean}, false],
	forcedQuery: 	['Forced query to pre-filter database', globQuery.filter, {func: (query) => {return checkQuery(query, true);}}, globQuery.filter],
	tags: 			['Tags remap for lookups', JSON.stringify([
		{name: 'Artist top tracks',		tf: [...new Set([globTags.artistRaw, 'ARTIST', 'ALBUM ARTIST'])], type: 'ARTIST'},
		{name: 'Artist shuffle',		tf: [...new Set([globTags.artistRaw, 'ARTIST', 'ALBUM ARTIST'])], type: 'ARTIST_RADIO'},
		{name: 'Similar artists to',	tf: [...new Set([globTags.artistRaw, 'ARTIST', 'ALBUM ARTIST'])], type: 'SIMILAR'},
		{name: 'Similar artists',		tf: [...new Set(['SIMILAR ARTISTS SEARCHBYDISTANCE', 'LASTFM_SIMILAR_ARTIST', 'SIMILAR ARTISTS LAST.FM', 'SIMILAR ARTISTS LISTENBRAINZ'])], type: 'ARTIST'},
		// {name: 'Similar tracks',		tf: [...new Set(['TITLE', 'ARTIST', 'ALBUM'])], type: 'TITLE'},
		{name: 'Album tracks',			tf: [...new Set(['ALBUM', globTags.artistRaw])], type: 'ALBUM_TRACKS'},
		{ name: 'Genre & Style(s)', tf: [...new Set([globTags.genre, globTags.style, 'GENRE', 'STYLE', 'ARTIST GENRE LAST.FM', 'ARTIST GENRE ALLMUSIC', 'ALBUM GENRE LAST.FM', 'ALBUM GENRE ALLMUSIC', 'ALBUM GENRE WIKIPEDIA', 'ARTIST GENRE WIKIPEDIA'])], type: 'TAG'},
		{name: 'Folksonomy & Date(s)',	tf: [...new Set([globTags.folksonomy, 'FOLKSONOMY', 'OCCASION', 'ALBUMOCCASION', globTags.locale, 'LOCALE', 'LOCALE LAST.FM', 'DATE', 'LOCALE WORLD MAP'])], type: 'TAG'},
		{name: 'Mood & Theme(s)',	tf: [...new Set([globTags.mood, 'MOOD','THEME', 'ALBUMMOOD', 'ALBUM THEME ALLMUSIC', 'ALBUM MOOD ALLMUSIC'])], type: 'TAG'},
	])],
	cacheTime:		['YouTube lookups cache expiration', 86400000, {func: isInt}, 86400000],
};
newButtonsProperties.tags.push({ func: isJSON }, newButtonsProperties.tags[1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Last.fm Tools': new ThemedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Last.fm', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 30 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22}, 'Last.fm', function (mask) {
		const properties = this.buttonsProperties;
		// Retrieve cache
		doOnce('Last.fm Tools Cache', () => { // Add url cache on internal format
			if (properties.lastURL[1].length) {this.lastList.url = properties.lastURL[1];}
		})();
		this.lastList.cacheTime = properties.cacheTime[1];
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
									const prefix = 'Last.fm: ';
									return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
								}
							});
						} else {deleteMainMenuDynamic('Last.fm Tools');}
					}
				},
				(menu) => { // Append this menu entries to the config menu
					const menuName = menu.getMainMenuName();
					menu.newEntry({menuName: menu.getMainMenuName(), entryText: 'sep'});
					const subMenuName = menu.newMenu('Tag remap...', menuName);
					menu.newEntry({menuName: subMenuName, entryText: 'Available entries: (Ctrl + Click to reset)', flags: MF_GRAYED});
					menu.newEntry({menuName: subMenuName, entryText: 'sep'});
					const tags = JSON.parse(properties.tags[1]);
					tags.forEach((tag) => {
						menu.newEntry({menuName: subMenuName, entryText: tag.name + (tag.tf && tag.tf.length ? '' : '\t-disabled-'), func: () => {
							let input;
							if (utils.IsKeyPressed(VK_CONTROL)) {
								const defTag = JSON.parse(properties.tags[3])
									.find((defTag) => tag.name === defTag.name);
								if (defTag) {input = defTag.tf;}
							} else {
								input = Input.json('array strings', tag.tf, 'Enter tag(s) or TF expression(s):\n(JSON)\n\nSetting it to [] will disable the menu entry.', 'Last.fm Tools', '["ARTIST","ALBUM ARTIST"]', void(0), true);
								if (input === null) {return;}
							}
							tag.tf = input;
							properties.tags[1] = JSON.stringify(tags);
							overwriteProperties(properties);
						}});
					});
					menu.newEntry({ menuName: subMenuName, entryText: 'sep' });
					menu.newEntry({
						menuName: subMenuName, entryText: 'Restore defaults...', func: () => {
							properties.tags[1] = properties.tags[3];
							overwriteProperties(properties);
						}
					});
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
			if (key && Input.lastInput !== null && !Input.isLastEqual) {
				properties[key][1] = Input.lastInput.toString();
				overwriteProperties(properties);
			}
		}
	}, null, void(0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		const sel = fb.GetFocusItem();
		let info = '';
		if (sel) {
			let tfo = fb.TitleFormat(
				'$puts(info,' + globTags.artist + ' / %TRACK% - %TITLE%)' +
				'Current track:	$ifgreater($len($get(info)),50,$cut($get(info),50)...,$get(info))' +
				'$crlf()Date:		' + _b(globTags.date) +
				'$puts(info,' + _b(_t(globTags.genre)) + ')' +
				'$crlf()Genres:		$ifgreater($len($get(info)),50,$cut($get(info),50)...,$get(info))' +
				'$puts(info,' + _b(_t(globTags.style)) + ')' +
				'$crlf()Styles:		$ifgreater($len($get(info)),50,$cut($get(info),50)...,$get(info))' +
				'$puts(info,' + _b(_t(globTags.mood)) + '[,%THEME%][,%ALBUMMOOD%])' +
				'$crlf()Moods:		$ifgreater($len($get(info)),50,$cut($get(info),50)...,$get(info))'
			);
			info += tfo.EvalWithMetadb(sel);
		} else {info += 'No track selected';}
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
	}, prefix, newButtonsProperties, chars.lastFm, void(0),
	{lastList: new LastList({forcedQuery: newButtonsProperties.forcedQuery[1]}), bioSelectionMode: 'Prefer nowplaying', bioTags: {}},
	lastfmListeners,
	(parent) => {
		// Create dynamic menus
		if (parent.buttonsProperties.bDynamicMenus[1]) {
			bindDynamicMenus({
				menu: _lastListMenu.bind(parent),
				parentName: 'Last.fm Tools',
				args: {bSimulate: false, bDynamicMenu: true}, // On SMP main menu, entries are not split by tag
				entryCallback: (entry) => {
					const prefix = 'Last.fm: ';
					return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
				}
			});
		}
	},
	{scriptName: 'Playlist-Tools-SMP', version}
	),
});