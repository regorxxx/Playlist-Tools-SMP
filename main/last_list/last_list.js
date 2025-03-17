'use strict';
//17/03/25

/*
	Slightly modified version of https://github.com/L3v3L/foo-last-list-smp
	- Proper argument support on run method (allows caching).
	- Better library matching of extra chars (for ex. in original script '.38 Special' would not match '38 Special')
	- Better library matching removing unwanted title words (remastered, ...)
	- Tracks are now added preserving last.fm order (workaround for AddLocations being async)
	- Minor fixes
*/

/* exported LastList */

/* global isYouTube:readable */
include('last_list_input_error.js');
/* global InputError:readable */
include('last_list_helpers.js');
/* global LastListHelpers:readable */
include('last_list_cache.js');
/* global LastListCache:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes_smp.js');

class LastList {
	constructor({ url = '', pages = 1, playlistName = 'Last List', cacheTime = 86400000, forcedQuery = '' } = {}) {
		this.url = url;
		this.pages = pages;
		this.playlistName = playlistName;
		this.cacheTime = cacheTime;
		this.forcedQuery = forcedQuery;
	}

	run({ url = this.url, pages = this.pages, playlistName = this.playlistName, cacheTime = this.cacheTime, forcedQuery = this.forcedQuery } = {}) {
		try { // In case an argument is set to null or '', the default value at constructor is used
			if (!url) {
				try {
					url = utils.InputBox(0, 'Enter the URL:', 'Download', this.url, true);
				} catch (e) { // eslint-disable-line no-unused-vars
					throw new InputError('Canceled Input');
				}

				if (!url) {
					throw new InputError('No URL');
				}
			}

			// if url has page as parameter, set directPage to true
			let regexPattern = /\/.*\?.*(page=(\d+))/gmi;

			let matches = [...url.matchAll(regexPattern)];

			let startPage = 1;
			if (matches.length > 0) {
				startPage = parseInt(matches[0][2]);
				if (isNaN(startPage) || startPage < 1) {
					startPage = 1;
				}

				url = url.replace(matches[0][1], '');
			}

			if (!pages || isNaN(pages) || pages < 1) {
				try {
					pages = utils.InputBox(0, 'Enter the number of pages:', 'Download', this.pages, true);
				} catch (e) { // eslint-disable-line no-unused-vars
					throw new InputError('Canceled Input');
				}

				pages = parseInt(pages);
				if (isNaN(pages) || pages < 1) {
					pages = 1;
				}
			}

			if (!playlistName) {
				try {
					playlistName = utils.InputBox(0, 'Enter the playlist name:', 'Download', this.playlistName, true);
				} catch (e) { // eslint-disable-line no-unused-vars
					throw new InputError('Canceled Input');
				}

				if (!playlistName) {
					throw new InputError('No playlist name');
				}
			}
			this.url = url; // Cache
			return this.scrapeUrl(url, startPage, pages, playlistName, cacheTime, forcedQuery);
		} catch (e) {
			if (e instanceof InputError) {
				// do nothing
			} else {
				//show error message
				this.log('Error - ' + e.message);
			}
			return Promise.resolve(e);
		}
	}

	log(msg) {
		console.log('Last List: ' + msg);
	}

	scrapeUrl(url, startPage, pages, playlistName, cacheTime, forcedQuery = '') {
		// create an index of the library
		let indexedLibrary = {};
		let libItems;
		if (forcedQuery.length) {
			try { libItems = fb.GetQueryItems(fb.GetLibraryItems(), forcedQuery).Convert(); } // Sanity check
			catch (e) { libItems = fb.GetLibraryItems().Convert(); } // eslint-disable-line no-unused-vars
		} else { libItems = fb.GetLibraryItems().Convert(); }
		libItems.forEach((item) => {
			let fileInfo = item.GetFileInfo();
			const titleIdx = fileInfo.MetaFind('TITLE');
			const artistIdx = fileInfo.MetaFind('ARTIST');
			if (titleIdx == -1 || artistIdx == -1) { return; }

			let titleLib = LastListHelpers.cleanId(fileInfo.MetaValue(titleIdx, 0)).toLowerCase().trim();
			let artistLib = LastListHelpers.cleanId(fileInfo.MetaValue(artistIdx, 0)).toLowerCase().trim();
			if (titleLib.length && artistLib.length) {
				indexedLibrary[`${artistLib} - ${titleLib}`] = item;
			}
		});

		// regex patterns to match
		let regexElement = /<tr\s((.|\n)*?)chartlist-love-button((.|\n)*?)<\/tr>/gmi;
		let regexYoutube = /data-youtube-id="(.*?)"/gmi;
		let regexTitle = /data-track-name="(.*?)"/gmi;
		let regexArtist = /data-artist-name="(.*?)"/gmi;
		let regexCover = /"cover-art">\s*<img\s+src="(.*?)"/gmi;
		let regexFallBack = /href="\/music\/([^/]+)\/_\/([^"]+)"/gmi;

		// create playlist
		let playlist = plman.FindOrCreatePlaylist(playlistName, false);
		plman.ClearPlaylist(playlist);
		let itemsToAdd = [];

		let hasYoutubeComponent = typeof isYouTube !== 'undefined' ? isYouTube : utils.CheckComponent('foo_youtube', true);

		let promises = [];

		const addItems = (trackItems) => {
			trackItems.forEach((track) => {
				// if no title or artist, skip
				if (!track.title || !track.artist) { return; }
				// get file from library
				let file = indexedLibrary[`${LastListHelpers.cleanId(track.artist).toLowerCase()} - ${LastListHelpers.cleanId(track.title).toLowerCase()}`];
				// if no file and no youTube link or no foo_youtube, skip
				if (!file && (!track.youTube || !hasYoutubeComponent)) { return; }
				// add to items to add
				itemsToAdd.push({
					youTube: track.youTube,
					title: track.title,
					artist: track.artist,
					cover: track.coverArt,
					file: file
				});
			});
		};

		for (let i = startPage; i < (startPage + pages); i++) {
			promises.push(new Promise((resolve) => {
				let xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
				let urlAppend = url.includes('?') ? '&' : '?';

				let urlToUse = `${url}${urlAppend}page=${i}`;

				let cachePath = fb.ProfilePath + 'LastListCache\\';
				// check if cache valid
				let urlHash = LastListHelpers.hashCode(urlToUse);
				let cachedFilePath = cachePath + urlHash + '.json';

				try {
					if (cacheTime && utils.IsFile(cachedFilePath)) {
						let cachedResultString = utils.ReadTextFile(cachedFilePath);
						let cachedResult = JSON.parse(cachedResultString);
						if (cachedResult.created_at > (Date.now() - cacheTime)) {
							cachedResult = LastListCache.decompressCache(cachedResult);
							if (!cachedResult.trackItems.length) {
								throw new Error('No tracks in cache');
							}
							addItems(cachedResult.trackItems);
							this.log('Cached Used');
							resolve();
							return;
						}
					}
				} catch (e) {
					this.log(`Error - ${e.message}`);
				}

				xmlhttp.open('GET', urlToUse, true);
				xmlhttp.onreadystatechange = () => {
					if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
						this.log('Cached Not Used');
						this.log(`searching page ${i}...`);
						let content = xmlhttp.responseText;
						// check if content is json

						let trackItems = [];

						if (content.startsWith('{')) {
							try {
								let json = JSON.parse(content);
								if (json.error) {
									this.log(`Error - ${json.error}`);
									resolve();
									return;
								}
								json.playlist.forEach((track) => {
									// check everthing needed is present
									if (!track.name || !track.artists || !track.artists.length || !track.playlinks || !track.playlinks.length) { return; }
									trackItems.push({
										youTube: track.playlinks[0].id,
										title: track.name,
										artist: track.artists[0].name,
										coverArt: null
									});
								});
							} catch (e) {
								this.log(`Error - ${e.message}`);
								resolve();
								return;
							}
						} else {
							let matches = [...content.matchAll(regexElement)];
							this.log(`${matches.length} matches found`);
							matches.forEach((match) => {
								// get track info from youTube data element
								let youTube = [...match[0].matchAll(regexYoutube)];
								let title = [...match[0].matchAll(regexTitle)];
								let artist = [...match[0].matchAll(regexArtist)];
								let coverArt = [...match[0].matchAll(regexCover)];

								if (title.length && artist.length) {
									// clean strings
									title = LastListHelpers.cleanString(decodeURI(title[0][1]));
									artist = LastListHelpers.cleanString(decodeURI(artist[0][1]));
								} else { // fallback to href if youTube data element is not available
									let fallbackData = [...match[0].matchAll(regexFallBack)];
									if (!fallbackData.length) { return; }
									// clean strings
									artist = decodeURIComponent(fallbackData[0][1]).replace(/\+/g, ' ');
									title = decodeURIComponent(fallbackData[0][2]).replace(/\+/g, ' ');
								}
								trackItems.push({
									youTube: youTube.length ? youTube[0][1] : null,
									title: title,
									artist: artist,
									coverArt: coverArt.length && !coverArt[0][1].includes('4128a6eb29f94943c9d206c08e625904.jpg') ? coverArt[0][1] : null
								});
							});
						}

						if (cacheTime && trackItems.length) {
							// record cache
							let jsonString = JSON.stringify(LastListCache.compressCache({
								ver: 1,
								url: url,
								created_at: new Date().getTime(),
								trackItems: trackItems
							}));
							try {
								utils.WriteTextFile(cachedFilePath, jsonString);
							} catch (e) {
								this.log(`Error - ${e.message}`);
							}
						}

						addItems(trackItems);
						resolve();
					}

					if (xmlhttp.readyState == 4 && xmlhttp.status != 200) {
						resolve();
					}
				};

				setTimeout(function () {
					xmlhttp.send();
				}, 5000 * (i - startPage));
			}));
		}

		return Promise.all(promises).then(() => {
			plman.AddPlaylistItemsOrLocations(playlist, this.buildItemList(itemsToAdd), true); // Replaced addItemsToPlaylist, since AddLocations is Async
			// activate playlist
			plman.ActivePlaylist = playlist;
			this.log('finished');
		});
	}

	buildItemList(items) {
		return [...new Set(items)]
			.map((item) => {
				let newItem;
				if (item.file) {
					newItem = item.file;
				} else {
					newItem = `3dydfy://www.youTube.com/watch?v=${item.youTube}&fb2k_artist=${encodeURIComponent(item.artist)}&fb2k_title=${encodeURIComponent(item.title)}`;
					if (item.cover) {
						// upscale cover art link
						item.cover = item.cover.replace(/\/64s\//g, '/300x300/');
						// append cover url to youTube url
						newItem += `&fb2kx_thumbnail_url=${encodeURIComponent(item.cover)}`;
						newItem += `&fb2k_last_list_thumbnail_url=${encodeURIComponent(item.cover)}`;
					}
				}
				return newItem;
			});
	}
}