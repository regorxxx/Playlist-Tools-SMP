'use strict';
//19/06/25

/* exported _lastListMenu */

include('..\\..\\helpers\\helpers_xxx.js');
/* global MF_STRING:readable, MF_GRAYED:readable, MF_MENUBREAK:readable, VK_SHIFT:readable, globTags:readable */
include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, _jsonParseFileCheck:readable, utf8:readable */
include('..\\..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global isString:readable, isFunction:readable, */
include('..\\..\\helpers\\helpers_xxx_tags_extra.js');
/* global getSimilarDataFromFile:readable */

function _lastListMenu({ bSimulate = false, bDynamicMenu = false /* on SMP main menu, entries are not split by tag */ } = {}) {
	const parent = this.lastList;
	const cache = this.cache || { lastDate: '', lastTag: '', lastArtist: '', lastURL: '' };
	const bioTags = this.buttonsProperties.bBioTags[1] ? this.bioTags || {} : {};
	const filePaths = JSON.parse(this.buttonsProperties.filePaths[1]);
	if (bSimulate) {
		this.sel = null;
		return _lastListMenu.bind(this)({ bSimulate: false, bDynamicMenu: true });
	}
	const menu = new _menu();
	// Get current selection and metadata
	const sel = this.sel || plman.ActivePlaylist !== -1 ? fb.GetFocusItem(true) : null;
	const info = sel ? sel.GetFileInfo() : null;
	// Set tags for lookup and filter wrong values
	const tags = (JSON.parse(this.buttonsProperties.tags[1]) || []).filter((tag) => {
		return tag && tag.tf && tag.tf.length && tag.name.length && tag.type;
	});
	tags.forEach((tag) => {
		tag.val = [];
		tag.valSet = new Set();
	});
	if (info) {
		tags.forEach((tag) => {
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
					if (tf === 'LASTFM_SIMILAR_ARTIST') { // NOSONAR
						fb.TitleFormat('[%' + tf + '%]')
							.EvalWithMetadb(sel)
							.split('; ')
							.filter(Boolean)
							.slice(0, 10)
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
		// Similar artists tags
		[
			{ file: filePaths.listenBrainzArtists, dataId: 'artist', tag: globTags.lbSimilarArtist },
			{ file: filePaths.searchByDistanceArtists, dataId: 'artist', tag: globTags.sbdSimilarArtist }
		].forEach((option) => {
			if (_isFile(option.file)) {
				const dataId = option.dataId;
				const dataTag = option.tag;
				const selIds = [...(tags.find((tag) => tag.tf.some((tf) => tf.toLowerCase() === dataId)) || { valSet: [] }).valSet];
				if (selIds.length) {
					const data = getSimilarDataFromFile(option.file);
					const lbData = new Set();
					if (data) {
						data.forEach((item) => {
							if (selIds.some((id) => item[dataId] === id)) {
								item.val.slice(0, 10).forEach((val) => lbData.add(val.artist));
							}
						});
					}
					if (lbData.size) {
						const lbTag = tags.find((tag) => tag.tf.some((tf) => tf === dataTag));
						const idx = lbTag ? lbTag.tf.findIndex((tf) => tf === dataTag) : -1;
						if (idx !== -1) {
							lbTag.val[idx].push(...lbData);
							lbTag.valSet = lbTag.valSet.union(lbData);
						}
					}
				}
			}
		});
		// World map tags
		if (_isFile(filePaths.worldMapArtists)) {
			const dataId = 'artist';
			const selIds = [...(tags.find((tag) => tag.tf.some((tf) => tf.toLowerCase() === dataId)) || { valSet: [] }).valSet];
			if (selIds.length) {
				const data = _jsonParseFileCheck(filePaths.worldMapArtists, 'Tags json', window.Name, utf8);
				const worldMapData = new Set();
				if (data) {
					data.forEach((item) => {
						if (selIds.some((id) => item[dataId] === id)) {
							item.val.forEach((val) => worldMapData.add(val));
						}
					});
				}
				if (worldMapData.size) {
					const localeTag = tags.find((tag) => tag.tf.some((tf) => tf === 'LOCALE WORLD MAP'));
					const idx = localeTag ? localeTag.tf.findIndex((tf) => tf === 'LOCALE WORLD MAP') : -1;
					if (idx !== -1) {
						localeTag.val[idx].push(...worldMapData);
						localeTag.valSet = localeTag.valSet.union(worldMapData);
					}
				}
			}
		}
	}

	function buildUrl(tag, val, valSec) {
		if (val === '' || typeof val === 'undefined' || val === null) { return null; }
		const mainArtist = /TITLE|ALBUM_TRACKS/i.test(tag.type) ? tag.val[1][0] || null : null;
		const mainAlbum = /TITLE/i.test(tag.type) ? tag.val[2][0] || null : null;
		val = val.toString().toLowerCase();
		switch (tag.type) {
			case 'TAG': return 'https://www.last.fm/tag/' + encodeURIComponent(val) + '/tracks';
			case 'ARTIST': return 'https://www.last.fm/music/' + encodeURIComponent(val) + '/+tracks?date_preset=LAST_7_DAYS';
			case 'ARTIST_RADIO': return 'https://www.last.fm/player/station/music/' + encodeURIComponent(val);
			case 'SIMILAR': return 'https://www.last.fm/player/station/music/' + encodeURIComponent(val) + '/+similar';
			case 'TITLE': return mainArtist && mainAlbum ? 'https://www.last.fm/music/' + encodeURIComponent(mainArtist.toString().toLowerCase()) + '/' + encodeURIComponent(mainAlbum.toString().toLowerCase()) + '/' + encodeURIComponent(val) : null;
			case 'ALBUM_TRACKS': return mainArtist ? 'https://www.last.fm/music/' + encodeURIComponent(mainArtist.toString().toLowerCase()) + '/' + encodeURIComponent(val) : null;
			case 'USER_RADIO': return 'https://www.last.fm/player/station/user/' + encodeURIComponent(val) + '/library';
			case 'USER_MIX': return 'https://www.last.fm/player/station/user/' + encodeURIComponent(val) + '/mix';
			case 'USER_RECOMMENDATIONS': return 'https://www.last.fm/player/station/user/' + encodeURIComponent(val) + '/recommended';
			case 'USER_LIBRARY': return 'https://www.last.fm/user/' + encodeURIComponent(val) + '/library/tracks';
			case 'USER_LOVED': return 'https://www.last.fm/user/' + encodeURIComponent(val) + '/loved';
			case 'USER_PLAYLIST': return 'https://www.last.fm/user/' + encodeURIComponent(val) + '/playlists/' + encodeURIComponent(valSec);
			case 'USER_NEIGHBOURS': return 'https://www.last.fm/player/station/user/' + encodeURIComponent(val) + '/neighbours';
			default: return null;
		}
	}

	function playlistName(tag, val, valSec) {
		let name = 'Last.fm: ';
		switch (tag.type) {
			case 'TITLE':
			case 'TAG':
			case 'ARTIST':
			case 'ALBUM_TRACKS':
				name += val;
				break;
			case 'ARTIST_RADIO':
				name += val + ' station';
				break;
			case 'SIMILAR':
				name += 'similar to ' + val;
				break;
			case 'USER_RADIO':
				name += val + '\'s radio';
				break;
			case 'USER_MIX':
				name += val + '\'s mix';
				break;
			case 'USER_RECOMMENDATIONS':
				name += val + '\'s recommendations';
				break;
			case 'USER_LIBRARY':
				name += val + '\'s top tracks';
				break;
			case 'USER_LOVED':
				name += val + '\'s loved tracks';
				break;
			case 'USER_PLAYLIST':
				name += valSec + ' playlist';
				break;
			case 'USER_NEIGHBOURS':
				name += valSec + ' neighbours';
				break;
			default:
				name += val;
		}
		return name;
	}
	{
		menu.newEntry({ entryText: 'Shift + Click to bypass cache:', flags: MF_GRAYED });
		menu.newSeparator();
		if (bDynamicMenu) {
			tags.forEach((tag) => {
				const subMenu = menu.getMainMenuName();
				if (tag.valSet.size === 0) { tag.valSet.add(''); }
				const val = [...tag.valSet][0];
				menu.newEntry({
					menuName: subMenu, entryText: tag.name + '\t[' + (val.cut(20) || (sel ? 'no tag' : 'no sel')) + ']', func: () => {
						const url = buildUrl(tag, val);
						if (url) {
							parent.url = url;
							parent.playlistName = playlistName(tag, val);
							parent.pages = 1;
							const bShift = utils.IsKeyPressed(VK_SHIFT);
							console.log('Searching at: ' + url);
							this.switchAnimation('Last.fm data retrieval', true);
							// Setting it to a 1 sec, will refresh the cache without using it
							parent.run({ cacheTime: bShift ? 1 : void (0) })
								.finally(() => { this.switchAnimation('Last.fm data retrieval', false); });
						}
					}, flags: val ? MF_STRING : MF_GRAYED, data: { bDynamicMenu: true }
				});
			});
		} else {
			tags.forEach((tag) => {
				const bSingle = tag.valSet.size <= 1;
				const subMenu = bSingle ? menu.getMainMenuName() : menu.newMenu(tag.name);
				if (tag.valSet.size === 0) { tag.valSet.add(''); }
				[...tag.valSet].sort((a, b) => a.localeCompare(b, void(0), { sensitivity: 'base' })).forEach((val, i) => {
					menu.newEntry({
						menuName: subMenu, entryText: bSingle ? tag.name + '\t[' + (val.cut(25) || (sel ? 'no tag' : 'no sel')) + ']' : val.cut(25), func: () => {
							const url = buildUrl(tag, val);
							if (url) {
								parent.url = url;
								parent.playlistName = playlistName(tag, val);
								parent.pages = 1;
								const bShift = utils.IsKeyPressed(VK_SHIFT);
								console.log('Searching at: ' + url);
								this.switchAnimation('Last.fm data retrieval', true);
								parent.run({ cacheTime: bShift ? 1 : void (0) })
									.finally(() => { this.switchAnimation('Last.fm data retrieval', false); });
							}
						}, flags: (val ? MF_STRING : MF_GRAYED) | (!bSingle && i % 8 === 0 ? MF_MENUBREAK : MF_STRING)
					});
				});
			});
		}
	}
	menu.newSeparator();
	{
		const subMenuCustom = menu.newMenu('Custom');
		const subMenuUser = menu.newMenu('By User');
		const customURLS = [
			{
				name: 'By Artist...', menuName: subMenuCustom, url: () => {
					const input = Input.string('string', (cache.lastArtist || '').toString(), 'Input Artist (case insensitive):', 'Last.fm', 'Silvana Estrada', [], true);
					return input === null && !Input.isLastEqual
						? null
						: [buildUrl({ type: 'ARTIST' }, input || Input.lastInput), playlistName({ type: 'ARTIST' }, input || Input.lastInput)];
				}
			},
			{
				name: 'By Similar artist to...', menuName: subMenuCustom, url: () => {
					const input = Input.string('string', (cache.lastArtist || '').toString(), 'Input Artist (case insensitive):', 'Last.fm', 'Silvana Estrada', [], true);
					return input === null && !Input.isLastEqual
						? null
						: [buildUrl({ type: 'SIMILAR' }, input || Input.lastInput), playlistName({ type: 'SIMILAR' }, input || Input.lastInput), 2];
				}
			},
			{
				name: 'By Album...', menuName: subMenuCustom, url: () => {
					const input = Input.string('string', (cache.lastAlbum || '').toString(), 'Input Artist|Album (case insensitive):\n\nFor ex: lana del rey|born to die', 'Last.fm', 'lana del rey|born to die', [], true);
					if (input === null && !Input.isLastEqual) { return null; }
					const [, artist, album] = (input || Input.lastInput).match(/(.*?)\|(.*)/i);
					return !isString(artist) || !isString(album)
						? null
						: [buildUrl({ type: 'ALBUM_TRACKS', val: [[], [artist]] }, album), playlistName({ type: 'ALBUM_TRACKS' }, album)];
				}
			},
			{
				name: 'By Tag...', menuName: subMenuCustom, url: () => {
					const input = Input.string('string', (cache.lastTag || '').toString(), 'Input any Folksonomy/Genre/Style tag (case insensitive):\n\nFor ex: Rock, Summer, Cool, Female Vocal, ...', 'Last.fm', 'Rock', [], true);
					return input === null && !Input.isLastEqual
						? null
						: [buildUrl({ type: 'TAG' }, input || Input.lastInput), playlistName({ type: 'TAG' }, input || Input.lastInput)];
				}
			},
			{
				name: 'By Date...', menuName: subMenuCustom, url: () => {
					const year = new Date().getFullYear();
					const input = Input.number('int positive', Number(cache.lastDate || year), 'Input Year:', 'Last.fm', 1975, [(n) => n <= year]);
					return input === null && !Input.isLastEqual
						? null
						: [buildUrl({ type: 'TAG' }, input || Input.lastInput), playlistName({ type: 'TAG' }, input || Input.lastInput)];
				}
			},
			{
				name: 'Top tracks...', menuName: subMenuUser, url: () => {
					const input = Input.string('string', (cache.lastUser || '').toString(), 'Input User name (case insensitive):', 'Last.fm', 'myuser', [], true);
					return input === null && !Input.isLastEqual
						? null
						: [buildUrl({ type: 'USER_LIBRARY' }, input || Input.lastInput), playlistName({ type: 'USER_LIBRARY' }, input || Input.lastInput)];
				}
			},
			{
				name: 'Loved...', menuName: subMenuUser, url: () => {
					const input = Input.string('string', (cache.lastUser || '').toString(), 'Input User name (case insensitive):', 'Last.fm', 'myuser', [], true);
					return input === null && !Input.isLastEqual
						? null
						: [buildUrl({ type: 'USER_LOVED' }, input || Input.lastInput), playlistName({ type: 'USER_LOVED' }, input || Input.lastInput)];
				}
			},
			{
				name: 'Mix...', menuName: subMenuUser, url: () => {
					const input = Input.string('string', (cache.lastUser || '').toString(), 'Input User name (case insensitive):', 'Last.fm', 'myuser', [], true);
					return input === null && !Input.isLastEqual
						? null
						: [buildUrl({ type: 'USER_MIX' }, input || Input.lastInput), playlistName({ type: 'USER_MIX' }, input || Input.lastInput), 2];
				}
			},
			{
				name: 'Recommendations...', menuName: subMenuUser, url: () => {
					const input = Input.string('string', (cache.lastUser || '').toString(), 'Input User name (case insensitive):', 'Last.fm', 'myuser', [], true);
					return input === null && !Input.isLastEqual
						? null
						: [buildUrl({ type: 'USER_RECOMMENDATIONS' }, input || Input.lastInput), playlistName({ type: 'USER_RECOMMENDATIONS' }, input || Input.lastInput), 2];
				}
			},
			{
				name: 'Neighbours...', menuName: subMenuUser, url: () => {
					const input = Input.string('string', (cache.lastUser || '').toString(), 'Input User name (case insensitive):', 'Last.fm', 'myuser', [], true);
					return input === null && !Input.isLastEqual
						? null
						: [buildUrl({ type: 'USER_NEIGHBOURS' }, input || Input.lastInput), playlistName({ type: 'USER_LOVED' }, input || Input.lastInput), 2];
				}
			},
		];
		customURLS.forEach((entry) => {
			menu.newEntry({
				menuName: entry.menuName, entryText: entry.name, func: () => {
					const url = isFunction(entry.url) ? entry.url() : entry.url;
					if (url && url[0]) {
						parent.url = url[0];
						parent.playlistName = url[1];
						parent.pages = url[2] || 1;
						const bShift = utils.IsKeyPressed(VK_SHIFT);
						console.log('Searching at: ' + url[0]);
						this.switchAnimation('Last.fm data retrieval', true);
						parent.run({ cacheTime: bShift ? 1 : void (0) })
							.finally(() => { this.switchAnimation('Last.fm data retrieval', false); });
					}
				}, data: { bDynamicMenu: true }
			});
		});
		menu.newSeparator(subMenuCustom);
		menu.newEntry({
			menuName: subMenuCustom, entryText: 'By url...', func: () => {
				parent.url = cache.lastURL;
				parent.playlistName = 'Last.fm';
				parent.pages = 1;
				const bShift = utils.IsKeyPressed(VK_SHIFT);
				this.switchAnimation('Last.fm data retrieval', true);
				parent.run({ url: null, cacheTime: bShift ? 1 : void (0) })
					.finally(() => { this.switchAnimation('Last.fm data retrieval', false); });
			}, data: { bDynamicMenu: true }
		});
	}
	menu.newSeparator();
	{
		const year = new Date().getFullYear();
		const staticURLS = [
			// {name: 'Charts', url: 'https://www.last.fm/charts'},
			{ name: 'Top tracks ' + year, url: buildUrl({ type: 'TAG' }, year.toString()), menuName: menu.getMainMenuName() },
			{ name: 'Top tracks ' + (year - 1), url: buildUrl({ type: 'TAG' }, (year - 1).toString()), menuName: menu.getMainMenuName() }
		];
		staticURLS.forEach((entry) => {
			menu.newEntry({
				menuName: entry.menuName, entryText: entry.name, func: () => {
					const url = isFunction(entry.url) ? entry.url() : entry.url;
					if (url) {
						parent.url = url;
						parent.playlistName = 'Last.fm: ' + entry.name;
						parent.pages = 1;
						const bShift = utils.IsKeyPressed(VK_SHIFT);
						console.log('Searching at: ' + url);
						this.switchAnimation('Last.fm data retrieval', true);
						parent.run({ cacheTime: bShift ? 1 : void (0) })
							.finally(() => { this.switchAnimation('Last.fm data retrieval', false); });
					}
				}, data: { bDynamicMenu: true }
			});
		});
	}

	return menu;
}