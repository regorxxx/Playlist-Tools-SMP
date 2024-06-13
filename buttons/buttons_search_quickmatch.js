'use strict';
//12/06/24

/*
	Quickmatch same....
	Search tracks on library matching specific tag
	Expands [foo_quicksearch](https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Components/Quicksearch_UI_Element_%28foo_quicksearch%29#Context_menu) contextual menus functionality, and works with multiple selection
 */

/* global menu_panelProperties:readable */
include('..\\helpers\\helpers_xxx.js');
/* global globFonts:readable, MK_SHIFT:readable, VK_SHIFT:readable, globTags:readable, MF_STRING:readable, MF_GRAYED:readable, VK_CONTROL:readable, folders:readable, MF_MENUBREAK:readable */
include('..\\helpers\\buttons_xxx.js');
/* global getButtonVersion:readable, getUniquePrefix:readable, buttonsBar:readable, addButton:readable, ThemedButton:readable */
include('..\\helpers\\menu_xxx.js');
/* global _menu:readable  */
include('..\\helpers\\buttons_xxx_menu.js');
/* global settingsMenu:readable  */
include('..\\helpers\\menu_xxx_extras.js');
/* global _createSubMenuEditEntries:readable  */
include('..\\helpers\\helpers_xxx_prototypes.js');
/* global isBoolean:readable, isString:readable, isStringWeak:readable, isJSON:readable, _t:readable, _b:readable, _p:readable */
include('..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, utf8:readable, _jsonParseFileCheck:readable */
include('..\\helpers\\helpers_xxx_UI.js');
/* global _gdiFont:readable, _gr:readable, _scale:readable, chars:readable */
include('..\\helpers\\helpers_xxx_properties.js');
/* global setProperties:readable, getPropertiesPairs:readable, overwriteProperties:readable */
include('..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\helpers\\helpers_xxx_tags.js');
/* global queryJoin:readable */
include('..\\main\\filter_and_query\\dynamic_query.js');
/* global dynamicQueryProcess:readable, dynamicQuery:readable */
include('..\\main\\bio\\bio_tags.js');
/* global lastfmListeners:readable */

var prefix = 'qm'; // NOSONAR[global]
var version = getButtonVersion('Playlist-Tools-SMP'); // NOSONAR[global]

try { window.DefineScript('Quickmatch button', { author: 'regorxxx', version, features: { drag_n_drop: false } }); } catch (e) { /* May be loaded along other buttons */ }
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { // NOSONAR[global]
	playlistName: ['Playlist name', 'Search...', { func: isString }, 'Search...'],
	bIconMode: ['Icon-only mode?', false, { func: isBoolean }, false],
	entries: ['Quickmatch entries', JSON.stringify([
		{
			name: 'By Genre',
			tf: [...new Set([globTags.genre, 'GENRE', 'ARTIST GENRE LAST.FM', 'ARTIST GENRE ALLMUSIC', 'ALBUM GENRE LAST.FM', 'ALBUM GENRE ALLMUSIC', 'ALBUM GENRE WIKIPEDIA', 'ARTIST GENRE WIKIPEDIA'])]
		},
		{
			name: 'By Style',
			tf: [...new Set([globTags.style, 'STYLE'])]
		},
		{
			name: 'By Artist',
			tf: [...new Set([globTags.artistRaw, 'ARTIST', 'ALBUM ARTIST'])]
		},
		{
			name: 'By Similar artist',
			tf: [...new Set(['SIMILAR ARTISTS SEARCHBYDISTANCE', 'LASTFM_SIMILAR_ARTIST', 'SIMILAR ARTISTS LAST.FM'])]
		},
		{
			name: 'By Folksonomy',
			tf:  [...new Set([globTags.folksonomy, 'FOLKSONOMY', 'OCCASION', 'ALBUMOCCASION', globTags.locale, 'LOCALE', 'LOCALE LAST.FM', 'DATE', 'LOCALE WORLD MAP'])]
		},
		{
			name: 'By Mood & Theme(s)',
			tf: [...new Set([globTags.mood, 'MOOD', 'THEME', 'ALBUMMOOD', 'ALBUM THEME ALLMUSIC', 'ALBUM MOOD ALLMUSIC'])]
		},
	]), { func: isJSON }],
	sortTF: ['Sorting TF expression', globTags.artist + '|%ALBUM%|%TRACK%', { func: isStringWeak }, globTags.artist + '|%ALBUM%|%TRACK%'],
	bOmitSortPls: ['Omit sorting on playlist sources', true, { func: isBoolean }, true],
	bBioTags: ['Use tags from Bio panel', false, { func: isBoolean }, false],
};
newButtonsProperties.entries.push(newButtonsProperties.entries[1]);
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Quickmatch': new ThemedButton({ x: 0, y: 0, w: _gr.CalcTextWidth('Quickmatch', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22 }, 'Quickmatch', function (mask) {
		if (mask === MK_SHIFT) {
			const menu = settingsMenu(
				this, true, ['buttons_search_quickmatch.js'], void (0), void (0),
				(menu) => {
					menu.newEntry({ entryText: 'sep' });
					_createSubMenuEditEntries(menu, void (0), {
						name: 'Quickmatch',
						list: JSON.parse(this.buttonsProperties.entries[1]),
						defaults: JSON.parse(this.buttonsProperties.entries[3]),
						input: () => {
							const entry = {
								tf: Input.json('array strings', '',
									'Enter tag names:\n\n' +
									'Ex:\n' + JSON.stringify(['ARTIST', 'ALBUM ARTIST'])
									, 'Quickmatch', JSON.stringify(['ARTIST', 'ALBUM ARTIST']), void (0), true),
							};
							if (!entry.tf) { return; }
							return entry;
						},
						bNumbered: true,
						onBtnUp: (entries) => {
							this.buttonsProperties.entries[1] = JSON.stringify(entries);
							overwriteProperties(this.buttonsProperties);
						}
					});
				}
			);
			menu.btn_up(this.currX, this.currY + this.currH);
		} else {
			quickmatchMenu.bind(this)().btn_up(this.currX, this.currY + this.currH);
		}
	}, null, void (0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		const sel = fb.GetFocusItem();
		let info = '';
		if (sel) {
			let tfo = fb.TitleFormat(
				'Current track:		' + _t(globTags.artist) + ' / %TRACK% - %TITLE%' +
				'$crlf()Date:		' + _b(globTags.date) +
				'$crlf()Genres:		' + _b(_t(globTags.genre)) +
				// ['Album Genre AllMusic', 'Artist Genre AllMusic', 'Album Genre Wikipedia', 'Artist Genre Wikipedia'].map((t) => parent.bioTags[t]).flat(Infinity).filter(Boolean).join(', ') +
				'$crlf()Styles:		' + _b(_t(globTags.style)) +
				'$crlf()Moods:		' + _b(_t(globTags.mood)) + '[,%THEME%][,%ALBUMMOOD%]'
				// ['Album Mood AllMusic', 'Album Theme AllMusic'].map((t) => parent.bioTags[t]).flat(Infinity).filter(Boolean).join(', ')
			);
			info += tfo.EvalWithMetadb(sel);
		} else { info += 'No track selected'; }
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
	}, '', newButtonsProperties, chars.search, void (0),
	{ bioSelectionMode: 'Prefer nowplaying', bioTags: {} },
	lastfmListeners,
	void (0), { scriptName: 'Playlist-Tools-SMP', version }
	),
});

