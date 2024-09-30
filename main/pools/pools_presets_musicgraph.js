'use strict';
//23/09/24

/* exported createPoolMusicGraphPresets */

include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryJoin:readable, queryCombinations:readable, */
include('..\\music_graph\\music_graph_descriptors_xxx.js');
/* global globTags:readable */

/* global music_graph_descriptors:readable */
function createPoolMusicGraphPresets({size = 50} = {}) {
	const tenth = Math.floor(size / 10) || 1;
	const pools = [];
	[...music_graph_descriptors.style_cluster, ...music_graph_descriptors.style_supergenre]
		.forEach((cluster) => {
			const genres = [...new Set(music_graph_descriptors.replaceWithSubstitutionsReverse(cluster[1]).concat(cluster[1]))];
			const genreQuery = queryJoin(
				queryCombinations(genres.map((s) => s.toLowerCase()), [globTags.genre, globTags.style], 'OR')
				, 'OR'
			);
			// Some groups require further splitting or finetuning
			const versions = (() => {
				const name = cluster[0].replace('_supergenre', ' Supergenre');
				if (cluster[0] === 'Downtempo_supergenre') {
					return [
						{
							name: 'Electronic ' + name,
							subFolder: music_graph_descriptors.getStyleGroup(cluster[0].replace('_supergenre', '')),
							query: queryJoin([
								genreQuery,
								queryJoin(queryCombinations(['electronic', 'hip-hop', 'electropop', 'industrial', 'synth-pop', 'trip-hop', 'future soul', 'contemporary r&b', 'chill-out downtempo'], [globTags.genre, globTags.style], 'OR'),'OR')
							], 'AND')
						},
						{
							name,
							subFolder: 'Other styles',
							query: queryJoin([
								genreQuery,
								queryJoin(queryCombinations(['electronic', 'hip-hop', 'electropop', 'industrial', 'synth-pop', 'trip-hop', 'future soul', 'contemporary r&b', 'chill-out downtempo'], [globTags.genre, globTags.style], 'OR'),'OR')
							], 'AND NOT')
						}
					];
				} else if (cluster[0] === 'Hardcore Punk_supergenre') {
					return [
						{
							name: 'Hardcore Rock-Metal Supergenre',
							subFolder: 'Metal and Hard Rock',
							query: queryJoin([
								genreQuery,
								queryJoin(queryCombinations(['heavy metal', 'hard rock'], [globTags.genre, globTags.style], 'OR'),'OR')
							], 'AND')
						},
						{
							name: 'Hardcore Psy-Alt-Punk Supergenre',
							subFolder: music_graph_descriptors.getStyleGroup(cluster[0].replace('_supergenre', '')),
							query: queryJoin([
								genreQuery,
								queryJoin(queryCombinations(['heavy metal', 'hard rock'], [globTags.genre, globTags.style], 'OR'),'OR')
							], 'AND NOT')
						}
					];
				} else {
					return [
						{
							name,
							subFolder: music_graph_descriptors.getStyleGroup(cluster[0].replace('_supergenre', '')),
							query: genreQuery,
						}
					];
				}
			})();
			versions.forEach((version) => {
				const pool = {
					name: version.name,
					folder: 'Music Graph mixes',
					subFolder: version.subFolder,
					pool: {
						fromPls: {
							_LIBRARY_0: tenth * 2,
							_LIBRARY_1: tenth * 3,
							_LIBRARY_2: tenth * 2,
							_LIBRARY_3: tenth * 2,
							_LIBRARY_4: tenth
						},
						query: {
							_LIBRARY_0: queryJoin(
								[
									version.query,
									globTags.rating + ' IS 5'
								]
								, 'AND'
							),
							_LIBRARY_1: queryJoin(
								[
									version.query,
									globTags.rating + ' IS 3'
								]
								, 'AND'
							),
							_LIBRARY_2: queryJoin(
								[
									version.query,
									globTags.rating + ' GREATER 3'
								]
								, 'AND'
							),
							_LIBRARY_3: queryJoin(
								[
									version.query,
									'(' + globTags.genre + ' IS female vocal OR ' + globTags.style + ' IS female vocal) AND ' + globTags.rating + ' GREATER 2'
								]
								, 'AND'
							),
							_LIBRARY_4: queryJoin(
								[
									version.query,
									queryJoin(queryCombinations(['instrumental', 'ambiental'], [globTags.genre, globTags.style], 'OR'),'OR'),
									globTags.rating + ' GREATER 2'
								]
								, 'AND'
							)
						},
						toPls: version.name,
						smartShuffle: 'ARTIST'
					}
				};
				pools.push(pool);
			});
		});
	return pools;
}