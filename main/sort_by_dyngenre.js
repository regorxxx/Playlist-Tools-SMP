'use strict';
//13/10/21

/*	
	Sort by Dyngenre
	-----------------------------------
	Uses notation described at 'dyngenre_map' on dyngenre_map_xxx.js to sort selection by genre/style.
*/ 

include('..\\helpers\\dyngenre_map_xxx.js');

const [,, genreStyleMap] = dyngenre_map();

function do_sort_by_dyngenre({
								playlistIdx = plman.ActivePlaylist,
								styleGenreTag = ['genre', 'style'],
								bSelection = true,
								sortOrder = 1,
								bDebug = false,
							} = {}) {
	// Safety checks
	if (!styleGenreTag.length) {return false;}
	if (playlistIdx >= plman.PlaylistCount) {return false;}
	if (!plman.PlaylistItemCount(playlistIdx)) {return false;}
	if (bSelection && !plman.GetPlaylistSelectedItems(playlistIdx).Count) {return false;}
	// List
	const handleList = bSelection ? plman.GetPlaylistSelectedItems(playlistIdx) : plman.GetPlaylistItems(playlistIdx);
	const count = handleList.Count;
	// Tags
	const idTfo = '[%tracknumber%]-[%title%]-[%path%]';
	const ids = fb.TitleFormat(idTfo).EvalWithMetadbs(handleList);
	const styleGenre = getTagsValuesV3(handleList, styleGenreTag, true);
	let dyngenre = [[]];
	for (let i = 0; i < count; i++) {
		const styleGenre_i = Array.from(new Set((styleGenre[i] ? styleGenre[i].filter(Boolean) : [])));
		const styleGenreLength = styleGenre_i.length;
		let dyngenreNum = 0;
		if (styleGenreLength) {
			for (let j = 0; j < styleGenreLength; j++) {
				let dyngenre_j = genreStyleMap.get(styleGenre_i[j]);
				if (dyngenre_j) {
					let k;
					let dyngenre_j_length = dyngenre_j.length;
					for (k = 0; k < dyngenre_j_length; k++) {
						if (!dyngenre[i]) {dyngenre[i] = [];}
						dyngenre[i].push(dyngenre_j[k]);
					}
				}
			}
			dyngenreNum = dyngenre[i] ? dyngenre[i].length : 0;
		}
		if (dyngenreNum) {
			dyngenre[i] = dyngenre[i].reduce((prev, next) => {return prev + next;}) / dyngenreNum;
		} else {
			dyngenre[i] = Infinity; // Not matched tracks are put at the end
		}
	}
	let tfo = '';
	// Translate into something usable on TF
	// Can not do the same than do_sort_by_key() because track may have multiple genre/styles
	// Therefore it would require a giant tfo comparing each value and then dividing by total number...
	// Better to identify each track and assign a value to it.
	// Also, instead of adding multiple individual if statements, better to nest them (so only those required are evaluated)
	dyngenre.forEach ( (val, index) => {
		tfo += '$if($stricmp(' + idTfo + ',\'' + ids[index] + '\'),' + (sortOrder * dyngenre[index]) + ',';
	});
	dyngenre.forEach ( () => {tfo += ')';}); // Add closures!
	if (bDebug) {console.log(tfo);}
	return plman.SortByFormat(playlistIdx, tfo, bSelection);
}