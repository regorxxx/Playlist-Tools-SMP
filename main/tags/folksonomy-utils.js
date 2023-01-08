'use strict';
//08/01/23

include('..\\..\\helpers\\helpers_xxx.js');
include('..\\..\\helpers\\helpers_xxx_file.js');
include('..\\..\\helpers\\helpers_xxx_prototypes.js');

const folksonomyUtils = {
	calculateFolksonomy: function calculateFolksonomy({
			fromHandleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist),
			tagName = globTags.folksonomy,
			fromTags = [globTags.genre, globTags.style],
			bDebug = false,
			bProfile = false
		}) {
		// Safecheck
		if (!fromHandleList || !fromHandleList.Count || !tagName.length) {return false;}
		const profile = bProfile ? new FbProfiler('Folksonomy') : null;
		const handleListArr = fromHandleList.Convert();
		const totalTracks = handleListArr.length, numTracks = 25, maxCount = Math.ceil(totalTracks / numTracks);
		let totalItems = 0;
		let bDone = true;
		let failedItems = [];
		const calcFOLKSONOMY = (count) => {
				const currMax = (count + 1) === maxCount ? totalTracks : (count + 1) * numTracks;
				console.log('Processing items: ' + currMax + '/' + totalTracks);
				const items = [];
				const FOLKSONOMY = [];
				let prevProgress = -1, iSteps = (count + 1) === maxCount ? currMax : numTracks;
				handleListArr.slice(count * numTracks, currMax).forEach((handle, i) => {
					const path = handle.Path;
					if (_isFile(path)) {
						const itemTags = getTagsValuesV3(new FbMetadbHandleList(handle), fromTags, true).flat(Infinity).filter(Boolean);
						if (itemTags.length) {
							const tag = this.getFolksonomyFrom(itemTags);
							if (tag.length) {
								items.push(handle);
								FOLKSONOMY.push(tag);
								console.log(tag);
							}
						} else {failedItems.push(path);}
						const progress = Math.round((i + 1) / iSteps * 10) * 10;
						if (progress > prevProgress) {prevProgress = progress; console.log('Folksonomy ' + progress + '%.');}
					} else {failedItems.push(path);}
				});
				const itemsLength = items.length;
				totalItems += itemsLength;
				if (itemsLength) {
					const tags = FOLKSONOMY.map((value) => {return {[tagName]: value};});
					if (itemsLength === tags.length) {
						new FbMetadbHandleList(items).UpdateFileInfoFromJSON(JSON.stringify(tags));
						if (maxCount > 1) {console.log(itemsLength,'items tagged.');} // Don't repeat this line when all is done in 1 step. Will be printed also later
						bDone = bDone;
					} else {bDone = false; console.log('Tagging failed: unknown error.');}
				}
		}
		for (let count = 0; count < maxCount; count++) {
			calcFOLKSONOMY(count);
		}
		const failedItemsLen = failedItems.length;
		console.popup(totalTracks + ' items processed.\n' + totalItems + ' items tagged.\n' + failedItemsLen + ' items failed.' + (failedItemsLen ? '\n\nList of failed items:\n' + failedItems.join('\n') : ''), 'Folksonomy');
		if (bProfile) {profile.Print('Save Folksonomy tags to files - completed in ');}
		return bDone;
	},
	getFolksonomyFrom: function getFolksonomyFrom(tags) {
		const folksonomy = new Set();
		if (tags && tags.length) {
			tags = tags.map((t) => t.toLowerCase());
			const rules = {
				subsitutions: [
					// Rap
					{from: ['Rap','Hip Hop', 'Hip Hop Rap','Hip Hop/Rap','Hip-Hop/Rap'], to: ['Hip-Hop']},
					{from: ['Jazz Hip-Hop', 'Jazz Hip Hop', 'Jazz Rap'], to: ['Jazz-Rap']},
					{from: ['West Coast Hip Hop'], to: ['West Coast Hip-Hop']},
					// Rock
					{from: ['Aor'], to: ['Album Rock']},
					{from: ['Blues-Rock'], to: ['Blues Rock']},
					{from: ['Pop / Rock / Metal'], to: ['Rock']},
					{from: ['Pop/Rock'], to: ['Pop Rock']},
					{from: ['Prog Rock', 'Prog-Rock', 'Progressive'], to: ['Progressive Rock']},
					{from: ['Alternative/Indie Rock', 'Alternrock'], to: ['Alternative Rock']},
					{from: ['Postrock'], to: ['Post-Rock']},
					{from: ['Classic Soft Rock'], to: ['Soft Rock']},
					{from: ['Rock And Roll', 'Rock Roll'], to: ['Rock & Roll']},
					// Folk
					{from: ['Folk Rock'], to: ['Folk-Rock']},
					{from: ['Pop-Folk'], to: ['Folk Pop']},
					// Experimental
					{from: ['Avantgarde'], to: ['Avant-Garde']},
					{from: ['Psych', 'Psychedelic'], to: ['Psychedelic Rock']},
					// Soul
					{from: ['R B'], to: ['R&B']},
					{from: ['Soul Jazz'], to: ['Soul-Jazz']},
					{from: ['Rap Hip-Hop R B', 'Neo-Soul'], to: ['Neo Soul']},
					// Jazz
					{from: ['Jazz Instrument', 'Jazz Instrumental', 'Instrumental Jazz'], to: ['Jazz', 'Instrumental']},
					{from: ['Post Bop'], to: ['Post-Bop']},
					{from: ['Bop'], to: ['Bebop']},
					{from: ['Bossanova'], to: ['Bossa Nova']},
					{from: ['Modernjazz'], to: ['Modern Jazz']},
					{from: ['Hard Bop'], to: ['Hard-Bop']},
					{from: ['Jazz: Jazz Vocals', 'Jazz Vocals', 'Vocals', 'Vocal'], to: ['Vocal Jazz']},
					{from: ['Hard Bop'], to: ['Hard-Bop']},
					// Metal
					{from: ['Posthardcore'], to: ['Post-Hardcore']},
					{from: ['Postmetal'], to: ['Post-Metal']},
					{from: ['Metal', 'Rock And Roll_Rock_Heavy Metal'], to: ['Heavy Metal']},
					{from: ['Stoner'], to: ['Stoner Rock']},
					{from: ['Desert Rock'], to: ['Stoner Rock']},
					{from: ['Doom'], to: ['Doom Metal']},
					{from: ['Speed/Thrash Metal'], to: ['Speed Metal']},
					// African
					{from: ['Tichumaren'], to: ['Tishoumaren', 'African']},
					{from: ['Touareg'], to: ['Tuareg', 'African']},
					{from: ['Touareg Guitar'], to: ['Tuareg', 'Desert Blues', 'African']},
					{from: ['Tuareg Guitar'], to: ['Tuareg', 'Desert Blues', 'African']},
					{from: ['Tuareg Blues'], to: ['Tuareg', 'Desert Blues', 'African']},
					{from: ['African Blues'], to: ['African', 'Desert Blues']},
					{from: ['African-Jazz-Rock-Funk'], to: ['Afro-Rock', 'African']},
					// Misc
					{from: ['Latin American'], to: ['Latin']},
					{from: ['Christmas/Holiday'], to: ['Christmas']},
					{from: ['World-Fusion', 'World Music'], to: ['World']},
					{from: ['Female Vocals'], to: ['Female Vocal']},
					// Countries
					{from: ['Madrid'], to: ['Spanish']},
					{from: ['Barcelona'], to: ['Spanish']},
					{from: ['Boston'], to: ['English']},
					{from: ['Houston'], to: ['English']},
					{from: ['Portland'], to: ['English']},
					{from: ['Italy'], to: ['Italian']},
					{from: ['Cairo'], to: ['Egyptian']},
					{from: ['Agadez'], to: ['African', 'Nigerian']},
					{from: ['Niger'], to: ['Nigerian']},
					{from: ['Illighadad'], to: ['Nigerian']},
					{from: ['Africa'], to: ['African']},
					{from: ['Zagreb'], to: ['Croatian']}
				],
				clone: [
					{from: ['Chill']}
				],
			};
			// Copy "good" values if already present
			rules.subsitutions.forEach((rule) => { // Using the substitutions final values
				if (rule.to.every((tag) => tags.includes(tag.toLowerCase()))) {folksonomy.add.apply(folksonomy, rule.to);}
			});
			rules.clone.forEach((rule) => { // Or the cloning rules
				if (rule.from.every((tag) => tags.includes(tag.toLowerCase()))) {folksonomy.add.apply(folksonomy, rule.from);}
			});
			// Substitute all terms
			rules.subsitutions.forEach((rule) => {
				if (rule.from.some((tag) => tags.includes(tag.toLowerCase()))) {folksonomy.add.apply(folksonomy, rule.to);}
			});
		}
		return [...folksonomy];
	}
};