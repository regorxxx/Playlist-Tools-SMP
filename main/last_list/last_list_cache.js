'use strict';
//06/03/23

class LastListCache {

	constructor() {
		this.timeConstants = {
			'h': 3600000,
			'd': 86400000,
			'w': 604800000,
			'm': 2592000000,
			'y': 31536000000
		}
	}
	static compressCache(cacheObject) {
		let artistCounts = {};
		let coverArtCounts = {};

		// make cacheObject an array withouth the keys
		let trackItems = cacheObject.trackItems.map((track) => {
			// process coverArt
			if (track.coverArt) {
				track.coverArt = track.coverArt.replace('https://lastfm.freetls.fastly.net/i/u/64s/', '-').replace(/\.jpg$/g, '-');

				if (track.coverArt in coverArtCounts) {
					coverArtCounts[track.coverArt]++;
				} else {
					coverArtCounts[track.coverArt] = 1;
				}
			}

			if (track.artist in artistCounts) {
				artistCounts[track.artist]++;
			} else {
				artistCounts[track.artist] = 1;
			}

			return [
				track.youtube,
				track.title,
				track.artist,
				track.coverArt,
			];
		});
		// keep only the artists with more than 1 track
		let artists = Object.keys(artistCounts).filter((artist) => {
			return artistCounts[artist] > 1;
		});

		let coverArts = Object.keys(coverArtCounts).filter((coverArt) => {
			return coverArtCounts[coverArt] > 1;
		});

		// replace artist names with artist position in artistCounts array
		cacheObject.trackItems = trackItems.map((track) => {
			let artistIndex = artists.indexOf(track[2]);
			if (artistIndex > -1) {
				track[2] = artistIndex;
			}

			if (track[3] !== null) {
				let coverArtIndex = coverArts.indexOf(track[3]);
				if (coverArtIndex > -1) {
					track[3] = coverArtIndex;
				}
			}

			return track;
		}).flat();

		cacheObject.artists = artists;
		cacheObject.coverArts = coverArts;
		return cacheObject;
	}

	static decompressCache(cacheObject) {
		// unflatten trackItems array
		let trackItems = [];
		for (let i = 0; i < cacheObject.trackItems.length; i += 4) {
			trackItems.push(cacheObject.trackItems.slice(i, i + 4));
		}

		let artists = cacheObject.artists;
		let coverArts = cacheObject.coverArts;

		cacheObject.trackItems = trackItems.map((track) => {
			if (!isNaN(track[2])) {
				track[2] = artists[track[2]];
			}

			if (track[3] !== null) {
				if (!isNaN(track[3])) {
					track[3] = coverArts[track[3]];
				}
				track[3] = track[3].replace(/^-/, 'https://lastfm.freetls.fastly.net/i/u/64s/').replace(/-$/g, '.jpg');
			} else {
				track[3] = null;
			}

			return {
				'youtube': track[0],
				'title': track[1],
				'artist': track[2],
				'coverArt': track[3]
			};
		});

		return cacheObject;
	}
}