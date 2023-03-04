'use strict';
//04/03/23

include('..\\..\\helpers\\menu_xxx.js');
include('..\\..\\helpers\\helpers_xxx_input.js');
include('..\\..\\helpers\\helpers_xxx_prototypes.js');

function _lastListMenu(parent, cache = {lastDate: '', lastTag: '', lastArtist: '', lastURL: ''}, bioTags = {}) {
	const menu = new _menu();
	// Get current selection and metadata
	const sel = plman.ActivePlaylist !== -1 ? fb.GetFocusItem(true) : null;
	const info = sel ? sel.GetFileInfo() : null;
	const tags = [
		{name: 'Artist(s)', tf: ['ARTIST', 'ALBUMARTIST'], val: [], valSet: new Set(), type: 'ARTIST'},
		{name: 'Artist(s) radio', tf: ['ARTIST', 'ALBUMARTIST'], val: [], valSet: new Set(), type: 'ARTIST_RADIO'},
		{name: 'Similar artists', tf: ['ARTIST', 'ALBUMARTIST'], val: [], valSet: new Set(), type: 'SIMILAR'},
		// {name: 'Similar tracks', tf: ['TITLE', 'ARTIST', 'ALBUM'], val: [], valSet: new Set(), type: 'TITLE'},
		{name: 'Album tracks', tf: ['ALBUM', 'ARTIST'], val: [], valSet: new Set(), type: 'ALBUM_TRACKS'},
		{name: 'Genre & Style(s)', tf: ['GENRE', 'STYLE', 'ARTIST GENRE LAST.FM', 'ARTIST GENRE ALLMUSIC', 'ALBUM GENRE LAST.FM', 'ALBUM GENRE ALLMUSIC', 'ALBUM GENRE WIKIPEDIA', 'ARTIST GENRE WIKIPEDIA'], val: [], valSet: new Set(), type: 'TAG'},
		{name: 'Folksonomy & Date(s)', tf: ['FOLKSONOMY', 'OCCASION', 'ALBUMOCCASION', 'LOCALE', 'LOCALE LAST.FM', 'DATE', 'LOCALE WORLD MAP'], val: [], valSet: new Set(), type: 'TAG'},
		{name: 'Mood & Theme(s)', tf: ['MOOD','THEME', 'ALBUMMOOD', 'ALBUM THEME ALLMUSIC', 'ALBUM MOOD ALLMUSIC'], val: [], valSet: new Set(), type: 'TAG'},
	];
	if (info) {
		tags.forEach((tag) => {
			tag.tf.forEach((tf, i) => {
				const idx = info.MetaFind(tf);
				tag.val.push([]);
				if (idx !== -1) {
					let count = info.MetaValueCount(idx);
					while (count--) {
						const val = info.MetaValue(idx, count).trim();
						tag.val[i].push(val);
						if (i === 0 || i !== 0 && !/TITLE|ALBUM_TRACKS/i.test(tag.type)) {tag.valSet.add(val);}
					};
				}
				// Bio tags
				if (bioTags) {
					const key = Object.keys(bioTags).find((key) => key.toUpperCase() === tf);
					if (key) {
						let count = bioTags[key].length;
						while (count--) {
							const val = bioTags[key][count].trim();
							tag.val[i].push(val);
							if (i === 0 || i !== 0 && !/TITLE|ALBUM_TRACKS/i.test(tag.type)) {tag.valSet.add(val);}
						};
					}
				}
			});
		});
		// World map tags
		const path = (_isFile(fb.FoobarPath + 'portable_mode_enabled') ? '.\\profile\\' + folders.dataName : folders.data) + 'worldMap.json';
		if (_isFile(path)) {
			const dataId = 'artist';
			const selIds = [...(tags.find((tag) => tag.tf.some((tf) => tf.toLowerCase() === dataId)) || {valSet: []}).valSet];
			if (selIds.length) {
				const data = _jsonParseFileCheck(path, 'Tags json', window.Name, utf8);
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
				name += val + '\'s library';
				break;
			case 'USER_LOVED':
				name += val + '\'s loved tracks';
				break;
			case 'USER_PLAYLIST':
				name += valSec + ' playlist';
				break;
			default: 
				name += val;
		}
		return name;
	}
	{
		menu.newEntry({entryText: 'Search on Last.fm:', flags: MF_GRAYED});
		menu.newEntry({entryText: 'sep'});
		tags.forEach((tag) => {
			const bSingle = tag.valSet.size <= 1;
			const subMenu = bSingle ? menu.getMainMenuName() : menu.newMenu('Current ' + tag.name + '...');
			if (tag.valSet.size === 0) {tag.valSet.add('');}
			[...tag.valSet].sort((a,b) => a.localeCompare(b, 'en', {'sensitivity': 'base'})).forEach((val) => {
				menu.newEntry({menuName: subMenu, entryText: bSingle ? 'Current ' + tag.name + '\t[' + (val || (sel ? 'no tag' : 'no sel')) + ']' : val, func: () => {
					const url = buildUrl(tag, val);
					console.log('Searching at: ' + url);
					if (url) {parent.run({url, playlistName: playlistName(tag, val), cacheTime: 0});}
				}, flags: val ? MF_STRING : MF_GRAYED});
			});
		});
	}
	menu.newEntry({entryText: 'sep'});
	{
		const subMenu = menu.newMenu('Custom...');
		const customURLS = [
			{name: 'By Artist...', url: () => {
				const input = Input.string('string', (cache.lastArtist || '').toString(), 'Input Artist (case insensitive):', 'Last.fm', 'Silvana Estrada', [], true);
				return input === null && !Input.isLastEqual 
					? null 
					: [buildUrl({type: 'ARTIST'}, input || Input.data.lastInput), playlistName({type: 'ARTIST'}, input || Input.data.lastInput)];
			}},
			{name: 'By Similar artist...', url: () => {
				const input = Input.string('string', (cache.lastArtist || '').toString(), 'Input Artist (case insensitive):', 'Last.fm', 'Silvana Estrada', [], true);
				return input === null && !Input.isLastEqual 
					? null 
					: [buildUrl({type: 'SIMILAR'}, input || Input.data.lastInput), playlistName({type: 'SIMILAR'}, input || Input.data.lastInput)];
			}},
			{name: 'By Album...', url: () => {
				const input = Input.string('string', (cache.lastAlbum || '').toString(), 'Input Artist|Album (case insensitive):\n\nFor ex: lana del rey|born to die', 'Last.fm', 'lana del rey|born to die', [], true);
				if (input === null && !Input.isLastEqual ) {return null;}
				const [, artist, album] = (input || Input.data.lastInput).match(/(.*?)\|(.*)/i);
				return !isString(artist) || !isString(album)
					? null 
					: [buildUrl({type: 'ALBUM_TRACKS', val: [[],[artist]]}, album), playlistName({type: 'ALBUM_TRACKS'}, album)];
			}},
			{name: 'By Tag...', url: () => {
				const input = Input.string('string', (cache.lastTag || '').toString(), 'Input any Folksonomy/Genre/Style tag (case insensitive):\n\nFor ex: Rock, Summer, Cool, Female Vocal, ...', 'Last.fm', 'Rock', [], true);
				return input === null && !Input.isLastEqual 
					? null 
					: [buildUrl({type: 'TAG'}, input || Input.data.lastInput), playlistName({type: 'TAG'}, input || Input.data.lastInput)];
			}},
			{name: 'By Date...', url: () => {
				const year = new Date().getFullYear();
				const input = Input.number('int positive', Number(cache.lastDate || year), 'Input Year:', 'Last.fm', 1975, [(n) => n <= year]);
				return input === null && !Input.isLastEqual 
					? null 
					: [buildUrl({type: 'TAG'}, input || Input.data.lastInput), playlistName({type: 'TAG'}, input || Input.data.lastInput)];
			}},
			{name: 'By User\'s library...', url: () => {
				const input = Input.string('string', (cache.lastUser || '').toString(), 'Input User name (case insensitive):', 'Last.fm', 'myuser', [], true);
				return input === null && !Input.isLastEqual 
					? null 
					: [buildUrl({type: 'USER_LIBRARY'}, input || Input.data.lastInput), playlistName({type: 'USER_LIBRARY'}, input || Input.data.lastInput)];
			}},
			{name: 'By User\'s loved...', url: () => {
				const input = Input.string('string', (cache.lastUser || '').toString(), 'Input User name (case insensitive):', 'Last.fm', 'myuser', [], true);
				return input === null && !Input.isLastEqual 
					? null 
					: [buildUrl({type: 'USER_LOVED'}, input || Input.data.lastInput), playlistName({type: 'USER_LOVED'}, input || Input.data.lastInput)];
			}},
		];
		customURLS.forEach((entry) => {
			menu.newEntry({menuName: subMenu, entryText: entry.name, func: () => {
				const url = isFunction(entry.url) ? entry.url() : entry.url;
				if (url && url[0]) {
					console.log('Searching at: ' + url[0]);
					parent.run({url: url[0], playlistName: url[1], cacheTime: 0});
				}
			}});
		})
		menu.newEntry({menuName: subMenu, entryText: 'sep'});
		menu.newEntry({menuName: subMenu, entryText: 'By url...', func: () => {
			parent.run({url: null, pages: null, playlistName: 'Last.fm', cacheTime: 0});
		}});
	}
	menu.newEntry({entryText: 'sep'});
	{
		const year = new Date().getFullYear();
		const staticURLS = [
			// {name: 'Charts', url: 'https://www.last.fm/charts'},
			{name: 'Top tracks ' + year, url: buildUrl({type: 'TAG'}, year.toString()), menuName: menu.getMainMenuName()},
			{name: 'Top tracks ' + (year - 1), url: buildUrl({type: 'TAG'}, (year - 1).toString()), menuName: menu.getMainMenuName()}
		];
		staticURLS.forEach((entry) => {
			menu.newEntry({menuName: entry.menuName, entryText: entry.name, func: () => {
				const url = isFunction(entry.url) ? entry.url() : entry.url;
				if (url) {
					console.log('Searching at: ' + url);
					parent.run({url, playlistName: 'Last.fm: ' + entry.name, cacheTime: 0});
				}
			}});
		})
	}
	
	return menu;
}