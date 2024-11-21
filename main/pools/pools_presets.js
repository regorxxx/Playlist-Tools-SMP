'use strict';
//03/11/24

/* exported createPoolPresets */

include('..\\..\\helpers\\helpers_xxx.js');
/* global globTags:readable, globQuery:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _qCond:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryJoin:readable, queryCombinations:readable */

function createPoolPresets({ size = 50 } = {}) {
	const half = Math.floor(size / 2) + Math.ceil(size % 4 / 2);
	const fourth = Math.floor(size / 4) || 1;
	const eighth = Math.floor(size / 8) || 1;
	const tenth = Math.floor(size / 10) || 1;
	return [
		...[ // Top tracks by rating
			{
				folder: 'Top tracks (rating)',
				name: 'Top tracks mix', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + globQuery.noInstrumental,
						_LIBRARY_1: globTags.rating + ' EQUAL 4',
						_LIBRARY_2: globQuery.ratingTop
					},
					toPls: 'Top tracks mix',
					sort: '', // Random
				}
			},
			{
				folder: 'Top tracks (rating)',
				name: 'Top tracks mix (harmonic)', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + globQuery.noInstrumental,
						_LIBRARY_1: globTags.rating + ' EQUAL 4',
						_LIBRARY_2: globQuery.ratingTop
					},
					toPls: 'Top tracks mix',
					harmonicMix: true
				}
			},
			{
				folder: 'Top tracks (rating)',
				name: 'Top tracks mix (intercalate)', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + globQuery.noInstrumental,
						_LIBRARY_1: globTags.rating + ' EQUAL 4',
						_LIBRARY_2: globQuery.ratingTop
					},
					insertMethod: 'intercalate',
					toPls: 'Top tracks mix'
				}
			},
			{ folder: 'Top tracks (rating)', name: 'sep' },
			{
				folder: 'Top tracks (rating)',
				name: 'This year tracks mix', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#',
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#',
						_LIBRARY_2: globQuery.ratingTop + ' AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#'
					},
					toPls: 'Top last year tracks mix',
					sort: '',
				}
			},
			{
				folder: 'Top tracks (rating)',
				name: 'Last 5 years tracks mix', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#',
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#',
						_LIBRARY_2: globQuery.ratingTop + ' AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#'
					},
					toPls: 'Top last 5 years tracks mix',
					sort: '',
				}
			},
			{
				folder: 'Top tracks (rating)',
				name: 'Last 10 years tracks mix', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,10)#',
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,10)#',
						_LIBRARY_2: globQuery.ratingTop + ' AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,10)#'
					},
					toPls: 'Top last 10 years tracks mix',
					sort: '',
				}
			},
			{ folder: 'Top tracks (rating)', name: 'sep' },
			{
				folder: 'Top tracks (rating)',
				name: 'Recently added tracks mix', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND %ADDED% DURING LAST 4 WEEKS',
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND %ADDED% DURING LAST 4 WEEKS',
						_LIBRARY_2: globQuery.ratingTop + ' AND %ADDED% DURING LAST 4 WEEKS'
					},
					toPls: 'Top recently added tracks mix',
					sort: '',
				}
			},
		],
		...[ // Top tracks by playcount
			{
				folder: 'Top tracks (playcount)',
				name: 'Recently played tracks mix', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + globQuery.recent,
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND ' + globQuery.recent,
						_LIBRARY_2: globQuery.ratingTop + ' AND ' + globQuery.recent
					},
					toPls: 'Top recently played tracks mix',
					sort: '',
				}
			},
			{ folder: 'Top tracks (playcount)', name: 'sep' },
			{
				folder: 'Top tracks (playcount)',
				name: 'Not recently played tracks mix', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND NOT ' + globQuery.recent,
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND NOT ' + globQuery.recent,
						_LIBRARY_2: globQuery.ratingTop + ' AND NOT ' + globQuery.recent
					},
					toPls: 'Top not played tracks mix',
					sort: '',
				}
			},
			{
				folder: 'Top tracks (playcount)',
				name: 'Not recently played this year tracks mix', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND NOT ' + globQuery.recent + ' AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#',
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND NOT ' + globQuery.recent + ' AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#',
						_LIBRARY_2: globQuery.ratingTop + ' AND NOT ' + globQuery.recent + ' AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#'
					},
					toPls: 'Top not played this year tracks mix',
					sort: '',
				}
			},
			{
				folder: 'Top tracks (playcount)',
				name: 'Not recently played last 5 years tracks mix', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND NOT ' + globQuery.recent + ' AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#',
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND NOT ' + globQuery.recent + ' AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#',
						_LIBRARY_2: globQuery.ratingTop + ' AND NOT ' + globQuery.recent + ' AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#'
					},
					toPls: 'Top not recently played last 5 years tracks mix',
					sort: '',
				}
			},
			{ folder: 'Top tracks (playcount)', name: 'sep' },
			{
				folder: 'Top tracks (playcount)',
				name: 'Least played tracks mix', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 SORT ASCENDING BY ' + _qCond(globTags.playCount),
						_LIBRARY_1: globTags.rating + ' EQUAL 4 SORT ASCENDING BY ' + _qCond(globTags.playCount),
						_LIBRARY_2: globQuery.ratingTop + ' SORT ASCENDING BY ' + _qCond(globTags.playCount)
					},
					toPls: 'Top least played tracks mix',
					sort: '',
				}
			},
			{
				folder: 'Top tracks (playcount)',
				name: 'Least played this year tracks mix', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)# SORT ASCENDING BY ' + _qCond(globTags.playCount),
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)# SORT ASCENDING BY ' + _qCond(globTags.playCount),
						_LIBRARY_2: globQuery.ratingTop + ' AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)# SORT ASCENDING BY ' + _qCond(globTags.playCount)
					},
					toPls: 'Top least played this year tracks mix',
					sort: '',
				}
			},
			{
				folder: 'Top tracks (playcount)',
				name: 'Least played last 5 years tracks mix', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: half
					},
					query: {
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)# SORT ASCENDING BY ' + _qCond(globTags.playCount),
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)# SORT ASCENDING BY ' + _qCond(globTags.playCount),
						_LIBRARY_2: globQuery.ratingTop + ' AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)# SORT ASCENDING BY ' + _qCond(globTags.playCount)
					},
					toPls: 'Top least played last 5 years tracks mix',
					sort: '',
				}
			},
		],
		{ name: 'sep' },
		...[ // From selection
			{
				folder: 'From current track',
				name: 'Genre top tracks', pool: {
					fromPls: {
						_LIBRARY_0: half,
						_LIBRARY_1: eighth,
						_LIBRARY_2: fourth + eighth
					},
					query: {
						_LIBRARY_0: globTags.genre + ' IS #' + globTags.genre + '# AND ' + globQuery.notLowRating,
						_LIBRARY_1: globTags.style + ' IS #' + globTags.style + '# AND ' + globQuery.ratingGr3,
						_LIBRARY_2: globTags.genre + ' IS #' + globTags.genre + '# AND (' + globQuery.ratingGr3 + ' OR ' + globQuery.loved + ')'
					},
					toPls: 'Current genre top tracks',
					sort: '',
				}
			},
			{
				folder: 'From current track',
				name: 'Style top tracks', pool: {
					fromPls: {
						_LIBRARY_0: half,
						_LIBRARY_1: eighth,
						_LIBRARY_2: fourth + eighth
					},
					query: {
						_LIBRARY_0: globTags.style + ' IS #' + globTags.style + '# AND ' + globQuery.notLowRating,
						_LIBRARY_1: globTags.genre + ' IS #' + globTags.genre + '# AND ' + globQuery.ratingGr3,
						_LIBRARY_2: globTags.style + ' IS #' + globTags.style + '# AND  (' + globQuery.ratingGr3 + ' OR ' + globQuery.loved + ')'
					},
					toPls: 'Current style top tracks',
					sort: '',
				}
			},
			{ folder: 'From current track', name: 'sep' },
			{
				folder: 'From current track',
				name: 'Genre/Style top tracks', pool: {
					fromPls: {
						_LIBRARY_0: half,
						_LIBRARY_1: fourth,
						_LIBRARY_2: fourth
					},
					query: {
						_LIBRARY_0: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND ' + globQuery.notLowRating,
						_LIBRARY_1: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND ' + globQuery.ratingGr3,
						_LIBRARY_2: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND ' + globQuery.fav
					},
					toPls: 'Current genre/style top tracks',
					sort: '',
				}
			},
			{
				folder: 'From current track',
				name: 'Genre/Style and Instrumentals', pool: {
					fromPls: {
						_LIBRARY_0: half,
						_LIBRARY_1: fourth,
						_LIBRARY_2: fourth
					},
					query: {
						_LIBRARY_0: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND ' + globQuery.notLowRating,
						_LIBRARY_1: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND ' + globQuery.fav,
						_LIBRARY_2: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND (' + globQuery.instrumental + ') AND ' + globQuery.notLowRating
					},
					toPls: 'Current genre/style and instrumentals',
					sort: '',
				}
			},
			{
				folder: 'From current track',
				name: 'Genre/Style least played tracks', pool: {
					fromPls: {
						_LIBRARY_0: half,
						_LIBRARY_1: fourth,
						_LIBRARY_2: fourth
					},
					query: {
						_LIBRARY_0: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND NOT (' + globQuery.recent + ') SORT ASCENDING BY ' + _qCond(globTags.playCount),
						_LIBRARY_1: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND ' + globQuery.ratingGr3 + ' SORT ASCENDING BY ' + _qCond(globTags.playCount),
						_LIBRARY_2: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND ' + globQuery.fav + ' SORT ASCENDING BY ' + _qCond(globTags.playCount)
					},
					pickMethod: {
						_LIBRARY_0: 'start',
						_LIBRARY_1: 'start',
						_LIBRARY_2: 'start'
					},
					toPls: 'Current genre/style top tracks',
					sort: '',
				}
			},
			{ folder: 'From current track', name: 'sep' },
			{
				folder: 'From current track',
				name: 'Artist\'s top tracks', pool: {
					fromPls: {
						_LIBRARY_0: half,
						_LIBRARY_1: half
					},
					query: {
						_LIBRARY_0: globTags.artist + ' IS #' + globTags.artistRaw + '# AND ' + globQuery.ratingGr3,
						_LIBRARY_1: globTags.artist + ' IS #' + globTags.artistRaw + '# AND ' + globQuery.fav
					},
					toPls: 'Current artist\'s top tracks',
					sort: '',
				}
			},
			{
				folder: 'From current track',
				name: 'Artist\'s least played tracks', pool: {
					fromPls: {
						_LIBRARY_0: half,
						_LIBRARY_1: half
					},
					query: {
						_LIBRARY_0: globTags.artist + ' IS #' + globTags.artistRaw + '# AND NOT (' + globQuery.recent + ') SORT ASCENDING BY ' + _qCond(globTags.playCount),
						_LIBRARY_1: globTags.artist + ' IS #' + globTags.artistRaw + '# AND ' + globQuery.fav + ' SORT ASCENDING BY ' + _qCond(globTags.playCount)
					},
					pickMethod: {
						_LIBRARY_0: 'start',
						_LIBRARY_1: 'start'
					},
					toPls: 'Current artist\'s least played tracks',
					sort: '',
				}
			},
			{ folder: 'From current track', name: 'sep' },
			{
				folder: 'From current track',
				name: 'Genre/Style and Artist\'s loved tracks', pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: fourth,
						_LIBRARY_3: fourth,
					},
					query: {
						_LIBRARY_0: globTags.genre + ' IS #' + globTags.genre + '# AND ' + globQuery.loved,
						_LIBRARY_1: globTags.style + ' IS #' + globTags.style + '# AND ' + globQuery.loved,
						_LIBRARY_2: globTags.artist + ' IS #' + globTags.artistRaw + '# AND ' + globQuery.loved,
						_LIBRARY_3: '((' + globTags.style + ' IS #' + globTags.style + ') OR (' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.artist + ' IS #' + globTags.artistRaw + '#)) AND ' + globQuery.loved,
					},
					toPls: 'Genre/style and artist\'s loved tracks',
					sort: '',
				}
			},
		],
		{ name: 'sep' },
		...[ // Classic Pools
			{
				folder: 'Classic Pools',
				name: 'Classic Pools (50 artists current genre)', pool: {
					fromPls: { _GROUP_0: 50 },
					group: { _GROUP_0: globTags.artist },
					limit: { _GROUP_0: 3 },
					query: { _GROUP_0: '' + globTags.genre + ' IS #' + globTags.genre + '#' },
					toPls: 'Classic Pools (50 artists current genre)',
					sort: '',
				}
			},
			{
				folder: 'Classic Pools',
				name: 'Classic Pools (50 random artists)', pool: {
					fromPls: { _GROUP_0: 50 },
					group: { _GROUP_0: globTags.artist },
					limit: { _GROUP_0: 3 },
					query: { _GROUP_0: '' },
					toPls: 'Classic Pools (50 artists)',
					sort: '',
				}
			},
			{
				folder: 'Classic Pools',
				name: 'Classic Pools (all dates)', pool: {
					fromPls: { _GROUP_0: Infinity },
					group: { _GROUP_0: globTags.date },
					limit: { _GROUP_0: 2 },
					query: { _GROUP_0: '' },
					toPls: 'Classic Pools (all dates)',
					sort: globTags.date,
				}
			},
			{
				folder: 'Classic Pools',
				name: 'Classic Pools (3 tracks per letter)', pool: {
					fromPls: { _GROUP_0: Infinity },
					group: { _GROUP_0: '$lower($ascii($left(' + globTags.artist + ',1)))' },
					limit: { _GROUP_0: 3 },
					query: { _GROUP_0: '' },
					toPls: 'Classic Pools (3 tracks per letter)',
					sort: '',
				}
			},
			{
				folder: 'Classic Pools',
				name: 'Classic Pools (3 tracks per genre)', pool: {
					fromPls: { _GROUP_0: Infinity },
					group: { _GROUP_0: globTags.genre },
					limit: { _GROUP_0: 3 },
					query: { _GROUP_0: '' },
					toPls: 'Classic Pools (3 tracks per genre)',
					sort: '',
				}
			},
		],
		{ name: 'sep' },
		...[ // Genre mixes
			{
				name: 'Dark Metal',
				folder: 'Genre mixes',
				pool: {
					fromPls: {
						_LIBRARY_0: tenth * 2,
						_LIBRARY_1: tenth,
						_LIBRARY_2: Math.ceil(tenth * 1.6),
						_LIBRARY_3: Math.ceil(tenth * 1.6),
						_LIBRARY_4: tenth,
						_LIBRARY_5: tenth,
						_LIBRARY_6: tenth
					},
					query: {
						_LIBRARY_0: queryJoin([
							queryJoin(
								queryCombinations(
									['black metal', 'stoner doom', 'doom metal', 'death metal'],
									[globTags.genre, globTags.style],
									'OR'
								),
								'OR'
							),
							globQuery.fav
						],'AND'),
						_LIBRARY_1: queryJoin([
							queryJoin([
								queryJoin(
									queryCombinations(['black metal'],[globTags.genre, globTags.style],'OR'	),
									'OR'
								),
								queryJoin(
									queryCombinations(['folk metal'],[globTags.genre, globTags.style],'OR'	),
									'OR'
								),
							], 'AND NOT'),
							globTags.rating + ' IS 4 OR ' + globTags.rating + ' IS 3'
						],'AND'),
						_LIBRARY_2: queryJoin([
							queryJoin([
								queryJoin(
									queryCombinations(['stoner doom'],[globTags.genre, globTags.style],'OR'	),
									'OR'
								),
								queryJoin(
									queryCombinations(['folk metal'],[globTags.genre, globTags.style],'OR'	),
									'OR'
								),
							], 'AND NOT'),
							globTags.rating + ' IS 4 OR ' + globTags.rating + ' IS 3'
						],'AND'),
						_LIBRARY_3: queryJoin([
							queryJoin([
								queryJoin(
									queryCombinations(['doom metal'],[globTags.genre, globTags.style],'OR'	),
									'OR'
								),
								queryJoin(
									queryCombinations(['folk metal'],[globTags.genre, globTags.style],'OR'	),
									'OR'
								),
							], 'AND NOT'),
							globTags.rating + ' IS 4 OR ' + globTags.rating + ' IS 3'
						],'AND'),
						_LIBRARY_4: queryJoin([
							queryJoin([
								queryJoin(
									queryCombinations(['folk metal'],[globTags.genre, globTags.style],'OR'	),
									'OR'
								),
								queryJoin(
									queryCombinations(['black metal','stoner doom','doom metal','death metal'],[globTags.genre, globTags.style],'OR'	),
									'OR'
								),
							], 'AND'),
							globQuery.ratingGr2
						],'AND'),
						_LIBRARY_5: queryJoin([
							queryJoin([
								queryJoin(
									queryCombinations(['black metal','stoner doom','doom metal','death metal'],[globTags.genre, globTags.style],'OR'	),
									'OR'
								),
								queryJoin(
									queryCombinations(['instrumental'],[globTags.genre, globTags.style],'OR'	),
									'OR'
								),
							], 'AND'),
							globQuery.ratingGr2
						],'AND'),
						_LIBRARY_6: queryJoin([
							queryJoin([
								queryJoin(
									queryCombinations(['black metal','ambient metal'],[globTags.genre, globTags.style],'AND'),
									'OR'
								),
								queryJoin(
									queryCombinations(['death metal','acoustic'],[globTags.genre, globTags.style],'AND'	),
									'OR'
								),
								queryJoin(
									queryCombinations(['atmospheric black metal'],[globTags.genre, globTags.style],'OR'	),
									'OR'
								),
							], 'OR'),
							globQuery.ratingGr3
						],'AND')
					},
					toPls: 'Dark Metal',
					smartShuffle: 'ARTIST'
				}
			},
			{
				name: 'Kawaii Rock and Metal',
				folder: 'Genre mixes',
				pool: {
					fromPls: {
						_LIBRARY_0: tenth * 2,
						_LIBRARY_1: tenth,
						_LIBRARY_2: tenth * 2,
						_LIBRARY_3: tenth,
						_LIBRARY_4: tenth * 2
					},
					query: {
						_LIBRARY_0: globTags.style + ' IS kawaii metal AND ' + globQuery.fav,
						_LIBRARY_1: globTags.style + ' IS j-pop AND (' + globTags.genre + ' IS rock OR ' + globTags.genre + ' IS heavy metal) AND ' + globQuery.ratingGr2,
						_LIBRARY_2: globTags.style + ' IS kawaii metal AND (' + globTags.rating + ' IS 4 OR ' + globTags.rating + ' IS 3)',
						_LIBRARY_3: globTags.style + ' IS kawaii metal AND ' + globTags.genre + ' IS instrumental AND ' + globQuery.ratingGr2,
						_LIBRARY_4: globTags.style + ' IS kawaii metal OR (' + globTags.style + ' IS j-pop AND (' + globTags.genre + ' IS rock OR ' + globTags.genre + ' IS heavy metal)) AND ' + globTags.style + ' IS female vocal AND ' + globQuery.ratingGr2
					},
					toPls: 'Kawaii Metal',
					smartShuffle: 'ARTIST'
				}
			},
			{
				name: 'Chill and Downtempo',
				folder: 'Genre mixes',
				pool: {
					fromPls: {
						_LIBRARY_0: tenth * 3 - Math.floor(tenth * 0.4),
						_LIBRARY_1: Math.floor(tenth * 1.8),
						_LIBRARY_2: Math.floor(tenth * 1.8),
						_LIBRARY_3: Math.floor(tenth * 0.9) || 1,
						_LIBRARY_4: tenth * 3 - Math.floor(tenth * 0.4),
						_LIBRARY_5: Math.floor(tenth * 0.9) || 1
					},
					query: {
						_LIBRARY_0: '(' + globTags.style + ' IS chill-out downtempo OR ' + globTags.style + ' IS trip hop OR ' + globTags.style + ' IS deep house) AND ' + globQuery.fav,
						_LIBRARY_1: globTags.style + ' IS trip hop AND (MOOD IS not aggressive AND MOOD IS relaxed) AND (' + globTags.rating + ' IS 4 OR ' + globTags.rating + ' IS 3)',
						_LIBRARY_2: '(' + globTags.style + ' IS contemporary r&b OR ' + globTags.style + ' IS neo soul) AND (MOOD IS not aggressive AND MOOD IS relaxed) AND (' + globTags.rating + ' IS 4 OR ' + globTags.rating + ' IS 3)',
						_LIBRARY_3: globTags.style + ' IS deep house AND (MOOD IS not aggressive AND MOOD IS relaxed AND BPM LESS 140) AND (' + globTags.rating + ' IS 4 OR ' + globTags.rating + ' IS 3)',
						_LIBRARY_4: '(' + globTags.style + ' IS chill-out downtempo OR ' + globTags.style + ' IS trip hop OR ' + globTags.style + ' IS deep house) AND ' + globTags.style + ' IS female vocal AND (MOOD IS not aggressive AND MOOD IS relaxed) AND ' + globQuery.ratingGr2,
						_LIBRARY_5: '(' + globTags.style + ' IS chill-out downtempo OR ' + globTags.style + ' IS trip hop OR ' + globTags.style + ' IS deep house) AND ' + globTags.genre + ' IS instrumental AND (MOOD IS not aggressive AND MOOD IS relaxed) AND ' + globQuery.ratingGr2
					},
					toPls: 'Chill and Downtempo',
					smartShuffle: 'ARTIST'
				}
			},
			{
				name: 'Spanish Urban Music',
				folder: 'Genre mixes',
				pool: {
					fromPls: {
						_LIBRARY_0: Math.floor(tenth * 1.2),
						_LIBRARY_1: Math.floor(tenth * 1.8),
						_LIBRARY_2: Math.floor(tenth * 1.8),
						_LIBRARY_3: Math.floor(tenth * 0.9) || 1,
						_LIBRARY_4: tenth * 3 - Math.floor(tenth * 0.4),
						_LIBRARY_5: Math.floor(tenth * 0.9) || 1,
						_LIBRARY_6: Math.floor(tenth * 0.9) || 1,
						_LIBRARY_7: Math.floor(tenth * 0.9) || 1,
						_LIBRARY_8: Math.floor(tenth * 1.4)
					},
					query: {
						_LIBRARY_0: '(' + globTags.style + ' IS trap OR ' + globTags.genre + ' IS hip-hop) AND (LANGUAGE IS spa OR ' + globTags.style + ' IS spanish hip-hop OR ' + globTags.style + ' IS urban breaks) AND NOT (' + globTags.style + ' IS rap metal) AND ' + globQuery.fav,
						_LIBRARY_1: '(' + globTags.style + ' IS trap OR ' + globTags.genre + ' IS hip-hop) AND (LANGUAGE IS spa OR ' + globTags.style + ' IS spanish hip-hop OR ' + globTags.style + ' IS latin trap) AND NOT (' + globTags.style + ' IS rap metal) AND (' + globTags.rating + ' IS 4 OR ' + globTags.rating + ' IS 3)',
						_LIBRARY_2: globTags.style + ' IS spanish hip-hop AND NOT (' + globTags.style + ' IS rap metal) AND (' + globTags.rating + ' IS 4 OR ' + globTags.rating + ' IS 3)',
						_LIBRARY_3: '(' + globTags.style + ' IS flamenco OR ' + globTags.style + ' IS rumba flamenca) AND ' + globTags.genre + ' IS hip-hop AND ' + globQuery.ratingGr2,
						_LIBRARY_4: '(' + globTags.style + ' IS trap OR ' + globTags.genre + ' IS hip-hop) AND (LANGUAGE IS spa OR ' + globTags.style + ' IS spanish hip-hop OR ' + globTags.style + ' IS latin trap OR ' + globTags.style + ' IS urban breaks) AND NOT (' + globTags.style + ' IS rap metal) AND ' + globTags.style + ' IS female vocal AND ' + globQuery.ratingGr2,
						_LIBRARY_5: globTags.style + ' IS nuevo flamenco AND ' + globTags.genre + ' IS hip-hop AND DATE GREATER 2000 AND ' + globQuery.ratingGr3,
						_LIBRARY_6: '(' + globTags.style + ' IS flamenco rock OR ' + globTags.style + ' IS flamenco OR ' + globTags.style + ' IS rumba flamenca) AND (' + globTags.style + ' IS spanish folk OR ' + globTags.style + ' IS spanish rock) AND DATE GREATER 2000 AND ' + globQuery.ratingGr3,
						_LIBRARY_7: '(' + globTags.style + ' IS rumba fusion OR ' + globTags.style + ' IS rumba) AND ' + globTags.style + ' IS spanish rock AND DATE GREATER 2000 AND ' + globQuery.ratingGr3,
						_LIBRARY_8: '(' + globTags.style + ' IS trap OR ' + globTags.genre + ' IS hip-hop) AND (LANGUAGE IS spa OR ' + globTags.style + ' IS spanish hip-hop OR ' + globTags.style + ' IS latin trap) AND NOT (' + globTags.style + ' IS rap metal) AND ' + globQuery.fav,
					},
					toPls: 'Spanish Urban Music',
					smartShuffle: 'ARTIST'
				}
			},
			{
				name: 'Rock Classics (until 90s)',
				folder: 'Genre mixes',
				pool: {
					fromPls: {
						_LIBRARY_0: Math.floor(tenth * 1.4),
						_LIBRARY_1: Math.floor(tenth * 1.5),
						_LIBRARY_2: Math.floor(tenth * 1.4),
						_LIBRARY_3: Math.floor(tenth * 0.8) || 1,
						_LIBRARY_4: tenth,
						_LIBRARY_5: Math.floor(tenth * 1.4) || 1,
						_LIBRARY_6: tenth,
						_LIBRARY_7: Math.floor(tenth * 0.8) || 1,
						_LIBRARY_8: Math.floor(tenth * 0.5) || 1,
					},
					query: {
						_LIBRARY_0: globTags.style + ' IS classic rock AND ' + globTags.genre + ' IS rock AND DATE LESS 1990 AND ' + globQuery.fav,
						_LIBRARY_1: globTags.style + ' IS classic rock AND ' + globTags.genre + ' IS rock AND DATE LESS 1990 AND ' + globTags.rating + ' IS 4',
						_LIBRARY_2: globTags.style + ' IS classic rock AND ' + globTags.genre + ' IS rock AND DATE LESS 1990 AND ' + globTags.rating + ' IS 3',
						_LIBRARY_3: globTags.style + ' IS classic rock AND ' + globTags.genre + ' IS folk-rock AND DATE LESS 1990 AND ' + globQuery.ratingGr3,
						_LIBRARY_4: globTags.style + ' IS classic rock AND ' + globTags.style + ' IS female vocal AND DATE LESS 1990 AND ' + globQuery.ratingGr2,
						_LIBRARY_5: globTags.genre + ' IS rock AND NOT ' + globTags.style + ' IS 80s rock AND DATE GREATER 1960 AND DATE LESS 1980 AND ' + globQuery.ratingGr3,
						_LIBRARY_6: globTags.genre + ' IS hard rock AND ' + globTags.style + ' IS classic rock AND DATE LESS 1990 AND ' + globQuery.ratingGr2,
						_LIBRARY_7: '(' + globTags.style + ' IS beat music OR ' + globTags.style + ' IS soft rock OR ' + globTags.genre + ' IS rock & roll) AND DATE GREATER 1960 AND DATE LESS 1980 AND ' + globQuery.fav,
						_LIBRARY_8: globTags.genre + ' IS rock & roll AND DATE GREATER 1960 AND DATE LESS 1980 AND ' + globQuery.fav,
					},
					toPls: 'Rock Classics (until 90s)',
					smartShuffle: 'ARTIST'
				}
			},
			{
				name: '60s & 70s Rock Classics',
				folder: 'Genre mixes',
				pool: {
					fromPls: {
						_LIBRARY_0: Math.floor(tenth * 1.4),
						_LIBRARY_1: Math.floor(tenth * 1.5),
						_LIBRARY_2: Math.floor(tenth * 1.4),
						_LIBRARY_3: Math.floor(tenth * 0.8) || 1,
						_LIBRARY_4: tenth,
						_LIBRARY_5: Math.floor(tenth * 1.4) || 1,
						_LIBRARY_6: tenth,
						_LIBRARY_7: Math.floor(tenth * 0.8) || 1,
						_LIBRARY_8: Math.floor(tenth * 0.5) || 1,
					},
					query: {
						_LIBRARY_0: globTags.style + ' IS classic rock AND ' + globTags.genre + ' IS rock AND DATE LESS 1979 AND ' + globQuery.fav,
						_LIBRARY_1: globTags.style + ' IS classic rock AND ' + globTags.genre + ' IS rock AND DATE LESS 1979 AND ' + globTags.rating + ' IS 4',
						_LIBRARY_2: globTags.style + ' IS classic rock AND ' + globTags.genre + ' IS rock AND DATE LESS 1979 AND ' + globTags.rating + ' IS 3',
						_LIBRARY_3: globTags.style + ' IS classic rock AND ' + globTags.genre + ' IS folk-rock AND DATE LESS 1979 AND ' + globQuery.ratingGr3,
						_LIBRARY_4: globTags.style + ' IS classic rock AND ' + globTags.style + ' IS female vocal AND DATE LESS 1979 AND ' + globQuery.ratingGr2,
						_LIBRARY_5: globTags.genre + ' IS rock AND NOT ' + globTags.style + ' IS 80s rock AND DATE GREATER 1959 AND DATE LESS 1979 AND ' + globQuery.ratingGr3,
						_LIBRARY_6: globTags.genre + ' IS hard rock AND ' + globTags.style + ' IS classic rock AND DATE LESS 1979 AND ' + globQuery.ratingGr2,
						_LIBRARY_7: '(' + globTags.style + ' IS beat music OR ' + globTags.style + ' IS soft rock OR ' + globTags.genre + ' IS rock & roll) AND DATE GREATER 1959 AND DATE LESS 1979 AND ' + globQuery.fav,
						_LIBRARY_8: globTags.genre + ' IS rock & roll AND DATE GREATER 1959 AND DATE LESS 1979 AND ' + globQuery.fav,
					},
					toPls: '60s & 70s Rock Classics',
					smartShuffle: 'ARTIST'
				}
			},
			{
				name: '60s Psychedelic Pills',
				folder: 'Genre mixes',
				pool: {
					fromPls: {
						_LIBRARY_0: Math.floor(tenth * 1.5),
						_LIBRARY_1: tenth,
						_LIBRARY_2: tenth,
						_LIBRARY_3: tenth,
						_LIBRARY_4: Math.floor(tenth * 1.5),
						_LIBRARY_5: tenth,
						_LIBRARY_6: tenth,
						_LIBRARY_7: tenth,
						_LIBRARY_8: tenth,
					},
					query: {
						_LIBRARY_0: globTags.style + ' IS acid rock AND ' + globTags.genre + ' IS psychedelic rock AND DATE GREATER 1960 AND DATE LESS 1971 AND ' + globQuery.fav,
						_LIBRARY_1: '(' + globTags.style + ' IS acid rock OR ' + globTags.style + ' IS raga rock) AND ' + globTags.genre + ' IS psychedelic rock AND DATE GREATER 1960 AND DATE LESS 1971 AND ' + globQuery.ratingGr3,
						_LIBRARY_2: globTags.style + ' IS acid rock AND (' + globTags.genre + ' IS rock OR ' + globTags.genre + ' IS folk-rock) AND DATE GREATER 1960 AND DATE LESS 1971 AND ' + globQuery.ratingGr2,
						_LIBRARY_3: globTags.style + ' IS british psychedelia AND ' + globTags.genre + ' IS psychedelic rock AND DATE GREATER 1960 AND DATE LESS 1971 AND ' + globQuery.fav,
						_LIBRARY_4: globTags.style + ' IS british psychedelia AND (' + globTags.genre + ' IS rock OR ' + globTags.genre + ' IS folk-rock OR ' + globTags.genre + ' IS psychedelic rock) AND DATE GREATER 1960 AND DATE LESS 1971 AND ' + globQuery.ratingGr2,
						_LIBRARY_5: '(' + globTags.style + ' IS krautrock OR ' + globTags.style + ' IS space rock OR ' + globTags.style + ' IS italian prog. rock OR ' + globTags.style + ' IS japanese prog. rock) AND ' + globTags.genre + ' IS psychedelic rock AND DATE GREATER 1960 AND DATE LESS 1971 AND ' + globQuery.ratingGr3,
						_LIBRARY_6: globTags.style + ' IS psychedelic folk AND DATE GREATER 1960 AND DATE LESS 1971 AND ' + globQuery.ratingGr2,
						_LIBRARY_7: '(' + globTags.style + ' IS psychedelic pop OR ' + globTags.style + ' IS sunshine pop) AND DATE GREATER 1960 AND DATE LESS 1971 AND ' + globQuery.ratingGr3,
						_LIBRARY_8: '(' + globTags.style + ' IS psychedelic soul OR ' + globTags.style + ' IS psychedelic funk OR ' + globTags.style + ' IS psychedelic blues) AND DATE GREATER 1960 AND DATE LESS 1971 AND ' + globQuery.fav,
					},
					toPls: '60s Psychedelic Pills',
					smartShuffle: 'ARTIST'
				}
			},
			{
				name: '80s Hits',
				folder: 'Genre mixes',
				pool: {
					fromPls: {
						_LIBRARY_0: Math.floor(tenth * 1.4),
						_LIBRARY_1: Math.floor(tenth * 1.4),
						_LIBRARY_2: Math.floor(tenth * 1.4),
						_LIBRARY_3: Math.floor(tenth * 0.8) || 1,
						_LIBRARY_4: tenth,
						_LIBRARY_5: Math.floor(tenth * 1.4) || 1,
						_LIBRARY_6: tenth,
						_LIBRARY_7: Math.floor(tenth * 0.8) || 1,
						_LIBRARY_8: Math.floor(tenth * 0.7) || 1,
					},
					query: {
						_LIBRARY_0: globTags.style + ' IS 80s rock AND ' + globTags.genre + ' IS rock AND DATE LESS 1992 AND ' + globQuery.fav,
						_LIBRARY_1: globTags.style + ' IS 80s rock AND (' + globTags.genre + ' IS rock OR ' + globTags.genre + ' IS pop) AND DATE LESS 1992 AND ' + globTags.rating + ' IS 4',
						_LIBRARY_2: globTags.style + ' IS 80s rock AND (' + globTags.genre + ' IS rock OR ' + globTags.genre + ' IS pop) AND DATE LESS 1992 AND ' + globTags.rating + ' IS 3',
						_LIBRARY_3: globTags.style + ' IS 80s rock AND (' + globTags.genre + ' IS folk-rock OR ' + globTags.genre + ' IS blues OR ' + globTags.genre + ' IS alt. rock) AND DATE LESS 1992 AND ' + globQuery.ratingGr3,
						_LIBRARY_4: globTags.style + ' IS 80s rock OR (' + globTags.genre + ' IS rock AND DATE GREATER 1979 AND DATE LESS 1990) AND ' + globTags.style + ' IS female vocal AND ' + globQuery.ratingGr2,
						_LIBRARY_5: globTags.style + ' IS power pop AND DATE GREATER 1979 AND DATE LESS 1990 AND ' + globQuery.ratingGr3,
						_LIBRARY_6: globTags.style + ' IS new wave AND DATE GREATER 1979 AND DATE LESS 1990 AND ' + globQuery.ratingGr3,
						_LIBRARY_7: '(' + globTags.style + ' IS post-punk OR ' + globTags.style + ' IS soft rock OR ' + globTags.genre + ' IS rock & roll) AND DATE GREATER 1979 AND DATE LESS 1990 AND ' + globQuery.ratingGr3,
						_LIBRARY_8: '(' + globTags.style + ' IS euro-pop OR ' + globTags.style + ' IS sophisti-pop OR ' + globTags.style + ' IS disco OR ' + globTags.style + ' IS smooth soul) AND DATE GREATER 1979 AND DATE LESS 1990 AND ' + globQuery.ratingGr3,
					},
					toPls: '80s Hits',
					smartShuffle: 'ARTIST'
				}
			},
			{
				name: 'Gothic Rock',
				folder: 'Genre mixes',
				pool: {
					fromPls: {
						_LIBRARY_0: tenth * 2 + (tenth > 2 ? (tenth - 3 * (Math.ceil(tenth * 0.9) || 1)) : 0),
						_LIBRARY_1: tenth * 2,
						_LIBRARY_2: tenth * 3,
						_LIBRARY_3: Math.floor(tenth * 0.9) || 1,
						_LIBRARY_4: Math.floor(tenth * 0.9) || 1,
						_LIBRARY_5: Math.floor(tenth * 0.9) || 1
					},
					query: {
						_LIBRARY_0: '(' + globTags.style + ' IS darkwave OR ' + globTags.style + ' IS gothic rock OR ' + globTags.style + ' IS post-punk) AND ' + globQuery.fav,
						_LIBRARY_1: '(' + globTags.style + ' IS darkwave OR ' + globTags.style + ' IS gothic rock OR ' + globTags.style + ' IS post-punk) AND DATE LESS 2000 AND ' + globQuery.fav,
						_LIBRARY_2: '(' + globTags.style + ' IS darkwave OR ' + globTags.style + ' IS gothic rock OR ' + globTags.style + ' IS post-punk) AND ' + globQuery.ratingGr2,
						_LIBRARY_3: '(' + globTags.style + ' IS darkwave OR ' + globTags.style + ' IS gothic rock OR ' + globTags.style + ' IS post-punk) AND ' + globTags.style + ' IS female vocal AND ' + globQuery.ratingGr2,
						_LIBRARY_4: '(' + globTags.style + ' IS gothic metal) AND ' + globQuery.ratingGr3,
						_LIBRARY_5: '(' + globTags.style + ' IS darksynth OR ' + globTags.style + ' IS dark techno) AND ' + globQuery.ratingGr3
					},
					toPls: 'Gothic Rock',
					smartShuffle: 'ARTIST'
				}
			},
			{
				name: 'Gothic Metal',
				folder: 'Genre mixes',
				pool: {
					fromPls: {
						_LIBRARY_0: tenth,
						_LIBRARY_1: tenth,
						_LIBRARY_2: tenth,
						_LIBRARY_3: tenth,
						_LIBRARY_4: Math.floor((size - tenth * 7) / 2),
						_LIBRARY_5: size - tenth * 7 - Math.floor((size - tenth * 7) / 2),
						_LIBRARY_6: tenth,
						_LIBRARY_7: tenth,
						_LIBRARY_8: tenth
					},
					query: {
						_LIBRARY_0: globTags.style + ' IS gothic metal AND ' + globQuery.fav,
						_LIBRARY_1: globTags.style + ' IS atmospheric black metal AND ' + globQuery.ratingGr3,
						_LIBRARY_2: globTags.style + ' IS black metal AND ' + globQuery.fav,
						_LIBRARY_3: '(' + globTags.style + ' IS dark techno OR ' + globTags.style + ' IS dark ambient) AND ' + globTags.genre + ' IS heavy metal AND ' + globQuery.ratingGr3,
						_LIBRARY_4: globTags.style + ' IS doom metal AND ' + globTags.genre + ' IS heavy metal AND ' + globQuery.ratingGr3,
						_LIBRARY_5: globTags.style + ' IS doom metal AND ' + globTags.genre + ' IS heavy metal AND ' + globTags.style + ' IS female vocal AND ' + globQuery.ratingGr3,
						_LIBRARY_6: globTags.style + ' IS doom metal AND (' + globTags.rating + ' IS 5 OR ' + globTags.style + ' IS female vocal AND ' + globTags.rating + ' IS 4)',
						_LIBRARY_7: '(' + globTags.style + ' IS pagan metal OR ' + globTags.style + ' IS sludge metal OR ' + globTags.style + ' IS stoner doom OR ' + globTags.style + ' IS stoner sludge) AND ' + globTags.genre + ' IS heavy metal AND ' + globQuery.ratingGr3,
						_LIBRARY_8: globTags.style + ' IS gothic metal AND ' + globTags.style + ' IS female vocal AND ' + globQuery.fav
					},
					toPls: 'Gothic Rock',
					smartShuffle: 'ARTIST'
				}
			},
			{
				name: 'Acoustic Bal Folk',
				folder: 'Genre mixes',
				pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: fourth,
						_LIBRARY_3: fourth,
					},
					query: {
						_LIBRARY_0: queryJoin(
							[
								queryJoin(
									queryCombinations(
										['andro', 'bourree', 'bresse', 'chapelloise', 'circle', 'farelquesh', 'gavotte', 'hanterdro', 'kost ar c\'hoad', 'laride', 'mazurka', 'jig', 'plinn', 'polka', 'rond', 'scottish', 'tarantella', 'tricot', 'vals', 'bal folk', 'traditional european folk'],
										[globTags.genre, globTags.style],
										'OR'
									),
									'OR'
								),
								queryJoin(queryCombinations(['folk'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								globQuery.fav
							],
							'AND'
						),
						_LIBRARY_1: queryJoin(
							[
								queryJoin(
									queryCombinations(
										['andro', 'bourree', 'bresse', 'chapelloise', 'circle', 'farelquesh', 'gavotte', 'hanterdro', 'kost ar c\'hoad', 'laride', 'mazurka', 'jig', 'plinn', 'polka', 'rond', 'scottish', 'tarantella', 'tricot', 'vals', 'bal folk', 'traditional european folk'],
										[globTags.genre, globTags.style],
										'OR'
									),
									'OR'
								),
								queryJoin(queryCombinations(['folk'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								globQuery.ratingGr3
							],
							'AND'
						),
						_LIBRARY_2: queryJoin(
							[
								queryJoin(
									queryCombinations(
										['andro', 'bourree', 'bresse', 'chapelloise', 'circle', 'farelquesh', 'gavotte', 'hanterdro', 'kost ar c\'hoad', 'laride', 'mazurka', 'jig', 'plinn', 'polka', 'rond', 'scottish', 'tarantella', 'tricot', 'vals', 'bal folk', 'traditional european folk'],
										[globTags.genre, globTags.style],
										'OR'
									),
									'OR'
								),
								queryJoin(queryCombinations(['folk'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								queryJoin(queryCombinations(['instrumental'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								globQuery.ratingGr3
							],
							'AND'
						),
						_LIBRARY_3: queryJoin(
							[
								queryJoin(
									queryCombinations(
										['traditional european folk'],
										[globTags.genre, globTags.style],
										'OR'
									),
									'OR'
								),
								queryJoin(queryCombinations(['folk'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								globQuery.ratingGr2
							],
							'AND'
						)
					},
					toPls: 'Acoustic Bal Folk',
					smartShuffle: 'ARTIST'
				}
			},
			{
				name: 'Acoustic for Reading',
				folder: 'Genre mixes',
				pool: {
					fromPls: {
						_LIBRARY_0: fourth,
						_LIBRARY_1: fourth,
						_LIBRARY_2: eighth,
						_LIBRARY_3: eighth,
						_LIBRARY_4: eighth,
						_LIBRARY_5: eighth,
					},
					query: {
						_LIBRARY_0: queryJoin(
							[
								queryJoin(
									queryCombinations(
										['traditional european folk', 'ambient classical', 'ambient folk', 'ambient new age', 'american primitive guitar', 'neo-classical new age', 'new acoustic'],
										[globTags.genre, globTags.style],
										'OR'
									),
									'OR'
								),
								queryJoin(queryCombinations(['folk', 'new age', 'classical', 'acoustic'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								globQuery.fav
							],
							'AND'
						),
						_LIBRARY_1: queryJoin(
							[
								queryJoin(
									queryCombinations(
										['ambient classical', 'neo-classical new age', 'new acoustic'],
										[globTags.genre, globTags.style],
										'OR'
									),
									'OR'
								),
								queryJoin(queryCombinations(['folk', 'new age', 'classical', 'acoustic'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								globQuery.ratingGr3
							],
							'AND'
						),
						_LIBRARY_2: queryJoin(
							[
								queryJoin(
									queryCombinations(
										['british pychedelia', 'americana', 'asian folk', 'hang music', 'healing music', 'appalachian', 'psychedelic folk', 'nubian folk'],
										[globTags.genre, globTags.style],
										'OR'
									),
									'OR'
								),
								queryJoin(queryCombinations(['folk', 'new age', 'classical', 'acoustic', 'ambient'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								globQuery.ratingGr3
							],
							'AND'
						),
						_LIBRARY_3: queryJoin(
							[
								queryJoin(
									queryCombinations(
										['british pychedelia', 'americana', 'asian folk', 'hang music', 'healing music', 'appalachian', 'psychedelic folk'],
										[globTags.genre, globTags.style],
										'OR'
									),
									'OR'
								),
								queryJoin(queryCombinations(['folk', 'new age', 'classical', 'acoustic', 'ambient'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								queryJoin(queryCombinations(['instrumental'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								globQuery.ratingGr3
							],
							'AND'
						),
						_LIBRARY_4: queryJoin(
							[
								queryJoin(
									queryCombinations(
										['folk metal', 'Atmospheric Black Metal'],
										[globTags.genre, globTags.style],
										'OR'
									),
									'OR'
								),
								queryJoin(queryCombinations(['instrumental', 'acoustic', 'folk'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								globQuery.ratingGr3
							],
							'AND'
						),
						_LIBRARY_5: queryJoin(
							[
								queryJoin(
									queryCombinations(
										['celtic new age', 'tuvan', 'tuareg music', 'traditional european folk', 'sephardic', 'pagan folk'],
										[globTags.genre, globTags.style],
										'OR'
									),
									'OR'
								),
								queryJoin(queryCombinations(['world'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								queryJoin(queryCombinations(['instrumental', 'acoustic', 'ambient folk', 'folk'], [globTags.genre, globTags.style], 'OR'), 'OR'),
								globQuery.ratingGr3
							],
							'AND'
						)
					},
					toPls: 'Acoustic for Reading',
					smartShuffle: 'ARTIST'
				}
			}
		].sort((a, b) => a.name.localeCompare(b.name))
	];
}