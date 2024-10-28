'use strict';
//01/10/24

/* exported createPoolPresets */

include('..\\..\\helpers\\helpers_xxx.js');
/* global globTags:readable, globQuery:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _qCond:readable */

function createPoolPresets({size = 50} = {}) {
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
						_LIBRARY_2: globTags.rating + ' EQUAL 5'
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
						_LIBRARY_2: globTags.rating + ' EQUAL 5'
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
						_LIBRARY_2: globTags.rating + ' EQUAL 5'
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
						_LIBRARY_2: globTags.rating + ' EQUAL 5 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#'
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
						_LIBRARY_2: globTags.rating + ' EQUAL 5 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#'
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
						_LIBRARY_2: globTags.rating + ' EQUAL 5 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,10)#'
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
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND %ADDED% DURING LAST 5 WEEKS',
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND %ADDED% DURING LAST 5 WEEKS',
						_LIBRARY_2: globTags.rating + ' EQUAL 5 AND %ADDED% DURING LAST 5 WEEKS'
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
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND (%LAST_PLAYED_ENHANCED% DURING LAST 5 WEEKS OR %LAST_PLAYED% DURING LAST 5 WEEKS)',
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND (%LAST_PLAYED_ENHANCED% DURING LAST 5 WEEKS OR %LAST_PLAYED% DURING LAST 5 WEEKS)',
						_LIBRARY_2: globTags.rating + ' EQUAL 5 AND (%LAST_PLAYED_ENHANCED% DURING LAST 5 WEEKS OR %LAST_PLAYED% DURING LAST 5 WEEKS)'
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
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS)',
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEK OR %LAST_PLAYED% DURING LAST 2 WEEK)',
						_LIBRARY_2: globTags.rating + ' EQUAL 5 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS)'
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
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS) AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#',
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS) AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#',
						_LIBRARY_2: globTags.rating + ' EQUAL 5 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS) AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)#'
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
						_LIBRARY_0: globTags.rating + ' EQUAL 3 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS) AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#',
						_LIBRARY_1: globTags.rating + ' EQUAL 4 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS) AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#',
						_LIBRARY_2: globTags.rating + ' EQUAL 5 AND NOT (%LAST_PLAYED_ENHANCED% DURING LAST 2 WEEKS OR %LAST_PLAYED% DURING LAST 2 WEEKS) AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)#'
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
						_LIBRARY_2: globTags.rating + ' EQUAL 5 SORT ASCENDING BY ' + _qCond(globTags.playCount)
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
						_LIBRARY_2: globTags.rating + ' EQUAL 5 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,1)# SORT ASCENDING BY ' + _qCond(globTags.playCount)
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
						_LIBRARY_2: globTags.rating + ' EQUAL 5 AND ' + _qCond(globTags.date) + ' GREATER #$sub(#YEAR#,5)# SORT ASCENDING BY ' + _qCond(globTags.playCount)
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
						_LIBRARY_2: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND (' + globQuery.ratingTop + ' OR ' + globQuery.loved + ')'
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
						_LIBRARY_1: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND (' + globQuery.ratingTop + ' OR ' + globQuery.loved + ')',
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
						_LIBRARY_2: '((' + globTags.genre + ' IS #' + globTags.genre + '#) OR (' + globTags.style + ' IS #' + globTags.style + '#)) AND (' + globQuery.ratingTop + ' OR ' + globQuery.loved + ') SORT ASCENDING BY ' + _qCond(globTags.playCount)
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
						_LIBRARY_1: globTags.artist + ' IS #' + globTags.artistRaw + '# AND (' + globQuery.ratingTop + ' OR ' + globQuery.loved + ')'
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
						_LIBRARY_1: globTags.artist + ' IS #' + globTags.artistRaw + '# AND (' + globQuery.ratingTop + ' OR ' + globQuery.loved + ') SORT ASCENDING BY ' + _qCond(globTags.playCount)
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
						_LIBRARY_0: '(STYLE IS black metal OR STYLE IS stoner doom OR STYLE IS doom metal OR STYLE IS death metal) AND %RATING% IS 5',
						_LIBRARY_1: 'STYLE IS black metal AND NOT STYLE IS folk metal AND (%RATING% IS 4 OR %RATING% IS 3)',
						_LIBRARY_2: 'STYLE IS stoner doom AND NOT STYLE IS folk metal AND (%RATING% IS 4 OR %RATING% IS 3)',
						_LIBRARY_3: 'STYLE IS doom metal AND NOT STYLE IS folk metal AND (%RATING% IS 4 OR %RATING% IS 3)',
						_LIBRARY_4: 'STYLE IS folk metal AND (STYLE IS black metal OR STYLE IS stoner doom OR STYLE IS doom metal OR STYLE IS death metal) AND %RATING% GREATER 2',
						_LIBRARY_5: '(STYLE IS black metal OR STYLE IS stoner doom OR STYLE IS doom metal OR STYLE IS death metal) AND GENRE IS instrumental AND %RATING% GREATER 2',
						_LIBRARY_6: '(STYLE IS black metal AND STYLE IS ambient metal) OR (STYLE IS atmospheric black metal) OR (STYLE IS death metal AND STYLE IS acoustic) AND %RATING% GREATER 3'
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
						_LIBRARY_0: 'STYLE IS kawaii metal AND %RATING% IS 5',
						_LIBRARY_1: 'STYLE IS j-pop AND (GENRE IS rock OR GENRE IS heavy metal) AND %RATING% GREATER 2',
						_LIBRARY_2: 'STYLE IS kawaii metal AND (%RATING% IS 4 OR %RATING% IS 3)',
						_LIBRARY_3: 'STYLE IS kawaii metal AND GENRE IS instrumental AND %RATING% GREATER 2',
						_LIBRARY_4: 'STYLE IS kawaii metal OR (STYLE IS j-pop AND (GENRE IS rock OR GENRE IS heavy metal)) AND STYLE IS female vocal AND %RATING% GREATER 2'
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
						_LIBRARY_0: '(STYLE IS chill-out downtempo OR STYLE IS trip hop OR STYLE IS deep house) AND %RATING% IS 5',
						_LIBRARY_1: 'STYLE IS trip hop AND (MOOD IS not aggressive AND MOOD IS relaxed) AND (%RATING% IS 4 OR %RATING% IS 3)',
						_LIBRARY_2: '(STYLE IS contemporary r&b OR STYLE IS neo soul) AND (MOOD IS not aggressive AND MOOD IS relaxed) AND (%RATING% IS 4 OR %RATING% IS 3)',
						_LIBRARY_3: 'STYLE IS deep house AND (MOOD IS not aggressive AND MOOD IS relaxed AND BPM LESS 140) AND (%RATING% IS 4 OR %RATING% IS 3)',
						_LIBRARY_4: '(STYLE IS chill-out downtempo OR STYLE IS trip hop OR STYLE IS deep house) AND STYLE IS female vocal AND (MOOD IS not aggressive AND MOOD IS relaxed) AND %RATING% GREATER 2',
						_LIBRARY_5: '(STYLE IS chill-out downtempo OR STYLE IS trip hop OR STYLE IS deep house) AND GENRE IS instrumental AND (MOOD IS not aggressive AND MOOD IS relaxed) AND %RATING% GREATER 2'
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
						_LIBRARY_0: '(STYLE IS trap OR GENRE IS hip-hop) AND (LANGUAGE IS spa OR STYLE IS spanish hip-hop) AND NOT (STYLE IS rap metal) AND %RATING% IS 5',
						_LIBRARY_1: '(STYLE IS trap OR GENRE IS hip-hop) AND (LANGUAGE IS spa OR STYLE IS spanish hip-hop OR STYLE IS latin trap) AND NOT (STYLE IS rap metal) AND (%RATING% IS 4 OR %RATING% IS 3)',
						_LIBRARY_2: 'STYLE IS spanish hip-hop AND NOT (STYLE IS rap metal) AND (%RATING% IS 4 OR %RATING% IS 3)',
						_LIBRARY_3: '(STYLE IS flamenco OR STYLE IS rumba flamenca) AND GENRE IS hip-hop AND %RATING% GREATER 2',
						_LIBRARY_4: '(STYLE IS trap OR GENRE IS hip-hop) AND (LANGUAGE IS spa OR STYLE IS spanish hip-hop OR STYLE IS latin trap) AND NOT (STYLE IS rap metal) AND STYLE IS female vocal AND %RATING% GREATER 2',
						_LIBRARY_5: 'STYLE IS nuevo flamenco AND GENRE IS hip-hop AND DATE GREATER 2000 AND %RATING% GREATER 3',
						_LIBRARY_6: '(STYLE IS flamenco rock OR STYLE IS flamenco OR STYLE IS rumba flamenca) AND (STYLE IS spanish folk OR STYLE IS spanish rock) AND DATE GREATER 2000 AND %RATING% GREATER 3',
						_LIBRARY_7: '(STYLE IS rumba fusion OR STYLE IS rumba) AND STYLE IS spanish rock AND DATE GREATER 2000 AND %RATING% GREATER 3',
						_LIBRARY_8: '(STYLE IS trap OR GENRE IS hip-hop) AND (LANGUAGE IS spa OR STYLE IS spanish hip-hop OR STYLE IS latin trap) AND NOT (STYLE IS rap metal) AND %RATING% IS 5',
					},
					toPls: 'Spanish Urban Music',
					smartShuffle: 'ARTIST'
				}
			},
			{
				name: 'Rock Classics',
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
						_LIBRARY_0: 'STYLE IS classic rock AND GENRE IS rock AND DATE LESS 1990 AND %RATING% IS 5',
						_LIBRARY_1: 'STYLE IS classic rock AND GENRE IS rock AND DATE LESS 1990 AND %RATING% IS 4',
						_LIBRARY_2: 'STYLE IS classic rock AND GENRE IS rock AND DATE LESS 1990 AND %RATING% IS 3',
						_LIBRARY_3: 'STYLE IS classic rock AND GENRE IS folk-rock AND DATE LESS 1990 AND %RATING% GREATER 3',
						_LIBRARY_4: 'STYLE IS classic rock AND STYLE IS female vocal AND DATE LESS 1990 AND %RATING% GREATER 2',
						_LIBRARY_5: 'GENRE IS rock AND NOT STYLE IS 80s rock AND DATE GREATER 1960 AND DATE LESS 1980 AND %RATING% GREATER 3',
						_LIBRARY_6: 'GENRE IS hard rock AND STYLE IS classic rock AND DATE LESS 1990 AND %RATING% GREATER 2',
						_LIBRARY_7: '(STYLE IS beat music OR STYLE IS soft rock OR GENRE IS rock & roll) AND DATE GREATER 1960 AND DATE LESS 1980 AND %RATING% IS 5',
						_LIBRARY_8: 'GENRE IS rock & roll AND DATE GREATER 1960 AND DATE LESS 1980 AND %RATING% IS 5',
					},
					toPls: 'Rock Classics',
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
						_LIBRARY_0: 'STYLE IS acid rock AND GENRE IS psychedelic rock AND DATE GREATER 1960 AND DATE LESS 1971 AND %RATING% IS 5',
						_LIBRARY_1: '(STYLE IS acid rock OR STYLE IS raga rock) AND GENRE IS psychedelic rock AND DATE GREATER 1960 AND DATE LESS 1971 AND %RATING% GREATER 3',
						_LIBRARY_2: 'STYLE IS acid rock AND (GENRE IS rock OR GENRE IS folk-rock) AND DATE GREATER 1960 AND DATE LESS 1971 AND %RATING% GREATER 2',
						_LIBRARY_3: 'STYLE IS british psychedelia AND GENRE IS psychedelic rock AND DATE GREATER 1960 AND DATE LESS 1971 AND %RATING% IS 5',
						_LIBRARY_4: 'STYLE IS british psychedelia AND (GENRE IS rock OR GENRE IS folk-rock OR GENRE IS psychedelic rock) AND DATE GREATER 1960 AND DATE LESS 1971 AND %RATING% GREATER 2',
						_LIBRARY_5: '(STYLE IS krautrock OR STYLE IS space rock OR STYLE IS italian prog. rock OR STYLE IS japanese prog. rock) AND GENRE IS psychedelic rock AND DATE GREATER 1960 AND DATE LESS 1971 AND %RATING% GREATER 3',
						_LIBRARY_6: 'STYLE IS psychedelic folk AND DATE GREATER 1960 AND DATE LESS 1971 AND %RATING% GREATER 2',
						_LIBRARY_7: '(STYLE IS psychedelic pop OR STYLE IS sunshine pop) AND DATE GREATER 1960 AND DATE LESS 1971 AND %RATING% GREATER 3',
						_LIBRARY_8: '(STYLE IS psychedelic soul OR STYLE IS psychedelic funk OR STYLE IS psychedelic blues) AND DATE GREATER 1960 AND DATE LESS 1971 AND %RATING% IS 5',
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
						_LIBRARY_0: 'STYLE IS 80s rock AND GENRE IS rock AND DATE LESS 1992 AND %RATING% IS 5',
						_LIBRARY_1: 'STYLE IS 80s rock AND (GENRE IS rock OR GENRE IS pop) AND DATE LESS 1992 AND %RATING% IS 4',
						_LIBRARY_2: 'STYLE IS 80s rock AND (GENRE IS rock OR GENRE IS pop) AND DATE LESS 1992 AND %RATING% IS 3',
						_LIBRARY_3: 'STYLE IS 80s rock AND (GENRE IS folk-rock OR GENRE IS blues OR GENRE IS alt. rock) AND DATE LESS 1992 AND %RATING% GREATER 3',
						_LIBRARY_4: 'STYLE IS 80s rock OR (GENRE IS rock AND DATE GREATER 1979 AND DATE LESS 1990) AND STYLE IS female vocal AND %RATING% GREATER 2',
						_LIBRARY_5: 'STYLE IS power pop AND DATE GREATER 1979 AND DATE LESS 1990 AND %RATING% GREATER 3',
						_LIBRARY_6: 'STYLE IS new wave AND DATE GREATER 1979 AND DATE LESS 1990 AND %RATING% GREATER 3',
						_LIBRARY_7: '(STYLE IS post-punk OR STYLE IS soft rock OR GENRE IS rock & roll) AND DATE GREATER 1979 AND DATE LESS 1990 AND %RATING% GREATER 3',
						_LIBRARY_8: '(STYLE IS euro-pop OR STYLE IS sophisti-pop OR STYLE IS disco OR STYLE IS smooth soul) AND DATE GREATER 1979 AND DATE LESS 1990 AND %RATING% GREATER 3',
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
						_LIBRARY_0: '(STYLE IS darkwave OR STYLE IS gothic rock OR STYLE IS post-punk) AND %RATING% IS 5',
						_LIBRARY_1: '(STYLE IS darkwave OR STYLE IS gothic rock OR STYLE IS post-punk) AND DATE LESS 2000 AND %RATING% IS 5',
						_LIBRARY_2: '(STYLE IS darkwave OR STYLE IS gothic rock OR STYLE IS post-punk) AND %RATING% GREATER 2',
						_LIBRARY_3: '(STYLE IS darkwave OR STYLE IS gothic rock OR STYLE IS post-punk) AND STYLE IS female vocal AND %RATING% GREATER 2',
						_LIBRARY_4: '(STYLE IS gothic metal) AND %RATING% GREATER 3',
						_LIBRARY_5: '(STYLE IS darksynth OR STYLE IS dark techno) AND %RATING% GREATER 3'
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
						_LIBRARY_0: 'STYLE IS gothic metal AND %RATING% IS 5',
						_LIBRARY_1: 'STYLE IS atmospheric black metal AND %RATING% GREATER 3',
						_LIBRARY_2: 'STYLE IS black metal AND %RATING% IS 5',
						_LIBRARY_3: '(STYLE IS dark techno OR STYLE IS dark ambient) AND GENRE IS heavy metal AND %RATING% GREATER 3',
						_LIBRARY_4: 'STYLE IS doom metal AND GENRE IS heavy metal AND %RATING% GREATER 3',
						_LIBRARY_5: 'STYLE IS doom metal AND GENRE IS heavy metal AND STYLE IS female vocal AND %RATING% GREATER 3',
						_LIBRARY_6: 'STYLE IS doom metal AND (%RATING% IS 5 OR STYLE IS female vocal AND %RATING% IS 4)',
						_LIBRARY_7: '(STYLE IS pagan metal OR STYLE IS sludge metal OR STYLE IS stoner doom OR STYLE IS stoner sludge) AND GENRE IS heavy metal AND %RATING% GREATER 3',
						_LIBRARY_8: 'STYLE IS gothic metal AND STYLE IS female vocal AND %RATING% IS 5'
					},
					toPls: 'Gothic Rock',
					smartShuffle: 'ARTIST'
				}
			}
		]
	];
}