function quickmatchMenu() {
	// Get current selection and metadata
	const sel = this.sel || plman.ActivePlaylist !== -1 ? fb.GetFocusItem(true) : null;
	const info = sel ? sel.GetFileInfo() : null;
	const entries = JSON.parse(this.buttonsProperties.entries[1]);
	entries.forEach((tag) => {
		tag.val = [];
		tag.valSet = new Set();
	});
	const bioTags = this.buttonsProperties.bBioTags[1] ? this.bioTags || {} : {};
	if (info) {
		entries.forEach((tag) => {
			tag.tf.forEach((tf, i) => {
				const idx = info.MetaFind(tf);
				tag.val.push([]);
				// File tags
				if (idx !== -1) {
					let count = info.MetaValueCount(idx);
					while (count--) {
						const val = info.MetaValue(idx, count).trim();
						tag.val[i].push(val);
						if (i === 0 || i !== 0 && !/TITLE|ALBUM_TRACKS/i.test(tag.type)) { tag.valSet.add(val); }
					}
				} else {
					// foo_uie_biography
					if (tf === 'LASTFM_SIMILAR_ARTIST') {
						fb.TitleFormat('[%' + tf + '%]')
							.EvalWithMetadb(sel)
							.split('; ')
							.filter(Boolean)
							.forEach((val) => {
								val = val.trim();
								tag.val[i].push(val);
								tag.valSet.add(val);
							});
					}
				}
				// Bio tags
				if (bioTags) {
					const key = Object.keys(bioTags).find((key) => key.toUpperCase() === tf);
					if (key) {
						let count = bioTags[key].length;
						while (count--) {
							const val = bioTags[key][count].trim();
							tag.val[i].push(val);
							if (i === 0 || i !== 0 && !/TITLE|ALBUM_TRACKS/i.test(tag.type)) { tag.valSet.add(val); }
						}
					}
				}
			});
		});
		// Search by Distance tags
		const sbdPath = (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' + folders.dataName : folders.data) + 'searchByDistance_artists.json';
		if (_isFile(sbdPath)) {
			const dataId = 'artist';
			const selIds = [...(entries.find((tag) => tag.tf.some((tf) => tf.toLowerCase() === dataId)) || { valSet: [] }).valSet];
			if (selIds.length) {
				const data = _jsonParseFileCheck(sbdPath, 'Tags json', window.Name, utf8);
				const sdbData = new Set();
				if (data) {
					data.forEach((item) => {
						if (selIds.some((id) => item[dataId] === id)) {
							item.val.forEach((val) => {
								if (val.scoreW >= 70) { sdbData.add(val.artist); }
							});
						}
					});
				}
				if (sdbData.size) {
					const sbdTag = entries.find((tag) => tag.tf.some((tf) => tf === 'SIMILAR ARTISTS SEARCHBYDISTANCE'));
					const idx = sbdTag ? sbdTag.tf.findIndex((tf) => tf === 'SIMILAR ARTISTS SEARCHBYDISTANCE') : -1;
					if (idx !== -1) {
						sbdTag.val[idx].push(...sdbData);
						sbdTag.valSet = sbdTag.valSet.union(sdbData);
					}
				}
			}
		}
		// World map tags
		const worldMapPath = (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' + folders.dataName : folders.data) + 'worldMap.json';
		if (_isFile(worldMapPath)) {
			const dataId = 'artist';
			const selIds = [...(entries.find((tag) => tag.tf.some((tf) => tf.toLowerCase() === dataId)) || { valSet: [] }).valSet];
			if (selIds.length) {
				const data = _jsonParseFileCheck(worldMapPath, 'Tags json', window.Name, utf8);
				const worldMapData = new Set();
				if (data) {
					data.forEach((item) => {
						if (selIds.some((id) => item[dataId] === id)) {
							item.val.forEach((val) => worldMapData.add(val));
						}
					});
				}
				if (worldMapData.size) {
					const localeTag = entries.find((tag) => tag.tf.some((tf) => tf === 'LOCALE WORLD MAP'));
					const idx = localeTag ? localeTag.tf.findIndex((tf) => tf === 'LOCALE WORLD MAP') : -1;
					if (idx !== -1) {
						localeTag.val[idx].push(...worldMapData);
						localeTag.valSet = localeTag.valSet.union(worldMapData);
					}
				}
			}
		}
	}
	// Globals
	const playlistName = this.buttonsProperties.playlistName[1];
	const sortTF = this.buttonsProperties.sortTF[1];
	const bOmitSortPls = this.buttonsProperties.bOmitSortPls[1];
	// Menu
	const menu = new _menu();
	menu.newEntry({ entryText: 'Shift to search / Ctrl for AutoPlaylist:', flags: MF_GRAYED });
	menu.newEntry({ entryText: 'sep' });
	{	// Same...
		entries.forEach((queryObj) => {
			// Add separators
			if (Object.hasOwn(queryObj, 'name') && queryObj.name === 'sep') {
				menu.newEntry({ entryText: 'sep' });
			} else {
				// Create names for all entries
				queryObj.name = queryObj.name.length > 40 ? queryObj.name.substring(0, 40) + ' ...' : queryObj.name;
				// Entries
				const bSingle = queryObj.valSet.size <= 1;
				const menuName = bSingle ? menu.getMainMenuName() : menu.newMenu(queryObj.name);
				if (queryObj.valSet.size === 0) { queryObj.valSet.add(''); }
				[...queryObj.valSet].sort((a, b) => a.localeCompare(b, 'en', { 'sensitivity': 'base' })).forEach((tagVal, i) => {
					menu.newEntry({
						menuName, entryText: bSingle ? queryObj.name + '\t[' + (tagVal.cut(25) || (sel ? 'no tag' : 'no sel')) + ']' : tagVal.cut(25), func: () => {
							let query = queryJoin(queryObj.tf.map((key) => key + ' IS ' + tagVal), 'OR');
							// Search by Distance tags
							if (queryObj.tf.some((tag) => tag.toUpperCase().indexOf('LOCALE') !== -1)) {
								// World map tags
								const worldMapPath = (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' + folders.dataName : folders.data) + 'worldMap.json';
								if (_isFile(worldMapPath)) {
									const dataId = 'artist';
									const selIds = [...(entries.find((tag) => tag.tf.some((tf) => tf.toLowerCase() === dataId)) || { valSet: [] }).valSet];
									if (selIds.length) {
										const data = _jsonParseFileCheck(worldMapPath, 'Tags json', window.Name, utf8);
										const worldMapData = new Set();
										if (data) {
											data.forEach((item) => {
												if (item.val.includes(tagVal)) {
													worldMapData.add(item[dataId]);
												}
											});
										}
										if (worldMapData.size) {
											query = _p(query) + ' OR ' + _p(queryJoin([...worldMapData].map((locTag) => _t(dataId) + ' IS ' + locTag), 'OR'));
										}
									}
								}
							}
							if (query.indexOf('#') !== -1 && !fb.GetFocusItem(true)) { fb.ShowPopupMessage('Can not evaluate query without a selection:\n' + queryObj.query, 'Quickmatch'); return; }
							const bShift = utils.IsKeyPressed(VK_SHIFT);
							const bCtrl = utils.IsKeyPressed(VK_CONTROL);
							if (bShift || bCtrl) {
								query = dynamicQueryProcess({ query });
								if (query) {
									if (bShift && !bCtrl) { fb.ShowLibrarySearchUI(query); }
									else if (!bShift && bCtrl) { plman.CreateAutoPlaylist(plman.PlaylistCount, playlistName, query); }
									else { dynamicQuery({ query, sort: (bOmitSortPls ? null : queryObj.sort || { tfo: sortTF }), handleList: this.selItems, playlistName, source: plman.GetPlaylistItems(plman.ActivePlaylist) }); }
								}
							} else {
								dynamicQuery({ query, sort: queryObj.sort || { tfo: sortTF }, playlistName });
							}
						}, flags: (tagVal ? MF_STRING : MF_GRAYED) | (!bSingle && i % 8 === 0 ? MF_MENUBREAK : MF_STRING), data: { bDynamicMenu: true }
					});
				});
			}
		});
	}
	return menu;
}