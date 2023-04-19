'use strict';
//19/04/23

/* 
	Slightly modified version of https://github.com/L3v3L/foo-last-list-smp with proper argument support on run method
*/


include('last_list_input_error.js');
include('last_list_helpers.js');
include('last_list_cache.js');

class LastList {
	constructor({ url = '', pages = 1, playlistName = 'Last List', cacheTime = 86400000 } = {}) {
		this.url = url;
		this.pages = pages;
		this.playlistName = playlistName;
		this.cacheTime = cacheTime;
	}

	run({ url = this.url, pages = this.pages, playlistName = this.playlistName, cacheTime = this.cacheTime } = {}) {
		try { // In case an argument is set to null or '', the default value at constructor is used
			if (!url) {
				try {
					url = utils.InputBox(0, "Enter the URL:", "Download", this.url, true);
				} catch (e) {
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

				url = url.replace(matches[0][1], "");
			}

			if (!pages || isNaN(pages) || pages < 1) {
				try {
					pages = utils.InputBox(0, "Enter the number of pages:", "Download", this.pages, true);
				} catch (e) {
					throw new InputError('Canceled Input');
				}

				pages = parseInt(pages);
				if (isNaN(pages) || pages < 1) {
					pages = 1;
				}
			}

			if (!playlistName) {
				try {
					playlistName = utils.InputBox(0, "Enter the playlist name:", "Download", this.playlistName, true);
				} catch (e) {
					throw new InputError('Canceled Input');
				}

				if (!playlistName) {
					throw new InputError('No playlist name');
				}
			}

			this.scrapeUrl(url, startPage, pages, playlistName, cacheTime);
			this.url = url; // Cache
		} catch (e) {
			if (e instanceof InputError) {
				// do nothing
			} else {
				//show error message
				this.log("Error - " + e.message);
			}

		}
	};

	log(msg) {
		console.log('Last List: ' + msg);
	};

	scrapeUrl(url, startPage, pages, playlistName, cacheTime) {
		// create an index of the library
		let indexedLibrary = {};
		fb.GetLibraryItems().Convert().every((item) => {
			let fileInfo = item.GetFileInfo();
			const titleIdx = fileInfo.MetaFind("TITLE");
			const artistIdx = fileInfo.MetaFind("ARTIST");

			if (titleIdx == -1 || artistIdx == -1) {
				return true;
			}

			let titleLib = fileInfo.MetaValue(titleIdx, 0).toLowerCase().trim();
			let artistLib = fileInfo.MetaValue(artistIdx, 0).toLowerCase().trim();

			if (titleLib.length && artistLib.length) {
				indexedLibrary[`${artistLib} - ${titleLib}`] = item;
			}

			return true;
		});

		// regex patterns to match
		let regexElement = /<tr\s((.|\n)*?)chartlist-love-button((.|\n)*?)<\/tr>/gmi;
		let regexYoutube = /data-youtube-id=\"(.*?)\"/gmi;
		let regexTitle = /data-track-name=\"(.*?)\"/gmi;
		let regexArtist = /data-artist-name=\"(.*?)\"/gmi;
		let regexCover = /\"cover-art\">\s*<img\s+src=\"(.*?)\"/gmi;
		let regexFallBack = /href=\"\/music\/([^\/]+)\/_\/([^\"]+)\"/gmi;

		// create playlist
		let playlist = plman.FindOrCreatePlaylist(playlistName, false);
		plman.ClearPlaylist(playlist);
		let itemsToAdd = [];

		let hasYoutubeComponent = utils.CheckComponent('foo_youtube', true);

		let promises = [];
		for (let i = startPage; i < (startPage + pages); i++) {
			promises.push(new Promise((resolve, reject) => {
				let xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
				let urlAppend = url.includes("?") ? "&" : "?";

				let urlToUse = `${url}${urlAppend}page=${i}`;

				let cachePath = fb.ProfilePath + "LastListCache\\";
				// check if cache valid
				let urlHash = LastListHelpers.hashCode(urlToUse);
				let cachedFilePath = cachePath + urlHash + ".json";

				try {
					if (cacheTime && utils.IsFile(cachedFilePath)) {
						let cachedResultString = utils.ReadTextFile(cachedFilePath);
						let cachedResult = JSON.parse(cachedResultString);
						if (cachedResult.created_at > (Date.now() - cacheTime)) {
							cachedResult = LastListCache.decompressCache(cachedResult);
							if (!cachedResult.trackItems.length) {
								throw new Error('No tracks in cache');
							}
							// TODO refactor duplicate code
							cachedResult.trackItems.forEach((track) => {
								// if no title or artist, skip
								if (!track.title || !track.artist) {
									return true;
								}

								// get file from library
								let file = indexedLibrary[`${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`];
								// if no file and no youtube link or no foo_youtube, skip
								if (!file && (!track.youtube || !hasYoutubeComponent)) {
									return true;
								}

								// add to items to add
								itemsToAdd.push({
									youtube: track.youtube,
									title: track.title,
									artist: track.artist,
									cover: track.coverArt,
									file: file
								});
							});
							this.log(`Cached Used`);
							resolve();
							return;
						}
					}
				} catch (e) {
					this.log(`Error - ${e.message}`);
				}

				xmlhttp.open("GET", urlToUse, true);
				xmlhttp.onreadystatechange = () => {
					if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
						this.log(`Cached Not Used`);
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
								json.playlist.every((track) => {
									// check everthing needed is present
									if (!track.name || !track.artists || !track.artists.length || !track.playlinks || !track.playlinks.length) {
										return true;
									}

									trackItems.push({
										youtube: track.playlinks[0].id,
										title: track.name,
										artist: track.artists[0].name,
										coverArt: null
									});
									return true;
								});
							} catch (e) {
								this.log(`Error - ${e.message}`);
								resolve();
								return;
							}
						} else {
							let matches = [...content.matchAll(regexElement)];
							this.log(`${matches.length} matches found`);
							matches.every((match) => {
								// get track info from youtube data element
								let youtube = [...match[0].matchAll(regexYoutube)];
								let title = [...match[0].matchAll(regexTitle)];
								let artist = [...match[0].matchAll(regexArtist)];
								let coverArt = [...match[0].matchAll(regexCover)];

								if (title.length && artist.length) {
									// clean strings
									title = LastListHelpers.cleanString(decodeURI(title[0][1]));
									artist = LastListHelpers.cleanString(decodeURI(artist[0][1]));
								} else { // fallback to href if youtube data element is not available
									let fallbackData = [...match[0].matchAll(regexFallBack)];
									if (!fallbackData.length) {
										return true;
									}
									// clean strings
									artist = decodeURIComponent(fallbackData[0][1]).replace(/\+/g, " ");
									title = decodeURIComponent(fallbackData[0][2]).replace(/\+/g, " ");
								}

								trackItems.push({
									youtube: youtube.length ? youtube[0][1] : null,
									title: title,
									artist: artist,
									coverArt: coverArt.length && !coverArt[0][1].includes('4128a6eb29f94943c9d206c08e625904.jpg') ? coverArt[0][1] : null
								});

								return true;
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

						trackItems.forEach((track) => {
							// if no title or artist, skip
							if (!track.title || !track.artist) {
								return true;
							}

							// get file from library
							let file = indexedLibrary[`${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`];
							// if no file and no youtube link or no foo_youtube, skip
							if (!file && (!track.youtube || !hasYoutubeComponent)) {
								return true;
							}

							// add to items to add
							itemsToAdd.push({
								youtube: track.youtube,
								title: track.title,
								artist: track.artist,
								cover: track.coverArt,
								file: file
							});
						});

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

		Promise.all(promises).then(() => {
			this.addItemsToPlaylist(itemsToAdd, playlist);
			// TODO remove duplicates from playlist
			/*
			let playlistItems = plman.GetPlaylistItems(playlist);
			plman.ClearPlaylist(playlist);
			plman.InsertPlaylistItemsFilter(playlist, 0, playlistItems);
			*/

			// activate playlist
			plman.ActivePlaylist = playlist;
			this.log("finished");
		});
	};

	addItemsToPlaylist(items, playlist) {
		// remove duplicates
		items = [...new Set(items)];
		// check if there are items to add
		if (items.length == 0) {
			this.log("No items to add");
			return false;
		}

		let lastType = 'youtube';
		let queue = [];
		// add items to playlist
		items.forEach((itemToAdd) => {
			let type = itemToAdd.file ? "local" : "youtube";
			// submit queue
			if (type != lastType) {
				if (lastType == "youtube") {
					plman.AddLocations(playlist, queue);
					queue = new FbMetadbHandleList();
				}
				if (lastType == "local") {
					plman.InsertPlaylistItems(playlist, plman.PlaylistItemCount(playlist), queue);
					queue = [];
				}

				lastType = type;
			}

			if (type == "youtube") {
				let fooYoutubeUrl = `3dydfy://www.youtube.com/watch?v=${itemToAdd.youtube}&fb2k_artist=${encodeURIComponent(itemToAdd.artist)}&fb2k_title=${encodeURIComponent(itemToAdd.title)}`;
				if (itemToAdd.cover) {
					// upscale cover art link
					itemToAdd.cover = itemToAdd.cover.replace(/\/64s\//g, "/300x300/");
					// append cover url to youtube url
					fooYoutubeUrl += `&fb2kx_thumbnail_url=${encodeURIComponent(itemToAdd.cover)}`;
					fooYoutubeUrl += `&fb2k_last_list_thumbnail_url=${encodeURIComponent(itemToAdd.cover)}`;
				}
				queue.push(fooYoutubeUrl);
			}
			if (type == "local") {
				queue.Insert(queue.Count, itemToAdd.file);
			}
		});
		if (lastType == "youtube") {
			plman.AddLocations(playlist, queue);
		}
		if (lastType == "local") {
			plman.InsertPlaylistItems(playlist, plman.PlaylistItemCount(playlist), queue);
		}
	};
}